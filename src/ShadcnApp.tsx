import { Bell, Languages, Menu, MessageCircle, Moon, Sun } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from './components/ui/button'
import { useLanguage } from './contexts/LanguageContext'
import { cn } from './lib/utils'
import { getRouteById, getVisibleRouteGroups } from './routes/routeRegistry'
import { RouteHighIoFeedback } from './routes/routeFeedback'
import { preloadRouteOnIntent } from './routes/routePreload'
import { useRoutePrewarm } from './routes/useRoutePrewarm'
import type { AiottoAccentTheme, AiottoColorMode, AiottoRouteId } from './routes/routeTypes'

const colorModeStorageKey = 'aiotto-color-mode'
const themeStorageKey = 'aiotto-accent-theme'

function initialColorMode(): AiottoColorMode {
  const stored = window.localStorage.getItem(colorModeStorageKey)
  if (stored === 'dark' || stored === 'light') {
    return stored
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialTheme(): AiottoAccentTheme {
  const stored = window.localStorage.getItem(themeStorageKey)
  if (stored === 'teal' || stored === 'indigo' || stored === 'rose' || stored === 'periwinkle') {
    return stored
  }
  return 'periwinkle'
}

export function ShadcnApp() {
  const [activeRouteId, setActiveRouteId] = useState<AiottoRouteId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [colorMode, setColorMode] = useState<AiottoColorMode>(initialColorMode)
  const [theme, setTheme] = useState<AiottoAccentTheme>(initialTheme)
  const { language, setLanguage, t } = useLanguage()
  const routeGroups = useMemo(() => getVisibleRouteGroups(), [])
  const activeRoute = getRouteById(activeRouteId)

  useRoutePrewarm()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark')
    window.localStorage.setItem(colorModeStorageKey, colorMode)
  }, [colorMode])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  const routeContext = {
    colorMode,
    onOpenRuntimeDiagnostics: () => setActiveRouteId('runtime-diagnostics'),
    setColorMode,
    setTheme,
    theme,
    toggleLanguage: () => setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN'),
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 transition-[width] duration-200',
          sidebarCollapsed ? 'w-[76px]' : 'w-[236px]',
        )}
      >
        <div className="flex h-[112px] items-center gap-3 px-4">
          <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground shadow">
            AI
          </div>
          {!sidebarCollapsed ? <div className="text-base font-semibold">AIOtto</div> : null}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {routeGroups.map((group) => (
            <div key={group.id} className="space-y-1">
              {group.routes.map((route) => {
                const Icon = route.icon
                const active = route.id === activeRouteId

                return (
                  <button
                    key={route.id}
                    type="button"
                    className={cn(
                      'aiotto-motion-control flex h-11 w-full items-center gap-3 rounded-[12px] px-3 text-sm font-medium text-sidebar-foreground transition-colors',
                      active && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm',
                      sidebarCollapsed && 'justify-center px-0',
                    )}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={() => preloadRouteOnIntent(route.id)}
                    onFocus={() => preloadRouteOnIntent(route.id)}
                    onClick={() => setActiveRouteId(route.id)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed ? <span className="truncate">{t(route.labelKey) === route.labelKey ? route.fallbackLabel : t(route.labelKey)}</span> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className={cn('flex gap-2', sidebarCollapsed ? 'flex-col items-center' : 'items-center')}>
            <Button
              size="icon"
              variant="ghost"
              aria-label="切换语言"
              onClick={routeContext.toggleLanguage}
            >
              <Languages className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="切换明暗模式"
              onClick={() => setColorMode((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Button size="icon" variant="ghost" onClick={() => setSidebarCollapsed((current) => !current)} aria-label="折叠侧栏">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="h-8 w-px bg-border" />
            <div className="text-base font-semibold">{t(activeRoute.labelKey) === activeRoute.labelKey ? activeRoute.fallbackLabel : t(activeRoute.labelKey)}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" aria-label="通知"><Bell className="h-5 w-5" /></Button>
            <Button size="icon" variant="ghost" aria-label="反馈"><MessageCircle className="h-5 w-5" /></Button>
          </div>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden bg-muted/25">
          <RouteHighIoFeedback route={activeRoute} />
          {activeRoute.render(routeContext)}
        </section>
      </main>
    </div>
  )
}

export default ShadcnApp
