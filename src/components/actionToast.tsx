import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatedIcon, AnimatedXIcon } from '@/components/animatedLucide'
import { cn } from '../lib/utils'
import { getActionToastAutoHideMs } from './actionToastTiming'
import { Tooltip } from './ui'
import { Button } from './ui/button'

export type ActionToastTone = 'success' | 'info' | 'warning' | 'error'

export interface ActionToastProps {
  message?: string | null
  title?: string | null
  description?: string | null
  tone?: ActionToastTone
  stackIndex?: number
  autoHideMs?: number
  onClose?: () => void
}

const toneIcon: Record<ActionToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4" />,
  info: <Info className="size-4" />,
  warning: <AlertTriangle className="size-4" />,
  error: <AlertTriangle className="size-4" />,
}

const actionToastExitMs = 220

export function ActionToast({
  autoHideMs,
  description,
  message,
  onClose,
  stackIndex = 0,
  title,
  tone = 'success',
}: ActionToastProps) {
  const body = description ?? message
  const visible = Boolean(title || body)
  const toastKey = `${tone}\u0000${title ?? ''}\u0000${body ?? ''}`
  const [closingToastKey, setClosingToastKey] = useState<string | null>(null)
  const closing = closingToastKey === toastKey
  const variant = tone === 'success' || tone === 'info' ? 'hud' : 'panel'
  const showClose = Boolean(onClose && variant === 'panel')
  const resolvedAutoHideMs = autoHideMs ?? getActionToastAutoHideMs({ description, message, title })
  const showLifeWash = variant === 'hud' && resolvedAutoHideMs > 0
  const autoHideTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const closeWithAnimation = useCallback(() => {
    if (!onClose || closing) {
      return
    }

    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }

    setClosingToastKey(toastKey)
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      setClosingToastKey(null)
      onClose()
    }, actionToastExitMs)
  }, [closing, onClose, toastKey])

  useEffect(() => {
    clearTimers()

    return clearTimers
  }, [clearTimers, toastKey])

  useEffect(() => {
    if (!visible || closing || !onClose || resolvedAutoHideMs <= 0) {
      return undefined
    }

    autoHideTimerRef.current = window.setTimeout(closeWithAnimation, resolvedAutoHideMs)
    return () => {
      if (autoHideTimerRef.current !== null) {
        window.clearTimeout(autoHideTimerRef.current)
        autoHideTimerRef.current = null
      }
    }
  }, [closeWithAnimation, closing, onClose, resolvedAutoHideMs, visible])

  if (!visible) {
    return null
  }

  return createPortal(
    <div
      aria-label="操作提示"
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn('aiotto-action-toast', title && 'has-title')}
      data-aiotto-action-toast="true"
      data-state={closing ? 'closing' : 'open'}
      data-tone={tone}
      data-variant={variant}
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        '--aiotto-action-toast-life': `${resolvedAutoHideMs}ms`,
        '--aiotto-action-toast-top': `${60 + stackIndex * 70}px`,
      } as CSSProperties}
    >
      {showLifeWash ? (
        <>
          <span className="aiotto-action-toast-fill" aria-hidden="true" />
          <span className="aiotto-action-toast-edge" aria-hidden="true" />
        </>
      ) : null}
      <span className="aiotto-action-toast-icon" aria-hidden="true">
        {toneIcon[tone]}
      </span>
      <div className="aiotto-action-toast-copy">
        {title ? <h3>{title}</h3> : null}
        {body ? <p className={cn(!title && 'is-standalone')}>{body}</p> : null}
      </div>
      {showClose ? (
        <Tooltip content="关闭">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="aiotto-action-toast-close size-8"
            onClick={closeWithAnimation}
            aria-label="关闭操作提示"
          >
            <AnimatedIcon icon={AnimatedXIcon} className="size-4" size={16} />
          </Button>
        </Tooltip>
      ) : null}
    </div>,
    document.body,
  )
}
