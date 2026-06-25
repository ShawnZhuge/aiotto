import type { ThreadMessagePreview, ThreadRecord, ThreadTokenUsage } from './models'
import { inferConversationStage } from './conversationStage'
import { isDisplayableConversationMessage } from './conversationContent'

export type CodexSessionSource = {
  sourceFile: string
  content: string
  sizeBytes?: number
  modifiedAtEpochMs?: number | null
  contentExcerpted?: boolean
  excerptHeadBytes?: number | null
  excerptTailBytes?: number | null
}

export type CodexUnreadableSessionSource = {
  sourceFile: string
  errorMessage: string
}

export type CodexSessionScanRootStatus = {
  rootPath: string
  status: string
  sourceFileCount: number
  errorMessage: string | null
}

export type CodexSessionSourceScan = {
  sourceKind: 'tauri' | 'unavailable'
  sourceLabel: string
  codexHome: string | null
  scannedRoots: string[]
  scannedRootStatuses: CodexSessionScanRootStatus[]
  sourceFileCount: number
  returnedSourceCount: number
  truncated: boolean
  unreadableSourceCount: number
  unreadableSources: CodexUnreadableSessionSource[]
  sources: CodexSessionSource[]
}

export type CodexSessionMeta = {
  sourceId: string
  sessionId: string
  title: string | null
  summary: string | null
  projectDir: string | null
  createdAt: number | null
  lastActiveAt: number | null
  sourcePath: string
  sourceSizeBytes: number
  sourceModifiedAt: number | null
  resumeCommand: string | null
  messageCountEstimate: number | null
  indexedAt: number
}

export type CodexSessionMetaScan = {
  sourceKind: 'tauri' | 'unavailable'
  sourceLabel: string
  codexHome: string | null
  scannedRoots: string[]
  scannedRootStatuses: CodexSessionScanRootStatus[]
  sourceFileCount: number
  returnedSourceCount: number
  truncated: boolean
  unreadableSourceCount: number
  unreadableSources: CodexUnreadableSessionSource[]
  sessions: CodexSessionMeta[]
}

export type CodexSessionMessage = {
  role: ThreadMessagePreview['role']
  content: string
  ts: number | null
}

export type CodexSessionUsageSyncResult = {
  sourceKind: 'tauri' | 'unavailable'
  sourceLabel: string
  imported: number
  skipped: number
  filesScanned: number
  errors: string[]
  databasePath: string | null
}

type CodexSessionSourceScanPayload = {
  codexHome?: unknown
  scannedRoots?: unknown
  scannedRootStatuses?: unknown
  sourceFileCount?: unknown
  returnedSourceCount?: unknown
  truncated?: unknown
  unreadableSourceCount?: unknown
  unreadableSources?: unknown
  sources?: unknown
}

type CodexSessionMetaScanPayload = {
  codexHome?: unknown
  scannedRoots?: unknown
  scannedRootStatuses?: unknown
  sourceFileCount?: unknown
  returnedSourceCount?: unknown
  truncated?: unknown
  unreadableSourceCount?: unknown
  unreadableSources?: unknown
  sessions?: unknown
}

type CodexSessionUsageSyncPayload = {
  imported?: unknown
  skipped?: unknown
  filesScanned?: unknown
  errors?: unknown
  databasePath?: unknown
}

type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>

type SessionScanDeps = {
  invoke?: TauriInvoke
}

type SessionEntry = Record<string, unknown>

type ThreadAccumulator = {
  threadId: string
  parentThreadId: string | null
  childThreadIds: string[]
  projectPath: string
  title: string
  summary: string
  status: ThreadRecord['status']
  lastUpdatedAt: string
  messageCount: number
  sourceFile: string
  sourceSizeBytes: number | null
  sourceModifiedAt: string | null
  sourceContentExcerpted: boolean
  sourceExcerptHeadBytes: number | null
  sourceExcerptTailBytes: number | null
  recentMessages: ThreadMessagePreview[]
  tokenUsage: ThreadTokenUsage
  cumulativeTokenUsage: ThreadTokenUsage
  archived: boolean
  toolCallCount: number
  codeChangeCount: number
}

type ExtractedTokenUsage = {
  cumulative: boolean
  usage: ThreadTokenUsage
}

const UNKNOWN_PROJECT = '未知项目'
const MAX_RECENT_MESSAGES = 6
const THREAD_TITLE_MAX_CHARS = 80
const CODEX_IDE_CONTEXT_PREFIX = '# Context from my IDE setup:'
const CODEX_REQUEST_MARKER = 'my request for codex'

export type ThreadIndexOptions = {
  projectPathExists?: (projectPath: string) => boolean
}

export function indexCodexSessionSources(sources: CodexSessionSource[], options: ThreadIndexOptions = {}): ThreadRecord[] {
  const threads = new Map<string, ThreadAccumulator>()

  for (const source of sources) {
    const entries = parseSessionEntries(source.content)
    if (entries.some(isSubagentSessionEntry)) {
      continue
    }
    const sourceThreadId = entries.map(extractThreadId).find((threadId): threadId is string => Boolean(threadId))

    if (entries.length === 0) {
      const fallbackId = threadIdFromSourceFile(source.sourceFile)
      threads.set(fallbackId, createAccumulator(fallbackId, source))
      continue
    }

    for (const entry of entries) {
      const threadId = extractThreadId(entry) || sourceThreadId || threadIdFromSourceFile(source.sourceFile)
      const accumulator = threads.get(threadId) ?? createAccumulator(threadId, source)
      const content = extractContent(entry)
      const timestamp = extractTimestamp(entry)
      const projectPath = extractProjectPath(entry)
      const parentThreadId = extractParentThreadId(entry)
      const status = normalizeThreadStatus(extractString(entry, ['status', 'state']))
      const extractedTokenUsage = extractTokenUsage(entry)
      const isReadableContent = content && !isInjectedSessionContent(content)

      if (parentThreadId && parentThreadId !== threadId) {
        accumulator.parentThreadId = parentThreadId
      }

      if (projectPath && accumulator.projectPath === UNKNOWN_PROJECT) {
        accumulator.projectPath = projectPath
      }

      if (isReadableContent) {
        accumulator.messageCount += 1
        accumulator.summary = content
        accumulator.recentMessages = appendRecentMessage(accumulator.recentMessages, {
          role: extractRole(entry),
          content,
          timestamp,
        })
        if (!accumulator.title && isLikelyUserEntry(entry)) {
          accumulator.title = content
        }
      }

      if (!accumulator.title && extractString(entry, ['title', 'summary'])) {
        accumulator.title = extractString(entry, ['title', 'summary']) ?? ''
      }

      if (timestamp && timestamp >= accumulator.lastUpdatedAt) {
        accumulator.lastUpdatedAt = timestamp
      }

      if (status) {
        accumulator.status = status
      }

      if (extractedTokenUsage) {
        if (extractedTokenUsage.cumulative) {
          accumulator.cumulativeTokenUsage = maxThreadTokenUsage(
            accumulator.cumulativeTokenUsage,
            extractedTokenUsage.usage,
          )
        } else {
          accumulator.tokenUsage = addThreadTokenUsage(accumulator.tokenUsage, extractedTokenUsage.usage)
        }
      }

      accumulator.toolCallCount += extractToolCallCount(entry)
      accumulator.codeChangeCount += extractCodeChangeCount(entry)

      threads.set(threadId, accumulator)
    }
  }

  const childIdsByParent = new Map<string, Set<string>>()
  for (const thread of threads.values()) {
    if (!thread.parentThreadId) {
      continue
    }
    const childIds = childIdsByParent.get(thread.parentThreadId) ?? new Set<string>()
    childIds.add(thread.threadId)
    childIdsByParent.set(thread.parentThreadId, childIds)
  }

  const knownThreadIds = new Set(threads.keys())

  return Array.from(threads.values())
    .map((thread) => {
      thread.childThreadIds = Array.from(childIdsByParent.get(thread.threadId) ?? [])
      return toThreadRecord(thread, options, knownThreadIds)
    })
    .sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
}

export async function scanCodexSessionSourcesWithFallback(
  manualPath?: string,
  deps: SessionScanDeps = {},
): Promise<CodexSessionSourceScan> {
  const invoke = deps.invoke ?? (await importTauriInvoke())

  if (invoke) {
    try {
      const result = await invoke<unknown>('scan_codex_sessions', { manualPath })
      const scan = normalizeCodexSessionSourceScanResult(result)
      return {
        sourceKind: 'tauri',
        sourceLabel: '真实 Codex sessions',
        ...scan,
      }
    } catch {
      // Browser previews can import the Tauri package but cannot call runtime invoke.
    }
  }

  return {
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
    sources: [],
  }
}

export async function listCodexSessionsWithFallback(
  manualPath?: string,
  deps: SessionScanDeps = {},
): Promise<CodexSessionMetaScan> {
  const invoke = deps.invoke ?? (await importTauriInvoke())

  if (invoke) {
    try {
      const result = await invoke<unknown>('list_codex_sessions', { manualPath })
      const scan = normalizeCodexSessionMetaScanResult(result)
      return {
        sourceKind: 'tauri',
        sourceLabel: '真实 Codex sessions',
        ...scan,
      }
    } catch {
      // Browser previews can import the Tauri package but cannot call runtime invoke.
    }
  }

  return {
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
}

export async function getCodexSessionMessagesWithFallback(
  sourcePath: string,
  manualPath?: string,
  deps: SessionScanDeps = {},
): Promise<CodexSessionMessage[]> {
  if (!sourcePath.trim()) {
    return []
  }

  const invoke = deps.invoke ?? (await importTauriInvoke())

  if (invoke) {
    try {
      const result = await invoke<unknown>('get_codex_session_messages', { manualPath, sourcePath })
      return normalizeCodexSessionMessagesResult(result)
    } catch {
      // Browser previews can import the Tauri package but cannot call runtime invoke.
    }
  }

  return []
}

export async function syncCodexSessionUsageWithFallback(
  manualPath?: string,
  deps: SessionScanDeps = {},
): Promise<CodexSessionUsageSyncResult> {
  const invoke = deps.invoke ?? (await importTauriInvoke())

  if (invoke) {
    try {
      const result = await invoke<unknown>('sync_codex_session_usage', { manualPath })
      return {
        sourceKind: 'tauri',
        sourceLabel: 'Codex session usage',
        ...normalizeCodexSessionUsageSyncResult(result),
      }
    } catch {
      // Browser previews can import the Tauri package but cannot call runtime invoke.
    }
  }

  return {
    sourceKind: 'unavailable',
    sourceLabel: '未同步 Codex session usage',
    imported: 0,
    skipped: 0,
    filesScanned: 0,
    errors: [],
    databasePath: null,
  }
}

export function codexSessionMetasToThreadRecords(sessions: CodexSessionMeta[]): ThreadRecord[] {
  return sessions
    .map((session) => {
      const projectPath = session.projectDir?.trim() || UNKNOWN_PROJECT
      const hasProject = projectPath !== UNKNOWN_PROJECT
      const title = session.title?.trim() || session.summary?.trim() || session.sessionId
      const summary = session.summary?.trim() || session.title?.trim() || title
      const lastUpdatedAt = epochMsToIso(session.lastActiveAt ?? session.sourceModifiedAt ?? session.createdAt)
      const sourceModifiedAt = epochMsToIso(session.sourceModifiedAt)
      const archived = archivedFromSourceFile(session.sourcePath)
      const trashed = trashedFromSourceFile(session.sourcePath)
      const restoreCommand = session.resumeCommand?.trim() || (hasProject ? `codex resume ${session.sessionId}` : '')

      return {
        threadId: session.sessionId,
        parentThreadId: null,
        childThreadIds: [],
        projectPath,
        projectName: hasProject ? projectNameFromPath(projectPath) : UNKNOWN_PROJECT,
        title: excerpt(title),
        summary: excerpt(summary),
        status: archived || trashed ? 'completed' : 'idle',
        conversationStage: inferConversationStage({
          status: archived || trashed ? 'completed' : 'idle',
          summary,
          recentMessages: [],
        }),
        lastUpdatedAt: lastUpdatedAt ?? sourceModifiedAt ?? '1970-01-01T00:00:00.000Z',
        messageCount: session.messageCountEstimate ?? 0,
        sourceFile: session.sourcePath,
        sourceSizeBytes: session.sourceSizeBytes,
        sourceModifiedAt,
        sourceContentExcerpted: false,
        sourceExcerptHeadBytes: null,
        sourceExcerptTailBytes: null,
        recentMessages: [],
        tokenUsage: emptyThreadTokenUsage(),
        restoreCommand,
        restoreWorkdir: hasProject ? projectPath : '',
        restoreAvailable: hasProject && restoreCommand.length > 0,
        archived,
        trashed,
        sourceKind: sourceKindFromSourceFile(session.sourcePath, archived),
        orphaned: !hasProject,
        lost: archived,
        recoverable: hasProject,
        missingProjectDirectory: false,
        cleanupRecommendation: '',
        toolCallCount: 0,
        codeChangeCount: 0,
      } satisfies ThreadRecord
    })
    .sort((left, right) => right.lastUpdatedAt.localeCompare(left.lastUpdatedAt))
}

export function applyCodexSessionMessagesToThreadRecord(
  thread: ThreadRecord,
  messages: CodexSessionMessage[],
): ThreadRecord {
  const loadedLatestTimestamp = epochMsToIso(messages.at(-1)?.ts ?? null)
  if (loadedLatestTimestamp && isTimestampBefore(loadedLatestTimestamp, thread.lastUpdatedAt)) {
    return thread
  }

  const recentMessages = messages
    .map((message) => ({
      role: message.role,
      content: excerpt(message.content),
      timestamp: epochMsToIso(message.ts) ?? thread.lastUpdatedAt,
    }))
    .slice(-MAX_RECENT_MESSAGES)

  if (recentMessages.length === 0) {
    return thread
  }

  const latestMessage = recentMessages.at(-1)
  const latestDisplayMessage = [...recentMessages]
    .reverse()
    .find(isDisplayableConversationMessage)

  return {
    ...thread,
    summary: latestDisplayMessage?.content || thread.summary,
    lastUpdatedAt: latestMessage?.timestamp || thread.lastUpdatedAt,
    recentMessages,
    conversationStage: inferConversationStage({
      status: thread.status,
      summary: latestDisplayMessage?.content || thread.summary,
      recentMessages,
    }),
  }
}

function isTimestampBefore(left: string, right: string): boolean {
  const leftMs = Date.parse(left)
  const rightMs = Date.parse(right)
  return Number.isFinite(leftMs) && Number.isFinite(rightMs) && leftMs < rightMs
}

export function normalizeCodexSessionSourceScanResult(
  result: unknown,
): Pick<
  CodexSessionSourceScan,
  | 'codexHome'
  | 'scannedRoots'
  | 'scannedRootStatuses'
  | 'sourceFileCount'
  | 'returnedSourceCount'
  | 'truncated'
  | 'unreadableSourceCount'
  | 'unreadableSources'
  | 'sources'
> {
  if (Array.isArray(result)) {
    return {
      codexHome: null,
      scannedRoots: [],
      scannedRootStatuses: [],
      sourceFileCount: result.length,
      returnedSourceCount: result.length,
      truncated: false,
      unreadableSourceCount: 0,
      unreadableSources: [],
      sources: result.filter(isCodexSessionSource),
    }
  }

  const payload = isSessionEntry(result) ? (result as CodexSessionSourceScanPayload) : {}
  const sources = Array.isArray(payload.sources) ? payload.sources.filter(isCodexSessionSource) : []
  const scannedRootStatuses = Array.isArray(payload.scannedRootStatuses)
    ? payload.scannedRootStatuses.filter(isCodexSessionScanRootStatus)
    : []
  const unreadableSources = Array.isArray(payload.unreadableSources)
    ? payload.unreadableSources.filter(isCodexUnreadableSessionSource)
    : []

  return {
    codexHome: typeof payload.codexHome === 'string' && payload.codexHome.trim() ? payload.codexHome.trim() : null,
    scannedRoots: Array.isArray(payload.scannedRoots)
      ? payload.scannedRoots
          .filter((root): root is string => typeof root === 'string' && root.trim().length > 0)
          .map((root) => root.trim())
      : [],
    scannedRootStatuses,
    sourceFileCount: readNonNegativeInteger(payload.sourceFileCount) ?? sources.length,
    returnedSourceCount: readNonNegativeInteger(payload.returnedSourceCount) ?? sources.length,
    truncated: payload.truncated === true,
    unreadableSourceCount: readNonNegativeInteger(payload.unreadableSourceCount) ?? unreadableSources.length,
    unreadableSources,
    sources,
  }
}

export function normalizeCodexSessionMetaScanResult(
  result: unknown,
): Pick<
  CodexSessionMetaScan,
  | 'codexHome'
  | 'scannedRoots'
  | 'scannedRootStatuses'
  | 'sourceFileCount'
  | 'returnedSourceCount'
  | 'truncated'
  | 'unreadableSourceCount'
  | 'unreadableSources'
  | 'sessions'
> {
  const payload = isSessionEntry(result) ? (result as CodexSessionMetaScanPayload) : {}
  const sessions = Array.isArray(payload.sessions) ? payload.sessions.filter(isCodexSessionMeta) : []
  const scannedRootStatuses = Array.isArray(payload.scannedRootStatuses)
    ? payload.scannedRootStatuses.filter(isCodexSessionScanRootStatus)
    : []
  const unreadableSources = Array.isArray(payload.unreadableSources)
    ? payload.unreadableSources.filter(isCodexUnreadableSessionSource)
    : []

  return {
    codexHome: typeof payload.codexHome === 'string' && payload.codexHome.trim() ? payload.codexHome.trim() : null,
    scannedRoots: Array.isArray(payload.scannedRoots)
      ? payload.scannedRoots
          .filter((root): root is string => typeof root === 'string' && root.trim().length > 0)
          .map((root) => root.trim())
      : [],
    scannedRootStatuses,
    sourceFileCount: readNonNegativeInteger(payload.sourceFileCount) ?? sessions.length,
    returnedSourceCount: readNonNegativeInteger(payload.returnedSourceCount) ?? sessions.length,
    truncated: payload.truncated === true,
    unreadableSourceCount: readNonNegativeInteger(payload.unreadableSourceCount) ?? unreadableSources.length,
    unreadableSources,
    sessions,
  }
}

export function normalizeCodexSessionMessagesResult(result: unknown): CodexSessionMessage[] {
  if (!Array.isArray(result)) {
    return []
  }

  return result
    .map(normalizeCodexSessionMessage)
    .filter((message): message is CodexSessionMessage => message !== null)
}

export function normalizeCodexSessionUsageSyncResult(
  result: unknown,
): Omit<CodexSessionUsageSyncResult, 'sourceKind' | 'sourceLabel'> {
  const payload = isSessionEntry(result) ? (result as CodexSessionUsageSyncPayload) : {}
  const errors = Array.isArray(payload.errors)
    ? payload.errors.filter((error): error is string => typeof error === 'string')
    : []

  return {
    imported: readNonNegativeInteger(payload.imported) ?? 0,
    skipped: readNonNegativeInteger(payload.skipped) ?? 0,
    filesScanned: readNonNegativeInteger(payload.filesScanned) ?? 0,
    errors,
    databasePath: typeof payload.databasePath === 'string' && payload.databasePath.trim() ? payload.databasePath.trim() : null,
  }
}

function isCodexSessionSource(value: unknown): value is CodexSessionSource {
  if (!isSessionEntry(value)) {
    return false
  }

  return typeof value.sourceFile === 'string' && typeof value.content === 'string'
}

function isCodexSessionMeta(value: unknown): value is CodexSessionMeta {
  if (!isSessionEntry(value)) {
    return false
  }

  return (
    typeof value.sourceId === 'string' &&
    typeof value.sessionId === 'string' &&
    value.sessionId.trim().length > 0 &&
    typeof value.sourcePath === 'string' &&
    value.sourcePath.trim().length > 0 &&
    typeof value.sourceSizeBytes === 'number' &&
    Number.isFinite(value.sourceSizeBytes) &&
    value.sourceSizeBytes >= 0 &&
    typeof value.indexedAt === 'number' &&
    Number.isFinite(value.indexedAt) &&
    (value.title === null || typeof value.title === 'string') &&
    (value.summary === null || typeof value.summary === 'string') &&
    (value.projectDir === null || typeof value.projectDir === 'string') &&
    (value.createdAt === null || readNonNegativeInteger(value.createdAt) !== null) &&
    (value.lastActiveAt === null || readNonNegativeInteger(value.lastActiveAt) !== null) &&
    (value.sourceModifiedAt === null || readNonNegativeInteger(value.sourceModifiedAt) !== null) &&
    (value.resumeCommand === null || typeof value.resumeCommand === 'string') &&
    (value.messageCountEstimate === null || readNonNegativeInteger(value.messageCountEstimate) !== null)
  )
}

function normalizeCodexSessionMessage(value: unknown): CodexSessionMessage | null {
  if (!isSessionEntry(value)) {
    return null
  }

  const role = typeof value.role === 'string' ? normalizeThreadMessageRole(value.role) : null
  const content = typeof value.content === 'string' ? value.content : null
  const ts = value.ts === null ? null : readNonNegativeInteger(value.ts)

  if (!role || !content?.trim() || (value.ts !== null && ts === null)) {
    return null
  }

  return {
    role,
    content,
    ts,
  }
}

function normalizeThreadMessageRole(role: string): ThreadMessagePreview['role'] {
  const normalized = role.trim().toLowerCase()
  if (isThreadMessageRole(normalized)) {
    return normalized
  }
  return 'unknown'
}

function isThreadMessageRole(role: string): role is ThreadMessagePreview['role'] {
  return role === 'user' ||
    role === 'assistant' ||
    role === 'tool' ||
    role === 'system' ||
    role === 'developer' ||
    role === 'unknown'
}

function isCodexUnreadableSessionSource(value: unknown): value is CodexUnreadableSessionSource {
  if (!isSessionEntry(value)) {
    return false
  }

  return typeof value.sourceFile === 'string' && typeof value.errorMessage === 'string'
}

function isCodexSessionScanRootStatus(value: unknown): value is CodexSessionScanRootStatus {
  if (!isSessionEntry(value)) {
    return false
  }

  return (
    typeof value.rootPath === 'string' &&
    typeof value.status === 'string' &&
    typeof value.sourceFileCount === 'number' &&
    Number.isInteger(value.sourceFileCount) &&
    value.sourceFileCount >= 0 &&
    (value.errorMessage === null || typeof value.errorMessage === 'string')
  )
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
}

async function importTauriInvoke(): Promise<TauriInvoke | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke as TauriInvoke
  } catch {
    return null
  }
}

function parseSessionEntries(content: string): SessionEntry[] {
  const trimmed = content.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed.filter(isSessionEntry) : []
    } catch {
      return []
    }
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseJsonObject)
    .filter(isSessionEntry)
}

function parseJsonObject(line: string): unknown {
  try {
    return JSON.parse(line)
  } catch {
    return null
  }
}

function isSessionEntry(value: unknown): value is SessionEntry {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createAccumulator(threadId: string, source: CodexSessionSource): ThreadAccumulator {
  return {
    threadId,
    parentThreadId: null,
    childThreadIds: [],
    projectPath: UNKNOWN_PROJECT,
    title: '',
    summary: '',
    status: archivedFromSourceFile(source.sourceFile) ? 'completed' : 'idle',
    lastUpdatedAt: '',
    messageCount: 0,
    sourceFile: source.sourceFile,
    sourceSizeBytes: normalizeSourceSizeBytes(source.sizeBytes),
    sourceModifiedAt: normalizeSourceModifiedAt(source.modifiedAtEpochMs),
    sourceContentExcerpted: source.contentExcerpted === true,
    sourceExcerptHeadBytes: normalizeSourceSizeBytes(source.excerptHeadBytes ?? undefined),
    sourceExcerptTailBytes: normalizeSourceSizeBytes(source.excerptTailBytes ?? undefined),
    recentMessages: [],
    tokenUsage: emptyThreadTokenUsage(),
    cumulativeTokenUsage: emptyThreadTokenUsage(),
    archived: archivedFromSourceFile(source.sourceFile),
    toolCallCount: 0,
    codeChangeCount: 0,
  }
}

function toThreadRecord(thread: ThreadAccumulator, options: ThreadIndexOptions, knownThreadIds: Set<string>): ThreadRecord {
  const hasProject = thread.projectPath !== UNKNOWN_PROJECT
  const title = thread.title || (hasProject ? projectNameFromPath(thread.projectPath) : thread.summary || thread.threadId)
  const summary = thread.summary || title
  const lastUpdatedAt = thread.lastUpdatedAt || thread.sourceModifiedAt || '1970-01-01T00:00:00.000Z'
  const missingProjectDirectory =
    hasProject && options.projectPathExists ? options.projectPathExists(thread.projectPath) === false : false
  const lost = archivedFromSourceFile(thread.sourceFile)
  const trashed = trashedFromSourceFile(thread.sourceFile)
  const recoverable = hasProject
  const orphaned = !hasProject || Boolean(thread.parentThreadId && !knownThreadIds.has(thread.parentThreadId))

  return {
    threadId: thread.threadId,
    parentThreadId: thread.parentThreadId,
    childThreadIds: thread.childThreadIds,
    projectPath: thread.projectPath,
    projectName: hasProject ? projectNameFromPath(thread.projectPath) : UNKNOWN_PROJECT,
    title: excerpt(title, THREAD_TITLE_MAX_CHARS),
    summary: excerpt(summary),
    status: thread.status,
    conversationStage: inferConversationStage({
      status: thread.status,
      summary,
      recentMessages: thread.recentMessages,
    }),
    lastUpdatedAt,
    messageCount: thread.messageCount,
    sourceFile: thread.sourceFile,
    sourceSizeBytes: thread.sourceSizeBytes,
    sourceModifiedAt: thread.sourceModifiedAt,
    sourceContentExcerpted: thread.sourceContentExcerpted,
    sourceExcerptHeadBytes: thread.sourceExcerptHeadBytes,
    sourceExcerptTailBytes: thread.sourceExcerptTailBytes,
    recentMessages: thread.recentMessages,
    tokenUsage: maxThreadTokenUsage(thread.tokenUsage, thread.cumulativeTokenUsage),
    restoreCommand: hasProject ? `codex resume ${thread.threadId}` : '',
    restoreWorkdir: hasProject ? thread.projectPath : '',
    restoreAvailable: hasProject,
    archived: thread.archived,
    trashed,
    sourceKind: sourceKindFromSourceFile(thread.sourceFile, thread.archived),
    orphaned,
    lost,
    recoverable,
    missingProjectDirectory,
    cleanupRecommendation: missingProjectDirectory
      ? '项目目录不存在，建议先确认项目是否移动，再决定归档或恢复。'
      : '',
    toolCallCount: thread.toolCallCount,
    codeChangeCount: thread.codeChangeCount,
  }
}

function appendRecentMessage(messages: ThreadMessagePreview[], message: ThreadMessagePreview): ThreadMessagePreview[] {
  return [...messages, message].slice(-MAX_RECENT_MESSAGES)
}

function normalizeSourceSizeBytes(sizeBytes: number | undefined): number | null {
  return typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) && sizeBytes >= 0 ? sizeBytes : null
}

function normalizeSourceModifiedAt(epochMs: number | null | undefined): string | null {
  return typeof epochMs === 'number' && Number.isFinite(epochMs) && epochMs > 0 ? new Date(epochMs).toISOString() : null
}

function epochMsToIso(epochMs: number | null | undefined): string | null {
  return typeof epochMs === 'number' && Number.isFinite(epochMs) && epochMs > 0 ? new Date(epochMs).toISOString() : null
}

function extractTokenUsage(entry: SessionEntry): ExtractedTokenUsage | null {
  const payload = asObject(entry.payload)
  const info = asObject(payload?.info) ?? asObject(entry.info)
  const lastUsage = asObject(info?.last_token_usage)
  if (lastUsage) {
    return {
      cumulative: false,
      usage: normalizeTokenUsage(lastUsage),
    }
  }

  const directUsage = asObject(entry.usage) ?? asObject(payload?.usage) ?? asObject(info?.usage)
  if (directUsage) {
    return {
      cumulative: false,
      usage: normalizeTokenUsage(directUsage),
    }
  }

  const totalUsage = asObject(info?.total_token_usage)
  if (totalUsage) {
    return {
      cumulative: true,
      usage: normalizeTokenUsage(totalUsage),
    }
  }

  return null
}

function normalizeTokenUsage(usage: SessionEntry): ThreadTokenUsage {
  const inputTokens = readNumber(usage.input_tokens) ?? readNumber(usage.inputTokens) ?? 0
  const cachedInputTokens = readNumber(usage.cached_input_tokens) ?? readNumber(usage.cachedInputTokens) ?? 0
  const outputTokens = readNumber(usage.output_tokens) ?? readNumber(usage.outputTokens) ?? 0
  const explicitTotal = readNumber(usage.total_tokens) ?? readNumber(usage.totalTokens)

  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens: explicitTotal ?? inputTokens + outputTokens,
  }
}

function emptyThreadTokenUsage(): ThreadTokenUsage {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  }
}

function addThreadTokenUsage(left: ThreadTokenUsage, right: ThreadTokenUsage): ThreadTokenUsage {
  return {
    inputTokens: left.inputTokens + right.inputTokens,
    cachedInputTokens: left.cachedInputTokens + right.cachedInputTokens,
    outputTokens: left.outputTokens + right.outputTokens,
    totalTokens: left.totalTokens + right.totalTokens,
  }
}

function maxThreadTokenUsage(left: ThreadTokenUsage, right: ThreadTokenUsage): ThreadTokenUsage {
  return right.totalTokens > left.totalTokens ? right : left
}

function extractThreadId(entry: SessionEntry): string | null {
  const payload = asObject(entry.payload)
  const direct = extractString(entry, ['thread_id', 'threadId', 'conversation_id', 'conversationId', 'session_id', 'sessionId'])
  if (direct) {
    return direct
  }

  if (isSessionMetaEntry(entry) && payload) {
    return extractString(payload, ['id', 'thread_id', 'threadId', 'conversation_id', 'conversationId', 'session_id', 'sessionId'])
  }

  return payload ? extractString(payload, ['thread_id', 'threadId', 'conversation_id', 'conversationId', 'session_id', 'sessionId']) : null
}

function extractParentThreadId(entry: SessionEntry): string | null {
  const payload = asObject(entry.payload)
  const source = payload ? asObject(payload.source) : null
  const subagent = source ? asObject(source.subagent) : null
  const threadSpawn = subagent ? asObject(subagent.thread_spawn) : null
  return (
    extractString(entry, ['parent_thread_id', 'parentThreadId', 'parent_id', 'parentId']) ??
    (payload ? extractString(payload, ['parent_thread_id', 'parentThreadId', 'parent_id', 'parentId']) : null) ??
    (threadSpawn ? extractString(threadSpawn, ['parent_thread_id', 'parentThreadId']) : null)
  )
}

function extractProjectPath(entry: SessionEntry): string | null {
  const payload = asObject(entry.payload)
  return (
    extractString(entry, ['cwd', 'project_path', 'projectPath', 'workdir', 'working_directory']) ??
    (payload ? extractString(payload, ['cwd', 'project_path', 'projectPath', 'workdir', 'working_directory']) : null)
  )
}

function extractTimestamp(entry: SessionEntry): string | null {
  const payload = asObject(entry.payload)
  return (
    extractString(entry, ['timestamp', 'createdAt', 'created_at', 'updatedAt', 'updated_at']) ??
    (payload ? extractString(payload, ['timestamp', 'createdAt', 'created_at', 'updatedAt', 'updated_at']) : null)
  )
}

function extractContent(entry: SessionEntry): string {
  const direct = extractTextValue(entry.content) || extractString(entry, ['text', 'last_message_excerpt'])
  if (direct) {
    return excerpt(readableSessionContent(direct))
  }

  const message = entry.message
  if (typeof message === 'string') {
    return excerpt(readableSessionContent(message))
  }

  if (isSessionEntry(message)) {
    const nested = extractTextValue(message.content) || extractString(message, ['text'])
    if (nested) {
      return excerpt(readableSessionContent(nested))
    }
  }

  const payload = asObject(entry.payload)
  if (payload) {
    const payloadType = extractString(payload, ['type'])
    if (payloadType === 'function_call') {
      const name = extractString(payload, ['name']) ?? 'unknown'
      return `[Tool: ${name}]`
    }

    if (payloadType === 'function_call_output') {
      const output = extractTextValue(payload.output)
      if (output) {
        return excerpt(readableSessionContent(output))
      }
    }

    const nested = extractTextValue(payload.content) || extractString(payload, ['text', 'last_message_excerpt'])
    if (nested) {
      return excerpt(readableSessionContent(nested))
    }
  }

  return ''
}

function extractString(entry: SessionEntry, keys: string[]): string | null {
  for (const key of keys) {
    const value = entry[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function normalizeThreadStatus(value: string | null): ThreadRecord['status'] | null {
  if (!value) {
    return null
  }

  const normalized = value.toLowerCase()
  if (['running', 'waiting', 'approval', 'failed', 'completed', 'idle', 'unknown'].includes(normalized)) {
    return normalized as ThreadRecord['status']
  }

  if (['approving', 'approval_required', 'requires_approval', 'needs_approval'].includes(normalized)) {
    return 'approval'
  }

  if (normalized === 'error') {
    return 'failed'
  }

  if (normalized === 'done') {
    return 'completed'
  }

  return null
}

function isLikelyUserEntry(entry: SessionEntry): boolean {
  const payload = asObject(entry.payload)
  const role = extractString(entry, ['role', 'author']) ?? (payload ? extractString(payload, ['role', 'author']) : null)
  return role === null || role.toLowerCase() === 'user'
}

function extractRole(entry: SessionEntry): ThreadMessagePreview['role'] {
  const payload = asObject(entry.payload)
  const payloadType = payload ? extractString(payload, ['type']) : null
  if (payloadType === 'function_call') {
    return 'assistant'
  }
  if (payloadType === 'function_call_output') {
    return 'tool'
  }

  const role = extractString(entry, ['role', 'author']) ?? (payload ? extractString(payload, ['role', 'author']) : null)
  if (!role) {
    return 'unknown'
  }

  const normalized = role.toLowerCase()
  if (isThreadMessageRole(normalized)) {
    return normalized
  }

  return 'unknown'
}

function extractToolCallCount(entry: SessionEntry): number {
  const payload = asObject(entry.payload)
  const payloadType = payload ? extractString(payload, ['type']) : null
  if (payloadType === 'function_call' || payloadType === 'function_call_output') {
    return 1
  }
  const entryType = extractString(entry, ['type'])
  if (entryType === 'tool_call' || entryType === 'function_call') {
    return 1
  }
  return 0
}

function extractCodeChangeCount(entry: SessionEntry): number {
  const changes = asObject(entry.changes) ?? asObject(asObject(entry.payload)?.changes)
  if (!changes) {
    return 0
  }

  const direct =
    readNumber(changes.files_changed) ??
    readNumber(changes.filesChanged) ??
    readNumber(changes.file_count) ??
    readNumber(changes.fileCount)
  if (direct !== null) {
    return direct
  }

  const files = changes.files
  return Array.isArray(files) ? files.length : 0
}

function isSessionMetaEntry(entry: SessionEntry): boolean {
  return extractString(entry, ['type']) === 'session_meta'
}

function isSubagentSessionEntry(entry: SessionEntry): boolean {
  if (!isSessionMetaEntry(entry)) {
    return false
  }

  const payload = asObject(entry.payload)
  const source = payload ? asObject(payload.source) : null
  return Boolean(source && 'subagent' in source)
}

function isInjectedSessionContent(content: string): boolean {
  const trimmed = content.trim()
  return (
    trimmed.startsWith('# AGENTS.md') ||
    trimmed.startsWith('<environment_context>') ||
    (trimmed.startsWith(CODEX_IDE_CONTEXT_PREFIX) && !extractCodexPromptFromIdeContext(trimmed))
  )
}

function readableSessionContent(content: string): string {
  return extractCodexPromptFromIdeContext(content) ?? content
}

function extractCodexPromptFromIdeContext(content: string): string | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith(CODEX_IDE_CONTEXT_PREFIX)) {
    return null
  }

  const lines = trimmed.replace(/\r\n/g, '\n').split('\n')
  let prompt: string | null = null

  for (const [index, line] of lines.entries()) {
    const inlinePrompt = codexRequestHeadingPayload(line)
    if (inlinePrompt === null) {
      continue
    }

    if (inlinePrompt.length > 0) {
      prompt = inlinePrompt
      continue
    }

    const followingPrompt = lines.slice(index + 1).join('\n').trim()
    prompt = followingPrompt || null
  }

  return prompt
}

function codexRequestHeadingPayload(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('#')) {
    return null
  }

  const heading = trimmed.replace(/^#+\s*/, '')
  const lowered = heading.toLowerCase()
  if (!lowered.startsWith(CODEX_REQUEST_MARKER)) {
    return null
  }

  const suffix = heading.slice(CODEX_REQUEST_MARKER.length).trimStart()
  if (!suffix) {
    return ''
  }
  if (!/^[:：\-—]/.test(suffix)) {
    return null
  }

  return suffix.replace(/^[:：\-—\s]+/, '').trim()
}

function extractTextValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    return value
      .map(extractTextValue)
      .filter(Boolean)
      .join('\n')
      .trim()
  }

  if (!isSessionEntry(value)) {
    return ''
  }

  const itemType = extractString(value, ['type'])
  if (itemType === 'tool_use') {
    const name = extractString(value, ['name']) ?? 'unknown'
    return `[Tool: ${name}]`
  }

  if (itemType === 'tool_result') {
    return extractTextValue(value.content)
  }

  const direct = extractString(value, ['text', 'input_text', 'output_text'])
  if (direct) {
    return direct
  }

  return extractTextValue(value.content)
}

function asObject(value: unknown): SessionEntry | null {
  return isSessionEntry(value) ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : null
}

function threadIdFromSourceFile(sourceFile: string): string {
  const lastSegment = sourceFile.split('/').filter(Boolean).at(-1) ?? 'thread-unknown'
  return lastSegment.replace(/\.(jsonl|json)$/i, '')
}

function archivedFromSourceFile(sourceFile: string): boolean {
  return /(^|\/)(archive(d)?|archived_sessions|trash)(\/|$)/i.test(sourceFile)
}

function trashedFromSourceFile(sourceFile: string): boolean {
  return /\/sessions\/trash\//i.test(sourceFile)
}

function sourceKindFromSourceFile(sourceFile: string, archived: boolean): ThreadRecord['sourceKind'] {
  if (/\/sessions\/trash\//i.test(sourceFile)) {
    return 'trash'
  }
  if (/\/sessions\/recovered\//i.test(sourceFile)) {
    return 'recovered'
  }
  if (archived || /\/(archive|archived_sessions)\//i.test(sourceFile)) {
    return 'archive'
  }
  return sourceFile ? 'active' : 'unknown'
}

function projectNameFromPath(projectPath: string): string {
  return projectPath.split('/').filter(Boolean).at(-1) ?? projectPath
}

function excerpt(value: string, maxChars = 96): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > maxChars ? `${compact.slice(0, maxChars)}...` : compact
}
