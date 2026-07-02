import * as React from 'react'

import { cn } from '@/lib/utils'

import { Input } from './input'

type NumberFieldProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'aria-label' | 'onChange' | 'type' | 'value'
> & {
  ariaLabel: string
  containerClassName?: string
  inputClassName?: string
  onValueChange: (value: string) => void
  unit?: React.ReactNode
  unitClassName?: string
  value: number | string
}

const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  (
    {
      ariaLabel,
      className,
      containerClassName,
      inputClassName,
      onValueChange,
      unit,
      unitClassName,
      value,
      ...props
    },
    ref,
  ) => (
    <span
      className={cn(
        'aiotto-number-field flex items-center gap-2 aiotto-radius-button bg-background/72 px-2 py-1 ring-1 ring-border/40',
        containerClassName,
        className,
      )}
      data-aiotto-number-field
    >
      <Input
        ref={ref}
        type="number"
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        className={cn('h-7 min-w-0 flex-1 bg-transparent text-right text-foreground shadow-none outline-none', inputClassName)}
        {...props}
      />
      {unit ? <span className={cn('shrink-0 text-muted-foreground', unitClassName)}>{unit}</span> : null}
    </span>
  ),
)

NumberField.displayName = 'NumberField'

export { NumberField }
