'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
      const eventIds = Array.from(new Set(tickets.data!.map((ticket) => ticket.event_id)))
      const next: Record<number, EventRecord | null> = {}
      for (const eventId of eventIds) {
        if (cancelled) return
        try {
          next[eventId] = await getEvent(eventId)
        } catch {
          next[eventId] = null
        }
      }
      if (!cancelled) setEvents(next)
    })()

    return () => {
      cancelled = true
    }
  }, [tickets.data])

  useEffect(() => {
    if (!tickets.data) {
      setQrUrl({})
      return
    }

    const activeTickets = tickets.data.filter((ticket) => ticket.state === TICKET_STATE.SOLD)
    void (async () => {
      const next: Record<number, string> = {}
      for (const ticket of activeTickets) {
        try {
          const res = await fetch(`/api/checkin/token?ticket_id=${ticket.id}&event_id=${ticket.event_id}`)
          if (res.ok) {
            const data = (await res.json()) as { qrPayload: string }
            next[ticket.id] = data.qrPayload
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
      <section className="surface surface-strong px-6 py-8 md:px-8 md:py-10">
        <div className="space-y-5">
          <span className="eyebrow">Buyer dashboard</span>
          <h1 className="section-title max-w-[10ch]">Your tickets live here.</h1>
          <p className="section-copy">
            Connect a wallet to see what you bought, open QR codes, and manage refunds.
          </p>
          <button
            className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
            onClick={connect}
          >
            Connect wallet
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow">My tickets</span>
            <h1 className="section-title max-w-[12ch]">Everything you own in one view.</h1>
            <p className="section-copy">
              Keep QR codes, event details, and refund-ready states visible without jumping across
              pages.
            </p>
            {justId && (
              <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm">
                You just bought ticket #{justId}.
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Tickets" value={String(tickets.data?.length ?? 0)} />
            <StatCard label="Active" value={String(tickets.data?.filter((ticket) => ticket.state === TICKET_STATE.SOLD).length ?? 0)} />
            <StatCard label="Checked in" value={String(tickets.data?.filter((ticket) => ticket.state === TICKET_STATE.CHECKED_IN).length ?? 0)} />
          </div>
        </div>
      </section>

      {!CONTRACT_ID && (
        <div className="surface px-5 py-4 text-sm text-[#b94a4a]">
          No contract id is configured. Set <span className="font-mono">NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID</span>.
        </div>
      )}

      {tickets.isLoading && <p className="text-sm text-[var(--text-dim)]">Loading…</p>}
      {tickets.error && <div className="surface px-5 py-4 text-sm text-[#b94a4a]">{tickets.error}</div>}

      {tickets.data && tickets.data.length === 0 && (
        <section className="surface p-6 md:p-7">
          <span className="eyebrow">Empty state</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
            Nothing yet
          </h2>
          <p className="section-copy mt-3">
            You don&apos;t own any tickets. Find an event to attend.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-12 w-fit items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
          >
            Browse events
          </Link>
        </section>
      )}

      {tickets.data && tickets.data.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {tickets.data.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              event={events[ticket.event_id] ?? null}
              qrPayload={qrUrl[ticket.id]}
              justBought={ticket.id.toString() === justId}
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
    <article className="surface surface-strong p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`chip ${
            ticket.state === TICKET_STATE.SOLD
              ? 'bg-[rgba(145,216,79,0.14)]'
              : ticket.state === TICKET_STATE.CHECKED_IN
                ? 'bg-[rgba(237,197,213,0.7)]'
                : 'bg-[rgba(239,190,116,0.18)]'
          }`}
        >
          {ticketStateLabel(ticket.state)}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
          #{ticket.id}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {event ? (
          <>
            <h3 className="font-display text-[1.85rem] leading-none tracking-[-0.04em]">
              {event.title}
            </h3>
            <p className="m-0 text-sm text-[var(--text-dim)]">
              {event.venue} · {formatUnixDateTime(event.starts_at)}
            </p>
            <p className="m-0 text-sm text-[var(--text-dim)]">
              Price paid: {formatTokenAmount(ticket.price, 7)} XLM · status:{' '}
              {eventStatusLabel(event.status)}
            </p>
            <Link href={`/event/${event.id}`} className="inline-flex text-sm font-medium underline underline-offset-4">
              View event
            </Link>
          </>
        ) : (
          <p className="m-0 text-sm text-[var(--text-dim)]">Event details unavailable.</p>
        )}
      </div>

      {ticket.state === TICKET_STATE.SOLD && qrSrc && (
        <div className="mt-5 space-y-4">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px"
            onClick={() => setShowQr((value) => !value)}
          >
            {showQr ? 'Hide QR' : 'Show QR'}
          </button>

          {showQr && (
            <div className="surface bg-[rgba(255,252,247,0.96)] p-4 text-center">
              <img
                src={qrSrc}
                alt={`QR for ticket ${ticket.id}`}
                width={240}
                height={240}
                className="mx-auto rounded-[18px]"
              />
              <p className="mt-3 text-sm text-[var(--text-dim)]">
                Show this code at the door. The organizer scans it with the check-in tool.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <CopyButton value={qrPayload ?? ''} label="Copy QR token" />
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-white/90 px-4 py-3 font-semibold transition hover:-translate-y-px"
                  href={qrSrc}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Open QR image
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface bg-[rgba(255,252,247,0.92)] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-2 font-display text-[1.2rem] leading-none tracking-[-0.03em]">{value}</div>
    </div>
  )
}

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-dim)]">Loading…</p>}>
      <MyTicketsInner />
    </Suspense>
  )
}
