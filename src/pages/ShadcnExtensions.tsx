import { Boxes, Folder, Puzzle, RefreshCw, Sparkles, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useExtensions } from '../hooks/useExtensions'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'

type CatalogKind = 'all' | 'skill' | 'mcp'

export function ShadcnExtensions() {
  return <ExtensionsCatalog kind="all" />
}

export function ShadcnSkills() {
  return <ExtensionsCatalog kind="skill" />
}

export function ShadcnMcp() {
  return <ExtensionsCatalog kind="mcp" />
}

function ExtensionsCatalog({ kind }: { kind: CatalogKind }) {
  const { inventory, loading, error, reload } = useExtensions()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const combined = [
      ...inventory.skills.map((skill) => ({
        id: `skill:${skill.name}`,
        kind: 'Skill',
        title: skill.name,
        description: skill.description || skill.path,
        path: skill.path,
      })),
      ...inventory.mcpServers.map((server) => ({
        id: `mcp:${server.name}`,
        kind: 'MCP',
        title: server.name,
        description: server.command || 'MCP server',
        path: server.configPath || inventory.configPath,
      })),
    ]
    return combined.filter((row) => {
      const kindMatched =
        kind === 'all' ||
        (kind === 'skill' && row.kind === 'Skill') ||
        (kind === 'mcp' && row.kind === 'MCP')
      const queryMatched =
        !normalizedQuery ||
        `${row.title} ${row.description} ${row.path}`.toLowerCase().includes(normalizedQuery)
      return kindMatched && queryMatched
    })
  }, [inventory, kind, query])
  const title = kind === 'skill' ? 'Skills' : kind === 'mcp' ? 'MCP' : '扩展'

  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-normal">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">查看本地技能与 MCP 清单。</p>
          </div>
          <Button variant="outline" onClick={() => void reload()}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </section>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-xl font-semibold">清单</CardTitle>
              <Input
                className="h-10 max-w-sm rounded-[14px]"
                placeholder="搜索名称或路径..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 p-6 pt-0">
            {loading ? (
              <EmptyLike icon={RefreshCw} title="正在加载" description="正在读取本地扩展清单。" />
            ) : error ? (
              <EmptyLike icon={Folder} title="读取失败" description={error} />
            ) : rows.length === 0 ? (
              <EmptyLike icon={Boxes} title="暂无匹配项" description="调整搜索条件后再试。" />
            ) : (
              rows.map((row) => (
                <div key={row.id} className="flex items-start gap-4 rounded-[16px] border border-border/70 bg-background/60 p-4">
                  <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-primary/10 text-primary">
                    {row.kind === 'Skill' ? <Sparkles className="h-5 w-5" /> : <Puzzle className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{row.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{row.description}</div>
                    <div className="mt-2 truncate font-mono text-xs text-muted-foreground">{row.path}</div>
                  </div>
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">{row.kind}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyLike({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-border/80 bg-background/55 p-10 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{description}</div>
    </div>
  )
}

export default ShadcnExtensions
