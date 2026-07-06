import { serverGetEvent } from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return jsonError('invalid event id')
  }
  try {
    const event = await serverGetEvent(eventId)
    if (!event) return jsonError('event not found', 404)
    return jsonResponse(event)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'failed to read event'
    console.error('[api/events/:id]', { eventId, error: message })
    return jsonError(message, 500)
  }
}
