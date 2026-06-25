import type { CodexAppServerThreadSnapshot } from '../domain/codexAppServer'
import type { ThreadRecord } from '../domain/models'
import type { CodexSessionMessage, CodexSessionMeta, CodexSessionMetaScan } from '../domain/threadIndexer'
import { threadsService } from '../services'

export type ThreadsRuntimeSnapshot = {
  threads: ThreadRecord[]
  scan: CodexSessionMetaScan
}

export type LoadThreadsRuntimeSnapshotDeps = {
  listSessions?: () => Promise<CodexSessionMetaScan>
  codexSessionMetasToThreadRecords?: (sessions: CodexSessionMeta[]) => ThreadRecord[]
  getCodexSessionMessages?: (sourcePath: string) => Promise<CodexSessionMessage[]>
  applyCodexSessionMessagesToThreadRecord?: (
    thread: ThreadRecord,
    messages: CodexSessionMessage[],
  ) => ThreadRecord
  getCodexAppServerThreadSnapshot?: (limit: number) => Promise<CodexAppServerThreadSnapshot>
  mergeCodexAppServerSnapshotIntoThreads?: (
    threads: ThreadRecord[],
    snapshot: CodexAppServerThreadSnapshot,
  ) => ThreadRecord[]
}

export const emptyThreadScan: CodexSessionMetaScan = {
  sourceKind: 'unavailable',
  sourceLabel: '未读取到真实 Codex sessions',
  codexHome: null,
  scannedRoots: [],
  scannedRootStatuses: [],
  sourceFileCount: 0,
  returnedSourceCount: 0,
  truncated: false,
  unreadableSourceCount: 0,
  unreadableSources: [],
  sessions: [],
}

const RECENT_THREAD_MESSAGE_PREFETCH_LIMIT = 3
const APP_SERVER_THREAD_SNAPSHOT_LIMIT = 1
const MAX_RECENT_THREAD_MESSAGE_PREFETCH_BYTES = 25 * 1024 * 1024

export async function loadThreadsRuntimeSnapshot(
  deps: LoadThreadsRuntimeSnapshotDeps = {},
): Promise<ThreadsRuntimeSnapshot> {
  const resolvedDeps = await resolveThreadsRuntimeDeps(deps)
  const scan = await resolvedDeps.listSessions()
  const indexedThreads = resolvedDeps.codexSessionMetasToThreadRecords(scan.sessions)
  const threadsWithRecentMessages = await enrichRecentThreadMessages(
    indexedThreads,
    resolvedDeps.getCodexSessionMessages,
    resolvedDeps.applyCodexSessionMessagesToThreadRecord,
  )
  const appServerSnapshot = await resolvedDeps.getCodexAppServerThreadSnapshot(APP_SERVER_THREAD_SNAPSHOT_LIMIT)
  const threads = resolvedDeps.mergeCodexAppServerSnapshotIntoThreads(
    threadsWithRecentMessages,
    appServerSnapshot,
  )

  return {
    threads,
    scan,
  }
}

async function resolveThreadsRuntimeDeps(deps: LoadThreadsRuntimeSnapshotDeps) {
  return {
    listSessions: deps.listSessions ?? threadsService.listCodexSessions,
    codexSessionMetasToThreadRecords:
      deps.codexSessionMetasToThreadRecords ?? threadsService.codexSessionMetasToThreadRecords,
    getCodexSessionMessages:
      deps.getCodexSessionMessages ?? threadsService.getSessionMessages,
    applyCodexSessionMessagesToThreadRecord:
      deps.applyCodexSessionMessagesToThreadRecord ??
      threadsService.applySessionMessagesToThreadRecord,
    getCodexAppServerThreadSnapshot:
      deps.getCodexAppServerThreadSnapshot ??
      threadsService.getAppServerThreadSnapshot,
    mergeCodexAppServerSnapshotIntoThreads:
      deps.mergeCodexAppServerSnapshotIntoThreads ??
      threadsService.mergeAppServerSnapshotIntoThreads,
  }
}

async function enrichRecentThreadMessages(
  threads: ThreadRecord[],
  loadMessages: (sourcePath: string) => Promise<CodexSessionMessage[]>,
  applyMessages: (thread: ThreadRecord, messages: CodexSessionMessage[]) => ThreadRecord,
): Promise<ThreadRecord[]> {
  const candidates = threads
    .filter(
      (thread) =>
        thread.restoreAvailable &&
        !thread.archived &&
        !thread.trashed &&
        Boolean(thread.sourceFile) &&
        shouldPrefetchRecentThreadMessages(thread),
    )
    .slice(0, RECENT_THREAD_MESSAGE_PREFETCH_LIMIT)

  if (candidates.length === 0) {
    return threads
  }

  const enrichedEntries = await Promise.all(
    candidates.map(async (thread) => {
      try {
        const messages = await loadMessages(thread.sourceFile)
        return [thread.threadId, applyMessages(thread, messages)] as const
      } catch {
        return [thread.threadId, thread] as const
      }
    }),
  )
  const enrichedByThreadId = new Map(enrichedEntries)

  return threads.map((thread) => enrichedByThreadId.get(thread.threadId) ?? thread)
}

function shouldPrefetchRecentThreadMessages(thread: ThreadRecord): boolean {
  if (typeof thread.sourceSizeBytes !== 'number') {
    return true
  }

  return thread.sourceSizeBytes <= MAX_RECENT_THREAD_MESSAGE_PREFETCH_BYTES
}
