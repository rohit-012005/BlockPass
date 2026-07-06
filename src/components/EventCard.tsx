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
    <Link
      href={`/event/${event.id}`}
      className="block rounded-[18px] border-2 border-[rgba(38,31,24,0.18)] bg-[linear-gradient(180deg,rgba(255,255,252,0.96),rgba(249,243,233,0.96))] p-[1.35rem] text-inherit shadow-[6px_6px_0_rgba(34,28,21,0.1)] backdrop-blur-[16px]"
    >
      <div className="flex items-center justify-between gap-3">
        {statusTag}
        <span className="text-[rgba(25,21,18,0.72)]">{formatUnixDateTime(event.starts_at)}</span>
      </div>
      <h3 className="mt-2 text-[1.2rem] font-display tracking-[-0.03em]">{event.title}</h3>
      <p className="m-0 text-[rgba(25,21,18,0.72)]">{event.venue}</p>
      <div className="mt-3 grid gap-3">
        <div className="h-[10px] overflow-hidden rounded-full border border-[rgba(38,31,24,0.18)] bg-[rgba(255,255,255,0.03)]">
          <div className="h-full bg-[linear-gradient(90deg,#bce97a,#f3b175)] transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[rgba(25,21,18,0.72)]">
            {sold} of {capacity} sold
          </span>
          <span className="font-mono text-[0.9rem]">
            {formatTokenAmount(event.price, 7)} XLM
          </span>
        </div>
      </div>
    </Link>
  )
}
