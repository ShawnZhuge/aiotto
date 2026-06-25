import type { CSSProperties } from 'react'
import type { ThreadRecord } from '../../domain/models'
import type { CodexSessionMessage } from '../../domain/threadIndexer'

export type PreparedMessage = CodexSessionMessage & {
  id: string
  index: number
}

export const listTitleClampStyle: CSSProperties = {
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  overflow: 'hidden',
}

export function buildRestoreCommand(thread: ThreadRecord): string {
  if (!thread.restoreCommand) {
    return ''
  }

  return thread.restoreWorkdir ? `cd ${thread.restoreWorkdir} && ${thread.restoreCommand}` : thread.restoreCommand
}

export function buildRestoreCommandPreview(thread: ThreadRecord): string {
  return thread.restoreCommand || ''
}

export function basenameFromPath(value: string | null | undefined): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    return ''
  }

  const normalized = trimmed.replace(/[\\/]+$/, '')
  const parts = normalized.split(/[\\/]/).filter(Boolean)
  return parts.at(-1) || trimmed
}

export function formatRelativeTime(value: string | null | undefined): string {
  const time = value ? new Date(value).getTime() : Number.NaN
  if (!Number.isFinite(time)) {
    return '未知时间'
  }

  const diffMs = Math.max(0, Date.now() - time)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))} 分钟前`
  }
  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} 小时前`
  }
  if (diffMs < 7 * day) {
    return `${Math.floor(diffMs / day)} 天前`
  }

  return formatDate(value)
}

export function formatDate(value: string | null | undefined): string {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatEpochTime(value: number | null): string {
  if (!value || !Number.isFinite(value)) {
    return ''
  }

  return formatDateTime(new Date(value).toISOString())
}

export function truncateTocText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

export function roleLabel(role: CodexSessionMessage['role']): string {
  if (role === 'user') {
    return '用户'
  }
  if (role === 'assistant') {
    return 'AI'
  }
  if (role === 'tool') {
    return '工具'
  }
  if (role === 'system') {
    return '系统'
  }
  if (role === 'developer') {
    return '开发者'
  }
  return '未知'
}

export function messageToneClass(role: CodexSessionMessage['role']): string {
  if (role === 'user') {
    return 'border-primary/35 bg-primary/10 shadow-sm shadow-primary/10 dark:bg-primary/15'
  }
  if (role === 'assistant') {
    return 'border-border/70 bg-muted/40'
  }
  if (role === 'tool') {
    return 'border-border bg-background'
  }
  if (role === 'system' || role === 'developer') {
    return 'border-amber-500/20 bg-amber-500/10'
  }
  return 'border-border bg-muted/30'
}

export function roleTextClass(role: CodexSessionMessage['role']): string {
  if (role === 'user') {
    return 'text-primary'
  }
  if (role === 'assistant') {
    return 'text-card-foreground'
  }
  if (role === 'tool') {
    return 'text-muted-foreground'
  }
  if (role === 'system' || role === 'developer') {
    return 'text-amber-600 dark:text-amber-300'
  }
  return 'text-muted-foreground'
}
