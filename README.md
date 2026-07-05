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

## Architecture

BlockPass is a two-tier app:

```
Browser
  -> Next.js App Router + React UI
  -> /api routes for events, tickets, check-in, OG, telemetry
  -> Soroban RPC reads + signed transactions
  -> BlockPass contract on Stellar Testnet
```

### Frontend
- App Router pages in `src/app/`
- Shared UI in `src/components/`
- Wallet + telemetry hooks in `src/hooks/`
- Stellar helpers in `src/lib/`

### Contract layer
- Soroban contract in `blockpass_contract/`
- Current app reads deployed contract id from `NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID`
- Deploy script writes id into `.env.local`

### Main flows
1. Organizer creates event.
2. Buyer buys ticket, funds go into escrow.
3. Organizer cancels, contract atomically refunds active tickets.
4. Organizer confirms event, remaining balance goes to organizer.
5. Buyer shows QR, organizer verifies token, then check-in happens on chain.

### Operational surfaces
- Loading states: route-level skeletons
- Monitoring: `src/app/api/telemetry/route.ts`
- Client telemetry: `src/components/PageTelemetry.tsx`
- Mobile support: responsive header + card layouts

## Submission Pack

Fill these fields before final submission.

- Live demo: `https://your-blockpass-demo.vercel.app`
- Demo video: `https://loom.com/share/your-demo-video`
- Contract id: `C...`
- Deployment tx: `https://stellar.expert/explorer/testnet/tx/...`
- Screenshots:
  - `docs/submission/screenshots/01-home.png`
  - `docs/submission/screenshots/02-create-mobile.png`
  - `docs/submission/screenshots/03-analytics-monitoring.png`
- Wallet proof: `10+ wallet interactions`
- Feedback summary: see section below

## User Feedback

These are the 10 polish items we used to drive app fixes.

1. "Blank loading felt rough." Fixed in `ab4ce6d` with route loading skeletons.
2. "I need to copy my wallet address fast." Fixed in `a6ec942` with copy action in wallet button.
3. "Share event / contract links should be one tap." Fixed in `c81c981` with event share actions.
4. "Organizer dashboard should show summary, not just cards." Fixed in `c9332f6` with stats cards.
5. "Create form needs preview before submit." Fixed in `58ab233` with live preview panel.
6. "QR code should be easier to handle at the door." Fixed in `5f06af1` with copy/open QR actions.
7. "Scanner should reset fast and flag wrong event token." Fixed in `e0adf8b` with mismatch guard and reset.
8. "Header should behave better on mobile." Fixed in `2d97486` with responsive layout.
9. "Landing page should guide first-time users." Fixed in `78f7e32` with onboarding cards.
10. "We need monitoring plus a submission checklist in repo." Fixed in `cc60367` with telemetry and submission docs.

## Repository Layout

```
src/
  app/
  components/
  hooks/
  lib/
  types/
blockpass_contract/
scripts/
public/contracts/
.github/workflows/
README.md
```

## License

MIT
