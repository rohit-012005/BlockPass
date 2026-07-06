'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { createEvent } from '@/lib/contract'
import { trackEvent } from '@/lib/telemetry'
import { CONTRACT_ERRORS } from '@/types'
import { NETWORK, NATIVE_XLM_ASSET_ID, isTestnet, shortAddress } from '@/lib/stellar'
import { formatTokenAmount, slugify } from '@/lib/format'

interface FormState {
  title: string
  description: string
  venue: string
  date: string
  time: string
  refundCutoffDate: string
  refundCutoffTime: string
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
  const pendingCreateRef = useRef(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submitEvent = async () => {
    const creator = address
    if (!creator) {
      setError('Connect wallet to continue.')
      return
    }

    const startsAt = composeTimestamp(form.date, form.time)
    const refundCutoff = composeTimestamp(form.refundCutoffDate, form.refundCutoffTime)
    if (startsAt == null || refundCutoff == null) {
      setError('Enter valid event start and refund cutoff dates.')
      return
    }

    const price = parseTokenAmount(form.price)
    if (price == null || price <= 0n) {
      setError('Price must be a positive number.')
      return
    }

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

    if (refundCutoff >= startsAt) {
      setError('Refund cutoff must be earlier than event start.')
      return
    }

    setBusy(true)
    try {
      void trackEvent('create_event_attempt', {
        address: creator,
        contractId: process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? '',
        method: 'create_event',
        step: 'submit',
      })
      const result = await createEvent(
        {
          title: form.title.trim(),
          description: form.description.trim() || form.title.trim(),
          venue: form.venue.trim(),
          starts_at: startsAt,
          refund_cutoff: refundCutoff,
          asset: NATIVE_XLM_ASSET_ID,
          price,
          capacity,
          max_per_buyer: maxPerBuyer,
        },
        creator,
        signTransaction,
      )
      setSuccess(result)
      void trackEvent('create_event_success', {
        address: creator,
        contractId: process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? '',
        method: 'create_event',
        eventId: result.eventId,
        status: 'success',
      })
      router.push(`/event/${result.eventId}?created=1&hash=${encodeURIComponent(result.hash)}`)
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Failed to create event'
      const decoded = decodeMessage(raw)
      setError(decoded)
      console.error('[create_event]', {
        address: creator,
        contractId: process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? '',
        error: raw,
        decoded,
        form: {
          title: form.title,
          venue: form.venue,
          date: form.date,
          time: form.time,
          refundCutoffDate: form.refundCutoffDate,
          refundCutoffTime: form.refundCutoffTime,
          capacity: form.capacity,
          maxPerBuyer: form.maxPerBuyer,
          price: form.price,
        },
        network: NETWORK.networkPassphrase,
      })
      void trackEvent('create_event_error', {
        address: creator,
        contractId: process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? '',
        method: 'create_event',
        error: decoded,
        status: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!address) {
      pendingCreateRef.current = true
      await connect()
      return
    }

    pendingCreateRef.current = false
    await submitEvent()
  }

  useEffect(() => {
    if (!pendingCreateRef.current || !address) return
    pendingCreateRef.current = false
    void submitEvent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const previewTitle = form.title || 'Untitled event'
  const previewVenue = form.venue || 'Venue pending'
  const previewPrice = `${formatTokenAmount(parseTokenAmount(form.price) ?? 0n, 7)} XLM`
  const previewRefund = formatDatePreview(form.refundCutoffDate, form.refundCutoffTime)

  return (
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <span className="eyebrow">Create flow</span>
            <h1 className="section-title max-w-[12ch]">
              Build an event page that feels expensive before tickets go live.
            </h1>
            <p className="section-copy">
              Draft the listing, set refund rules, and ship a clean buyer experience without
              extra noise. Same flow powers sales, refunds, and check-in.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Escrow ready', 'Refund cutoff', 'QR check-in'].map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="surface bg-[rgba(255,252,247,0.96)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">
                  Account
                </p>
                <h2 className="mt-2 font-display text-[1.65rem] leading-none tracking-[-0.04em]">
                  Wallet state
                </h2>
              </div>
              <span className="chip">{isTestnet() ? 'Testnet' : 'Mainnet'}</span>
            </div>
            <div className="mt-5 space-y-3">
              <MiniRow label="Contract" value="BlockPass escrow" />
              <MiniRow label="Identity" value={address ? shortAddress(address, 8, 4) : 'Connect wallet'} />
              <MiniRow label="Rules" value="Capacity, price, refund cutoff" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form onSubmit={onSubmit} className="surface surface-strong p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="eyebrow">Event details</span>
              <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
                Draft the public listing
              </h2>
            </div>
            <span className="chip">Live form</span>
          </div>

          <div className="mt-6 space-y-4">
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
                rows={4}
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
                placeholder="Bandra, Mumbai"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Capacity">
                <input
                  required
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => update('capacity', e.target.value)}
                />
              </Field>
              <Field label="Max tickets / buyer">
                <input
                  required
                  type="number"
                  min={1}
                  value={form.maxPerBuyer}
                  onChange={(e) => update('maxPerBuyer', e.target.value)}
                />
              </Field>
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
            </div>

            <Field label="Asset">
              <input value="Native XLM" readOnly disabled />
            </Field>

            <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4 text-sm text-[var(--text-dim)]">
              Network: {NETWORK.networkPassphrase}. Asset is locked to native XLM and contract id
              comes from <span className="font-mono">NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID</span>.
            </div>

            {address && (
              <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm text-[var(--text)]">
                Connected as <span className="font-mono">{shortAddress(address, 6, 4)}</span>
              </div>
            )}

            {!address && (
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
                onClick={connect}
              >
                Connect wallet to continue
              </button>
            )}

            {address && (
              <button
                type="submit"
                disabled={busy}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? 'Submitting…' : 'Create event'}
              </button>
            )}

            {error && (
              <div className="rounded-[24px] border border-[rgba(220,72,72,0.24)] bg-[rgba(255,240,240,0.92)] p-4 text-sm text-[#b94a4a]">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm text-[var(--text)]">
                <div>
                  Event #{success.eventId} created. Tx:{' '}
                  <span className="font-mono break-all">{success.hash}</span>
                </div>
                <Link
                  href={`/event/${success.eventId}?created=1&hash=${encodeURIComponent(success.hash)}`}
                  className="mt-2 inline-flex underline underline-offset-4"
                >
                  Open event page
                </Link>
              </div>
            )}
            {form.title && (
              <div className="text-sm text-[var(--text-dim)]">
                Shareable preview: <span className="font-mono">/event/{slugify(form.title) || 'new'}</span> (final URL is numeric)
              </div>
            )}
          </div>
        </form>

        <aside className="surface surface-strong p-6 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Preview</span>
              <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
                What attendees will see
              </h2>
            </div>
            <span className="chip">Auto update</span>
          </div>
          <p className="section-copy mt-4">
            Clear event page, refund line, and enough detail to build trust before checkout.
          </p>
          <div className="divider my-6" />

          <div className="space-y-3">
            <PreviewStat label="Title" value={previewTitle} />
            <PreviewStat label="Venue" value={previewVenue} />
            <PreviewStat label="Price" value={previewPrice} />
            <PreviewStat label="Asset" value={`Native XLM · ${NATIVE_XLM_ASSET_ID}`} />
            <PreviewStat label="Capacity" value={form.capacity || '0'} />
            <PreviewStat label="Refund cutoff" value={previewRefund} />
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4 text-sm text-[var(--text-dim)]">
            Starts {formatDatePreview(form.date, form.time)} · refunds close{' '}
            {formatDatePreview(form.refundCutoffDate, form.refundCutoffTime)}
          </div>
        </aside>
      </section>
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
    <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-4 py-3">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-2 font-mono text-sm break-words">{value}</div>
    </div>
  )
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-4 py-3">
      <span className="text-sm text-[var(--text-dim)]">{label}</span>
      <span className="font-mono text-sm break-all text-right">{value}</span>
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

function parseTokenAmount(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed) return 0n
  if (!/^\d+(\.\d{0,7})?$/.test(trimmed)) return null
  const [whole, fraction = ''] = trimmed.split('.')
  return BigInt(`${whole}${fraction.padEnd(7, '0')}`)
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
