'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { createEvent } from '@/lib/contract'
import { CONTRACT_ERRORS } from '@/types'
import { NETWORK, isValidStellarAddress, shortAddress } from '@/lib/stellar'
import { formatTokenAmount, slugify } from '@/lib/format'

interface FormState {
  title: string
  description: string
  venue: string
  date: string
  time: string
  refundCutoffDate: string
  refundCutoffTime: string
  asset: string
  price: string
  capacity: string
  maxPerBuyer: string
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  venue: '',
  date: '',
  time: '19:00',
  refundCutoffDate: '',
  refundCutoffTime: '12:00',
  asset: '',
  price: '20',
  capacity: '30',
  maxPerBuyer: '4',
}

export default function CreateEventPage() {
  const router = useRouter()
  const { address, connect, signTransaction } = useWallet()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState<{ eventId: number; hash: string } | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!address) {
      await connect()
      return
    }
    const startsAt = composeTimestamp(form.date, form.time)
    const refundCutoff = composeTimestamp(form.refundCutoffDate, form.refundCutoffTime)
    if (startsAt == null || refundCutoff == null) {
      setError('Please enter valid date and time for both the event start and refund cutoff.')
      return
    }
    if (!isValidStellarAddress(form.asset)) {
      setError('Asset contract id must be a valid C… address. Look it up on Stellar Expert.')
      return
    }
    const priceWhole = Number(form.price)
    if (!Number.isFinite(priceWhole) || priceWhole <= 0) {
      setError('Price must be a positive number.')
      return
    }
    const price = BigInt(Math.round(priceWhole * 10_000_000)) // 7 decimals
    const capacity = Number(form.capacity)
    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError('Capacity must be a positive integer.')
      return
    }
    const maxPerBuyer = Number(form.maxPerBuyer)
    if (!Number.isInteger(maxPerBuyer) || maxPerBuyer <= 0) {
      setError('Per-buyer limit must be a positive integer.')
      return
    }

    setBusy(true)
    try {
      const result = await createEvent(
        {
          title: form.title.trim(),
          description: form.description.trim() || form.title.trim(),
          venue: form.venue.trim(),
          starts_at: startsAt,
          refund_cutoff: refundCutoff,
          asset: form.asset.trim(),
          price,
          capacity,
          max_per_buyer: maxPerBuyer,
        },
        address,
        signTransaction,
      )
      setSuccess(result)
      router.push(`/event/${result.eventId}`)
    } catch (e) {
      setError(decodeMessage(e instanceof Error ? e.message : 'Failed to create event'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 className="h1">Create an event</h1>
      <p className="muted">
        Set up your event on Stellar Testnet. Money is held in escrow and refunded automatically
        if you cancel before the refund cutoff.
      </p>
      <form onSubmit={onSubmit} className="card stack">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Rooftop comedy night"
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Five sets, one rooftop, one rain plan."
          />
        </Field>
        <Field label="Venue">
          <input
            required
            value={form.venue}
            onChange={(e) => update('venue', e.target.value)}
            placeholder="Backyard, Bandra"
          />
        </Field>
        <div className="grid-2">
          <Field label="Date">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </Field>
          <Field label="Time">
            <input
              required
              type="time"
              value={form.time}
              onChange={(e) => update('time', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Refund cutoff date">
            <input
              required
              type="date"
              value={form.refundCutoffDate}
              onChange={(e) => update('refundCutoffDate', e.target.value)}
            />
          </Field>
          <Field label="Refund cutoff time">
            <input
              required
              type="time"
              value={form.refundCutoffTime}
              onChange={(e) => update('refundCutoffTime', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Capacity">
            <input
              required
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
            />
          </Field>
          <Field label="Max tickets per buyer">
            <input
              required
              type="number"
              min={1}
              value={form.maxPerBuyer}
              onChange={(e) => update('maxPerBuyer', e.target.value)}
            />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Price (XLM)">
            <input
              required
              type="number"
              step="0.0000001"
              min={0.0000001}
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </Field>
          <Field label="Asset contract id (C…)">
            <input
              required
              value={form.asset}
              onChange={(e) => update('asset', e.target.value)}
              placeholder="C… (native XLM SAC or USDC SAC)"
            />
          </Field>
        </div>
        <div className="muted">
          Network: {NETWORK.networkPassphrase}. The contract id your client will call is
          configured via <span className="kbd">NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID</span>.
        </div>
        {address && (
          <div className="muted">
            Connected as <span className="mono">{shortAddress(address, 6, 4)}</span>
          </div>
        )}
        {!address && (
          <button type="button" className="btn btn-primary" onClick={connect}>
            Connect wallet to continue
          </button>
        )}
        {address && (
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Create event'}
          </button>
        )}
        {error && <div className="notice notice-error">{error}</div>}
        {success && (
          <div className="notice notice-success">
            Event #{success.eventId} created. Tx: <span className="mono">{success.hash}</span>
          </div>
        )}
        {form.title && (
          <div className="muted">
            Shareable link preview:{' '}
            <span className="mono">/event/{slugify(form.title) || 'new'}</span> (final URL is
            numeric)
          </div>
        )}
      </form>

      {(form.title || form.venue || form.date) && (
        <section className="card stack">
          <h2 className="h2">Live preview</h2>
          <p className="muted" style={{ margin: 0 }}>
            Review title, venue, price, and dates before you submit.
          </p>
          <div className="grid-2">
            <PreviewStat label="Title" value={form.title || 'Untitled event'} />
            <PreviewStat label="Venue" value={form.venue || 'Venue pending'} />
            <PreviewStat label="Price" value={`${formatTokenAmount(BigInt(Math.round(Number(form.price || 0) * 10_000_000)), 7)} XLM`} />
            <PreviewStat label="Capacity" value={form.capacity || '0'} />
          </div>
          <div className="muted">
            Starts {formatDatePreview(form.date, form.time)} · refunds close{' '}
            {formatDatePreview(form.refundCutoffDate, form.refundCutoffTime)}
          </div>
        </section>
      )}
    </div>
  )
}

function formatDatePreview(date: string, time: string): string {
  if (!date || !time) return 'when dates are filled'
  return `${date} at ${time}`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div className="mono" style={{ marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  )
}

function composeTimestamp(date: string, time: string): number | null {
  if (!date) return null
  const iso = `${date}T${time || '00:00'}:00`
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return null
  return Math.floor(ts / 1000)
}

function decodeMessage(message: string): string {
  for (const code of Object.keys(CONTRACT_ERRORS)) {
    const entry = CONTRACT_ERRORS[Number(code)]
    if (entry && message.includes(entry.name)) {
      return `${entry.message} (${entry.name})`
    }
  }
  return message
}
