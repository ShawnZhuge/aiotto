import type { ThreadRecord } from './models'

export type ThreadMarkdownExport = {
  fileName: string
  content: string
}

export type ThreadActionKind = 'archive' | 'trash' | 'recover' | 'purge' | 'delete'

export type ThreadActionPlan = {
  action: Extract<ThreadActionKind, 'archive' | 'trash' | 'purge'>
  threadId: string
  title: string
  sourceFile: string
  targetSourceFile: string
  affectedPaths: string[]
  backupOperationType: 'thread_archive' | 'thread_trash' | 'thread_purge'
  requiresBackup: true
  requiresConfirmation: true
  confirmationTitle: string
  confirmationDescription: string
  note: string
}

export type ThreadActionBackupRequest = {
  affectedPaths: string[]
  operationType: ThreadActionPlan['backupOperationType']
  note: string
  sensitive: boolean
}

export type ThreadActionResult = {
  action: ThreadActionKind
  threadId: string
  backupId: string
  status: 'completed'
  sourceFile: string
  targetSourceFile: string
  affectedPaths: string[]
  backupOperationType: ThreadActionPlan['backupOperationType']
  note: string
  message: string
}

export type ThreadFileActionMovedPath = {
  sourcePath: string
  targetPath: string
}

export type ThreadFileActionResult = {
  action: ThreadActionKind
  status: 'completed' | string
  backupId: string
  threadIds: string[]
  sourceFiles: string[]
  movedPaths: ThreadFileActionMovedPath[]
  deletedPaths: string[]
  skippedPaths: string[]
  logPath: string
  note: string
  message: string
}

export type ThreadActionDeps = {
  createBackup: (request: ThreadActionBackupRequest) => Promise<{ id: string }>
  performAction: (plan: ThreadActionPlan) => Promise<void>
}

export function createThreadMarkdownExport(thread: ThreadRecord): ThreadMarkdownExport {
  const fileName = `${sanitizeFileSegment(thread.projectName)}-${sanitizeFileSegment(thread.threadId)}.md`
  const restoreCommand = thread.restoreAvailable
    ? `cd ${thread.restoreWorkdir} && ${thread.restoreCommand}`
    : '不可恢复'
  const content = [
    `# ${thread.title}`,
    '',
    '## 摘要',
    '',
    thread.summary,
    '',
    '## 元数据',
    '',
    `- Thread ID: \`${thread.threadId}\``,
    `- 项目: \`${thread.projectName}\``,
    `- 工作目录: \`${thread.projectPath}\``,
    `- 状态: \`${thread.status}\``,
    `- 更新时间: \`${thread.lastUpdatedAt}\``,
    `- 消息数: \`${thread.messageCount}\``,
    `- Source: \`${thread.sourceFile}\``,
    `- Source size: \`${thread.sourceSizeBytes ?? 'unknown'}\``,
    `- Source modified: \`${thread.sourceModifiedAt ?? 'unknown'}\``,
    `- Source read mode: \`${formatSourceReadMode(thread)}\``,
    '',
    '## Token 用量',
    '',
    ...formatTokenUsage(thread),
    '',
    '## 最近消息',
    '',
    ...formatRecentMessages(thread),
    '',
    '## 恢复命令',
    '',
    '```bash',
    restoreCommand,
    '```',
    '',
  ].join('\n')

  return { fileName, content }
}

export function createThreadUsageMarkdownExport(threads: ThreadRecord[]): ThreadMarkdownExport {
  const rows = threads.map((thread) => {
    const tokenUsage = thread.tokenUsage ?? {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }
    const usage =
      tokenUsage.totalTokens > 0 ||
      tokenUsage.inputTokens > 0 ||
      tokenUsage.outputTokens > 0 ||
      tokenUsage.cachedInputTokens > 0
        ? [
            String(tokenUsage.inputTokens),
            String(tokenUsage.cachedInputTokens),
            String(tokenUsage.outputTokens),
            String(tokenUsage.totalTokens),
          ]
        : ['Unknown', 'Unknown', 'Unknown', 'Unknown']

    return `| ${thread.threadId} | ${thread.projectName} | ${thread.status} | ${usage.join(' | ')} |`
  })

  return {
    fileName: 'aiotto-thread-usage.md',
    content: [
      '# Aiotto Thread Usage',
      '',
      '| Thread ID | Project | Status | Input | Cached Input | Output | Total |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      ...rows,
      '',
    ].join('\n'),
  }
}

function formatTokenUsage(thread: ThreadRecord): string[] {
  const tokenUsage = thread.tokenUsage ?? {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  }
  if (tokenUsage.totalTokens <= 0 && tokenUsage.inputTokens <= 0 && tokenUsage.outputTokens <= 0) {
    return ['暂无真实 token usage 字段。']
  }

  return [
    `- 输入: \`${tokenUsage.inputTokens}\``,
    `- 输出: \`${tokenUsage.outputTokens}\``,
    `- 缓存输入: \`${tokenUsage.cachedInputTokens}\``,
    `- 合计: \`${tokenUsage.totalTokens}\``,
  ]
}

function formatRecentMessages(thread: ThreadRecord): string[] {
  const recentMessages = thread.recentMessages ?? []
  if (recentMessages.length === 0) {
    return ['暂无可展示的真实消息片段。']
  }

  return recentMessages.map((message) => {
    const timestamp = message.timestamp ?? 'unknown'
    return `- ${message.role} · ${timestamp}: ${message.content}`
  })
}

function formatSourceReadMode(thread: ThreadRecord): string {
  if (!thread.sourceContentExcerpted) {
    return 'full'
  }

  const headBytes = thread.sourceExcerptHeadBytes ?? 'unknown'
  const tailBytes = thread.sourceExcerptTailBytes ?? 'unknown'
  return `head-tail excerpt (${headBytes} + ${tailBytes} bytes)`
}

export function createThreadActionPlan(thread: ThreadRecord, action: ThreadActionKind): ThreadActionPlan {
  if (action === 'recover') {
    throw new Error('recover uses the batch file action command')
  }
  const normalizedAction = normalizeThreadActionKind(action)
  const targetSourceFile =
    normalizedAction === 'archive' ? archiveSourceFile(thread) : normalizedAction === 'trash' ? trashSourceFile(thread) : ''
  const backupOperationType =
    normalizedAction === 'archive'
      ? 'thread_archive'
      : normalizedAction === 'trash'
        ? 'thread_trash'
        : 'thread_purge'
  const actionLabel =
    normalizedAction === 'archive' ? '归档' : normalizedAction === 'trash' ? '移入回收站' : '清空'

  return {
    action: normalizedAction,
    threadId: thread.threadId,
    title: thread.title,
    sourceFile: thread.sourceFile,
    targetSourceFile,
    affectedPaths: [thread.sourceFile],
    backupOperationType,
    requiresBackup: true,
    requiresConfirmation: true,
    confirmationTitle: `${actionLabel}线程 ${thread.threadId}`,
    confirmationDescription: `Aiotto 会先备份 ${thread.sourceFile}，再${actionLabel}该线程索引。`,
    note: `${actionLabel}线程 ${thread.threadId} 前自动备份。`,
  }
}

export async function applyThreadFileActionWithFallback({
  action,
  threads,
  note,
}: {
  action: ThreadActionKind
  threads: ThreadRecord[]
  note: string
}): Promise<ThreadFileActionResult> {
  if (threads.length === 0) {
    throw new Error('请选择至少一个线程。')
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const normalizedAction = action === 'delete' ? 'trash' : action
    return await invoke<ThreadFileActionResult>('apply_codex_thread_file_action', {
      request: {
        manualPath: null,
        action: normalizedAction,
        threadIds: threads.map((thread) => thread.threadId),
        sourceFiles: threads.map((thread) => thread.sourceFile),
        note,
      },
    })
  } catch (error) {
    throw new Error(errorMessage(error), { cause: error })
  }
}

export async function executeThreadActionPlan(
  plan: ThreadActionPlan,
  deps: ThreadActionDeps,
): Promise<ThreadActionResult> {
  const backup = await deps.createBackup({
    affectedPaths: plan.affectedPaths,
    operationType: plan.backupOperationType,
    note: plan.note,
    sensitive: false,
  })

  await deps.performAction(plan)

  const actionLabel = plan.action === 'archive' ? '归档' : plan.action === 'trash' ? '移入回收站' : '清空'
  return {
    action: plan.action,
    threadId: plan.threadId,
    backupId: backup.id,
    status: 'completed',
    sourceFile: plan.sourceFile,
    targetSourceFile: plan.targetSourceFile,
    affectedPaths: plan.affectedPaths,
    backupOperationType: plan.backupOperationType,
    note: plan.note,
    message: `${plan.threadId} ${actionLabel}完成，备份：${backup.id}`,
  }
}

function archiveSourceFile(thread: ThreadRecord): string {
  const fileName = thread.sourceFile.split('/').filter(Boolean).at(-1) ?? `${thread.threadId}.jsonl`
  return `~/.codex/sessions/archive/${fileName}`
}

function trashSourceFile(thread: ThreadRecord): string {
  const fileName = thread.sourceFile.split('/').filter(Boolean).at(-1) ?? `${thread.threadId}.jsonl`
  return `~/.codex/sessions/trash/${fileName}`
}

function normalizeThreadActionKind(action: ThreadActionKind): Extract<ThreadActionKind, 'archive' | 'trash' | 'purge'> {
  if (action === 'archive' || action === 'trash' || action === 'purge') {
    return action
  }

  if (action === 'delete') {
    return 'trash'
  }

  throw new Error('recover uses the batch file action command')
}

function sanitizeFileSegment(value: string): string {
  const sanitized = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitized || 'thread'
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return String(error)
}
