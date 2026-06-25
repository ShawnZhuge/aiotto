import {
  Activity,
  Archive,
  Boxes,
  Home,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Suspense } from 'react'
import { AiottoRouteSkeleton } from './routeSkeletons'
import { runtimeQueryKeys } from '../runtime/runtimeKeys'
import { RouteRegistryErrorBoundary, RouteRegistryLayout } from './routeShell'
import {
  BackupRoute,
  DashboardRoute,
  McpRoute,
  RuntimeDiagnosticsRoute,
  SettingsRoute,
  SkillsRoute,
  StatisticsRoute,
  ThreadsRoute,
} from './routeComponents'
import type {
  AiottoRouteDefinition,
  AiottoRouteGateContext,
  AiottoRouteGroup,
  AiottoRouteGroupDefinition,
  AiottoRouteId,
  AiottoRouteMeta,
  AiottoRouteRenderContext,
} from './routeTypes'

const routeMetas: AiottoRouteMeta[] = [
  {
    id: 'dashboard',
    group: 'workspace',
    labelKey: 'nav.dashboard',
    fallbackLabel: '仪表盘',
    description: '查看公开版工作区概览。',
    iconKey: 'home',
    skeletonKind: 'dashboard',
  },
  {
    id: 'threads',
    group: 'workspace',
    labelKey: 'nav.threads',
    fallbackLabel: '会话',
    description: '浏览本地会话记录。',
    iconKey: 'message-square',
    skeletonKind: 'list',
  },
  {
    id: 'statistics',
    group: 'workspace',
    labelKey: 'nav.statistics',
    fallbackLabel: '统计',
    description: '聚合本地会话用量。',
    iconKey: 'activity',
    skeletonKind: 'dashboard',
  },
  {
    id: 'skills',
    group: 'resources',
    labelKey: 'nav.skills',
    fallbackLabel: 'Skills',
    description: '查看本地技能清单。',
    iconKey: 'sparkles',
    skeletonKind: 'list',
  },
  {
    id: 'mcp',
    group: 'resources',
    labelKey: 'nav.mcp',
    fallbackLabel: 'MCP',
    description: '查看扩展与连接器状态。',
    iconKey: 'boxes',
    skeletonKind: 'list',
  },
  {
    id: 'backup',
    group: 'system',
    labelKey: 'nav.backup',
    fallbackLabel: '备份中心',
    description: '查看本地备份快照。',
    iconKey: 'archive',
    skeletonKind: 'list',
  },
  {
    id: 'runtime-diagnostics',
    group: 'system',
    labelKey: 'nav.runtimeDiagnostics',
    fallbackLabel: '维护诊断',
    description: '查看运行时事件。',
    iconKey: 'shield-check',
    skeletonKind: 'diagnostics',
  },
  {
    id: 'settings',
    group: 'system',
    labelKey: 'nav.settings',
    fallbackLabel: '设置',
    description: '调整主题与公开版偏好。',
    iconKey: 'settings',
    skeletonKind: 'settings',
  },
]

const iconMap = {
  activity: Activity,
  archive: Archive,
  boxes: Boxes,
  home: Home,
  'message-square': MessageSquare,
  settings: Settings,
  'shield-check': ShieldCheck,
  sparkles: Sparkles,
}

const componentMap = {
  dashboard: DashboardRoute,
  threads: ThreadsRoute,
  statistics: StatisticsRoute,
  skills: SkillsRoute,
  mcp: McpRoute,
  backup: BackupRoute,
  'runtime-diagnostics': RuntimeDiagnosticsRoute,
  settings: SettingsRoute,
}

const loaderMap = {
  dashboard: () => import('../pages/ShadcnDashboard'),
  threads: () => import('../pages/ShadcnThreads'),
  statistics: () => import('../pages/ShadcnUsageStatistics'),
  skills: () => import('../pages/ShadcnExtensions'),
  mcp: () => import('../pages/ShadcnExtensions'),
  backup: () => import('../pages/Backup'),
  'runtime-diagnostics': () => import('../pages/RuntimeDiagnostics'),
  settings: () => import('../pages/ShadcnSettings'),
}

function buildRoute(meta: AiottoRouteMeta): AiottoRouteDefinition {
  const Component = componentMap[meta.id]

  return {
    ...meta,
    meta,
    component: Component,
    icon: iconMap[meta.iconKey as keyof typeof iconMap],
    fillHeight: meta.id === 'threads',
    Layout: RouteRegistryLayout,
    ErrorBoundary: RouteRegistryErrorBoundary,
    navHidden: false,
    highIo: meta.id === 'threads' || meta.id === 'statistics',
    highIoQueryKey: meta.id === 'threads' ? runtimeQueryKeys.threads : runtimeQueryKeys.usageStatistics,
    preload: loaderMap[meta.id],
    render: (context: AiottoRouteRenderContext) => (
      <RouteRegistryErrorBoundary>
        <Suspense fallback={<AiottoRouteSkeleton kind={meta.skeletonKind} />}>
          <Component {...context} />
        </Suspense>
      </RouteRegistryErrorBoundary>
    ),
  }
}

export const aiottoRoutes = routeMetas.map(buildRoute)

export const routeGroups: AiottoRouteGroupDefinition[] = [
  { id: 'workspace', label: '工作区', routes: aiottoRoutes.filter((route) => route.group === 'workspace') },
  { id: 'resources', label: '资源', routes: aiottoRoutes.filter((route) => route.group === 'resources') },
  { id: 'system', label: '系统', routes: aiottoRoutes.filter((route) => route.group === 'system') },
]

export function getVisibleRoutes(context?: AiottoRouteGateContext) {
  const disabled = new Set(context?.disabledRouteIds ?? [])
  return aiottoRoutes.filter((route) => !route.navHidden && !disabled.has(route.id))
}

export function getVisibleRouteGroups(context?: AiottoRouteGateContext) {
  const visible = new Set(getVisibleRoutes(context).map((route) => route.id))
  return routeGroups
    .map((group) => ({
      ...group,
      routes: group.routes.filter((route) => visible.has(route.id)),
    }))
    .filter((group) => group.routes.length > 0)
}

export function getRouteById(routeId: AiottoRouteId) {
  return aiottoRoutes.find((route) => route.id === routeId) ?? aiottoRoutes[0]
}

export function getRouteGroupById(groupId: AiottoRouteGroup) {
  return routeGroups.find((group) => group.id === groupId)
}
