'use client'

import { useState } from 'react'

interface VerifyResult {
  ok: boolean
  payload?: {
    ticket_id: number
    event_id: number
    buyer: string
    exp: number
  }
  error?: string
}

interface Props {
  eventId: number
  organizer: string
  onCheckIn: (ticketId: number) => Promise<void>
}

export function CheckInScanner({ eventId, organizer: _organizer, onCheckIn }: Props) {
  const [code, setCode] = useState('')
  const [verify, setVerify] = useState<VerifyResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onVerify = async () => {
    setError(null)
    setVerify(null)
    setSuccess(null)
    if (!code.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/checkin/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: code.trim(), eventId }),
      })
      const data = (await res.json()) as VerifyResult
      if (data.ok && data.payload && data.payload.event_id !== eventId) {
        setVerify(null)
        setError(`Token is for event #${data.payload.event_id}, not this door.`)
        return
      }
      setVerify(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify')
    } finally {
      setBusy(false)
    }
  }

  const onConfirm = async () => {
    if (!verify?.payload) return
    setBusy(true)
    setError(null)
    try {
      await onCheckIn(verify.payload.ticket_id)
      setSuccess(`Checked in ticket #${verify.payload.ticket_id}`)
      setCode('')
      setVerify(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check-in failed')
    } finally {
      setBusy(false)
    }
  }

  const onReset = () => {
    setCode('')
    setVerify(null)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="chip">Scanner</span>
          <h3 className="mt-3 font-display text-[1.8rem] leading-none tracking-[-0.04em]">
            Door check-in
          </h3>
        </div>
        <span className="chip">Event #{eventId}</span>
      </div>
      <p className="m-0 text-sm leading-7 text-[var(--text-dim)]">
        Paste or scan a ticket QR token. The server validates the HMAC signature before the
        on-chain <span className="font-mono">check_in</span> call goes through.
      </p>

      <textarea
        rows={4}
        className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,252,247,0.96)] px-4 py-3 outline-none transition focus:border-[rgba(108,198,58,0.9)] focus:shadow-[0_0_0_4px_rgba(145,216,79,0.18)]"
        placeholder="v1.eyJ0aWNrZXRfaWQiOi4uLn0.signature"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onVerify}
          disabled={busy || !code.trim()}
        >
          Verify token
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onReset}
          disabled={busy && !code.trim()}
        >
          Reset
        </button>
        {verify?.ok && verify.payload && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            Check in ticket #{verify.payload.ticket_id}
          </button>
        )}
      </div>

      {verify && !verify.ok && (
        <div className="rounded-[24px] border border-[rgba(220,72,72,0.24)] bg-[rgba(255,240,240,0.92)] p-4 text-sm text-[#b94a4a]">
          Invalid: {verify.error}
        </div>
      )}

      {verify?.ok && verify.payload && (
        <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(255,252,247,0.92)] p-4 text-sm text-[var(--text)]">
          Valid token for event #{verify.payload.event_id} · ticket #{verify.payload.ticket_id} for buyer{' '}
          <span className="font-mono break-all">{verify.payload.buyer}</span>
        </div>
      )}

      {error && (
        <div className="rounded-[24px] border border-[rgba(220,72,72,0.24)] bg-[rgba(255,240,240,0.92)] p-4 text-sm text-[#b94a4a]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm text-[var(--text)]">
          {success}
        </div>
      )}
    </div>
  )
}
