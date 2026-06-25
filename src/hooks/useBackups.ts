import { useState, useEffect } from 'react'
import type { BackupSnapshot } from '../domain/backups'
import { backupService } from '../services'

export function useBackups() {
  const [backups, setBackups] = useState<BackupSnapshot[]>([])
  const [lockedSnapshotIds, setLockedSnapshotIds] = useState<string[]>([])
  const [sourceLabel, setSourceLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBackups()
  }, [])

  async function loadBackups() {
    try {
      setLoading(true)
      setError(null)

      const [backupResult, lockResult] = await Promise.all([
        backupService.listBackups(),
        backupService.readBackupLockState(),
      ])

      setBackups(backupResult.snapshots)
      setLockedSnapshotIds(lockResult.state.lockedSnapshotIds)
      setSourceLabel(backupResult.sourceLabel)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载备份失败')
      console.error('Failed to load backups:', err)

      // 失败时使用空数组
      setBackups([])
      setLockedSnapshotIds([])
    } finally {
      setLoading(false)
    }
  }

  async function createBackup(label?: string) {
    try {
      await backupService.createBackup(label)
      await loadBackups()
    } catch (err) {
      console.error('Failed to create backup:', err)
      throw err
    }
  }

  async function restoreBackup(backupId: string) {
    try {
      await backupService.restoreBackup(backupId)
      await loadBackups()
    } catch (err) {
      console.error('Failed to restore backup:', err)
      throw err
    }
  }

  async function deleteBackup(backupId: string) {
    try {
      await backupService.deleteBackup(backupId)
    } catch (err) {
      console.error('Failed to delete backup:', err)
      throw err
    }
  }

  return {
    backups,
    lockedSnapshotIds,
    sourceLabel,
    loading,
    error,
    reload: loadBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
  }
}
