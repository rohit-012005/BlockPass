import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EVENT_STATUS } from '@/types'
import { CONTRACT_ID } from '@/lib/stellar'
import { serverGetEvent, serverGetEventStats } from '@/lib/server-contract'
import { formatTokenAmount, formatUnixDateTime, eventStatusLabel, progressPercent } from '@/lib/format'
import { BuyTicketPanel } from '@/components/BuyTicketPanel'
import { EventCreatedGate } from '@/components/EventCreatedGate'
import { OrganizerActions } from '@/components/OrganizerActions'
import { EventSharePanel } from '@/components/EventSharePanel'

interface Params {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string; hash?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return { title: 'Event not found' }
  }

  try {
    const event = await serverGetEvent(eventId)
    if (!event) return { title: 'Event not found' }

    const title = `${event.title}`
    const description = event.description || `${event.venue} · ${formatUnixDateTime(event.starts_at)}`
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        images: [`/api/og/${event.id}`],
      },
    }
  } catch {
    return {
      title: 'Event not found',
      description: 'Stellar-powered event checkout, refunds, and check-in.',
    }
  }
}

export default async function EventPage({ params, searchParams }: Params) {
  const { id } = await params
  const { created, hash } = await searchParams
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) notFound()

  const event = await serverGetEvent(eventId).catch(() => null)
  if (!event) {
    if (created === '1') {
      return <EventCreatedGate eventId={eventId} hash={hash ?? null} />
    }
    notFound()
  }

  const stats = await serverGetEventStats(eventId).catch(() => null)
  const sold = stats?.sold ?? event.sold
  const checkedIn = stats?.checked_in ?? 0
  const refunded = stats?.refunded ?? event.refunded
  const percent = progressPercent(sold, stats?.capacity ?? event.capacity)
  const canBuy = event.status === EVENT_STATUS.ON_SALE

  return (
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="eyebrow">Event page</span>
          <Link href="/" className="chip">
            Back to events
          </Link>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <h1 className="section-title max-w-[12ch]">{event.title}</h1>
              <p className="section-copy">{event.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip">{eventStatusLabel(event.status)}</span>
              <span className="chip">{event.venue}</span>
              <span className="chip">Event #{event.id}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Price" value={`${formatTokenAmount(event.price, 7)} XLM`} />
            <StatCard label="Capacity" value={String(event.capacity)} />
            <StatCard label="Sold" value={String(sold)} />
            <StatCard label="Checked in" value={String(checkedIn)} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="surface p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <span className="eyebrow">Overview</span>
                <h2 className="font-display text-[2rem] leading-none tracking-[-0.04em]">
                  Timeline and sales
                </h2>
              </div>
              <span className="chip">Refund cutoff {formatUnixDateTime(event.refund_cutoff)}</span>
            </div>
            <div className="mt-6">
              <div className="h-3 overflow-hidden rounded-full border border-[var(--border)] bg-[rgba(255,255,255,0.6)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--gold))]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MiniDetail label="Starts" value={formatUnixDateTime(event.starts_at)} />
                <MiniDetail label="Refund window" value={formatUnixDateTime(event.refund_cutoff)} />
              </div>
            </div>
            <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4 text-sm text-[var(--text-dim)]">
              {sold} sold · {refunded} refunded · {checkedIn} checked in · {Math.max(0, event.capacity - sold)} left
            </div>
          </section>

          <section className="surface p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <span className="eyebrow">Share</span>
                <h2 className="font-display text-[2rem] leading-none tracking-[-0.04em]">
                  Event link and contract
                </h2>
              </div>
              <span className="chip">For guests and collaborators</span>
            </div>
            <div className="mt-5">
              {CONTRACT_ID && <EventSharePanel eventId={eventId} contractId={CONTRACT_ID} />}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface p-6 md:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="eyebrow">Tickets</span>
                <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
                  Buy ticket
                </h2>
              </div>
              <span className="chip">{canBuy ? 'Open' : 'Closed'}</span>
            </div>
            <p className="section-copy mt-4">
              This is the public checkout area. Buyers see price, remaining capacity, and the
              current sale state here.
            </p>
            <div className="mt-5">
              <BuyTicketPanel
                eventId={eventId}
                organizer={event.organizer}
                status={event.status}
                canBuy={canBuy}
                price={event.price}
              />
            </div>
          </section>

          <section className="surface p-6 md:p-7">
            <OrganizerActions event={event} />
          </section>

          <section className="surface p-6 md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <span className="eyebrow">Health</span>
                <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
                  Event status
                </h2>
              </div>
              <span className="chip">{checkedIn} checked in</span>
            </div>
            <p className="section-copy mt-4">
              Public stats stay simple: sales, refunds, check-ins, and remaining seats.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatCard label="Tickets sold" value={String(sold)} />
              <StatCard label="Refunded" value={String(refunded)} />
              <StatCard label="Checked in" value={String(checkedIn)} />
              <StatCard label="Remaining" value={String(Math.max(0, event.capacity - sold))} />
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-2 font-display text-[1.35rem] leading-none tracking-[-0.03em]">{value}</div>
    </div>
  )
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-2 font-mono text-sm text-[var(--text)]">{value}</div>
    </div>
  )
}
