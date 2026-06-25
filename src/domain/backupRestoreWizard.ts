import type { BackupFileRecord, BackupSnapshot, RestoreBackupResult } from './backups'
import { formatBackupSize } from './backupHistory'

export type RestoreWizardPhase = 'review' | 'executing' | 'done'

export type RestoreWizardStepStatus = 'done' | 'active' | 'pending'

export type RestoreWizardStep = {
  id: string
  label: string
  status: RestoreWizardStepStatus
}

export type RestoreWizardDiffRow = {
  originalPath: string
  originalPathLabel: string
  backupPath: string
  backupPathLabel: string
  sizeBytesLabel: string
  sizeLabel: string
  hash: string
  hashLabel: string
  missingValueLabel: string
  status: 'will_restore' | 'missing_backup'
  statusLabel: string
}

export type BackupRestoreWizardPlan = {
  snapshotId: string
  operationType: string
  operationTypeLabel: string
  manifestPath: string
  manifestPathLabel: string
  sensitive: boolean
  sensitiveValueLabel: string
  steps: RestoreWizardStep[]
  diffRows: RestoreWizardDiffRow[]
  preRestoreBackupRequired: boolean
  preRestoreBackupRequiredLabel: string
  safetyMessage: string
}

export type RestoreResultSummary = {
  title: string
  snapshotIdLine: string
  statusLine: string
  backupLine: string
  preRestoreBackupIdLine: string
  pathsLine: string
  restoredPathsLine: string
  logLine: string
  restoreLogPathLine: string
  noteLine: string
}

const RESTORE_STEP_LABELS = [
  '选择备份',
  '显示差异',
  '恢复前备份当前状态',
  '执行恢复',
  '结果摘要',
]

export function buildBackupRestoreWizardPlan(
  snapshot: BackupSnapshot,
  phase: RestoreWizardPhase = 'review',
): BackupRestoreWizardPlan {
  return {
    snapshotId: snapshot.id,
    operationType: snapshot.operationType,
    operationTypeLabel: `操作类型：${snapshot.operationType}`,
    manifestPath: snapshot.manifestPath,
    manifestPathLabel: `Manifest 路径：${snapshot.manifestPath}`,
    sensitive: snapshot.sensitive,
    sensitiveValueLabel: `敏感标记：${snapshot.sensitive}`,
    steps: createRestoreWizardSteps(phase),
    diffRows: snapshot.copiedFiles.map(createDiffRow),
    preRestoreBackupRequired: true,
    preRestoreBackupRequiredLabel: '恢复前备份要求：true',
    safetyMessage: '恢复前会先备份当前状态；如果恢复失败，Aiotto 会保留恢复前备份和恢复日志。',
  }
}

export function createRestoreWizardSteps(phase: RestoreWizardPhase): RestoreWizardStep[] {
  const activeIndex = phase === 'review' ? 1 : phase === 'executing' ? 3 : 4

  return RESTORE_STEP_LABELS.map((label, index) => ({
    id: `restore-step-${index + 1}`,
    label,
    status: index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending',
  }))
}

export function buildRestoreResultSummary(result: RestoreBackupResult): RestoreResultSummary {
  return {
    title: `已恢复 ${result.snapshotId}`,
    snapshotIdLine: `恢复快照 ID：${result.snapshotId}`,
    statusLine: `恢复状态：${result.status}`,
    backupLine: `恢复前备份：${result.preRestoreBackupId}`,
    preRestoreBackupIdLine: `恢复前备份 ID：${result.preRestoreBackupId}`,
    pathsLine: `已恢复 ${result.restoredPaths.length} 个路径：${result.restoredPaths.join(', ')}`,
    restoredPathsLine: `恢复路径：${result.restoredPaths.length > 0 ? result.restoredPaths.join('、') : '无'}`,
    logLine: `日志：${result.logPath}`,
    restoreLogPathLine: `恢复日志路径：${result.logPath}`,
    noteLine: `备注：${result.note}`,
  }
}

function createDiffRow(file: BackupFileRecord): RestoreWizardDiffRow {
  return {
    originalPath: file.originalPath,
    originalPathLabel: `原始路径：${file.originalPath}`,
    backupPath: file.backupPath,
    backupPathLabel: `备份路径：${file.backupPath}`,
    sizeBytesLabel: `文件大小字节：${file.sizeBytes}`,
    sizeLabel: `文件大小：${formatBackupSize(file.sizeBytes)}`,
    hash: file.hash,
    hashLabel: `文件 Hash：${file.hash}`,
    missingValueLabel: `缺失标记：${file.missing}`,
    status: file.missing ? 'missing_backup' : 'will_restore',
    statusLabel: file.missing ? '备份副本缺失' : '将恢复',
  }
}
