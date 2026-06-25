import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { AiottoAccentTheme, AiottoColorMode } from '../routes/routeTypes'
import { cn } from '../lib/utils'

const themes: Array<{ id: AiottoAccentTheme; label: string }> = [
  { id: 'periwinkle', label: 'Periwinkle' },
  { id: 'teal', label: 'Teal' },
  { id: 'indigo', label: 'Indigo' },
  { id: 'rose', label: 'Rose' },
]

export function ShadcnSettings({
  colorMode = 'light',
  setColorMode,
  setTheme,
  theme = 'periwinkle',
}: {
  colorMode?: AiottoColorMode
  setColorMode?: (value: AiottoColorMode | ((current: AiottoColorMode) => AiottoColorMode)) => void
  setTheme?: (value: AiottoAccentTheme | ((current: AiottoAccentTheme) => AiottoAccentTheme)) => void
  theme?: AiottoAccentTheme
}) {
  return (
    <div className="min-h-full overflow-y-auto px-5 py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
        <section>
          <h1 className="text-2xl font-bold tracking-normal">设置</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">公开版只保留外观与基础运行偏好。</p>
        </section>

        <Card className="rounded-[22px] border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Palette className="h-5 w-5 text-primary" />
              外观
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 pt-0">
            <div>
              <div className="mb-3 text-sm font-semibold">明暗模式</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={colorMode === 'light' ? 'default' : 'outline'}
                  onClick={() => setColorMode?.('light')}
                >
                  <Sun className="h-4 w-4" />
                  浅色
                </Button>
                <Button
                  variant={colorMode === 'dark' ? 'default' : 'outline'}
                  onClick={() => setColorMode?.('dark')}
                >
                  <Moon className="h-4 w-4" />
                  深色
                </Button>
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold">主题色</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'rounded-[16px] border border-border/70 bg-background/60 p-4 text-left transition-colors',
                      theme === item.id && 'border-primary bg-primary/10 text-primary',
                    )}
                    onClick={() => setTheme?.(item.id)}
                  >
                    <span className="mb-4 grid h-10 w-10 place-items-center rounded-[12px] bg-primary/15 text-primary">
                      <Monitor className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ShadcnSettings
