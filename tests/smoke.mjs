/**
 * Sanity tests for the formatter helpers. Mirrors `src/lib/format.ts`.
 * Run: `npm test`
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

const EVENT_STATUS = { DRAFT: 0, ON_SALE: 1, SOLD_OUT: 2, CONFIRMED: 3, CANCELLED: 4, REFUNDED: 5 }
const TICKET_STATE = { SOLD: 0, CHECKED_IN: 1, REFUNDED: 2 }

function progressPercent(sold, capacity) {
  if (capacity === 0) return 0
  return Math.max(0, Math.min(100, Math.round((sold / capacity) * 100)))
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

test('progressPercent clamps', () => {
  assert.equal(progressPercent(0, 0), 0)
  assert.equal(progressPercent(5, 10), 50)
  assert.equal(progressPercent(11, 10), 100)
  assert.equal(progressPercent(-1, 10), 0)
})

test('slugify cleans titles', () => {
  assert.equal(slugify('Rooftop comedy night!'), 'rooftop-comedy-night')
  assert.equal(slugify('   ~~~ '), '')
  assert.equal(slugify('Café & Tacos — #1'), 'cafe-tacos-1')
})

test('status codes stable', () => {
  assert.equal(EVENT_STATUS.ON_SALE, 1)
  assert.equal(EVENT_STATUS.CANCELLED, 4)
  assert.equal(TICKET_STATE.SOLD, 0)
  assert.equal(TICKET_STATE.REFUNDED, 2)
})
