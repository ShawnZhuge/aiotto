export type BackupSettings = {
  backupDirectory: string
  retentionDays: number
  maxStorageMb: number
  keepLockedBackups: boolean
}

export type BackupSettingsRow = {
  id: string
  label: string
  valueLabel: string
  typeLabel: string
}

export type BackupSettingsValidation = {
  ok: boolean
  message: string
}

export const defaultBackupSettings: BackupSettings = {
  backupDirectory: '~/.codex/aiotto-backups',
  retentionDays: 14,
  maxStorageMb: 512,
  keepLockedBackups: true,
}

export function buildBackupSettingsRows(settings: BackupSettings): BackupSettingsRow[] {
  return [
    {
      id: 'backup-directory',
      label: '备份目录',
      valueLabel: settings.backupDirectory,
      typeLabel: '路径',
    },
    {
      id: 'retention-days',
      label: '保留天数',
      valueLabel: `${settings.retentionDays} 天`,
      typeLabel: '时间',
    },
    {
      id: 'max-storage',
      label: '空间上限',
      valueLabel: `${settings.maxStorageMb} MB`,
      typeLabel: '容量',
    },
    {
      id: 'locked-backups',
      label: '锁定备份',
      valueLabel: settings.keepLockedBackups ? '清理时保留' : '按策略清理',
      typeLabel: '保护',
    },
  ]
}

export function validateBackupSettings(settings: BackupSettings): BackupSettingsValidation {
  if (!settings.backupDirectory.startsWith('~') && !settings.backupDirectory.startsWith('/')) {
    return {
      ok: false,
      message: '备份目录必须使用 ~ 或 / 开头的绝对路径。',
    }
  }

  if (settings.retentionDays < 7 || settings.retentionDays > 90) {
    return {
      ok: false,
      message: '备份保留天数需要在 7 到 90 天之间。',
    }
  }

  if (settings.maxStorageMb < 128 || settings.maxStorageMb > 4096) {
    return {
      ok: false,
      message: '备份空间上限需要在 128 到 4096 MB 之间。',
    }
  }

  return {
    ok: true,
    message: '备份设置已保存',
  }
}

export function summarizeBackupSettings(settings: BackupSettings): string {
  return `${settings.backupDirectory} · ${settings.retentionDays} 天 · ${settings.maxStorageMb} MB`
}
