import { z } from 'zod'
import {
  serverGetEvent,
  serverListOrganizerEvents,
} from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  organizer: z.string().regex(/^G[A-Z2-7]{55}$/),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
  if (!parsed.success) {
    return jsonError('organizer query is required')
  }
  const organizer = parsed.data.organizer
  try {
    const ids = await serverListOrganizerEvents(organizer)
    const events = await Promise.all(
      ids.map(async (id) => {
        const ev = await serverGetEvent(id)
        return ev ? { id, event: ev } : null
      }),
    )
    const filtered = events.filter(
      (x): x is { id: number; event: NonNullable<typeof x>['event'] } => x !== null,
    )
    return jsonResponse(filtered)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : 'Failed to load events', 500)
  }
}
