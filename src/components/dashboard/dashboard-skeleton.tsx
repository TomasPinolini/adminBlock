export function DashboardSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
        <div className="h-72 animate-pulse rounded-lg border bg-muted" />
      </div>

      {/* Lists skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-lg border bg-muted" />
        <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      </div>
    </div>
  )
}
