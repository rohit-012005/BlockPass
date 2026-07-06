'use client'

import { useEffect, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { explorerContractUrl } from '@/lib/stellar'

interface Props {
  eventId: number
  contractId: string
}

export function EventSharePanel({ eventId, contractId }: Props) {
  const [origin, setOrigin] = useState('')
  const eventUrl = origin ? `${origin}/event/${eventId}` : ''
  const explorerUrl = explorerContractUrl(contractId)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm leading-7 text-[var(--text-dim)]">
        Copy event link, contract id, or explorer view for users and collaborators.
      </p>
      <div className="flex flex-wrap gap-3">
        <CopyButton
          value={eventUrl}
          label={origin ? 'Copy event link' : 'Loading link…'}
          disabled={!origin}
        />
        <CopyButton value={contractId} label="Copy contract id" />
        <CopyButton value={explorerUrl} label="Copy explorer link" />
      </div>
    </div>
  )
}
