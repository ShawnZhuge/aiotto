import {
  Archive,
  Check,
  ChevronRight,
  Clock3,
  FolderClock,
  Home,
  Languages,
  Menu,
  MessageSquareText,
  Moon,
  Palette,
  Search,
  Sun,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type RouteId = 'overview' | 'sessions' | 'backups' | 'appearance'
type ColorMode = 'light' | 'dark'
type Accent = 'periwinkle' | 'teal' | 'rose'

type SessionPreview = {
  id: string
  title: string
  project: string
  updatedAt: string
  summary: string
}

const routeItems = [
  { id: 'overview', label: '仪表盘', icon: Home },
  { id: 'sessions', label: '会话', icon: MessageSquareText },
  { id: 'backups', label: '备份', icon: Archive },
  { id: 'appearance', label: '外观', icon: Palette },
] satisfies Array<{ id: RouteId; label: string; icon: typeof Home }>

const sessionPreviews: SessionPreview[] = [
  {
    id: 'session-1',
    title: '梳理桌面工作流',
    project: 'Community Preview',
    updatedAt: '今天 10:24',
    summary: '查看会话列表、项目归属与最近更新时间的公开界面示例。',
  },
  {
    id: 'session-2',
    title: '整理本地项目说明',
    project: 'Documentation',
    updatedAt: '昨天 18:40',
    summary: '保持界面结构可阅读，同时不接入本机数据和私有运行时。',
  },
  {
    id: 'session-3',
    title: '检查备份计划',
    project: 'Workspace',
    updatedAt: '周一 09:12',
    summary: '展示搜索、选择和详情层级等社区壳交互。',
  },
]

const accentOptions: Array<{ id: Accent; label: string; color: string }> = [
  { id: 'periwinkle', label: '长春花', color: '#6673b8' },
  { id: 'teal', label: '青绿', color: '#168377' },
  { id: 'rose', label: '玫瑰', color: '#b85a75' },
]

const storageKeys = {
  accent: 'aiotto-community-accent-v1',
  mode: 'aiotto-community-mode-v1',
} as const

function readInitialMode(): ColorMode {
  const stored = window.localStorage.getItem(storageKeys.mode)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readInitialAccent(): Accent {
  const stored = window.localStorage.getItem(storageKeys.accent)
  return stored === 'teal' || stored === 'rose' || stored === 'periwinkle' ? stored : 'periwinkle'
}

export function App() {
  const [route, setRoute] = useState<RouteId>('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mode, setMode] = useState<ColorMode>(readInitialMode)
  const [accent, setAccent] = useState<Accent>(readInitialAccent)

  const selectMode = (nextMode: ColorMode) => {
    setMode(nextMode)
    window.localStorage.setItem(storageKeys.mode, nextMode)
  }

  const selectAccent = (nextAccent: Accent) => {
    setAccent(nextAccent)
    window.localStorage.setItem(storageKeys.accent, nextAccent)
  }

  const activeRoute = routeItems.find((item) => item.id === route) ?? routeItems[0]

  return (
    <div className="community-app" data-mode={mode} data-accent={accent}>
      <aside className={sidebarCollapsed ? 'sidebar is-collapsed' : 'sidebar'}>
        <div className="brand-block">
          <img src="/assets/app-icon.png" alt="Aiotto" className="brand-icon" />
          {sidebarCollapsed ? null : (
            <div>
              <div className="brand-name">Aiotto</div>
              <div className="brand-edition">Community</div>
            </div>
          )}
        </div>

        <nav className="navigation" aria-label="主导航">
          {routeItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={route === item.id ? 'nav-item is-active' : 'nav-item'}
                aria-current={route === item.id ? 'page' : undefined}
                aria-label={item.label}
                onClick={() => setRoute(item.id)}
              >
                <Icon size={19} strokeWidth={1.9} />
                {sidebarCollapsed ? null : <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <Languages size={18} />
          {sidebarCollapsed ? null : <span>简体中文</span>}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-leading">
            <button
              type="button"
              className="icon-button"
              aria-label={sidebarCollapsed ? '展开侧栏' : '收起侧栏'}
              onClick={() => setSidebarCollapsed((current) => !current)}
            >
              <Menu size={20} />
            </button>
            <div className="topbar-divider" />
            <div>
              <div className="topbar-title">{activeRoute.label}</div>
              <div className="topbar-subtitle">公开社区壳</div>
            </div>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label={mode === 'dark' ? '切换浅色模式' : '切换深色模式'}
            onClick={() => selectMode(mode === 'dark' ? 'light' : 'dark')}
          >
            {mode === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        <section className="page-stage">
          {route === 'overview' ? <OverviewPage onNavigate={setRoute} /> : null}
          {route === 'sessions' ? <SessionsPage /> : null}
          {route === 'backups' ? <BackupsPage /> : null}
          {route === 'appearance' ? (
            <AppearancePage mode={mode} accent={accent} onModeChange={selectMode} onAccentChange={selectAccent} />
          ) : null}
        </section>
      </main>
    </div>
  )
}

function OverviewPage({ onNavigate }: { onNavigate: (route: RouteId) => void }) {
  return (
    <div className="page-content overview-page">
      <section className="intro-panel">
        <div className="intro-copy">
          <h1>一个克制、可构建的社区工作台</h1>
          <p>展示 Aiotto 的桌面布局、会话信息层级、备份体验与主题系统，方便社区查看和改进公开界面。</p>
        </div>
        <div className="edition-mark" aria-label="Community Edition">
          <span>CE</span>
        </div>
      </section>

      <section className="open-layout">
        <div className="feature-list">
          <FeatureRow
            icon={MessageSquareText}
            title="会话界面"
            description="可搜索、选择并查看公开示例会话的摘要。"
            onClick={() => onNavigate('sessions')}
          />
          <FeatureRow
            icon={FolderClock}
            title="备份界面"
            description="展示快照列表、时间和状态的信息结构。"
            onClick={() => onNavigate('backups')}
          />
          <FeatureRow
            icon={Palette}
            title="外观设置"
            description="主题与强调色保存在当前设备的浏览器存储中。"
            onClick={() => onNavigate('appearance')}
          />
        </div>

        <aside className="principles-panel">
          <h2>社区壳原则</h2>
          <ul>
            <li><Check size={16} />保持源码可读、可构建</li>
            <li><Check size={16} />只使用公开示例数据</li>
            <li><Check size={16} />不连接本机业务状态</li>
          </ul>
        </aside>
      </section>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: typeof Home
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button type="button" className="feature-row" onClick={onClick}>
      <span className="feature-icon"><Icon size={20} /></span>
      <span className="feature-copy"><strong>{title}</strong><small>{description}</small></span>
      <ChevronRight size={18} />
    </button>
  )
}

function SessionsPage() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(sessionPreviews[0].id)
  const filteredSessions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return sessionPreviews
    return sessionPreviews.filter((session) =>
      `${session.title} ${session.project} ${session.summary}`.toLocaleLowerCase().includes(normalized),
    )
  }, [query])
  const selected = sessionPreviews.find((session) => session.id === selectedId) ?? filteredSessions[0]

  return (
    <div className="page-content sessions-page">
      <section className="page-heading">
        <div><h1>会话</h1><p>使用公开示例数据展示搜索、选择与详情阅读。</p></div>
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索示例会话" />
        </label>
      </section>

      <section className="split-view">
        <div className="session-list" aria-label="示例会话列表">
          {filteredSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={session.id === selected?.id ? 'session-row is-selected' : 'session-row'}
              onClick={() => setSelectedId(session.id)}
            >
              <span className="session-title">{session.title}</span>
              <span className="session-meta">{session.project} · {session.updatedAt}</span>
            </button>
          ))}
          {filteredSessions.length === 0 ? <div className="empty-state">没有匹配的示例会话。</div> : null}
        </div>
        <article className="session-detail">
          {selected ? (
            <>
              <span className="detail-label">示例详情</span>
              <h2>{selected.title}</h2>
              <p>{selected.summary}</p>
              <div className="detail-meta"><Clock3 size={16} />{selected.updatedAt}</div>
            </>
          ) : <div className="empty-state">选择一条会话查看详情。</div>}
        </article>
      </section>
    </div>
  )
}

function BackupsPage() {
  return (
    <div className="page-content">
      <section className="page-heading">
        <div><h1>备份</h1><p>公开界面示例仅展示快照的信息结构，不读取或修改本机文件。</p></div>
      </section>
      <section className="backup-list">
        {[
          ['界面设置快照', '今天 09:30', '已验证'],
          ['社区壳演示快照', '昨天 16:12', '可用'],
          ['初始配置快照', '周一 08:45', '可用'],
        ].map(([title, time, state]) => (
          <div className="backup-row" key={title}>
            <span className="feature-icon"><Archive size={19} /></span>
            <div><strong>{title}</strong><small>{time}</small></div>
            <span className="state-label">{state}</span>
          </div>
        ))}
      </section>
    </div>
  )
}

function AppearancePage({
  mode,
  accent,
  onModeChange,
  onAccentChange,
}: {
  mode: ColorMode
  accent: Accent
  onModeChange: (mode: ColorMode) => void
  onAccentChange: (accent: Accent) => void
}) {
  return (
    <div className="page-content settings-page">
      <section className="page-heading"><div><h1>外观</h1><p>这些偏好只保存在当前设备中。</p></div></section>
      <section className="settings-section">
        <div className="setting-copy"><h2>显示模式</h2><p>在浅色与深色界面之间切换。</p></div>
        <div className="segmented-control">
          <button type="button" className={mode === 'light' ? 'is-selected' : ''} onClick={() => onModeChange('light')}><Sun size={17} />浅色</button>
          <button type="button" className={mode === 'dark' ? 'is-selected' : ''} onClick={() => onModeChange('dark')}><Moon size={17} />深色</button>
        </div>
      </section>
      <section className="settings-section">
        <div className="setting-copy"><h2>强调色</h2><p>用于选中状态、按钮和焦点提示。</p></div>
        <div className="accent-options">
          {accentOptions.map((option) => (
            <button key={option.id} type="button" className={accent === option.id ? 'accent-option is-selected' : 'accent-option'} onClick={() => onAccentChange(option.id)}>
              <span style={{ background: option.color }} />{option.label}{accent === option.id ? <Check size={16} /> : null}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
