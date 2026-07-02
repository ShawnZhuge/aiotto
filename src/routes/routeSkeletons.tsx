import type { AiottoRouteMeta } from './routeTypes'
import type { CSSProperties } from 'react'
import { DrawingFrameLoadingIndicator } from '../components/states'

const skeletonLineClass = 'aiotto-skeleton-shimmer aiotto-radius-button bg-muted/70'

function SkeletonLine({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`${skeletonLineClass} ${className}`} style={style} />
}

function SkeletonPanel({ rows = 4 }: { rows?: number }) {
  return (
    <div className="aiotto-radius-card border border-border/60 bg-card/60 p-4">
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-4 last:border-b-0" key={index}>
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="h-3 w-full max-w-md" />
            </div>
            <SkeletonLine className="h-8 w-20 shrink-0 aiotto-radius-button" />
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div
      className={`grid gap-4 ${count > 2 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}
      data-testid="route-skeleton-metrics"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div className="aiotto-radius-card border border-border/60 bg-card/60 p-4" key={index}>
          <SkeletonLine className="mb-4 h-4 w-24" />
          <SkeletonLine className="h-8 w-20" />
          <SkeletonLine className="mt-4 h-3 w-full max-w-40" />
        </div>
      ))}
    </div>
  )
}

function ChartLoadingPanel() {
  return (
    <div
      className="aiotto-radius-card border border-border/60 bg-card/60 p-4"
      data-testid="route-skeleton-chart-loading-panel"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-3 w-56 max-w-full" />
        </div>
        <SkeletonLine className="h-7 w-16" />
      </div>
      <div className="relative h-56 overflow-hidden aiotto-radius-inset border border-border/45 bg-background/45">
        <DrawingFrameLoadingIndicator label="正在准备图表区域" className="h-full min-h-0" />
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="aiotto-radius-card overflow-hidden border border-border/60 bg-card/60"
      data-testid="route-skeleton-table"
    >
      <div className="grid grid-cols-5 gap-3 border-b border-border/50 p-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonLine className="h-3 w-full" key={index} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="grid grid-cols-5 gap-3 border-b border-border/35 p-3 last:border-b-0" key={rowIndex}>
          {Array.from({ length: 5 }).map((_, cellIndex) => (
            <SkeletonLine className="h-3 w-full" key={cellIndex} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ListDetailSkeleton() {
  return (
    <div
      className="grid min-h-[420px] gap-4 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.6fr)]"
      data-testid="route-skeleton-list-detail"
    >
      <div className="aiotto-radius-card border border-border/60 bg-card/60 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <SkeletonLine className="h-8 w-full" />
          <SkeletonLine className="h-8 w-8 shrink-0" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div className="aiotto-radius-inset border border-border/45 bg-background/40 p-3" key={index}>
              <SkeletonLine className="h-4 w-36" />
              <SkeletonLine className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="aiotto-radius-card border border-border/60 bg-card/60 p-4">
        <SkeletonLine className="h-6 w-48" />
        <SkeletonLine className="mt-3 h-3 w-full max-w-xl" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="aiotto-radius-inset border border-border/45 bg-background/40 p-3" key={index}>
              <SkeletonLine className="h-3 w-24" />
              <SkeletonLine className="mt-3 h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLine className="h-12 w-full" key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonLine className="h-9 w-24 aiotto-radius-button" key={index} />
        ))}
      </div>
      <SkeletonPanel rows={6} />
    </>
  )
}

function DiagnosticsSkeleton() {
  return (
    <>
      <MetricSkeletonGrid count={3} />
      <SkeletonPanel rows={6} />
    </>
  )
}

export function AiottoRouteSkeleton({ kind }: { kind: AiottoRouteMeta['skeletonKind'] }) {
  return (
    <section
      aria-label="页面加载中"
      className="h-full min-h-0 overflow-y-auto bg-background/50 p-4"
      data-aiotto-route-skeleton={kind}
      role="status"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-4 w-full max-w-xl" />
        </div>

        {kind === 'dashboard' ? (
          <>
            <MetricSkeletonGrid count={4} />
            <ChartLoadingPanel />
            <TableSkeleton rows={4} />
          </>
        ) : null}

        {kind === 'list' ? <ListDetailSkeleton /> : null}
        {kind === 'settings' ? <SettingsSkeleton /> : null}
        {kind === 'diagnostics' ? <DiagnosticsSkeleton /> : null}
      </div>
    </section>
  )
}
