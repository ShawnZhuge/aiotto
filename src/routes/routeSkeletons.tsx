import type { AiottoRouteMeta } from './routeTypes'

const skeletonLineClass = 'rounded-[6px] bg-muted/70'

function SkeletonLine({ className }: { className: string }) {
  return <div className={`${skeletonLineClass} ${className}`} />
}

function SkeletonPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-[8px] border border-border/60 bg-card/60 p-5">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4 last:border-b-0" key={index}>
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-full max-w-md" />
            </div>
            <SkeletonLine className="h-8 w-20 shrink-0 rounded-[8px]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AiottoRouteSkeleton({ kind }: { kind: AiottoRouteMeta['skeletonKind'] }) {
  const metricCount = kind === 'dashboard' ? 4 : kind === 'diagnostics' ? 3 : 2

  return (
    <section
      aria-label="页面加载中"
      className="h-full min-h-0 overflow-y-auto bg-background/50 p-6"
      role="status"
    >
      <div className="mx-auto flex max-w-7xl animate-pulse flex-col gap-6">
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-4 w-full max-w-xl" />
        </div>

        {kind === 'settings' ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonLine className="h-9 w-24 rounded-[8px]" key={index} />
            ))}
          </div>
        ) : null}

        <div className={`grid gap-4 ${metricCount > 2 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
          {Array.from({ length: metricCount }).map((_, index) => (
            <div className="rounded-[8px] border border-border/60 bg-card/60 p-5" key={index}>
              <SkeletonLine className="mb-4 h-4 w-24" />
              <SkeletonLine className="h-8 w-20" />
            </div>
          ))}
        </div>

        <SkeletonPanel rows={kind === 'diagnostics' ? 5 : 4} />
      </div>
    </section>
  )
}
