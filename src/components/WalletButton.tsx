'use client'

import { CopyButton } from '@/components/CopyButton'
import { useWallet } from '@/hooks/useWallet'
import { shortAddress } from '@/lib/stellar'

export function WalletButton() {
  const { address, isConnecting, connect, disconnect, isAvailable, error } = useWallet()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isAvailable && (
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold text-[var(--text-dim)] opacity-70"
          disabled
        >
          Wallet unavailable
        </button>
      )}

      {isAvailable && address && (
        <>
          <span
            className="chip bg-[rgba(255,252,247,0.92)] normal-case tracking-[0.08em]"
            title={address}
          >
            {shortAddress(address, 6, 4)}
          </span>
          <CopyButton value={address} label="Copy address" />
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
            onClick={disconnect}
          >
            Disconnect
          </button>
        </>
      )}

      {isAvailable && !address && (
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting…' : 'Connect wallet'}
        </button>
      )}

      {error && <span className="chip bg-[rgba(255,228,228,0.8)] text-[#b94a4a]">{error}</span>}
    </div>
  )
}
