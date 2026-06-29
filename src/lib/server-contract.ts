/**
 * Server-side contract helpers.
 *
 * These run in API routes / RSC and use the deployed contract id from
 * the server env. They are read-only and do not require wallet
 * signing.
 */

import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder,
} from '@stellar/stellar-sdk'
import type { xdr } from '@stellar/stellar-sdk'
import { NETWORK } from './stellar'
import type { EventRecord, EventStats, TicketRecord } from '@/types'
import { CONTRACT_ERRORS } from '@/types'

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? NETWORK.rpcUrl
const PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? NETWORK.networkPassphrase

function readContractId(): string {
  const id = process.env.NEXT_PUBLIC_EVENTPOT_CONTRACT_ID
  if (!id) {
    throw new Error('NEXT_PUBLIC_EVENTPOT_CONTRACT_ID is not set on the server.')
  }
  return id
}

function server(): rpc.Server {
  return new rpc.Server(RPC_URL, { allowHttp: false })
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'string') return Number(value)
  throw new Error(`Cannot convert ${typeof value} to number`)
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string') return BigInt(value)
  throw new Error(`Cannot convert ${typeof value} to bigint`)
}

function toString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}

function parseEvent(raw: Record<string, unknown>): EventRecord {
  return {
    id: toNumber(raw.id),
    organizer: String(raw.organizer),
    title: toString(raw.title),
    description: toString(raw.description),
    venue: toString(raw.venue),
    starts_at: toNumber(raw.starts_at),
    refund_cutoff: toNumber(raw.refund_cutoff),
    asset: String(raw.asset),
    price: toBigInt(raw.price),
    capacity: toNumber(raw.capacity),
    sold: toNumber(raw.sold),
    refunded: toNumber(raw.refunded),
    status: toNumber(raw.status) as EventRecord['status'],
    created_at: toNumber(raw.created_at),
  }
}

function parseTicket(raw: Record<string, unknown>): TicketRecord {
  return {
    id: toNumber(raw.id),
    event_id: toNumber(raw.event_id),
    buyer: String(raw.buyer),
    price: toBigInt(raw.price),
    state: toNumber(raw.state) as TicketRecord['state'],
    bought_at: toNumber(raw.bought_at),
    checked_in_at: toNumber(raw.checked_in_at),
  }
}

function parseStats(raw: Record<string, unknown>): EventStats {
  return {
    sold: toNumber(raw.sold),
    refunded: toNumber(raw.refunded),
    checked_in: toNumber(raw.checked_in),
    capacity: toNumber(raw.capacity),
    status: toNumber(raw.status) as EventStats['status'],
    collected: toBigInt(raw.collected),
  }
}

function dummySourceAccount(): Account {
  const kp = Keypair.random()
  return new Account(kp.publicKey(), '0')
}

async function simulateRead<T>(
  method: string,
  args: xdr.ScVal[],
  parse: (raw: unknown) => T,
  contractId: string = readContractId(),
): Promise<T> {
  const srv = server()
  const account = dummySourceAccount()
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(60)
    .build()

  const result = await srv.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation error: ${result.error}`)
  }
  if (!('result' in result) || !result.result || !result.result.retval) {
    throw new Error('Simulation did not return a value')
  }
  const native = scValToNative(result.result.retval)
  return parse(native)
}

function scvU64(n: number): xdr.ScVal {
  return nativeToScVal(BigInt(n), { type: 'u64' })
}

function scvAddress(addr: string): xdr.ScVal {
  return Address.fromString(addr).toScVal()
}

export async function serverGetEvent(eventId: number): Promise<EventRecord | null> {
  try {
    return await simulateRead('get_event', [scvU64(eventId)], (raw) =>
      parseEvent(raw as Record<string, unknown>),
    )
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function serverGetTicket(ticketId: number): Promise<TicketRecord | null> {
  try {
    return await simulateRead('get_ticket', [scvU64(ticketId)], (raw) =>
      parseTicket(raw as Record<string, unknown>),
    )
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function serverGetEventStats(eventId: number): Promise<EventStats | null> {
  try {
    return await simulateRead('get_event_stats', [scvU64(eventId)], (raw) =>
      parseStats(raw as Record<string, unknown>),
    )
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

export async function serverListEventTickets(eventId: number): Promise<number[]> {
  return simulateRead('list_event_tickets', [scvU64(eventId)], (raw) => {
    if (!Array.isArray(raw)) return []
    return raw.map((v) => toNumber(v))
  })
}

export async function serverListBuyerTickets(buyer: string): Promise<number[]> {
  return simulateRead('list_buyer_tickets', [scvAddress(buyer)], (raw) => {
    if (!Array.isArray(raw)) return []
    return raw.map((v) => toNumber(v))
  })
}

export async function serverListOrganizerEvents(organizer: string): Promise<number[]> {
  return simulateRead('list_organizer_events', [scvAddress(organizer)], (raw) => {
    if (!Array.isArray(raw)) return []
    return raw.map((v) => toNumber(v))
  })
}

function isNotFound(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message
  if (!message) return false
  if (message.includes('EventNotFound')) return true
  if (message.includes('TicketNotFound')) return true
  if (message.toLowerCase().includes('contract not found')) return true
  return false
}

export function friendlyContractError(message: string): string {
  for (const code of Object.keys(CONTRACT_ERRORS)) {
    const name = CONTRACT_ERRORS[Number(code)]?.name
    if (name && message.includes(name)) {
      return CONTRACT_ERRORS[Number(code)]!.message
    }
  }
  return message
}