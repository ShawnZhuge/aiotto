import { Activity, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { defaultRuntimeEventLedger, summarizeRuntimeEvents } from '../runtime/eventLedger'
import type { AiottoRuntimeEvent } from '../runtime/events'

export function RuntimeDiagnostics() {
  const [events, setEvents] = useState<AiottoRuntimeEvent[]>(() => defaultRuntimeEventLedger.getEvents())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setEvents(defaultRuntimeEventLedger.getEvents())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const summaries = summarizeRuntimeEvents(events)

  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">维护诊断</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">查看公开运行时事件和查询刷新记录。</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              defaultRuntimeEventLedger.clear()
              setEvents([])
            }}
          >
            <Trash2 className="h-4 w-4" />
            清空
          </Button>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          {summaries.map((summary) => (
            <Card key={summary.source} className="rounded-[18px] border-border/70 bg-card/90 shadow-sm">
              <CardContent className="p-5">
                <Activity className="mb-4 h-5 w-5 text-primary" />
                <div className="text-sm text-muted-foreground">{summary.source}</div>
                <div className="mt-2 text-2xl font-semibold">{summary.total}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {summary.latestStatus} · {summary.warningCount} warning · {summary.errorCount} error
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-semibold">事件流</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 p-6 pt-0">
            {events.length === 0 ? (
              <div className="rounded-[18px] border border-dashed border-border/80 bg-background/55 p-10 text-center text-sm text-muted-foreground">
                暂无运行时事件
              </div>
            ) : (
              events.map((event) => (
                <div key={`${event.sequence}-${event.type}`} className="rounded-[14px] border border-border/70 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{event.summary ?? event.type}</span>
                    <span className="font-mono text-xs text-muted-foreground">#{event.sequence}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {event.type} · {event.status ?? 'unknown'} · {new Date(event.receivedAt).toLocaleTimeString()}
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

export default RuntimeDiagnostics
