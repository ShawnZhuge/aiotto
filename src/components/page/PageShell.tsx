import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({
  children,
  className,
  ariaLabel,
  'data-testid': testId,
  'data-shadcn-scroll-root': scrollRoot,
}: {
  children: ReactNode
  className?: string
  ariaLabel: string
  'data-testid'?: string
  'data-shadcn-scroll-root'?: string
}) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn('h-full min-h-0 overflow-y-auto bg-background/40 p-4', className)}
      data-shadcn-scroll-root={scrollRoot}
      data-testid={testId}
      role="region"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4">{children}</div>
    </section>
  )
}
