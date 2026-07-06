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
    <div className="flex flex-wrap gap-2">
      {isOwner && isSold && !refundCutoffPassed && (
        <button className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[rgba(32,28,23,0.82)] bg-[rgba(255,250,242,0.94)] px-4 py-3 font-semibold text-[rgba(25,21,18,1)] transition hover:-translate-y-px" disabled={busy} onClick={onRefund}>
          Self-refund
        </button>
      )}
      {isOrganizer && isSold && (
        <button className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[rgba(32,28,23,0.82)] bg-[linear-gradient(135deg,#bce97a,#9dd555)] px-4 py-3 font-semibold text-[#171412] shadow-[4px_4px_0_rgba(34,28,21,0.14)] transition hover:-translate-y-px" disabled={busy} onClick={onCheckIn}>
          Check in
        </button>
      )}
      {error && <span className="inline-flex min-h-8 items-center rounded-full border-2 border-[rgba(255,124,124,0.35)] bg-[rgba(255,251,244,0.96)] px-3 py-1 text-[0.72rem] uppercase tracking-[0.14em] text-[#b2433e]">{error}</span>}
    </div>
  )
}
