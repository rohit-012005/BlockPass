import { serverGetTicket } from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const ticketId = Number(id)
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return jsonError('invalid ticket id')
  }
  try {
    const ticket = await serverGetTicket(ticketId)
    if (!ticket) return jsonError('ticket not found', 404)
    return jsonResponse(ticket)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'failed to read ticket', 500)
  }
}
