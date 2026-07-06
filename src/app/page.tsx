import Link from 'next/link'
import { CONTRACT_ID, isTestnet } from '@/lib/stellar'
import { getContractVersion } from '@/lib/contract'

const pillars = [
  {
    title: 'Escrow first',
    body: 'Ticket money stays in contract custody until the event finishes or the organizer confirms.',
  },
  {
    title: 'Fast at the door',
    body: 'QR check-in and a clear organizer flow keep entry simple when the venue gets busy.',
  },
  {
    title: 'Clean pages',
    body: 'Every event page stays readable, spacious, and focused on the three actions that matter.',
  },
] as const

const shortcuts = [
  {
    href: '/create',
    label: 'Create event',
    body: 'Build a new listing with price, cutoff, and capacity.',
  },
  {
    href: '/organizer/dashboard',
    label: 'Organizer dashboard',
    body: 'Manage live sales, confirm events, and handle refunds.',
  },
  {
    href: '/me/tickets',
    label: 'My tickets',
    body: 'See purchased tickets and QR payloads in one place.',
  },
  {
    href: '/contact',
    label: 'Contact',
    body: 'Ask for setup help or a quick product walkthrough.',
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
    <div className="space-y-8">
      <section className="surface surface-strong overflow-hidden px-6 py-8 md:px-8 md:py-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <span className="eyebrow">Event ticketing with trust built in</span>
            <div className="space-y-4">
              <h1 className="section-title max-w-[12ch]">
                Make event pages feel premium before first ticket sells.
              </h1>
              <p className="section-copy">
                BlockPass keeps ticket money in escrow, refunds simple, and check-in fast.
                Clean design comes first, because trust starts with spacing, clarity, and
                calm flow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 font-semibold text-[#14110f] shadow-[0_10px_24px_rgba(108,198,58,0.24)] transition hover:-translate-y-px"
              >
                Create event
              </Link>
              <Link
                href="/organizer/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.9)] px-5 py-3 font-semibold text-[var(--text)] transition hover:-translate-y-px hover:border-[var(--border-strong)]"
              >
                Open dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoCard label="Network" value={isTestnet() ? 'Testnet' : 'Mainnet'} />
              <InfoCard label="Contract" value={CONTRACT_ID ? 'Configured' : 'Not set'} />
              <InfoCard label="Version" value={version ?? 'v0.1'} />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="surface bg-[rgba(255,252,247,0.96)] p-5 shadow-[0_16px_36px_rgba(52,38,20,0.1)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="m-0 text-sm uppercase tracking-[0.16em] text-[var(--text-dim)]">
                    Product flow
                  </p>
                  <h2 className="mt-2 font-display text-[1.8rem] leading-none tracking-[-0.04em]">
                    Launch, sell, scan.
                  </h2>
                </div>
                <span className="chip">Ready</span>
              </div>
              <div className="mt-5 grid gap-3">
                {['Draft event', 'Publish page', 'Sell tickets', 'Check in guests'].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] bg-white/75 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] font-mono text-xs font-semibold">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface bg-[rgba(255,248,238,0.96)] p-5">
              <p className="m-0 text-sm uppercase tracking-[0.16em] text-[var(--text-dim)]">
                What this app does
              </p>
              <p className="mt-3 max-w-[34ch] text-[var(--text-dim)]">
                One place for event setup, ticket escrow, refunds, check-in, and share links.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {pillars.map((pillar, index) => (
          <article key={pillar.title} className={`surface p-6 reveal ${index === 1 ? 'reveal-2' : ''} ${index === 2 ? 'reveal-3' : ''}`}>
            <span className="chip">Core</span>
            <h2 className="mt-4 font-display text-[1.8rem] leading-none tracking-[-0.04em]">
              {pillar.title}
            </h2>
            <p className="mt-3 m-0 text-[var(--text-dim)] leading-7">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="surface p-6 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="eyebrow">Shortcuts</span>
            <h2 className="section-title">Jump into any flow.</h2>
          </div>
          <p className="section-copy max-w-[38ch]">
            Every major path is one click away. No clutter, no hidden menus, no extra pages.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[24px] border border-[var(--border)] bg-white/70 p-5 transition hover:-translate-y-1 hover:border-[var(--border-strong)] hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-[1.55rem] leading-none tracking-[-0.03em]">
                  {item.label}
                </h3>
                <span className="text-xl text-[var(--text-dim)] transition group-hover:translate-x-1">
                  →
                </span>
              </div>
              <p className="mt-3 m-0 text-sm leading-7 text-[var(--text-dim)]">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface bg-[rgba(255,252,247,0.92)] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-dim)]">{label}</div>
      <div className="mt-2 font-display text-[1.2rem] leading-none tracking-[-0.03em]">{value}</div>
    </div>
  )
}
