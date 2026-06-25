export const routeLoaders = {
  dashboard: () => import('../pages/ShadcnDashboard'),
  threads: () => import('../pages/ShadcnThreads'),
  statistics: () => import('../pages/ShadcnUsageStatistics'),
  skills: () => import('../pages/ShadcnExtensions'),
  mcp: () => import('../pages/ShadcnExtensions'),
  backup: () => import('../pages/Backup'),
  'runtime-diagnostics': () => import('../pages/RuntimeDiagnostics'),
  settings: () => import('../pages/ShadcnSettings'),
} as const
