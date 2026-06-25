import type { ThreadProjectGroup, ThreadRecord } from './models'

type ThreadGroupingOptions = {
  recentLimitPerProject?: number
}

type ThreadGroupAccumulator = Omit<ThreadProjectGroup, 'recentThreads'> & {
  threads: ThreadRecord[]
}

const DEFAULT_RECENT_LIMIT = 3
const EPOCH = '1970-01-01T00:00:00.000Z'

export function groupThreadsByProject(
  threads: ThreadRecord[],
  options: ThreadGroupingOptions = {},
): ThreadProjectGroup[] {
  const recentLimit = options.recentLimitPerProject ?? DEFAULT_RECENT_LIMIT
  const groups = new Map<string, ThreadGroupAccumulator>()

  for (const thread of threads) {
    const key = thread.projectPath || '未知项目'
    const group = groups.get(key) ?? createGroupAccumulator(thread)

    group.threadCount += 1
    group.runningCount += thread.status === 'running' ? 1 : 0
    group.waitingCount += thread.status === 'waiting' || thread.status === 'approval' ? 1 : 0
    group.failedCount += thread.status === 'failed' ? 1 : 0
    group.completedCount += thread.status === 'completed' ? 1 : 0
    group.idleCount += thread.status === 'idle' || thread.status === 'unknown' ? 1 : 0
    group.archivedCount += thread.archived ? 1 : 0
    group.orphanedCount += thread.orphaned ? 1 : 0
    group.lastUpdatedAt = latestTimestamp(group.lastUpdatedAt, thread.lastUpdatedAt)
    group.threads.push(thread)

    groups.set(key, group)
  }

  return Array.from(groups.values())
    .map(({ threads: groupThreads, ...group }) => ({
      ...group,
      recentThreads: sortThreadsByRecency(groupThreads).slice(0, recentLimit),
    }))
    .sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
}

export function selectRecentThreads(threads: ThreadRecord[], limit = DEFAULT_RECENT_LIMIT): ThreadRecord[] {
  const activeThreads = threads.filter((thread) => !thread.archived)
  const archivedThreads = threads.filter((thread) => thread.archived)

  return [
    ...sortThreadsByRecency(activeThreads),
    ...sortThreadsByRecency(archivedThreads),
  ].slice(0, limit)
}

function createGroupAccumulator(thread: ThreadRecord): ThreadGroupAccumulator {
  return {
    projectPath: thread.projectPath || '未知项目',
    projectName: thread.projectName || '未知项目',
    threadCount: 0,
    runningCount: 0,
    waitingCount: 0,
    failedCount: 0,
    completedCount: 0,
    idleCount: 0,
    archivedCount: 0,
    orphanedCount: 0,
    lastUpdatedAt: EPOCH,
    threads: [],
  }
}

function sortThreadsByRecency(threads: ThreadRecord[]): ThreadRecord[] {
  return [...threads].sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
}

function latestTimestamp(left: string, right: string): string {
  return right.localeCompare(left) > 0 ? right : left
}
