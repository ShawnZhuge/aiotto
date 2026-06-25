export type PromptPresetScope = 'project' | 'user'

export type PromptPreset = {
  id: string
  name: string
  scope: PromptPresetScope
  targetPath: string
  description: string
  contentPreview: string
  content?: string
  sizeBytes?: number | null
  updatedAtEpochMs?: number | null
}

export type PromptPresetRow = {
  id: string
  name: string
  scopeLabel: string
  targetPath: string
  activeLabel: string
  activeTone: 'success' | 'info'
  description: string
  contentPreview: string
  fileMetadataLabel: string
}

export type PromptPresetApplyPlan = {
  presetId: string
  presetName: string
  targetPath: string
  affectedPaths: string[]
  requiresBackup: true
  backupOperationType: 'prompt_preset_apply'
  confirmationTitle: string
  message: string
}

export type PromptBackfillDiffRow = {
  line: number
  expected: string
  current: string
}

export type PromptBackfillProtection = {
  status: 'clean' | 'modified'
  statusLabel: string
  presetName: string
  targetPath: string
  canSwitchPreset: boolean
  addedLines: number
  removedLines: number
  diffRows: PromptBackfillDiffRow[]
  message: string
  primaryActionLabel: string
  secondaryActionLabel: string
}

export function buildPromptPresetRows(
  presets: PromptPreset[],
  activePresetId: string | null,
): PromptPresetRow[] {
  return presets.map((preset) => {
    const active = preset.id === activePresetId

    return {
      id: preset.id,
      name: preset.name,
      scopeLabel: preset.scope === 'project' ? '项目级' : '用户级',
      targetPath: preset.targetPath,
      activeLabel: active ? '当前启用' : '可启用',
      activeTone: active ? 'success' : 'info',
      description: preset.description,
      contentPreview: preset.contentPreview,
      fileMetadataLabel: formatPromptFileMetadata(preset.sizeBytes ?? null, preset.updatedAtEpochMs ?? null),
    }
  })
}

function formatPromptFileMetadata(sizeBytes: number | null, updatedAtEpochMs: number | null): string {
  return `文件：${formatPromptBytes(sizeBytes)} · 更新时间 ${formatPromptEpochMs(updatedAtEpochMs)}`
}

function formatPromptBytes(bytes: number | null): string {
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

function formatPromptEpochMs(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return 'Unknown'
  }

  return new Date(value).toISOString().replace('T', ' ').replace(/\+.*$/, '')
}

export function createPromptPresetApplyPlan(preset: PromptPreset): PromptPresetApplyPlan {
  return {
    presetId: preset.id,
    presetName: preset.name,
    targetPath: preset.targetPath,
    affectedPaths: [preset.targetPath],
    requiresBackup: true,
    backupOperationType: 'prompt_preset_apply',
    confirmationTitle: `启用${preset.name}`,
    message: `启用 ${preset.name} 会在写入 ${preset.targetPath} 前创建写入前备份。`,
  }
}

export function inspectPromptBackfillProtection({
  preset,
  currentContent,
}: {
  preset: PromptPreset
  currentContent: string
}): PromptBackfillProtection {
  const expectedLines = splitPromptLines(preset.content ?? preset.contentPreview)
  const currentLines = splitPromptLines(currentContent)
  const maxLines = Math.max(expectedLines.length, currentLines.length)
  const diffRows: PromptBackfillDiffRow[] = []

  for (let index = 0; index < maxLines; index += 1) {
    const expected = expectedLines[index] ?? ''
    const current = currentLines[index] ?? ''

    if (expected !== current) {
      diffRows.push({
        line: index + 1,
        expected,
        current,
      })
    }
  }

  const addedLines = Math.max(0, currentLines.length - expectedLines.length)
  const removedLines = Math.max(0, expectedLines.length - currentLines.length)
  const modified = diffRows.length > 0

  return {
    status: modified ? 'modified' : 'clean',
    statusLabel: modified ? '检测到外部修改' : '可安全切换',
    presetName: preset.name,
    targetPath: preset.targetPath,
    canSwitchPreset: !modified,
    addedLines,
    removedLines,
    diffRows,
    message: modified ? '不会覆盖用户手改，请先回填到当前预设或放弃切换。' : '当前文件仍与预设一致，切换前会继续创建备份。',
    primaryActionLabel: '回填到当前预设',
    secondaryActionLabel: '放弃切换',
  }
}

function splitPromptLines(content: string): string[] {
  return content.length === 0 ? [] : content.split(/\r?\n/)
}

export async function inspectPromptBackfillWithFallback(preset: PromptPreset): Promise<PromptBackfillProtection> {
  const expectedContent = preset.content ?? preset.contentPreview

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<PromptBackfillProtection>('inspect_prompt_backfill', {
      request: {
        targetPath: preset.targetPath,
        expectedContent,
        presetName: preset.name,
      },
    })
  } catch {
    return inspectPromptBackfillProtection({
      preset: {
        ...preset,
        content: expectedContent,
      },
      currentContent: expectedContent,
    })
  }
}
