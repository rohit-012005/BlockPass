'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/telemetry'

export function PageTelemetry() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    const query = searchParams.toString()
    const key = query ? `${pathname}?${query}` : pathname
    if (lastSent.current === key) return
    lastSent.current = key
    trackEvent('page_view', {
      path: key,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    })
  }, [pathname, searchParams])

  return null
}
