'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { CheckInScanner } from '@/components/CheckInScanner'
import { checkIn } from '@/lib/contract'
import { serverGetEvent } from '@/lib/server-contract'

interface Props {
  params: Promise<{ eventId: string }>
}

export default function ScanPage({ params: _params }: Props) {
  const router = useRouter()
  const { address, signTransaction, connect } = useWallet()
  const [eventId, setEventId] = useState<number | null>(null)
  const [organizer, setOrganizer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // resolve eventId from dynamic route at mount
  void (async () => {
    try {
      const { eventId: eid } = await _params
      const id = Number(eid)
      if (Number.isFinite(id) && id > 0) {
        setEventId(id)
        const ev = await serverGetEvent(id)
        if (ev) setOrganizer(ev.organizer)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load event')
    }
  })()

  const onCheckIn = useCallback(
    async (ticketId: number) => {
      if (!address) {
        await connect()
        throw new Error('Connect wallet first')
      }
      await checkIn(ticketId, address, signTransaction)
      router.refresh()
    },
    [address, connect, signTransaction, router],
  )

  if (error) {
    return <div className="notice notice-error">{error}</div>
  }
  if (eventId == null) {
    return <p className="muted">Loading event…</p>
  }
  if (organizer && address && organizer !== address) {
    return (
      <div className="notice notice-error">
        This wallet is not the organizer of event #{eventId}. Switch to the organizer&apos;s wallet.
      </div>
    )
  }
  return <CheckInScanner eventId={eventId} organizer={organizer ?? ''} onCheckIn={onCheckIn} />
}
