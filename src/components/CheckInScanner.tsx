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

export function CheckInScanner({ eventId, onCheckIn }: Props) {
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
    <div className="card stack">
      <h2 className="h2">Door check-in</h2>
      <p className="muted">
        Paste or scan a ticket QR token. The server validates the HMAC signature before the
        on-chain <span className="mono">check_in</span> call goes through.
      </p>
      <textarea
        rows={3}
        placeholder="v1.eyJ0aWNrZXRfaWQiOi4uLn0.signature"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="row">
        <button className="btn btn-ghost" onClick={onVerify} disabled={busy || !code.trim()}>
          Verify token
        </button>
        <button className="btn btn-ghost" onClick={onReset} disabled={busy && !code.trim()}>
          Reset
        </button>
        {verify?.ok && verify.payload && (
          <button className="btn btn-success" onClick={onConfirm} disabled={busy}>
            Check in ticket #{verify.payload.ticket_id}
          </button>
        )}
      </div>
      {verify && !verify.ok && <div className="notice notice-error">Invalid: {verify.error}</div>}
      {verify?.ok && verify.payload && (
        <div className="notice">
          Valid token for event #{verify.payload.event_id} - ticket #{verify.payload.ticket_id} for buyer{' '}
          <span className="mono">{verify.payload.buyer}</span>
        </div>
      )}
      {error && <div className="notice notice-error">{error}</div>}
      {success && <div className="notice notice-success">{success}</div>}
    </div>
  )
}
