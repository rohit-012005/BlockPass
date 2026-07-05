'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackEvent } from '@/lib/telemetry'

export function PageTelemetry() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    trackEvent('page_view', {
      path: query ? `${pathname}?${query}` : pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    })
  }, [pathname, searchParams])

  return null
}
