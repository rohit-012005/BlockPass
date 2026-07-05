import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import './globals.css'
import { WalletButton } from '@/components/WalletButton'
import { isTestnet, NETWORK } from '@/lib/stellar'
import { CONTRACT_ID } from '@/lib/stellar'
import { PageTelemetry } from '@/components/PageTelemetry'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'BlockPass — collect tickets on Stellar',
  description:
    'A simple way to collect ticket money for a small event on Stellar, with automatic refunds if you cancel.',
  openGraph: {
    title: 'BlockPass',
    description: 'Collect ticket money on Stellar. Refund automatically on cancel.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const contractDeployed = CONTRACT_ID.length > 0
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <PageTelemetry />
        </Suspense>
        <header className="container app-header">
          <div className="row app-header__brand" style={{ gap: '1.25rem' }}>
            <Link href="/" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>
              BlockPass
            </Link>
            <Link href="/create" className="muted">
              Create event
            </Link>
            <Link href="/me/tickets" className="muted">
              My tickets
            </Link>
            <Link href="/organizer/dashboard" className="muted">
              Organizer
            </Link>
          </div>
          <div className="row app-header__actions">
            <span
              className={`tag ${isTestnet() ? 'tag-warning' : 'tag-success'}`}
              title={`Network: ${NETWORK.networkPassphrase}`}
            >
              {isTestnet() ? 'Testnet' : 'Public'}
            </span>
            {!contractDeployed && (
              <span className="tag tag-danger" title="Run npm run contract:deploy">
                contract not set
              </span>
            )}
            <WalletButton />
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="container muted" style={{ padding: '2rem 1.5rem', fontSize: '0.85rem' }}>
          Built on Stellar ·{' '}
          <a href="https://github.com/" rel="noreferrer noopener" target="_blank">
            Source
          </a>
        </footer>
      </body>
    </html>
  )
}
