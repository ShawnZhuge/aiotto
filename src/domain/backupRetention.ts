import type { BackupSnapshot } from './backups'

export type BackupRetentionPolicy = {
  retentionDays: number
  maxBytes: number
  lockedSnapshotIds: string[]
}

export type BackupRetentionPlan = {
  totalBytes: number
  maxBytes: number
  overLimitBytes: number
  expiredSnapshotIds: string[]
  cleanupCandidateIds: string[]
  lockedSnapshotIds: string[]
  keptSnapshotIds: string[]
}

const DAY_MS = 24 * 60 * 60 * 1_000

export function createDefaultBackupRetentionPolicy(): BackupRetentionPolicy {
  return {
    retentionDays: 14,
    maxBytes: 512 * 1024 * 1024,
    lockedSnapshotIds: [],
  }
}

export function buildBackupRetentionPlan(
  snapshots: BackupSnapshot[],
  policy: BackupRetentionPolicy,
  now: string = new Date().toISOString(),
): BackupRetentionPlan {
  const lockedSet = new Set(policy.lockedSnapshotIds)
  const snapshotSizes = new Map(snapshots.map((snapshot) => [snapshot.id, calculateSnapshotSize(snapshot)]))
  const totalBytes = Array.from(snapshotSizes.values()).reduce((total, size) => total + size, 0)
  const nowMs = Date.parse(now)
  const cutoffMs = Number.isNaN(nowMs) ? Number.POSITIVE_INFINITY : nowMs - policy.retentionDays * DAY_MS
  const sortedOldestFirst = [...snapshots].sort((left, right) => left.createdAtEpochMs - right.createdAtEpochMs)
  const expiredSnapshotIds = sortedOldestFirst
    .filter((snapshot) => snapshot.createdAtEpochMs < cutoffMs)
    .map((snapshot) => snapshot.id)
  const cleanupCandidateSet = new Set(expiredSnapshotIds.filter((snapshotId) => !lockedSet.has(snapshotId)))
  let retainedBytes = totalBytes - sumSnapshotBytes(cleanupCandidateSet, snapshotSizes)

  if (retainedBytes > policy.maxBytes) {
    for (const snapshot of sortedOldestFirst) {
      if (lockedSet.has(snapshot.id) || cleanupCandidateSet.has(snapshot.id)) {
        continue
      }
      cleanupCandidateSet.add(snapshot.id)
      retainedBytes -= snapshotSizes.get(snapshot.id) ?? 0
      if (retainedBytes <= policy.maxBytes) {
        break
      }
    }
  }

  const cleanupCandidateIds = Array.from(cleanupCandidateSet)
  const keptSnapshotIds = sortedOldestFirst
    .map((snapshot) => snapshot.id)
    .filter((snapshotId) => !cleanupCandidateSet.has(snapshotId))

  return {
    totalBytes,
    maxBytes: policy.maxBytes,
    overLimitBytes: Math.max(0, totalBytes - policy.maxBytes),
    expiredSnapshotIds,
    cleanupCandidateIds,
    lockedSnapshotIds: policy.lockedSnapshotIds.filter((snapshotId) =>
      snapshots.some((snapshot) => snapshot.id === snapshotId),
    ),
    keptSnapshotIds,
  }
}

export function toggleBackupLock(policy: BackupRetentionPolicy, snapshotId: string): BackupRetentionPolicy {
  const lockedSet = new Set(policy.lockedSnapshotIds)
  if (lockedSet.has(snapshotId)) {
    lockedSet.delete(snapshotId)
  } else {
    lockedSet.add(snapshotId)
  }

  return {
    ...policy,
    lockedSnapshotIds: Array.from(lockedSet),
  }
}

export function formatRetentionBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const rounded = Math.round(value * 10) / 10
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${label} ${units[unitIndex]}`
}

function calculateSnapshotSize(snapshot: BackupSnapshot): number {
  return snapshot.copiedFiles
    .filter((file) => !file.missing)
    .reduce((total, file) => total + file.sizeBytes, 0)
}

function sumSnapshotBytes(snapshotIds: Set<string>, snapshotSizes: Map<string, number>): number {
  return Array.from(snapshotIds).reduce((total, snapshotId) => total + (snapshotSizes.get(snapshotId) ?? 0), 0)
}
