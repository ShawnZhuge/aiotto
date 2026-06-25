import {
  createNotificationDeliveryPlan,
  sanitizeNotificationText,
  type AttentionNotification,
  type NotificationPreferences,
} from './attentionNotifications'

export type SystemNotificationPermissionStatus = 'authorized' | 'denied' | 'not_determined' | 'unsupported' | 'unknown'

export type SystemNotificationPermission = {
  status: SystemNotificationPermissionStatus
  canDeliver: boolean
  label: string
  deliveryMode: 'sandbox' | 'native' | 'native_bridge_missing' | 'unknown'
}

export type SystemNotificationDeliveryResult = {
  inApp: boolean
  systemDelivered: boolean
  statusLabel: '系统已投递' | '系统未授权' | '静音抑制' | '通知关闭' | '应用内' | '投递失败'
  reason: string
}

export type SystemNotificationRequest = {
  id: string
  title: string
  body: string
  targetPage: AttentionNotification['targetPage']
  targetId: string
}

export type SystemNotificationInvoke = (command: string, args?: unknown) => Promise<unknown>

export type SystemNotificationDeps = {
  invoke?: SystemNotificationInvoke
}

export async function getSystemNotificationPermissionWithFallback(
  deps: SystemNotificationDeps = {},
): Promise<SystemNotificationPermission> {
  if (deps.invoke) {
    return normalizeSystemNotificationPermissionResult(await deps.invoke('get_system_notification_permission'))
  }

  if (!hasTauriRuntime()) {
    return normalizeSystemNotificationPermission('unsupported')
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return normalizeSystemNotificationPermissionResult(
      await invoke<SystemNotificationPermission>('get_system_notification_permission'),
    )
  } catch {
    return normalizeSystemNotificationPermission('unknown')
  }
}

export function normalizeSystemNotificationPermission(status: string): SystemNotificationPermission {
  switch (status) {
    case 'authorized':
      return { status: 'authorized', canDeliver: true, label: '系统已授权', deliveryMode: 'sandbox' }
    case 'denied':
      return { status: 'denied', canDeliver: false, label: '系统未授权', deliveryMode: 'sandbox' }
    case 'not_determined':
      return { status: 'not_determined', canDeliver: false, label: '等待授权', deliveryMode: 'sandbox' }
    case 'unsupported':
      return { status: 'unsupported', canDeliver: false, label: '系统不支持', deliveryMode: 'sandbox' }
    case 'native_authorized':
      return { status: 'authorized', canDeliver: false, label: '原生通知桥未接入', deliveryMode: 'native_bridge_missing' }
    default:
      return { status: 'unknown', canDeliver: false, label: '权限未知', deliveryMode: 'unknown' }
  }
}

export function normalizeSystemNotificationPermissionResult(input: unknown): SystemNotificationPermission {
  const partial = input as {
  status?: string | null
  canDeliver?: boolean | null
  label?: string | null
  deliveryMode?: string | null
  }
  const normalized = normalizeSystemNotificationPermission(partial.status ?? 'unknown')
  const deliveryMode =
    partial.deliveryMode === 'native' || partial.deliveryMode === 'native_bridge_missing' || partial.deliveryMode === 'sandbox'
      ? partial.deliveryMode
      : normalized.deliveryMode

  return {
    ...normalized,
    canDeliver: partial.canDeliver ?? normalized.canDeliver,
    label: partial.label ?? normalized.label,
    deliveryMode,
  }
}

export function evaluateSystemNotificationDelivery(input: {
  notification: AttentionNotification
  preferences: NotificationPreferences
  permission: SystemNotificationPermission
  now: Date
  attempted?: boolean
  delivered?: boolean
}): SystemNotificationDeliveryResult {
  const plan = createNotificationDeliveryPlan(input.notification, input.preferences, input.now)

  if (!plan.inApp) {
    return {
      inApp: false,
      systemDelivered: false,
      statusLabel: plan.reason === 'disabled' ? '通知关闭' : '应用内',
      reason: plan.reason,
    }
  }

  if (!plan.system) {
    return {
      inApp: true,
      systemDelivered: false,
      statusLabel: plan.reason === 'quiet_hours' ? '静音抑制' : '应用内',
      reason: plan.reason,
    }
  }

  if (!input.permission.canDeliver) {
    return {
      inApp: true,
      systemDelivered: false,
      statusLabel: '系统未授权',
      reason: input.permission.status,
    }
  }

  if (input.attempted && !input.delivered) {
    return {
      inApp: true,
      systemDelivered: false,
      statusLabel: '投递失败',
      reason: 'delivery_failed',
    }
  }

  return {
    inApp: true,
    systemDelivered: true,
    statusLabel: '系统已投递',
    reason: 'delivered',
  }
}

export function createSystemNotificationRequest(notification: AttentionNotification): SystemNotificationRequest {
  return {
    id: notification.id,
    title: sanitizeNotificationText(notification.title),
    body: sanitizeNotificationText(notification.body),
    targetPage: notification.targetPage,
    targetId: notification.targetId,
  }
}

function hasTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
