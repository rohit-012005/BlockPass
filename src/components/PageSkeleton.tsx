export function PageSkeleton({ title, lines = 3 }: { title: string; lines?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="surface surface-strong p-6 md:p-7">
        <div className="space-y-4">
          <div className="h-10 w-48 animate-pulse rounded-full bg-[rgba(35,28,21,0.06)]" />
          <div className="grid gap-3">
            {Array.from({ length: lines }).map((_, index) => (
              <div key={index} className="h-4 w-full animate-pulse rounded-full bg-[rgba(35,28,21,0.06)]" />
            ))}
          </div>
        </div>
      </div>
      <div className="text-sm text-[var(--text-dim)]">Loading {title}…</div>
    </div>
  )
}
