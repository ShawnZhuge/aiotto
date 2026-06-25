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
}: {
  title: string
  description: string
  steps?: LoadingStep[]
}) {
  return (
    <div aria-busy="true" aria-label={title} className="ui-state-panel ui-state-panel--loading" role="status">
      <StateIcon tone="loading">
        <AnimatedIcon icon={AnimatedLoaderIcon} className="h-5 w-5" size={20} animate />
      </StateIcon>
      <div className="ui-state-content">
        <h2>{title}</h2>
        <p>{description}</p>
        {steps.length > 0 ? (
          <div className="ui-state-steps" aria-label={`${title}步骤`}>
            {steps.map((step) => (
              <span className={`ui-state-step ui-state-step--${step.status}`} key={step.label}>
                {step.status === 'complete' ? <CheckCircle2 /> : <span className="ui-state-step-dot" />}
                {step.label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="ui-state-skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
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
