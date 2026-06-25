import { AnimatedIcon, AnimatedListIcon, AnimatedXIcon } from '@/components/animatedLucide'
import { Tooltip } from '../../components/ui'
import { ThreadTocList } from './panels'
import type { PreparedMessage } from './types'

export function ThreadTocDialog({
  items,
  onClose,
  onSelect,
}: {
  items: PreparedMessage[]
  onClose: () => void
  onSelect: (messageId: string) => void
}) {
  return (
    <div
      data-testid="thread-toc-dialog-backdrop"
      data-aiotto-toc-scope="thread-content-shell"
      className="aiotto-dialog-backdrop min-[1360px]:!hidden absolute inset-0 z-50 bg-background/45 backdrop-blur-md flex items-center justify-center p-6"
    >
      <div
        data-testid="thread-toc-dialog-panel"
        className="aiotto-dialog-panel liquid-glass-card w-[min(640px,calc(100%-48px))] max-h-[78%] rounded-[18px] border border-border/60 bg-card/95 shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="h-14 shrink-0 border-b border-border/60 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary/10 text-primary shadow-inner">
              <AnimatedIcon icon={AnimatedListIcon} className="h-[18px] w-[18px]" size={18} />
            </span>
            <h3 className="text-base font-semibold">对话目录</h3>
          </div>
          <Tooltip content="关闭目录">
            <button
              type="button"
              onClick={onClose}
              className="liquid-glass-button h-9 w-9 rounded-full border border-border text-muted-foreground hover:text-foreground flex items-center justify-center"
              aria-label="关闭目录"
            >
              <AnimatedIcon icon={AnimatedXIcon} className="h-[18px] w-[18px]" size={18} />
            </button>
          </Tooltip>
        </div>
        <ThreadTocList items={items} variant="dialog" onSelect={onSelect} />
      </div>
    </div>
  )
}
