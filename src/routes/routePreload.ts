import { getVisibleRoutes } from './routeRegistry'
import type { AiottoRouteGateContext, AiottoRouteId } from './routeTypes'

const preloadedRouteIds = new Set<AiottoRouteId>()

export async function preloadRoute(routeId: AiottoRouteId): Promise<unknown> {
  const route = getVisibleRoutes().find((item) => item.id === routeId)

  if (!route) {
    return undefined
  }

  preloadedRouteIds.add(route.id)
  return route.preload()
}

export async function preloadVisibleRoutes(context?: AiottoRouteGateContext): Promise<PromiseSettledResult<unknown>[]> {
  const routes = getVisibleRoutes(context).filter((route) => !preloadedRouteIds.has(route.id))

  routes.forEach((route) => {
    preloadedRouteIds.add(route.id)
  })

  return Promise.allSettled(routes.map((route) => route.preload()))
}

export function preloadRouteOnIntent(routeId: AiottoRouteId): void {
  void preloadRoute(routeId)
}

export function resetRoutePreloadCacheForTest(): void {
  preloadedRouteIds.clear()
}
