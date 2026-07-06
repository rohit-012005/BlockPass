import { z } from 'zod'
import { verifyCheckInToken } from '@/lib/checkin-token'
import { jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  token: z.string().min(8),
  eventId: z.number().int().positive(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'invalid json' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'missing fields' }, { status: 400 })
  }
  const payload = verifyCheckInToken(parsed.data.token)
  if (!payload) {
    return jsonResponse({ ok: false, error: 'invalid or expired token' }, { status: 200 })
  }
  if (payload.event_id !== parsed.data.eventId) {
    return jsonResponse({ ok: false, error: 'event id mismatch' }, { status: 200 })
  }
  return jsonResponse({ ok: true, payload })
}
