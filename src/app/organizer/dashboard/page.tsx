'use client'

import Link from 'next/link'
import { useWallet } from '@/hooks/useWallet'
import { useOrganizerEvents } from '@/hooks/useEvent'
import { formatUnixDateTime, eventStatusLabel, formatTokenAmount } from '@/lib/format'
import type { EventStatusCode } from '@/types'
import { EVENT_STATUS } from '@/types'

export default function OrganizerDashboard() {
  const { address, connect } = useWallet()
  const events = useOrganizerEvents(address)

  if (!address) {
    return (
      <div className="hero stack">
        <span className="eyebrow">Organizer dashboard</span>
        <h1 className="h1">Connect the wallet that owns your events.</h1>
        <p className="lead">
          This dashboard keeps event health, check-in, and action controls in one place so the
          organizer flow stays fast.
        </p>
        <button className="btn btn-primary" onClick={connect} style={{ alignSelf: 'flex-start' }}>
          Connect wallet
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy stack">
            <span className="eyebrow">Organizer dashboard</span>
            <h1 className="h1">Command center for live events.</h1>
            <p className="lead">
              See ticket flow, open check-in, and jump into the right event without hunting through
              menus.
            </p>
            <div className="row">
              <Link href="/create" className="btn btn-primary">
                + New event
              </Link>
              {events.data && events.data.length > 0 && (
                <Link href={`/scan/${events.data[0]?.id ?? ''}`} className="btn btn-ghost">
                  Open check-in
                </Link>
              )}
            </div>
          </div>

          <div className="surface feature-card stack floating">
            <span className="tag tag-accent">Wallet connected</span>
            <div className="divider" />
            <div className="grid-2">
              <MiniStat label="Events" value={String(events.data?.length ?? 0)} />
              <MiniStat label="Live" value={String(events.data?.filter(({ event }) => event.status === EVENT_STATUS.ON_SALE).length ?? 0)} />
              <MiniStat label="Sold out" value={String(events.data?.filter(({ event }) => event.status === EVENT_STATUS.SOLD_OUT).length ?? 0)} />
              <MiniStat label="Tickets sold" value={String(events.data?.reduce((sum, { event }) => sum + event.sold, 0) ?? 0)} />
            </div>
          </div>
        </div>
      </section>

      {events.isLoading && <p className="muted">Loading…</p>}
      {events.error && <div className="notice notice-error">{events.error}</div>}
      {events.data && events.data.length === 0 && (
        <div className="surface stack">
          <span className="eyebrow">Empty state</span>
          <h2 className="h2" style={{ marginTop: '0.5rem' }}>
            No events yet
          </h2>
          <p className="muted">Start with one event, then reuse the dashboard for future launches.</p>
          <Link href="/create" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Create your first event
          </Link>
        </div>
      )}
      {events.data && events.data.length > 0 && (
        <div className="grid-2">
          {events.data.map(({ id, event }) => (
            <Link
              href={`/event/${id}`}
              key={id}
              className="surface stack"
              style={{ display: 'block', color: 'inherit' }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className={statusTag(event.status)}>{eventStatusLabel(event.status)}</span>
                <span className="muted mono">#{id}</span>
              </div>
              <h3 className="h3" style={{ marginTop: '0.5rem' }}>
                {event.title}
              </h3>
              <p className="muted" style={{ margin: 0 }}>
                {event.venue} · {formatUnixDateTime(event.starts_at)}
              </p>
              <div className="row" style={{ justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span className="muted">
                  {event.sold} / {event.capacity} sold
                </span>
                <span className="mono">{formatTokenAmount(event.price, 7)} XLM</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div className="stat-label">{label}</div>
      <div className="mono" style={{ marginTop: '0.35rem', fontSize: '1.1rem' }}>
        {value}
      </div>
    </div>
  )
}

function statusTag(status: EventStatusCode): string {
  switch (status) {
    case EVENT_STATUS.ON_SALE:
      return 'tag tag-success'
    case EVENT_STATUS.SOLD_OUT:
      return 'tag tag-warning'
    case EVENT_STATUS.CONFIRMED:
      return 'tag'
    case EVENT_STATUS.CANCELLED:
      return 'tag tag-danger'
    default:
      return 'tag'
  }
}
