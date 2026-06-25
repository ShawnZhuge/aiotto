import type { ThreadRecord } from './models'
import { createThreadMarkdownExport } from './threadActions'

export type WorkbenchToolContext = {
  recentThread: ThreadRecord | null
  projectPath: string
  projectMemoryPath: string
  hasRealSessions: boolean
}

export type WorkbenchTool = {
  id: string
  label: string
  targetPage: string
  actionLabel: string
  requiresBackup: boolean
  description: string
  resultTitle: string
  resultDetail: string
  sourceLabel: string
  sourceDetail: string
  disabled: boolean
  disabledReason: string | null
  injectsOfficialUi: false
}

export type WorkbenchToolRow = WorkbenchTool & {
  boundaryLabel: '独立工作台'
  requiresBackupLabel: '写入前备份' | '无需备份'
  safetyTone: 'warning' | 'info'
}

export function buildWorkbenchToolRows(context: WorkbenchToolContext): WorkbenchToolRow[] {
  return buildWorkbenchTools(context).map((tool) => ({
    ...tool,
    boundaryLabel: '独立工作台',
    requiresBackupLabel: tool.requiresBackup ? '写入前备份' : '无需备份',
    safetyTone: tool.requiresBackup ? 'warning' : 'info',
  }))
}

function buildWorkbenchTools({
  recentThread,
  projectPath,
  projectMemoryPath,
  hasRealSessions,
}: WorkbenchToolContext): WorkbenchTool[] {
  const threadAvailable = Boolean(recentThread?.restoreAvailable)
  const threadUnavailableReason = hasRealSessions ? '真实 sessions 中暂无可恢复线程' : '未读取到真实 Codex sessions'
  const threadSourceLabel = threadAvailable ? '真实 Codex sessions' : '等待真实 sessions'
  const restoreCommand = recentThread ? formatRestoreCommand(recentThread) : threadUnavailableReason
  const threadExport = recentThread ? createThreadMarkdownExport(recentThread) : null
  const projectLabel = projectPath.trim() || '未设置项目路径'

  return [
    {
      id: 'copy-resume-command',
      label: '复制恢复命令',
      targetPage: '线程管理',
      actionLabel: '复制',
      requiresBackup: false,
      description: threadAvailable ? `复制最近真实线程 ${recentThread?.threadId} 的恢复命令。` : threadUnavailableReason,
      resultTitle: threadAvailable ? '已复制恢复命令' : '未读取到真实线程',
      resultDetail: restoreCommand,
      sourceLabel: threadSourceLabel,
      sourceDetail: recentThread?.threadId ?? threadUnavailableReason,
      disabled: !threadAvailable,
      disabledReason: threadAvailable ? null : threadUnavailableReason,
      injectsOfficialUi: false,
    },
    {
      id: 'open-project',
      label: '打开项目',
      targetPage: '线程管理',
      actionLabel: '打开',
      requiresBackup: false,
      description: '打开当前项目路径，不修改 Codex 配置。',
      resultTitle: '已准备打开项目',
      resultDetail: projectLabel,
      sourceLabel: '当前项目路径',
      sourceDetail: projectLabel,
      disabled: projectLabel === '未设置项目路径',
      disabledReason: projectLabel === '未设置项目路径' ? '未设置项目路径' : null,
      injectsOfficialUi: false,
    },
    {
      id: 'export-thread',
      label: '导出线程',
      targetPage: '线程管理',
      actionLabel: '导出',
      requiresBackup: false,
      description: threadExport ? `导出最近真实线程 ${recentThread?.threadId} 的 Markdown 摘要。` : threadUnavailableReason,
      resultTitle: threadExport ? '线程 Markdown 已复制' : '未读取到真实线程',
      resultDetail: threadExport?.fileName ?? threadUnavailableReason,
      sourceLabel: threadSourceLabel,
      sourceDetail: recentThread?.threadId ?? threadUnavailableReason,
      disabled: !threadExport,
      disabledReason: threadExport ? null : threadUnavailableReason,
      injectsOfficialUi: false,
    },
    {
      id: 'archive-thread',
      label: '归档线程',
      targetPage: '线程管理',
      actionLabel: '归档',
      requiresBackup: true,
      description: recentThread ? `到线程页确认归档 ${recentThread.threadId}，归档前创建备份。` : threadUnavailableReason,
      resultTitle: recentThread ? '已定位真实线程' : '未读取到真实线程',
      resultDetail: recentThread?.sourceFile ?? threadUnavailableReason,
      sourceLabel: threadSourceLabel,
      sourceDetail: recentThread?.sourceFile ?? threadUnavailableReason,
      disabled: !recentThread,
      disabledReason: recentThread ? null : threadUnavailableReason,
      injectsOfficialUi: false,
    },
    {
      id: 'generate-project-memory',
      label: '生成 PROJECT.md',
      targetPage: '扩展管理',
      actionLabel: '生成',
      requiresBackup: true,
      description: '复用 PROJECT.md 项目记忆写入路径，写入前创建备份。',
      resultTitle: '已触发 PROJECT.md 生成',
      resultDetail: projectMemoryPath,
      sourceLabel: '当前项目路径',
      sourceDetail: projectMemoryPath,
      disabled: projectLabel === '未设置项目路径',
      disabledReason: projectLabel === '未设置项目路径' ? '未设置项目路径' : null,
      injectsOfficialUi: false,
    },
  ]
}

function formatRestoreCommand(thread: ThreadRecord): string {
  if (!thread.restoreAvailable) {
    return '不可恢复'
  }

  return `cd ${thread.restoreWorkdir} && ${thread.restoreCommand}`
}
