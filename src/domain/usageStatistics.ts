export type UsageStatisticsRange = 'today' | '1d' | '7d' | '14d' | '30d' | 'custom'
export type UsageStatisticsSourceFilter = 'all' | 'codex' | 'cache'

export type UsageStatisticsSummary = {
  totalRequests: number
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUsd: string
  successRate: number
  cacheHitRate: number
  distinctSessionCount: number
}

export type UsageStatisticsTrendPoint = {
  date: string
  label: string
  requestCount: number
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalCostUsd: string
}

export type UsageStatisticsProviderRow = {
  providerId: string
  providerName: string
  requestCount: number
  totalTokens: number
  totalCostUsd: string
  successRate: number
  avgLatencyMs: number
  shareRatio: number
}

export type UsageStatisticsModelRow = {
  model: string
  requestCount: number
  totalTokens: number
  totalCostUsd: string
  avgCostPerRequestUsd: string
  shareRatio: number
}

export type UsageStatisticsRequestLogRow = {
  requestId: string
  providerId: string
  providerName: string
  appType: string
  model: string
  requestModel: string
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
  totalTokens: number
  totalCostUsd: string
  latencyMs: number
  statusCode: number
  errorMessage: string | null
  sessionId: string | null
  createdAt: number
  dataSource: string
}

export type UsageStatisticsRequestLogPage = {
  total: number
  page: number
  pageSize: number
  rows: UsageStatisticsRequestLogRow[]
}

export type UsageStatisticsFilterOption = {
  value: string
  label: string
  requestCount: number
}

export type UsageStatisticsSyncMeta = {
  imported: number
  skipped: number
  filesScanned: number
}

export type UsageStatisticsDashboardSnapshot = {
  sourceLabel: string
  databasePath: string | null
  summary: UsageStatisticsSummary
  trendPoints: UsageStatisticsTrendPoint[]
  providerRows: UsageStatisticsProviderRow[]
  modelRows: UsageStatisticsModelRow[]
  requestLogPage: UsageStatisticsRequestLogPage
  availableProviderOptions: UsageStatisticsFilterOption[]
  availableModelOptions: UsageStatisticsFilterOption[]
  sync: UsageStatisticsSyncMeta
}

export type ReadUsageStatisticsDashboardInput = {
  manualPath?: string
  range: UsageStatisticsRange
  startDate?: number | null
  endDate?: number | null
  sourceFilter: UsageStatisticsSourceFilter
  providerId?: string | null
  model?: string | null
  page?: number
  pageSize?: number
  now?: Date
}

export type UsagePricingModelSource = 'request' | 'response'

export type UsagePricingDefaultRow = {
  appId: 'claude' | 'codex' | 'gemini'
  appLabel: string
  multiplier: string
  modelSource: UsagePricingModelSource
}

export type UsageModelPricingRow = {
  modelId: string
  displayName: string
  inputCostPerMillion: string
  outputCostPerMillion: string
  cacheReadCostPerMillion: string
  cacheCreationCostPerMillion: string
}

type DashboardPayload = Record<string, unknown>
type TauriInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>

type ReadUsageStatisticsDashboardDeps = {
  invoke?: TauriInvoke | null
}

type UsagePricingConfigDeps = {
  invoke?: TauriInvoke | null
}

export type UsagePricingConfig = {
  defaultRows: UsagePricingDefaultRow[]
  modelRows: UsageModelPricingRow[]
}

export const emptyUsageStatisticsDashboard: UsageStatisticsDashboardSnapshot = {
  sourceLabel: '未连接到请求级统计数据库',
  databasePath: null,
  summary: {
    totalRequests: 0,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreationTokens: 0,
    totalCostUsd: '0.0000',
    successRate: 0,
    cacheHitRate: 0,
    distinctSessionCount: 0,
  },
  trendPoints: [],
  providerRows: [],
  modelRows: [],
  requestLogPage: {
    total: 0,
    page: 0,
    pageSize: 20,
    rows: [],
  },
  availableProviderOptions: [],
  availableModelOptions: [],
  sync: {
    imported: 0,
    skipped: 0,
    filesScanned: 0,
  },
}

export const defaultUsagePricingDefaults: UsagePricingDefaultRow[] = [
  { appId: 'claude', appLabel: 'Claude', multiplier: '1', modelSource: 'response' },
  { appId: 'codex', appLabel: 'Codex', multiplier: '1', modelSource: 'response' },
  { appId: 'gemini', appLabel: 'Gemini', multiplier: '1', modelSource: 'response' },
]

export const defaultUsageModelPricingRows: UsageModelPricingRow[] = [
  {
    modelId: 'claude-3-5-haiku-20241022',
    displayName: 'Claude 3.5 Haiku',
    inputCostPerMillion: '0.80',
    outputCostPerMillion: '4',
    cacheReadCostPerMillion: '0.08',
    cacheCreationCostPerMillion: '1',
  },
  {
    modelId: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    inputCostPerMillion: '3',
    outputCostPerMillion: '15',
    cacheReadCostPerMillion: '0.30',
    cacheCreationCostPerMillion: '3.75',
  },
  {
    modelId: 'claude-fable-5',
    displayName: 'Claude Fable 5',
    inputCostPerMillion: '10',
    outputCostPerMillion: '50',
    cacheReadCostPerMillion: '1.00',
    cacheCreationCostPerMillion: '12.50',
  },
  {
    modelId: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    inputCostPerMillion: '1',
    outputCostPerMillion: '5',
    cacheReadCostPerMillion: '0.10',
    cacheCreationCostPerMillion: '1.25',
  },
  {
    modelId: 'claude-mythos-5',
    displayName: 'Claude Mythos 5',
    inputCostPerMillion: '10',
    outputCostPerMillion: '50',
    cacheReadCostPerMillion: '1.00',
    cacheCreationCostPerMillion: '12.50',
  },
  {
    modelId: 'claude-opus-4-20250514',
    displayName: 'Claude Opus 4',
    inputCostPerMillion: '15',
    outputCostPerMillion: '75',
    cacheReadCostPerMillion: '1.50',
    cacheCreationCostPerMillion: '18.75',
  },
  {
    modelId: 'claude-opus-4-1-20250805',
    displayName: 'Claude Opus 4.1',
    inputCostPerMillion: '15',
    outputCostPerMillion: '75',
    cacheReadCostPerMillion: '1.50',
    cacheCreationCostPerMillion: '18.75',
  },
  {
    modelId: 'claude-opus-4-5-20251101',
    displayName: 'Claude Opus 4.5',
    inputCostPerMillion: '5',
    outputCostPerMillion: '25',
    cacheReadCostPerMillion: '0.50',
    cacheCreationCostPerMillion: '6.25',
  },
  {
    modelId: 'claude-opus-4-6-20260206',
    displayName: 'Claude Opus 4.6',
    inputCostPerMillion: '5',
    outputCostPerMillion: '25',
    cacheReadCostPerMillion: '0.50',
    cacheCreationCostPerMillion: '6.25',
  },
  {
    modelId: 'claude-opus-4-7',
    displayName: 'Claude Opus 4.7',
    inputCostPerMillion: '5',
    outputCostPerMillion: '25',
    cacheReadCostPerMillion: '0.50',
    cacheCreationCostPerMillion: '6.25',
  },
]

function normalizeUsageModelPricingRow(value: unknown): UsageModelPricingRow {
  if (!isDashboardPayload(value)) {
    return {
      modelId: '',
      displayName: '',
      inputCostPerMillion: '0',
      outputCostPerMillion: '0',
      cacheReadCostPerMillion: '0',
      cacheCreationCostPerMillion: '0',
    }
  }

  const modelId = readString(value.modelId) ?? ''
  const displayName = readString(value.displayName) ?? modelId

  return {
    modelId,
    displayName,
    inputCostPerMillion: normalizePricingNumberText(value.inputCostPerMillion) ?? '0',
    outputCostPerMillion: normalizePricingNumberText(value.outputCostPerMillion) ?? '0',
    cacheReadCostPerMillion: normalizePricingNumberText(value.cacheReadCostPerMillion) ?? '0',
    cacheCreationCostPerMillion: normalizePricingNumberText(value.cacheCreationCostPerMillion) ?? '0',
  }
}

function normalizePricingNumberText(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''
  if (!text) {
    return null
  }
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) && parsed >= 0 ? text : null
}

export async function readUsagePricingConfigWithFallback(
  deps: UsagePricingConfigDeps = {},
): Promise<UsagePricingConfig> {
  const invoke = deps.invoke ?? (await importTauriInvoke())
  const fallback = createDefaultUsagePricingConfig()

  if (!invoke) {
    return fallback
  }

  try {
    const defaultRows: UsagePricingDefaultRow[] = []
    for (const row of defaultUsagePricingDefaults) {
      const [multiplier, source] = await Promise.all([
        invoke<string>('get_default_cost_multiplier', { appType: row.appId }),
        invoke<string>('get_pricing_model_source', { appType: row.appId }),
      ])
      defaultRows.push({
        ...row,
        multiplier: normalizePricingNumberText(multiplier) ?? row.multiplier,
        modelSource: source === 'request' ? 'request' : 'response',
      })
    }

    const modelRows = readArray(await invoke<unknown>('get_model_pricing')).map(normalizeUsageModelPricingRow)
    return {
      defaultRows,
      modelRows: modelRows.length > 0 ? modelRows : fallback.modelRows,
    }
  } catch {
    return fallback
  }
}

export async function saveUsagePricingDefaults(
  rows: UsagePricingDefaultRow[],
  deps: UsagePricingConfigDeps = {},
): Promise<void> {
  const invoke = deps.invoke ?? (await importTauriInvoke())
  if (!invoke) {
    return
  }

  for (const row of rows) {
    await invoke('set_default_cost_multiplier', {
      appType: row.appId,
      value: row.multiplier.trim(),
    })
    await invoke('set_pricing_model_source', {
      appType: row.appId,
      value: row.modelSource,
    })
  }
}

export async function updateUsageModelPricing(
  row: UsageModelPricingRow,
  deps: UsagePricingConfigDeps = {},
): Promise<void> {
  const invoke = deps.invoke ?? (await importTauriInvoke())
  if (!invoke) {
    return
  }

  await invoke('update_model_pricing', {
    modelId: row.modelId.trim(),
    displayName: row.displayName.trim(),
    inputCost: row.inputCostPerMillion.trim(),
    outputCost: row.outputCostPerMillion.trim(),
    cacheReadCost: row.cacheReadCostPerMillion.trim(),
    cacheCreationCost: row.cacheCreationCostPerMillion.trim(),
  })
}

export async function deleteUsageModelPricing(
  modelId: string,
  deps: UsagePricingConfigDeps = {},
): Promise<void> {
  const invoke = deps.invoke ?? (await importTauriInvoke())
  if (!invoke) {
    return
  }

  await invoke('delete_model_pricing', { modelId })
}

function createDefaultUsagePricingConfig(): UsagePricingConfig {
  return {
    defaultRows: defaultUsagePricingDefaults.map((row) => ({ ...row })),
    modelRows: defaultUsageModelPricingRows.map((row) => ({ ...row })),
  }
}

export async function readCodexSessionUsageDashboardWithFallback(
  input: ReadUsageStatisticsDashboardInput,
  deps: ReadUsageStatisticsDashboardDeps = {},
): Promise<UsageStatisticsDashboardSnapshot> {
  const invoke = deps.invoke ?? (await importTauriInvoke())

  if (invoke) {
    const { startDate, endDate } = resolveUsageStatisticsDateWindow(input.range, input.now ?? new Date(), {
      startDate: input.startDate,
      endDate: input.endDate,
    })
    const payload = await invoke<unknown>('read_codex_session_usage_dashboard', {
      query: {
        manualPath: input.manualPath,
        range: input.range,
        startDate,
        endDate,
        sourceFilter: input.sourceFilter,
        providerId: normalizeString(input.providerId),
        model: normalizeString(input.model)?.toLowerCase(),
        page: input.page ?? 0,
        pageSize: input.pageSize ?? 20,
      },
    })
    return normalizeUsageStatisticsDashboard(payload)
  }

  return emptyUsageStatisticsDashboard
}

export function resolveUsageStatisticsDateWindow(
  range: UsageStatisticsRange,
  now: Date,
  customWindow: { startDate?: number | null; endDate?: number | null } = {},
): { startDate: number; endDate: number } {
  const nowMs = now.getTime()

  if (!Number.isFinite(nowMs)) {
    return { startDate: 0, endDate: 0 }
  }

  if (range === 'custom') {
    const startDate = normalizeEpochSeconds(customWindow.startDate)
    const endDate = normalizeEpochSeconds(customWindow.endDate)

    if (startDate && endDate && startDate < endDate) {
      return { startDate, endDate }
    }
  }

  if (range === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return {
      startDate: Math.floor(start.getTime() / 1000),
      endDate: Math.floor(nowMs / 1000),
    }
  }

  if (range === '1d') {
    return {
      startDate: Math.floor((nowMs - 24 * 60 * 60 * 1000) / 1000),
      endDate: Math.floor(nowMs / 1000),
    }
  }

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Number.parseInt(range, 10)
  start.setDate(start.getDate() - Math.max(0, days - 1))

  return {
    startDate: Math.floor(start.getTime() / 1000),
    endDate: Math.floor(nowMs / 1000),
  }
}

function normalizeEpochSeconds(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : null
}

export function formatUsageInteger(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString('en-US')
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, '')
}

export function formatCompactTokenCount(value: number): string {
  const normalizedValue = Math.max(0, Math.round(value))

  if (normalizedValue >= 100_000_000) {
    return `${(normalizedValue / 100_000_000).toFixed(2)} 亿`
  }

  if (normalizedValue >= 10_000) {
    return `${trimTrailingZero((normalizedValue / 10_000).toFixed(1))} 万`
  }

  if (normalizedValue >= 1_000) {
    return `${trimTrailingZero((normalizedValue / 1_000).toFixed(1))}k`
  }

  return formatUsageInteger(normalizedValue)
}

export function formatUsageMetricValue(value: number): string {
  return formatCompactTokenCount(value)
}

export function formatUsdAmount(value: string): string {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? `$${parsed.toFixed(4)}` : '$0.0000'
}

export function formatTrendUsdAmount(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? `$${Math.max(0, Math.round(parsed)).toLocaleString('en-US')}` : '$0'
}

export function formatTrendTooltipTokenCount(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? formatUsageInteger(parsed) : '0'
}

export function formatTrendTooltipUsdAmount(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? `$${parsed.toFixed(6)}` : '$0.000000'
}

export function formatPricingUsdPerMillion(value: string): string {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    return '$0'
  }

  if (Number.isInteger(parsed)) {
    return `$${parsed.toFixed(0)}`
  }

  return `$${parsed.toFixed(2)}`
}

export function formatPercentLabel(value: number): string {
  return `${(Math.max(0, value) * 100).toFixed(1)}%`
}

export function formatRequestTimestamp(epochSeconds: number): string {
  const date = new Date(epochSeconds * 1000)
  if (Number.isNaN(date.getTime())) {
    return '--'
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${month}/${day} ${hours}:${minutes}`
}

export function formatTrendAxisLabel(
  point: Pick<UsageStatisticsTrendPoint, 'date' | 'label'>,
  range: UsageStatisticsRange,
): string {
  const label = point.label.trim()
  const date = point.date.trim()

  if (/^\d{2}\/\d{2} \d{2}:\d{2}$/.test(label)) {
    return label
  }

  if (/^\d{2}\/\d{2}$/.test(label)) {
    return label
  }

  if (range === 'today' || range === '1d' || range === 'custom') {
    const parsedDateTime = new Date(date)
    if (!Number.isNaN(parsedDateTime.getTime())) {
      return formatRequestTimestamp(Math.floor(parsedDateTime.getTime() / 1000))
    }

    return label || '--'
  }

  const monthDayMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (monthDayMatch) {
    return `${monthDayMatch[2]}/${monthDayMatch[3]}`
  }

  return label || '--'
}

async function importTauriInvoke(): Promise<TauriInvoke | null> {
  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return invoke as TauriInvoke
  } catch {
    return null
  }
}

function normalizeUsageStatisticsDashboard(value: unknown): UsageStatisticsDashboardSnapshot {
  if (!isDashboardPayload(value)) {
    return emptyUsageStatisticsDashboard
  }

  return {
    sourceLabel: readString(value.sourceLabel) ?? emptyUsageStatisticsDashboard.sourceLabel,
    databasePath: readString(value.databasePath),
    summary: normalizeUsageStatisticsSummary(value.summary),
    trendPoints: readArray(value.trendPoints).map(normalizeUsageStatisticsTrendPoint),
    providerRows: readArray(value.providerRows).map(normalizeUsageStatisticsProviderRow),
    modelRows: readArray(value.modelRows).map(normalizeUsageStatisticsModelRow),
    requestLogPage: normalizeUsageStatisticsRequestLogPage(value.requestLogPage),
    availableProviderOptions: readArray(value.availableProviderOptions).map(normalizeUsageStatisticsFilterOption),
    availableModelOptions: readArray(value.availableModelOptions).map(normalizeUsageStatisticsFilterOption),
    sync: normalizeUsageStatisticsSyncMeta(value.sync),
  }
}

function normalizeUsageStatisticsSummary(value: unknown): UsageStatisticsSummary {
  if (!isDashboardPayload(value)) {
    return emptyUsageStatisticsDashboard.summary
  }

  return {
    totalRequests: readInteger(value.totalRequests),
    totalTokens: readInteger(value.totalTokens),
    totalInputTokens: readInteger(value.totalInputTokens),
    totalOutputTokens: readInteger(value.totalOutputTokens),
    totalCacheReadTokens: readInteger(value.totalCacheReadTokens),
    totalCacheCreationTokens: readInteger(value.totalCacheCreationTokens),
    totalCostUsd: normalizeCostString(value.totalCostUsd),
    successRate: readNumber(value.successRate),
    cacheHitRate: readNumber(value.cacheHitRate),
    distinctSessionCount: readInteger(value.distinctSessionCount),
  }
}

function normalizeUsageStatisticsTrendPoint(value: unknown): UsageStatisticsTrendPoint {
  if (!isDashboardPayload(value)) {
    return {
      date: '',
      label: '',
      requestCount: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheCreationTokens: 0,
      totalCostUsd: '0.000000',
    }
  }

  return {
    date: readString(value.date) ?? '',
    label: readString(value.label) ?? '',
    requestCount: readInteger(value.requestCount),
    totalTokens: readInteger(value.totalTokens),
    totalInputTokens: readInteger(value.totalInputTokens),
    totalOutputTokens: readInteger(value.totalOutputTokens),
    totalCacheReadTokens: readInteger(value.totalCacheReadTokens),
    totalCacheCreationTokens: readInteger(value.totalCacheCreationTokens),
    totalCostUsd: normalizeTrendCostString(value.totalCostUsd),
  }
}

function normalizeUsageStatisticsProviderRow(value: unknown): UsageStatisticsProviderRow {
  if (!isDashboardPayload(value)) {
    return {
      providerId: '',
      providerName: '',
      requestCount: 0,
      totalTokens: 0,
      totalCostUsd: '0.0000',
      successRate: 0,
      avgLatencyMs: 0,
      shareRatio: 0,
    }
  }

  return {
    providerId: readString(value.providerId) ?? '',
    providerName: readString(value.providerName) ?? '',
    requestCount: readInteger(value.requestCount),
    totalTokens: readInteger(value.totalTokens),
    totalCostUsd: normalizeCostString(value.totalCostUsd),
    successRate: readNumber(value.successRate),
    avgLatencyMs: readInteger(value.avgLatencyMs),
    shareRatio: readNumber(value.shareRatio),
  }
}

function normalizeUsageStatisticsModelRow(value: unknown): UsageStatisticsModelRow {
  if (!isDashboardPayload(value)) {
    return {
      model: '',
      requestCount: 0,
      totalTokens: 0,
      totalCostUsd: '0.0000',
      avgCostPerRequestUsd: '0.0000',
      shareRatio: 0,
    }
  }

  return {
    model: readString(value.model) ?? '',
    requestCount: readInteger(value.requestCount),
    totalTokens: readInteger(value.totalTokens),
    totalCostUsd: normalizeCostString(value.totalCostUsd),
    avgCostPerRequestUsd: normalizeCostString(value.avgCostPerRequestUsd),
    shareRatio: readNumber(value.shareRatio),
  }
}

function normalizeUsageStatisticsRequestLogPage(value: unknown): UsageStatisticsRequestLogPage {
  if (!isDashboardPayload(value)) {
    return emptyUsageStatisticsDashboard.requestLogPage
  }

  return {
    total: readInteger(value.total),
    page: readInteger(value.page),
    pageSize: readInteger(value.pageSize) || 20,
    rows: readArray(value.rows).map(normalizeUsageStatisticsRequestLogRow),
  }
}

function normalizeUsageStatisticsRequestLogRow(value: unknown): UsageStatisticsRequestLogRow {
  if (!isDashboardPayload(value)) {
    return {
      requestId: '',
      providerId: '',
      providerName: '',
      appType: '',
      model: '',
      requestModel: '',
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      totalTokens: 0,
      totalCostUsd: '0.0000',
      latencyMs: 0,
      statusCode: 0,
      errorMessage: null,
      sessionId: null,
      createdAt: 0,
      dataSource: '',
    }
  }

  return {
    requestId: readString(value.requestId) ?? '',
    providerId: readString(value.providerId) ?? '',
    providerName: readString(value.providerName) ?? '',
    appType: readString(value.appType) ?? '',
    model: readString(value.model) ?? '',
    requestModel: readString(value.requestModel) ?? '',
    inputTokens: readInteger(value.inputTokens),
    outputTokens: readInteger(value.outputTokens),
    cacheReadTokens: readInteger(value.cacheReadTokens),
    cacheCreationTokens: readInteger(value.cacheCreationTokens),
    totalTokens: readInteger(value.totalTokens),
    totalCostUsd: normalizeCostString(value.totalCostUsd),
    latencyMs: readInteger(value.latencyMs),
    statusCode: readInteger(value.statusCode),
    errorMessage: readString(value.errorMessage),
    sessionId: readString(value.sessionId),
    createdAt: readInteger(value.createdAt),
    dataSource: readString(value.dataSource) ?? '',
  }
}

function normalizeUsageStatisticsFilterOption(value: unknown): UsageStatisticsFilterOption {
  if (!isDashboardPayload(value)) {
    return {
      value: '',
      label: '',
      requestCount: 0,
    }
  }

  return {
    value: readString(value.value) ?? '',
    label: readString(value.label) ?? '',
    requestCount: readInteger(value.requestCount),
  }
}

function normalizeUsageStatisticsSyncMeta(value: unknown): UsageStatisticsSyncMeta {
  if (!isDashboardPayload(value)) {
    return emptyUsageStatisticsDashboard.sync
  }

  return {
    imported: readInteger(value.imported),
    skipped: readInteger(value.skipped),
    filesScanned: readInteger(value.filesScanned),
  }
}

function normalizeString(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim()
  return normalizedValue ? normalizedValue : null
}

function normalizeCostString(value: unknown): string {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(parsed) ? parsed.toFixed(4) : '0.0000'
}

function normalizeTrendCostString(value: unknown): string {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : Number.NaN
  return Number.isFinite(parsed) ? parsed.toFixed(6) : '0.000000'
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readInteger(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function isDashboardPayload(value: unknown): value is DashboardPayload {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
