import Link from 'next/link'
import type { EventRecord } from '@/types'
import { eventStatusLabel, formatTokenAmount, formatUnixDateTime, progressPercent } from '@/lib/format'
import { EVENT_STATUS } from '@/types'

interface Props {
  event: EventRecord
}

export function EventCard({ event }: Props) {
  const sold = event.sold
  const capacity = event.capacity
  const percent = progressPercent(sold, capacity)
  const statusTag = (() => {
    switch (event.status) {
      case EVENT_STATUS.ON_SALE:
        return <span className="tag tag-success">On sale</span>
      case EVENT_STATUS.SOLD_OUT:
        return <span className="tag tag-warning">Sold out</span>
      case EVENT_STATUS.CONFIRMED:
        return <span className="tag">Confirmed</span>
      case EVENT_STATUS.CANCELLED:
        return <span className="tag tag-danger">Cancelled</span>
      case EVENT_STATUS.REFUNDED:
        return <span className="tag">Refunded</span>
      default:
        return <span className="tag">{eventStatusLabel(event.status)}</span>
    }
  })()

  return (
    <Link href={`/event/${event.id}`} className="card" style={{ display: 'block', color: 'inherit' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        {statusTag}
        <span className="muted">{formatUnixDateTime(event.starts_at)}</span>
      </div>
      <h3 className="h3" style={{ marginTop: '0.5rem' }}>{event.title}</h3>
      <p className="muted" style={{ margin: 0 }}>{event.venue}</p>
      <div className="stack" style={{ marginTop: '0.75rem' }}>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted">
            {sold} of {capacity} sold
          </span>
          <span className="mono">
            {formatTokenAmount(event.price, 7)} XLM
          </span>
        </div>
      </div>
    </Link>
  )
}
