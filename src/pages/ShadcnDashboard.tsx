import { Archive, BarChart3, Database, MessageSquare, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { UsageTrendChart } from '../features/statistics'
import { useThreads } from '../hooks/useThreads'
import { useUsageStatistics } from '../hooks/useUsageStatistics'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../lib/utils'
import { formatUsageInteger, formatUsageMetricValue, type UsageStatisticsRange } from '../domain/usageStatistics'

const dashboardRanges: Array<{ value: UsageStatisticsRange; label: string }> = [
  { value: 'today', label: '当天' },
  { value: '1d', label: '1d' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
]

export function ShadcnDashboard() {
  const [range, setRange] = useState<UsageStatisticsRange>('7d')
  const usageInput = useMemo(
    () => ({
      range,
      sourceFilter: 'codex' as const,
      page: 0,
      pageSize: 8,
    }),
    [range],
  )
  const { threads, loading: threadsLoading, reload: reloadThreads } = useThreads()
  const { dashboard, loading: usageLoading, refreshing, reload } = useUsageStatistics(usageInput)
  const summary = dashboard.summary

  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5">
        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr_1fr]">
          <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
            <CardHeader className="p-6 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl font-semibold">Aiotto Community</CardTitle>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    公开精简版保留本地会话、用量统计、扩展清单与备份视图。
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">Community</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 pt-2 sm:grid-cols-3">
              <DashboardMetric icon={MessageSquare} label="会话数" loading={threadsLoading} value={formatUsageInteger(threads.length)} />
              <DashboardMetric icon={BarChart3} label="请求数" loading={usageLoading} value={formatUsageInteger(summary.totalRequests)} />
              <DashboardMetric icon={Database} label="Token 消耗" loading={usageLoading} value={formatUsageMetricValue(summary.totalTokens)} />
            </CardContent>
          </Card>

          <DashboardStatCard icon={Archive} label="缓存命中率" value={`${summary.cacheHitRate.toFixed(1)}%`} />
          <DashboardStatCard icon={RefreshCw} label="统计状态" value={refreshing ? '刷新中' : '已就绪'} />
        </section>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 p-6 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">使用趋势</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">按本地会话用量聚合输入、输出、缓存与成本。</p>
            </div>
            <div className="inline-flex rounded-[14px] border border-border/70 bg-background/70 p-1">
              {dashboardRanges.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    'h-8 rounded-[10px] px-3 text-sm font-medium text-muted-foreground transition-colors',
                    range === item.value && 'bg-primary text-primary-foreground shadow-sm',
                  )}
                  onClick={() => setRange(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <UsageTrendChart points={dashboard.trendPoints} range={range} />
            <div className="mt-3 flex justify-end">
              <Button variant="outline" onClick={() => void Promise.all([reload(), reloadThreads()])}>
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardMetric({
  icon: Icon,
  label,
  loading,
  value,
}: {
  icon: typeof MessageSquare
  label: string
  loading: boolean
  value: string
}) {
  return (
    <div className="rounded-[16px] border border-border/70 bg-background/60 p-4">
      <Icon className="mb-4 h-5 w-5 text-primary" />
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-foreground">{loading ? '--' : value}</div>
    </div>
  )
}

function DashboardStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Archive
  label: string
  value: string
}) {
  return (
    <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
      <CardContent className="flex h-full min-h-[168px] flex-col justify-between p-6">
        <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-mono text-3xl font-semibold">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ShadcnDashboard
