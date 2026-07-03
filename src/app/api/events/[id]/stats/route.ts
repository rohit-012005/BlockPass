import { NextResponse } from 'next/server'
import { serverGetEventStats } from '@/lib/server-contract'

export const runtime = 'nodejs'

interface Ctx {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const eventId = Number(id)
  if (!Number.isFinite(eventId) || eventId <= 0) {
    return NextResponse.json({ error: 'invalid event id' }, { status: 400 })
  }
  try {
    const stats = await serverGetEventStats(eventId)
    if (!stats) return NextResponse.json({ error: 'event not found' }, { status: 404 })
    return NextResponse.json(stats)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed to read stats' },
      { status: 500 },
    )
  }
}
