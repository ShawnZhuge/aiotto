export type ExtensionHealthStatus = 'healthy' | 'attention' | 'protected' | 'missing' | 'broken'

export type ExtensionHealthCheck = {
  id: string
  name: string
  pathExists: boolean
  parseState: 'passed' | 'external_modified' | 'skipped' | 'failed'
  disabledReason: string | null
  recommendation: string
  status: ExtensionHealthStatus
}

export type ExtensionHealthRow = {
  id: string
  name: string
  checkIdLabel: string
  statusLabel: string
  statusTone: 'success' | 'warning' | 'info' | 'danger'
  pathLabel: string
  parseLabel: string
  disabledReasonLabel: string
  issueImpactLabel: string
  recommendation: string
  countsAsIssue: boolean
}

export function buildExtensionHealthRows(checks: ExtensionHealthCheck[]): ExtensionHealthRow[] {
  return checks.map((check) => ({
    id: check.id,
    name: check.name,
    checkIdLabel: `ID：${check.id}`,
    statusLabel: statusLabel(check.status),
    statusTone: statusTone(check.status),
    pathLabel: check.pathExists ? '路径存在' : '路径不存在',
    parseLabel: parseLabel(check.parseState),
    disabledReasonLabel: check.disabledReason ?? '无',
    issueImpactLabel: countsAsIssue(check.status) ? '计入问题数' : '不计入问题数',
    recommendation: check.recommendation,
    countsAsIssue: countsAsIssue(check.status),
  }))
}

function countsAsIssue(status: ExtensionHealthStatus): boolean {
  return status === 'attention' || status === 'missing' || status === 'broken'
}

function statusLabel(status: ExtensionHealthStatus): string {
  switch (status) {
    case 'healthy':
      return '健康'
    case 'attention':
      return '需关注'
    case 'protected':
      return '已保护'
    case 'missing':
      return '未配置'
    case 'broken':
      return '需修复'
  }
}

function statusTone(status: ExtensionHealthStatus): ExtensionHealthRow['statusTone'] {
  switch (status) {
    case 'healthy':
      return 'success'
    case 'attention':
    case 'missing':
      return 'warning'
    case 'protected':
      return 'info'
    case 'broken':
      return 'danger'
  }
}

function parseLabel(parseState: ExtensionHealthCheck['parseState']): string {
  switch (parseState) {
    case 'passed':
      return '解析通过'
    case 'external_modified':
      return '检测到外部修改'
    case 'skipped':
      return '未解析'
    case 'failed':
      return '解析失败'
  }
}
