/**
 * QR check-in token signing.
 *
 * The organizer scans a ticket's QR code at the door. The QR payload
 * is an HMAC-signed `(ticket_id, event_id, buyer, exp)` tuple signed
 * with a server-side secret. The scan UI verifies the signature and
 * only then asks the user to call `check_in` on the contract.
 *
 * We keep this server-side so the secret never leaves the API route.
 */

import crypto from 'node:crypto'
import type { CheckInTokenPayload } from '@/types'

const ALG = 'sha256'
const VERSION = 'v1'

function getSecret(): string {
  const secret = process.env.CHECKIN_SIGNING_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'CHECKIN_SIGNING_SECRET is not set. Generate one with `openssl rand -hex 32`.',
    )
  }
  return secret
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(input: string): Buffer {
  const pad = (4 - (input.length % 4)) % 4
  const safe = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad)
  return Buffer.from(safe, 'base64')
}

export function signCheckInToken(payload: CheckInTokenPayload): string {
  const json = JSON.stringify(payload)
  const body = b64url(json)
  const sig = b64url(
    crypto.createHmac(ALG, getSecret()).update(`${VERSION}.${body}`).digest(),
  )
  return `${VERSION}.${body}.${sig}`
}

export function verifyCheckInToken(token: string): CheckInTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [version, body, sig] = parts
  if (version !== VERSION) return null
  if (!body || !sig) return null
  const expected = b64url(
    crypto.createHmac(ALG, getSecret()).update(`${VERSION}.${body}`).digest(),
  )
  // constant-time comparison
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(b64urlDecode(body).toString('utf8'))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const candidate = parsed as CheckInTokenPayload
  const now = Math.floor(Date.now() / 1000)
  if (typeof candidate.exp !== 'number' || candidate.exp < now) return null
  if (typeof candidate.ticket_id !== 'number') return null
  if (typeof candidate.event_id !== 'number') return null
  if (typeof candidate.buyer !== 'string') return null
  if (typeof candidate.iat !== 'number') return null
  return candidate
}

export function buildCheckInQrPayload(input: {
  ticket_id: number
  event_id: number
  buyer: string
  ttlSeconds?: number
}): string {
  const now = Math.floor(Date.now() / 1000)
  const ttl = input.ttlSeconds ?? 60 * 60 * 24
  return signCheckInToken({
    ticket_id: input.ticket_id,
    event_id: input.event_id,
    buyer: input.buyer,
    iat: now,
    exp: now + ttl,
  })
}
