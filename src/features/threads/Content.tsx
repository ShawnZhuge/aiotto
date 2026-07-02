import {
  Clock,
  FolderOpen,
  List,
  MessageSquare,
} from 'lucide-react'
import { observeElementRect, useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from 'react'
import {
  AnimatedClipboardIcon,
  AnimatedIcon,
  AnimatedListIcon,
  AnimatedLoaderIcon,
  AnimatedMessageSquareIcon,
  AnimatedPlayIcon,
  AnimatedRefreshIcon,
  AnimatedTrash2Icon,
} from '@/components/animatedLucide'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'
import { ActionToast } from '../../components/actionToast'
import { PageState } from '../../components/page/PageState'
import { SyncActivityPill } from '../../components/states'
import { AlertDialog, Tooltip } from '../../components/ui'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useSessionMessages, useThreads } from '../../hooks/useThreads'
import { threadsService } from '../../services/threads'
import { ThreadTocDialog } from './dialogs'
import { CodexSourceIcon } from './icons'
import { MessageContent, ThreadListPanel, ThreadTocList } from './panels'
import {
  basenameFromPath,
  buildRestoreCommand,
  buildRestoreCommandPreview,
  formatDateTime,
  formatEpochTime,
  messageToneClass,
  roleLabel,
  roleTextClass,
  type PreparedMessage,
} from './types'

export function ThreadsContent() {
  const { threads, scan, loading, refreshing = false, error, reload } = useThreads()
  const [searchQuery, setSearchQuery] = useState('')
  const [threadListSearchActive, setThreadListSearchActive] = useState(false)
  const [threadListBatchMode, setThreadListBatchMode] = useState(false)
  const [bulkSelectedThreadIds, setBulkSelectedThreadIds] = useState<Set<string>>(() => new Set())
  const [bulkDeletingThreads, setBulkDeletingThreads] = useState(false)
  const [selectedThreadIdOverride, setSelectedThreadIdOverride] = useState('')
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(() => new Set())
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [realtimePrompt, setRealtimePrompt] = useState('')
  const [startingRealtimeTurn, setStartingRealtimeTurn] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [tocDialogOpen, setTocDialogOpen] = useState(false)
  const [, startTransition] = useTransition()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const messageScrollerRef = useRef<HTMLDivElement | null>(null)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const visibleThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return threads
    }

    return threads.filter((thread) =>
      [thread.title, thread.summary, thread.projectName, thread.projectPath, thread.threadId]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [searchQuery, threads])

  const selectedThreadId = useMemo(() => {
    if (threads.length === 0) {
      return ''
    }

    if (selectedThreadIdOverride && threads.some((thread) => thread.threadId === selectedThreadIdOverride)) {
      return selectedThreadIdOverride
    }

    return threads[0].threadId
  }, [selectedThreadIdOverride, threads])

  const currentThread = useMemo(
    () => threads.find((thread) => thread.threadId === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  )
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    reload: reloadMessages,
  } = useSessionMessages(currentThread?.sourceFile)

  const preparedMessages = useMemo<PreparedMessage[]>(
    () =>
      messages.map((message, index) => ({
        ...message,
        id: `${currentThread?.threadId ?? 'thread'}-${index}`,
        index,
      })),
    [currentThread?.threadId, messages],
  )
  const messageIndexById = useMemo(
    () => new Map(preparedMessages.map((message, index) => [message.id, index])),
    [preparedMessages],
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual APIs stay local to this render path.
  const messageVirtualizer = useVirtualizer({
    count: preparedMessages.length,
    getScrollElement: () => messageScrollerRef.current,
    estimateSize: () => 128,
    observeElementRect: (instance, callback) => {
      if (typeof ResizeObserver === 'undefined') {
        callback({ width: 900, height: 720 })
        return undefined
      }
      return observeElementRect(instance, callback)
    },
    overscan: 8,
    gap: 8,
    initialRect: {
      width: 900,
      height: 720,
    },
  })

  const tocItems = useMemo(() => {
    const userMessages = preparedMessages.filter((message) => message.role === 'user')
    return (userMessages.length > 0 ? userMessages : preparedMessages).slice(0, 80)
  }, [preparedMessages])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) {
        return
      }

      setExpandedMessageIds(new Set())
      messageRefs.current = {}
      setTocDialogOpen(false)
      if (typeof messageScrollerRef.current?.scrollTo === 'function') {
        messageScrollerRef.current.scrollTo({ top: 0 })
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedThreadId])

  useEffect(() => {
    if (!threadListSearchActive) {
      return
    }

    queueMicrotask(() => searchInputRef.current?.focus())
  }, [threadListSearchActive])

  useEffect(() => {
    setBulkSelectedThreadIds((current) => {
      if (current.size === 0) {
        return current
      }

      const validThreadIds = new Set(threads.map((thread) => thread.threadId))
      let changed = false
      const next = new Set<string>()
      current.forEach((threadId) => {
        if (validThreadIds.has(threadId)) {
          next.add(threadId)
        } else {
          changed = true
        }
      })

      return changed ? next : current
    })
  }, [threads])

  const commandText = currentThread ? buildRestoreCommandPreview(currentThread) : ''
  const commandCopyText = currentThread ? buildRestoreCommand(currentThread) : ''
  const projectDirectoryPath = currentThread?.restoreWorkdir || currentThread?.projectPath || ''
  const projectDirectoryName = basenameFromPath(projectDirectoryPath) || currentThread?.projectName || ''

  function openThreadSearch() {
    setThreadListBatchMode(false)
    setThreadListSearchActive(true)
  }

  function closeThreadSearch() {
    setThreadListSearchActive(false)
    setSearchQuery('')
  }

  function toggleThreadBatchMode() {
    setThreadListSearchActive(false)
    setSearchQuery('')
    if (threadListBatchMode) {
      setBulkSelectedThreadIds(new Set())
    }
    setThreadListBatchMode(!threadListBatchMode)
  }

  function selectAllVisibleThreads() {
    setBulkSelectedThreadIds(new Set(visibleThreads.map((thread) => thread.threadId)))
  }

  function clearSelectedThreads() {
    setBulkSelectedThreadIds(new Set())
  }

  function toggleBulkThreadSelection(threadId: string) {
    setBulkSelectedThreadIds((current) => {
      const next = new Set(current)
      if (next.has(threadId)) {
        next.delete(threadId)
      } else {
        next.add(threadId)
      }
      return next
    })
  }

  async function handleBulkDeleteSelectedThreads() {
    const selectedThreads = threads.filter((thread) => bulkSelectedThreadIds.has(thread.threadId))
    if (selectedThreads.length === 0) {
      return
    }

    try {
      setBulkDeletingThreads(true)
      setActionError(null)
      const result = await threadsService.applyThreadFileAction({
        action: 'trash',
        threads: selectedThreads,
        note: `批量删除 ${selectedThreads.length} 个会话`,
      })
      setActionMessage(result.message)
      setBulkSelectedThreadIds(new Set())
      await reload()
    } catch (bulkDeleteError) {
      setActionError(bulkDeleteError instanceof Error ? bulkDeleteError.message : '批量删除失败')
    } finally {
      setBulkDeletingThreads(false)
    }
  }

  function selectThread(threadId: string) {
    startTransition(() => {
      setSelectedThreadIdOverride(threadId)
      setActionMessage(null)
      setActionError(null)
    })
  }

  function toggleMessage(messageId: string) {
    setExpandedMessageIds((current) => {
      const next = new Set(current)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const handleCopyCommand = useCallback(async () => {
    if (!commandCopyText) {
      return
    }

    try {
      await navigator.clipboard.writeText(commandCopyText)
      setActionMessage('恢复命令已复制。')
      setActionError(null)
    } catch (copyError) {
      setActionError(copyError instanceof Error ? copyError.message : '复制失败')
    }
  }, [commandCopyText])

  const handleCopyProjectPath = useCallback(async () => {
    if (!projectDirectoryPath) {
      return
    }

    try {
      await navigator.clipboard.writeText(projectDirectoryPath)
      setActionMessage('项目路径已复制。')
      setActionError(null)
    } catch (copyError) {
      setActionError(copyError instanceof Error ? copyError.message : '复制失败')
    }
  }, [projectDirectoryPath])

  const handleCopyMessage = useCallback(async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setActionMessage(`${label}消息已复制。`)
      setActionError(null)
    } catch (copyError) {
      setActionError(copyError instanceof Error ? copyError.message : '复制失败')
    }
  }, [])

  const handleRestoreThread = useCallback(async () => {
    if (!currentThread || !currentThread.restoreAvailable) {
      return
    }

    try {
      setRestoring(true)
      setActionError(null)
      const result = await threadsService.openThreadRestoreInTerminal(currentThread, 'Terminal')
      setActionMessage(result.message)
    } catch (restoreError) {
      setActionError(restoreError instanceof Error ? restoreError.message : '恢复失败')
    } finally {
      setRestoring(false)
    }
  }, [currentThread])

  async function handleStartRealtimeTurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentThread) {
      return
    }

    const prompt = realtimePrompt.trim()
    if (!prompt) {
      setActionError('请输入要继续发送的内容。')
      return
    }

    try {
      setStartingRealtimeTurn(true)
      setActionError(null)
      const result = await threadsService.startCodexAppServerTurn({
        threadId: currentThread.threadId,
        prompt,
        cwd: currentThread.projectPath || currentThread.restoreWorkdir || null,
      })
      if (!result.running) {
        setActionError(result.errorMessage ?? '官方事件流暂不可用。')
        return
      }
      setRealtimePrompt('')
      setActionMessage('实时请求已发送，回复会写入当前会话。')
    } catch (turnError) {
      setActionError(turnError instanceof Error ? turnError.message : '实时请求发送失败')
    } finally {
      setStartingRealtimeTurn(false)
    }
  }

  async function handleDeleteThread() {
    if (!currentThread) {
      return
    }

    setDeleteConfirmOpen(true)
  }

  async function confirmDeleteThread() {
    if (!currentThread) {
      setDeleteConfirmOpen(false)
      return
    }

    const action = currentThread.trashed ? 'purge' : 'trash'
    const actionLabel = currentThread.trashed ? '清空' : '删除'

    try {
      setDeleting(true)
      setActionError(null)
      setDeleteConfirmOpen(false)
      const result = await threadsService.applyThreadFileAction({
        action,
        threads: [currentThread],
        note: `${actionLabel}会话 ${currentThread.threadId}`,
      })
      setActionMessage(result.message)
      await reload()
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : '删除失败')
    } finally {
      setDeleting(false)
    }
  }

  function scrollToMessage(messageId: string) {
    const messageIndex = messageIndexById.get(messageId)
    if (typeof messageIndex === 'number') {
      messageVirtualizer.scrollToIndex(messageIndex, { align: 'start', behavior: 'smooth' })
      return
    }

    messageRefs.current[messageId]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  function selectTocMessage(messageId: string) {
    scrollToMessage(messageId)
    setTocDialogOpen(false)
  }

  const toastMessage = actionError || actionMessage

  return (
    <div
      data-testid="thread-page-root"
      data-shadcn-scroll-root="threads"
      className="h-full min-h-0 bg-background/40 text-foreground overflow-y-auto p-4 flex flex-col items-center"
    >
      <ActionToast
        message={toastMessage}
        tone={actionError ? 'error' : 'success'}
        onClose={() => {
          setActionError(null)
          setActionMessage(null)
        }}
      />
      <div
        data-testid="thread-content-shell"
        className="relative mx-auto min-h-0 flex-1 flex w-full max-w-[1680px] gap-3 xl:gap-4 overflow-hidden"
      >
        <ThreadListPanel
          threads={threads}
          visibleThreads={visibleThreads}
          scan={scan}
          loading={loading}
          refreshing={refreshing}
          error={error}
          selectedThreadId={selectedThreadId}
          searchQuery={searchQuery}
          searchInputRef={searchInputRef}
          searchActive={threadListSearchActive}
          batchMode={threadListBatchMode}
          selectedThreadIds={bulkSelectedThreadIds}
          bulkDeleting={bulkDeletingThreads}
          onSearchQueryChange={setSearchQuery}
          onOpenSearch={openThreadSearch}
          onCloseSearch={closeThreadSearch}
          onToggleBatchMode={toggleThreadBatchMode}
          onSelectAllVisibleThreads={selectAllVisibleThreads}
          onClearSelectedThreads={clearSelectedThreads}
          onToggleThreadSelection={toggleBulkThreadSelection}
          onBulkDeleteSelectedThreads={() => {
            void handleBulkDeleteSelectedThreads()
          }}
          onReload={() => {
            void reload()
          }}
          onSelectThread={selectThread}
        />

        <section className="aiotto-motion-card liquid-glass-card relative min-w-0 min-h-0 flex-1 aiotto-radius-card flex flex-col overflow-hidden">
          {currentThread ? (
            <>
              <div className="shrink-0 px-4 py-3">
                <div className="flex flex-col min-[1180px]:flex-row min-[1180px]:items-start min-[1180px]:justify-between gap-3 min-[1180px]:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center aiotto-radius-button border border-border/55 bg-muted/55 text-foreground/85 shadow-inner">
                        <CodexSourceIcon testId="thread-detail-codex-icon" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className={cn('truncate', typography.cardTitle)}>{currentThread.title}</h2>
                        <div className={cn('mt-1 flex flex-wrap items-center gap-x-3 gap-y-1', typography.listMeta)}>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(currentThread.lastUpdatedAt)}
                          </span>
                          {projectDirectoryPath ? (
                            <Tooltip
                              side="bottom"
                              variant="rich"
                              content={
                                <span className="block text-left">
                                  <span className="ui-tooltip-title break-all">{projectDirectoryPath}</span>
                                  <span className="ui-tooltip-description">点击复制路径</span>
                                </span>
                              }
                            >
                              <Button
                                type="button"
                                variant="toolbar"
                                onClick={handleCopyProjectPath}
                                className="h-7 max-w-[220px] gap-1 px-1.5 py-0.5"
                                aria-label="复制项目路径"
                              >
                                <FolderOpen className="h-3 w-3 shrink-0" />
                                <span className="truncate">{projectDirectoryName}</span>
                              </Button>
                            </Tooltip>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="liquid-glass-toolbar flex items-center gap-1.5 shrink-0 aiotto-radius-field p-1.5">
                    <Button
                      type="button"
                      onClick={handleRestoreThread}
                      disabled={!currentThread.restoreAvailable || restoring}
                      className={cn('h-8 px-2.5', typography.controlText)}
                    >
                      {restoring ? (
                        <AnimatedIcon icon={AnimatedLoaderIcon} className="h-3.5 w-3.5" size={14} animate />
                      ) : (
                        <AnimatedIcon icon={AnimatedPlayIcon} className="h-3.5 w-3.5" size={14} />
                      )}
                      恢复会话
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteThread}
                      disabled={deleting}
                      className={cn('h-8 px-2.5', typography.controlText)}
                    >
                      {deleting ? (
                        <AnimatedIcon icon={AnimatedLoaderIcon} className="h-3.5 w-3.5" size={14} animate />
                      ) : (
                        <AnimatedIcon icon={AnimatedTrash2Icon} className="h-3.5 w-3.5" size={14} />
                      )}
                      {currentThread.trashed ? '清空会话' : '删除会话'}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 min-[1360px]:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] gap-2">
                  <div className="liquid-glass-section flex items-center gap-1.5 aiotto-radius-field p-1.5">
                    <code className={cn('min-w-0 flex-1 truncate aiotto-radius-button bg-muted/60 px-2.5 py-1.5', typography.codeSmall)}>
                      {commandText || '暂无恢复命令'}
                    </code>
                    <Tooltip content="复制命令">
                      <Button
                        type="button"
                        variant="tool"
                        size="icon"
                        onClick={handleCopyCommand}
                        disabled={!commandCopyText}
                        className="h-8 w-8"
                        aria-label="复制命令"
                      >
                        <AnimatedIcon icon={AnimatedClipboardIcon} className="h-3.5 w-3.5" size={14} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="刷新详情">
                      <Button
                        type="button"
                        variant="tool"
                        size="icon"
                        onClick={reloadMessages}
                        className="h-8 w-8"
                        aria-label="刷新详情"
                      >
                        <AnimatedIcon icon={AnimatedRefreshIcon} className="h-3.5 w-3.5" size={14} animate={messagesLoading} />
                      </Button>
                    </Tooltip>
                  </div>

                  <form className="flex items-center gap-1.5" onSubmit={handleStartRealtimeTurn}>
                    <Input
                      value={realtimePrompt}
                      onChange={(event) => setRealtimePrompt(event.target.value)}
                      placeholder="通过官方事件流继续这条会话"
                      className={cn('h-8 min-w-0 flex-1 aiotto-radius-button border border-input bg-background/70 px-2.5 outline-none backdrop-blur focus:border-primary/50 focus:ring-2 focus:ring-primary/15', typography.controlText)}
                    />
                    <Button
                      type="submit"
                      variant="soft"
                      disabled={startingRealtimeTurn || !realtimePrompt.trim()}
                      className={cn('h-8 px-2.5', typography.controlText)}
                    >
                      {startingRealtimeTurn ? (
                        <AnimatedIcon icon={AnimatedLoaderIcon} className="h-3.5 w-3.5" size={14} animate />
                      ) : (
                        <AnimatedIcon icon={AnimatedMessageSquareIcon} className="h-3.5 w-3.5" size={14} />
                      )}
                      实时继续
                    </Button>
                  </form>
                </div>

                {messagesError ? (
                  <div
                    className="mt-3 aiotto-radius-button border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    {messagesError}
                  </div>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 flex">
                <div
                  ref={messageScrollerRef}
                  data-shadcn-scroll-panel="threads-detail"
                  className="min-w-0 min-h-0 flex-1 overflow-y-auto px-4 py-3"
                >
                  <div className={cn('liquid-glass-section mb-3 flex items-center gap-2 aiotto-radius-field px-3 py-1.5', typography.listTitle)}>
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>对话记录</span>
                    <span className={cn('aiotto-radius-button bg-muted px-2 py-0.5 text-muted-foreground', typography.badgeText)}>
                      {preparedMessages.length || currentThread.messageCount}
                    </span>
                  </div>

                  {messagesLoading ? (
                    <ThreadDetailLoadingSkeleton />
                  ) : null}

                  {!messagesLoading && preparedMessages.length === 0 ? (
                    <PageState
                      density="compact"
                      kind="empty"
                      title="暂无对话记录"
                      description="当前会话暂时没有可展示的消息。"
                    />
                  ) : null}

                  <div
                    data-testid="thread-message-list"
                    data-aiotto-virtualized="true"
                    style={{
                      height: `${messageVirtualizer.getTotalSize()}px`,
                      position: 'relative',
                    }}
                  >
                    {messageVirtualizer.getVirtualItems().map((virtualMessage) => {
                      const message = preparedMessages[virtualMessage.index]
                      if (!message) {
                        return null
                      }
                      const messageSideClass = message.role === 'user' ? 'ml-auto' : 'mr-auto'
                      const messageRoleLabel = roleLabel(message.role)
                      const messageCopyLabel = message.role === 'user'
                        ? '复制用户消息'
                        : message.role === 'assistant'
                          ? '复制AI消息'
                          : `复制${messageRoleLabel}消息`
                      return (
                        <div
                          key={message.id}
                          data-index={virtualMessage.index}
                          ref={(node) => {
                            messageRefs.current[message.id] = node
                            messageVirtualizer.measureElement(node)
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualMessage.start}px)`,
                          }}
                          className="px-1"
                        >
                          <div
                            data-message-role={message.role}
                            data-message-tone={message.role}
                            className={`aiotto-motion-card liquid-glass-section relative max-w-[88%] aiotto-radius-field px-3 py-2 pr-11 ${messageSideClass} ${messageToneClass(message.role)}`}
                          >
                            <Tooltip content="复制消息" className="absolute right-2 top-2">
                              <Button
                                type="button"
                                variant="tool"
                                size="icon"
                                onClick={() => {
                                  void handleCopyMessage(message.content, messageRoleLabel)
                                }}
                                className="h-7 w-7 border-border/70 bg-background/75"
                                aria-label={messageCopyLabel}
                                data-aiotto-message-copy-position="top-right"
                              >
                                <AnimatedIcon icon={AnimatedClipboardIcon} className="h-3.5 w-3.5" size={14} />
                              </Button>
                            </Tooltip>
                            <div className="mb-1.5 flex items-center justify-between gap-4">
                              <span className={cn(typography.badgeText, roleTextClass(message.role))}>
                                {messageRoleLabel}
                              </span>
                              <span className={cn('shrink-0 pr-1', typography.listMeta)}>{formatEpochTime(message.ts)}</span>
                            </div>
                            <MessageContent
                              id={message.id}
                              content={message.content}
                              expanded={expandedMessageIds.has(message.id)}
                              onToggle={toggleMessage}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <aside
                  data-testid="thread-wide-toc"
                  className="hidden min-[1360px]:flex w-72 2xl:w-80 min-[1800px]:w-[340px] shrink-0 border-l border-border/60 flex-col bg-background/20"
                >
                  <div className={cn('h-10 shrink-0 border-b border-border/60 px-3 flex items-center gap-2 font-medium', typography.listTitle)}>
                    <List className="h-3.5 w-3.5 text-muted-foreground" />
                    对话目录
                  </div>
                  <ThreadTocList items={tocItems} variant="sidebar" onSelect={scrollToMessage} />
                </aside>
              </div>

              {!tocDialogOpen ? (
                <Tooltip content="查看对话目录" className="absolute right-4 bottom-4 z-20">
                  <Button
                    data-testid="thread-floating-toc"
                    type="button"
                    size="icon"
                    onClick={() => setTocDialogOpen(true)}
                    className="h-11 w-11 rounded-full shadow-xl min-[1360px]:!hidden"
                    aria-label="查看对话目录"
                  >
                    <AnimatedIcon icon={AnimatedListIcon} className="h-5 w-5" size={20} />
                  </Button>
                </Tooltip>
              ) : null}

            </>
          ) : (
            <div
              data-shadcn-scroll-panel="threads-detail"
              className="min-h-0 flex-1 overflow-y-auto flex items-center justify-center p-4"
            >
              {loading ? (
                <PageState
                  kind="loading"
                  title="正在加载会话详情"
                  description="正在读取本地 Codex sessions。"
                />
              ) : error ? (
                <PageState
                  kind="error"
                  title="会话读取失败"
                  description={error}
                  actionLabel="重试"
                  onAction={() => void reload()}
                />
              ) : threads.length === 0 ? (
                <PageState
                  kind="empty"
                  title="暂无会话"
                  description="Aiotto 会在读取到 Codex sessions 后显示最近会话。"
                  actionLabel="刷新"
                  onAction={() => void reload()}
                />
              ) : (
                <PageState
                  kind="empty"
                  title="选择会话"
                  description="请选择左侧会话查看详情。"
                />
              )}
            </div>
          )}
        </section>

        {currentThread && tocDialogOpen ? (
          <ThreadTocDialog
            items={tocItems}
            onClose={() => setTocDialogOpen(false)}
            onSelect={selectTocMessage}
          />
        ) : null}
      </div>
      <AlertDialog
        open={deleteConfirmOpen}
        title={currentThread?.trashed ? '清空会话' : '删除会话'}
        description={currentThread ? `确认${currentThread.trashed ? '清空' : '删除'}会话「${currentThread.title}」？此操作会改动本地会话文件。` : ''}
        confirmText={currentThread?.trashed ? '清空会话' : '删除会话'}
        cancelText="取消"
        onConfirm={() => void confirmDeleteThread()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  )
}

function ThreadDetailLoadingSkeleton() {
  const skeletonLineClass = 'aiotto-skeleton-shimmer h-3 aiotto-radius-button bg-muted/70'

  return (
    <div
      aria-label="正在加载详情"
      className="space-y-3 py-2"
      data-testid="thread-detail-loading-skeleton"
      role="status"
    >
      <div
        className="flex justify-center pb-0.5"
        data-aiotto-sync-feedback-anchor="thread-detail-skeleton"
      >
        <SyncActivityPill testId="thread-detail-loading-sync-indicator" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => {
        const isUser = index % 2 === 0

        return (
          <div
            className={cn(
              'aiotto-radius-field border border-border/55 bg-card/45 p-3',
              isUser ? 'ml-auto max-w-[76%]' : 'mr-auto max-w-[82%]',
            )}
            data-testid="thread-detail-loading-bubble"
            key={index}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className={cn(skeletonLineClass, 'w-16')} />
              <div className={cn(skeletonLineClass, 'w-20')} />
            </div>
            <div className="space-y-2">
              <div className={cn(skeletonLineClass, 'w-full')} />
              <div className={cn(skeletonLineClass, 'w-11/12')} />
              <div className={cn(skeletonLineClass, 'w-2/3')} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
