import type { ReactNode } from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { typography } from '../../design/typography'

type PageHeaderAction = {
  label: string
  onClick: () => void
  disabled?: boolean
  icon?: ReactNode
}

export function PageHeader({
  title,
  description,
  statusLabel,
  primaryAction,
  secondaryActions = [],
}: {
  title: string
  description: string
  statusLabel?: string
  primaryAction?: PageHeaderAction
  secondaryActions?: PageHeaderAction[]
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
        <div className="space-y-1">
          <h1 className={typography.pageTitle}>{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryActions.map((action) => (
          <Button key={action.label} onClick={action.onClick} variant="outline" disabled={action.disabled}>
            {action.icon}
            {action.label}
          </Button>
        ))}
        {primaryAction ? (
          <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        ) : null}
      </div>
    </header>
  )
}
