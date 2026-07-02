import { AnimatedIcon, AnimatedListIcon, AnimatedXIcon } from '@/components/animatedLucide'
import { Tooltip } from '../../components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      backdropClassName="min-[1360px]:!hidden p-4"
      backdropDataScope="thread-content-shell"
      backdropPosition="absolute"
      backdropTestId="thread-toc-dialog-backdrop"
      lockScroll={false}
      panelClassName="w-[min(640px,calc(100%-32px))] max-h-[78%] overflow-hidden flex flex-col bg-card/95"
    >
      <DialogContent testId="thread-toc-dialog-panel" showClose={false} className="p-0 flex min-h-0 flex-1 flex-col">
        <DialogHeader className="mb-0 h-14 shrink-0 border-b border-border/60 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center aiotto-radius-field bg-primary/10 text-primary shadow-inner">
              <AnimatedIcon icon={AnimatedListIcon} className="h-[18px] w-[18px]" size={18} />
            </span>
            <DialogTitle className="text-base font-semibold">对话目录</DialogTitle>
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
        </DialogHeader>
        <ThreadTocList items={items} variant="dialog" onSelect={onSelect} />
      </DialogContent>
    </Dialog>
  )
}
