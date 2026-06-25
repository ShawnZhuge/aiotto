import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import {
  Card as ShadcnCard,
  CardContent as ShadcnCardContent,
  CardDescription as ShadcnCardDescription,
  CardFooter as ShadcnCardFooter,
  CardHeader as ShadcnCardHeader,
  CardTitle as ShadcnCardTitle,
} from './ui/card'
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from './ui/button'
import { Badge as ShadcnBadge, type BadgeProps as ShadcnBadgeProps } from './ui/badge'
import { computeTooltipLayout, type TooltipPosition, type TooltipSide } from './tooltipLayout'

type Tone = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral'
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'icon'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCard className={className} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCardHeader className={className} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCardTitle className={className} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCardDescription className={className} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCardContent className={className} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <ShadcnCardFooter className={className} {...props} />
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  const shadcnVariant: ShadcnButtonProps['variant'] =
    variant === 'primary' ? 'default' : variant === 'secondary' ? 'outline' : variant
  const shadcnSize: ShadcnButtonProps['size'] = size === 'md' ? 'default' : size

  return (
    <ShadcnButton
      className={className}
      size={shadcnSize}
      type={type}
      variant={shadcnVariant}
      {...props}
    />
  )
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: Tone
}) {
  const variant: ShadcnBadgeProps['variant'] =
    tone === 'primary' ? 'default' : tone === 'neutral' ? 'secondary' : 'outline'
  const toneClass =
    tone === 'success'
      ? 'border-success/20 bg-success-soft text-success'
      : tone === 'info'
        ? 'border-info/20 bg-info-soft text-info'
        : tone === 'warning'
          ? 'border-warning/20 bg-warning-soft text-warning'
          : tone === 'danger'
            ? 'border-destructive/20 bg-danger-soft text-destructive'
            : undefined

  return <ShadcnBadge variant={variant} className={cx(toneClass, className)} {...props} />
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('ui-input', 'aiotto-focus-field', className)} {...props} />
}

export type SelectOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export function Select({
  ariaLabel,
  className,
  disabled = false,
  menuClassName,
  onValueChange,
  options,
  placeholder = '请选择',
  triggerClassName,
  value,
}: {
  ariaLabel?: string
  className?: string
  disabled?: boolean
  menuClassName?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  triggerClassName?: string
  value: string
}) {
  const listboxId = useId()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((option) => option.value === value)
  const isDisabled = disabled || options.length === 0

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
      const menuWidth = Math.min(Math.max(rect.width, 240), viewportWidth - gutter * 2)
      const left = Math.min(Math.max(gutter, rect.left), viewportWidth - menuWidth - gutter)
      const availableHeight = Math.max(160, viewportHeight - rect.bottom - gutter * 2)

      setMenuStyle({
        left,
        top: rect.bottom + 8,
        width: menuWidth,
        maxHeight: Math.min(292, availableHeight),
        visibility: 'visible',
      })
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
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

  const selectOption = (option: SelectOption) => {
    if (option.disabled) {
      return
    }

    onValueChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div className={cx('ui-select', className)} data-open={open ? 'true' : undefined}>
      <button
        ref={triggerRef}
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cx('ui-select-trigger', 'aiotto-focus-field', triggerClassName)}
        disabled={isDisabled}
        type="button"
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        <span className={cx('ui-select-value', !selectedOption && 'is-placeholder')}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown aria-hidden="true" className="ui-select-chevron" />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              aria-label={ariaLabel}
              className={cx('ui-select-menu', menuClassName)}
              id={listboxId}
              role="listbox"
              style={menuStyle ?? { visibility: 'hidden' }}
            >
              {options.map((option) => {
                const selected = option.value === value

                return (
                  <button
                    aria-selected={selected}
                    className={cx('ui-select-item', selected && 'is-selected')}
                    disabled={option.disabled}
                    key={option.value}
                    role="option"
                    type="button"
                    onClick={() => selectOption(option)}
                  >
                    <span className="ui-select-check" aria-hidden="true">
                      {selected ? <Check className="ui-select-check-icon" /> : null}
                    </span>
                    <span className="ui-select-item-copy">
                      <span className="ui-select-item-label">{option.label}</span>
                      {option.description ? (
                        <span className="ui-select-item-description">{option.description}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export function Switch({
  label,
  checked,
  defaultChecked = false,
  disabled = false,
  onCheckedChange,
  className,
}: {
  label: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)
  const currentChecked = checked ?? internalChecked

  const toggle = () => {
    if (disabled) {
      return
    }
    const nextChecked = !currentChecked
    setInternalChecked(nextChecked)
    onCheckedChange?.(nextChecked)
  }

  return (
    <button
      aria-checked={currentChecked}
      className={cx('ui-switch', className)}
      disabled={disabled}
      role="switch"
      type="button"
      onClick={toggle}
    >
      <span className="ui-switch-track">
        <span className="ui-switch-thumb" />
      </span>
      <span className="ui-switch-label">{label}</span>
    </button>
  )
}

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be rendered inside Tabs.')
  }

  return context
}

export function Tabs({
  children,
  value,
  defaultValue,
  onValueChange,
  className,
}: {
  children: ReactNode
  value?: string
  defaultValue: string
  onValueChange?: (value: string) => void
  className?: string
}) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue
  const setValue = (nextValue: string) => {
    setInternalValue(nextValue)
    onValueChange?.(nextValue)
  }

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cx('ui-tabs', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ui-tabs-list', className)} role="tablist" {...props} />
}

export function TabsTrigger({
  className,
  value,
  children,
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}) {
  const tabs = useTabsContext()
  const selected = tabs.value === value

  return (
    <button
      aria-selected={selected}
      className={cx('ui-tabs-trigger', selected && 'is-active', className)}
      role="tab"
      type="button"
      onClick={() => tabs.setValue(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  className,
  value,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  value: string
}) {
  const tabs = useTabsContext()
  if (tabs.value !== value) {
    return null
  }

  return <div className={cx('ui-tabs-content', className)} role="tabpanel" {...props} />
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cx('ui-table', className)} {...props} />
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cx('ui-table-header', className)} {...props} />
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cx('ui-table-body', className)} {...props} />
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cx('ui-table-row', className)} {...props} />
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <th className={cx('ui-table-head', className)} {...props} />
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cx('ui-table-cell', className)} {...props} />
}

export function AlertDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
}) {
  if (!open) {
    return null
  }

  return (
    <div className="ui-alert-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-background/45 p-8 backdrop-blur-md">
      <div
        aria-modal="true"
        className="ui-alert-dialog liquid-glass-card w-full max-w-[460px] rounded-[22px] border border-border/60 bg-card/90 p-6 text-card-foreground shadow-2xl"
        role="alertdialog"
      >
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="ui-alert-actions mt-6 flex justify-end gap-3">
          <Button
            className="liquid-glass-button rounded-[10px] border border-border bg-background/70 px-4 text-muted-foreground hover:text-foreground"
            variant="secondary"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            className="rounded-[10px] bg-destructive px-4 text-destructive-foreground shadow-sm hover:bg-destructive/90"
            variant="destructive"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Progress({
  className,
  value,
  max = 100,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  value: number
  max?: number
}) {
  const normalizedValue = Math.max(0, Math.min(value, max))

  return (
    <div
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={normalizedValue}
      className={cx('ui-progress', className)}
      role="progressbar"
      {...props}
    >
      <span style={{ width: `${(normalizedValue / max) * 100}%` }} />
    </div>
  )
}

export function Tooltip({
  children,
  className,
  content,
  side = 'top',
}: {
  children: ReactElement
  className?: string
  content: ReactNode
  side?: TooltipSide
}) {
  const [open, setOpen] = useState(false)
  const [instant, setInstant] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const tooltipBackground = isDark ? 'rgb(255 255 255 / 0.98)' : 'rgb(15 23 42 / 0.96)'
  const tooltipForeground = isDark ? 'rgb(15 23 42 / 0.96)' : 'rgb(255 255 255 / 0.98)'
  const tooltipBorder = isDark ? 'rgb(255 255 255 / 0.22)' : 'rgb(15 23 42 / 0.18)'
  const tooltipShadow = isDark
    ? '0 14px 30px rgb(0 0 0 / 0.28), 0 4px 10px rgb(0 0 0 / 0.18)'
    : '0 12px 24px rgb(15 23 42 / 0.18), 0 3px 10px rgb(15 23 42 / 0.12)'

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current

      if (!trigger || !tooltip) {
        return
      }

      setPosition(
        computeTooltipLayout({
          preferredSide: side,
          tooltipRect: tooltip.getBoundingClientRect(),
          triggerRect: trigger.getBoundingClientRect(),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
        }),
      )
    }

    updatePosition()

    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, side])

  const handleFocus = (event: FocusEvent<HTMLSpanElement>) => {
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
      setInstant(true)
      setOpen(true)
    }
  }

  return (
    <span
      ref={triggerRef}
      className={cx('ui-tooltip-trigger', className)}
      onBlur={() => {
        setPosition(null)
        setInstant(false)
        setOpen(false)
      }}
      onFocus={handleFocus}
      onMouseEnter={() => {
        setInstant(true)
        setOpen(true)
      }}
      onMouseLeave={() => {
        setPosition(null)
        setInstant(false)
        setOpen(false)
      }}
    >
      {children}
      {open && typeof document !== 'undefined'
        ? createPortal(
            <span
              ref={tooltipRef}
              className="ui-tooltip"
              data-instant={instant ? 'true' : undefined}
              data-side={position?.side ?? side}
              data-text-wrap="balance"
              role="tooltip"
              style={
                {
                  left: position?.left ?? 0,
                  top: position?.top ?? 0,
                  position: 'fixed',
                  zIndex: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 34,
                  width: 'max-content',
                  maxWidth: position?.maxWidth ?? 'min(280px, calc(100vw - 24px))',
                  padding: '7px 9px',
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  textWrap: 'balance',
                  color: tooltipForeground,
                  background: tooltipBackground,
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: 12,
                  boxShadow: tooltipShadow,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  pointerEvents: 'none',
                  textAlign: 'center',
                  transform: 'none',
                  visibility: position ? 'visible' : 'hidden',
                } satisfies CSSProperties
              }
            >
              {content}
              <span
                aria-hidden="true"
                style={
                  {
                    position: 'absolute',
                    left: position ? position.arrowLeft : '50%',
                    width: 9,
                    height: 9,
                    background: tooltipBackground,
                    transform: 'translateX(-50%) rotate(45deg)',
                    ...((position?.side ?? side) === 'top'
                      ? {
                          top: 'calc(100% - 5px)',
                          borderRight: `1px solid ${tooltipBorder}`,
                          borderBottom: `1px solid ${tooltipBorder}`,
                        }
                      : {
                          bottom: 'calc(100% - 5px)',
                          borderLeft: `1px solid ${tooltipBorder}`,
                          borderTop: `1px solid ${tooltipBorder}`,
                        }),
                  } satisfies CSSProperties
                }
              />
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}

export function DropdownMenu({
  label,
  items,
  onSelect,
}: {
  label: string
  items: Array<{ id: string; label: string; disabled?: boolean }>
  onSelect?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="ui-dropdown">
      <Button variant="secondary" onClick={() => setOpen((previous) => !previous)}>
        {label}
      </Button>
      {open ? (
        <div className="ui-dropdown-menu" role="menu">
          {items.map((item) => (
            <button
              className="ui-dropdown-item"
              disabled={item.disabled}
              key={item.id}
              role="menuitem"
              type="button"
              onClick={() => {
                onSelect?.(item.id)
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
