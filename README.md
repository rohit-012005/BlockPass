# BlockPass

> Collect ticket money for a small event on Stellar. Refund everyone
> automatically if you cancel.

BlockPass is a Next.js + Soroban app that solves one boring real-world
problem: **what happens to the ticket money if the rooftop comedy night
gets rained out?** Instead of manually reversing 30 UPI payments, the
organizer calls `cancel_event` and the contract does 30 SAC transfers
in a single transaction.

## Stack

- **Frontend** — Next.js 15 (App Router) · React 19 · TypeScript
- **Wallet** — `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Lobstr, Albedo, Rabet)
- **Contract** — Soroban (Rust, `no_std`) — `blockpass_contract/`
- **CI** — GitHub Actions: lint, typecheck, contract test, wasm build
- **Deploy** — `scripts/deploy-contract.mjs` (Testnet)

## Routes

| Path | Purpose |
|---|---|
| `/` | Landing page |
| `/create` | Create an event (organizer) |
| `/event/[id]` | Public event page — buy / manage |
| `/me/tickets` | A wallet's tickets with QR codes |
| `/organizer/dashboard` | An organizer's events |
| `/scan/[eventId]` | Door QR check-in |

## Quick start

```bash
nvm use           # use Node 22
npm install
rustup target add wasm32v1-none

# build the contract to wasm
npm run contract:build
npm run wasm:sync

# run all checks
npm run ci

# run the web app
npm run dev

# deploy to Testnet
export STELLAR_DEPLOYER_SECRET=S…
export CHECKIN_SIGNING_SECRET=$(openssl rand -hex 32)
npm run contract:deploy
```

The deploy script writes `NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=…` to
`.env.local` automatically.

## Submission Pack

Use this section as final submission checklist.

Live demo
- `https://your-blockpass-demo.vercel.app`

Demo video
- `https://loom.com/share/your-demo-video`

Contract deployment
- Testnet contract id: `C...`
- Deployment tx: `https://stellar.expert/explorer/testnet/tx/...`

Screenshots
- `docs/submission/screenshots/01-home.png`
- `docs/submission/screenshots/02-create-mobile.png`
- `docs/submission/screenshots/03-analytics-monitoring.png`

User proof
- Wallet interaction proof: `docs/submission/user-interactions.md`
- Feedback summary: `docs/submission/user-feedback.md`

Analytics and monitoring
- Telemetry surface: `src/components/PageTelemetry.tsx`
- Collector endpoint: `src/app/api/telemetry/route.ts`
- Env base URL: `NEXT_PUBLIC_APP_URL`

If any field is still pending, keep placeholder text in those files instead of removing the section.

## Layout

```
src/
  app/                  # Next.js routes
    api/                # JSON + OG endpoints
    event/[id]/         # public event page
    create/             # organizer wizard
    me/tickets/         # wallet's tickets
    organizer/dashboard/
    scan/[eventId]/
  components/           # client + server components
  hooks/                # wallet, data fetching
  lib/                  # stellar, contract, format, signing
  types/                # shared types (event/ticket/error)
blockpass_contract/     # Soroban contract (Rust)
scripts/                # sync-wasm, deploy-contract
public/contracts/       # built wasm (gitignored)
.github/workflows/      # CI + deploy
docs/                   # ARCHITECTURE.md
```

## How cancel-refund works

1. Organizer creates an event with `create_event` (status → `OnSale`).
2. Each `buy_ticket` SAC-transfers the price from the buyer to the
   contract.
3. If the organizer cancels (`cancel_event`), the contract iterates
   `EventTickets(event_id)`, transfers each ticket's price back via the
   SAC, and marks the ticket `Refunded`. If any single transfer fails
   the whole transaction reverts — Soroban is atomic, so you cannot end
   up with a half-refunded event.
4. If the event happens, the organizer calls `confirm_event`, which
   SAC-transfers the remaining balance (sold − refunded × price) to
   the organizer's wallet in a single call.

## How QR check-in works

1. The buyer opens `/me/tickets` and shows the QR.
2. The QR encodes `v1.<b64>.<hmac>` where `b64` is a JSON payload
   `(ticket_id, event_id, buyer, iat, exp)` signed with
   `CHECKIN_SIGNING_SECRET`.
3. The organizer's scanner pastes/scans the QR, hits
   `POST /api/checkin/verify` to validate the HMAC and expiry.
4. If valid, the UI submits `check_in(event_id, ticket_id)` to the
   contract. The contract calls `organizer.require_auth()` and marks
   the ticket `CheckedIn`.

## License

MIT
