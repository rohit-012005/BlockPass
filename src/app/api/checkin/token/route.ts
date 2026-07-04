import { NextResponse } from 'next/server'
import { z } from 'zod'
import { buildCheckInQrPayload } from '@/lib/checkin-token'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  ticket_id: z.coerce.number().int().positive(),
  event_id: z.coerce.number().int().positive(),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: 'ticket_id and event_id are required' }, { status: 400 })
  }
  try {
    const payload = buildCheckInQrPayload({
      ticket_id: parsed.data.ticket_id,
      event_id: parsed.data.event_id,
      buyer: 'self',
    })
    return NextResponse.json({ qrPayload: payload })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed to sign token' },
      { status: 500 },
    )
  }
}
