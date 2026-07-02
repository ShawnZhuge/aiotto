import * as React from 'react'

import { typography } from '@/design/typography'
import { cn } from '@/lib/utils'

type SettingsSurfaceProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  actions?: React.ReactNode
  description?: React.ReactNode
  headerClassName?: string
  title?: React.ReactNode
}

const SettingsSurface = React.forwardRef<HTMLElement, SettingsSurfaceProps>(
  ({ actions, children, className, description, headerClassName, title, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        'aiotto-settings-surface aiotto-radius-card border border-border/70 bg-card/80 p-4 shadow-sm shadow-black/[0.03]',
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <div className={cn('mb-4 flex flex-wrap items-center justify-between gap-3', headerClassName)}>
          <div className="min-w-0">
            {title ? <h2 className={cn(typography.listTitle, 'text-foreground')}>{title}</h2> : null}
            {description ? <p className={cn('mt-1', typography.sectionDescription)}>{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  ),
)

SettingsSurface.displayName = 'SettingsSurface'

function PreviewPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('aiotto-preview-panel min-w-0 aiotto-radius-inset border border-border/70 bg-background p-3', className)}
      {...props}
    />
  )
}

function ControlPanel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('aiotto-control-panel min-w-0 aiotto-radius-inset bg-muted/20 p-4 ring-1 ring-border/40', className)}
      {...props}
    />
  )
}

function ToolbarRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('aiotto-toolbar-row flex flex-wrap items-center justify-between gap-3', className)} {...props} />
}

export { ControlPanel, PreviewPanel, SettingsSurface, ToolbarRow }
