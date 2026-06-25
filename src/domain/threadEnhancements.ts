import type { ThreadMessagePreview, ThreadRecord } from './models'

export type ThreadSourceKind = 'active' | 'archive' | 'trash' | 'recovered' | 'unknown'
export type ThreadTrashMode = 'exclude' | 'include' | 'only'
export type ThreadSortMode = 'recent' | 'attention' | 'heat'

export type ThreadEnhancementMetadata = {
  pinnedThreadIds: string[]
  trashRecords: ThreadTrashRecord[]
}

export type ThreadTrashRecord = {
  threadId: string
  sourceFile: string
  trashedAt: string
  originalSourceFile?: string | null
}

export type EnhancedThreadFilters = {
  metadata?: ThreadEnhancementMetadata
  query?: string
  projectPaths?: string[]
  statuses?: ThreadRecord['status'][]
  roles?: ThreadMessagePreview['role'][]
  sourceKinds?: ThreadSourceKind[]
  timeRange?: {
    from?: string | null
    to?: string | null
  }
  pinnedOnly?: boolean
  trashMode?: ThreadTrashMode
  sortBy?: ThreadSortMode
}

export type ThreadTimelineEventType = 'pinned' | 'trashed' | 'status' | 'message' | 'usage' | 'tool' | 'code'

export type ThreadTimelineEvent = {
  id: string
  type: ThreadTimelineEventType
  timestamp: string
  title: string
  detail: string
}

export type ThreadUsageCsvExport = {
  fileName: string
  content: string
}

const ATTENTION_STATUS_RANK: Record<ThreadRecord['status'], number> = {
  approval: 0,
  waiting: 1,
  failed: 2,
  running: 3,
  completed: 4,
  idle: 5,
  unknown: 6,
}

export function createEmptyThreadEnhancementMetadata(): ThreadEnhancementMetadata {
  return {
    pinnedThreadIds: [],
    trashRecords: [],
  }
}

export function togglePinnedThread(
  metadata: ThreadEnhancementMetadata,
  threadId: string,
): ThreadEnhancementMetadata {
  const pinned = new Set(metadata.pinnedThreadIds)
  if (pinned.has(threadId)) {
    pinned.delete(threadId)
  } else {
    pinned.add(threadId)
  }

  return {
    ...metadata,
    pinnedThreadIds: Array.from(pinned),
  }
}

export function selectEnhancedThreads(
  threads: ThreadRecord[],
  filters: EnhancedThreadFilters = {},
): ThreadRecord[] {
  const metadata = filters.metadata ?? createEmptyThreadEnhancementMetadata()
  const pinnedIds = new Set(metadata.pinnedThreadIds)
  const trashByThreadId = new Map(metadata.trashRecords.map((record) => [record.threadId, record]))
  const normalizedQuery = normalizeSearchText(filters.query ?? '')
  const projectPaths = new Set(filters.projectPaths ?? [])
  const statuses = new Set(filters.statuses ?? [])
  const roles = new Set(filters.roles ?? [])
  const sourceKinds = new Set(filters.sourceKinds ?? [])
  const trashMode = filters.trashMode ?? 'exclude'

  return threads
    .map((thread) => enhanceThread(thread, pinnedIds, trashByThreadId))
    .filter((thread) => {
      if (normalizedQuery && !normalizeSearchText(`${thread.title} ${thread.summary}`).includes(normalizedQuery)) {
        return false
      }
      if (projectPaths.size > 0 && !projectPaths.has(thread.projectPath)) {
        return false
      }
      if (statuses.size > 0 && !statuses.has(thread.status)) {
        return false
      }
      if (roles.size > 0 && !thread.recentMessages?.some((message) => roles.has(message.role))) {
        return false
      }
      if (sourceKinds.size > 0 && !sourceKinds.has(thread.sourceKind ?? inferThreadSourceKind(thread))) {
        return false
      }
      if (filters.timeRange?.from && thread.lastUpdatedAt.localeCompare(filters.timeRange.from) < 0) {
        return false
      }
      if (filters.timeRange?.to && thread.lastUpdatedAt.localeCompare(filters.timeRange.to) > 0) {
        return false
      }
      if (filters.pinnedOnly && !thread.pinned) {
        return false
      }
      if (trashMode === 'exclude' && thread.trashed) {
        return false
      }
      if (trashMode === 'only' && !thread.trashed) {
        return false
      }

      return true
    })
    .sort((left, right) => compareEnhancedThreads(left, right, filters.sortBy ?? 'recent'))
}

export function buildThreadTimeline(thread: ThreadRecord): ThreadTimelineEvent[] {
  const timestamp = thread.lastUpdatedAt || '1970-01-01T00:00:00.000Z'
  const events: ThreadTimelineEvent[] = []

  if (thread.pinned) {
    events.push({
      id: `${thread.threadId}-pinned`,
      type: 'pinned',
      timestamp,
      title: '已置顶',
      detail: '置顶状态保存在 Aiotto metadata，不修改 Codex 原始 session 文件。',
    })
  }

  if (thread.trashed) {
    events.push({
      id: `${thread.threadId}-trashed`,
      type: 'trashed',
      timestamp: thread.trashedAt ?? timestamp,
      title: '已移入回收站',
      detail: `来源文件：${thread.sourceFile}`,
    })
  }

  events.push({
    id: `${thread.threadId}-status`,
    type: 'status',
    timestamp,
    title: '当前状态',
    detail: thread.status,
  })

  const latestMessage = thread.recentMessages?.at(-1)
  if (latestMessage) {
    events.push({
      id: `${thread.threadId}-message`,
      type: 'message',
      timestamp: latestMessage.timestamp ?? timestamp,
      title: `最近消息 · ${latestMessage.role}`,
      detail: latestMessage.content,
    })
  }

  if (hasThreadTokenUsage(thread)) {
    events.push({
      id: `${thread.threadId}-usage`,
      type: 'usage',
      timestamp,
      title: 'Token usage',
      detail: `合计 ${formatNumber(thread.tokenUsage.totalTokens)}，输入 ${formatNumber(thread.tokenUsage.inputTokens)}，输出 ${formatNumber(thread.tokenUsage.outputTokens)}`,
    })
  }

  if ((thread.toolCallCount ?? 0) > 0) {
    events.push({
      id: `${thread.threadId}-tool`,
      type: 'tool',
      timestamp,
      title: '工具调用',
      detail: `${thread.toolCallCount} 次工具调用`,
    })
  }

  if ((thread.codeChangeCount ?? 0) > 0) {
    events.push({
      id: `${thread.threadId}-code`,
      type: 'code',
      timestamp,
      title: '代码变更',
      detail: `${thread.codeChangeCount} 个变更信号`,
    })
  }

  return events
}

export function createThreadUsageCsvExport(threads: ThreadRecord[]): ThreadUsageCsvExport {
  const header = 'threadId,projectName,status,inputTokens,cachedInputTokens,outputTokens,totalTokens,lastUpdatedAt'
  const rows = threads.map((thread) => {
    const usage = hasThreadTokenUsage(thread)
      ? [
          String(thread.tokenUsage.inputTokens),
          String(thread.tokenUsage.cachedInputTokens),
          String(thread.tokenUsage.outputTokens),
          String(thread.tokenUsage.totalTokens),
        ]
      : ['Unknown', 'Unknown', 'Unknown', 'Unknown']
    return [
      csvCell(thread.threadId),
      csvCell(thread.projectName),
      csvCell(thread.status),
      ...usage,
      csvCell(thread.lastUpdatedAt),
    ].join(',')
  })

  return {
    fileName: 'aiotto-thread-usage.csv',
    content: [header, ...rows, ''].join('\n'),
  }
}

export function inferThreadSourceKind(thread: Pick<ThreadRecord, 'sourceFile' | 'archived'>): ThreadSourceKind {
  if (/\/sessions\/trash\//i.test(thread.sourceFile)) {
    return 'trash'
  }
  if (/\/sessions\/recovered\//i.test(thread.sourceFile)) {
    return 'recovered'
  }
  if (thread.archived || /\/(archive|archived_sessions)\//i.test(thread.sourceFile)) {
    return 'archive'
  }
  if (thread.sourceFile) {
    return 'active'
  }
  return 'unknown'
}

export function calculateThreadHeatScore(thread: ThreadRecord): number {
  const statusBoost = Math.max(0, 7 - ATTENTION_STATUS_RANK[thread.status]) * 100
  const messageBoost = Math.min(200, Math.max(0, thread.messageCount) * 4)
  const toolBoost = Math.min(150, Math.max(0, thread.toolCallCount ?? 0) * 18)
  const codeBoost = Math.min(150, Math.max(0, thread.codeChangeCount ?? 0) * 24)
  const usageBoost = Math.min(100, Math.floor((thread.tokenUsage?.totalTokens ?? 0) / 100))
  const pinnedBoost = thread.pinned ? 50 : 0
  return statusBoost + messageBoost + toolBoost + codeBoost + usageBoost + pinnedBoost
}

function enhanceThread(
  thread: ThreadRecord,
  pinnedIds: Set<string>,
  trashByThreadId: Map<string, ThreadTrashRecord>,
): ThreadRecord {
  const trashRecord = trashByThreadId.get(thread.threadId)
  const trashed = Boolean(trashRecord) || inferThreadSourceKind(thread) === 'trash'
  const sourceKind = inferThreadSourceKind(thread)
  const pinned = pinnedIds.has(thread.threadId)
  const enhanced = {
    ...thread,
    pinned,
    trashed,
    trashedAt: trashRecord?.trashedAt ?? thread.trashedAt ?? null,
    sourceKind,
  }

  return {
    ...enhanced,
    heatScore: calculateThreadHeatScore(enhanced),
  }
}

function compareEnhancedThreads(left: ThreadRecord, right: ThreadRecord, sortBy: ThreadSortMode): number {
  if (sortBy === 'attention') {
    const rankDelta = ATTENTION_STATUS_RANK[left.status] - ATTENTION_STATUS_RANK[right.status]
    if (rankDelta !== 0) {
      return rankDelta
    }
  }

  if (sortBy === 'heat') {
    const heatDelta = (right.heatScore ?? 0) - (left.heatScore ?? 0)
    if (heatDelta !== 0) {
      return heatDelta
    }
  }

  return right.lastUpdatedAt.localeCompare(left.lastUpdatedAt)
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}

function hasThreadTokenUsage(thread: ThreadRecord): boolean {
  return (
    thread.tokenUsage.totalTokens > 0 ||
    thread.tokenUsage.inputTokens > 0 ||
    thread.tokenUsage.outputTokens > 0 ||
    thread.tokenUsage.cachedInputTokens > 0
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function csvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value
  }

  return `"${value.replace(/"/g, '""')}"`
}
