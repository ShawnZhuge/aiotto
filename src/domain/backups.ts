import { invoke } from '@tauri-apps/api/core'

export type BackupFileRecord = {
  originalPath: string
  backupPath: string
  sizeBytes: number
  hash: string
  missing: boolean
}

export type BackupSnapshot = {
  id: string
  createdAtEpochMs: number
  operationType: string
  affectedPaths: string[]
  sensitive: boolean
  beforeHash: string
  afterHash: string
  note: string
  backupRoot: string
  manifestPath: string
  copiedFiles: BackupFileRecord[]
}

export type BackupSnapshotListResult = {
  snapshots: BackupSnapshot[]
  sourceKind: 'tauri' | 'local-preview'
  sourceLabel: string
  backupRoot: string | null
  backupRootExists: boolean | null
  backupRootUpdatedAtEpochMs: number | null
  manifestCount: number | null
  invalidManifestCount: number | null
  invalidManifestPaths: string[]
  invalidManifestDetails: InvalidBackupManifest[]
}

export type InvalidBackupManifest = {
  path: string
  errorMessage: string
}

export type BackupLockState = {
  schemaVersion: number
  lockedSnapshotIds: string[]
  statePath: string
  updatedAtEpochMs: number
}

export type BackupLockStateResult = {
  state: BackupLockState
  sourceKind: 'tauri' | 'local-preview'
  sourceLabel: string
}

export type RestoreBackupResult = {
  snapshotId: string
  preRestoreBackupId: string
  status: 'restored' | string
  restoredPaths: string[]
  logPath: string
  note: string
}

export type SafeArchiveResult = {
  archiveId: string
  backupId: string
  status: 'archived' | string
  codexRunningSuspected: boolean
  archivedPaths: string[]
  skippedPaths: Array<{ relativePath: string; reason: string; detail: string }>
  archiveRoot: string
  logPath: string
  note: string
}

const LOCK_STATE_STORAGE_KEY = 'aiotto.community.backupLockState.v1'

const readLocalLockState = (): BackupLockState => {
  const fallback = {
    schemaVersion: 1,
    lockedSnapshotIds: [],
    statePath: 'localStorage:aiotto.community.backupLockState.v1',
    updatedAtEpochMs: 0,
  }

  if (typeof localStorage === 'undefined') return fallback

  try {
    const raw = localStorage.getItem(LOCK_STATE_STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as BackupLockState
    return {
      schemaVersion: 1,
      lockedSnapshotIds: Array.isArray(parsed.lockedSnapshotIds) ? parsed.lockedSnapshotIds : [],
      statePath: fallback.statePath,
      updatedAtEpochMs: Number(parsed.updatedAtEpochMs) || 0,
    }
  } catch {
    return fallback
  }
}

const saveLocalLockState = (state: BackupLockState) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(LOCK_STATE_STORAGE_KEY, JSON.stringify(state))
}

export const createBackupSnapshotForPathsWithFallback = async (
  input: {
    affectedPaths: string[]
    operationType: string
    note: string
    sensitive: boolean
  },
): Promise<BackupSnapshot> => {
  return invoke<BackupSnapshot>('create_backup_snapshot', {
    request: {
      manualPath: null,
      affectedPaths: input.affectedPaths,
      operationType: input.operationType,
      note: input.note,
      sensitive: input.sensitive,
    },
  })
}

export const listBackupSnapshotsWithSource = async (): Promise<BackupSnapshotListResult> => {
  try {
    const result = await invoke<
      | BackupSnapshot[]
      | {
          snapshots?: BackupSnapshot[]
          sourceLabel?: string
          backupRoot?: string | null
          backupRootExists?: boolean | null
          backupRootUpdatedAtEpochMs?: number | null
          manifestCount?: number | null
          invalidManifestCount?: number | null
          invalidManifestPaths?: string[]
          invalidManifestDetails?: InvalidBackupManifest[]
        }
    >('list_backup_snapshots', { manualPath: null })
    const snapshots = Array.isArray(result) ? result : result.snapshots ?? []

    return {
      snapshots,
      sourceKind: 'tauri',
      sourceLabel: Array.isArray(result) ? '真实备份历史' : result.sourceLabel || '真实备份历史',
      backupRoot: Array.isArray(result) ? snapshots[0]?.backupRoot ?? null : result.backupRoot ?? null,
      backupRootExists: Array.isArray(result) ? null : result.backupRootExists ?? null,
      backupRootUpdatedAtEpochMs: Array.isArray(result) ? null : result.backupRootUpdatedAtEpochMs ?? null,
      manifestCount: Array.isArray(result) ? null : result.manifestCount ?? null,
      invalidManifestCount: Array.isArray(result) ? null : result.invalidManifestCount ?? null,
      invalidManifestPaths: Array.isArray(result) ? [] : result.invalidManifestPaths ?? [],
      invalidManifestDetails: Array.isArray(result) ? [] : result.invalidManifestDetails ?? [],
    }
  } catch {
    return {
      snapshots: [],
      sourceKind: 'local-preview',
      sourceLabel: '本地预览',
      backupRoot: null,
      backupRootExists: null,
      backupRootUpdatedAtEpochMs: null,
      manifestCount: null,
      invalidManifestCount: null,
      invalidManifestPaths: [],
      invalidManifestDetails: [],
    }
  }
}

export const readBackupLockStateWithSource = async (): Promise<BackupLockStateResult> => {
  try {
    const state = await invoke<BackupLockState>('read_backup_lock_state', { manualPath: null })
    return { sourceKind: 'tauri', sourceLabel: '真实锁定状态', state }
  } catch {
    return { sourceKind: 'local-preview', sourceLabel: '本地预览', state: readLocalLockState() }
  }
}

export const saveBackupLockStateWithFallback = async (
  lockedSnapshotIds: string[],
): Promise<BackupLockStateResult> => {
  const state = {
    ...readLocalLockState(),
    lockedSnapshotIds,
    updatedAtEpochMs: Date.now(),
  }

  try {
    const savedState = await invoke<BackupLockState>('save_backup_lock_state', {
      request: {
        manualPath: null,
        lockedSnapshotIds,
      },
    })
    return { sourceKind: 'tauri', sourceLabel: '真实锁定状态', state: savedState }
  } catch {
    saveLocalLockState(state)
    return { sourceKind: 'local-preview', sourceLabel: '本地预览', state }
  }
}

export const restoreBackupSnapshotWithFallback = async (
  snapshotId: string,
): Promise<RestoreBackupResult> => {
  return invoke<RestoreBackupResult>('restore_backup_snapshot', {
    request: {
      manualPath: null,
      snapshotId,
      note: '从备份历史恢复。',
    },
  })
}

export const createSafeArchiveWithFallback = async (
  paths: string[],
): Promise<SafeArchiveResult> => {
  return invoke<SafeArchiveResult>('create_safe_archive', {
    request: {
      manualPath: null,
      affectedPaths: paths,
      note: '安全归档。',
    },
  })
}
