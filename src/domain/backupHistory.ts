import type { BackupSnapshot } from './backups'

export type BackupHistoryFileRow = {
  originalPath: string
  originalPathLabel: string
  backupPath: string
  backupPathLabel: string
  sizeBytes: number
  sizeBytesLabel: string
  sizeLabel: string
  hash: string
  hashLabel: string
  missing: boolean
  missingValueLabel: string
  statusLabel: string
}

export type BackupHistoryRow = {
  id: string
  operationType: string
  operationTypeLabel: string
  affectedPathsLabel: string
  sensitive: boolean
  sensitiveLabel: string
  sensitiveValueLabel: string
  beforeHash: string
  afterHash: string
  beforeHashLabel: string
  afterHashLabel: string
  note: string
  noteLabel: string
  backupRoot: string
  manifestPath: string
  manifestPathLabel: string
  fileCount: number
  fileCountLabel: string
  sizeBytes: number
  sizeBytesLabel: string
  sizeLabel: string
  createdAtEpochMs: number
  createdAtEpochMsLabel: string
  createdAtLabel: string
  copiedFiles: BackupHistoryFileRow[]
}

export function buildBackupHistoryRows(snapshots: BackupSnapshot[]): BackupHistoryRow[] {
  return [...snapshots]
    .sort((left, right) => right.createdAtEpochMs - left.createdAtEpochMs)
    .map((snapshot) => {
      const sizeBytes = snapshot.copiedFiles
        .filter((file) => !file.missing)
        .reduce((total, file) => total + file.sizeBytes, 0)

      return {
        id: snapshot.id,
        operationType: snapshot.operationType,
        operationTypeLabel: `操作类型：${snapshot.operationType}`,
        affectedPathsLabel: formatAffectedPaths(snapshot.affectedPaths),
        sensitive: snapshot.sensitive,
        sensitiveLabel: snapshot.sensitive ? '敏感' : '普通',
        sensitiveValueLabel: `敏感标记：${snapshot.sensitive}`,
        beforeHash: snapshot.beforeHash,
        afterHash: snapshot.afterHash,
        beforeHashLabel: `变更前 Hash：${snapshot.beforeHash}`,
        afterHashLabel: `变更后 Hash：${snapshot.afterHash}`,
        note: snapshot.note,
        noteLabel: formatNote(snapshot.note),
        backupRoot: snapshot.backupRoot,
        manifestPath: snapshot.manifestPath,
        manifestPathLabel: `Manifest 路径：${snapshot.manifestPath}`,
        fileCount: snapshot.copiedFiles.length,
        fileCountLabel: `文件数量：${snapshot.copiedFiles.length}`,
        sizeBytes,
        sizeBytesLabel: `总大小字节：${sizeBytes}`,
        sizeLabel: formatBackupSize(sizeBytes),
        createdAtEpochMs: snapshot.createdAtEpochMs,
        createdAtEpochMsLabel: `创建时间戳：${snapshot.createdAtEpochMs}`,
        createdAtLabel: formatBackupCreatedAt(snapshot.createdAtEpochMs),
        copiedFiles: snapshot.copiedFiles.map((file) => ({
          originalPath: file.originalPath,
          originalPathLabel: `原始路径：${file.originalPath}`,
          backupPath: file.backupPath,
          backupPathLabel: `备份路径：${file.backupPath}`,
          sizeBytes: file.sizeBytes,
          sizeBytesLabel: `文件大小字节：${file.sizeBytes}`,
          sizeLabel: `文件大小：${formatBackupSize(file.sizeBytes)}`,
          hash: file.hash,
          hashLabel: `文件 Hash：${file.hash}`,
          missing: file.missing,
          missingValueLabel: `缺失标记：${file.missing}`,
          statusLabel: file.missing ? '原文件缺失' : '已复制',
        })),
      }
    })
}

function formatNote(note: string): string {
  const trimmed = note.trim()
  return `备注：${trimmed.length > 0 ? trimmed : '无'}`
}

function formatAffectedPaths(paths: string[]): string {
  if (paths.length === 0) {
    return '影响路径：无'
  }

  return `影响路径：${paths.join('、')}`
}

export function formatBackupSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`
  }

  const kilobytes = bytes / 1024
  if (kilobytes < 1024) {
    return `${formatCompactNumber(kilobytes)} KB`
  }

  return `${formatCompactNumber(kilobytes / 1024)} MB`
}

function formatBackupCreatedAt(epochMs: number): string {
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) {
    return '未知时间'
  }

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'

  return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}`
}

function formatCompactNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
