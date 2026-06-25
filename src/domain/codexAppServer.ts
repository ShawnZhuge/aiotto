import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import type { ThreadMessagePreview, ThreadRecord } from './models'
import type { CodexSessionMessage } from './threadIndexer'
import { applyCodexSessionMessagesToThreadRecord } from './threadIndexer'
import { inferConversationStage } from './conversationStage'

export type CodexAppServerThreadSnapshot = {
  sourceKind: 'app_server' | 'unavailable'
  sourceLabel: string
  errorMessage: string | null
  threads: CodexAppServerThread[]
}

export type CodexAppServerThread = {
  threadId: string
  title: string
  preview: string
  status: ThreadRecord['status']
  projectPath: string
  sourceFile: string
  updatedAtEpochMs: number | null
  messages: CodexSessionMessage[]
}

export type CodexAppServerPlanStep = {
  step: string
  status: string
}

export type CodexAppServerRealtimeEvent = {
  eventKind: string
  method: string
  threadId: string
  turnId: string | null
  itemId: string | null
  role: ThreadMessagePreview['role'] | null
  delta: string | null
  text: string | null
  status: ThreadRecord['status'] | null
  planSteps: CodexAppServerPlanStep[]
  ts: number | null
}

export type CodexAppServerTurnStartRequest = {
  threadId: string
  prompt: string
  cwd?: string | null
}

export type CodexAppServerTurnStartStatus = {
  sourceKind: 'app_server' | 'unavailable'
  running: boolean
  requestId: number | null
  threadId: string | null
  errorMessage: string | null
}

type InvokeLike = <T>(command: string, args?: Record<string, unknown>) => Promise<T>
type UnlistenFn = () => void
type TauriEventPayload<T> = { payload: T }
type ListenLike = <T>(eventName: string, handler: (event: TauriEventPayload<T>) => void) => Promise<UnlistenFn>

const unavailableSnapshot: CodexAppServerThreadSnapshot = {
  sourceKind: 'unavailable',
  sourceLabel: 'Codex app-server 未启用',
  errorMessage: null,
  threads: [],
}
const MAX_REALTIME_RECENT_MESSAGES = 6
const CODEX_APP_SERVER_REALTIME_EVENT_NAME = 'codex-app-server://realtime-event'

export async function getCodexAppServerThreadSnapshotWithFallback(
  limit = 1,
  deps: { invoke?: InvokeLike } = {},
): Promise<CodexAppServerThreadSnapshot> {
  const invoke = deps.invoke ?? tauriInvoke
  try {
    const result = await invoke<unknown>('read_codex_app_server_thread_snapshot', { limit })
    return normalizeCodexAppServerThreadSnapshot(result)
  } catch (error) {
    return {
      ...unavailableSnapshot,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

export function normalizeCodexAppServerThreadSnapshot(result: unknown): CodexAppServerThreadSnapshot {
  if (!isRecord(result)) {
    return unavailableSnapshot
  }

  const threads = Array.isArray(result.threads)
    ? result.threads.flatMap((thread) => {
        const normalized = normalizeCodexAppServerThread(thread)
        return normalized ? [normalized] : []
      })
    : []

  return {
    sourceKind: result.sourceKind === 'app_server' ? 'app_server' : 'unavailable',
    sourceLabel: typeof result.sourceLabel === 'string' ? result.sourceLabel : unavailableSnapshot.sourceLabel,
    errorMessage: typeof result.errorMessage === 'string' ? result.errorMessage : null,
    threads,
  }
}

export function mergeCodexAppServerSnapshotIntoThreads(
  threads: ThreadRecord[],
  snapshot: CodexAppServerThreadSnapshot,
): ThreadRecord[] {
  if (snapshot.sourceKind !== 'app_server' || snapshot.threads.length === 0) {
    return threads
  }

  const snapshotByThreadId = new Map(snapshot.threads.map((thread) => [thread.threadId, thread]))
  const snapshotBySourceFile = new Map(snapshot.threads.map((thread) => [thread.sourceFile, thread]))

  return threads.map((thread) => {
    const snapshotThread = snapshotByThreadId.get(thread.threadId) ?? snapshotBySourceFile.get(thread.sourceFile)
    if (!snapshotThread || snapshotThread.messages.length === 0) {
      return thread
    }

    return applyCodexSessionMessagesToThreadRecord(thread, snapshotThread.messages)
  })
}

export function normalizeCodexAppServerRealtimeEvent(result: unknown): CodexAppServerRealtimeEvent | null {
  if (!isRecord(result)) {
    return null
  }

  const eventKind = readText(result.eventKind)
  const method = readText(result.method)
  const threadId = readText(result.threadId)
  if (!eventKind || !method || !threadId) {
    return null
  }

  return {
    eventKind,
    method,
    threadId,
    turnId: readNullableText(result.turnId),
    itemId: readNullableText(result.itemId),
    role: normalizeMessageRole(readNullableText(result.role)),
    delta: readNullableRawText(result.delta),
    text: readNullableText(result.text),
    status: normalizeOptionalThreadStatus(readNullableText(result.status)),
    planSteps: Array.isArray(result.planSteps)
      ? result.planSteps.flatMap((step) => {
          const normalized = normalizePlanStep(step)
          return normalized ? [normalized] : []
        })
      : [],
    ts: readNonNegativeNumber(result.ts),
  }
}

export function applyCodexAppServerRealtimeEventToThreads(
  threads: ThreadRecord[],
  event: CodexAppServerRealtimeEvent | unknown,
): ThreadRecord[] {
  const normalizedEvent = normalizeCodexAppServerRealtimeEvent(event)
  if (!normalizedEvent) {
    return threads
  }

  return threads.map((thread) => {
    if (thread.threadId !== normalizedEvent.threadId) {
      return thread
    }
    return applyCodexAppServerRealtimeEventToThread(thread, normalizedEvent)
  })
}

export async function listenToCodexAppServerRealtimeEvents(
  onEvent: (event: CodexAppServerRealtimeEvent) => void,
  deps: { invoke?: InvokeLike; listen?: ListenLike } = {},
): Promise<UnlistenFn> {
  const listen = deps.listen ?? (await importTauriListen())
  if (!listen) {
    return () => {}
  }
  const invoke = deps.invoke ?? tauriInvoke

  const unlisten = await listen<unknown>(CODEX_APP_SERVER_REALTIME_EVENT_NAME, (event) => {
    const normalized = normalizeCodexAppServerRealtimeEvent(event.payload)
    if (normalized) {
      onEvent(normalized)
    }
  })

  try {
    await invoke('start_codex_app_server_realtime_bridge')
  } catch (error) {
    console.warn('Failed to start Codex app-server realtime bridge:', error)
  }

  return () => {
    unlisten()
    void invoke('stop_codex_app_server_realtime_bridge').catch((error) => {
      console.warn('Failed to stop Codex app-server realtime bridge:', error)
    })
  }
}

export async function startCodexAppServerTurn(
  request: CodexAppServerTurnStartRequest,
  deps: { invoke?: InvokeLike } = {},
): Promise<CodexAppServerTurnStartStatus> {
  const invoke = deps.invoke ?? tauriInvoke
  try {
    const result = await invoke<unknown>('start_codex_app_server_turn', {
      threadId: request.threadId,
      prompt: request.prompt,
      cwd: request.cwd ?? null,
    })
    return normalizeCodexAppServerTurnStartStatus(result)
  } catch (error) {
    return {
      sourceKind: 'unavailable',
      running: false,
      requestId: null,
      threadId: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

function normalizeCodexAppServerTurnStartStatus(result: unknown): CodexAppServerTurnStartStatus {
  if (!isRecord(result)) {
    return {
      sourceKind: 'unavailable',
      running: false,
      requestId: null,
      threadId: null,
      errorMessage: 'Codex app-server turn start returned an invalid response.',
    }
  }

  return {
    sourceKind: result.sourceKind === 'app_server' ? 'app_server' : 'unavailable',
    running: result.running === true,
    requestId: readNonNegativeNumber(result.requestId),
    threadId: readNullableText(result.threadId),
    errorMessage: readNullableText(result.errorMessage),
  }
}

function normalizeCodexAppServerThread(value: unknown): CodexAppServerThread | null {
  if (!isRecord(value)) {
    return null
  }

  const threadId = readText(value.threadId)
  const sourceFile = readText(value.sourceFile)
  if (!threadId || !sourceFile) {
    return null
  }

  return {
    threadId,
    title: readText(value.title) || readText(value.preview) || threadId,
    preview: readText(value.preview),
    status: normalizeThreadStatus(readText(value.status)),
    projectPath: readText(value.projectPath),
    sourceFile,
    updatedAtEpochMs: readNonNegativeNumber(value.updatedAtEpochMs),
    messages: Array.isArray(value.messages)
      ? value.messages.flatMap((message) => {
          const normalized = normalizeCodexAppServerMessage(message)
          return normalized ? [normalized] : []
        })
      : [],
  }
}

function applyCodexAppServerRealtimeEventToThread(
  thread: ThreadRecord,
  event: CodexAppServerRealtimeEvent,
): ThreadRecord {
  const status = event.status ?? thread.status
  const timestamp = epochMsToIso(event.ts) ?? new Date().toISOString()
  const content = event.text ?? event.delta

  if (!content) {
    const summary = statusTextForRealtimeEvent(event) ?? thread.summary
    return {
      ...thread,
      status,
      summary,
      lastUpdatedAt: timestamp,
      conversationStage: inferConversationStage({
        status,
        summary,
        recentMessages: thread.recentMessages,
      }),
    }
  }

  const role = event.role ?? 'assistant'
  const recentMessages = event.delta !== null && event.text === null
    ? mergeRealtimeDelta(thread.recentMessages, role, event.delta, timestamp)
    : mergeRealtimeCompletedMessage(thread.recentMessages, role, content, timestamp, thread.status)
  const summary = excerpt(recentMessages.at(-1)?.content ?? content)

  return {
    ...thread,
    status,
    summary,
    lastUpdatedAt: timestamp,
    recentMessages,
    conversationStage: inferConversationStage({
      status,
      summary,
      recentMessages,
    }),
  }
}

function statusTextForRealtimeEvent(event: CodexAppServerRealtimeEvent): string | null {
  if (event.eventKind === 'turn_started' || event.status === 'running') {
    return '官方事件流已开始处理这条会话。'
  }
  if (event.status === 'waiting') {
    return '这条会话正在等待你的输入。'
  }
  if (event.status === 'approval') {
    return '这条会话正在等待批准。'
  }
  if (event.status === 'failed') {
    return '这条会话执行失败。'
  }
  if (event.eventKind === 'turn_completed' || event.status === 'completed') {
    return '本轮回复已完成。'
  }
  return null
}

function mergeRealtimeDelta(
  messages: ThreadMessagePreview[],
  role: ThreadMessagePreview['role'],
  delta: string,
  timestamp: string,
): ThreadMessagePreview[] {
  const last = messages.at(-1)
  if (last?.role === role && role === 'assistant') {
    return [
      ...messages.slice(0, -1),
      {
        ...last,
        content: excerpt(`${last.content}${delta}`),
        timestamp,
      },
    ].slice(-MAX_REALTIME_RECENT_MESSAGES)
  }

  return [
    ...messages,
    {
      role,
      content: excerpt(delta),
      timestamp,
    },
  ].slice(-MAX_REALTIME_RECENT_MESSAGES)
}

function mergeRealtimeCompletedMessage(
  messages: ThreadMessagePreview[],
  role: ThreadMessagePreview['role'],
  content: string,
  timestamp: string,
  previousStatus: ThreadRecord['status'],
): ThreadMessagePreview[] {
  const message = {
    role,
    content: excerpt(content),
    timestamp,
  } satisfies ThreadMessagePreview
  const last = messages.at(-1)
  if (last?.role === role && role === 'assistant' && previousStatus === 'running') {
    return [...messages.slice(0, -1), message].slice(-MAX_REALTIME_RECENT_MESSAGES)
  }

  return [...messages, message].slice(-MAX_REALTIME_RECENT_MESSAGES)
}

function normalizeCodexAppServerMessage(value: unknown): CodexSessionMessage | null {
  if (!isRecord(value)) {
    return null
  }
  const role = readText(value.role)
  const content = readText(value.content)
  if (!isMessageRole(role) || !content.trim()) {
    return null
  }
  return {
    role,
    content,
    ts: readNonNegativeNumber(value.ts),
  }
}

function normalizeThreadStatus(status: string): ThreadRecord['status'] {
  if (status === 'running' || status === 'waiting' || status === 'approval' || status === 'failed' || status === 'completed' || status === 'idle') {
    return status
  }
  return 'unknown'
}

function isMessageRole(role: string): role is CodexSessionMessage['role'] {
  return role === 'user' ||
    role === 'assistant' ||
    role === 'tool' ||
    role === 'system' ||
    role === 'developer' ||
    role === 'unknown'
}

function normalizeMessageRole(role: string | null): ThreadMessagePreview['role'] | null {
  return role && isMessageRole(role) ? role : null
}

function normalizeOptionalThreadStatus(status: string | null): ThreadRecord['status'] | null {
  return status ? normalizeThreadStatus(status) : null
}

function normalizePlanStep(value: unknown): CodexAppServerPlanStep | null {
  if (!isRecord(value)) {
    return null
  }
  const step = readText(value.step)
  if (!step) {
    return null
  }
  return {
    step,
    status: readText(value.status) || 'pending',
  }
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readNullableText(value: unknown): string | null {
  const text = readText(value)
  return text || null
}

function readNullableRawText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function readNonNegativeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function importTauriListen(): Promise<ListenLike | null> {
  try {
    const { listen } = await import('@tauri-apps/api/event')
    return listen as ListenLike
  } catch {
    return null
  }
}

function epochMsToIso(epochMs: number | null | undefined): string | null {
  return typeof epochMs === 'number' && Number.isFinite(epochMs) && epochMs > 0 ? new Date(epochMs).toISOString() : null
}

function excerpt(value: string, maxLength = 180): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized
}
