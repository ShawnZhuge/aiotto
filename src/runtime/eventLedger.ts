import type { AiottoRuntimeEvent, AiottoRuntimeEventSource, AiottoRuntimeEventStatus } from './events'

export type RuntimeEventSummary = {
  source: AiottoRuntimeEventSource | string
  total: number
  errorCount: number
  warningCount: number
  latestStatus: AiottoRuntimeEventStatus | 'unknown'
}

export type RuntimeEventLedger = {
  record: (event: AiottoRuntimeEvent) => boolean
  getEvents: () => AiottoRuntimeEvent[]
  clear: () => void
}

const sensitiveKeyPattern = /(authorization|cookie|token|refresh|secret|snapshot)/i
const sensitiveValuePatterns = [
  /Bearer\s+[A-Za-z0-9._-]+/gi,
  /\/Users\/[^\s]+/g,
]

function eventSource(event: AiottoRuntimeEvent): string {
  return event.source ?? event.moduleId ?? event.type
}

function sortEvents(events: AiottoRuntimeEvent[]) {
  return [...events].sort((left, right) => {
    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence
    }
    return left.receivedAt - right.receivedAt
  })
}

function redactString(value: string): string {
  return sensitiveValuePatterns.reduce((current, pattern) => current.replace(pattern, '[redacted]'), value)
}

export function redactRuntimePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (sensitiveKeyPattern.test(key)) {
        return [key, '[redacted]']
      }

      if (Array.isArray(value)) {
        return [
          key,
          value.map((item) =>
            item && typeof item === 'object' && !Array.isArray(item)
              ? redactRuntimePayload(item as Record<string, unknown>)
              : typeof item === 'string'
                ? redactString(item)
                : item,
          ),
        ]
      }

      if (value && typeof value === 'object') {
        return [key, redactRuntimePayload(value as Record<string, unknown>)]
      }

      if (typeof value === 'string') {
        return [key, redactString(value)]
      }

      return [key, value]
    }),
  )
}

export function createRuntimeEventLedger(options: { maxEvents?: number } = {}): RuntimeEventLedger {
  const maxEvents = options.maxEvents ?? 200
  let events: AiottoRuntimeEvent[] = []
  let seen = new Set<string>()

  function rebuildSeen(nextEvents: AiottoRuntimeEvent[]) {
    seen = new Set(nextEvents.map((event) => `${eventSource(event)}:${event.sequence}`))
  }

  return {
    record(event) {
      const key = `${eventSource(event)}:${event.sequence}`
      if (seen.has(key)) {
        return false
      }

      const nextEvent = event.redactedPayload
        ? {
            ...event,
            redactedPayload: redactRuntimePayload(event.redactedPayload),
          }
        : event
      const sorted = sortEvents([...events, nextEvent])
      events = sorted.slice(Math.max(0, sorted.length - maxEvents))
      rebuildSeen(events)
      return true
    },
    getEvents() {
      return sortEvents(events)
    },
    clear() {
      events = []
      seen.clear()
    },
  }
}

export const defaultRuntimeEventLedger = createRuntimeEventLedger()

export function summarizeRuntimeEvents(events: AiottoRuntimeEvent[]): RuntimeEventSummary[] {
  const grouped = new Map<string, AiottoRuntimeEvent[]>()

  events.forEach((event) => {
    const source = eventSource(event)
    grouped.set(source, [...(grouped.get(source) ?? []), event])
  })

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([source, sourceEvents]) => {
      const ordered = sortEvents(sourceEvents)
      const latest = ordered[ordered.length - 1]
      return {
        source,
        total: sourceEvents.length,
        errorCount: sourceEvents.filter((event) => event.status === 'error').length,
        warningCount: sourceEvents.filter((event) => event.status === 'warning').length,
        latestStatus: latest?.status ?? 'unknown',
      }
    })
}
