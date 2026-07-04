import { NextResponse } from 'next/server'
import { z } from 'zod'
import { serverListBuyerTickets, serverGetTicket } from '@/lib/server-contract'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  buyer: z.string().regex(/^G[A-Z2-7]{55}$/),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'buyer query is required' }, { status: 400 })
  }
  const buyer = parsed.data.buyer
  try {
    const ids = await serverListBuyerTickets(buyer)
    const tickets = await Promise.all(ids.map((id) => serverGetTicket(id)))
    return NextResponse.json(
      tickets.filter((t): t is NonNullable<typeof t> => t !== null),
    )
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed to load tickets' },
      { status: 500 },
    )
  }
}
