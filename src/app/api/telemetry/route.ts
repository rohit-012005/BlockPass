import { z } from 'zod'
import { jsonResponse } from '@/lib/api'

const TelemetrySchema = z.object({
  event: z.string().trim().min(1).max(64),
  payload: z
    .object({
      path: z.string().trim().max(512).optional(),
      referrer: z.string().trim().max(512).optional(),
      walletId: z.string().trim().max(64).optional(),
      address: z.string().trim().max(64).optional(),
      contractId: z.string().trim().max(64).optional(),
      method: z.string().trim().max(64).optional(),
      status: z.string().trim().max(64).optional(),
      step: z.string().trim().max(64).optional(),
      eventId: z.number().int().positive().optional(),
      ticketId: z.number().int().positive().optional(),
      error: z.string().trim().max(500).optional(),
    })
    .partial()
    .default({}),
  path: z.string().trim().max(512).optional(),
  ts: z.number().int().nonnegative(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const parsed = TelemetrySchema.safeParse(body)
  if (!parsed.success) {
    return jsonResponse({ ok: false, error: 'invalid telemetry payload' }, { status: 400 })
  }

  console.info('[telemetry]', JSON.stringify(parsed.data))
  return jsonResponse({ ok: true }, { status: 202 })
}
export const dynamic = 'force-dynamic'
