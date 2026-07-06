export interface TelemetryPayload {
  path?: string
  referrer?: string
  walletId?: string
  address?: string
  contractId?: string
  method?: string
  status?: string
  step?: string
  eventId?: number
  ticketId?: number
  error?: string
}

export async function trackEvent(event: string, payload: TelemetryPayload = {}): Promise<void> {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    event,
    payload,
    path: window.location.pathname,
    ts: Date.now(),
  })

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/telemetry', blob)
      return
    }
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    // ignore telemetry failures
  }
}
