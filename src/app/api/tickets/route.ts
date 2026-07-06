import { z } from 'zod'
import { serverListBuyerTickets, serverGetTicket } from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  buyer: z.string().regex(/^G[A-Z2-7]{55}$/),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return jsonError('buyer query is required')
  }
  const buyer = parsed.data.buyer
  try {
    const ids = await serverListBuyerTickets(buyer)
    const tickets = await Promise.all(ids.map((id) => serverGetTicket(id)))
    return jsonResponse(
      tickets.filter((t): t is NonNullable<typeof t> => t !== null),
    )
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'failed to load tickets', 500)
  }
}
