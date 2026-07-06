/**
 * Stellar network configuration and helpers.
 *
 * The defaults target Stellar Testnet. Override via the
 * `NEXT_PUBLIC_STELLAR_*` env vars at build time.
 */

export interface StellarNetwork {
  rpcUrl: string
  horizonUrl: string
  networkPassphrase: string
  explorerUrl: string
}

export interface StellarConfig extends StellarNetwork {
  contractId: string
}

declare global {
  interface Window {
    __BLOCKPASS_STELLAR_CONFIG__?: Partial<StellarConfig>
  }
}

export const STELLAR_TESTNET: StellarNetwork = {
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/testnet',
}

export const STELLAR_PUBLIC: StellarNetwork = {
  rpcUrl: 'https://soroban-mainnet.stellar.org',
  horizonUrl: 'https://horizon-mainnet.stellar.org',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
  explorerUrl: 'https://stellar.expert/explorer/public',
}

function readEnv(key: string, fallback: string): string {
  const value = process.env[key]
  if (value && value.length > 0) return value
  return fallback
}

function readBrowserConfig(): Partial<StellarConfig> {
  if (typeof window === 'undefined') return {}
  return window.__BLOCKPASS_STELLAR_CONFIG__ ?? {}
}

function readRuntimeConfig(): StellarConfig {
  const browser = readBrowserConfig()
  return {
    rpcUrl:
      browser.rpcUrl ?? readEnv('NEXT_PUBLIC_STELLAR_RPC_URL', STELLAR_TESTNET.rpcUrl),
    horizonUrl:
      browser.horizonUrl ?? readEnv('NEXT_PUBLIC_STELLAR_HORIZON_URL', STELLAR_TESTNET.horizonUrl),
    networkPassphrase:
      browser.networkPassphrase ??
      readEnv('NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE', STELLAR_TESTNET.networkPassphrase),
    explorerUrl:
      browser.explorerUrl ?? readEnv('NEXT_PUBLIC_STELLAR_EXPLORER_URL', STELLAR_TESTNET.explorerUrl),
    contractId:
      browser.contractId ?? process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? '',
  }
}

const STELLAR_CONFIG = readRuntimeConfig()

export const NETWORK: StellarNetwork = {
  rpcUrl: STELLAR_CONFIG.rpcUrl,
  horizonUrl: STELLAR_CONFIG.horizonUrl,
  networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  explorerUrl: STELLAR_CONFIG.explorerUrl,
}

export function isTestnet(): boolean {
  return NETWORK.networkPassphrase === STELLAR_TESTNET.networkPassphrase
}

export const CONTRACT_ID: string = STELLAR_CONFIG.contractId

export const NATIVE_XLM_ASSET_ID: string = isTestnet()
  ? 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
  : 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA'

export function explorerAccountUrl(address: string): string {
  return `${NETWORK.explorerUrl}/account/${address}`
}

export function explorerTxUrl(hash: string): string {
  return `${NETWORK.explorerUrl}/tx/${hash}`
}

export function explorerContractUrl(contractId: string): string {
  return `${NETWORK.explorerUrl}/contract/${contractId}`
}

export function shortAddress(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}

export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address)
}

export function isValidStellarContractId(id: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(id)
}
