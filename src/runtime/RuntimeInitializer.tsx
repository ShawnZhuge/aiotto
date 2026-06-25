import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { defaultRuntimeEventLedger } from './eventLedger'
import { applyRuntimeEventToQueryCache, emitRuntimeEvent, subscribeRuntimeEvent, type AiottoRuntimeEvent } from './events'

let runtimeSequence = 0

function nextRuntimeEvent(event: Omit<AiottoRuntimeEvent, 'sequence' | 'receivedAt'>): AiottoRuntimeEvent {
  runtimeSequence += 1
  return {
    ...event,
    sequence: runtimeSequence,
    receivedAt: Date.now(),
  }
}

export function RuntimeInitializer() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const unlisten = subscribeRuntimeEvent((event) => {
      defaultRuntimeEventLedger.record(event)
      applyRuntimeEventToQueryCache(queryClient, event)
    })

    createRuntimeStartupEvents().forEach((event) => {
      emitRuntimeEvent(nextRuntimeEvent(event))
    })

    return unlisten
  }, [queryClient])

  return null
}

function createRuntimeStartupEvents(): Array<Omit<AiottoRuntimeEvent, 'sequence' | 'receivedAt'>> {
  return [
    {
      type: 'bootstrap:seed',
      source: 'runtime',
      category: 'bootstrap',
      status: 'running',
      summary: 'Community runtime initializer mounted.',
      redactedPayload: {
        phase: 'initializer-mounted',
      },
    },
    {
      type: 'bootstrap:seed',
      source: 'runtime',
      category: 'bootstrap',
      status: 'success',
      summary: 'Runtime query cache initialized.',
      redactedPayload: {
        cache: 'tanstack-query',
      },
    },
    {
      type: 'module:reload',
      moduleId: 'threads',
      source: 'threads',
      category: 'query',
      status: 'queued',
      summary: 'Threads runtime registered.',
      redactedPayload: {
        queryKey: 'runtime.threads',
      },
    },
    {
      type: 'module:reload',
      moduleId: 'usage-statistics',
      source: 'usage',
      category: 'query',
      status: 'queued',
      summary: 'Usage statistics runtime registered.',
      redactedPayload: {
        queryKey: 'runtime.usage-statistics',
      },
    },
    {
      type: 'watcher:attached',
      source: 'runtime',
      category: 'watcher',
      status: 'success',
      summary: 'Runtime event watcher attached.',
      redactedPayload: {
        watcher: 'runtime-event-query-cache',
      },
    },
  ]
}
