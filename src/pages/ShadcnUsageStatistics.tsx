import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { UsageHero, UsagePricingPanel, UsageTrendChart } from '../features/statistics'
import { useUsageStatistics } from '../hooks/useUsageStatistics'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../lib/utils'
import {
  formatRequestTimestamp,
  formatUsageInteger,
  type UsageStatisticsRange,
} from '../domain/usageStatistics'

const ranges: Array<{ value: UsageStatisticsRange; label: string }> = [
  { value: 'today', label: '当天' },
  { value: '1d', label: '1d' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
]

export function ShadcnUsageStatistics() {
  const [range, setRange] = useState<UsageStatisticsRange>('30d')
  const [page, setPage] = useState(0)
  const input = useMemo(
    () => ({
      range,
      sourceFilter: 'codex' as const,
      page,
      pageSize: 20,
    }),
    [page, range],
  )
  const { dashboard, refreshing, reload } = useUsageStatistics(input)
  const pageCount = Math.max(1, Math.ceil(dashboard.requestLogPage.total / dashboard.requestLogPage.pageSize))

  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">使用统计</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              查看本地会话的请求级使用情况、缓存命中和成本聚合。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-[14px] border border-border/70 bg-background/70 p-1">
              {ranges.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    'h-8 rounded-[10px] px-3 text-sm font-medium text-muted-foreground transition-colors',
                    range === item.value && 'bg-primary text-primary-foreground shadow-sm',
                  )}
                  onClick={() => {
                    setPage(0)
                    setRange(item.value)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => void reload()}>
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              刷新
            </Button>
          </div>
        </section>

        <UsageHero dashboard={dashboard} />

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">使用趋势</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">曲线使用本地请求记录聚合，刷新不会清空已有展示。</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1">{range}</Badge>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <UsageTrendChart points={dashboard.trendPoints} range={range} />
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold">请求日志</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                共 {formatUsageInteger(dashboard.requestLogPage.total)} 条记录
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                aria-label="上一页"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                {page + 1} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                aria-label="下一页"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-b-[22px] p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-y border-border/70 bg-muted/35 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">时间</th>
                    <th className="px-6 py-3 font-medium">来源</th>
                    <th className="px-6 py-3 font-medium">模型</th>
                    <th className="px-6 py-3 font-medium">输入</th>
                    <th className="px-6 py-3 font-medium">输出</th>
                    <th className="px-6 py-3 font-medium">总成本</th>
                    <th className="px-6 py-3 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.requestLogPage.rows.length > 0 ? (
                    dashboard.requestLogPage.rows.map((row) => (
                      <tr key={row.requestId} className="border-b border-border/50">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{formatRequestTimestamp(row.createdAt)}</td>
                        <td className="px-6 py-4">{row.sourceName || row.appType || 'Codex'}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.model || row.requestModel || '-'}</td>
                        <td className="px-6 py-4 font-mono">{formatUsageInteger(row.inputTokens)}</td>
                        <td className="px-6 py-4 font-mono">{formatUsageInteger(row.outputTokens)}</td>
                        <td className="px-6 py-4 font-mono">${Number(row.totalCostUsd || 0).toFixed(4)}</td>
                        <td className="px-6 py-4">
                          <span className={cn('font-mono text-sm', row.statusCode >= 200 && row.statusCode < 300 ? 'text-emerald-600' : 'text-rose-500')}>
                            {row.statusCode || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        暂无请求日志
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <UsagePricingPanel />
      </div>
    </div>
  )
}

export default ShadcnUsageStatistics
