import {
  serverGetEvent,
  serverListEvents,
  serverListOrganizerEvents,
} from '@/lib/server-contract'
import { jsonError, jsonResponse } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const organizer = url.searchParams.get('organizer')
  if (organizer && !/^G[A-Z2-7]{55}$/.test(organizer)) {
    return jsonError('invalid organizer address', 400)
  }
  try {
    const ids = organizer
      ? await serverListOrganizerEvents(organizer)
      : await serverListEvents()
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
    const message = e instanceof Error ? e.message : 'Failed to load events'
    console.error('[api/events]', { organizer, error: message })
    return jsonError(message, 500)
  }
}
