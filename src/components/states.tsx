import { AlertTriangle, Archive, CheckCircle2, Inbox, LockKeyhole, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { AnimatedIcon, AnimatedLoaderIcon } from './animatedLucide'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

type StateActionProps = {
  actionLabel?: string
  onAction?: () => void
}

type SharedActionVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'

type LoadingStep = {
  label: string
  status: 'queued' | 'active' | 'complete'
}

type LoadingLayout = 'panel' | 'compact'

const skeletonBlockClass = 'aiotto-skeleton-shimmer aiotto-radius-button bg-muted/70'

export function SyncActivityPill({
  label = '正在同步',
  className = '',
  testId = 'sync-activity-pill',
}: {
  label?: string
  className?: string
  testId?: string
}) {
  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 aiotto-radius-button border border-border/70 bg-card/85 px-2.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-md ${className}`}
      data-testid={testId}
    >
      <AnimatedIcon icon={AnimatedLoaderIcon} className="h-3 w-3 text-primary" size={12} animate />
      {label}
    </span>
  )
}

function LoadingSkeletonBlock({ className }: { className: string }) {
  return <span className={`${skeletonBlockClass} ${className}`} />
}

function LoadingStateSkeleton({ layout }: { layout: LoadingLayout }) {
  if (layout === 'compact') {
    return (
      <div
        aria-hidden="true"
        className="mt-4 space-y-3"
        data-testid="loading-state-skeleton"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="flex items-center gap-3" key={index}>
            <LoadingSkeletonBlock className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <LoadingSkeletonBlock className="h-3 w-32" />
              <LoadingSkeletonBlock className="h-2.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className="mt-4 grid gap-3 sm:grid-cols-2"
      data-testid="loading-state-skeleton"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="aiotto-radius-inset border border-border/55 bg-background/45 p-3" key={index}>
          <LoadingSkeletonBlock className="mb-3 h-3 w-24" />
          <LoadingSkeletonBlock className="h-7 w-28" />
          <LoadingSkeletonBlock className="mt-3 h-2.5 w-full" />
        </div>
      ))}
    </div>
  )
}

export function DrawingFrameLoadingIndicator({
  label,
  className = '',
}: {
  label: string
  className?: string
}) {
  return (
    <div
      aria-label={label}
      className={`flex min-h-[180px] flex-col items-center justify-center gap-3 text-center ${className}`}
      data-aiotto-loading-kind="drawing-frame"
      data-testid="drawing-frame-loading-indicator"
      role="status"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
        <AnimatedIcon icon={AnimatedLoaderIcon} className="h-5 w-5" size={20} animate />
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

function stateAction({ actionLabel, onAction }: StateActionProps) {
  if (!actionLabel) {
    return null
  }

  return (
    <div className="ui-state-actions">
      <Button variant="outline" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}

function stateButtonVariant(variant: SharedActionVariant) {
  switch (variant) {
    case 'primary':
      return 'default'
    case 'secondary':
      return 'outline'
    case 'destructive':
      return 'destructive'
    case 'ghost':
      return 'ghost'
  }
}

function StateIcon({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'loading' | 'empty' | 'error' | 'warning' | 'permission'
}) {
  return <span className={`ui-state-icon ui-state-icon--${tone}`}>{children}</span>
}

export function LoadingState({
  title,
  description,
  steps = [],
  layout = 'panel',
}: {
  title: string
  description: string
  steps?: LoadingStep[]
  layout?: LoadingLayout
}) {
  return (
    <div
      aria-busy="true"
      aria-label={title}
      className={`ui-state-panel ui-state-panel--loading aiotto-radius-card border border-border/70 bg-card/70 p-4 shadow-sm ${
        layout === 'compact' ? 'text-left' : ''
      }`}
      data-aiotto-loading-layout={layout}
      role="status"
    >
      <div className="flex items-start gap-3">
        <StateIcon tone="loading">
          <AnimatedIcon icon={AnimatedLoaderIcon} className="h-5 w-5" size={20} animate />
        </StateIcon>
        <div className="ui-state-content min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ui-state-content">
        {steps.length > 0 ? (
          <div className="ui-state-steps mt-4 flex flex-wrap gap-2" aria-label={`${title}步骤`}>
            {steps.map((step) => (
              <span
                className={`ui-state-step ui-state-step--${step.status} inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground`}
                key={step.label}
              >
                {step.status === 'complete' ? <CheckCircle2 className="h-3 w-3" /> : <span className="ui-state-step-dot h-1.5 w-1.5 rounded-full bg-primary/70" />}
                {step.label}
              </span>
            ))}
          </div>
        ) : null}
        <LoadingStateSkeleton layout={layout} />
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
} & StateActionProps) {
  return (
    <div className="ui-state-panel ui-state-panel--empty">
      <StateIcon tone="empty">
        <Inbox />
      </StateIcon>
      <div className="ui-state-content">
        <h2>{title}</h2>
        <p>{description}</p>
        {stateAction({ actionLabel, onAction })}
      </div>
    </div>
  )
}

export function ErrorState({
  title,
  reason,
  impact,
  recovery,
  actionLabel,
  onAction,
  badgeLabel = '需要处理',
}: {
  title: string
  reason: string
  impact: string
  recovery: string
  badgeLabel?: string
} & StateActionProps) {
  return (
    <div aria-label={title} className="ui-state-panel ui-state-panel--error" role="alert">
      <StateIcon tone="error">
        <XCircle />
      </StateIcon>
      <div className="ui-state-content">
        <Badge variant="outline" className="border-warning/20 bg-warning-soft text-warning">{badgeLabel}</Badge>
        <h2>{title}</h2>
        <dl className="ui-state-detail-list">
          <div>
            <dt>原因</dt>
            <dd>{reason}</dd>
          </div>
          <div>
            <dt>影响</dt>
            <dd>{impact}</dd>
          </div>
          <div>
            <dt>恢复</dt>
            <dd>{recovery}</dd>
          </div>
        </dl>
        {stateAction({ actionLabel, onAction })}
      </div>
    </div>
  )
}

export function WarningState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string
  message: string
} & StateActionProps) {
  return (
    <div aria-label={title} className="ui-state-panel ui-state-panel--warning" role="alert">
      <StateIcon tone="warning">
        <AlertTriangle />
      </StateIcon>
      <div className="ui-state-content">
        <Badge variant="outline" className="border-warning/20 bg-warning-soft text-warning">建议关注</Badge>
        <h2>{title}</h2>
        <p>{message}</p>
        {stateAction({ actionLabel, onAction })}
      </div>
    </div>
  )
}

export function PermissionState({
  path,
  onOpenSettings,
}: {
  path: string
  onOpenSettings?: () => void
}) {
  return (
    <div aria-label="权限不足" className="ui-state-panel ui-state-panel--permission" role="alert">
      <StateIcon tone="permission">
        <LockKeyhole />
      </StateIcon>
      <div className="ui-state-content">
        <Badge variant="outline" className="border-destructive/20 bg-danger-soft text-destructive">权限不足</Badge>
        <h2>权限不足</h2>
        <p>Aiotto 无法读取 {path}，当前配置不会被修改。</p>
        <p>请在 macOS 隐私与安全性中允许访问后重新扫描。</p>
        {stateAction({ actionLabel: '打开权限设置', onAction: onOpenSettings })}
      </div>
    </div>
  )
}

export function BackupEmptyState({ onCreateBackup }: { onCreateBackup?: () => void }) {
  return (
    <EmptyState
      title="暂无备份"
      description="创建首次备份后，恢复前保护、manifest 和文件 hash 会显示在这里。"
      actionLabel="创建备份"
      onAction={onCreateBackup}
    />
  )
}

export function RestoreWarningState({ onOpenBackup }: { onOpenBackup?: () => void }) {
  return (
    <WarningState
      title="恢复前请确认备份"
      message="恢复动作会先创建恢复前备份，建议先确认目标快照和敏感文件标记。"
      actionLabel="查看备份"
      onAction={onOpenBackup}
    />
  )
}

export function ArchiveStateIcon() {
  return (
    <StateIcon tone="empty">
      <Archive />
    </StateIcon>
  )
}

export function AsyncActionButton({
  label,
  busyLabel = label,
  busy = false,
  disabled = false,
  variant = 'primary',
  onClick,
}: {
  label: string
  busyLabel?: string
  busy?: boolean
  disabled?: boolean
  variant?: SharedActionVariant
  onClick?: () => void
}) {
  return (
    <Button aria-busy={busy ? 'true' : 'false'} disabled={disabled || busy} variant={stateButtonVariant(variant)} onClick={onClick}>
      {busy ? <AnimatedIcon icon={AnimatedLoaderIcon} className="h-4 w-4" size={16} animate /> : null}
      {busy ? busyLabel : label}
    </Button>
  )
}

export function ConfirmActionButton({
  label,
  confirmLabel,
  confirmation,
  disabled = false,
  variant = 'destructive',
  onConfirm,
}: {
  label: string
  confirmLabel: string
  confirmation: string
  disabled?: boolean
  variant?: SharedActionVariant
  onConfirm: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <Button
        disabled={disabled}
        variant={confirming ? stateButtonVariant(variant) : 'outline'}
        onClick={() => {
          if (!confirming) {
            setConfirming(true)
            return
          }

          onConfirm()
          setConfirming(false)
        }}
      >
        {confirming ? confirmLabel : label}
      </Button>
      {confirming ? (
        <p className="text-xs text-muted-foreground" role="status">
          {confirmation}
        </p>
      ) : null}
    </div>
  )
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p aria-label={message} className="text-xs font-medium text-destructive" id={id} role="alert">
      {message}
    </p>
  )
}
