import {
  createBackupSnapshotForPathsWithFallback,
  listBackupSnapshotsWithSource,
  readBackupLockStateWithSource,
  restoreBackupSnapshotWithFallback,
} from '../domain/backups'

async function createBackup(label?: string) {
  return createBackupSnapshotForPathsWithFallback({
    affectedPaths: ['auth.json', 'config.toml'],
    operationType: 'manual',
    note: label?.trim() || '手动备份。',
    sensitive: true,
  })
}

async function deleteBackup(backupId: string): Promise<never> {
  throw new Error(`删除备份暂不支持：${backupId}`)
}

export const backupService = {
  listBackups: listBackupSnapshotsWithSource,
  readBackupLockState: readBackupLockStateWithSource,
  createBackup,
  restoreBackup: restoreBackupSnapshotWithFallback,
  deleteBackup,
}
