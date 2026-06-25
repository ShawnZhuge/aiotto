export type TerminalPreference = 'Terminal' | 'iTerm2' | 'Ghostty' | 'Warp'
export type LanguagePreference = '中文' | 'English'
export type ThemePreference = '浅色' | '深色' | '跟随系统'

export type GlobalPreferences = {
  codexHomePath: string
  defaultTerminal: TerminalPreference
  launchAtLogin: boolean
  refreshIntervalSeconds: number
  language: LanguagePreference
  theme: ThemePreference
}

export type GlobalPreferenceRow = {
  id: keyof GlobalPreferences
  label: string
  valueLabel: string
  typeLabel: '路径' | '选择' | '开关' | '数值'
}

export type GlobalPreferenceValidation = {
  ok: boolean
  message: string
}

export const terminalPreferenceOptions: TerminalPreference[] = ['Terminal', 'iTerm2', 'Ghostty', 'Warp']
export const languagePreferenceOptions: LanguagePreference[] = ['中文', 'English']
export const themePreferenceOptions: ThemePreference[] = ['浅色', '深色', '跟随系统']

export const defaultGlobalPreferences: GlobalPreferences = {
  codexHomePath: '~/.codex',
  defaultTerminal: 'Terminal',
  launchAtLogin: false,
  refreshIntervalSeconds: 30,
  language: '中文',
  theme: '浅色',
}

export function buildGlobalPreferenceRows(preferences: GlobalPreferences): GlobalPreferenceRow[] {
  return [
    {
      id: 'codexHomePath',
      label: 'Codex Home 路径',
      valueLabel: preferences.codexHomePath,
      typeLabel: '路径',
    },
    {
      id: 'defaultTerminal',
      label: '默认终端',
      valueLabel: preferences.defaultTerminal,
      typeLabel: '选择',
    },
    {
      id: 'launchAtLogin',
      label: '开机启动',
      valueLabel: preferences.launchAtLogin ? '开启' : '关闭',
      typeLabel: '开关',
    },
    {
      id: 'refreshIntervalSeconds',
      label: '刷新频率',
      valueLabel: `${preferences.refreshIntervalSeconds} 秒`,
      typeLabel: '数值',
    },
    {
      id: 'language',
      label: '语言',
      valueLabel: preferences.language,
      typeLabel: '选择',
    },
    {
      id: 'theme',
      label: '主题',
      valueLabel: preferences.theme,
      typeLabel: '选择',
    },
  ]
}

export function validateGlobalPreferences(preferences: GlobalPreferences): GlobalPreferenceValidation {
  if (!preferences.codexHomePath.startsWith('~') && !preferences.codexHomePath.startsWith('/')) {
    return {
      ok: false,
      message: 'Codex Home 路径必须以 ~ 或 / 开头。',
    }
  }

  if (preferences.refreshIntervalSeconds < 5) {
    return {
      ok: false,
      message: '刷新频率不能低于 5 秒。',
    }
  }

  return {
    ok: true,
    message: '全局偏好可保存。',
  }
}
