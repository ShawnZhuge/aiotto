export type CommunitySettingsSnapshot = {
  appearance: {
    colorMode: 'light' | 'dark'
    theme: 'periwinkle' | 'teal' | 'indigo' | 'rose'
  }
  updatedAt: string
}

const settingsStorageKey = 'aiotto-community-settings'

export const loadingSettingsResult: CommunitySettingsSnapshot = {
  appearance: {
    colorMode: 'light',
    theme: 'periwinkle',
  },
  updatedAt: new Date(0).toISOString(),
}

async function readSettings(): Promise<CommunitySettingsSnapshot> {
  const raw = window.localStorage.getItem(settingsStorageKey)
  if (!raw) {
    return loadingSettingsResult
  }

  try {
    return JSON.parse(raw) as CommunitySettingsSnapshot
  } catch {
    return loadingSettingsResult
  }
}

async function saveSettings(settings: CommunitySettingsSnapshot) {
  window.localStorage.setItem(
    settingsStorageKey,
    JSON.stringify({
      ...settings,
      updatedAt: new Date().toISOString(),
    }),
  )
  return settings
}

export const settingsService = {
  loadingSettingsResult,
  readSettings,
  saveSettings,
}
