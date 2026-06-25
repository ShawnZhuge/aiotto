export type McpHealth = 'healthy' | 'needs_config' | 'command_missing' | 'unknown'

export type McpServerConfig = {
  id: string
  name: string
  enabled: boolean
  command: string
  args: string[]
  configPath: string
  scope: 'user' | 'project'
  health: McpHealth
}

export type McpCatalogRow = {
  id: string
  name: string
  serverIdLabel: string
  commandLabel: string
  enabledLabel: string
  configPathLabel: string
  scopeLabel: string
  healthLabel: string
  healthTone: 'success' | 'warning' | 'info'
  readonlyNotice: string
}

export function buildMcpCatalogRows(servers: McpServerConfig[]): McpCatalogRow[] {
  return [...servers]
    .sort((left, right) => Number(right.enabled) - Number(left.enabled) || left.name.localeCompare(right.name))
    .map((server) => ({
      id: server.id,
      name: server.name,
      serverIdLabel: `ID：${server.id}`,
      commandLabel: formatCommand(server),
      enabledLabel: server.enabled ? '启用' : '暂停',
      configPathLabel: server.configPath,
      scopeLabel: server.scope === 'user' ? '用户级' : '项目级',
      healthLabel: healthLabel(server.health),
      healthTone: healthTone(server.health),
      readonlyNotice: '只读展示，不修改 MCP 配置。',
    }))
}

function formatCommand(server: McpServerConfig): string {
  return [server.command, ...server.args].join(' ')
}

function healthLabel(health: McpHealth): string {
  switch (health) {
    case 'healthy':
      return '健康'
    case 'needs_config':
      return '未配置'
    case 'command_missing':
      return '命令缺失'
    default:
      return '未知'
  }
}

function healthTone(health: McpHealth): McpCatalogRow['healthTone'] {
  switch (health) {
    case 'healthy':
      return 'success'
    case 'needs_config':
    case 'command_missing':
      return 'warning'
    default:
      return 'info'
  }
}
