'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { cancelEvent, confirmEvent, closeSales } from '@/lib/contract'
import type { EventRecord } from '@/types'
import { EVENT_STATUS } from '@/types'

interface Props {
  event: EventRecord
  isOrganizer: boolean
}

export function OrganizerActions({ event, isOrganizer }: Props) {
  const { address, signTransaction } = useWallet()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)

  if (!isOrganizer || !address) return null

  const canClose = event.status === EVENT_STATUS.ON_SALE
  const canConfirm =
    event.status === EVENT_STATUS.ON_SALE ||
    event.status === EVENT_STATUS.SOLD_OUT ||
    event.status === EVENT_STATUS.CONFIRMED
  const canCancel = canConfirm

  const wrap = (label: string, action: () => Promise<{ hash: string }>) => async () => {
    if (!confirm(`${label}? This is a real on-chain action.`)) return
    setBusy(true)
    setError(null)
    try {
      const result = await action()
      setLastTx(result.hash)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${label.toLowerCase()}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="eyebrow">Organizer tools</span>
          <h2 className="h2" style={{ marginTop: '0.5rem' }}>
            Organizer controls
          </h2>
        </div>
        <span className="tag tag-accent">Action center</span>
      </div>
      <p className="muted">You are the organizer of this event.</p>
      <div className="row" style={{ gap: '0.5rem' }}>
        {canClose && (
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={wrap('Close sales', () => closeSales(event.id, address, signTransaction))}
          >
            Close sales
          </button>
        )}
        {canConfirm && (
          <button
            className="btn btn-success"
            disabled={busy}
            onClick={wrap('Confirm event and withdraw', () => confirmEvent(event.id, address, signTransaction))}
          >
            Confirm & withdraw
          </button>
        )}
        {canCancel && (
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={wrap('Cancel event (refund everyone)', () => cancelEvent(event.id, address, signTransaction))}
          >
            Cancel & refund all
          </button>
        )}
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {lastTx && (
        <div className="notice notice-success">
          Last tx: <span className="mono">{lastTx}</span>
        </div>
      )}
    </div>
  )
}
