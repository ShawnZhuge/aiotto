export type PrivacySecuritySettings = {
  maskSensitiveFields: boolean
  requireExportConfirmation: boolean
  operationLogRetentionDays: number
  requireDangerConfirmation: boolean
  dangerConfirmationPhrase: string
}

export type PrivacySecurityRow = {
  id: string
  label: string
  valueLabel: string
  typeLabel: string
}

export type PrivacySecurityValidation = {
  ok: boolean
  message: string
}

export const defaultPrivacySecuritySettings: PrivacySecuritySettings = {
  maskSensitiveFields: true,
  requireExportConfirmation: true,
  operationLogRetentionDays: 30,
  requireDangerConfirmation: true,
  dangerConfirmationPhrase: 'Aiotto',
}

export function buildPrivacySecurityRows(settings: PrivacySecuritySettings): PrivacySecurityRow[] {
  return [
    {
      id: 'mask-sensitive-fields',
      label: '敏感字段脱敏',
      valueLabel: settings.maskSensitiveFields ? '开启' : '关闭',
      typeLabel: '展示保护',
    },
    {
      id: 'export-confirmation',
      label: '导出前确认',
      valueLabel: settings.requireExportConfirmation ? '需要确认' : '直接导出',
      typeLabel: '导出保护',
    },
    {
      id: 'operation-log-retention',
      label: '日志保留',
      valueLabel: `${settings.operationLogRetentionDays} 天`,
      typeLabel: '日志策略',
    },
    {
      id: 'danger-confirmation',
      label: '危险操作确认',
      valueLabel: settings.requireDangerConfirmation ? '二次确认' : '普通确认',
      typeLabel: '危险操作',
    },
  ]
}

export function validatePrivacySecuritySettings(settings: PrivacySecuritySettings): PrivacySecurityValidation {
  if (settings.operationLogRetentionDays < 7 || settings.operationLogRetentionDays > 180) {
    return {
      ok: false,
      message: '日志保留至少需要 7 天，最多 180 天。',
    }
  }

  if (settings.requireDangerConfirmation && settings.dangerConfirmationPhrase.trim().length === 0) {
    return {
      ok: false,
      message: '开启危险操作二次确认时，需要设置确认短语。',
    }
  }

  return {
    ok: true,
    message: '隐私设置已保存',
  }
}

export function summarizePrivacySecuritySettings(settings: PrivacySecuritySettings): string {
  const maskLabel = settings.maskSensitiveFields ? '脱敏开启' : '脱敏关闭'
  const exportLabel = settings.requireExportConfirmation ? '导出需确认' : '导出直接执行'

  return `${maskLabel} · ${exportLabel} · 日志保留 ${settings.operationLogRetentionDays} 天`
}
