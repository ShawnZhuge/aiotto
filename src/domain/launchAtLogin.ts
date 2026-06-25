export type LaunchAtLoginStatus =
  | 'not_configured'
  | 'sandbox_enabled'
  | 'disabled'
  | 'browser_preview'
  | 'error'

export type LaunchAtLoginState = {
  enabled: boolean
  status: LaunchAtLoginStatus
  recordPath: string
  message: string
  requiresReleasePackageValidation: boolean
}

export type LaunchAtLoginInvoke = (command: string, args?: unknown) => Promise<unknown>

export type LaunchAtLoginDeps = {
  invoke?: LaunchAtLoginInvoke
}

export async function getLaunchAtLoginStatusWithFallback(
  deps: LaunchAtLoginDeps = {},
): Promise<LaunchAtLoginState> {
  if (deps.invoke) {
    return normalizeLaunchAtLoginState(await deps.invoke('get_launch_at_login_status', { manualPath: null }))
  }

  if (!hasTauriRuntime()) {
    return createBrowserPreviewLaunchAtLoginState()
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return normalizeLaunchAtLoginState(await invoke<LaunchAtLoginState>('get_launch_at_login_status', { manualPath: null }))
  } catch (error) {
    return createLaunchAtLoginErrorState(error)
  }
}

export async function setLaunchAtLoginEnabledWithFallback(
  enabled: boolean,
  deps: LaunchAtLoginDeps = {},
): Promise<LaunchAtLoginState> {
  if (deps.invoke) {
    return normalizeLaunchAtLoginState(
      await deps.invoke('set_launch_at_login_enabled', {
        request: { enabled, manualPath: null },
      }),
    )
  }

  if (!hasTauriRuntime()) {
    return createBrowserPreviewLaunchAtLoginState()
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return normalizeLaunchAtLoginState(
      await invoke<LaunchAtLoginState>('set_launch_at_login_enabled', {
        request: { enabled, manualPath: null },
      }),
    )
  } catch (error) {
    return createLaunchAtLoginErrorState(error)
  }
}

export function formatLaunchAtLoginStatus(status: LaunchAtLoginStatus): string {
  const labels: Record<LaunchAtLoginStatus, string> = {
    not_configured: '未配置',
    sandbox_enabled: '沙盒已启用',
    disabled: '已关闭',
    browser_preview: '浏览器预览',
    error: '读取失败',
  }

  return labels[status]
}

function normalizeLaunchAtLoginState(input: unknown): LaunchAtLoginState {
  const partial = input as Partial<LaunchAtLoginState>
  const status = sanitizeLaunchAtLoginStatus(partial.status)

  return {
    enabled: Boolean(partial.enabled),
    status,
    recordPath: partial.recordPath ?? '',
    message: partial.message || 'Launch at Login 状态已读取。',
    requiresReleasePackageValidation: partial.requiresReleasePackageValidation ?? true,
  }
}

function sanitizeLaunchAtLoginStatus(status: unknown): LaunchAtLoginStatus {
  return ['not_configured', 'sandbox_enabled', 'disabled', 'browser_preview', 'error'].includes(String(status))
    ? (status as LaunchAtLoginStatus)
    : 'error'
}

function createBrowserPreviewLaunchAtLoginState(): LaunchAtLoginState {
  return {
    enabled: false,
    status: 'browser_preview',
    recordPath: '',
    message: '浏览器预览不会修改 macOS Login Item；桌面端会写入 Aiotto 沙盒意图并等待发布包验收。',
    requiresReleasePackageValidation: true,
  }
}

function createLaunchAtLoginErrorState(error: unknown): LaunchAtLoginState {
  const reason = error instanceof Error ? error.message : String(error)

  return {
    enabled: false,
    status: 'error',
    recordPath: '',
    message: `Launch at Login 状态读取失败：${reason}`,
    requiresReleasePackageValidation: true,
  }
}

function hasTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
