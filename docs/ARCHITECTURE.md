# Event Pot — Architecture

## Overview

Event Pot is a small two-tier app: a **Next.js (App Router) + TypeScript**
frontend, and a **Soroban smart contract** that holds ticket money in
escrow and refunds atomically on cancel.

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser                                   │
│   React Server + Client Components · StellarWalletsKit · Zod     │
│   /api routes: events, tickets, checkin, og                      │
└──────────────────────────────────────────────────────────────────┘
                │ fetch (JSON)                    ▲
                ▼                                 │ signed tx
┌──────────────────────────────────────────────────────────────────┐
│                Next.js (Node + Edge runtimes)                     │
│  /api/* proxy + HMAC check-in token + OG image                   │
└──────────────────────────────────────────────────────────────────┘
                │ simulateTransaction             │ submit signed tx
                ▼                                 │
┌──────────────────────────────────────────────────────────────────┐
│   Stellar Soroban RPC  ────►  Event Pot Contract (Rust)          │
│   • SAC transfer_in (buy_ticket)                                  │
│   • SAC transfer_out (refund_ticket / cancel_event)              │
│   • SAC transfer_out (confirm_event → organizer)                 │
└──────────────────────────────────────────────────────────────────┘
```

## Soroban Contract (`eventpot_contract/`)

| Method | Auth | Purpose |
|---|---|---|
| `create_event` | organizer | new event in `OnSale` |
| `open_sales` / `close_sales` | organizer | state transitions |
| `buy_ticket` | buyer | SAC-transfer `price` to escrow, mint a ticket |
| `refund_ticket` | buyer (owner) | SAC-transfer `price` back to buyer (before cutoff) |
| `cancel_event` | organizer | SAC-transfer back to **all** active buyers, atomically |
| `confirm_event` | organizer | SAC-transfer the remaining balance to organizer |
| `check_in` | organizer | mark a ticket as `CheckedIn` |
| `get_event*` / `list_*` | public | read-only getters |
| `version` | public | contract version string |

### Event lifecycle

```
Draft ──► OnSale ──► SoldOut ──► Confirmed
                  │                  │
                  └──► Cancelled ◄──┘
                       (full atomic refund)
```

### Ticket lifecycle

```
Sold ──► CheckedIn
   │
   └──► Refunded  (self-refund or cancel-batch)
```

## Next.js App

| Route | Purpose |
|---|---|
| `/` | Landing — explains the app, shows contract stats |
| `/create` | Wizard for organizers to create an event |
| `/event/[id]` | Public event page — buy / view / (organizer) manage |
| `/me/tickets` | A connected wallet's tickets + QR codes |
| `/organizer/dashboard` | A connected organizer's events |
| `/scan/[eventId]` | Door check-in scanner |
| `/api/events/*` | JSON proxy to contract reads |
| `/api/tickets/*` | JSON proxy to ticket reads |
| `/api/checkin/*` | Sign and verify check-in QR tokens |
| `/api/og/[id]` | OpenGraph image (Edge runtime) |

## QR Check-in

Each ticket page calls `GET /api/checkin/token?ticket_id=…&event_id=…`
which returns a signed HMAC payload:

```
v1.<base64url(json)>.<base64url(hmac-sha256)>
```

The payload includes `(ticket_id, event_id, buyer, iat, exp)`. The
organizer's scan page calls `POST /api/checkin/verify` before any
on-chain action; the server verifies the HMAC and only then does the
client submit `check_in` to the contract.

## CI

`.github/workflows/ci.yml` runs on every push/PR:
- frontend: `npm ci` → `lint` → `typecheck` → `build`
- contract: `cargo check` → `cargo test` → `cargo build --target wasm32v1-none --release`

`.github/workflows/deploy.yml` is `workflow_dispatch` only and deploys
to Testnet using a supplied deployer secret.

## Local development

```bash
# one-time
nvm use
npm install
rustup target add wasm32v1-none

# contract
npm run contract:check
npm run contract:test
npm run contract:build
npm run wasm:sync

# frontend
npm run dev

# deploy to testnet
export CHECKIN_SIGNING_SECRET=$(openssl rand -hex 32)
export STELLAR_DEPLOYER_SECRET=S…
npm run contract:deploy
```
