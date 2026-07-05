import Link from 'next/link'
import { CONTRACT_ID, isTestnet, NETWORK } from '@/lib/stellar'
import { getContractVersion } from '@/lib/contract'

const features = [
  {
    title: 'Escrow that feels invisible',
    body: 'Checkout, cancellation, and payout rules live inside one calm flow. Organizers get trust without sending buyers into a crypto maze.',
    sticker: 'No drama',
    accent: 'mint',
  },
  {
    title: 'Door flow built for real venues',
    body: 'QR passes, scanner reset states, and check-in verification move fast enough for crowded entrances and tiny teams.',
    sticker: 'Door ready',
    accent: 'pink',
  },
  {
    title: 'Editorial-grade event presence',
    body: 'Public pages feel polished, branded, and shareable instead of looking like a generic form stapled to a payment link.',
    sticker: 'Looks premium',
    accent: 'yellow',
  },
] as const

const showcases = [
  {
    eyebrow: 'Studio-grade creation',
    title: 'Design event pages like launch moments, not admin chores.',
    body: 'Compose title, venue, pricing, and refund window in one scrapbook-style builder. Every field feeds a listing meant to be shared.',
    side: 'left' as const,
    notes: ['Live preview', 'Refund cutoff logic', 'Wallet-aware publish'],
  },
  {
    eyebrow: 'Confidence at checkout',
    title: 'Show buyers exactly where funds go, when refunds trigger, and what happens at the door.',
    body: 'From escrow messaging to ticket state history, BlockPass turns trust into visible product copy instead of hidden policy text.',
    side: 'right' as const,
    notes: ['Escrow timeline', 'Ticket history', 'Check-in QR payload'],
  },
] as const

const workflow = [
  {
    step: '01',
    title: 'Draft',
    body: 'Set pricing, capacity, payout logic, and refund deadline.',
    art: 'paper clip',
  },
  {
    step: '02',
    title: 'Publish',
    body: 'Share one beautiful event page that carries context and checkout.',
    art: 'postcard',
  },
  {
    step: '03',
    title: 'Resolve',
    body: 'Confirm event for payout or cancel once for batch refunds.',
    art: 'receipt',
  },
  {
    step: '04',
    title: 'Scan',
    body: 'Verify QR at venue and keep line moving with clear states.',
    art: 'stamp',
  },
] as const

const testimonials = [
  {
    quote:
      'Finally feels like software made for intimate events, not ticketing machinery built for stadiums.',
    name: 'Aanya',
    role: 'Community host',
    tilt: '-2deg',
  },
  {
    quote:
      'Refund story is strongest part. Buyers stop asking who holds money because page already explains it.',
    name: 'Milan',
    role: 'Workshop organizer',
    tilt: '3deg',
  },
  {
    quote:
      'Scanner flow feels tiny and focused. Door team learned it in minutes.',
    name: 'Rhea',
    role: 'Venue ops',
    tilt: '-3deg',
  },
] as const

const pricing = [
  {
    name: 'Starter',
    price: 'Free',
    body: 'For pilots, pop-ups, and early community launches.',
    perks: ['Unlimited event drafts', 'Public event page', 'Buyer ticket vault'],
    tone: 'yellow',
  },
  {
    name: 'Studio',
    price: '$29',
    body: 'For teams that want premium launch pages and faster venue ops.',
    perks: ['Organizer dashboard', 'Check-in scanner', 'Escrow-first support copy'],
    tone: 'mint',
  },
  {
    name: 'Custom',
    price: 'Talk to us',
    body: 'For festivals, collectives, and branded experiences.',
    perks: ['White-label polish', 'Multi-role workflows', 'Priority onboarding'],
    tone: 'lavender',
  },
] as const

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
    <div className="landing-stack">
      <section className="landing-hero reveal">
        <div className="landing-grid-paper" aria-hidden="true" />
        <div className="landing-doodle landing-doodle-left" aria-hidden="true" />
        <div className="landing-doodle landing-doodle-right" aria-hidden="true" />

        <div className="landing-hero-grid">
          <div className="landing-copy">
            <span className="landing-kicker">Playful escrow for modern event studios</span>
            <h1 className="landing-title">
              Ticketing for creative teams who want premium launch vibes and zero refund chaos.
            </h1>
            <p className="landing-body">
              BlockPass gives organizers editorial-grade event pages, escrow-backed checkout, and
              clean venue tools in one polished product. Handmade look, production mindset.
            </p>

            <div className="landing-cta-row">
              <Link href="/create" className="landing-btn landing-btn-primary">
                Start creating
              </Link>
              <Link href="/product" className="landing-btn landing-btn-secondary">
                Explore product
              </Link>
            </div>

            <div className="landing-stat-row">
              <InfoPill label="Network" value={isTestnet() ? 'Testnet' : 'Mainnet'} tone="mint" />
              <InfoPill label="Version" value={versionError ? 'Offline' : (version ?? 'v0.1')} tone="lavender" />
              <InfoPill label="Contract" value={CONTRACT_ID ? trim(CONTRACT_ID, 16) : 'Not set'} tone="yellow" />
            </div>
          </div>

          <div className="landing-collage" aria-label="Product collage preview">
            <div className="landing-sticker landing-sticker-top">Loved by small teams</div>
            <div className="landing-card landing-card-browser">
              <div className="landing-browser-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-browser-hero">
                <div>
                  <div className="landing-mini-label">Live event shell</div>
                  <h2>Rooftop Sessions / BlockPass</h2>
                  <p>Escrow-backed tickets, refund notes, and QR passes in one calm page.</p>
                </div>
                <div className="landing-browser-ticket">
                  <span className="landing-chip mint">Escrow active</span>
                  <span className="landing-chip pink">Door scan ready</span>
                </div>
              </div>
              <div className="landing-browser-grid">
                <div className="landing-mock-panel mint">
                  <strong>Buyer trust</strong>
                  <p>Refund window visible before checkout.</p>
                </div>
                <div className="landing-mock-panel lavender">
                  <strong>Organizer view</strong>
                  <p>Capacity, scan flow, and payout actions.</p>
                </div>
              </div>
            </div>

            <div className="landing-card landing-card-note">
              <span className="landing-chip yellow">Sticky note</span>
              <p>“Feels like design software, not finance software.”</p>
            </div>

            <div className="landing-card landing-card-ticket">
              <div className="landing-mini-label">Workflow snapshot</div>
              <div className="landing-ticket-lines">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-ticket-footer">
                <span>{trim(NETWORK.rpcUrl, 24)}</span>
                <span>{version ?? 'draft'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section reveal reveal-2">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Features</span>
          <h2 className="landing-section-title">Stacked like scrapbook cards. Wired like production software.</h2>
          <p className="landing-section-copy">
            Every surface pairs editorial warmth with operational clarity, so product story and
            logistics support each other.
          </p>
        </div>

        <div className="landing-feature-stack">
          {features.map((feature) => (
            <article key={feature.title} className={`landing-feature-card ${feature.accent}`}>
              <span className="landing-float-tag">{feature.sticker}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section reveal reveal-3">
        <div className="landing-showcase-stack">
          {showcases.map((item) => (
            <article
              key={item.title}
              className={`landing-showcase ${item.side === 'right' ? 'reverse' : ''}`}
            >
              <div className="landing-showcase-copy">
                <span className="landing-section-tag">{item.eyebrow}</span>
                <h2 className="landing-section-title">{item.title}</h2>
                <p className="landing-section-copy">{item.body}</p>
                <div className="landing-note-list">
                  {item.notes.map((note) => (
                    <span key={note} className="landing-inline-note">
                      {note}
                    </span>
                  ))}
                </div>
              </div>

              <div className="landing-showcase-art">
                <div className="landing-shot">
                  <div className="landing-shot-header">
                    <span className="landing-chip mint">Mockup</span>
                    <span className="landing-chip lavender">Screenshot feel</span>
                  </div>
                  <div className="landing-shot-body">
                    <div className="landing-shot-column">
                      <span className="landing-shot-bar large" />
                      <span className="landing-shot-bar" />
                      <span className="landing-shot-bar short" />
                    </div>
                    <div className="landing-shot-column accent">
                      <span className="landing-shot-bubble" />
                      <span className="landing-shot-bubble" />
                    </div>
                  </div>
                </div>
                <div className="landing-paper-scrap" />
                <div className="landing-flower" aria-hidden="true" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section reveal reveal-2">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Workflow</span>
          <h2 className="landing-section-title">Four steps. Clean enough for launch day. Charming enough for a demo reel.</h2>
        </div>
        <div className="landing-workflow-grid">
          {workflow.map((item) => (
            <article key={item.step} className="landing-workflow-card">
              <div className="landing-step-number">{item.step}</div>
              <div className="landing-workflow-art">{item.art}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section reveal reveal-3">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Testimonials</span>
          <h2 className="landing-section-title">Little notes from people who need software to feel human.</h2>
        </div>
        <div className="landing-testimonial-grid">
          {testimonials.map((item) => (
            <blockquote
              key={item.name}
              className="landing-testimonial-card"
              style={{ transform: `rotate(${item.tilt})` }}
            >
              <p>“{item.quote}”</p>
              <footer>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="landing-section reveal reveal-4">
        <div className="landing-section-heading">
          <span className="landing-section-tag">Pricing</span>
          <h2 className="landing-section-title">Rounded plans for teams at sketch, launch, and scale stage.</h2>
          <p className="landing-section-copy">
            Start free, move fast, and keep storytelling quality high while ops complexity rises.
          </p>
        </div>
        <div className="landing-pricing-grid">
          {pricing.map((plan) => (
            <article key={plan.name} className={`landing-price-card ${plan.tone}`}>
              <div className="landing-price-head">
                <div>
                  <span className="landing-mini-label">{plan.name}</span>
                  <h3>{plan.price}</h3>
                </div>
                <span className="landing-chip">per workspace</span>
              </div>
              <p>{plan.body}</p>
              <ul className="landing-price-list">
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <Link href="/create" className="landing-btn landing-btn-secondary">
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final-cta reveal">
        <div>
          <span className="landing-section-tag">Ready to launch</span>
          <h2 className="landing-section-title">Make event payments feel premium, transparent, and unexpectedly fun.</h2>
          <p className="landing-section-copy">
            From first draft to final scan, BlockPass keeps product quality high without making ops heavier.
          </p>
        </div>
        <div className="landing-final-actions">
          <Link href="/create" className="landing-btn landing-btn-primary">
            Build your first event
          </Link>
          <Link href="/story" className="landing-btn landing-btn-secondary">
            Read the story
          </Link>
        </div>
      </section>

      <section className="landing-mini-footer">
        <span>BlockPass studio notes</span>
        <div className="landing-mini-links">
          <Link href="/product">Product</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/organizer/dashboard">Dashboard</Link>
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

function trim(value: string, length: number) {
  if (value.length <= length) return value
  return `${value.slice(0, length - 1)}…`
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
