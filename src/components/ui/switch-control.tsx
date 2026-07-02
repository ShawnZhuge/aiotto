import * as React from 'react'

import { cn } from '@/lib/utils'

type SwitchControlProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'aria-checked' | 'aria-label' | 'onClick' | 'role' | 'type'
> & {
  checked: boolean
  checkedClassName?: string
  children?: React.ReactNode
  label: string
  onCheckedChange?: (checked: boolean) => void
  onToggle?: () => void
  thumbClassName?: string
  trackClassName?: string
  trackPosition?: 'end' | 'none' | 'start'
  uncheckedClassName?: string
  variant?: 'button' | 'row' | 'toolbar' | 'track'
}

const SwitchControl = React.forwardRef<HTMLButtonElement, SwitchControlProps>(
  (
    {
      checked,
      checkedClassName = 'border-primary/30 bg-primary',
      children,
      className,
      disabled,
      label,
      onCheckedChange,
      onToggle,
      thumbClassName,
      trackClassName,
      trackPosition = 'end',
      uncheckedClassName = 'border-border/70 bg-muted/70',
      variant = 'track',
      ...props
    },
    ref,
  ) => {
    const handleClick = () => {
      if (disabled) {
        return
      }

      onToggle?.()
      onCheckedChange?.(!checked)
    }

    const track = (
      <span
        aria-hidden="true"
        className={cn(
          'aiotto-switch-track',
          checked ? checkedClassName : uncheckedClassName,
          trackClassName,
        )}
      >
        <span
          className={cn(
            'aiotto-switch-thumb',
            checked ? 'translate-x-4' : 'translate-x-0',
            thumbClassName,
          )}
        />
      </span>
    )

    if (variant === 'button' || variant === 'row' || variant === 'toolbar') {
      return (
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            'aiotto-switch-control disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'row'
              && 'aiotto-switch-row flex h-10 w-full items-center justify-between gap-3 aiotto-radius-button bg-background/72 px-3 text-left ring-1 ring-border/40 transition-[background-color,box-shadow] hover:bg-background hover:ring-primary/20',
            variant === 'toolbar'
              && 'aiotto-switch-toolbar aiotto-motion-control liquid-glass-button flex h-10 min-w-10 shrink-0 items-center justify-center gap-3 aiotto-radius-button border border-border/60 bg-background/70 px-3 text-card-foreground shadow-sm backdrop-blur transition-[background-color,border-color,color,box-shadow,opacity] min-[1120px]:px-4',
            className,
          )}
          {...props}
        >
          {trackPosition === 'start' ? track : null}
          {children}
          {trackPosition === 'end' ? track : null}
        </button>
      )
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'aiotto-switch-control inline-flex min-h-10 min-w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {track}
      </button>
    )
  },
)

SwitchControl.displayName = 'SwitchControl'

export { SwitchControl }
