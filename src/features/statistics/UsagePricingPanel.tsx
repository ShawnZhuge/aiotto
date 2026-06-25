import { useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Coins, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Select,
  Tooltip,
} from '../../components/ui'
import { SectionDescription, SectionTitle } from '../../components/ui/typography'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  defaultUsageModelPricingRows,
  defaultUsagePricingDefaults,
  deleteUsageModelPricing,
  formatPricingUsdPerMillion,
  readUsagePricingConfigWithFallback,
  saveUsagePricingDefaults,
  updateUsageModelPricing,
  type UsageModelPricingRow,
  type UsagePricingConfig,
  type UsagePricingDefaultRow,
  type UsagePricingModelSource,
} from '../../domain/usageStatistics'
import { aiottoQueryClient } from '../../runtime/queryClient'
import { runtimeQueryKeys } from '../../runtime/runtimeKeys'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

const pricingModeOptions = [
  { value: 'response', label: '返回模型' },
  { value: 'request', label: '请求模型' },
]

const visibleDefaultPricingAppIds = new Set<UsagePricingDefaultRow['appId']>(['codex'])

type StoredPricingPanelState = {
  defaultRows: UsagePricingDefaultRow[]
  modelRows: PricingPanelModelRow[]
}

type PricingPanelModelRow = UsageModelPricingRow & {
  rowKey: string
}

export function UsagePricingPanel() {
  const [expanded, setExpanded] = useState(false)
  const [savedLabel, setSavedLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [savingRowKey, setSavingRowKey] = useState<string | null>(null)
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null)
  const [pricingState, setPricingState] = useState<StoredPricingPanelState>(() => createDefaultPricingPanelState())
  const { defaultRows, modelRows } = pricingState
  const visibleDefaultRows = defaultRows.filter((row) => visibleDefaultPricingAppIds.has(row.appId))

  useEffect(() => {
    let active = true

    readUsagePricingConfigWithFallback()
      .then((config) => {
        if (!active) {
          return
        }
        setPricingState(toPricingPanelState(config))
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }
        setSavedLabel(`加载失败：${pricingErrorMessage(error)}`)
      })
      .finally(() => {
        if (!active) {
          return
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const invalidateUsageStatistics = async () => {
    await aiottoQueryClient.invalidateQueries({ queryKey: runtimeQueryKeys.usageStatistics })
  }

  const updateDefaultRow = (
    appId: UsagePricingDefaultRow['appId'],
    patch: Partial<Pick<UsagePricingDefaultRow, 'multiplier' | 'modelSource'>>,
  ) => {
    setSavedLabel(null)
    setPricingState((current) => ({
      ...current,
      defaultRows: current.defaultRows.map((row) => (row.appId === appId ? { ...row, ...patch } : row)),
    }))
  }

  const updateModelRow = (rowKey: string, patch: Partial<UsageModelPricingRow>) => {
    setSavedLabel(null)
    setPricingState((current) => ({
      ...current,
      modelRows: current.modelRows.map((row) => (row.rowKey === rowKey ? { ...row, ...patch } : row)),
    }))
  }

  const savePricingState = async () => {
    if (!defaultRows.every((row) => isValidNonNegativeDecimal(row.multiplier))) {
      setSavedLabel('倍率格式不正确')
      return
    }

    setSavingDefaults(true)
    setSavedLabel(null)
    try {
      await saveUsagePricingDefaults(defaultRows)
      await invalidateUsageStatistics()
      setSavedLabel('已保存')
    } catch (error: unknown) {
      setSavedLabel(`保存失败：${pricingErrorMessage(error)}`)
    } finally {
      setSavingDefaults(false)
    }
  }

  const addPricingRow = () => {
    const nextIndex = modelRows.length + 1
    const modelId = `custom-model-${nextIndex}`
    const rowKey = `custom-${Date.now()}-${nextIndex}`

    setSavedLabel(null)
    setPricingState((current) => ({
      ...current,
      modelRows: [
        {
          rowKey,
          modelId,
          displayName: `Custom Model ${nextIndex}`,
          inputCostPerMillion: '0',
          outputCostPerMillion: '0',
          cacheReadCostPerMillion: '0',
          cacheCreationCostPerMillion: '0',
        },
        ...current.modelRows,
      ],
    }))
    setEditingRowKey(rowKey)
  }

  const saveModelRow = async (row: PricingPanelModelRow) => {
    const pricingFields = [
      row.inputCostPerMillion,
      row.outputCostPerMillion,
      row.cacheReadCostPerMillion,
      row.cacheCreationCostPerMillion,
    ]
    if (!row.modelId.trim() || !row.displayName.trim() || !pricingFields.every(isValidNonNegativeDecimal)) {
      setSavedLabel('模型 ID、显示名和价格必须填写正确')
      return
    }

    setSavingRowKey(row.rowKey)
    setSavedLabel(null)
    try {
      await updateUsageModelPricing(row)
      await invalidateUsageStatistics()
      setPricingState((current) => ({
        ...current,
        modelRows: current.modelRows.map((currentRow) =>
          currentRow.rowKey === row.rowKey
            ? { ...currentRow, modelId: row.modelId.trim().toLowerCase(), rowKey: `persisted-${row.modelId.trim().toLowerCase()}` }
            : currentRow,
        ),
      }))
      setEditingRowKey(null)
      setSavedLabel('价格已保存')
    } catch (error: unknown) {
      setSavedLabel(`保存失败：${pricingErrorMessage(error)}`)
    } finally {
      setSavingRowKey(null)
    }
  }

  const deletePricingRow = async (row: PricingPanelModelRow) => {
    setSavingRowKey(row.rowKey)
    setSavedLabel(null)
    try {
      await deleteUsageModelPricing(row.modelId)
      setPricingState((current) => ({
        ...current,
        modelRows: current.modelRows.filter((currentRow) => currentRow.rowKey !== row.rowKey),
      }))
      await invalidateUsageStatistics()
      setSavedLabel('价格已删除')
    } catch (error: unknown) {
      setSavedLabel(`删除失败：${pricingErrorMessage(error)}`)
    } finally {
      setSavingRowKey(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-[20px] border border-border/70 bg-card/45 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 bg-muted/20 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-amber-500/10 text-amber-500">
            <Coins aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className={typography.cardTitle}>成本定价</h2>
            <SectionDescription className="mt-0.5">管理各模型 Token 计费规则</SectionDescription>
          </div>
        </div>
        <button
          aria-expanded={expanded}
          aria-label={expanded ? '折叠成本定价' : '展开成本定价'}
          className={iconButtonClass}
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? (
            <ChevronUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-6 px-5 py-5">
          <section className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionTitle className="text-sm">计费默认配置</SectionTitle>
                <SectionDescription className="mt-1">设置各应用的默认倍率与计费模式来源。</SectionDescription>
              </div>
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-muted-foreground', typography.badgeText)}>
                    <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" />
                    读取中
                  </span>
                ) : null}
                {savedLabel ? (
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1',
                      typography.badgeText,
                      savedLabel.includes('失败') || savedLabel.includes('不正确')
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-emerald-500/10 text-emerald-600',
                    )}
                  >
                    {savedLabel}
                  </span>
                ) : null}
                <Button
                  className={cn('h-8 rounded-[9px] px-4', typography.controlText)}
                  disabled={savingDefaults || loading}
                  onClick={savePricingState}
                  type="button"
                >
                  {savingDefaults ? <Loader2 aria-hidden="true" className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  保存
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-border/60 bg-background/35">
              <Table>
                <TableHeader className="[&_tr]:border-border/50">
                  <TableRow className="border-border/50">
                    <TableHead>应用</TableHead>
                    <TableHead>默认倍率</TableHead>
                    <TableHead>计费模式</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleDefaultRows.map((row) => (
                    <TableRow className="border-border/40 hover:bg-muted/30" key={row.appId}>
                      <TableCell className={cn(typography.listTitle, 'text-card-foreground')}>{row.appLabel}</TableCell>
                      <TableCell>
                        <Input
                          aria-label={`${row.appLabel} 默认倍率`}
                          className="h-8 w-24 rounded-[9px] bg-card/70 text-sm"
                          disabled={savingDefaults || loading}
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          type="number"
                          value={row.multiplier}
                          onChange={(event) => updateDefaultRow(row.appId, { multiplier: event.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          ariaLabel={`${row.appLabel} 计费模式`}
                          className="!w-[128px]"
                          disabled={savingDefaults || loading}
                          options={pricingModeOptions}
                          triggerClassName="min-h-8 rounded-[9px] bg-card/70 text-xs shadow-sm"
                          value={row.modelSource}
                          onValueChange={(value) =>
                            updateDefaultRow(row.appId, { modelSource: value as UsagePricingModelSource })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <div className="border-t border-border/60" />

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className={cn(typography.sectionTitle, 'text-sm text-muted-foreground')}>
                配置各模型的 Token 成本（每百万）
              </h3>
              <Button
                variant="outline"
                className={cn('h-8 rounded-[9px] px-3', typography.controlText)}
                disabled={loading}
                onClick={addPricingRow}
                type="button"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                添加
              </Button>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-border/60 bg-background/35">
              <Table>
                <TableHeader className="[&_tr]:border-border/50">
                  <TableRow className="border-border/50">
                    <TableHead>模型</TableHead>
                    <TableHead>显示名称</TableHead>
                    <TableHead className="text-right">输入成本</TableHead>
                    <TableHead className="text-right">输出成本</TableHead>
                    <TableHead className="text-right">缓存命中</TableHead>
                    <TableHead className="text-right">缓存创建</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelRows.map((row) => {
                    const isEditing = editingRowKey === row.rowKey
                    const isSaving = savingRowKey === row.rowKey

                    return (
                      <TableRow className="border-border/40 hover:bg-muted/30" key={row.rowKey}>
                        <TableCell className="font-mono tabular-nums text-[13px] font-normal text-card-foreground">
                          {isEditing ? (
                            <Input
                              aria-label="模型 ID"
                              className="h-8 min-w-[180px] rounded-[9px] bg-card/70 font-mono text-[13px]"
                              value={row.modelId}
                              onChange={(event) => updateModelRow(row.rowKey, { modelId: event.target.value })}
                            />
                          ) : (
                            row.modelId
                          )}
                        </TableCell>
                        <TableCell className={typography.tableCell}>
                          {isEditing ? (
                            <Input
                              aria-label={`${row.modelId} 显示名称`}
                              className="h-8 min-w-[160px] rounded-[9px] bg-card/70 text-sm"
                              value={row.displayName}
                              onChange={(event) => updateModelRow(row.rowKey, { displayName: event.target.value })}
                            />
                          ) : (
                            row.displayName
                          )}
                        </TableCell>
                        <EditablePricingCell
                          isEditing={isEditing}
                          label={`${row.modelId} 输入成本`}
                          value={row.inputCostPerMillion}
                          onChange={(value) => updateModelRow(row.rowKey, { inputCostPerMillion: value })}
                        />
                        <EditablePricingCell
                          isEditing={isEditing}
                          label={`${row.modelId} 输出成本`}
                          value={row.outputCostPerMillion}
                          onChange={(value) => updateModelRow(row.rowKey, { outputCostPerMillion: value })}
                        />
                        <EditablePricingCell
                          isEditing={isEditing}
                          label={`${row.modelId} 缓存命中`}
                          value={row.cacheReadCostPerMillion}
                          onChange={(value) => updateModelRow(row.rowKey, { cacheReadCostPerMillion: value })}
                        />
                        <EditablePricingCell
                          isEditing={isEditing}
                          label={`${row.modelId} 缓存创建`}
                          value={row.cacheCreationCostPerMillion}
                          onChange={(value) => updateModelRow(row.rowKey, { cacheCreationCostPerMillion: value })}
                        />
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isEditing ? (
                              <Tooltip content="保存价格">
                                <button
                                  aria-label={`保存 ${row.modelId}`}
                                  className={cn(iconButtonClass, 'text-emerald-600 hover:text-emerald-700')}
                                  disabled={isSaving}
                                  onClick={() => saveModelRow(row)}
                                  type="button"
                                >
                                  {isSaving ? (
                                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check aria-hidden="true" className="h-4 w-4" />
                                  )}
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip content="编辑">
                                <button
                                  aria-label={`编辑 ${row.modelId}`}
                                  className={iconButtonClass}
                                  disabled={isSaving}
                                  onClick={() => {
                                    setSavedLabel(null)
                                    setEditingRowKey(row.rowKey)
                                  }}
                                  type="button"
                                >
                                  <Pencil aria-hidden="true" className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip content="删除">
                              <button
                                aria-label={`删除 ${row.modelId}`}
                                className={cn(iconButtonClass, 'text-rose-500 hover:text-rose-600')}
                                disabled={isSaving}
                                onClick={() => deletePricingRow(row)}
                                type="button"
                              >
                                {isSaving && !isEditing ? (
                                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function EditablePricingCell({
  isEditing,
  label,
  onChange,
  value,
}: {
  isEditing: boolean
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <TableCell className={cn('text-right', typography.tableNumber)}>
      {isEditing ? (
        <Input
          aria-label={label}
          className="ml-auto h-8 w-24 rounded-[9px] bg-card/70 text-right font-mono text-[13px]"
          inputMode="decimal"
          min="0"
          step="0.0001"
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        formatPricingUsdPerMillion(value)
      )}
    </TableCell>
  )
}

const iconButtonClass =
  'aiotto-motion-control inline-grid h-8 w-8 place-items-center rounded-[9px] text-muted-foreground transition-[background-color,color] duration-200 hover:bg-muted/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'

function createDefaultPricingPanelState(): StoredPricingPanelState {
  return toPricingPanelState({
    defaultRows: defaultUsagePricingDefaults.map((row) => ({ ...row })),
    modelRows: defaultUsageModelPricingRows.map((row) => ({ ...row })),
  })
}

function toPricingPanelState(config: UsagePricingConfig): StoredPricingPanelState {
  return {
    defaultRows: config.defaultRows.map((row) => ({ ...row })),
    modelRows: config.modelRows.map((row, index) => ({
      ...row,
      rowKey: `persisted-${row.modelId}-${index}`,
    })),
  }
}

function isValidNonNegativeDecimal(value: string) {
  const parsed = Number.parseFloat(value.trim())
  return Number.isFinite(parsed) && parsed >= 0
}

function pricingErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
