import { createContext, useContext, useEffect, useId, type ReactNode } from 'react'
import { AnimatedIcon, AnimatedXIcon } from '@/components/animatedLucide'
import { Tooltip } from './tooltip'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function splitDialogContentClasses(className?: string) {
  const classes = className?.split(/\s+/).filter(Boolean) ?? []
  const panelClasses: string[] = []
  const contentClasses: string[] = []

  for (const item of classes) {
    if (/^(?:[a-z]+:)*(?:max-w-|min-w-|w-|max-h-)/.test(item)) {
      panelClasses.push(item)
    } else {
      contentClasses.push(item)
    }
  }

  return {
    contentClassName: contentClasses.join(' '),
    panelClassName: panelClasses.join(' '),
  }
}

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  backdropClassName?: string
  backdropDataScope?: string
  backdropPosition?: 'fixed' | 'absolute'
  backdropTestId?: string
  lockScroll?: boolean
  panelClassName?: string
}

const DialogContext = createContext<{
  onOpenChange: (open: boolean) => void
  panelClassName?: string
  titleId: string
} | null>(null)

export function Dialog({
  open,
  onOpenChange,
  children,
  backdropClassName,
  backdropDataScope,
  backdropPosition = 'fixed',
  backdropTestId = 'aiotto-dialog-backdrop',
  lockScroll = true,
  panelClassName,
}: DialogProps) {
  const titleId = useId()

  useEffect(() => {
    if (!lockScroll) {
      return
    }

    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [lockScroll, open])

  if (!open) {
    return null
  }

  return (
    <DialogContext.Provider value={{ onOpenChange, panelClassName, titleId }}>
      <div
        className={cx(
          'aiotto-dialog-backdrop inset-0 flex items-center justify-center bg-background/45 backdrop-blur-md',
          backdropPosition,
          backdropClassName,
        )}
        data-aiotto-toc-scope={backdropDataScope}
        data-testid={backdropTestId}
        onClick={() => onOpenChange(false)}
      >
        {children}
      </div>
    </DialogContext.Provider>
  )
}

export interface DialogContentProps {
  children: ReactNode
  className?: string
  role?: 'dialog' | 'alertdialog'
  showClose?: boolean
  testId?: string
  onClose?: () => void
}

export function DialogContent({
  children,
  className,
  role = 'dialog',
  showClose = true,
  testId,
  onClose,
}: DialogContentProps) {
  const dialog = useContext(DialogContext)
  const closeDialog = onClose ?? (() => dialog?.onOpenChange(false))
  const { contentClassName, panelClassName } = splitDialogContentClasses(className)

  return (
    <div
      aria-labelledby={dialog?.titleId}
      aria-modal="true"
      className={cx(
        'aiotto-dialog-panel liquid-glass-card relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto overflow-x-hidden border border-border/60 bg-card/90 text-card-foreground shadow-2xl',
        dialog?.panelClassName,
        panelClassName,
      )}
      data-testid={testId}
      role={role}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cx('aiotto-dialog-content p-5', contentClassName)}>
        {showClose && (
          <Tooltip content="关闭" className="absolute right-4 top-4">
            <button
              onClick={closeDialog}
              className="aiotto-dialog-close aiotto-motion-control aiotto-radius-button liquid-glass-button p-2 text-muted-foreground hover:text-foreground"
              aria-label="关闭"
            >
              <AnimatedIcon icon={AnimatedXIcon} className="w-4 h-4 text-muted-foreground" size={16} />
            </button>
          </Tooltip>
        )}
        {children}
      </div>
    </div>
  )
}

export interface DialogHeaderProps {
  children: ReactNode
  className?: string
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cx('mb-5', className)}>{children}</div>
}

export interface DialogTitleProps {
  children: ReactNode
  className?: string
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  const dialog = useContext(DialogContext)

  return <h2 className={cx('text-xl font-bold text-foreground', className)} id={dialog?.titleId}>{children}</h2>
}

export interface DialogDescriptionProps {
  children: ReactNode
  className?: string
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cx('text-sm text-muted-foreground mt-2', className)}>{children}</p>
}

export interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={cx('flex items-center justify-end gap-3 mt-5', className)}>{children}</div>
}
