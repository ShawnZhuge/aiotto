import type { ConversationStage } from './conversationStage'

export type RiskLevel = 'Safe' | 'Caution' | 'Dangerous' | 'Active' | 'Unknown'

export type BackupSnapshot = {
  id: string
  createdAt: string
  operationType: 'scan' | 'archive' | 'restore' | 'prompt_write' | string
  affectedPaths: string[]
  sensitive: boolean
  beforeHash: string
  afterHash: string
  note: string
}

export type CodexHealthScan = {
  id: string
  createdAt: string
  codexHome: string
  totalSizeBytes: number
  riskCount: number
  largestItems: string[]
  activeSessionsCount: number
  recommendationSummary: string
  cleanupCandidates: CleanupCandidate[]
  envConflicts: EnvConflictRecord[]
  cliToolStatus: CliToolStatus
}

export type EnvConflictRecord = {
  id: string
  scanId: string
  variableName: string
  maskedValue: string
  source: 'process' | 'shell_profile' | 'unknown'
  sourcePath: string
  impact: string
  recommendedAction: string
  fixed: boolean
}

export type CliToolStatus = {
  id: string
  command: 'codex'
  installed: boolean
  version: string
  path: string
  lastCheckedAt: string
  status: 'ok' | 'missing' | 'unreadable' | 'error'
  suggestion: string
}

export type CleanupCandidate = {
  id: string
  scanId: string
  path: string
  category: 'state_db' | 'log_db' | 'global_state' | 'tui_log' | 'sessions' | 'sqlite_temp' | 'archive'
  sizeBytes: number
  modifiedAt: string
  riskLevel: RiskLevel
  recommendedAction: string
  selected: boolean
}

export type ProjectMemoryRecord = {
  id: string
  projectPath: string
  projectMdPath: string
  exists: boolean
  lastUpdatedAt: string
  sourceThreadIds: string[]
  backupId: string
}

export type ThreadRecord = {
  threadId: string
  parentThreadId?: string | null
  childThreadIds?: string[]
  projectPath: string
  projectName: string
  title: string
  summary: string
  status: 'running' | 'waiting' | 'approval' | 'failed' | 'completed' | 'idle' | 'unknown'
  conversationStage?: ConversationStage
  lastUpdatedAt: string
  messageCount: number
  sourceFile: string
  sourceSizeBytes?: number | null
  sourceModifiedAt?: string | null
  sourceContentExcerpted?: boolean
  sourceExcerptHeadBytes?: number | null
  sourceExcerptTailBytes?: number | null
  recentMessages: ThreadMessagePreview[]
  tokenUsage: ThreadTokenUsage
  restoreCommand: string
  restoreWorkdir: string
  restoreAvailable: boolean
  archived: boolean
  pinned?: boolean
  trashed?: boolean
  trashedAt?: string | null
  sourceKind?: 'active' | 'archive' | 'trash' | 'recovered' | 'unknown'
  heatScore?: number
  orphaned: boolean
  lost?: boolean
  recoverable?: boolean
  missingProjectDirectory?: boolean
  cleanupRecommendation?: string
  toolCallCount?: number
  codeChangeCount?: number
}

export type ThreadTokenUsage = {
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  totalTokens: number
}

export type ThreadMessagePreview = {
  role: 'user' | 'assistant' | 'tool' | 'system' | 'developer' | 'unknown'
  content: string
  timestamp: string | null
}

export type ThreadProjectGroup = {
  projectPath: string
  projectName: string
  threadCount: number
  runningCount: number
  waitingCount: number
  failedCount: number
  completedCount: number
  idleCount: number
  archivedCount: number
  orphanedCount: number
  lastUpdatedAt: string
  recentThreads: ThreadRecord[]
}

export type ThreadRestoreTarget = {
  threadId: string
  terminalApp: 'Terminal' | 'iTerm2' | 'Ghostty' | 'Warp'
  workdir: string
  command: string
  fallbackToClipboard: boolean
}

export type ExtensionRecord = {
  id: string
  type: 'MCP' | 'Skill' | 'Prompt' | 'Instruction'
  name: string
  path: string
  enabled: boolean
  healthStatus: 'ok' | 'warning' | 'error' | 'unknown'
  source: 'codex_home' | 'project' | 'manual'
}

export type PromptPreset = {
  id: string
  name: string
  scope: 'global_codex' | 'project'
  targetPath: string
  contentHash: string
  active: boolean
  lastBackfilledAt: string | null
  backupId: string
}
