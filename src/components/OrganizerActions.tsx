'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { cancelEvent, confirmEvent, closeSales } from '@/lib/contract'
import type { EventRecord } from '@/types'
import { EVENT_STATUS } from '@/types'

interface Props {
  event: EventRecord
}

export function OrganizerActions({ event }: Props) {
  const { address, signTransaction } = useWallet()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTx, setLastTx] = useState<string | null>(null)
  const isOrganizer = address === event.organizer

  if (!isOrganizer || !address) return null

  const canClose = event.status === EVENT_STATUS.ON_SALE
  const canConfirm =
    event.status === EVENT_STATUS.ON_SALE ||
    event.status === EVENT_STATUS.SOLD_OUT ||
    event.status === EVENT_STATUS.CONFIRMED
  const canCancel = canConfirm

  const wrap =
    (label: string, action: () => Promise<{ hash: string }>) =>
    async () => {
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
    <div className="space-y-4">
      <p className="m-0 text-sm leading-7 text-[var(--text-dim)]">You are the organizer of this event.</p>

      <div className="flex flex-wrap gap-3">
        {canClose && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={wrap('Close sales', () => closeSales(event.id, address, signTransaction))}
          >
            Close sales
          </button>
        )}
        {canConfirm && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8ddf72,#5cbf4b)] px-4 py-3 font-semibold text-[#103013] shadow-[0_10px_24px_rgba(92,191,75,0.22)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={wrap('Confirm event and withdraw', () => confirmEvent(event.id, address, signTransaction))}
          >
            Confirm & withdraw
          </button>
        )}
        {canCancel && (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffb3b3,#f06b6b)] px-4 py-3 font-semibold text-[#3d0f0f] shadow-[0_10px_24px_rgba(240,107,107,0.18)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            onClick={wrap('Cancel event (refund everyone)', () => cancelEvent(event.id, address, signTransaction))}
          >
            Cancel & refund all
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-[24px] border border-[rgba(220,72,72,0.24)] bg-[rgba(255,240,240,0.92)] p-4 text-sm text-[#b94a4a]">
          {error}
        </div>
      )}
      {lastTx && (
        <div className="rounded-[24px] border border-[rgba(108,198,58,0.24)] bg-[rgba(145,216,79,0.08)] p-4 text-sm text-[var(--text)]">
          Last tx: <span className="font-mono break-all">{lastTx}</span>
        </div>
      )}
    </div>
  )
}
