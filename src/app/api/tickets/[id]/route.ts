import { NextResponse } from 'next/server'
import { serverGetTicket } from '@/lib/server-contract'

export const runtime = 'nodejs'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const ticketId = Number(id)
  if (!Number.isFinite(ticketId) || ticketId <= 0) {
    return NextResponse.json({ error: 'invalid ticket id' }, { status: 400 })
  }
  try {
    const ticket = await serverGetTicket(ticketId)
    if (!ticket) return NextResponse.json({ error: 'ticket not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed to read ticket' },
      { status: 500 },
    )
  }
}
