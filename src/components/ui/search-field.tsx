import * as React from 'react'
import { Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Input } from './input'

type SearchFieldProps = Omit<
  React.ComponentPropsWithoutRef<'input'>,
  'aria-label' | 'onChange' | 'type'
> & {
  ariaLabel: string
  clearLabel?: string
  containerClassName?: string
  iconClassName?: string
  inputClassName?: string
  onClear?: () => void
  onValueChange: (value: string) => void
  showClearButton?: boolean
  size?: 'md' | 'sm'
  tone?: 'default' | 'glass' | 'toolbar'
}

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      ariaLabel,
      className,
      clearLabel,
      containerClassName,
      disabled,
      iconClassName,
      inputClassName,
      onClear,
      onKeyDown,
      onValueChange,
      readOnly,
      showClearButton = true,
      size = 'md',
      tone = 'default',
      value,
      ...props
    },
    ref,
  ) => {
    const inputValue = value == null ? '' : String(value)
    const canClear = showClearButton && inputValue.length > 0 && !disabled && !readOnly
    const resolvedClearLabel = clearLabel ?? `清除${ariaLabel}`

    const clearValue = () => {
      onClear?.()
      onValueChange('')
    }

    return (
      <div
        className={cn('aiotto-search-field relative', containerClassName, className)}
        data-aiotto-search-field="true"
        data-aiotto-search-filled={inputValue.length > 0 ? 'true' : 'false'}
      >
        <Search
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground',
            iconClassName,
          )}
        />
        <Input
          ref={ref}
          type="search"
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          readOnly={readOnly}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) {
              return
            }

            if (event.key === 'Escape' && canClear) {
              event.preventDefault()
              clearValue()
            }
          }}
          className={cn(
            'aiotto-search-input w-full aiotto-radius-field pl-9 text-foreground placeholder:text-muted-foreground',
            showClearButton ? 'pr-11' : 'pr-3',
            size === 'sm' ? 'h-9 text-sm' : 'h-10 text-sm',
            tone === 'toolbar' && 'aiotto-control-field border-border/60 bg-background/70 shadow-none backdrop-blur',
            tone === 'glass' && 'liquid-glass-field bg-background/55 shadow-none backdrop-blur',
            tone === 'default' && 'border-border/60 bg-background/72 shadow-none',
            inputClassName,
          )}
          {...props}
        />
        {canClear ? (
          <button
            type="button"
            aria-label={resolvedClearLabel}
            className="aiotto-search-clear absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center aiotto-radius-button bg-muted/45 text-muted-foreground/85 shadow-sm shadow-black/[0.03] transition-[background-color,color,box-shadow] hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearValue}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>
    )
  },
)

SearchField.displayName = 'SearchField'

export { SearchField }
