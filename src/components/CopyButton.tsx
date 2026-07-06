'use client'

import { useState } from 'react'

export function CopyButton({
  value,
  label = 'Copy',
  disabled = false,
}: {
  value: string
  label?: string
  disabled?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    if (disabled || !value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled || !value}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(255,252,247,0.92)] px-4 py-3 font-semibold transition hover:-translate-y-px hover:border-[var(--border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
