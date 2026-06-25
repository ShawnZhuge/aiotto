import { indexCodexSessionSources, normalizeCodexSessionSourceScanResult } from './threadIndexer'

export type ProjectMemoryStatus = {
  projectPath: string
  projectMdPath: string
  exists: boolean
  sizeBytes: number
  lastUpdatedAtEpochMs: number | null
  recommendedAction: string
}

export type ProjectMemoryTemplateResult = {
  status: 'written' | string
  projectPath: string
  projectMdPath: string
  backupId: string
  backupPath: string
  backupManifestPath: string
  bytesWritten: number
  projectMdUpdatedAtEpochMs?: number | null
  note: string
}

export const defaultProjectMemoryPath = '~/Projects/AIOtto'

export const projectMemoryTemplateFields = [
  '项目目标',
  '技术栈',
  '目录结构',
  '架构决策',
  '不要改的边界',
  '已废弃方案',
  '常见 bug',
  '当前优先级',
  '最近重要线程',
]

type TauriInvoke = <T>(command: string, args?: unknown) => Promise<T>

type ProjectMemoryTauriDeps = {
  invoke?: TauriInvoke
}

export async function inspectProjectMemoryWithFallback(projectPath: string): Promise<ProjectMemoryStatus> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return await invoke<ProjectMemoryStatus>('inspect_project_memory', {
      request: {
        projectPath,
      },
    })
  } catch {
    throw new Error('需要桌面版 Tauri command 才能检测真实 PROJECT.md；浏览器预览不判断文件是否存在。')
  }
}

export async function writeProjectMemoryTemplateWithFallback(
  projectPath: string,
  deps: ProjectMemoryTauriDeps = {},
): Promise<ProjectMemoryTemplateResult> {
  const invoke = deps.invoke ?? (await importTauriInvoke())
  const recentThreadSummary = await readRecentThreadSummaryForProject(projectPath, invoke)

  return await invoke<ProjectMemoryTemplateResult>('write_project_memory_template', {
    request: {
      projectPath,
      recentThreadSummary,
    },
  })
}

async function importTauriInvoke(): Promise<TauriInvoke> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke as TauriInvoke
}

async function readRecentThreadSummaryForProject(
  projectPath: string,
  invoke: TauriInvoke,
): Promise<string | undefined> {
  try {
    const scan = normalizeCodexSessionSourceScanResult(await invoke<unknown>('scan_codex_sessions', {
      manualPath: null,
    }))
    const threads = indexCodexSessionSources(scan.sources)
    const normalizedProjectPath = normalizeProjectPath(projectPath)
    const thread =
      threads.find((item) => normalizeProjectPath(item.projectPath) === normalizedProjectPath) ?? threads[0]

    if (!thread) {
      return undefined
    }

    const summary = thread.summary && thread.summary !== thread.title ? ` / ${thread.summary}` : ''
    return `${thread.threadId}: ${thread.title}${summary}`
  } catch {
    return undefined
  }
}

function normalizeProjectPath(path: string): string {
  return path.trim().replace(/\/+$/g, '')
}
