import * as React from 'react'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

type CheckboxControlProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'children' | 'checked' | 'defaultChecked' | 'onChange' | 'type'
> & {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  children?: React.ReactNode
  checkClassName?: string
  checkedIndicatorClassName?: string
  containerClassName?: string
  hideLabel?: boolean
  indicatorClassName?: string
  labelClassName?: string
  uncheckedIndicatorClassName?: string
}

const CheckboxControl = React.forwardRef<HTMLInputElement, CheckboxControlProps>(
  (
    {
      checked,
      children,
      checkClassName,
      checkedIndicatorClassName,
      className,
      containerClassName,
      disabled,
      hideLabel = false,
      indicatorClassName,
      label,
      labelClassName,
      onCheckedChange,
      uncheckedIndicatorClassName,
      ...props
    },
    ref,
  ) => (
    <label
      className={cn(
        'aiotto-checkbox-control group inline-flex cursor-pointer items-center gap-2 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20',
        disabled && 'cursor-not-allowed opacity-60',
        containerClassName,
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        aria-label={label}
        aria-checked={checked}
        checked={checked}
        className="peer sr-only"
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex size-4 shrink-0 items-center justify-center aiotto-radius-button border transition-[background-color,border-color,color,box-shadow]',
          checked
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-transparent',
          checked ? checkedIndicatorClassName : uncheckedIndicatorClassName,
          indicatorClassName,
        )}
      >
        <Check className={cn('size-3', checkClassName)} />
      </span>
      {children ?? (hideLabel ? null : <span className={cn('text-card-foreground', labelClassName)}>{label}</span>)}
    </label>
  ),
)

CheckboxControl.displayName = 'CheckboxControl'

export { CheckboxControl }
