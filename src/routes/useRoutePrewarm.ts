import { useEffect } from 'react'
import { preloadVisibleRoutes } from './routePreload'
import type { AiottoRouteGateContext } from './routeTypes'

const ROUTE_PREWARM_DELAY_MS = 900

export function useRoutePrewarm(context?: AiottoRouteGateContext) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void preloadVisibleRoutes(context)
    }, ROUTE_PREWARM_DELAY_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [context])
}
