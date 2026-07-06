'use client'

/**
 * useWallet — a minimal wrapper around StellarWalletsKit.
 *
 * The kit supports Freighter, xBull, Lobstr, Albedo, Rabet, and others.
 * We expose the connected address, the connect/disconnect actions,
 * and a `signTransaction` helper that takes a base64 XDR and returns
 * the signed base64 XDR.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StellarWalletsKit, ModuleInterface } from '@creit.tech/stellar-wallets-kit'
import { NETWORK } from '@/lib/stellar'
import { trackEvent } from '@/lib/telemetry'

type WalletKitModule = typeof import('@creit.tech/stellar-wallets-kit')

let kitSingleton: Promise<StellarWalletsKit> | null = null
let walletKitModulePromise: Promise<WalletKitModule> | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function installWalletWarnFilter() {
  if (!isBrowser()) return
  const globalKey = '__blockpass_wallet_warn_filter__'
  if ((window as typeof window & { [globalKey]?: boolean })[globalKey]) return

  const originalWarn = console.warn.bind(console)
  console.warn = (...args: unknown[]) => {
    const text = args
      .map((arg) => (typeof arg === 'string' ? arg : String(arg)))
      .join(' ')

    if (
      text.includes('CustomElementRegistry') ||
      text.includes('Lit is in dev mode') ||
      text.includes('Multiple versions of Lit loaded')
    ) {
      return
    }

    originalWarn(...args)
  }

  ;(window as typeof window & { [globalKey]?: boolean })[globalKey] = true
}

function loadWalletKitModule(): Promise<WalletKitModule> {
  if (!walletKitModulePromise) {
    installWalletWarnFilter()
    walletKitModulePromise = import('@creit.tech/stellar-wallets-kit')
  }
  return walletKitModulePromise
}

async function kit(): Promise<StellarWalletsKit> {
  if (!kitSingleton) {
    kitSingleton = loadWalletKitModule().then((mod) => {
      const filterFn: ((m: ModuleInterface) => boolean) | undefined = isBrowser()
        ? undefined
        : (m) => m.productId?.toLowerCase?.() === mod.FREIGHTER_ID.toLowerCase()
      const opts = filterFn ? { filterBy: filterFn } : undefined
      const network = NETWORK.networkPassphrase.includes('Test')
        ? mod.WalletNetwork.TESTNET
        : mod.WalletNetwork.PUBLIC
      return new mod.StellarWalletsKit({
        modules: mod.allowAllModules(opts),
        network,
        selectedWalletId: mod.FREIGHTER_ID,
      })
    })
  }
  return kitSingleton
}

export interface UseWalletState {
  address: string | null
  walletId: string | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  signTransaction: (xdrBase64: string) => Promise<string>
  isAvailable: boolean
}

export function useWallet(): UseWalletState {
  const [address, setAddress] = useState<string | null>(null)
  const [walletId, setWalletId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const syncFromStorage = useCallback(() => {
    if (!isBrowser()) return
    try {
      setAddress(window.localStorage.getItem('blockpass:wallet-address'))
      setWalletId(window.localStorage.getItem('blockpass:wallet-id'))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isBrowser()) return
    setMounted(true)
    syncFromStorage()

    const onStorage = (event: StorageEvent) => {
      if (event.key && !event.key.startsWith('blockpass:wallet')) return
      syncFromStorage()
    }
    const onFocus = () => syncFromStorage()
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncFromStorage()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [syncFromStorage])

  const persist = useCallback((addr: string | null, wid: string | null) => {
    if (!isBrowser()) return
    try {
      if (addr && wid) {
        window.localStorage.setItem('blockpass:wallet-address', addr)
        window.localStorage.setItem('blockpass:wallet-id', wid)
      } else {
        window.localStorage.removeItem('blockpass:wallet-address')
        window.localStorage.removeItem('blockpass:wallet-id')
      }
    } catch {
      // ignore
    }
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setError(null)
    try {
      const walletKit = await kit()
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          try {
            walletKit.setWallet(option.id)
            const { address: addr } = await walletKit.getAddress()
            setAddress(addr)
            setWalletId(option.id)
            persist(addr, option.id)
            void trackEvent('wallet_connected', { walletId: option.id })
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to connect wallet')
            void trackEvent('wallet_connect_error', {
              walletId: option.id,
              error: e instanceof Error ? e.message : 'Failed to connect wallet',
            })
          }
        },
        onClosed: () => setIsConnecting(false),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open wallet selector')
    } finally {
      setIsConnecting(false)
    }
  }, [persist])

  const disconnect = useCallback(() => {
    setAddress(null)
    setWalletId(null)
    persist(null, null)
    void trackEvent('wallet_disconnected')
  }, [persist])

  const signTransaction = useCallback(
    async (xdrBase64: string) => {
      if (!address) throw new Error('Connect a wallet first')
      const walletKit = await kit()
      const { signedTxXdr } = await walletKit.signTransaction(xdrBase64, {
        networkPassphrase: NETWORK.networkPassphrase,
        address,
      })
      return signedTxXdr
    },
    [address],
  )

  return useMemo(
    () => ({
      address,
      walletId,
      isConnecting,
      error,
      connect,
      disconnect,
      signTransaction,
      isAvailable: mounted && isBrowser(),
    }),
    [address, walletId, isConnecting, error, connect, disconnect, signTransaction, mounted],
  )
}
