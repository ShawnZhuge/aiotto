/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Language = 'zh-CN' | 'en-US'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<Language, Record<string, string>> = {
  'zh-CN': {
    'nav.dashboard': '仪表盘',
    'nav.threads': '会话',
    'nav.statistics': '统计',
    'nav.skills': 'Skills',
    'nav.mcp': 'MCP',
    'nav.backup': '备份中心',
    'nav.runtimeDiagnostics': '维护诊断',
    'nav.settings': '设置',
    'common.loading': '加载中...',
    'common.refresh': '刷新',
    'common.empty': '暂无数据',
  },
  'en-US': {
    'nav.dashboard': 'Dashboard',
    'nav.threads': 'Sessions',
    'nav.statistics': 'Statistics',
    'nav.skills': 'Skills',
    'nav.mcp': 'MCP',
    'nav.backup': 'Backups',
    'nav.runtimeDiagnostics': 'Diagnostics',
    'nav.settings': 'Settings',
    'common.loading': 'Loading...',
    'common.refresh': 'Refresh',
    'common.empty': 'No data',
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = window.localStorage.getItem('aiotto-language')
    return stored === 'en-US' ? 'en-US' : 'zh-CN'
  })

  const value = useMemo<LanguageContextType>(
    () => ({
      language,
      setLanguage: (nextLanguage) => {
        window.localStorage.setItem('aiotto-language', nextLanguage)
        setLanguage(nextLanguage)
      },
      t: (key) => translations[language][key] ?? key,
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export type { Language }
