import { EmptyState, ErrorState, LoadingState, PermissionState } from '../states'

type PageStateKind = 'loading' | 'empty' | 'error' | 'permission'
type PageStateDensity = 'default' | 'compact'

export function PageState({
  kind,
  title,
  description,
  recovery = '请重试，或打开维护工具查看最近事件。',
  path = '',
  actionLabel,
  onAction,
  density = 'default',
}: {
  kind: PageStateKind
  title: string
  description: string
  recovery?: string
  path?: string
  actionLabel?: string
  onAction?: () => void
  density?: PageStateDensity
}) {
  const state = (() => {
    switch (kind) {
      case 'loading':
        return <LoadingState title={title} description={description} />
      case 'empty':
        return <EmptyState title={title} description={description} actionLabel={actionLabel} onAction={onAction} />
      case 'permission':
        return <PermissionState path={path || description} onOpenSettings={onAction} />
      case 'error':
        return (
          <ErrorState
            title={title}
            reason={description}
            impact="当前页面无法继续展示最新数据。"
            recovery={recovery}
            actionLabel={actionLabel}
            onAction={onAction}
          />
        )
    }
  })()

  return density === 'compact' ? <div className="page-state-compact">{state}</div> : state
}
