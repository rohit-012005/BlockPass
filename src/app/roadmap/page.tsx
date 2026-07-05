import Link from 'next/link'

export default function RoadmapPage() {
  return (
    <div className="stack">
      <section className="hero reveal">
        <span className="eyebrow">Roadmap</span>
        <h1 className="h1" style={{ marginTop: '1rem' }}>
          What ships now, what grows next.
        </h1>
        <p className="lead">
          This page makes the product direction explicit: current MVP, growth ideas, and future
          product bets.
        </p>
      </section>

      <section className="surface-grid">
        <article className="surface span-7 feature-card reveal reveal-2">
          <h2 className="h2">Technical challenges</h2>
          <div className="timeline" style={{ marginTop: '1rem' }}>
            <Item title="Refund correctness" body="Every eligible ticket must be refunded without partial state." />
            <Item title="Capacity and race conditions" body="Buying must remain safe even with concurrent demand." />
            <Item title="QR authenticity" body="Door passes need to be hard to forge and easy to verify." />
            <Item title="Inventory reopening" body="Refunds should reopen seats cleanly without confusing users." />
          </div>
        </article>
        <article className="surface span-5 feature-card reveal reveal-3">
          <h2 className="h2">MVP status</h2>
          <div className="stack" style={{ marginTop: '1rem' }}>
            <Check label="Event creation" />
            <Check label="Ticket buying" />
            <Check label="Cancel refund" />
            <Check label="Organizer dashboard" />
            <Check label="QR check-in" />
            <Check label="Telemetry and submission docs" />
          </div>
        </article>
      </section>

      <section className="feature-list">
        <Feature title="Growth" body="Shareable links, faster setup, and easier event discovery." />
        <Feature title="Long-term" body="Fiat support, recurring events, ticket tiers, and attendance records." />
        <Feature title="Production" body="Modern site structure, responsive layout, and clear operational details." />
        <Feature title="Review ready" body="Contract id, screenshots, and demo placeholders are documented in README." />
      </section>

      <div className="row">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
        <Link href="/product" className="btn btn-ghost">
          Product
        </Link>
      </div>
    </div>
  )
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div className="timeline-item">
      <div className="timeline-index">✓</div>
      <div>
        <h3 className="h3">{title}</h3>
        <p className="muted" style={{ margin: '0.3rem 0 0' }}>
          {body}
        </p>
      </div>
    </div>
  )
}

function Check({ label }: { label: string }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between' }}>
      <span>{label}</span>
      <span className="tag tag-success">Shipped</span>
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
