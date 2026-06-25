import type { QueryClient, QueryKey } from '@tanstack/react-query'
import { runtimeModuleRootKey, type AiottoRuntimeModuleId } from './runtimeKeys'

export type AiottoRuntimeEventType =
  | 'bootstrap:seed'
  | 'module:reload'
  | 'module:mutation'
  | 'watcher:attached'
  | 'watcher:error'
  | 'notification:delivered'

export type AiottoRuntimeEventSource =
  | 'runtime'
  | 'threads'
  | 'usage'
  | 'notifications'
  | 'settings'

export type AiottoRuntimeEventCategory = 'bootstrap' | 'query' | 'watcher' | 'mutation' | 'sync' | 'diagnostic'

export type AiottoRuntimeEventStatus = 'queued' | 'running' | 'success' | 'warning' | 'error'

export type AiottoRuntimeEvent = {
  type: AiottoRuntimeEventType
  moduleId?: AiottoRuntimeModuleId
  mode?: 'full' | 'active-only'
  sequence: number
  receivedAt: number
  source?: AiottoRuntimeEventSource
  category?: AiottoRuntimeEventCategory
  status?: AiottoRuntimeEventStatus
  summary?: string
  redactedPayload?: Record<string, unknown>
}

export type RuntimeEventCursor = {
  receivedAt: number
  sequence: number
}

export type RuntimeEventListener = (event: AiottoRuntimeEvent) => void

const listeners = new Set<RuntimeEventListener>()

export const RUNTIME_EVENT_CURSOR_KEY = (moduleId: AiottoRuntimeModuleId | 'bootstrap') =>
  ['runtime', 'event-cursor', moduleId] as const

export function subscribeRuntimeEvent(listener: RuntimeEventListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitRuntimeEvent(event: AiottoRuntimeEvent) {
  listeners.forEach((listener) => listener(event))
}

export function applyRuntimeEventToQueryCache(queryClient: QueryClient, event: AiottoRuntimeEvent) {
  const moduleId = event.moduleId ?? 'bootstrap'
  const cursorKey = RUNTIME_EVENT_CURSOR_KEY(moduleId)
  const current = queryClient.getQueryData<RuntimeEventCursor>(cursorKey)
  if (current && event.sequence <= current.sequence) {
    return false
  }

  queryClient.setQueryData<RuntimeEventCursor>(cursorKey, {
    receivedAt: event.receivedAt,
    sequence: event.sequence,
  })

  if (event.type !== 'bootstrap:seed' && event.moduleId) {
    void queryClient.invalidateQueries({
      queryKey: runtimeModuleRootKey(event.moduleId) as QueryKey,
      type: event.mode === 'active-only' ? 'active' : 'all',
    })
  }

  return true
}
