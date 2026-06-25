export type SkillSource = 'user' | 'project' | 'bundled'

export type SkillStatus = 'available' | 'needs_update' | 'disabled'

export type SkillDefinition = {
  id: string
  name: string
  source: SkillSource
  path: string
  status: SkillStatus
  description: string
  sizeBytes?: number | null
  updatedAtEpochMs?: number | null
}

export type SkillsCatalogRow = {
  id: string
  name: string
  sourceLabel: string
  pathLabel: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'info'
  description: string
  fileMetadataLabel: string
  readonlyNotice: string
}

export function buildSkillsCatalogRows(skills: SkillDefinition[]): SkillsCatalogRow[] {
  return [...skills]
    .map((skill) => ({
      id: skill.id,
      name: skill.name,
      sourceLabel: sourceLabel(skill.source),
      pathLabel: skill.path,
      statusLabel: statusLabel(skill.status),
      statusTone: statusTone(skill.status),
      description: skill.description,
      fileMetadataLabel: formatSkillFileMetadata(skill.sizeBytes ?? null, skill.updatedAtEpochMs ?? null),
      readonlyNotice: '只读展示，不安装、不删除、不修改 Skills。',
    }))
}

function formatSkillFileMetadata(sizeBytes: number | null, updatedAtEpochMs: number | null): string {
  return `SKILL.md：${formatSkillBytes(sizeBytes)} · 更新时间 ${formatSkillEpochMs(updatedAtEpochMs)}`
}

function formatSkillBytes(bytes: number | null): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return '--'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

function formatSkillEpochMs(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return 'Unknown'
  }

  return new Date(value).toISOString().replace('T', ' ').replace(/\+.*$/, '')
}

function sourceLabel(source: SkillSource): string {
  switch (source) {
    case 'project':
      return '项目技能'
    case 'bundled':
      return '内置技能'
    default:
      return '用户技能'
  }
}

function statusLabel(status: SkillStatus): string {
  switch (status) {
    case 'needs_update':
      return '需更新'
    case 'disabled':
      return '停用'
    default:
      return '可用'
  }
}

function statusTone(status: SkillStatus): SkillsCatalogRow['statusTone'] {
  switch (status) {
    case 'needs_update':
      return 'warning'
    case 'disabled':
      return 'info'
    default:
      return 'success'
  }
}
