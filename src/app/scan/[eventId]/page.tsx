'use client'

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
        const { eventId: eid } = await _params
        const id = Number(eid)
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
    return <div className="notice notice-error">{error}</div>
  }
  if (eventId == null) {
    return (
      <div className="hero stack">
        <span className="eyebrow">Check-in</span>
        <h1 className="h1">Loading event…</h1>
        <p className="lead">Preparing door validation, organizer identity, and QR token checks.</p>
      </div>
    )
  }
  if (organizer && address && organizer !== address) {
    return (
      <div className="hero stack">
        <span className="eyebrow">Access denied</span>
        <h1 className="h1">Wrong wallet for this door.</h1>
        <p className="lead">
          This wallet is not the organizer of event #{eventId}. Switch to the organizer&apos;s wallet.
        </p>
      </div>
    )
  }
  return (
    <section className="hero reveal">
      <div className="hero-grid">
        <div className="hero-copy stack">
          <span className="eyebrow">Door mode</span>
          <h1 className="h1">Scan, verify, and check people in without friction.</h1>
          <p className="lead">
            Paste a QR token or scan one from the camera flow. The server validates the signature
            before the on-chain check-in goes through.
          </p>
          <div className="row">
            <span className="tag tag-accent">Event #{eventId}</span>
            {organizer && <span className="tag">Organizer ready</span>}
          </div>
        </div>
        <div className="surface feature-card stack floating">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Wallet</span>
            {address ? <span className="tag tag-success">Connected</span> : <span className="tag tag-warning">Required</span>}
          </div>
          <div className="divider" />
          {address ? (
            <div className="mono">{address}</div>
          ) : (
            <button className="btn btn-primary" onClick={connect}>
              Connect wallet
            </button>
          )}
        </div>
      </div>

      <div className="surface-grid">
        <div className="surface span-7 stack">
          <CheckInScanner eventId={eventId} organizer={organizer ?? ''} onCheckIn={onCheckIn} />
        </div>
        <div className="surface span-5 stack">
          <span className="eyebrow">Door notes</span>
          <div className="stack">
            <div className="notice">
              Verify token first, then confirm check-in. That keeps the flow safe at busy doors.
            </div>
            <div className="notice">
              If a token belongs to a different event, the scanner blocks it before any on-chain
              action.
            </div>
            <div className="notice notice-success">
              You can reuse this page on desktop or a tablet at the venue.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
