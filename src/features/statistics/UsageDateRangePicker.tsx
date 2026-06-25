import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  resolveUsageStatisticsDateWindow,
  type UsageStatisticsRange,
} from '../../domain/usageStatistics'
import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

export type UsageStatisticsPresetRange = Exclude<UsageStatisticsRange, 'custom'>

export type UsageDateSelection =
  | { type: 'preset'; range: UsageStatisticsPresetRange }
  | { type: 'custom'; startDate: number; endDate: number }

export type UsageDateRangeOption = {
  value: UsageStatisticsPresetRange
  label: string
}

type CalendarCell = {
  key: string
  date: Date
  inMonth: boolean
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

export function UsageDateRangePicker({
  label,
  options,
  selection,
  onCustomApply,
  onPresetChange,
}: {
  label: string
  options: UsageDateRangeOption[]
  selection: UsageDateSelection
  onCustomApply: (startDate: number, endDate: number) => void
  onPresetChange: (range: UsageStatisticsPresetRange) => void
}) {
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)
  const [editingBoundary, setEditingBoundary] = useState<'start' | 'end'>('start')
  const [draftStart, setDraftStart] = useState(() => new Date())
  const [draftEnd, setDraftEnd] = useState(() => new Date())
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const calendarCells = useMemo(() => createCalendarCells(calendarMonth), [calendarMonth])
  const canApply = draftStart.getTime() < draftEnd.getTime()

  const openPicker = () => {
    const window = selectionToDateWindow(selection)
    setDraftStart(window.start)
    setDraftEnd(window.end)
    setEditingBoundary('start')
    setCalendarMonth(startOfMonth(window.start))
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current

      if (!trigger) {
        return
      }

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const gutter = 12
      const panelWidth = Math.min(520, viewportWidth - gutter * 2)
      const left = Math.min(Math.max(gutter, rect.right - panelWidth), viewportWidth - panelWidth - gutter)
      const availableBelow = viewportHeight - rect.bottom - gutter
      const top = availableBelow >= 340 ? rect.bottom + 8 : Math.max(gutter, rect.top - 356)

      setPanelStyle({
        left,
        top,
        width: panelWidth,
        maxHeight: Math.min(520, viewportHeight - gutter * 2),
        visibility: 'visible',
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    updatePosition()
    const frame = window.requestAnimationFrame(updatePosition)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  const applyPreset = (range: UsageStatisticsPresetRange) => {
    onPresetChange(range)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const applyCustom = () => {
    if (!canApply) {
      return
    }

    onCustomApply(toEpochSeconds(draftStart), toEpochSeconds(draftEnd))
    setOpen(false)
    triggerRef.current?.focus()
  }

  const pickCalendarDate = (date: Date) => {
    if (editingBoundary === 'start') {
      const nextStart = withDate(draftStart, date)
      setDraftStart(nextStart)
      if (nextStart >= draftEnd) {
        setDraftEnd(new Date(nextStart.getTime() + 60 * 60 * 1000))
      }
      setEditingBoundary('end')
      return
    }

    const nextEnd = withDate(draftEnd, date)
    setDraftEnd(nextEnd)
    if (nextEnd <= draftStart) {
      setDraftStart(new Date(nextEnd.getTime() - 60 * 60 * 1000))
    }
  }

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        aria-controls={open ? popoverId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`日期筛选：${label}`}
        className={cn('h-9 min-w-[118px] rounded-[10px] bg-card/80 px-3 shadow-sm', typography.controlText)}
        variant={selection.type === 'custom' ? 'default' : 'outline'}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }

          openPicker()
        }}
      >
        <CalendarDays aria-hidden="true" data-icon="inline-start" />
        <span className="max-w-[6.5rem] truncate">{label}</span>
      </Button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              aria-label="日期范围"
              className="fixed z-[135] overflow-hidden rounded-[18px] border border-border/70 bg-card/95 p-3 text-card-foreground shadow-2xl backdrop-blur-md"
              id={popoverId}
              role="dialog"
              style={panelStyle ?? { visibility: 'hidden' }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {options.map((option) => (
                  <Button
                    key={option.value}
                    aria-pressed={selection.type === 'preset' && selection.range === option.value}
                    className={cn('h-8 rounded-[9px] px-3', typography.controlText)}
                    size="sm"
                    type="button"
                    variant={selection.type === 'preset' && selection.range === option.value ? 'default' : 'outline'}
                    onClick={() => applyPreset(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1fr)]">
                <div className="flex min-w-0 flex-col gap-3">
                  <div className={cn(typography.sectionDescription, 'font-medium')}>支持日期与时间</div>
                  <DateTimeField
                    active={editingBoundary === 'start'}
                    id={`${popoverId}-start`}
                    label="开始时间"
                    value={draftStart}
                    onFocus={() => setEditingBoundary('start')}
                    onValueChange={(date) => {
                      setDraftStart(date)
                      setCalendarMonth(startOfMonth(date))
                    }}
                  />
                  <DateTimeField
                    active={editingBoundary === 'end'}
                    id={`${popoverId}-end`}
                    label="结束时间"
                    value={draftEnd}
                    onFocus={() => setEditingBoundary('end')}
                    onValueChange={(date) => {
                      setDraftEnd(date)
                      setCalendarMonth(startOfMonth(date))
                    }}
                  />
                  {!canApply ? (
                    <div className={cn('rounded-[12px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive', typography.controlText)}>
                      结束时间必须晚于开始时间。
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center justify-end gap-2">
                    <Button
                      className="h-8 rounded-[9px] px-4"
                      size="sm"
                      type="button"
                      variant="ghost"
                      onClick={() => setOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      className="h-8 rounded-[9px] px-4"
                      disabled={!canApply}
                      size="sm"
                      type="button"
                      onClick={applyCustom}
                    >
                      确定
                    </Button>
                  </div>
                </div>

                <div className="min-w-0 rounded-[16px] border border-border/60 bg-background/55 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Button
                      aria-label="上个月"
                      className="size-8 rounded-[9px]"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => setCalendarMonth(shiftMonth(calendarMonth, -1))}
                    >
                      <ChevronLeft aria-hidden="true" data-icon="inline-start" />
                    </Button>
                    <div className={cn(typography.cardTitle, 'text-sm')}>{formatMonthTitle(calendarMonth)}</div>
                    <Button
                      aria-label="下个月"
                      className="size-8 rounded-[9px]"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => setCalendarMonth(shiftMonth(calendarMonth, 1))}
                    >
                      <ChevronRight aria-hidden="true" data-icon="inline-start" />
                    </Button>
                  </div>
                  <div className={cn('grid grid-cols-7 gap-1 text-center text-muted-foreground', typography.badgeText)}>
                    {weekDays.map((day) => (
                      <div className="py-1" key={day}>
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-1">
                    {calendarCells.map((cell) => {
                      const isStart = isSameLocalDay(cell.date, draftStart)
                      const isEnd = isSameLocalDay(cell.date, draftEnd)
                      const inRange = isLocalDayWithinRange(cell.date, draftStart, draftEnd)

                      return (
                        <button
                          aria-label={formatCalendarButtonLabel(cell.date)}
                          className={cn(
                            'aiotto-motion-control relative h-8 rounded-[9px] transition-[background-color,color,opacity,box-shadow]',
                            typography.controlText,
                            cell.inMonth ? 'text-foreground' : 'text-muted-foreground/45',
                            inRange && 'bg-primary/10 text-primary',
                            (isStart || isEnd) && 'bg-primary text-primary-foreground shadow-sm',
                          )}
                          key={cell.key}
                          type="button"
                          onClick={() => pickCalendarDate(cell.date)}
                        >
                          {(isStart || isEnd) ? (
                            <Check aria-hidden="true" className="absolute left-1 top-1 size-2.5" />
                          ) : null}
                          {cell.date.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function DateTimeField({
  active,
  id,
  label,
  value,
  onFocus,
  onValueChange,
}: {
  active: boolean
  id: string
  label: string
  value: Date
  onFocus: () => void
  onValueChange: (value: Date) => void
}) {
  return (
    <label
      className={cn(
        'block rounded-[14px] border bg-background/55 p-3 transition-[border-color,box-shadow]',
        active ? 'border-primary/55 shadow-sm shadow-primary/10' : 'border-border/60',
      )}
      htmlFor={id}
    >
      <span className={cn('mb-2 block', typography.sectionDescription, 'font-medium')}>{label}</span>
      <Input
        className={cn('h-9 rounded-[10px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0', typography.tableNumber)}
        id={id}
        step={60}
        type="datetime-local"
        value={toDateTimeLocalValue(value)}
        onChange={(event) => {
          const nextDate = parseDateTimeLocalValue(event.target.value)
          if (nextDate) {
            onValueChange(nextDate)
          }
        }}
        onFocus={onFocus}
      />
    </label>
  )
}

function selectionToDateWindow(selection: UsageDateSelection): { start: Date; end: Date } {
  if (selection.type === 'custom') {
    return {
      start: new Date(selection.startDate * 1000),
      end: new Date(selection.endDate * 1000),
    }
  }

  const window = resolveUsageStatisticsDateWindow(selection.range, new Date())
  return {
    start: new Date(window.startDate * 1000),
    end: new Date(window.endDate * 1000),
  }
}

function createCalendarCells(month: Date): CalendarCell[] {
  const monthStart = startOfMonth(month)
  const gridStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - monthStart.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

    return {
      key,
      date,
      inMonth: date.getMonth() === monthStart.getMonth(),
    }
  })
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function shiftMonth(date: Date, offset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1)
}

function withDate(base: Date, date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    base.getHours(),
    base.getMinutes(),
  )
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function isLocalDayWithinRange(date: Date, start: Date, end: Date): boolean {
  const day = startOfLocalDay(date).getTime()
  return day >= startOfLocalDay(start).getTime() && day <= startOfLocalDay(end).getTime()
}

function formatMonthTitle(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

function formatCalendarButtonLabel(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function toDateTimeLocalValue(date: Date): string {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join('T')
}

function parseDateTimeLocalValue(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toEpochSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

function pad(value: number): string {
  return `${value}`.padStart(2, '0')
}
