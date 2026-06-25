import type { ThreadRecord } from './models'

export type ThreadAnalyticsSummary = {
  totalThreads: number
  totalStorageBytes: number
  activeDays: number
  avgThreadsPerActiveDay: number
  lostThreadCount: number
  missingProjectDirectoryCount: number
  orphanedThreadCount: number
  recoverableThreadCount: number
}

export type ThreadDailyTrend = {
  label: string
  sessionCount: number
  tokenTotal: number
  toolCallCount: number
  codeChangeCount: number
}

export type ThreadTrendPeriod = 'day' | 'week' | 'month'

export type ThreadAnalytics = {
  summary: ThreadAnalyticsSummary
  dailyTrends: ThreadDailyTrend[]
}

export function buildThreadAnalytics(threads: ThreadRecord[]): ThreadAnalytics {
  let totalStorageBytes = 0

  for (const thread of threads) {
    totalStorageBytes += thread.sourceSizeBytes ?? 0
  }

  const dailyTrends = buildThreadTrends(threads, 'day')
  const activeDays = dailyTrends.length
  const totalThreads = threads.length

  return {
    summary: {
      totalThreads,
      totalStorageBytes,
      activeDays,
      avgThreadsPerActiveDay: activeDays === 0 ? 0 : totalThreads / activeDays,
      lostThreadCount: threads.filter((thread) => thread.lost).length,
      missingProjectDirectoryCount: threads.filter((thread) => thread.missingProjectDirectory).length,
      orphanedThreadCount: threads.filter((thread) => thread.orphaned).length,
      recoverableThreadCount: threads.filter((thread) => thread.recoverable ?? thread.restoreAvailable).length,
    },
    dailyTrends,
  }
}

export function buildThreadTrends(threads: ThreadRecord[], period: ThreadTrendPeriod): ThreadDailyTrend[] {
  const trends = new Map<string, ThreadDailyTrend>()

  for (const thread of threads) {
    const label = trendLabel(thread.lastUpdatedAt, period)
    const trend = trends.get(label) ?? {
      label,
      sessionCount: 0,
      tokenTotal: 0,
      toolCallCount: 0,
      codeChangeCount: 0,
    }

    trend.sessionCount += 1
    trend.tokenTotal += thread.tokenUsage?.totalTokens ?? 0
    trend.toolCallCount += thread.toolCallCount ?? 0
    trend.codeChangeCount += thread.codeChangeCount ?? 0
    trends.set(label, trend)
  }

  return Array.from(trends.values()).sort((left, right) => left.label.localeCompare(right.label))
}

function trendLabel(value: string, period: ThreadTrendPeriod): string {
  if (period === 'month') {
    return monthLabel(value)
  }
  if (period === 'week') {
    return weekLabel(value)
  }
  return dayLabel(value)
}

function dayLabel(value: string): string {
  return value && !value.startsWith('1970-01-01') ? value.slice(0, 10) : 'Unknown'
}

function monthLabel(value: string): string {
  return value && !value.startsWith('1970-01-01') ? value.slice(0, 7) : 'Unknown'
}

function weekLabel(value: string): string {
  const date = parseThreadDate(value)
  if (!date) {
    return 'Unknown'
  }

  const day = date.getUTCDay() || 7
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 4 - day))
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)

  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function parseThreadDate(value: string): Date | null {
  if (!value || value.startsWith('1970-01-01')) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
