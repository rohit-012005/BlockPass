import { notFound } from 'next/navigation'
import Link from 'next/link'
import { serverGetEvent, serverGetEventStats, serverListEventTickets, serverGetTicket } from '@/lib/server-contract'
import { BuyTicketPanel } from '@/components/BuyTicketPanel'
import { OrganizerActions } from '@/components/OrganizerActions'
import { TicketActions } from '@/components/TicketActions'
import { formatTokenAmount, formatUnixDateTime, eventStatusLabel, progressPercent } from '@/lib/format'
import { EVENT_STATUS, TICKET_STATE } from '@/types'

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
      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="tag tag-accent">{eventStatusLabel(event.status)}</span>
          <Link href="/" className="muted">
            ← All events
          </Link>
        </div>
        <h1 className="h1" style={{ marginTop: '0.5rem' }}>{event.title}</h1>
        <p className="muted">{event.venue} · {formatUnixDateTime(event.starts_at)}</p>
        <p>{event.description}</p>
        <div className="divider" />
        <div className="row" style={{ gap: '2rem' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Price</div>
            <div className="mono" style={{ fontSize: '1.1rem' }}>{formatTokenAmount(event.price, 7)} XLM</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Capacity</div>
            <div className="mono" style={{ fontSize: '1.1rem' }}>{event.capacity}</div>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Refund cutoff</div>
            <div className="mono" style={{ fontSize: '1.1rem' }}>{formatUnixDateTime(event.refund_cutoff)}</div>
          </div>
        </div>
        <div className="divider" />
        <div className="progress" aria-label="tickets sold">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="muted" style={{ marginTop: '0.4rem' }}>
          {stats?.sold ?? event.sold} of {event.capacity} sold · {stats?.refunded ?? event.refunded} refunded ·{' '}
          {stats?.checked_in ?? 0} checked in
        </div>
      </section>

      <div className="grid-2">
        <BuyTicketPanel
          eventId={eventId}
          organizer={event.organizer}
          status={event.status}
          canBuy={canBuy}
          price={event.price}
        />
        <OrganizerActions event={event} isOrganizer={false} />
      </div>

      <section className="card">
        <h2 className="h2">Tickets</h2>
        {ticketIds.length === 0 && <p className="muted">No tickets sold yet.</p>}
        {ticketIds.length > 0 && (
          <div className="stack">
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
    <div className="card card-elev-2">
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

function short(addr: string): string {
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
