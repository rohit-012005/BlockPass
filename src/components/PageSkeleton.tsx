export function PageSkeleton({ title, lines = 3 }: { title: string; lines?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-live="polite">
      <div className="surface stack">
        <div className="skeleton skeleton-title" />
        <div className="stack">
          {Array.from({ length: lines }).map((_, index) => (
            <div key={index} className="skeleton skeleton-line" />
          ))}
        </div>
      </div>
      <div className="muted" style={{ fontSize: '0.9rem' }}>
        Loading {title}…
      </div>
    </div>
  )
}
