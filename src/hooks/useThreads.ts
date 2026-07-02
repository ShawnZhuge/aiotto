import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CodexSessionMessage } from '../domain/threadIndexer'
import { runtimeQueryKeys } from '../runtime/runtimeKeys'
import {
  emptyThreadScan,
  loadThreadsRuntimeSnapshot,
  type ThreadsRuntimeSnapshot,
} from '../runtime/threadsRuntime'
import { threadsService } from '../services'

const SESSION_MESSAGE_STALE_MS = 30_000

function threadMessagesQueryKey(sourcePath: string) {
  return [...runtimeQueryKeys.threads, 'messages', sourcePath] as const
}

export function useThreads() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: runtimeQueryKeys.threads,
    queryFn: () => loadThreadsRuntimeSnapshot(),
  })

  useEffect(() => {
    let cancelled = false
    let unlisten: (() => void) | null = null

    async function subscribeToRealtimeEvents() {
      try {
        unlisten = await threadsService.listenToRealtimeEvents((event) => {
          queryClient.setQueryData<ThreadsRuntimeSnapshot>(runtimeQueryKeys.threads, (current) => {
            if (!current) {
              return current
            }

            return {
              ...current,
              threads: threadsService.applyRealtimeEventToThreads(current.threads, event),
            }
          })
        })
        if (cancelled) {
          unlisten()
        }
      } catch (err) {
        console.debug('[Aiotto][threads] realtime-subscribe-failed', {
          error: err instanceof Error ? err.message : String(err),
        })
      }
    }

    void subscribeToRealtimeEvents()

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [queryClient])

  const snapshot = query.data ?? {
    threads: [],
    scan: emptyThreadScan,
  }

  async function reload() {
    await query.refetch()
  }

  return {
    threads: snapshot.threads,
    scan: snapshot.scan,
    loading: query.isPending,
    refreshing: query.isFetching,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    reload,
  }
}

export function useSessionMessages(sourcePath: string | null | undefined) {
  const normalizedSourcePath = sourcePath?.trim() ?? ''
  const enabled = normalizedSourcePath.length > 0
  const query = useQuery<CodexSessionMessage[]>({
    queryKey: threadMessagesQueryKey(normalizedSourcePath),
    queryFn: () => threadsService.getSessionMessages(normalizedSourcePath),
    enabled,
    staleTime: SESSION_MESSAGE_STALE_MS,
  })

  function reload() {
    if (enabled) {
      void query.refetch()
    }
  }

  return {
    messages: query.data ?? [],
    loading: enabled && query.isPending,
    refreshing: enabled && query.isFetching && !query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? String(query.error) : null,
    reload,
  }
}
