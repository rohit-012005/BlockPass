import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverGetEvent, serverGetEventStats, serverListEventTickets, serverGetTicket } from '@/lib/server-contract'
import { BuyTicketPanel } from '@/components/BuyTicketPanel'
import { OrganizerActions } from '@/components/OrganizerActions'
import { TicketActions } from '@/components/TicketActions'
import { EventSharePanel } from '@/components/EventSharePanel'
import { formatTokenAmount, formatUnixDateTime, eventStatusLabel, progressPercent } from '@/lib/format'
import { EVENT_STATUS, TICKET_STATE } from '@/types'
import { CONTRACT_ID } from '@/lib/stellar'

interface Params {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventPage({ params }: Params) {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) {
    notFound()
  }
  const event = await serverGetEvent(eventId)
  if (!event) notFound()
  const stats = await serverGetEventStats(eventId)
  const ticketIds = await serverListEventTickets(eventId)
  const percent = progressPercent(stats?.sold ?? 0, stats?.capacity ?? 1)
  const canBuy = event.status === EVENT_STATUS.ON_SALE
  const refundCutoffPassed = Math.floor(Date.now() / 1000) >= event.refund_cutoff

  return (
    <div className="stack">
      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy stack">
            <span className="eyebrow">Event page</span>
            <h1 className="h1">{event.title}</h1>
            <p className="lead">
              {event.description}
            </p>
            <div className="row">
              <span className="tag tag-accent">{eventStatusLabel(event.status)}</span>
              <span className="tag">{event.venue}</span>
              <span className="tag">#{event.id}</span>
            </div>
          </div>

          <div className="surface feature-card stack floating">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="muted">Back to browse</span>
              <Link href="/" className="btn btn-ghost">
                All events
              </Link>
            </div>
            <div className="divider" />
            <div className="grid-2">
              <StatMini label="Price" value={`${formatTokenAmount(event.price, 7)} XLM`} />
              <StatMini label="Capacity" value={String(event.capacity)} />
              <StatMini label="Sold" value={`${stats?.sold ?? event.sold}`} />
              <StatMini label="Checked in" value={`${stats?.checked_in ?? 0}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="surface-grid">
        <section className="surface span-7 stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">Overview</span>
            <span className="tag tag-warning">Refund cutoff {formatUnixDateTime(event.refund_cutoff)}</span>
          </div>
          <div className="progress" aria-label="tickets sold">
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="stack" style={{ gap: '0.3rem' }}>
              <div className="stat-label">Schedule</div>
              <div className="mono">{formatUnixDateTime(event.starts_at)}</div>
            </div>
            <div className="stack" style={{ gap: '0.3rem' }}>
              <div className="stat-label">Refund window</div>
              <div className="mono">{formatUnixDateTime(event.refund_cutoff)}</div>
            </div>
          </div>
          <div className="notice">
            {stats?.sold ?? event.sold} of {event.capacity} sold · {stats?.refunded ?? event.refunded} refunded ·{' '}
            {stats?.checked_in ?? 0} checked in
          </div>
        </section>

        <section className="surface span-5 stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="eyebrow">Actions</span>
            <span className="tag tag-accent">{canBuy ? 'Live' : 'Paused'}</span>
          </div>
          <BuyTicketPanel
            eventId={eventId}
            organizer={event.organizer}
            status={event.status}
            canBuy={canBuy}
            price={event.price}
          />
          <OrganizerActions event={event} isOrganizer={false} />
        </section>
      </section>

      {CONTRACT_ID && <EventSharePanel eventId={eventId} contractId={CONTRACT_ID} />}

      <section className="surface stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="eyebrow">Tickets</span>
            <h2 className="h2" style={{ marginTop: '0.6rem' }}>
              All ticket records
            </h2>
          </div>
          <span className="tag">{ticketIds.length} total</span>
        </div>
        {ticketIds.length === 0 && <p className="muted">No tickets sold yet.</p>}
        {ticketIds.length > 0 && (
          <div className="grid-2">
            {ticketIds.map((tid) => (
              <TicketRow key={tid} ticketId={tid} refundCutoffPassed={refundCutoffPassed} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

async function TicketRow({ ticketId, refundCutoffPassed }: { ticketId: number; refundCutoffPassed: boolean }) {
  const ticket = await serverGetTicket(ticketId)
  if (!ticket) return null
  const label =
    ticket.state === TICKET_STATE.SOLD
      ? 'Active'
      : ticket.state === TICKET_STATE.CHECKED_IN
        ? 'Checked in'
        : 'Refunded'
  return (
    <div className="card card-elev-2 stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="mono">#{ticket.id}</div>
          <div className="muted">{short(ticket.buyer)}</div>
        </div>
        <span
          className={`tag ${
            ticket.state === TICKET_STATE.SOLD
              ? 'tag-success'
              : ticket.state === TICKET_STATE.CHECKED_IN
                ? 'tag-accent'
                : 'tag-warning'
          }`}
        >
          {label}
        </span>
      </div>
      <TicketActions ticket={ticket} isOrganizer={false} refundCutoffPassed={refundCutoffPassed} />
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div className="stat-label">{label}</div>
      <div className="mono" style={{ marginTop: '0.4rem', fontSize: '1.05rem' }}>
        {value}
      </div>
    </div>
  )
}

function short(addr: string): string {
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
