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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="chip">Sharing</span>
          <h3 className="mt-3 font-display text-[1.8rem] leading-none tracking-[-0.04em]">
            Share event
          </h3>
        </div>
        <span className="chip">Link kit</span>
      </div>
      <p className="m-0 text-sm leading-7 text-[var(--text-dim)]">
        Copy event link, contract id, or explorer view for users and collaborators.
      </p>
      <div className="flex flex-wrap gap-3">
        <CopyButton value={eventUrl} label="Copy event link" />
        <CopyButton value={contractId} label="Copy contract id" />
        <CopyButton value={explorerUrl} label="Copy explorer link" />
      </div>
    </div>
  )
}
