import { serverGetEventStats } from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'

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
    const stats = await serverGetEventStats(eventId)
    if (!stats) return jsonError('event not found', 404)
    return jsonResponse(stats)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'failed to read stats', 500)
  }
}
