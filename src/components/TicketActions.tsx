'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { refundTicket, checkIn } from '@/lib/contract'
import type { TicketRecord } from '@/types'
import { TICKET_STATE } from '@/types'

interface Props {
  ticket: TicketRecord
  isOrganizer: boolean
  refundCutoffPassed: boolean
}

export function TicketActions({ ticket, isOrganizer, refundCutoffPassed }: Props) {
  const { address, signTransaction } = useWallet()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!address) return null

  const isOwner = address === ticket.buyer
  const isSold = ticket.state === TICKET_STATE.SOLD

  const onRefund = async () => {
    if (!confirm('Refund this ticket? This is irreversible.')) return
    setBusy(true)
    setError(null)
    try {
      await refundTicket(ticket.id, address, signTransaction)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refund')
    } finally {
      setBusy(false)
    }
  }

  const onCheckIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await checkIn(ticket.id, address, signTransaction)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to check in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="row" style={{ gap: '0.5rem' }}>
      {isOwner && isSold && !refundCutoffPassed && (
        <button className="btn btn-ghost" disabled={busy} onClick={onRefund}>
          Self-refund
        </button>
      )}
      {isOrganizer && isSold && (
        <button className="btn btn-primary" disabled={busy} onClick={onCheckIn}>
          Check in
        </button>
      )}
      {error && <span className="tag tag-danger">{error}</span>}
    </div>
  )
}
