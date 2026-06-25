import type { ThreadRecord } from './models'

export function formatThreadStatus(status: ThreadRecord['status']): string {
  const labels: Record<ThreadRecord['status'], string> = {
    approval: '待确认',
    running: '运行中',
    waiting: '等待',
    failed: '失败',
    completed: '完成',
    idle: '空闲',
    unknown: '未知',
  }

  return labels[status]
}

export function threadActionLabel(thread: ThreadRecord): string {
  if (thread.status === 'waiting') {
    return '继续'
  }
  if (thread.status === 'running') {
    return '打开'
  }
  if (thread.status === 'failed') {
    return '排查'
  }
  if (thread.archived) {
    return '查看'
  }

  return '打开'
}
