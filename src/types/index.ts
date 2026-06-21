/**
 * Shared types for the Event Pot frontend.
 *
 * These mirror the Soroban contract's on-chain shapes. Numbers are
 * exposed as JS `number` (safe for our domain: event ids, ticket
 * counts) and `bigint` for token amounts (i128). Strings from the
 * contract come back as raw `string` here.
 */

export const EVENT_STATUS = {
  DRAFT: 0,
  ON_SALE: 1,
  SOLD_OUT: 2,
  CONFIRMED: 3,
  CANCELLED: 4,
  REFUNDED: 5,
} as const

export type EventStatusCode = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

export const TICKET_STATE = {
  SOLD: 0,
  CHECKED_IN: 1,
  REFUNDED: 2,
} as const

export type TicketStateCode = (typeof TICKET_STATE)[keyof typeof TICKET_STATE]

export interface EventRecord {
  id: number
  organizer: string
  title: string
  description: string
  venue: string
  starts_at: number
  refund_cutoff: number
  asset: string
  price: bigint
  capacity: number
  sold: number
  refunded: number
  status: EventStatusCode
  created_at: number
}

export interface TicketRecord {
  id: number
  event_id: number
  buyer: string
  price: bigint
  state: TicketStateCode
  bought_at: number
  checked_in_at: number
}

export interface EventStats {
  sold: number
  refunded: number
  checked_in: number
  capacity: number
  status: EventStatusCode
  collected: bigint
}

export interface ContractErrorMapping {
  code: number
  name: string
  message: string
}

export const CONTRACT_ERRORS: Record<number, ContractErrorMapping> = {
  1: { code: 1, name: 'InvalidText', message: 'A required text field is empty.' },
  2: { code: 2, name: 'InvalidCapacity', message: 'Capacity must be at least 1.' },
  3: { code: 3, name: 'InvalidPrice', message: 'Price must be a positive amount.' },
  4: { code: 4, name: 'InvalidTimestamps', message: 'Refund cutoff must be before start time.' },
  5: { code: 5, name: 'NotOrganizer', message: 'Only the event organizer can do that.' },
  6: { code: 6, name: 'EventNotFound', message: 'No event with that id.' },
  7: { code: 7, name: 'TicketNotFound', message: 'No ticket with that id.' },
  8: { code: 8, name: 'EventNotOnSale', message: 'Ticket sales are not open for this event.' },
  9: { code: 9, name: 'SoldOut', message: 'This event is sold out.' },
  10: { code: 10, name: 'NotTicketOwner', message: 'You are not the owner of this ticket.' },
  11: {
    code: 11,
    name: 'RefundCutoffPassed',
    message: 'The self-refund window has closed.',
  },
  12: { code: 12, name: 'InvalidState', message: 'This action is not allowed in the current state.' },
  13: { code: 13, name: 'Overflow', message: 'A calculation overflowed. Please report this bug.' },
  14: {
    code: 14,
    name: 'ExceedsPerBuyerLimit',
    message: 'You have reached the per-buyer ticket cap.',
  },
  15: { code: 15, name: 'InvalidPerBuyerLimit', message: 'Per-buyer limit must be at least 1.' },
}

export function decodeContractError(code: number | bigint | undefined | null): ContractErrorMapping {
  const n = typeof code === 'bigint' ? Number(code) : (code ?? 0)
  return (
    CONTRACT_ERRORS[n] ?? {
      code: n,
      name: 'Unknown',
      message: `The contract returned error code ${n}.`,
    }
  )
}

export interface CreateEventInput {
  title: string
  description: string
  venue: string
  starts_at: number
  refund_cutoff: number
  asset: string
  price: bigint
  capacity: number
  max_per_buyer: number
}

export interface CheckInTokenPayload {
  ticket_id: number
  event_id: number
  buyer: string
  iat: number
  exp: number
}

export interface PublicEventCard {
  id: number
  title: string
  venue: string
  starts_at: number
  status: EventStatusCode
  sold: number
  capacity: number
  price: bigint
  asset: string
}
