'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEvent } from '@/hooks/useEvent'
import { explorerTxUrl } from '@/lib/stellar'

interface Props {
  eventId: number
  hash?: string | null
}

export function EventCreatedGate({ eventId, hash }: Props) {
  const router = useRouter()
  const { data, error, refresh } = useEvent(eventId)
  const refreshedRef = useRef(false)

  useEffect(() => {
    if (data && !refreshedRef.current) {
      refreshedRef.current = true
      router.refresh()
      return
    }
    const timer = window.setInterval(() => {
      void refresh()
    }, 2000)
    return () => window.clearInterval(timer)
  }, [data, refresh, router])

  return (
    <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <span className="eyebrow">Event created</span>
          <h1 className="section-title max-w-[12ch]">Waiting for chain readback…</h1>
          <p className="section-copy">
            Event #{eventId} has been submitted. This screen polls until the contract read path
            can see the new record, then it will hand off to the real event page.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="chip">Auto refresh</span>
            <span className="chip">Every 2 seconds</span>
            <span className="chip">Event #{eventId}</span>
          </div>
          {hash && (
            <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4 text-sm text-[var(--text-dim)]">
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
                Transaction
              </div>
              <a
                href={explorerTxUrl(hash)}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 block font-mono break-all text-[var(--text)] underline underline-offset-4"
              >
                {hash}
              </a>
            </div>
          )}
        </div>

        <div className="surface bg-[rgba(255,252,247,0.92)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
                Readback status
              </p>
              <h2 className="mt-2 font-display text-[1.65rem] leading-none tracking-[-0.04em]">
                Syncing on-chain data
              </h2>
            </div>
            <span className="chip">{data ? 'Ready' : 'Pending'}</span>
          </div>

          <div className="mt-5 space-y-3">
            <ReadbackRow label="Contract read" value={data ? 'Success' : 'Waiting'} />
            <ReadbackRow label="Retry cadence" value="2 seconds" />
            <ReadbackRow label="Event id" value={`#${eventId}`} />
          </div>

          <p className="mt-5 text-sm leading-7 text-[var(--text-dim)]">
            {error
              ? 'The chain has not exposed this event yet. We keep polling automatically.'
              : 'Once the record is visible, the page will switch over without another submit.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
              onClick={() => void refresh()}
              type="button"
            >
              Retry now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReadbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-4 py-3">
      <span className="text-sm text-[var(--text-dim)]">{label}</span>
      <span className="font-mono text-sm text-right">{value}</span>
    </div>
  )
}
