import { useIsFetching } from '@tanstack/react-query'
import type { AiottoRouteDefinition } from './routeTypes'

export function RouteHighIoFeedback({ route }: { route: AiottoRouteDefinition }) {
  const fetchingCount = useIsFetching({
    queryKey: route.highIoQueryKey ?? ['route-feedback', route.id, 'unused'],
  })

  if (!route.highIo || fetchingCount === 0) {
    return null
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-5 top-4 z-20 h-2 w-2 rounded-full bg-primary/75 shadow-[0_0_0_4px_rgba(var(--primary),0.12)]"
      data-testid="route-high-io-feedback"
    />
  )
}
