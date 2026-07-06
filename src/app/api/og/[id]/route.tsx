import { ImageResponse } from 'next/og'
import { formatUnixDateTime, eventStatusLabel } from '@/lib/format'
import type { EventStatusCode } from '@/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return new Response('Invalid event id', { status: 400 })
  }
  const eventUrl = new URL(`/api/events/${eventId}`, _request.url)
  const res = await fetch(eventUrl, { cache: 'no-store' })
  if (res.status === 404) {
    return new Response('Event not found', { status: 404 })
  }
  if (!res.ok) {
    return new Response('Failed to load event', { status: 502 })
  }
  const event = (await res.json()) as {
    title: string
    venue: string
    description: string
    starts_at: number
    sold: number
    capacity: number
    status: number
  }
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1c1c26 100%)',
          color: '#f5f5f7',
          padding: 60,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#ff5e7e', fontSize: 28, fontWeight: 700 }}>
          BlockPass
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40, flex: 1 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1 }}>{event.title}</div>
          <div style={{ marginTop: 16, fontSize: 28, color: '#a1a1aa' }}>
            {event.venue} · {formatUnixDateTime(event.starts_at)}
          </div>
          <div style={{ marginTop: 12, fontSize: 22, color: '#a1a1aa' }}>
            {event.description}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: '#a1a1aa',
          }}
        >
          <div>{eventStatusLabel(event.status as EventStatusCode)}</div>
          <div>
            {event.sold} / {event.capacity} sold
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
