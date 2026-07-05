'use client'

import { CopyButton } from '@/components/CopyButton'
import { explorerContractUrl } from '@/lib/stellar'

interface Props {
  eventId: number
  contractId: string
}

export function EventSharePanel({ eventId, contractId }: Props) {
  const eventUrl = `/event/${eventId}`
  const explorerUrl = explorerContractUrl(contractId)

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="eyebrow">Sharing</span>
          <h2 className="h2" style={{ marginTop: '0.5rem' }}>
            Share event
          </h2>
        </div>
        <span className="tag">Link kit</span>
      </div>
      <p className="muted">
        Copy event link, contract id, or explorer view for users and collaborators.
      </p>
      <div className="row">
        <CopyButton value={eventUrl} label="Copy event link" />
        <CopyButton value={contractId} label="Copy contract id" />
        <CopyButton value={explorerUrl} label="Copy explorer link" />
      </div>
    </div>
  )
}
