import Link from 'next/link'
import { CONTRACT_ID, isTestnet } from '@/lib/stellar'
import { getContractVersion } from '@/lib/contract'

const features = [
  {
    title: 'Escrow checkout',
    body: 'Ticket money stays protected until event ends, so organizers and attendees share one clear refund story.',
    accent: 'mint',
  },
  {
    title: 'Simple event pages',
    body: 'Create one polished page with title, venue, date, price, and refund rules. No clutter, no confusing flow.',
    accent: 'pink',
  },
  {
    title: 'Fast door scan',
    body: 'QR-based check-in keeps venue entry quick while preserving contract-backed ticket state.',
    accent: 'yellow',
  },
] as const

const events = [
  {
    title: 'Rooftop Sessions',
    meta: 'Mumbai · 48 seats',
    body: 'Small live music night with ticket escrow and one-tap refunds before cutoff.',
    tone: 'lavender',
  },
  {
    title: 'Design Circle Meetup',
    meta: 'Bengaluru · 80 seats',
    body: 'Community event page with clean copy, transparent pricing, and fast guest check-in.',
    tone: 'mint',
  },
  {
    title: 'Creator Workshop',
    meta: 'Delhi · 32 seats',
    body: 'Hands-on workshop where buyers know exactly when funds unlock and how cancellations work.',
    tone: 'yellow',
  },
] as const

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let version: string | null = null

  if (CONTRACT_ID) {
    try {
      version = await getContractVersion()
    } catch {
      version = null
    }
  }

  return (
    <div className="landing-stack">
      <section className="landing-hero reveal">
        <div className="landing-grid-paper" aria-hidden="true" />
        <div className="landing-doodle landing-doodle-left" aria-hidden="true" />
        <div className="landing-doodle landing-doodle-right" aria-hidden="true" />

        <div className="landing-hero-grid">
          <div className="landing-copy">
            <span className="landing-kicker">Event ticketing with trust built in</span>
            <h1 className="landing-title">
              Create beautiful event pages and collect payments without refund chaos.
            </h1>
            <p className="landing-body">
              BlockPass is for small events that need clean design, simple setup, and protected
              ticket money. Launch page, take payments, scan at door.
            </p>

            <div className="landing-cta-row">
              <Link href="/create" className="landing-btn landing-btn-primary">
                Create event
              </Link>
              <Link href="/contact" className="landing-btn landing-btn-secondary">
                Contact
              </Link>
            </div>

            <div className="landing-stat-row">
              <InfoPill label="Network" value={isTestnet() ? 'Testnet' : 'Mainnet'} tone="mint" />
              <InfoPill label="Contract" value={CONTRACT_ID ? 'Ready' : 'Not set'} tone="yellow" />
              <InfoPill label="Version" value={version ?? 'v0.1'} tone="lavender" />
            </div>
          </div>

          <div className="landing-collage" aria-label="Event product preview">
            <div className="landing-sticker">Small teams love this</div>
            <div className="landing-card landing-card-browser">
              <div className="landing-browser-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-browser-hero">
                <div>
                  <div className="landing-mini-label">Event page</div>
                  <h2>BlockPass launch page</h2>
                  <p>Clear date, price, refund cutoff, and ticket checkout on one screen.</p>
                </div>
                <div className="landing-browser-ticket">
                  <span className="landing-chip mint">Escrow active</span>
                  <span className="landing-chip pink">QR ready</span>
                </div>
              </div>
              <div className="landing-browser-grid">
                <div className="landing-mock-panel mint">
                  <strong>For attendees</strong>
                  <p>Transparent payments and refund timing.</p>
                </div>
                <div className="landing-mock-panel lavender">
                  <strong>For organizers</strong>
                  <p>Create, publish, manage, and scan.</p>
                </div>
              </div>
            </div>
            <div className="landing-card landing-card-note">
              <span className="landing-chip yellow">Sticky note</span>
              <p>Less platform noise. More event focus.</p>
            </div>
            <div className="landing-card landing-card-ticket">
              <div className="landing-mini-label">Flow</div>
              <div className="landing-ticket-lines">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-ticket-footer">
                <span>Create</span>
                <span>Publish</span>
                <span>Scan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section reveal reveal-2" id="features">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Features</span>
          <h2 className="landing-section-title">Only what small events actually need.</h2>
          <p className="landing-section-copy">
            No extra marketing pages. No fake complexity. Just event creation, clear checkout, and
            venue-ready ticket handling.
          </p>
        </div>

        <div className="landing-feature-stack">
          {features.map((feature) => (
            <article key={feature.title} className={`landing-feature-card ${feature.accent}`}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section reveal reveal-3" id="events">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Events</span>
          <h2 className="landing-section-title">Built for intimate launches, workshops, and community nights.</h2>
          <p className="landing-section-copy">
            Use BlockPass for curated gatherings where page quality and trust matter as much as payment collection.
          </p>
        </div>

        <div className="landing-events-grid">
          {events.map((event) => (
            <article key={event.title} className={`landing-event-card ${event.tone}`}>
              <span className="landing-mini-label">{event.meta}</span>
              <h3>{event.title}</h3>
              <p>{event.body}</p>
              <Link href="/create" className="landing-inline-link">
                Create one like this
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta reveal">
        <div>
          <span className="landing-section-tag">Start now</span>
          <h2 className="landing-section-title">Create event page, collect tickets, stay in control.</h2>
          <p className="landing-section-copy">
            Keep site simple. Let product do important work.
          </p>
        </div>
        <div className="landing-final-actions">
          <Link href="/create" className="landing-btn landing-btn-primary">
            Go to create page
          </Link>
          <Link href="/contact" className="landing-btn landing-btn-secondary">
            Go to contact page
          </Link>
        </div>
      </section>
    </div>
  )
}

function InfoPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'mint' | 'lavender' | 'yellow'
}) {
  return (
    <div className={`landing-info-pill ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
