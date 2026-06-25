import type { ComponentType, Dispatch, LazyExoticComponent, ReactNode, SetStateAction } from 'react'
import type { LucideIcon } from 'lucide-react'

export type AiottoRouteId =
  | 'dashboard'
  | 'threads'
  | 'statistics'
  | 'skills'
  | 'mcp'
  | 'backup'
  | 'runtime-diagnostics'
  | 'settings'

export type AiottoRouteGroup = 'workspace' | 'resources' | 'system'

export type AiottoRouteGate = {
  enabled: boolean
  reason?: string
}

export type AiottoRouteGateContext = {
  disabledRouteIds?: readonly AiottoRouteId[]
  runtimeDiagnosticsEnabled?: boolean
}

export type AiottoRouteMeta = {
  id: AiottoRouteId
  group: AiottoRouteGroup
  labelKey: string
  fallbackLabel: string
  description: string
  iconKey: string
  skeletonKind: 'dashboard' | 'list' | 'settings' | 'diagnostics'
}

export type AiottoColorMode = 'light' | 'dark'
export type AiottoAccentTheme = 'periwinkle' | 'teal' | 'indigo' | 'rose'

export type AiottoRouteRenderContext = {
  colorMode: AiottoColorMode
  onOpenRuntimeDiagnostics: () => void
  setColorMode: Dispatch<SetStateAction<AiottoColorMode>>
  setTheme: Dispatch<SetStateAction<AiottoAccentTheme>>
  theme: AiottoAccentTheme
  toggleLanguage: () => void
}

export type AiottoRouteShellProps = {
  children: ReactNode
}

export type AiottoRouteComponent =
  | ComponentType<Record<string, unknown>>
  | LazyExoticComponent<ComponentType<Record<string, unknown>>>

export type AiottoRouteDefinition = AiottoRouteMeta & {
  meta: AiottoRouteMeta
  icon: LucideIcon
  component: AiottoRouteComponent
  fillHeight: boolean
  Layout: ComponentType<AiottoRouteShellProps>
  ErrorBoundary: ComponentType<AiottoRouteShellProps>
  gate?: (context?: AiottoRouteGateContext) => AiottoRouteGate
  navHidden: boolean
  highIo: boolean
  highIoQueryKey?: readonly unknown[]
  preload: () => Promise<unknown>
  render: (context: AiottoRouteRenderContext) => ReactNode
}

export type AiottoRouteGroupDefinition = {
  id: AiottoRouteGroup
  label: string
  routes: AiottoRouteDefinition[]
}
