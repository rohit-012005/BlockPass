import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import './globals.css'
import { WalletButton } from '@/components/WalletButton'
import { isTestnet, NETWORK } from '@/lib/stellar'
import { CONTRACT_ID } from '@/lib/stellar'
import { PageTelemetry } from '@/components/PageTelemetry'
import { PageMotion } from '@/components/PageMotion'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
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
      <body className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
        <Suspense fallback={null}>
          <PageTelemetry />
        </Suspense>
        <div className="page-shell">
          <header className="site-header">
            <div className="site-brand">
              <Link href="/" className="brand-mark">
                BlockPass
              </Link>
              <span className="brand-subtitle">Decentralized event escrow</span>
            </div>
            <nav className="site-nav" aria-label="Primary">
              <Link href="/story">Story</Link>
              <Link href="/product">Product</Link>
              <Link href="/roadmap">Roadmap</Link>
              <Link href="/create">Create</Link>
              <Link href="/organizer/dashboard">Dashboard</Link>
            </nav>
            <div className="site-actions">
              <span
                className={`tag ${isTestnet() ? 'tag-warning' : 'tag-success'}`}
                title={`Network: ${NETWORK.networkPassphrase}`}
              >
                {isTestnet() ? 'Testnet' : 'Mainnet'}
              </span>
              {!contractDeployed && (
                <span className="tag tag-danger" title="Run npm run contract:deploy">
                  contract not set
                </span>
              )}
              <WalletButton />
            </div>
          </header>
          <main className="page-main">
            <PageMotion>{children}</PageMotion>
          </main>
          <footer className="site-footer">
            <div>
              <div className="footer-title">BlockPass</div>
              <div className="muted">Built on Stellar · escrow, refunds, and check-in</div>
            </div>
            <div className="footer-links">
              <Link href="/story">Story</Link>
              <Link href="/product">Product</Link>
              <Link href="/roadmap">Roadmap</Link>
              <a href="https://github.com/" rel="noreferrer noopener" target="_blank">
                Source
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
