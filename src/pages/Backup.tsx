import { Archive, Clock, Lock, ShieldCheck } from 'lucide-react'
import { useBackups } from '../hooks/useBackups'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export function Backup() {
  const { backups, lockedSnapshotIds, loading, error, reload, createBackup } = useBackups()

  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">备份中心</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">查看本地快照，必要时恢复工作区文件。</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void reload()}>刷新</Button>
            <Button onClick={() => void createBackup('手动备份')}>立即备份</Button>
          </div>
        </section>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-semibold">备份历史</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-6 pt-0">
            {loading ? (
              <div className="rounded-[16px] border border-border/70 bg-muted/30 p-8 text-sm text-muted-foreground">正在读取备份...</div>
            ) : error ? (
              <div className="rounded-[16px] border border-destructive/30 bg-danger-soft p-8 text-sm text-destructive">{error}</div>
            ) : backups.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-border/80 bg-background/55 p-10 text-center">
                <Archive className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <div className="text-base font-semibold">暂无备份</div>
                <div className="mt-2 text-sm text-muted-foreground">创建一次手动备份后会显示在这里。</div>
              </div>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="flex items-center gap-4 rounded-[16px] border border-border/70 bg-background/60 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary/10 text-primary">
                    <Archive className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{backup.note || backup.id}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(backup.createdAtEpochMs).toLocaleString()}</span>
                      {backup.sensitive ? <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />敏感快照</span> : null}
                      {lockedSnapshotIds.includes(backup.id) ? <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" />已锁定</span> : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Backup
