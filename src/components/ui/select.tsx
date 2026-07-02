import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
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
