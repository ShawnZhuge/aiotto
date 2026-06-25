import { invoke as tauriInvoke } from '@tauri-apps/api/core'

export type CodexKeyFileCandidate = {
  path: string
  relativePath: string
  category: string
  kind: 'file' | 'directory' | 'missing' | string
  exists: boolean
  sizeBytes: number
  modifiedAtEpochMs: number | null
  riskLevel: 'Safe' | 'Caution' | 'Dangerous' | 'Active' | 'Unknown' | string
  protected: boolean
  recommendedAction: string
}

export type CodexKeyFileScan = {
  codexHome: string
  totalSizeBytes: number
  existingCount: number
  missingCount: number
  candidates: CodexKeyFileCandidate[]
}

export type CodexHomeScanSourceKind = 'tauri' | 'unavailable'

export type CodexHomeScanResult = {
  sourceKind: CodexHomeScanSourceKind
  sourceLabel: string
  scan: CodexKeyFileScan
}

export type EnvConflictRecord = {
  variableName: string
  maskedValue: string
  source: 'process' | 'shell_profile' | string
  sourcePath: string
  riskLevel: 'Safe' | 'Caution' | 'Dangerous' | 'Active' | 'Unknown' | string
  impact: string
  recommendedAction: string
}

export type EnvConflictScan = {
  conflictCount: number
  scannedShellFiles: string[]
  conflicts: EnvConflictRecord[]
}

export type CliCommandCheck = {
  command: string
  available: boolean
  status: string
  suggestion: string
}

export type CodexCliStatus = {
  command: 'codex' | string
  installed: boolean
  version: string
  path: string
  status: 'ok' | 'missing' | 'unreadable' | 'error' | string
  suggestion: string
  checkedCommands: CliCommandCheck[]
}

function createUnavailableCodexKeyFileScan(codexHome = '未读取到真实 Codex Home'): CodexKeyFileScan {
  return {
    codexHome,
    totalSizeBytes: 0,
    existingCount: 0,
    missingCount: 0,
    candidates: [],
  }
}

const emptyEnvConflictScan: EnvConflictScan = {
  conflictCount: 0,
  scannedShellFiles: [],
  conflicts: [],
}

const unavailableCodexCliStatus: CodexCliStatus = {
  command: 'codex',
  installed: false,
  version: '未知',
  path: '未读取到真实 Codex CLI',
  status: 'error',
  suggestion: '需要桌面版 Tauri command 才能读取真实 Codex CLI 状态。',
  checkedCommands: [],
}

export async function scanCodexHomeWithFallback(manualPath?: string): Promise<CodexKeyFileScan> {
  return (await scanCodexHomeWithSource(manualPath)).scan
}

export async function scanCodexHomeWithSource(manualPath?: string): Promise<CodexHomeScanResult> {
  try {
    const scan = await tauriInvoke<CodexKeyFileScan>('scan_codex_home', {
      manualPath: manualPath ?? null,
    })

    return {
      sourceKind: 'tauri',
      sourceLabel: '真实 Codex Home',
      scan,
    }
  } catch {
    return {
      sourceKind: 'unavailable',
      sourceLabel: '未读取到真实 Codex Home',
      scan: createUnavailableCodexKeyFileScan(manualPath?.trim() || undefined),
    }
  }
}

export async function scanEnvConflictsWithFallback(): Promise<EnvConflictScan> {
  try {
    return await scanEnvConflictsFromRuntime()
  } catch {
    return emptyEnvConflictScan
  }
}

export async function checkCodexCliStatusWithFallback(): Promise<CodexCliStatus> {
  try {
    return await checkCodexCliStatusFromRuntime()
  } catch {
    return unavailableCodexCliStatus
  }
}

export async function scanEnvConflictsFromRuntime(): Promise<EnvConflictScan> {
  return await tauriInvoke<EnvConflictScan>('scan_codex_env_conflicts')
}

export async function checkCodexCliStatusFromRuntime(): Promise<CodexCliStatus> {
  return await tauriInvoke<CodexCliStatus>('check_codex_cli_status')
}

export function formatBytes(bytes: number): string {
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
