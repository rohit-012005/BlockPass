const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const

export function jsonResponse<T>(body: T, init?: ResponseInit) {
  const json = JSON.stringify(body, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  return new Response(json, {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {}),
    },
  })
}

export function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, { status })
}
