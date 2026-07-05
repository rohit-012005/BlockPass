import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.info('[telemetry]', JSON.stringify(body))
  } catch {
    console.info('[telemetry] received malformed payload')
  }
  return NextResponse.json({ ok: true })
}
