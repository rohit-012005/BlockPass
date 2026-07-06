import { z } from 'zod'
import { buildCheckInQrPayload } from '@/lib/checkin-token'
import { jsonError, jsonResponse } from '@/lib/api'
import { serverGetTicket } from '@/lib/server-contract'
import { TICKET_STATE } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  ticket_id: z.coerce.number().int().positive(),
  event_id: z.coerce.number().int().positive(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return jsonError('ticket_id and event_id are required')
  }
  try {
    const ticket = await serverGetTicket(parsed.data.ticket_id)
    if (!ticket) {
      return jsonError('ticket not found', 404)
    }
    if (ticket.event_id !== parsed.data.event_id) {
      return jsonError('ticket does not belong to this event', 409)
    }
    if (ticket.state !== TICKET_STATE.SOLD) {
      return jsonError('ticket is not active', 409)
    }

    const payload = buildCheckInQrPayload({
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      buyer: ticket.buyer,
    })
    return jsonResponse({ qrPayload: payload })
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'failed to sign token', 500)
  }
}
