/**
 * Node test: HMAC check-in token signing round-trip.
 *
 * We rebuild the helper in plain JS so the test does not need
 * TypeScript transpilation. The production helper lives in
 * `src/lib/checkin-token.ts`; this test pins its behaviour.
 *
 * Run: `npm test`
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

const SECRET = 'a'.repeat(64) // 32 bytes in hex

function b64url(input) {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function b64urlDecode(input) {
  const pad = (4 - (input.length % 4)) % 4
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad), 'base64')
}

function sign(payload) {
  const body = b64url(JSON.stringify(payload))
  const sig = b64url(crypto.createHmac('sha256', SECRET).update(`v1.${body}`).digest())
  return `v1.${body}.${sig}`
}

function verify(token) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [v, body, sig] = parts
  if (v !== 'v1') return null
  const expected = b64url(crypto.createHmac('sha256', SECRET).update(`v1.${body}`).digest())
  if (expected.length !== sig.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
  try {
    return JSON.parse(b64urlDecode(body).toString('utf8'))
  } catch {
    return null
  }
}

test('round-trips a valid payload', () => {
  const payload = { ticket_id: 1, event_id: 2, buyer: 'GABC', iat: 0, exp: 9e15 }
  const token = sign(payload)
  const decoded = verify(token)
  assert.deepEqual(decoded, payload)
})

test('rejects tampered body', () => {
  const payload = { ticket_id: 1, event_id: 2, buyer: 'GABC', iat: 0, exp: 9e15 }
  const token = sign(payload)
  const parts = token.split('.')
  const tampered = `v1.${b64url(JSON.stringify({ ...payload, ticket_id: 999 }))}.${parts[2]}`
  assert.equal(verify(tampered), null)
})

test('rejects wrong signature', () => {
  const payload = { ticket_id: 1, event_id: 2, buyer: 'GABC', iat: 0, exp: 9e15 }
  const token = sign(payload)
  const [v, body] = token.split('.')
  const bad = `${v}.${body}.${b64url('not-a-signature')}`
  assert.equal(verify(bad), null)
})

test('rejects garbage', () => {
  assert.equal(verify('not-a-token'), null)
  assert.equal(verify(''), null)
  assert.equal(verify('a.b'), null)
})
