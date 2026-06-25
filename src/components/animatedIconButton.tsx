import type {
  FocusEventHandler,
  ForwardRefExoticComponent,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
  RefAttributes,
} from 'react'
import { forwardRef, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { IconHandle } from '@animateicons/react'

import { Tooltip } from '@/components/ui'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnimatedIconComponent = ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & {
    size?: number
    duration?: number
    isAnimated?: boolean
    color?: string
    className?: string
  } & RefAttributes<IconHandle>
>

export interface AnimatedIconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: AnimatedIconComponent
  label: string
  iconSize?: number
  iconDuration?: number
  iconClassName?: string
  tooltipContent?: ReactNode
}

export const AnimatedIconButton = forwardRef<HTMLButtonElement, AnimatedIconButtonProps>(
  (
    {
      icon: Icon,
      label,
      iconSize = 18,
      iconDuration = 0.9,
      iconClassName,
      tooltipContent,
      className,
      disabled,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const iconRef = useRef<IconHandle>(null)
    const prefersReducedMotion = useReducedMotion()

    const startAnimation = () => {
      if (!disabled && !prefersReducedMotion) {
        iconRef.current?.startAnimation()
      }
    }

    const stopAnimation = () => {
      iconRef.current?.stopAnimation()
    }

    const handleMouseEnter: MouseEventHandler<HTMLButtonElement> = (event) => {
      startAnimation()
      onMouseEnter?.(event)
    }

    const handleMouseLeave: MouseEventHandler<HTMLButtonElement> = (event) => {
      stopAnimation()
      onMouseLeave?.(event)
    }

    const handleFocus: FocusEventHandler<HTMLButtonElement> = (event) => {
      startAnimation()
      onFocus?.(event)
    }

    const handleBlur: FocusEventHandler<HTMLButtonElement> = (event) => {
      stopAnimation()
      onBlur?.(event)
    }

    const button = (
      <Button
        {...props}
        ref={ref}
        disabled={disabled}
        size="icon"
        aria-label={label}
        className={cn('aiotto-animated-icon-button', className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <Icon
          ref={iconRef}
          aria-hidden="true"
          color="currentColor"
          duration={iconDuration}
          size={iconSize}
          className={cn('aiotto-animated-icon pointer-events-none', iconClassName)}
        />
      </Button>
    )

    return <Tooltip content={tooltipContent ?? label}>{button}</Tooltip>
  },
)

AnimatedIconButton.displayName = 'AnimatedIconButton'
