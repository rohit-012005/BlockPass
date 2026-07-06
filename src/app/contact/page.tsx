import Link from 'next/link'

const contacts = [
  {
    title: 'Email',
    value: 'hello@blockpass.app',
    body: 'Best for onboarding, support, and custom event flows.',
  },
  {
    title: 'GitHub',
    value: 'github.com/rohit-012005/BlockPass',
    body: 'Best for code review, issues, and project updates.',
  },
] as const

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <section className="surface surface-strong px-6 py-8 md:px-8 md:py-10">
        <span className="eyebrow">Contact</span>
        <h1 className="mt-4 section-title max-w-[10ch]">Talk about your next event.</h1>
        <p className="section-copy mt-4">
          Use BlockPass for workshops, meetups, and community launches. Reach out for setup help,
          demos, or partnership questions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {contacts.map((item) => (
          <article key={item.title} className="surface p-6 md:p-7">
            <span className="chip">{item.title}</span>
            <h2 className="mt-4 font-display text-[2rem] leading-none tracking-[-0.04em]">
              {item.value}
            </h2>
            <p className="mt-3 m-0 text-[var(--text-dim)] leading-7">{item.body}</p>
          </article>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)]"
        >
          Back home
        </Link>
        <Link
          href="/create"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
        >
          Create event
        </Link>
      </div>
    </div>
  )
}
