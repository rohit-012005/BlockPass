/**
 * Time + status formatting helpers.
 *
 * Kept dependency-free so they can be used in both server and client
 * components.
 */

import type { EventStatusCode, TicketStateCode } from '@/types'
import { EVENT_STATUS, TICKET_STATE } from '@/types'

export function formatUnixDateTime(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return '—'
  const date = new Date(unixSeconds * 1000)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatUnixDate(unixSeconds: number): string {
  if (!Number.isFinite(unixSeconds) || unixSeconds <= 0) return '—'
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    dateStyle: 'medium',
  })
}

export function formatRelativeUntil(unixSeconds: number, now = Date.now()): string {
  const diffMs = unixSeconds * 1000 - now
  const past = diffMs < 0
  const absMs = Math.abs(diffMs)
  const minutes = Math.round(absMs / 60_000)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (minutes < 1) return past ? 'just now' : 'in a moment'
  if (minutes < 60) return past ? `${minutes} min ago` : `in ${minutes} min`
  if (hours < 24) return past ? `${hours} h ago` : `in ${hours} h`
  return past ? `${days} d ago` : `in ${days} d`
}

export function eventStatusLabel(status: EventStatusCode): string {
  switch (status) {
    case EVENT_STATUS.DRAFT:
      return 'Draft'
    case EVENT_STATUS.ON_SALE:
      return 'On sale'
    case EVENT_STATUS.SOLD_OUT:
      return 'Sold out'
    case EVENT_STATUS.CONFIRMED:
      return 'Confirmed'
    case EVENT_STATUS.CANCELLED:
      return 'Cancelled'
    case EVENT_STATUS.REFUNDED:
      return 'Refunded'
    default:
      return `Unknown (${status})`
  }
}

export function ticketStateLabel(state: TicketStateCode): string {
  switch (state) {
    case TICKET_STATE.SOLD:
      return 'Active'
    case TICKET_STATE.CHECKED_IN:
      return 'Checked in'
    case TICKET_STATE.REFUNDED:
      return 'Refunded'
    default:
      return `Unknown (${state})`
  }
}

export function progressPercent(sold: number, capacity: number): number {
  if (capacity === 0) return 0
  const ratio = sold / capacity
  return Math.max(0, Math.min(100, Math.round(ratio * 100)))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

export function formatTokenAmount(amount: bigint, decimals = 7): string {
  const isNegative = amount < 0n
  const abs = isNegative ? -amount : amount
  const base = 10n ** BigInt(decimals)
  const whole = abs / base
  const frac = abs % base
  if (decimals === 0) return (isNegative ? '-' : '') + whole.toString()
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '')
  const display = fracStr.length === 0 ? whole.toString() : `${whole.toString()}.${fracStr}`
  return isNegative ? `-${display}` : display
}
