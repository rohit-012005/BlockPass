'use client'

/**
 * Tiny data-fetching hook that hits our /api proxy instead of calling
 * the RPC directly. The proxy hides the contract id and centralises
 * error handling.
 */

import { useEffect, useState } from 'react'
import type { EventRecord, EventStats, TicketRecord } from '@/types'

interface FetchState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refresh: () => Promise<void>
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
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

export function useEvent(eventId: number | string | undefined): FetchState<EventRecord> {
  const [data, setData] = useState<EventRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refresh = async () => {
    if (eventId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<EventRecord>(`/api/events/${eventId}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

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

  const refresh = async () => {
    if (eventId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<EventStats>(`/api/events/${eventId}/stats`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

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

  const refresh = async () => {
    if (ticketId == null) return
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<TicketRecord>(`/api/tickets/${ticketId}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

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

  const refresh = async () => {
    if (!buyer) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<TicketRecord[]>(`/api/tickets?buyer=${encodeURIComponent(buyer)}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

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

  const refresh = async () => {
    if (!organizer) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const json = await fetchJson<{ id: number; event: EventRecord }[]>(
        `/api/events?organizer=${encodeURIComponent(organizer)}`,
      )
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizer ?? ''])

  return { data, error, isLoading, refresh }
}
