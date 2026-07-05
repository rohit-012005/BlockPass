import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="stack">
      <section className="hero reveal">
        <span className="eyebrow">Contact</span>
        <h1 className="h1" style={{ marginTop: '1rem' }}>
          Talk about your next event.
        </h1>
        <p className="lead">
          Use BlockPass for workshops, meetups, and community launches. Reach out for setup help,
          demos, or partnership questions.
        </p>
      </section>

      <section className="surface-grid">
        <article className="surface span-6 feature-card reveal reveal-2">
          <h2 className="h2">Email</h2>
          <p className="lead">hello@blockpass.app</p>
          <p className="muted">Best for onboarding, support, and custom event flows.</p>
        </article>
        <article className="surface span-6 feature-card reveal reveal-3">
          <h2 className="h2">GitHub</h2>
          <p className="lead">github.com/rohit-012005/BlockPass</p>
          <p className="muted">Best for code review, issues, and project updates.</p>
        </article>
      </section>

      <div className="row">
        <Link href="/" className="btn btn-primary">
          Back home
        </Link>
        <Link href="/create" className="btn btn-ghost">
          Create event
        </Link>
      </div>
    </div>
  )
}
