export type NotificationSettings = {
  enabled: boolean
  quietHoursEnabled: boolean
  fiveHourAlertThresholds: number[]
  weeklyAlertThresholds: number[]
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  quietHoursEnabled: true,
  fiveHourAlertThresholds: [20],
  weeklyAlertThresholds: [15],
}

export type NotificationSettingsValidation = {
  ok: boolean
  message: string
}

export function normalizeNotificationThresholds(thresholds: number[] | undefined): number[] {
  return Array.from(
    new Set((thresholds ?? []).filter((threshold) => Number.isFinite(threshold) && threshold > 0 && threshold < 100).map(Math.round)),
  ).sort((left, right) => left - right)
}

export function normalizeNotificationSettings(settings: Partial<NotificationSettings> | undefined): NotificationSettings {
  return {
    enabled: settings?.enabled ?? defaultNotificationSettings.enabled,
    quietHoursEnabled: settings?.quietHoursEnabled ?? defaultNotificationSettings.quietHoursEnabled,
    fiveHourAlertThresholds: normalizeNotificationThresholds(
      settings?.fiveHourAlertThresholds ?? defaultNotificationSettings.fiveHourAlertThresholds,
    ),
    weeklyAlertThresholds: normalizeNotificationThresholds(
      settings?.weeklyAlertThresholds ?? defaultNotificationSettings.weeklyAlertThresholds,
    ),
  }
}

export function validateNotificationSettings(settings: NotificationSettings): NotificationSettingsValidation {
  const fiveHourThresholds = normalizeNotificationThresholds(settings.fiveHourAlertThresholds)
  const weeklyThresholds = normalizeNotificationThresholds(settings.weeklyAlertThresholds)

  if (fiveHourThresholds.length === 0 || weeklyThresholds.length === 0) {
    return {
      ok: false,
      message: '5 小时和每周提醒阈值至少各保留 1 个。',
    }
  }

  return {
    ok: true,
    message: '通知设置可保存。',
  }
}
