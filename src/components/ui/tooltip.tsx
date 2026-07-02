import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { computeTooltipLayout, type TooltipPosition, type TooltipSide } from '../tooltipLayout'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export type TooltipVariant = 'compact' | 'rich'

function inferTooltipVariant(content: ReactNode): TooltipVariant {
  if (typeof content === 'string' || typeof content === 'number') {
    const text = String(content).trim()

    return text.length > 18 || text.includes('。') ? 'rich' : 'compact'
  }

  return 'rich'
}

export function Tooltip({
  children,
  className,
  content,
  side = 'top',
  variant,
}: {
  children: ReactElement
  className?: string
  content: ReactNode
  side?: TooltipSide
  variant?: TooltipVariant
}) {
  const [open, setOpen] = useState(false)
  const [instant, setInstant] = useState(false)
  const [position, setPosition] = useState<TooltipPosition | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const resolvedVariant = variant ?? inferTooltipVariant(content)

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
        setInstant(false)
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
              data-text-wrap="pretty"
              data-variant={resolvedVariant}
              role="tooltip"
              style={
                {
                  left: position?.left ?? 0,
                  top: position?.top ?? 0,
                  position: 'fixed',
                  display: 'inline-flex',
                  width: 'max-content',
                  maxWidth: position?.maxWidth ?? 'min(360px, calc(100vw - 24px))',
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  textWrap: 'pretty',
                  pointerEvents: 'none',
                  visibility: position ? 'visible' : 'hidden',
                } satisfies CSSProperties
              }
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
