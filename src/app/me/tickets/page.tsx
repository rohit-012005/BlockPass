'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useBuyerTickets } from '@/hooks/useEvent'
import { getEvent } from '@/lib/contract'
import type { EventRecord, TicketRecord } from '@/types'
import { TICKET_STATE } from '@/types'
import { formatTokenAmount, formatUnixDateTime, ticketStateLabel, eventStatusLabel } from '@/lib/format'
import { CONTRACT_ID } from '@/lib/stellar'
import { CopyButton } from '@/components/CopyButton'

function MyTicketsInner() {
  const { address, connect } = useWallet()
  const tickets = useBuyerTickets(address)
  const [events, setEvents] = useState<Record<number, EventRecord | null>>({})
  const [qrUrl, setQrUrl] = useState<Record<number, string>>({})
  const searchParams = useSearchParams()
  const justId = searchParams?.get('just')

  useEffect(() => {
    if (!tickets.data) return
    let cancelled = false
    void (async () => {
      const eventIds = Array.from(new Set(tickets.data!.map((t) => t.event_id)))
      const next: Record<number, EventRecord | null> = {}
      for (const eid of eventIds) {
        if (cancelled) return
        try {
          const ev = await getEvent(eid)
          next[eid] = ev
        } catch {
          next[eid] = null
        }
      }
      if (!cancelled) setEvents(next)
    })()
    return () => {
      cancelled = true
    }
  }, [tickets.data])

  useEffect(() => {
    if (!tickets.data) return
    void (async () => {
      const next: Record<number, string> = {}
      for (const t of tickets.data!) {
        try {
          const res = await fetch(`/api/checkin/token?ticket_id=${t.id}&event_id=${t.event_id}`)
          if (res.ok) {
            const data = (await res.json()) as { qrPayload: string }
            next[t.id] = data.qrPayload
          }
        } catch {
          // ignore
        }
      }
      setQrUrl(next)
    })()
  }, [tickets.data])

  if (!address) {
    return (
      <div className="card stack">
        <h1 className="h1">My tickets</h1>
        <p className="muted">Connect a wallet to see the tickets you own.</p>
        <button className="btn btn-primary" onClick={connect} style={{ alignSelf: 'flex-start' }}>
          Connect wallet
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <h1 className="h1">My tickets</h1>
      {justId && <div className="notice notice-success">You just bought ticket #{justId}.</div>}
      {!CONTRACT_ID && (
        <div className="notice notice-error">
          No contract id is configured. Set <span className="kbd">NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID</span>.
        </div>
      )}
      {tickets.isLoading && <p className="muted">Loading…</p>}
      {tickets.error && <div className="notice notice-error">{tickets.error}</div>}
      {tickets.data && tickets.data.length === 0 && (
        <div className="card stack">
          <h2 className="h2">Nothing yet</h2>
          <p className="muted">You don&apos;t own any tickets. Find an event to attend:</p>
          <Link href="/" className="btn btn-ghost" style={{ alignSelf: 'flex-start' }}>
            Browse events
          </Link>
        </div>
      )}
      {tickets.data && tickets.data.length > 0 && (
        <div className="grid-2">
          {tickets.data.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              event={events[t.event_id] ?? null}
              qrPayload={qrUrl[t.id]}
              justBought={t.id.toString() === justId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TicketCard({
  ticket,
  event,
  qrPayload,
  justBought,
}: {
  ticket: TicketRecord
  event: EventRecord | null
  qrPayload?: string
  justBought: boolean
}) {
  const [showQr, setShowQr] = useState(Boolean(justBought))
  const qrSrc = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`
    : null
  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span
          className={`tag ${
            ticket.state === TICKET_STATE.SOLD
              ? 'tag-success'
              : ticket.state === TICKET_STATE.CHECKED_IN
                ? 'tag-accent'
                : 'tag-warning'
          }`}
        >
          {ticketStateLabel(ticket.state)}
        </span>
        <span className="muted mono">#{ticket.id}</span>
      </div>
      {event ? (
        <>
          <h3 className="h3">{event.title}</h3>
          <p className="muted" style={{ margin: 0 }}>
            {event.venue} · {formatUnixDateTime(event.starts_at)}
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Price paid: {formatTokenAmount(ticket.price, 7)} XLM · status: {eventStatusLabel(event.status)}
          </p>
          <Link href={`/event/${event.id}`} className="muted">
            View event →
          </Link>
        </>
      ) : (
        <p className="muted">Event details unavailable.</p>
      )}
      {ticket.state === TICKET_STATE.SOLD && qrSrc && (
        <div className="stack">
          <button className="btn btn-ghost" onClick={() => setShowQr((s) => !s)}>
            {showQr ? 'Hide QR' : 'Show QR'}
          </button>
          {showQr && (
            <div className="card card-elev-2" style={{ textAlign: 'center' }}>
              <img
                src={qrSrc}
                alt={`QR for ticket ${ticket.id}`}
                width={240}
                height={240}
                style={{ borderRadius: 8 }}
              />
              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Show this code at the door. The organizer scans it with the check-in tool.
              </p>
              <div className="row" style={{ justifyContent: 'center' }}>
                <CopyButton value={qrPayload ?? ''} label="Copy QR token" />
                <a className="btn btn-ghost" href={qrSrc} target="_blank" rel="noreferrer noopener">
                  Open QR image
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <MyTicketsInner />
    </Suspense>
  )
}
