import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import {
  formatCompactTokenCount,
  formatTrendAxisLabel,
  formatTrendTooltipTokenCount,
  formatTrendTooltipUsdAmount,
  formatTrendUsdAmount,
  type UsageStatisticsRange,
  type UsageStatisticsTrendPoint,
} from '../../domain/usageStatistics'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

type UsageTrendChartDatum = {
  date: string
  label: string
  input: number
  output: number
  cacheRead: number
  cacheCreation: number
  cost: number
}

const tokenSeries = [
  { key: 'input', label: '输入', color: 'rgb(59 130 246)', fillId: 'usageInputFill' },
  { key: 'output', label: '输出', color: 'rgb(16 185 129)', fillId: 'usageOutputFill' },
  { key: 'cacheRead', label: '缓存读取', color: 'rgb(139 92 246)', fillId: 'usageCacheReadFill' },
  { key: 'cacheCreation', label: '缓存创建', color: 'rgb(245 158 11)', fillId: 'usageCacheCreateFill' },
] as const

const usageTrendAxisTick = { fill: 'currentColor', fontSize: 12 }

function withUsageTrendAxisHeadroom(dataMax: number) {
  return Math.max(1, Math.ceil(dataMax * 1.22))
}

export function UsageTrendChart({
  points,
  range,
}: {
  points: UsageStatisticsTrendPoint[]
  range: UsageStatisticsRange
}) {
  const chartData = points.map<UsageTrendChartDatum>((point) => ({
    date: point.date,
    label: formatTrendAxisLabel(point, range),
    input: point.totalInputTokens,
    output: point.totalOutputTokens,
    cacheRead: point.totalCacheReadTokens,
    cacheCreation: point.totalCacheCreationTokens,
    cost: Number.parseFloat(point.totalCostUsd) || 0,
  }))
  const hasData = chartData.length > 0

  return (
    <div
      aria-label="使用统计趋势图"
      className="relative flex min-h-[380px] flex-col overflow-visible rounded-[18px] border border-border/60 bg-background/35 p-3 text-muted-foreground dark:text-slate-300"
      role="img"
    >
      {hasData ? null : (
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 bottom-12 z-[1] grid place-items-center text-muted-foreground', typography.listTitle)}>
          暂无趋势数据
        </div>
      )}
      <ResponsiveContainer className="min-h-[320px] flex-1" height="100%" minHeight={320} width="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 24, right: 10, bottom: 4, left: 0 }}
          syncId="aiotto-usage-statistics"
        >
          <defs>
            {tokenSeries.map((series) => (
              <linearGradient id={series.fillId} key={series.key} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={series.color} stopOpacity={0.18} />
                <stop offset="95%" stopColor={series.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            opacity={0.4}
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="label"
            dy={10}
            minTickGap={18}
            tick={usageTrendAxisTick}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={[0, withUsageTrendAxisHeadroom]}
            tick={usageTrendAxisTick}
            tickFormatter={(value) => formatCompactTokenCount(Number(value))}
            tickLine={false}
            tickMargin={10}
            width={62}
            yAxisId="tokens"
          />
          <YAxis
            axisLine={false}
            domain={[0, withUsageTrendAxisHeadroom]}
            orientation="right"
            tick={usageTrendAxisTick}
            tickFormatter={(value) => formatTrendUsdAmount(Number(value))}
            tickLine={false}
            tickMargin={10}
            width={68}
            yAxisId="cost"
          />
          <RechartsTooltip
            content={(props) => <UsageTrendTooltip {...props} />}
            cursor={{ stroke: 'rgb(148 163 184)', strokeOpacity: 0.36, strokeWidth: 1 }}
            isAnimationActive={false}
          />
          {tokenSeries.map((series) => (
            <Area
              activeDot={{ r: 4, strokeWidth: 3 }}
              dataKey={series.key}
              dot={false}
              fill={`url(#${series.fillId})`}
              key={series.key}
              name={series.label}
              stroke={series.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              type="monotone"
              yAxisId="tokens"
            />
          ))}
          <Area
            activeDot={{ r: 4, strokeWidth: 3 }}
            dataKey="cost"
            dot={false}
            fill="none"
            name="成本"
            stroke="rgb(244 63 94)"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            type="monotone"
            yAxisId="cost"
          />
        </AreaChart>
      </ResponsiveContainer>
      <UsageTrendLegend />
    </div>
  )
}

function UsageTrendLegend() {
  return (
    <div className={cn('mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pb-1 text-muted-foreground', typography.controlText)}>
      <UsageTrendLegendDot color="bg-primary" label="输入" />
      <UsageTrendLegendDot color="bg-emerald-500" label="输出" />
      <UsageTrendLegendDot color="bg-violet-500" label="缓存读取" />
      <UsageTrendLegendDot color="bg-amber-500" label="缓存创建" />
      <UsageTrendLegendDot color="bg-rose-500" label="成本" />
    </div>
  )
}

function UsageTrendLegendDot({
  color,
  label,
}: {
  color: string
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('size-2.5 rounded-full', color)} />
      {label}
    </span>
  )
}

function UsageTrendTooltip({
  active,
  label,
  payload,
}: TooltipContentProps) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="min-w-[240px] rounded-[14px] border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-md">
      <div className={cn('mb-2', typography.cardTitle, 'text-sm')}>{label}</div>
      <div className="grid gap-1.5">
        {payload.map((entry) => {
          const value = Number(entry.value ?? 0)
          const isCost = entry.dataKey === 'cost'

          return (
            <div
              className={cn('flex items-center justify-between gap-4 text-muted-foreground', typography.navLabel)}
              key={String(entry.dataKey)}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="truncate">{entry.name}</span>
              </span>
              <span
                className={cn('shrink-0', typography.tableNumber, isCost && 'text-rose-500')}
              >
                {isCost ? formatTrendTooltipUsdAmount(value) : formatTrendTooltipTokenCount(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
