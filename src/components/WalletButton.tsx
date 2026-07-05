'use client'

import { useWallet } from '@/hooks/useWallet'
import { shortAddress } from '@/lib/stellar'
import { CopyButton } from '@/components/CopyButton'

export function WalletButton() {
  const { address, isConnecting, connect, disconnect, isAvailable, error } = useWallet()

  if (!isAvailable) {
    return (
      <button className="btn btn-ghost" disabled>
        Wallet unavailable
      </button>
    )
  }

  if (address) {
    return (
      <div className="row">
        <span className="tag" title={address}>
          {shortAddress(address, 6, 4)}
        </span>
        <CopyButton value={address} label="Copy address" />
        <button className="btn btn-ghost" onClick={disconnect}>
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="row">
      <button className="btn btn-primary" onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting…' : 'Connect wallet'}
      </button>
      {error && <span className="tag tag-danger">{error}</span>}
    </div>
  )
}
