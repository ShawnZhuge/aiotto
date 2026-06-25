import { PageErrorBoundary } from '../components/page/PageErrorBoundary'
import type { AiottoRouteShellProps } from './routeTypes'

export function RouteRegistryLayout({ children }: AiottoRouteShellProps) {
  return <>{children}</>
}

export function RouteRegistryErrorBoundary({ children }: AiottoRouteShellProps) {
  return <PageErrorBoundary>{children}</PageErrorBoundary>
}
