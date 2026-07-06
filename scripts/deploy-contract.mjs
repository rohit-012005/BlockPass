#!/usr/bin/env node
/**
 * Deploy the BlockPass Soroban contract to Stellar Testnet.
 *
 * 1. Builds the wasm if missing.
 * 2. Uploads the wasm via `Operation.uploadContractWasm`.
 * 3. Creates a new contract instance via `Operation.createCustomContract`.
 * 4. Reads back the contract's `version` method to confirm the deploy.
 * 5. Writes the resulting `contractId` to `.env.local` so the Next.js
 *    app picks it up on the next dev/build.
 *
 * Required env vars:
 *   STELLAR_DEPLOYER_SECRET  — secret key of the deployer account
 *                               (defaults to a freshly-funded random
 *                               account on Testnet)
 *
 * Optional env vars:
 *   STELLAR_RPC_URL
 *   STELLAR_NETWORK_PASSPHRASE
 *   BLOCKPASS_WASM_PATH
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Keypair,
  Networks,
  Operation,
  rpc,
  scValToNative,
  TransactionBuilder,
} from '@stellar/stellar-sdk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const rpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org'
const networkPassphrase =
  process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET
const wasmPath =
  process.env.BLOCKPASS_WASM_PATH ||
  path.resolve(
    projectRoot,
    'blockpass_contract',
    'target',
    'wasm32v1-none',
    'release',
    'blockpass_contract.wasm',
  )

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function toHex(bytes) {
  return Buffer.from(bytes).toString('hex')
}

function log(step, message) {
  console.info(`▶ ${step}: ${message}`)
}

async function getSourceKeypair(_server) {
  const secret = process.env.STELLAR_DEPLOYER_SECRET
  if (secret) {
    return { keypair: Keypair.fromSecret(secret), generated: false }
  }
  const generated = Keypair.random()
  log('fund', `Funding random deployer ${generated.publicKey()} via friendbot`)
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(generated.publicKey())}`,
  )
  if (!res.ok) {
    fail(`Friendbot failed (${res.status})`)
  }
  return { keypair: generated, generated: true }
}

async function sendOperation(server, sourceKeypair, operation) {
  const account = await server.getAccount(sourceKeypair.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build()

  const prepared = await server.prepareTransaction(tx)
  prepared.sign(sourceKeypair)

  const submission = await server.sendTransaction(prepared)
  if (submission.status === 'ERROR' || submission.status === 'TRY_AGAIN_LATER') {
    fail(`Submission failed with status ${submission.status}`)
  }
  const result = await server.pollTransaction(submission.hash, {
    attempts: 60,
    sleepStrategy: (attempt) => Math.min(2000, 500 + attempt * 250),
  })
  if (result.status !== 'SUCCESS') {
    fail(`Transaction ended with status ${result.status}`)
  }
  return { hash: submission.hash, returnValue: result.returnValue }
}

async function uploadContractWasm(server, sourceKeypair, wasm) {
  log('upload', 'Uploading contract wasm…')
  return sendOperation(server, sourceKeypair, Operation.uploadContractWasm({ wasm }))
}

async function deployContract(server, sourceKeypair, wasmHash, saltHex) {
  log('deploy', 'Creating contract instance…')
  return sendOperation(
    server,
    sourceKeypair,
    Operation.createCustomContract({
      wasmHash,
      address: Address.fromString(sourceKeypair.publicKey()),
      salt: Buffer.from(saltHex, 'hex'),
    }),
  )
}

async function readVersion(server, contractId) {
  const account = new Account(Keypair.random().publicKey(), '0')
  const contract = new Contract(contractId)
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call('version'))
    .setTimeout(60)
    .build()
  const result = await server.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(result)) {
    return null
  }
  if (!('result' in result) || !result.result) return null
  return String(scValToNative(result.result.retval))
}

function ensureWasm() {
  if (fs.existsSync(wasmPath)) return
  log('build', 'Wasm not found, building contract…')
  const cargo = spawnSync(
    'cargo',
    [
      'build',
      '--manifest-path',
      path.resolve(projectRoot, 'blockpass_contract', 'Cargo.toml'),
      '--target',
      'wasm32v1-none',
      '--release',
    ],
    { stdio: 'inherit' },
  )
  if (cargo.status !== 0) {
    fail('cargo build failed')
  }
}

function writeEnvLocal(contractId) {
  const envPath = path.resolve(projectRoot, '.env.local')
  let body = ''
  if (fs.existsSync(envPath)) body = fs.readFileSync(envPath, 'utf8')
  const re = /^NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=.*$/m
  const next = re.test(body)
    ? body.replace(re, `NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=${contractId}`)
    : `${body}${body && !body.endsWith('\n') ? '\n' : ''}NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=${contractId}\n`
  fs.writeFileSync(envPath, next)
  log('env', `Wrote NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=${contractId} to .env.local`)
}

async function main() {
  ensureWasm()
  const wasm = fs.readFileSync(wasmPath)
  const server = new rpc.Server(rpcUrl, { allowHttp: false })

  const { keypair, generated } = await getSourceKeypair(server)
  log('identity', `Deployer ${keypair.publicKey()} ${generated ? '(generated)' : '(provided)'}`)

  const upload = await uploadContractWasm(server, keypair, wasm)
  if (!upload.returnValue) fail('Upload returned no wasm hash')
  const wasmHash = upload.returnValue.bytes()

  const deployment = await deployContract(server, keypair, wasmHash, upload.hash)
  if (!deployment.returnValue) fail('Deploy returned no contract address')
  const contractId = Address.fromScAddress(deployment.returnValue.address()).toString()
  log('done', `Contract deployed at ${contractId}`)

  const version = await readVersion(server, contractId)
  if (version) log('verify', `Contract responded with version "${version}"`)
  else log('verify', 'Contract did not respond to version() — check network manually')

  writeEnvLocal(contractId)

  const output = {
    rpcUrl,
    networkPassphrase,
    deployerPublicKey: keypair.publicKey(),
    deployerSecret: generated ? keypair.secret() : 'provided-via-env',
    uploadTxHash: upload.hash,
    wasmHash: toHex(wasmHash),
    deployTxHash: deployment.hash,
    contractId,
    version,
  }
  console.info('\nDeployment summary:')
  console.info(JSON.stringify(output, null, 2))
}

main().catch((e) => {
  fail(e?.message || e)
})
