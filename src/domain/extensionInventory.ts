import type { ExtensionHealthCheck } from './extensionHealth'
import type { McpServerConfig } from './mcpCatalog'
import type { PromptPreset } from './promptPresets'
import type { SkillDefinition } from './skillsCatalog'

export type ExtensionInventorySourceKind = 'tauri' | 'unavailable'

export type CodexSkillRootStatus = {
  rootPath: string
  status: string
  skillCount: number
  errorMessage: string | null
}

export type CodexExtensionInventory = {
  sourceKind: ExtensionInventorySourceKind
  sourceLabel: string
  codexHome: string
  configPath: string
  configUpdatedAtEpochMs: number | null
  configSizeBytes: number | null
  skillRootStatuses: CodexSkillRootStatus[]
  mcpServers: McpServerConfig[]
  skills: SkillDefinition[]
  prompts: PromptPreset[]
  healthChecks: ExtensionHealthCheck[]
}

type TauriExtensionInventory = Omit<CodexExtensionInventory, 'sourceKind' | 'skillRootStatuses'> & {
  skillRootStatuses?: unknown
}

export const loadingExtensionInventory: CodexExtensionInventory = {
  sourceKind: 'unavailable',
  sourceLabel: '正在读取 Codex extensions...',
  codexHome: '~/.codex',
  configPath: '~/.codex/config.toml',
  configUpdatedAtEpochMs: null,
  configSizeBytes: null,
  skillRootStatuses: [],
  mcpServers: [],
  skills: [],
  prompts: [],
  healthChecks: [],
}

export async function loadCodexExtensionInventoryWithFallback(projectPath?: string): Promise<CodexExtensionInventory> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    const inventory = await invoke<TauriExtensionInventory>('read_codex_extension_inventory', {
      manualPath: null,
      projectPath: projectPath ?? null,
    })

    return {
      sourceKind: 'tauri',
      ...inventory,
      configUpdatedAtEpochMs: inventory.configUpdatedAtEpochMs ?? null,
      configSizeBytes: inventory.configSizeBytes ?? null,
      skillRootStatuses: normalizeSkillRootStatuses(inventory.skillRootStatuses),
    }
  } catch {
    return {
      sourceKind: 'unavailable',
      sourceLabel: '未读取到真实 Codex extensions',
      codexHome: '~/.codex',
      configPath: 'Tauri 不可用或读取失败',
      configUpdatedAtEpochMs: null,
      configSizeBytes: null,
      skillRootStatuses: [],
      mcpServers: [],
      skills: [],
      prompts: [],
      healthChecks: [],
    }
  }
}

function normalizeSkillRootStatuses(value: unknown): CodexSkillRootStatus[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isCodexSkillRootStatus)
}

function isCodexSkillRootStatus(value: unknown): value is CodexSkillRootStatus {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CodexSkillRootStatus>
  return (
    typeof candidate.rootPath === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.skillCount === 'number' &&
    (candidate.errorMessage === null || typeof candidate.errorMessage === 'string')
  )
}
