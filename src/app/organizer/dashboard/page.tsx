'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { EVENT_STATUS } from '@/types'
import { useWallet } from '@/hooks/useWallet'
import { useOrganizerEvents } from '@/hooks/useEvent'
import { formatUnixDateTime, eventStatusLabel, formatTokenAmount } from '@/lib/format'
import { CONTRACT_ID, shortAddress } from '@/lib/stellar'

export default function OrganizerDashboard() {
  const { address, connect } = useWallet()
  const { data, error, isLoading, refresh } = useOrganizerEvents(address)

  useEffect(() => {
    if (!address) return
    const timer = window.setInterval(() => {
      void refresh()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [address, refresh])

  if (!address) {
    return (
      <section className="surface surface-strong px-6 py-8 md:px-8 md:py-10">
        <div className="space-y-5">
          <span className="eyebrow">Organizer dashboard</span>
          <h1 className="section-title max-w-[10ch]">Connect the wallet that owns your events.</h1>
          <p className="section-copy">
            This dashboard keeps event health, check-in, and action controls in one place so the
            organizer flow stays fast.
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

  const live = data?.filter(({ event }) => event.status === EVENT_STATUS.ON_SALE).length ?? 0
  const soldOut = data?.filter(({ event }) => event.status === EVENT_STATUS.SOLD_OUT).length ?? 0
  const ticketsSold = data?.reduce((sum, { event }) => sum + event.sold, 0) ?? 0

  return (
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow">Organizer dashboard</span>
            <h1 className="section-title max-w-[11ch]">Command center for live events.</h1>
            <p className="section-copy">
              See ticket flow, open check-in, and jump into the right event without hunting through
              menus.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
              >
                + New event
              </Link>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
                onClick={() => void refresh()}
              >
                Refresh contract
              </button>
              {data && data.length > 0 && (
                <Link
                  href={`/scan/${data[0]?.id ?? ''}`}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
                >
                  Open check-in
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Events" value={String(data?.length ?? 0)} />
            <StatCard label="Live" value={String(live)} />
            <StatCard label="Sold out" value={String(soldOut)} />
            <StatCard label="Tickets sold" value={String(ticketsSold)} />
          </div>
        </div>
      </section>

      <section className="surface px-5 py-4 text-sm text-[var(--text-dim)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>Wallet: {address ? shortAddress(address, 6, 4) : 'Disconnected'}</span>
            <span>Contract: {shortAddress(CONTRACT_ID, 6, 4)}</span>
          </div>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-4 py-2 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
            onClick={() => void refresh()}
          >
            Reload events
          </button>
        </div>
      </section>

      {isLoading && <p className="text-sm text-[var(--text-dim)]">Loading…</p>}
      {error && <div className="surface px-5 py-4 text-sm text-[#b94a4a]">{error}</div>}

      {data && data.length === 0 && (
        <section className="surface p-6 md:p-7">
          <span className="eyebrow">Empty state</span>
          <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
            No events yet
          </h2>
          <p className="section-copy mt-3">
            Start with one event, then reuse the dashboard for future launches.
          </p>
          <p className="mt-3 text-sm text-[var(--text-dim)]">
            If you just created an event and do not see it here, make sure the same wallet is
            connected. This view reads the contract by organizer address.
          </p>
          <Link
            href="/create"
            className="mt-5 inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
          >
            Create your first event
          </Link>
        </section>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map(({ id, event }) => (
            <Link
              href={`/event/${id}`}
              key={id}
              className="surface surface-strong block p-6 transition hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(52,38,20,0.16)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className={statusChip(event.status)}>{eventStatusLabel(event.status)}</span>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
                  #{id}
                </span>
              </div>
              <h3 className="mt-4 font-display text-[1.85rem] leading-none tracking-[-0.04em]">
                {event.title}
              </h3>
              <p className="mt-3 m-0 text-sm text-[var(--text-dim)]">
                {event.venue} · {formatUnixDateTime(event.starts_at)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[var(--text-dim)]">
                <span>
                  {event.sold} / {event.capacity} sold
                </span>
                <span className="font-mono">{formatTokenAmount(event.price, 7)} XLM</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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

function statusChip(status: number): string {
  switch (status) {
    case EVENT_STATUS.ON_SALE:
      return 'chip bg-[rgba(145,216,79,0.14)]'
    case EVENT_STATUS.SOLD_OUT:
      return 'chip bg-[rgba(239,190,116,0.2)]'
    case EVENT_STATUS.CONFIRMED:
      return 'chip bg-[rgba(237,197,213,0.65)]'
    case EVENT_STATUS.CANCELLED:
      return 'chip bg-[rgba(255,228,228,0.8)]'
    default:
      return 'chip'
  }
}
