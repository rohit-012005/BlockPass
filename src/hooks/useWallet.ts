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
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from '@creit.tech/stellar-wallets-kit'
import type { ModuleInterface } from '@creit.tech/stellar-wallets-kit'
import { NETWORK } from '@/lib/stellar'

let kitSingleton: StellarWalletsKit | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function buildKit(): StellarWalletsKit {
  const filterFn: ((m: ModuleInterface) => boolean) | undefined = isBrowser()
    ? undefined
    : (m) => m.productId?.toLowerCase?.() === FREIGHTER_ID.toLowerCase()
  const opts = filterFn ? { filterBy: filterFn } : undefined
  const network = NETWORK.networkPassphrase.includes('Test')
    ? WalletNetwork.TESTNET
    : WalletNetwork.PUBLIC
  return new StellarWalletsKit({
    modules: allowAllModules(opts),
    network,
    selectedWalletId: FREIGHTER_ID,
  })
}

function kit(): StellarWalletsKit {
  if (!kitSingleton) {
    kitSingleton = buildKit()
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

  useEffect(() => {
    if (!isBrowser()) return
    try {
      const stored = window.localStorage.getItem('blockpass:wallet-address')
      if (stored) setAddress(stored)
      const wid = window.localStorage.getItem('blockpass:wallet-id')
      if (wid) setWalletId(wid)
    } catch {
      // ignore
    }
  }, [])

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
      await kit().openModal({
        onWalletSelected: async (option) => {
          try {
            kit().setWallet(option.id)
            const { address: addr } = await kit().getAddress()
            setAddress(addr)
            setWalletId(option.id)
            persist(addr, option.id)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to connect wallet')
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
  }, [persist])

  const signTransaction = useCallback(
    async (xdrBase64: string) => {
      if (!address) throw new Error('Connect a wallet first')
      const { signedTxXdr } = await kit().signTransaction(xdrBase64, {
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
      isAvailable: isBrowser(),
    }),
    [address, walletId, isConnecting, error, connect, disconnect, signTransaction],
  )
}
