# BlockPass

## Live Links

| Link Type | Placeholder |
|---|---|
| Live demo | `https://your-blockpass-demo.vercel.app` |
| Demo video | `https://drive.google.com/file/d/1M8y0pNC1_RvHA9HEfERPk6d3j2A4XMG4/view?usp=sharing` |

BlockPass is a Next.js + Soroban app for event ticketing with escrow, refunds, and QR check-in.
The product idea came from a simple problem: independent event organizers need a low-cost way to
collect payments, manage cancellations, and issue refunds without manual coordination.

BlockPass is the current product name. The underlying use case is the same: ticket payments stay
in escrow until the event is completed, and if the event is canceled, attendees get refunded
automatically.

## 1. Problem

Independent event organizers often face friction when collecting payments, managing cancellations,
and issuing refunds. Traditional ticketing platforms charge significant service fees, while direct
UPI or bank transfers force organizers to manually process refunds when plans change.

BlockPass removes that friction with a blockchain escrow flow. Ticket payments stay locked until
the event is successfully completed. If an event is canceled, attendees receive refunds
automatically without requiring manual intervention from the organizer.

## 2. Why Stellar?

BlockPass uses Stellar because it gives the product the properties this use case needs:

| Stellar Property | Why It Matters |
|---|---|
| Fast finality | Ticket purchases and refunds settle in seconds, which keeps the event flow responsive |
| Low fees | Small events can’t afford heavy platform fees or expensive on-chain actions |
| Native USDC support | Ticket pricing can stay stable and predictable |
| Soroban smart contracts | Escrow, refunds, and organizer payouts can be encoded transparently on chain |
| Micro-payment fit | Ticket sales and partial refunds are a natural fit for Stellar’s payment model |

## 3. Target Audience

BlockPass is designed for:

| Audience | Use Case |
|---|---|
| Independent organizers | Workshops, meetups, house parties, comedy nights, local performances |
| Communities and clubs | Paid gatherings with simple ticket collection |
| Student groups | Event participation fees and campus activities |
| Travel and reunion planners | Small groups collecting money before an event |
| Small event operators | A lower-cost alternative to centralized ticketing platforms |

## 4. System Architecture

### Frontend

The web app includes:

| Frontend Area | What It Does |
|---|---|
| Event creation | Organizers create and publish events |
| Public event page | Buyers purchase tickets and organizers manage the event |
| Organizer dashboard | Organizers see event status and key actions |
| Ticket dashboard | Users see purchased tickets and QR entry passes |
| Check-in scanner | Organizers verify QR tokens at the door |

### Soroban Smart Contract

Core contract functions:

| Contract Method | Purpose |
|---|---|
| `create_event()` | Create and publish a new event |
| `buy_ticket()` | Buy a ticket and deposit funds into escrow |
| `confirm_event()` | Release funds to the organizer after success |
| `cancel_event()` | Refund all active tickets on cancellation |
| `refund_ticket()` | Allow self-service refund before cutoff |
| `check_in()` | Mark a ticket as used at the venue |
| `get_event()` | Read event state |
| `get_ticket()` | Read ticket state |

### Workflow

1. An organizer creates and publishes an event.
2. A shareable event link is distributed to attendees.
3. Participants purchase tickets, and funds are deposited into smart-contract escrow.
4. If the event succeeds, the organizer confirms it and receives the escrowed funds.
5. If the event is canceled, ticket holders receive automatic refunds through the contract.
6. Eligible attendees can request self-service refunds before the refund deadline.
7. QR-based tickets are scanned during entry for secure attendance verification.

## 5. Technical Challenges

Key engineering concerns in this product:

| Challenge | Why It Matters |
|---|---|
| Automated refunds | Every active ticket must be refunded cleanly without leaving funds stuck |
| Refund deadlines | On-chain timestamps enforce the refund window reliably |
| Capacity control | Overselling has to be prevented even under concurrent purchase pressure |
| QR authenticity | Check-in tokens need to be verifiable and hard to forge |
| Seat reassignment | Refunds can reopen inventory, so the UX has to stay consistent |
| Anchor compatibility | Future fiat on/off ramp support can expand the product beyond native token flows |

## 6. Product Roadmap

### MVP

| MVP Feature | Status in Repo |
|---|---|
| Event creation and ticket sales | Implemented |
| Smart-contract escrow | Implemented |
| Event confirmation and cancellation | Implemented |
| Self-service attendee refunds | Implemented |
| Organizer dashboard and ticket tracking | Implemented |
| Smart-contract testing and validation | Implemented |

### Growth & Adoption

| Growth Idea | Why It Helps |
|---|---|
| Shareable event links | Makes it easy to promote events on social channels |
| Under-a-minute setup | Reduces onboarding friction for organizers |
| Lightweight QR check-in | Improves real-world usability at the venue |
| Public discovery feed | Helps attendees find events without a separate channel |

### Long-Term Vision

| Future Feature | Value |
|---|---|
| Fiat ticket purchases via Stellar Anchors | Broadens adoption beyond crypto-native users |
| Recurring and duplicated events | Helps organizers reuse event templates |
| Multiple ticket categories | Supports VIP, student, and general admission |
| On-chain attendance records | Creates a foundation for certificates and reputation credentials |

BlockPass aims to be a transparent, low-cost, decentralized alternative to traditional event
ticketing platforms while keeping the organizer and attendee experience simple.

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

| Field | Value |
|---|---|
| Contract ID | `CDX2ZOLDJRPN7ZWC2LRTODWAXE7XEIODRCMBSXKAF7ZH4Q5SDLTWD4TA` |
| Deployment tx | `8d91c537aa9c0e9161fb5609064a81469081ebf5139bf6083ffbf8d55c8a94a5` |
| Explorer contract link | `https://stellar.expert/explorer/testnet/contract/CDX2ZOLDJRPN7ZWC2LRTODWAXE7XEIODRCMBSXKAF7ZH4Q5SDLTWD4TA` |
| Network | `Stellar Testnet` |
| Deployer account | `GAM66NWFLWHLDYEIX7XRJYVQK7MVV7ZFQ2F4IXYCCKAUHY5XR6QGC2LV` |
| Contract version | `blockpass-0.1.0` |



## Screenshots

<div style="display: grid; grid-template-columns-2: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px;">
  <figure style="margin: 0; padding: 12px; border: 1px solid #ddd; border-radius: 14px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
    <img width="1876" height="1005"  src="https://github.com/user-attachments/assets/f434a599-d02a-442a-8c63-f9e80785da5a"
 alt="Home page screenshot" style="width: 100%; height: auto; border-radius: 10px; display: block;" />
    <figcaption style="margin-top: 10px; font-size: 0.95rem;">Home page - landing page and value proposition</figcaption>
  </figure>

  <figure style="margin: 0; padding: 12px; border: 1px solid #ddd; border-radius: 14px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
   <img width="1876" height="1005" src="https://github.com/user-attachments/assets/07669457-4a97-4677-9ce6-b53c2aebdc22" 
 alt="Create page mobile screenshot" style="width: 100%; height: auto; border-radius: 10px; display: block;" />
    <figcaption style="margin-top: 10px; font-size: 0.95rem;">Create page mobile - responsive form on phone size</figcaption>
  </figure>

  <figure style="margin: 0; padding: 12px; border: 1px solid #ddd; border-radius: 14px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
   <img width="1876" height="1005" src="https://github.com/user-attachments/assets/a32ec86b-bd4d-4735-a259-d18e4e1989d7" 
 alt="Organizer dashboard screenshot" style="width: 100%; height: auto; border-radius: 10px; display: block;" />
    <figcaption style="margin-top: 10px; font-size: 0.95rem;">Organizer dashboard - event stats and actions</figcaption>
  </figure>

</div>


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
