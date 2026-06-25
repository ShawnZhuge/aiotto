import codexSourceOpenAiIconUrl from '@/assets/icons/codex-source-openai.svg?url'
import { cn } from '@/lib/utils'

export function CodexSourceIcon({
  className,
  testId,
}: {
  className?: string
  testId: string
}) {
  return (
    <img
      aria-hidden="true"
      className={cn('h-4 w-4 dark:brightness-0 dark:invert', className)}
      data-aiotto-source-icon="codex"
      data-aiotto-source-asset="codex-source-openai.svg"
      data-testid={testId}
      src={codexSourceOpenAiIconUrl}
      alt=""
      draggable={false}
    />
  )
}
