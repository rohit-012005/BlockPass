import Link from 'next/link'
import { CONTRACT_ID, isTestnet, NETWORK } from '@/lib/stellar'
import { getContractVersion } from '@/lib/contract'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let version: string | null = null
  let versionError: string | null = null
  if (CONTRACT_ID) {
    try {
      version = await getContractVersion()
    } catch (e) {
      versionError = e instanceof Error ? e.message : 'Failed to read contract version'
    }
  }
  return (
    <div className="stack">
      <section className="card" style={{ padding: '2.5rem' }}>
        <span className="tag tag-accent">Powered by Stellar Testnet</span>
        <h1 className="h1" style={{ marginTop: '1rem' }}>
          Sell tickets. Cancel cleanly. Refund everyone in one transaction.
        </h1>
        <p className="muted" style={{ maxWidth: 640, fontSize: '1.05rem' }}>
          Event Pot is a small, no-fee way to collect ticket money for a small event. Money sits
          in a Soroban contract until the event. If the organizer cancels, every buyer is
          refunded automatically — no manual UPI reversals, no chasing anyone.
        </p>
        <div className="row" style={{ marginTop: '1.5rem' }}>
          <Link href="/create" className="btn btn-primary">
            Create an event
          </Link>
          <Link href="/me/tickets" className="btn btn-ghost">
            My tickets
          </Link>
          <Link href="/organizer/dashboard" className="btn btn-ghost">
            Organizer dashboard
          </Link>
        </div>
        <div className="divider" />
        <div className="row" style={{ gap: '2rem', flexWrap: 'wrap' }}>
          <Stat label="Network" value={isTestnet() ? 'Testnet' : 'Public'} />
          <Stat label="RPC" value={trim(NETWORK.rpcUrl, 36)} />
          <Stat
            label="Contract"
            value={CONTRACT_ID ? trim(CONTRACT_ID, 16) : 'not deployed'}
            accent={!CONTRACT_ID}
          />
          <Stat
            label="Contract version"
            value={versionError ? 'unreachable' : (version ?? '—')}
            accent={Boolean(versionError)}
          />
        </div>
        {versionError && (
          <div className="notice notice-error" style={{ marginTop: '1rem' }}>
            Could not reach the contract at <span className="mono">{CONTRACT_ID}</span>:{' '}
            {versionError}
          </div>
        )}
      </section>

      <section className="grid-2">
        <Feature
          title="Held in escrow, not in your wallet"
          body="Ticket money is transferred from the buyer into the contract via the Stellar Asset Contract. The organizer can't run off with it."
        />
        <Feature
          title="Atomic batch refund on cancel"
          body="If the event is cancelled, the contract iterates every active ticket and SAC-transfers the price back. If any one transfer fails, the whole transaction reverts — no half-refunded events."
        />
        <Feature
          title="Self-refund before cutoff"
          body="Buyers can self-refund any time before the refund cutoff timestamp. After that, the organizer keeps the funds and confirms the event."
        />
        <Feature
          title="Door QR check-in"
          body="Each ticket gets a server-signed QR token. The organizer scans it, the server verifies the HMAC, and the on-chain check_in is recorded."
        />
      </section>
    </div>
  )
}

function trim(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div className={accent ? 'tag tag-danger' : 'mono'} style={{ marginTop: '0.25rem' }}>
        {value}
      </div>
    </div>
  )
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3 className="h3">{title}</h3>
      <p className="muted" style={{ margin: 0 }}>
        {body}
      </p>
    </div>
  )
}
