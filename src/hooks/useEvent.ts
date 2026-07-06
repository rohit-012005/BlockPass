'use client'

/**
 * Tiny data-fetching hook that hits our /api proxy instead of calling
 * the RPC directly. The proxy hides the contract id and centralises
 * error handling.
 */

import { useCallback, useEffect, useState } from 'react'
import type { EventRecord, EventStats, TicketRecord } from '@/types'
import { trackEvent } from '@/lib/telemetry'
import { CONTRACT_ID } from '@/lib/stellar'

interface FetchState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refresh: () => Promise<void>
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body?.error) message = body.error
    } catch {
      // body wasn't json
    }
    throw new Error(message)
  }
  return (await res.json()) as T
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value)
  throw new Error(`Cannot convert ${typeof value} to bigint`)
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  throw new Error(`Cannot convert ${typeof value} to number`)
}

function toString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

function normalizeEvent(raw: unknown): EventRecord {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid event payload')
  const event = raw as Record<string, unknown>
  return {
    id: toNumber(event.id),
    organizer: toString(event.organizer),
    title: toString(event.title),
    description: toString(event.description),
    venue: toString(event.venue),
    starts_at: toNumber(event.starts_at),
    refund_cutoff: toNumber(event.refund_cutoff),
    asset: toString(event.asset),
    price: toBigInt(event.price),
    capacity: toNumber(event.capacity),
    sold: toNumber(event.sold),
    refunded: toNumber(event.refunded),
    status: toNumber(event.status) as EventRecord['status'],
    created_at: toNumber(event.created_at),
  }
}

function normalizeStats(raw: unknown): EventStats {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid stats payload')
  const stats = raw as Record<string, unknown>
  return {
    sold: toNumber(stats.sold),
    refunded: toNumber(stats.refunded),
    checked_in: toNumber(stats.checked_in),
    capacity: toNumber(stats.capacity),
    status: toNumber(stats.status) as EventStats['status'],
    collected: toBigInt(stats.collected),
  }
}

function normalizeTicket(raw: unknown): TicketRecord {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid ticket payload')
  const ticket = raw as Record<string, unknown>
  return {
    id: toNumber(ticket.id),
    event_id: toNumber(ticket.event_id),
    buyer: toString(ticket.buyer),
    price: toBigInt(ticket.price),
    state: toNumber(ticket.state) as TicketRecord['state'],
    bought_at: toNumber(ticket.bought_at),
    checked_in_at: toNumber(ticket.checked_in_at),
  }
}

function normalizeOrganizerEvents(raw: unknown): { id: number; event: EventRecord }[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid organizer events payload')
    const item = entry as Record<string, unknown>
    return {
      id: toNumber(item.id),
      event: normalizeEvent(item.event),
    }
  })
}

export function useEvent(eventId: number | string | undefined): FetchState<EventRecord> {
  const [data, setData] = useState<EventRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (eventId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown>(`/api/events/${eventId}`)
      setData(normalizeEvent(json))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load event'
      setError(message)
      console.error('[useEvent] event load failed', {
        eventId,
        contractId: CONTRACT_ID,
        error: message,
      })
      void trackEvent('event_read_error', {
        eventId: typeof eventId === 'number' ? eventId : Number(eventId),
        contractId: CONTRACT_ID,
        method: 'get_event',
        error: message,
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof eventId === 'string' ? eventId : eventId?.toString()])

  return { data, error, isLoading, refresh }
}

export function useEventStats(eventId: number | string | undefined): FetchState<EventStats> {
  const [data, setData] = useState<EventStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (eventId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown>(`/api/events/${eventId}/stats`)
      setData(normalizeStats(json))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load stats'
      setError(message)
      console.error('[useEventStats] stats load failed', {
        eventId,
        contractId: CONTRACT_ID,
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof eventId === 'string' ? eventId : eventId?.toString()])

  return { data, error, isLoading, refresh }
}

export function useTicket(ticketId: number | string | undefined): FetchState<TicketRecord> {
  const [data, setData] = useState<TicketRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (ticketId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown>(`/api/tickets/${ticketId}`)
      setData(normalizeTicket(json))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load ticket'
      setError(message)
      console.error('[useTicket] ticket load failed', {
        ticketId,
        contractId: CONTRACT_ID,
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof ticketId === 'string' ? ticketId : ticketId?.toString()])

  return { data, error, isLoading, refresh }
}

export function useBuyerTickets(buyer: string | null | undefined): FetchState<TicketRecord[]> {
  const [data, setData] = useState<TicketRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!buyer) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown[]>(`/api/tickets?buyer=${encodeURIComponent(buyer)}`)
      setData(json.map((item) => normalizeTicket(item)))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load tickets'
      setError(message)
      console.error('[useBuyerTickets] tickets load failed', {
        buyer,
        contractId: CONTRACT_ID,
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [buyer])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyer ?? ''])

  return { data, error, isLoading, refresh }
}

export function useOrganizerEvents(
  organizer: string | null | undefined,
): FetchState<{ id: number; event: EventRecord }[]> {
  const [data, setData] = useState<{ id: number; event: EventRecord }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!organizer) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown[]>(
        `/api/events?organizer=${encodeURIComponent(organizer)}`,
      )
      setData(normalizeOrganizerEvents(json))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load events'
      setError(message)
      console.error('[useOrganizerEvents] organizer events load failed', {
        organizer,
        contractId: CONTRACT_ID,
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [organizer])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizer ?? ''])

  return { data, error, isLoading, refresh }
}

export function usePublicEvents(): FetchState<{ id: number; event: EventRecord }[]> {
  const [data, setData] = useState<{ id: number; event: EventRecord }[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<unknown[]>('/api/events')
      setData(normalizeOrganizerEvents(json))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load events'
      setError(message)
      console.error('[usePublicEvents] public events load failed', {
        contractId: CONTRACT_ID,
        error: message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error, isLoading, refresh }
}
