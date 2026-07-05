import Link from 'next/link'
import { CONTRACT_ID, isTestnet, NETWORK } from '@/lib/stellar'
import { getContractVersion } from '@/lib/contract'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let version: string | null = null
  let versionError: string | null = null

  if (CONTRACT_ID) {
    try {
      version = await getContractVersion()
    } catch (error) {
      versionError = error instanceof Error ? error.message : 'Failed to read contract version'
    }
  }

  return (
    <div className="stack">
      <section className="hero reveal">
        <div className="hero-grid">
          <div className="hero-copy stack">
            <span className="eyebrow">Stellar-powered event escrow</span>
            <h1 className="h1">
              Ticket money stays locked until event ends. Refunds happen without manual drama.
            </h1>
            <p className="lead">
              BlockPass is a production-minded event ticketing platform for organizers who want a
              low-fee, trust-minimized way to collect payment, cancel cleanly, and check people in
              at the door.
            </p>
            <div className="row" style={{ marginTop: '0.5rem' }}>
              <Link href="/create" className="btn btn-primary">
                Create event
              </Link>
              <Link href="/story" className="btn btn-ghost">
                Read story
              </Link>
              <Link href="/product" className="btn btn-ghost">
                See product
              </Link>
            </div>
            <div className="stat-grid" style={{ marginTop: '1.5rem' }}>
              <Stat label="Network" value={isTestnet() ? 'Testnet' : 'Mainnet'} />
              <Stat label="RPC" value={trim(NETWORK.rpcUrl, 28)} />
              <Stat label="Version" value={versionError ? 'offline' : (version ?? '—')} />
              <Stat label="Contract" value={CONTRACT_ID ? trim(CONTRACT_ID, 18) : 'not deployed'} accent={!CONTRACT_ID} />
            </div>
          </div>

          <div className="hero-collage">
            <div className="surface feature-card floating hero-card hero-card-main">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="tag tag-accent">Live on chain</span>
                <span className="tag">{version ?? 'v0.1'}</span>
              </div>
              <div style={{ marginTop: '1.1rem' }}>
                <div className="stat-label">Deployed contract</div>
                <div className="mono" style={{ marginTop: '0.45rem' }}>
                  {CONTRACT_ID ? CONTRACT_ID : 'Deploy contract to show id'}
                </div>
              </div>
              <div className="divider" />
              <div className="stack">
                <MiniRow label="Escrow" value="Atomic batch refunds" />
                <MiniRow label="Check-in" value="QR + HMAC verification" />
                <MiniRow label="Checkout" value="Organizer confirmation" />
              </div>
            </div>

            <div className="surface feature-card reveal reveal-2 hero-card hero-card-note">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="eyebrow" style={{ transform: 'rotate(-8deg)' }}>
                  Create
                </span>
                <span className="tag tag-success">Ready</span>
              </div>
              <p className="lead" style={{ marginBottom: 0 }}>
                Create page, event page, dashboard, and scanner all use the same paper-card system.
              </p>
            </div>

            <div className="surface feature-card reveal reveal-3 hero-card hero-card-sub">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">Submission</span>
                <span className="tag tag-warning">Review ready</span>
              </div>
              <p className="lead" style={{ marginBottom: 0 }}>
                README now includes contract details, live placeholders, screenshot list, and
                structured feedback with commit ids.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-list">
        <Feature
          title="Built for organizers"
          body="Create event, publish link, collect funds, and manage cancellations without manually reversing payments."
        />
        <Feature
          title="Built for attendees"
          body="Buy ticket, show QR pass, and keep a simple history of purchased tickets and refund status."
        />
        <Feature
          title="Built for reviewers"
          body="Modern landing page, separate story/product/roadmap pages, telemetry, and contract details in one place."
        />
        <Feature
          title="Built for real venues"
          body="Check-in page supports fast scan flow with verification, reset, and clear validation states."
        />
      </section>

      <section className="surface-grid">
        <article className="surface span-7 feature-card reveal reveal-2">
          <span className="eyebrow">Problem</span>
          <h2 className="h2" style={{ marginTop: '0.75rem' }}>
            Traditional ticketing takes a cut and direct transfers create refund chaos.
          </h2>
          <p className="lead">
            BlockPass solves the exact problem organizers keep running into: payment collection,
            cancellation handling, and ticket refunds without a pile of manual reconciliation.
          </p>
        </article>
        <article className="surface span-5 feature-card reveal reveal-3">
          <span className="eyebrow">Why Stellar</span>
          <p className="lead" style={{ marginBottom: 0 }}>
            Fast finality, low fees, native USDC support, and Soroban smart contracts make Stellar
            a strong fit for event escrow and low-value payment flows.
          </p>
        </article>
      </section>

      <section className="surface feature-card stack reveal reveal-3">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="eyebrow">Journey</span>
            <h2 className="h2" style={{ marginTop: '0.65rem' }}>
              From create event to check-in.
            </h2>
          </div>
          <Link href="/roadmap" className="btn btn-ghost">
            Roadmap
          </Link>
        </div>
        <div className="timeline">
          <TimelineItem index="01" title="Organize" body="Create event, capacity, price, and refund cutoff." />
          <TimelineItem index="02" title="Distribute" body="Share event link and collect ticket payments into escrow." />
          <TimelineItem index="03" title="Resolve" body="Confirm event or cancel and refund everyone atomically." />
          <TimelineItem index="04" title="Scan" body="Use QR token at door, verify it, then check attendee in." />
        </div>
      </section>

      {versionError && (
        <div className="notice notice-error reveal">
          Could not reach contract at <span className="mono">{CONTRACT_ID}</span>: {versionError}
        </div>
      )}
    </div>
  )
}

function trim(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={accent ? 'stat-value tag tag-danger' : 'stat-value mono'}>{value}</div>
    </div>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <article className="card feature-card">
      <h3 className="h3">{title}</h3>
      <p className="muted" style={{ margin: '0.65rem 0 0' }}>
        {body}
      </p>
    </article>
  )
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span className="muted">{label}</span>
      <span className="mono">{value}</span>
    </div>
  )
}

function TimelineItem({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="timeline-item">
      <div className="timeline-index">{index}</div>
      <div>
        <h3 className="h3">{title}</h3>
        <p className="muted" style={{ margin: '0.3rem 0 0' }}>
          {body}
        </p>
      </div>
    </div>
  )
}
