'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { CheckInScanner } from '@/components/CheckInScanner'
import { checkIn } from '@/lib/contract'
import { serverGetEvent } from '@/lib/server-contract'

interface Props {
  params: Promise<{ eventId: string }>
}

export default function ScanPage({ params: _params }: Props) {
  const router = useRouter()
  const { address, signTransaction, connect } = useWallet()
  const [eventId, setEventId] = useState<number | null>(null)
  const [organizer, setOrganizer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const { eventId: eventParam } = await _params
        const id = Number(eventParam)
        if (!Number.isFinite(id) || id <= 0) return
        if (cancelled) return
        setEventId(id)
        const ev = await serverGetEvent(id)
        if (!cancelled && ev) setOrganizer(ev.organizer)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load event')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [_params])

  const onCheckIn = useCallback(
    async (ticketId: number) => {
      if (!address) {
        await connect()
        throw new Error('Connect wallet first')
      }
      await checkIn(ticketId, address, signTransaction)
      router.refresh()
    },
    [address, connect, signTransaction, router],
  )

  if (error) {
    return <div className="surface px-5 py-4 text-sm text-[#b94a4a]">{error}</div>
  }

  if (eventId == null) {
    return (
      <section className="surface surface-strong px-6 py-8 md:px-8 md:py-10">
        <span className="eyebrow">Check-in</span>
        <h1 className="mt-4 section-title max-w-[10ch]">Loading event…</h1>
        <p className="section-copy mt-3">Preparing door validation, organizer identity, and QR token checks.</p>
      </section>
    )
  }

  if (organizer && address && organizer !== address) {
    return (
      <section className="surface surface-strong px-6 py-8 md:px-8 md:py-10">
        <span className="eyebrow">Access denied</span>
        <h1 className="mt-4 section-title max-w-[10ch]">Wrong wallet for this door.</h1>
        <p className="section-copy mt-3">
          This wallet is not the organizer of event #{eventId}. Switch to the organizer&apos;s wallet.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow">Door mode</span>
            <h1 className="section-title max-w-[12ch]">
              Scan, verify, and check people in without friction.
            </h1>
            <p className="section-copy">
              Paste a QR token or scan one from the camera flow. The server validates the signature
              before the on-chain check-in goes through.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="chip">Event #{eventId}</span>
              {organizer && <span className="chip">Organizer ready</span>}
            </div>
          </div>

          <div className="surface bg-[rgba(255,252,247,0.96)] p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-dim)]">Wallet</span>
              {address ? <span className="chip bg-[rgba(145,216,79,0.14)]">Connected</span> : <span className="chip bg-[rgba(239,190,116,0.18)]">Required</span>}
            </div>
            <div className="divider my-4" />
            {address ? (
              <div className="font-mono text-sm break-all">{address}</div>
            ) : (
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
                onClick={connect}
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="surface p-6 md:p-7">
          <CheckInScanner eventId={eventId} organizer={organizer ?? ''} onCheckIn={onCheckIn} />
        </div>

        <aside className="surface p-6 md:p-7">
          <span className="eyebrow">Door notes</span>
          <div className="mt-5 space-y-3">
            <Note text="Verify token first, then confirm check-in. That keeps the flow safe at busy doors." />
            <Note text="If a token belongs to a different event, the scanner blocks it before any on-chain action." />
            <Note text="This page works on desktop or tablet at the venue." accent />
          </div>
          <Link
            href="/organizer/dashboard"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
          >
            Back to dashboard
          </Link>
        </aside>
      </section>
    </div>
  )
}

function Note({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-[24px] border p-4 text-sm leading-7 ${
        accent
          ? 'border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)]'
          : 'border-[var(--border)] bg-[rgba(255,252,247,0.92)] text-[var(--text-dim)]'
      }`}
    >
      {text}
    </div>
  )
}
