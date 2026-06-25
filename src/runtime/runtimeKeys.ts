export type AiottoRuntimeModuleId =
  | 'threads'
  | 'usage-statistics'
  | 'settings'

export const runtimeQueryKeys = {
  threads: ['runtime', 'threads'] as const,
  usageStatistics: ['runtime', 'usage-statistics'] as const,
  settings: ['runtime', 'settings'] as const,
}

export function runtimeModuleRootKey(moduleId: AiottoRuntimeModuleId) {
  switch (moduleId) {
    case 'threads':
      return runtimeQueryKeys.threads
    case 'usage-statistics':
      return runtimeQueryKeys.usageStatistics
    case 'settings':
      return runtimeQueryKeys.settings
  }
}
