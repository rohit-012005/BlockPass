/**
 * Browser-side contract client.
 *
 * Wraps `@stellar/stellar-sdk` so the rest of the app calls one
 * function per contract method. The wallet kit is used to sign auth
 * entries.
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
import type { Transaction, xdr } from '@stellar/stellar-sdk'
import type {
  CreateEventInput,
  EventRecord,
  EventStats,
  TicketRecord,
} from '@/types'
import { CONTRACT_ID, NETWORK } from './stellar'

export function getContractId(override?: string): string {
  const id = override ?? CONTRACT_ID
  if (!id) {
    throw new Error(
      'NEXT_PUBLIC_EVENTPOT_CONTRACT_ID is not set. Set it in .env.local or pass an override.',
    )
  }
  return id
}

function server(): rpc.Server {
  return new rpc.Server(NETWORK.rpcUrl, { allowHttp: false })
}

function contract(id: string): Contract {
  return new Contract(id)
}

function dummySourceAccount(): Account {
  const kp = Keypair.random()
  return new Account(kp.publicKey(), '0')
}

type SignFn = (xdrBase64: string) => Promise<string>

async function invoke(
  method: string,
  args: xdr.ScVal[],
  signer: SignFn,
  source: string,
  contractId: string = getContractId(),
): Promise<{ hash: string; returnValue: xdr.ScVal | undefined }> {
  const srv = server()
  const account = await srv.getAccount(source)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(60)
    .build()

  const prepared = await srv.prepareTransaction(tx)
  const signedXdr = await signer(prepared.toXDR())
  const signed = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase) as Transaction
  const submitted = await srv.sendTransaction(signed)
  if (submitted.status === 'ERROR' || submitted.status === 'TRY_AGAIN_LATER') {
    throw new Error(`Submit failed with status ${submitted.status}`)
  }
  const result = await srv.pollTransaction(submitted.hash, {
    attempts: 60,
    sleepStrategy: (attempt: number) => Math.min(2000, 500 + attempt * 250),
  })
  if (result.status !== 'SUCCESS') {
    throw new Error(`Transaction failed with status ${result.status}`)
  }
  return { hash: submitted.hash, returnValue: result.returnValue }
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

function toAddress(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected address string, got ${typeof value}`)
  }
  return value
}

function parseEvent(raw: Record<string, unknown>): EventRecord {
  return {
    id: toNumber(raw.id),
    organizer: toAddress(raw.organizer),
    title: toString(raw.title),
    description: toString(raw.description),
    venue: toString(raw.venue),
    starts_at: toNumber(raw.starts_at),
    refund_cutoff: toNumber(raw.refund_cutoff),
    asset: toAddress(raw.asset),
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
    buyer: toAddress(raw.buyer),
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

function parseIdList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v) => toNumber(v))
}

async function readMethod<T>(
  method: string,
  args: xdr.ScVal[],
  parse: (raw: unknown) => T,
  contractId: string = getContractId(),
): Promise<T> {
  const srv = server()
  const account = dummySourceAccount()
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.networkPassphrase,
  })
    .addOperation(contract(contractId).call(method, ...args))
    .setTimeout(60)
    .build()

  const result = await srv.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(result)) {
    throw new Error(`Simulation error: ${result.error}`)
  }
  if (!('result' in result) || !result.result) {
    throw new Error('Simulation did not return a value.')
  }
  const native = scValToNative(result.result.retval)
  return parse(native)
}

function scvAddress(addr: string): xdr.ScVal {
  return Address.fromString(addr).toScVal()
}

function scvU64(n: number | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(n), { type: 'u64' })
}

function scvU32(n: number): xdr.ScVal {
  return nativeToScVal(n, { type: 'u32' })
}

function scvI128(n: bigint): xdr.ScVal {
  return nativeToScVal(n, { type: 'i128' })
}

function scvString(s: string): xdr.ScVal {
  return nativeToScVal(s, { type: 'string' })
}

export async function getEvent(eventId: number): Promise<EventRecord> {
  return readMethod('get_event', [scvU64(eventId)], (raw) =>
    parseEvent(raw as Record<string, unknown>),
  )
}

export async function getTicket(ticketId: number): Promise<TicketRecord> {
  return readMethod('get_ticket', [scvU64(ticketId)], (raw) =>
    parseTicket(raw as Record<string, unknown>),
  )
}

export async function getEventStats(eventId: number): Promise<EventStats> {
  return readMethod('get_event_stats', [scvU64(eventId)], (raw) =>
    parseStats(raw as Record<string, unknown>),
  )
}

export async function listEventTickets(eventId: number): Promise<number[]> {
  return readMethod('list_event_tickets', [scvU64(eventId)], parseIdList)
}

export async function listBuyerTickets(buyer: string): Promise<number[]> {
  return readMethod('list_buyer_tickets', [scvAddress(buyer)], parseIdList)
}

export async function listOrganizerEvents(organizer: string): Promise<number[]> {
  return readMethod('list_organizer_events', [scvAddress(organizer)], parseIdList)
}

export async function createEvent(
  input: CreateEventInput,
  organizer: string,
  signer: SignFn,
): Promise<{ hash: string; eventId: number }> {
  const result = await invoke(
    'create_event',
    [
      scvAddress(organizer),
      scvString(input.title),
      scvString(input.description),
      scvString(input.venue),
      scvU64(input.starts_at),
      scvU64(input.refund_cutoff),
      scvAddress(input.asset),
      scvI128(input.price),
      scvU32(input.capacity),
      scvU32(input.max_per_buyer),
    ],
    signer,
    organizer,
  )
  if (!result.returnValue) {
    throw new Error('create_event did not return a value')
  }
  const id = toNumber(scValToNative(result.returnValue))
  return { hash: result.hash, eventId: id }
}

export async function buyTicket(
  eventId: number,
  buyer: string,
  signer: SignFn,
): Promise<{ hash: string; ticketId: number }> {
  const result = await invoke('buy_ticket', [scvAddress(buyer), scvU64(eventId)], signer, buyer)
  if (!result.returnValue) {
    throw new Error('buy_ticket did not return a value')
  }
  return { hash: result.hash, ticketId: toNumber(scValToNative(result.returnValue)) }
}

export async function refundTicket(
  ticketId: number,
  buyer: string,
  signer: SignFn,
): Promise<{ hash: string }> {
  const result = await invoke('refund_ticket', [scvAddress(buyer), scvU64(ticketId)], signer, buyer)
  return { hash: result.hash }
}

export async function cancelEvent(
  eventId: number,
  organizer: string,
  signer: SignFn,
): Promise<{ hash: string }> {
  const result = await invoke(
    'cancel_event',
    [scvAddress(organizer), scvU64(eventId)],
    signer,
    organizer,
  )
  return { hash: result.hash }
}

export async function confirmEvent(
  eventId: number,
  organizer: string,
  signer: SignFn,
): Promise<{ hash: string }> {
  const result = await invoke(
    'confirm_event',
    [scvAddress(organizer), scvU64(eventId)],
    signer,
    organizer,
  )
  return { hash: result.hash }
}

export async function closeSales(
  eventId: number,
  organizer: string,
  signer: SignFn,
): Promise<{ hash: string }> {
  const result = await invoke(
    'close_sales',
    [scvAddress(organizer), scvU64(eventId)],
    signer,
    organizer,
  )
  return { hash: result.hash }
}

export async function checkIn(
  ticketId: number,
  organizer: string,
  signer: SignFn,
): Promise<{ hash: string }> {
  const result = await invoke(
    'check_in',
    [scvAddress(organizer), scvU64(ticketId)],
    signer,
    organizer,
  )
  return { hash: result.hash }
}

export async function getContractVersion(contractId: string = getContractId()): Promise<string> {
  const version = await readMethod<string>('version', [], (v) => toString(v), contractId)
  return version
}
