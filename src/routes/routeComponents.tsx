import { lazy } from 'react'
import { routeLoaders } from './routeLoaders'

export const DashboardRoute = lazy(() =>
  routeLoaders.dashboard().then((module) => ({ default: module.ShadcnDashboard })),
)
export const ThreadsRoute = lazy(() =>
  routeLoaders.threads().then((module) => ({ default: module.ShadcnThreads })),
)
export const StatisticsRoute = lazy(() =>
  routeLoaders.statistics().then((module) => ({ default: module.ShadcnUsageStatistics })),
)
export const SkillsRoute = lazy(() =>
  routeLoaders.skills().then((module) => ({ default: module.ShadcnSkills })),
)
export const McpRoute = lazy(() =>
  routeLoaders.mcp().then((module) => ({ default: module.ShadcnMcp })),
)
export const BackupRoute = lazy(() =>
  routeLoaders.backup().then((module) => ({ default: module.Backup })),
)
export const RuntimeDiagnosticsRoute = lazy(() =>
  routeLoaders['runtime-diagnostics']().then((module) => ({ default: module.RuntimeDiagnostics })),
)
export const SettingsRoute = lazy(() =>
  routeLoaders.settings().then((module) => ({ default: module.ShadcnSettings })),
)
