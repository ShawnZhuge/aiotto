import type { ReactNode } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CircleDollarSign,
  Database,
  Layers3,
  Sparkles,
} from 'lucide-react'
import { AnimatedActivityIcon, AnimatedIcon } from '../../components/animatedLucide'
import {
  formatCompactTokenCount,
  formatPercentLabel,
  formatUsdAmount,
  formatUsageInteger,
  formatUsageMetricValue,
  type UsageStatisticsDashboardSnapshot,
} from '../../domain/usageStatistics'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

export function UsageHero({
  dashboard,
}: {
  dashboard: UsageStatisticsDashboardSnapshot
}) {
  const totalTokens = dashboard.summary.totalTokens

  return (
    <section className="liquid-glass-card min-w-0 aiotto-radius-card p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center aiotto-radius-card bg-primary/10 text-primary shadow-sm">
            <AnimatedIcon icon={AnimatedActivityIcon} size={24} />
          </div>
          <div className="min-w-0">
            <div className={cn(typography.listTitle, 'text-muted-foreground')}>真实消耗 Tokens</div>
            <div className="mt-1 flex min-w-0 flex-wrap items-end gap-3">
              <div
                className={cn('min-w-0 max-w-full truncate', typography.metricPrimary)}
                title={formatUsageInteger(totalTokens)}
              >
                {formatUsageInteger(totalTokens)}
              </div>
              <span className={cn('rounded-full bg-muted/70 px-3 py-1 text-muted-foreground', typography.badgeText)}>
                ≈ {formatCompactTokenCount(totalTokens)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid min-w-[260px] grid-cols-2 gap-2 aiotto-radius-card border border-border/70 bg-card/55 p-3 shadow-sm">
          <MiniMetric
            icon={<Sparkles aria-hidden="true" className="size-4 text-primary" />}
            label="总请求数"
            title={formatUsageInteger(dashboard.summary.totalRequests)}
            value={formatUsageInteger(dashboard.summary.totalRequests)}
          />
          <MiniMetric
            icon={<CircleDollarSign aria-hidden="true" className="size-4 text-emerald-500" />}
            label="总成本"
            title={formatUsdAmount(dashboard.summary.totalCostUsd)}
            value={formatUsdAmount(dashboard.summary.totalCostUsd)}
            valueClassName="text-emerald-500"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        <UsageMetricCard
          icon={<ArrowDownToLine aria-hidden="true" className="size-4" />}
          label="新增输入"
          rawValue={dashboard.summary.totalInputTokens}
          value={formatUsageMetricValue(dashboard.summary.totalInputTokens)}
        />
        <UsageMetricCard
          icon={<ArrowUpFromLine aria-hidden="true" className="size-4" />}
          label="输出"
          rawValue={dashboard.summary.totalOutputTokens}
          value={formatUsageMetricValue(dashboard.summary.totalOutputTokens)}
        />
        <UsageMetricCard
          icon={<Database aria-hidden="true" className="size-4" />}
          label="缓存读取"
          rawValue={dashboard.summary.totalCacheReadTokens}
          value={formatUsageMetricValue(dashboard.summary.totalCacheReadTokens)}
        />
        <UsageMetricCard
          icon={<Layers3 aria-hidden="true" className="size-4" />}
          label="缓存创建"
          rawValue={dashboard.summary.totalCacheCreationTokens}
          value={formatUsageMetricValue(dashboard.summary.totalCacheCreationTokens)}
        />
        <UsageMetricCard
          icon={<Layers3 aria-hidden="true" className="size-4" />}
          label="会话数"
          rawValue={dashboard.summary.distinctSessionCount}
          value={formatUsageInteger(dashboard.summary.distinctSessionCount)}
        />
        <MeterMetricCard
          accentClassName="bg-emerald-500"
          label="缓存命中率"
          value={formatPercentLabel(dashboard.summary.cacheHitRate)}
          widthRatio={dashboard.summary.cacheHitRate}
        />
      </div>
    </section>
  )
}

function MiniMetric({
  icon,
  label,
  value,
  title,
  valueClassName,
}: {
  icon: ReactNode
  label: string
  value: string
  title: string
  valueClassName?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">
      {icon}
      <div className="min-w-0">
        <div className={cn(typography.listMeta, 'text-muted-foreground')}>{label}</div>
        <div className={cn('truncate', typography.metricSecondary, valueClassName)} title={title}>
          {value}
        </div>
      </div>
    </div>
  )
}

function UsageMetricCard({
  icon,
  label,
  value,
  rawValue,
}: {
  icon: ReactNode
  label: string
  value: string
  rawValue: number
}) {
  return (
    <div className="min-w-0 aiotto-radius-card border border-border/70 bg-card/60 p-4 shadow-sm">
      <div className={cn('flex min-w-0 items-center gap-2 text-muted-foreground', typography.listTitle)}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn('mt-2 truncate text-[clamp(1.125rem,1.5vw,1.5rem)] tracking-normal', typography.metricSecondary)}
        title={formatUsageInteger(rawValue)}
      >
        {value}
      </div>
    </div>
  )
}

function MeterMetricCard({
  label,
  value,
  widthRatio,
  accentClassName,
}: {
  label: string
  value: string
  widthRatio: number
  accentClassName: string
}) {
  return (
    <div className="min-w-0 aiotto-radius-card border border-border/70 bg-card/60 p-4 shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className={cn('truncate text-muted-foreground', typography.listTitle)}>{label}</div>
        <div className={cn('shrink-0', typography.metricSecondary)}>{value}</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', accentClassName)}
          style={{ width: `${Math.min(100, Math.max(0, widthRatio * 100))}%` }}
        />
      </div>
    </div>
  )
}
