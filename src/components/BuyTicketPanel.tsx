'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { useEventStats } from '@/hooks/useEvent'
import { buyTicket } from '@/lib/contract'
import { CONTRACT_ERRORS } from '@/types'
import { trackEvent } from '@/lib/telemetry'

interface Props {
  eventId: number
  organizer: string
  status: number
  canBuy: boolean
  price: bigint
}

export function BuyTicketPanel({ eventId, organizer, status, canBuy, price }: Props) {
  const { address, signTransaction, connect } = useWallet()
  const router = useRouter()
  const stats = useEventStats(eventId)
  const [isBusy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ hash: string; ticketId: number } | null>(null)

  const onBuy = async () => {
    if (!address) {
      await connect()
      return
    }

    setBusy(true)
    setError(null)
    try {
      const result = await buyTicket(eventId, address, signTransaction)
      setSuccess(result)
      void trackEvent('buy_ticket_success', {
        eventId,
        ticketId: result.ticketId,
      })
      router.push(`/me/tickets?just=${result.ticketId}`)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to buy ticket'
      const decoded = decodeFromMessage(message)
      setError(decoded)
      void trackEvent('buy_ticket_error', {
        eventId,
        error: decoded,
      })
    } finally {
      setBusy(false)
    }
  }

  if (!canBuy) {
    return (
      <div className="space-y-4">
        <p className="m-0 text-sm text-[var(--text-dim)]">
          This event is not currently accepting ticket purchases.
        </p>
        <span className="chip bg-[rgba(239,190,116,0.18)]">Status code: {status}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm leading-7 text-[var(--text-dim)]">
        Funds are held in the BlockPass contract and refunded automatically if the organizer
        cancels.
      </p>

      <div className="grid gap-3">
        <InfoRow label="Price" value={`${price.toString()} (raw units)`} />
        {stats.data && (
          <InfoRow
            label="Remaining"
            value={`${Math.max(0, stats.data.capacity - stats.data.sold)} / ${stats.data.capacity}`}
          />
        )}
      </div>

      {address === organizer && (
        <div className="rounded-[24px] border border-[rgba(239,190,116,0.22)] bg-[rgba(239,190,116,0.1)] p-4 text-sm text-[var(--text)]">
          You are the organizer. Use the dashboard to test the contract.
        </div>
      )}

      {address && address !== organizer && (
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onBuy}
          disabled={isBusy}
        >
          {isBusy ? 'Submitting…' : 'Buy ticket'}
        </button>
      )}

      {!address && (
        <button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
          onClick={() => {
            void trackEvent('wallet_connect_click', { eventId })
            void connect()
          }}
        >
          Connect wallet to buy
        </button>
      )}

      {error && (
        <div className="rounded-[24px] border border-[rgba(220,72,72,0.24)] bg-[rgba(255,240,240,0.92)] p-4 text-sm text-[#b94a4a]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm text-[var(--text)]">
          Ticket #{success.ticketId} purchased. Tx: <span className="font-mono break-all">{success.hash}</span>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3">
      <span className="text-sm text-[var(--text-dim)]">{label}</span>
      <span className="font-mono text-sm text-right">{value}</span>
    </div>
  )
}

function decodeFromMessage(message: string): string {
  for (const code of Object.keys(CONTRACT_ERRORS)) {
    const entry = CONTRACT_ERRORS[Number(code)]
    if (entry && message.includes(entry.name)) {
      return `${entry.message} (${entry.name})`
    }
  }
  return message
}
