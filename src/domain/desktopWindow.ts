export type DesktopWindowResetStatus = 'reset' | 'browser_preview' | 'error'

export type DesktopWindowResetResult = {
  status: DesktopWindowResetStatus
  width: number
  height: number
  minWidth: number
  minHeight: number
  message: string
}

export type DesktopWindowInvoke = (command: string, args?: unknown) => Promise<unknown>

export type DesktopWindowDeps = {
  invoke?: DesktopWindowInvoke
}

export const defaultMainWindowSize = {
  width: 1200,
  height: 800,
  minWidth: 960,
  minHeight: 640,
} as const

export async function resetMainWindowToDefaultSizeWithFallback(
  deps: DesktopWindowDeps = {},
): Promise<DesktopWindowResetResult> {
  if (deps.invoke) {
    return normalizeDesktopWindowResetResult(await deps.invoke('reset_main_window_to_default_size'))
  }

  if (!hasTauriRuntime()) {
    return createBrowserPreviewResetResult()
  }

  try {
    const { invoke } = await import('@tauri-apps/api/core')
    return normalizeDesktopWindowResetResult(await invoke<DesktopWindowResetResult>('reset_main_window_to_default_size'))
  } catch (error) {
    return createDesktopWindowResetErrorResult(error)
  }
}

function normalizeDesktopWindowResetResult(input: unknown): DesktopWindowResetResult {
  const partial = input as Partial<DesktopWindowResetResult>

  return {
    status: sanitizeDesktopWindowResetStatus(partial.status),
    width: numberOrDefault(partial.width, defaultMainWindowSize.width),
    height: numberOrDefault(partial.height, defaultMainWindowSize.height),
    minWidth: numberOrDefault(partial.minWidth, defaultMainWindowSize.minWidth),
    minHeight: numberOrDefault(partial.minHeight, defaultMainWindowSize.minHeight),
    message: partial.message || `主窗口已重置为 ${defaultMainWindowSize.width} x ${defaultMainWindowSize.height}。`,
  }
}

function sanitizeDesktopWindowResetStatus(status: unknown): DesktopWindowResetStatus {
  return status === 'reset' || status === 'browser_preview' || status === 'error' ? status : 'error'
}

function numberOrDefault(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function createBrowserPreviewResetResult(): DesktopWindowResetResult {
  return {
    status: 'browser_preview',
    ...defaultMainWindowSize,
    message: '浏览器预览不会修改桌面窗口大小；桌面版会重置为 1200 x 800。',
  }
}

function createDesktopWindowResetErrorResult(error: unknown): DesktopWindowResetResult {
  const reason = error instanceof Error ? error.message : String(error)

  return {
    status: 'error',
    ...defaultMainWindowSize,
    message: `主窗口默认大小重置失败：${reason}`,
  }
}

function hasTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
