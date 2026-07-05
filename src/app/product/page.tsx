import Link from 'next/link'

export default function ProductPage() {
  return (
    <div className="stack">
      <section className="hero reveal">
        <span className="eyebrow">Product</span>
        <h1 className="h1" style={{ marginTop: '1rem' }}>
          Pages for organizers, attendees, and reviewers.
        </h1>
        <p className="lead">
          The UI is split into separate production-style pages so each task has its own space:
          create, buy, manage, scan, and review.
        </p>
      </section>

      <section className="surface-grid">
        <article className="surface span-6 feature-card reveal reveal-2">
          <h2 className="h2">Frontend</h2>
          <div className="timeline" style={{ marginTop: '1rem' }}>
            <Item title="Create" body="Organizer event builder with live preview and validation." />
            <Item title="Event" body="Public page with ticket purchase, organizer actions, and share tools." />
            <Item title="Wallet" body="My tickets page with QR token handling and ticket state." />
            <Item title="Dashboard" body="Organizer event summary and quick action panel." />
          </div>
        </article>
        <article className="surface span-6 feature-card reveal reveal-3">
          <h2 className="h2">Contract</h2>
          <div className="timeline" style={{ marginTop: '1rem' }}>
            <Item title="Escrow" body="Ticket payments are locked in the Soroban contract." />
            <Item title="Refunds" body="Cancel path refunds all active tickets atomically." />
            <Item title="Check-in" body="Organizer verifies ticket and checks it in on chain." />
            <Item title="Reads" body="App pages read contract state for event and ticket data." />
          </div>
        </article>
      </section>

      <section className="feature-list">
        <Feature title="Paper shell" body="Sticky editorial header, bold serif type, and a collage-inspired layout." />
        <Feature title="Motion" body="Framer page transitions, reveal animations, hover lift, and subtle ambient drift." />
        <Feature title="Performance" body="Framer page transitions and CSS motion stay light and compositor-friendly." />
        <Feature title="Accessibility" body="Keyboard-visible focus, semantic sections, and readable contrast." />
      </section>

      <div className="row">
        <Link href="/create" className="btn btn-primary">
          Create event
        </Link>
        <Link href="/story" className="btn btn-ghost">
          Story
        </Link>
      </div>
    </div>
  )
}

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div className="timeline-item">
      <div className="timeline-index">{title.slice(0, 2).toUpperCase()}</div>
      <div>
        <h3 className="h3">{title}</h3>
        <p className="muted" style={{ margin: '0.3rem 0 0' }}>
          {body}
        </p>
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
