import {
  createContext,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
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
import { SwitchControl as BaseSwitchControl } from './ui/switch-control'

export { SearchField } from './ui/search-field'
export { SwitchControl } from './ui/switch-control'
export { CheckboxControl } from './ui/checkbox-control'
export { NumberField } from './ui/number-field'
export { ControlPanel, PreviewPanel, SettingsSurface, ToolbarRow } from './ui/page-surface'
export { AlertDialog } from './ui/alert-dialog'
export { Select, type SelectOption } from './ui/select'
export { Tooltip, type TooltipVariant } from './ui/tooltip'

type Tone = 'primary' | 'success' | 'info' | 'warning' | 'danger' | 'neutral'
type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'selected' | 'selectedSoft'
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
    <BaseSwitchControl
      checked={currentChecked}
      className={cx('ui-switch', className)}
      disabled={disabled}
      label={label}
      trackClassName="ui-switch-track"
      trackPosition="start"
      variant="button"
      onToggle={toggle}
    >
      <span className="ui-switch-label">{label}</span>
    </BaseSwitchControl>
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
