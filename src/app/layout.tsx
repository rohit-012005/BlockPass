import type { Metadata } from 'next'
import Link from 'next/link'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import { PageTelemetry } from '@/components/PageTelemetry'
import { WalletButton } from '@/components/WalletButton'
import { CONTRACT_ID, isTestnet, NETWORK } from '@/lib/stellar'

const appUrl = readAppUrl()
const fontDisplay = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})
const fontBody = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
})
const fontMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'BlockPass',
    template: '%s | BlockPass',
  },
  description:
    'BlockPass is a clean event ticketing app with on-chain escrow, refunds, and check-in on Stellar.',
  openGraph: {
    title: 'BlockPass',
    description: 'On-chain ticketing for small events.',
    type: 'website',
    url: appUrl,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const contractReady = CONTRACT_ID.length > 0
  const stellarConfig = {
    rpcUrl: process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? NETWORK.rpcUrl,
    horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? NETWORK.horizonUrl,
    networkPassphrase:
      process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? NETWORK.networkPassphrase,
    explorerUrl: process.env.NEXT_PUBLIC_STELLAR_EXPLORER_URL ?? NETWORK.explorerUrl,
    contractId: process.env.NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID ?? CONTRACT_ID,
  }

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BLOCKPASS_STELLAR_CONFIG__=${JSON.stringify(stellarConfig)};`,
          }}
        />
        <Suspense fallback={null}>
          <PageTelemetry />
        </Suspense>
        <div className="page-shell min-h-screen">
          <header className="surface surface-strong sticky top-4 z-50 px-5 py-4 backdrop-blur-xl max-lg:top-2 max-lg:px-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Link href="/" className="group flex flex-col">
                  <span className="font-display text-[2rem] font-semibold leading-none tracking-[-0.04em]">
                    BlockPass
                  </span>
                  <span className="mt-1 text-sm text-[var(--text-dim)]">
                    On-chain escrow for small events
                  </span>
                </Link>
                <div className="hidden h-12 w-px bg-[rgba(35,28,21,0.12)] lg:block" />
                <div className="hidden items-center gap-2 lg:flex">
                  <span className="chip">{isTestnet() ? 'Testnet' : 'Mainnet'}</span>
                  <span className="chip">{NETWORK.networkPassphrase.split(' ').slice(0, 2).join(' ')}</span>
                  <span className="chip">{contractReady ? 'Contract live' : 'Contract missing'}</span>
                </div>
              </div>

              <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
                <NavLink href="/#features">Features</NavLink>
                <NavLink href="/create">Create</NavLink>
                <NavLink href="/organizer/dashboard">Dashboard</NavLink>
                <NavLink href="/me/tickets">My tickets</NavLink>
                <NavLink href="/contact">Contact</NavLink>
              </nav>

              <div className="flex items-center gap-3">
                <span className="hidden max-w-[14rem] rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--text-dim)] lg:inline-flex">
                  {contractReady ? 'Contract configured' : 'Set NEXT_PUBLIC_BLOCKPASS_CONTRACT_ID'}
                </span>
                <WalletButton />
              </div>
            </div>
          </header>

          <main className="pb-8 pt-5">{children}</main>

          <footer className="surface mt-8 px-5 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="stack gap-1">
                <span className="font-display text-[1.35rem] leading-none tracking-[-0.03em]">
                  BlockPass
                </span>
                <p className="m-0 max-w-[42ch] text-sm text-[var(--text-dim)]">
                  Clean event pages, escrowed payments, refunds, and door check-in in one flow.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-dim)]">
                <Link href="/#features">Features</Link>
                <Link href="/create">Create</Link>
                <Link href="/contact">Contact</Link>
                <a href="https://github.com/rohit-012005/BlockPass" rel="noreferrer noopener" target="_blank">
                  Source
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.88)] px-4 py-2 text-sm text-[var(--text-dim)] transition hover:-translate-y-px hover:border-[var(--border-strong)] hover:text-[var(--text)]"
    >
      {children}
    </Link>
  )
}

function readAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL
  if (!value) return 'http://localhost:3000'
  try {
    return new URL(value).toString()
  } catch {
    return 'http://localhost:3000'
  }
}
