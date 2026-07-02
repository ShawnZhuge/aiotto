import { Clock } from 'lucide-react'
import type { RefObject } from 'react'
import {
  AnimatedCircleCheckIcon,
  AnimatedChevronDownIcon,
  AnimatedChevronRightIcon,
  AnimatedIcon,
  AnimatedLoaderIcon,
  AnimatedRefreshIcon,
  AnimatedSearchIcon,
  AnimatedTrash2Icon,
  AnimatedXIcon,
} from '@/components/animatedLucide'
import { cn } from '@/lib/utils'
import { CheckboxControl } from '@/components/ui/checkbox-control'
import { SearchField } from '@/components/ui/search-field'
import { PageState } from '../../components/page/PageState'
import { conversationStageLabel, sanitizeConversationStage } from '../../domain/conversationStage'
import type { ThreadRecord } from '../../domain/models'
import type { CodexSessionMetaScan } from '../../domain/threadIndexer'
import type { PreparedMessage } from './types'
import { typography } from '@/design/typography'
import {
  formatRelativeTime,
  listTitleClampStyle,
  truncateTocText,
} from './types'
import { Tooltip } from '../../components/ui'
import { CodexSourceIcon } from './icons'

export function ThreadListPanel(props: {
  threads: ThreadRecord[]
  visibleThreads: ThreadRecord[]
  scan: CodexSessionMetaScan
  loading: boolean
  refreshing: boolean
  error: string | null
  selectedThreadId: string
  searchQuery: string
  searchInputRef: RefObject<HTMLInputElement | null>
  searchActive: boolean
  batchMode: boolean
  selectedThreadIds: Set<string>
  bulkDeleting: boolean
  onSearchQueryChange: (query: string) => void
  onOpenSearch: () => void
  onCloseSearch: () => void
  onToggleBatchMode: () => void
  onSelectAllVisibleThreads: () => void
  onClearSelectedThreads: () => void
  onToggleThreadSelection: (threadId: string) => void
  onBulkDeleteSelectedThreads: () => void
  onReload: () => void
  onSelectThread: (threadId: string) => void
}) {
  const {
    threads,
    visibleThreads,
    scan,
    loading,
    refreshing,
    error,
    selectedThreadId,
    searchQuery,
    searchInputRef,
    searchActive,
    batchMode,
    selectedThreadIds,
    bulkDeleting,
    onSearchQueryChange,
    onOpenSearch,
    onCloseSearch,
    onToggleBatchMode,
    onSelectAllVisibleThreads,
    onClearSelectedThreads,
    onToggleThreadSelection,
    onBulkDeleteSelectedThreads,
    onReload,
    onSelectThread,
  } = props
  const hasLoadedThreads = threads.length > 0
  const showBlockingLoading = loading && !hasLoadedThreads
  const showBlockingError = !loading && !hasLoadedThreads && Boolean(error)
  const selectedBulkCount = selectedThreadIds.size

  return (
    <aside
      data-testid="thread-list-panel"
      className="aiotto-motion-card liquid-glass-card w-[310px] xl:w-[330px] 2xl:w-[350px] shrink-0 aiotto-radius-card flex flex-col overflow-hidden"
    >
      <div
        data-testid="thread-list-header"
        data-aiotto-mode={searchActive ? 'search' : batchMode ? 'bulk' : 'default'}
        className={cn(
          'min-h-[64px] shrink-0 border-b border-border/60',
          searchActive ? 'flex items-center p-3' : 'space-y-3 p-3',
        )}
      >
        {searchActive ? (
          <div className="relative w-full">
            <SearchField
              ref={searchInputRef}
              ariaLabel="搜索会话"
              value={searchQuery}
              onValueChange={onSearchQueryChange}
              placeholder="搜索会话内容、目录或 ID"
              iconClassName="h-3.5 w-3.5"
              showClearButton={false}
              tone="toolbar"
            />
            <Tooltip content="关闭搜索">
              <button
                type="button"
                onClick={onCloseSearch}
                className="liquid-glass-button absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center aiotto-radius-button text-muted-foreground hover:text-foreground"
                aria-label="关闭搜索"
              >
                <AnimatedIcon icon={AnimatedXIcon} className="h-3.5 w-3.5" size={14} hoverAnimate={false} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className={cn(typography.cardTitle, 'text-sm')}>会话列表</h2>
                <span className={cn('liquid-glass-section rounded-full px-2 py-0.5 text-muted-foreground', typography.badgeText)}>
                  {visibleThreads.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip content={batchMode ? '退出批量管理' : '进入批量管理'}>
                  <button
                    type="button"
                    onClick={onToggleBatchMode}
                    className={cn(
                      'liquid-glass-button flex h-7 w-7 items-center justify-center aiotto-radius-button text-muted-foreground hover:text-foreground',
                      batchMode && 'bg-primary/12 text-primary ring-1 ring-primary/20',
                    )}
                    aria-label={batchMode ? '退出批量管理' : '进入批量管理'}
                    aria-pressed={batchMode}
                  >
                    <AnimatedIcon icon={AnimatedCircleCheckIcon} className="h-3.5 w-3.5" size={14} />
                  </button>
                </Tooltip>
                <Tooltip content="搜索">
                  <button
                    type="button"
                    onClick={onOpenSearch}
                    className="liquid-glass-button flex h-7 w-7 items-center justify-center aiotto-radius-button text-muted-foreground hover:text-foreground"
                    aria-label="搜索会话"
                  >
                    <AnimatedIcon icon={AnimatedSearchIcon} className="h-3.5 w-3.5" size={14} />
                  </button>
                </Tooltip>
                <Tooltip content="刷新">
                  <button
                    type="button"
                    onClick={onReload}
                    className="liquid-glass-button flex h-7 w-7 items-center justify-center aiotto-radius-button text-muted-foreground hover:text-foreground"
                    aria-label="刷新会话"
                  >
                    <AnimatedIcon
                      icon={AnimatedRefreshIcon}
                      className="h-3.5 w-3.5"
                      size={14}
                      animate={loading || refreshing}
                      hoverAnimate={false}
                    />
                  </button>
                </Tooltip>
              </div>
            </div>

            {batchMode ? (
              <div className="aiotto-radius-inset border border-border/75 bg-background/62 p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full border border-border bg-background px-2.5 py-1', typography.badgeText)}>
                    已选 {selectedBulkCount} 项
                  </span>
                  <span className={cn('min-w-0 flex-1 truncate text-muted-foreground', typography.sectionDescription)}>勾选要删除的会话</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAllVisibleThreads}
                    className={cn('h-8 aiotto-radius-button px-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground', typography.controlText)}
                  >
                    全选当前
                  </button>
                  <button
                    type="button"
                    onClick={onClearSelectedThreads}
                    className={cn('h-8 aiotto-radius-button px-2 text-muted-foreground hover:bg-muted/70 hover:text-foreground', typography.controlText)}
                  >
                    清空已选
                  </button>
                  <button
                    type="button"
                    onClick={onBulkDeleteSelectedThreads}
                    disabled={bulkDeleting || selectedBulkCount === 0}
                    className={cn('ml-auto flex h-8 items-center gap-1.5 aiotto-radius-button bg-destructive/70 px-2.5 text-destructive-foreground shadow-sm hover:bg-destructive disabled:cursor-not-allowed disabled:opacity-50', typography.controlText)}
                  >
                    <AnimatedIcon
                      icon={bulkDeleting ? AnimatedLoaderIcon : AnimatedTrash2Icon}
                      className="h-3.5 w-3.5"
                      size={14}
                      animate={bulkDeleting}
                    />
                    批量删除
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5">
        {showBlockingLoading ? (
          <PageState
            density="compact"
            kind="loading"
            title="正在加载会话"
            description="正在读取本地 Codex sessions。"
          />
        ) : null}
        {showBlockingError ? (
          <PageState
            density="compact"
            kind="error"
            title="会话读取失败"
            description={error ?? '请稍后重试。'}
            actionLabel="重试"
            onAction={onReload}
          />
        ) : null}
        {!loading && !error && visibleThreads.length === 0 ? (
          <PageState
            density="compact"
            kind="empty"
            title={threads.length === 0 ? '暂无会话' : '没有匹配的会话'}
            description={threads.length === 0 ? 'Aiotto 会在读取到 Codex sessions 后显示最近会话。' : '换个关键词试试。'}
            actionLabel={threads.length === 0 ? '刷新' : '清除搜索'}
            onAction={threads.length === 0 ? onReload : () => onSearchQueryChange('')}
          />
        ) : null}
        {visibleThreads.map((thread) => {
          const isSelected = selectedThreadId === thread.threadId
          const isBulkSelected = selectedThreadIds.has(thread.threadId)
          const rowContent = (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center aiotto-radius-button border border-border/55 bg-muted/55 text-foreground/85 shadow-inner">
                <CodexSourceIcon testId="thread-list-codex-icon" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className={typography.listTitle} style={listTitleClampStyle}>
                    {thread.title}
                  </span>
                  <span
                    data-testid="thread-list-chevron"
                    data-aiotto-direction={isSelected ? 'down' : 'right'}
                    className="shrink-0"
                  >
                    <AnimatedIcon
                      icon={isSelected ? AnimatedChevronDownIcon : AnimatedChevronRightIcon}
                      className={`mt-0.5 h-3.5 w-3.5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`}
                      size={14}
                    />
                  </span>
                </div>
                <div className={cn('mt-1.5 flex items-center gap-1.5', typography.listMeta)}>
                  <span className="flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    <span>{formatRelativeTime(thread.lastUpdatedAt)}</span>
                  </span>
                </div>
              </div>
            </div>
          )

          if (batchMode) {
            return (
              <div
                key={thread.threadId}
                className={cn(
                  'w-full min-h-[70px] aiotto-radius-button border px-2.5 py-2 text-left transition-colors',
                  isSelected
                    ? 'liquid-glass-section border-primary/30 bg-primary/5 shadow-sm'
                    : 'border-transparent hover:border-border hover:bg-muted/45',
                  isBulkSelected && 'ring-1 ring-primary/25',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <CheckboxControl
                    checked={isBulkSelected}
                    label={`选择会话 ${thread.title}`}
                    hideLabel
                    containerClassName="mt-1.5 shrink-0"
                    indicatorClassName="h-4 w-4"
                    onCheckedChange={() => onToggleThreadSelection(thread.threadId)}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.threadId)}
                    className="min-w-0 flex-1 text-left"
                  >
                    {rowContent}
                  </button>
                </div>
              </div>
            )
          }

          return (
            <button
              key={thread.threadId}
              type="button"
              onClick={() => onSelectThread(thread.threadId)}
              className={`w-full min-h-[70px] aiotto-radius-button border px-2.5 py-2 text-left transition-colors ${
                isSelected
                  ? 'liquid-glass-section border-primary/30 bg-primary/5 shadow-sm'
                : 'border-transparent hover:border-border hover:bg-muted/45'
              }`}
            >
              {rowContent}
            </button>
          )
        })}
      </div>

      {(scan.truncated || scan.unreadableSourceCount > 0) && (
        <div className={cn('shrink-0 border-t border-border/60 px-4 py-3', typography.sectionDescription)}>
          {scan.truncated ? '扫描结果已截断。' : null}
          {scan.unreadableSourceCount > 0 ? ` 有 ${scan.unreadableSourceCount} 个文件不可读。` : null}
        </div>
      )}
    </aside>
  )
}


export function ThreadStatusChip({ status }: { status: ThreadRecord['status'] }) {
  const labels: Record<ThreadRecord['status'], string> = {
    approval: '待确认',
    waiting: '待处理',
    failed: '失败',
    running: '运行中',
    completed: '已完成',
    idle: '空闲',
    unknown: '未知',
  }
  const classes: Record<ThreadRecord['status'], string> = {
    approval: 'border-destructive/25 bg-destructive/10 text-destructive',
    waiting: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    failed: 'border-destructive/25 bg-destructive/10 text-destructive',
    running: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    completed: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    idle: 'border-border bg-muted text-muted-foreground',
    unknown: 'border-border bg-muted text-muted-foreground',
  }

  return (
    <span className={cn('shrink-0 aiotto-radius-button border px-1.5 py-0.5', typography.badgeText, classes[status])}>
      {labels[status]}
    </span>
  )
}

export function ConversationStageChip({
  stage,
  size = 'compact',
}: {
  stage: ThreadRecord['conversationStage']
  size?: 'compact' | 'regular'
}) {
  const safeStage = sanitizeConversationStage(stage)
  const classes: Record<NonNullable<ThreadRecord['conversationStage']>, string> = {
    waiting_for_ai: 'border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    thinking: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    planning: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
    coding: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    verifying: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    waiting_for_user: 'border-destructive/25 bg-destructive/10 text-destructive',
    done: 'border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300',
    blocked: 'border-destructive/25 bg-destructive/10 text-destructive',
    idle: 'border-border bg-muted text-muted-foreground',
  }
  const paddingClass = size === 'regular' ? 'px-2 py-0.5' : 'px-1.5 py-0.5'

  return (
    <span className={cn('shrink-0 aiotto-radius-button border', paddingClass, typography.badgeText, classes[safeStage])}>
      {conversationStageLabel(safeStage)}
    </span>
  )
}

export function ThreadTocList({
  items,
  variant,
  onSelect,
}: {
  items: PreparedMessage[]
  variant: 'sidebar' | 'dialog'
  onSelect: (messageId: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm text-muted-foreground">
        暂无目录
      </div>
    )
  }

  const containerClass =
    variant === 'dialog'
      ? 'min-h-0 flex-1 overflow-y-auto p-3 flex flex-col gap-1.5'
      : 'min-h-0 flex-1 overflow-y-auto p-3 flex flex-col gap-1.5'
  const itemClass =
    variant === 'dialog'
      ? 'w-full aiotto-radius-field px-2.5 py-2.5 text-left hover:bg-muted/60 flex items-start gap-2.5 transition-colors'
      : 'w-full aiotto-radius-field px-2.5 py-2.5 text-left hover:bg-muted/60 flex items-start gap-2.5 transition-colors'
  const indexClass =
    variant === 'dialog'
      ? cn('h-7 w-7 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center', typography.badgeText)
      : cn('h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center', typography.badgeText)
  const textClass =
    variant === 'dialog'
      ? cn('min-w-0 flex-1 line-clamp-2 text-muted-foreground', typography.navLabel)
      : cn('min-w-0 flex-1 line-clamp-2 text-muted-foreground', typography.navLabel)
  const listTestId = variant === 'dialog' ? 'thread-dialog-toc-list' : 'thread-wide-toc-list'
  const itemTestId = variant === 'dialog' ? 'thread-dialog-toc-item' : 'thread-wide-toc-item'
  const indexTestId = variant === 'dialog' ? 'thread-dialog-toc-item-index' : 'thread-wide-toc-item-index'
  const textTestId = variant === 'dialog' ? 'thread-dialog-toc-item-text' : 'thread-wide-toc-item-text'

  return (
    <div className={containerClass} data-testid={listTestId}>
      {items.map((message, index) => (
        <button
          key={message.id}
          type="button"
          onClick={() => onSelect(message.id)}
          className={itemClass}
          data-testid={itemTestId}
        >
          <span className={indexClass} data-testid={indexTestId}>{index + 1}</span>
          <span className={textClass} data-testid={textTestId}>
            {variant === 'dialog' ? truncateTocText(message.content, 140) : message.content}
          </span>
        </button>
      ))}
    </div>
  )
}

export function MessageContent({
  id,
  content,
  expanded,
  onToggle,
}: {
  id: string
  content: string
  expanded: boolean
  onToggle: (id: string) => void
}) {
  const shouldCollapse = content.length > 1400
  const visibleContent = shouldCollapse && !expanded ? `${content.slice(0, 1400)}...` : content

  return (
    <>
      <div className={cn('whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13px] leading-5', typography.body)}>
        {visibleContent}
      </div>
      {shouldCollapse ? (
        <button
          type="button"
          onClick={() => onToggle(id)}
          className={cn('mt-2 text-primary hover:text-primary/80', typography.controlText)}
        >
          {expanded ? '收起' : '展开'}
        </button>
      ) : null}
    </>
  )
}
