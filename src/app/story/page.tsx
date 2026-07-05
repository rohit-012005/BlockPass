import Link from 'next/link'

export default function StoryPage() {
  return (
    <div className="stack">
      <section className="hero reveal">
        <span className="eyebrow">Story</span>
        <h1 className="h1" style={{ marginTop: '1rem' }}>
          Why BlockPass exists.
        </h1>
        <p className="lead">
          Event organizers need a clean way to collect money, cancel safely, and refund people
          without becoming a support desk.
        </p>
      </section>

      <section className="surface-grid">
        <article className="surface span-7 feature-card reveal reveal-2">
          <h2 className="h2">Problem</h2>
          <p className="lead">
            Direct transfers force manual refunds. Existing ticket platforms charge fees and hide
            control behind closed systems. That combination makes small event money management
            messy.
          </p>
        </article>
        <article className="surface span-5 feature-card reveal reveal-3">
          <h2 className="h2">Answer</h2>
          <p className="lead" style={{ marginBottom: 0 }}>
            Keep ticket funds in escrow until the event finishes. If the event is canceled, the
            contract does the refund work automatically.
          </p>
        </article>
      </section>

      <section className="feature-list">
        <Feature title="Independent organizers" body="Workshops, meetups, comedy nights, small house shows." />
        <Feature title="Community groups" body="Clubs, student groups, creator communities, reunion planners." />
        <Feature title="Lower friction" body="No platform overhead, no manual reversal ceremony, no refund backlog." />
        <Feature title="Trust first" body="Public contract logic and transparent event state for both sides." />
      </section>

      <div className="row">
        <Link href="/product" className="btn btn-primary">
          See product
        </Link>
        <Link href="/roadmap" className="btn btn-ghost">
          Roadmap
        </Link>
      </div>
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
