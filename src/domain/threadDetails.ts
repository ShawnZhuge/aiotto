import type { ThreadRecord } from './models'

export type ThreadRestoreDetail = {
  available: boolean
  label: '恢复可用' | '不可恢复'
  reason: string
  command: string
  workdir: string
  copyText: string
}

export function createThreadRestoreDetail(thread: ThreadRecord): ThreadRestoreDetail {
  if (!thread.restoreAvailable || !thread.restoreCommand || !thread.restoreWorkdir) {
    return {
      available: false,
      label: '不可恢复',
      reason: '缺少项目路径或恢复命令，暂时只能查看摘要索引。',
      command: '',
      workdir: '',
      copyText: '',
    }
  }

  return {
    available: true,
    label: '恢复可用',
    reason: '可在项目目录执行恢复命令继续会话。',
    command: thread.restoreCommand,
    workdir: thread.restoreWorkdir,
    copyText: `cd ${thread.restoreWorkdir} && ${thread.restoreCommand}`,
  }
}
