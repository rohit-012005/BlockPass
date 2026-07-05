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

  if (!canBuy) {
    return (
      <div className="stack">
        <span className="eyebrow">Tickets</span>
        <h2 className="h2" style={{ marginTop: '0.4rem' }}>
          Tickets unavailable
        </h2>
        <p className="muted">This event is not currently accepting ticket purchases.</p>
        <span className="tag tag-warning">Status code: {status}</span>
      </div>
    )
  }

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
      // bounce user to their ticket page
      router.push(`/me/tickets?just=${result.ticketId}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to buy ticket'
      const decoded = decodeFromMessage(msg)
      setError(decoded)
      void trackEvent('buy_ticket_error', {
        eventId,
        error: decoded,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="eyebrow">Checkout</span>
          <h2 className="h2" style={{ marginTop: '0.5rem' }}>
            Buy a ticket
          </h2>
        </div>
        <span className="tag tag-success">Open</span>
      </div>
      <p className="muted">
        Funds are held in the BlockPass contract and refunded automatically if the organizer
        cancels.
      </p>
      <div className="notice">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">Price</span>
          <span className="mono">{price.toString()} (raw units)</span>
        </div>
      </div>
      {stats.data && (
        <div className="notice">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Remaining</span>
            <span className="mono">
              {Math.max(0, stats.data.capacity - stats.data.sold)} / {stats.data.capacity}
            </span>
          </div>
        </div>
      )}
      {address === organizer && (
        <div className="notice notice-error">You are the organizer. Use the dashboard to test the contract.</div>
      )}
      {address && address !== organizer && (
        <button className="btn btn-primary" onClick={onBuy} disabled={isBusy}>
          {isBusy ? 'Submitting…' : 'Buy ticket'}
        </button>
      )}
      {!address && (
        <button
          className="btn btn-primary"
          onClick={() => {
            void trackEvent('wallet_connect_click', { eventId })
            void connect()
          }}
        >
          Connect wallet to buy
        </button>
      )}
      {error && <div className="notice notice-error">{error}</div>}
      {success && (
        <div className="notice notice-success">
          Ticket #{success.ticketId} purchased. Tx: <span className="mono">{success.hash}</span>
        </div>
      )}
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
