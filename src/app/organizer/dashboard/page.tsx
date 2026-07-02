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
      <div className="card stack">
        <h1 className="h1">Organizer dashboard</h1>
        <p className="muted">Connect the wallet that owns your events.</p>
        <button className="btn btn-primary" onClick={connect} style={{ alignSelf: 'flex-start' }}>
          Connect wallet
        </button>
      </div>
    )
  }

  return (
    <div className="stack">
      <h1 className="h1">Organizer dashboard</h1>
      <div className="row">
        <Link href="/create" className="btn btn-primary">
          + New event
        </Link>
        {events.data && events.data.length > 0 && (
          <Link href={`/scan/${events.data[0]?.id ?? ''}`} className="btn btn-ghost">
            Open check-in for latest event
          </Link>
        )}
      </div>
      {events.isLoading && <p className="muted">Loading…</p>}
      {events.error && <div className="notice notice-error">{events.error}</div>}
      {events.data && events.data.length === 0 && (
        <div className="card stack">
          <p className="muted">You haven&apos;t created any events yet.</p>
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
              className="card"
              style={{ display: 'block', color: 'inherit' }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className={statusTag(event.status)}>{eventStatusLabel(event.status)}</span>
                <span className="muted mono">#{id}</span>
              </div>
              <h3 className="h3" style={{ marginTop: '0.5rem' }}>{event.title}</h3>
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
