# BlockPass

> Collect ticket money for a small event on Stellar. Refund everyone automatically if you cancel.

BlockPass is a Next.js + Soroban app for event ticketing with escrow, refunds, and QR check-in. The user story is simple: sell tickets, keep funds locked until the event is resolved, refund cleanly on cancel, and let organizers check in buyers at the door.

## Overview

| Item | Details |
|---|---|
| Product | Event ticketing with escrow + atomic refunds |
| Frontend | Next.js 15, React 19, TypeScript |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Contract | Soroban Rust contract in `blockpass_contract/` |
| Network | Stellar Testnet |
| CI | Lint, typecheck, contract check/test, wasm build |
| Deploy | `scripts/deploy-contract.mjs` |

## What It Does

| Flow | Result |
|---|---|
| Organizer creates event | Event enters sales flow |
| Buyer buys ticket | Funds go to contract escrow |
| Organizer cancels | All active buyers are refunded atomically |
| Organizer confirms | Remaining balance goes to organizer |
| Door scan | QR token is verified, then ticket is checked in on chain |

## Architecture

| Layer | What Lives There |
|---|---|
| UI | Pages, forms, dashboard, ticket views, scanner |
| Shared UI | Buttons, cards, loading states, copy/share helpers |
| Hooks | Wallet state, fetch hooks, telemetry |
| App API | Event reads, ticket reads, QR verify, telemetry, OG image |
| Contract | Soroban business logic for sales, refunds, confirm, check-in |
| Deployment | Build/sync/deploy scripts for contract wasm and env wiring |

### Request Flow

1. Browser loads Next.js UI.
2. UI reads data from app routes or contract-backed helpers.
3. Wallet signs on-chain transactions.
4. Contract executes escrow/refund/check-in logic.
5. Telemetry captures page and action events for basic monitoring.

### Main Pages

| Route | Purpose |
|---|---|
| `/` | Landing page and product overview |
| `/create` | Organizer event creation |
| `/event/[id]` | Public event page, buy/manage/share |
| `/me/tickets` | Wallet-owned tickets and QR codes |
| `/organizer/dashboard` | Organizer summary and event list |
| `/scan/[eventId]` | Door QR verification and check-in |

## Quick Start

```bash
nvm use
npm install
rustup target add wasm32v1-none

npm run contract:build
npm run wasm:sync
npm run ci
npm run dev

export STELLAR_DEPLOYER_SECRET=S…
export CHECKIN_SIGNING_SECRET=$(openssl rand -hex 32)
npm run contract:deploy
```

The deploy script writes `NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID=…` to `.env.local`.

## Contract Details

| Field | Placeholder |
|---|---|
| Contract ID | `C...` |
| Deployment tx | `https://stellar.expert/explorer/testnet/tx/...` |
| Explorer contract link | `https://stellar.expert/explorer/testnet/contract/...` |
| Network | `Stellar Testnet` |
| Deployer account | `G...` |
| Contract version | `blockpass-0.1.0` |

## Live Links

| Link Type | Placeholder |
|---|---|
| Live demo | `https://your-blockpass-demo.vercel.app` |
| Demo video | `https://loom.com/share/your-demo-video` |
| GitHub repo | `https://github.com/rohit-012005/BlockPass` |
| Submission page | `Add your official submission URL here` |

## Screenshots

| Screenshot | Placeholder Path | What It Should Show |
|---|---|---|
| Home page | `screenshots/01-home.png` | Landing page and value proposition |
| Create page mobile | `screenshots/02-create-mobile.png` | Responsive form on phone size |
| Organizer dashboard | `screenshots/03-dashboard.png` | Event stats and actions |
| Ticket QR | `screenshots/04-ticket-qr.png` | QR token and copy/open actions |
| Monitoring | `screenshots/05-monitoring.png` | Telemetry or basic analytics proof |

## Submission Checklist

| Requirement | Status |
|---|---|
| Public GitHub repository | Ready |
| README with architecture and checklist | Ready |
| 15+ meaningful commits | Ready |
| Live demo link | Placeholder |
| Contract deployment address | Placeholder |
| Screenshots | Placeholder |
| Demo video link | Placeholder |
| Proof of 10+ wallet interactions | Placeholder |
| Basic user feedback summary | Ready below |

## User Feedback

The table below documents 10 feedback items and the app-only fix tied to each one.

| # | Feedback | Fix | Commit |
|---|---|---|---|
| 1 | Loading felt blank and abrupt | Added route loading skeletons | `ab4ce6d` |
| 2 | Wallet address needed one-tap copy | Added copy action to wallet button | `a6ec942` |
| 3 | Event and contract links needed sharing | Added event share panel | `c81c981` |
| 4 | Organizer dashboard needed summary view | Added dashboard stats cards | `c9332f6` |
| 5 | Create form needed preview before submit | Added live create preview | `58ab233` |
| 6 | QR token needed easier handling at door | Added copy/open QR actions | `5f06af1` |
| 7 | Scanner needed reset and mismatch guard | Added reset flow and event mismatch check | `e0adf8b` |
| 8 | Header felt cramped on mobile | Added responsive header layout | `2d97486` |
| 9 | Landing page needed better onboarding | Added onboarding cards | `78f7e32` |
| 10 | Submission proof needed monitoring surface | Added telemetry route and page tracking | `cc60367` |

### Feedback Depth

| Theme | What Changed | Why It Matters |
|---|---|---|
| Loading states | Skeletons across main routes | Cuts perceived wait time and makes app feel production-ready |
| Wallet UX | Copy action + clearer connect flow | Reduces friction for users who need to share addresses or verify wallet state |
| Shareability | Event-level copy/share actions | Makes product easier to demo and hand off to reviewers or teammates |
| Organizer visibility | Dashboard summary metrics | Lets organizers understand event health at a glance |
| Creation confidence | Live preview on create page | Helps avoid bad event setup before transaction submission |
| Door flow | QR copy/open actions and scanner reset | Supports real-world check-in use without reloading or confusion |
| Mobile readiness | Responsive header and stacked layout | Keeps UI usable on phones, which is where event operations usually happen |
| Product onboarding | Clear use-case cards on home page | Helps first-time visitors understand the workflow faster |
| Monitoring | Lightweight telemetry endpoint | Gives reviewers proof of operational instrumentation |

## Repository Layout

```text
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

## Notes

- Contract changes are already implemented and should stay untouched for this task.
- Screenshots, live demo, video, and contract address are placeholders until you add real values.
- If you want, I can next turn the placeholder rows into a polished final submission block with your actual links.

## License

MIT
