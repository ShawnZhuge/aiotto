import { useIsFetching } from '@tanstack/react-query'
import { SyncActivityPill } from '../components/states'
import type { AiottoRouteDefinition } from './routeTypes'

export function RouteHighIoFeedback({
  route,
  enabled = true,
}: {
  route: AiottoRouteDefinition
  enabled?: boolean
}) {
  const fetchingCount = useIsFetching({
    queryKey: route.highIoQueryKey ?? ['route-feedback', route.id, 'unused'],
  })

  if (!enabled || !route.highIo || fetchingCount === 0) {
    return null
  }

  return (
    <div
      aria-label={`${route.fallbackLabel} 正在同步`}
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-3 z-20 px-4"
      data-aiotto-feedback-placement="overlay"
      data-testid="route-high-io-feedback"
      role="status"
    >
      <div className="mx-auto flex w-full max-w-7xl justify-center">
        <SyncActivityPill />
      </div>
    </div>
  )
}
