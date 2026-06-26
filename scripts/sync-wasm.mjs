#!/usr/bin/env node
/**
 * Copy the freshly built `eventpot_contract.wasm` from the Rust target
 * directory into `public/contracts/` so the Next.js dev server can
 * serve it (e.g. for the README link, or for a future pure-browser
 * deploy flow).
 *
 * Run automatically after `npm run contract:build`:
 *   npm run contract:build && npm run wasm:sync
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = resolve(__dirname, '..')
const source = resolve(
  projectRoot,
  'eventpot_contract',
  'target',
  'wasm32v1-none',
  'release',
  'eventpot_contract.wasm',
)
const destination = resolve(projectRoot, 'public', 'contracts', 'eventpot_contract.wasm')

await mkdir(dirname(destination), { recursive: true })
await copyFile(source, destination)

process.stdout.write(`Synced contract wasm to ${destination}\n`)
