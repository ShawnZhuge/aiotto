import type { ThreadRecord } from './models'
import { createThreadRestoreDetail } from './threadDetails'

export type ThreadTerminalApp = 'Terminal' | 'iTerm2' | 'Ghostty' | 'Warp'

export const supportedThreadTerminalApps: ThreadTerminalApp[] = ['Terminal', 'iTerm2', 'Ghostty', 'Warp']

export type ThreadTerminalOpenRequest = {
  terminalApp: ThreadTerminalApp
  workdir: string
  command: string
}

export type ThreadTerminalBackendResult = {
  terminalApp: ThreadTerminalApp
  workdir: string
  command: string
  status: 'opened'
  fallbackRequired: boolean
  message: string
}

export type ThreadTerminalOpenStatus = 'opened' | 'fallback_copied' | 'fallback_failed' | 'unavailable'

export type ThreadTerminalOpenResult = {
  terminalApp: ThreadTerminalApp
  status: ThreadTerminalOpenStatus
  copiedFallback: boolean
  message: string
  workdir: string | null
  command: string | null
  errorMessage: string | null
  fallbackErrorMessage: string | null
  backendFallbackRequired: boolean | null
}

export type ThreadTerminalOpenDeps = {
  openTerminal?: (request: ThreadTerminalOpenRequest) => Promise<ThreadTerminalBackendResult>
  writeClipboardText?: (text: string) => Promise<void>
}

export async function openThreadRestoreInTerminal(
  thread: ThreadRecord,
  terminalApp: ThreadTerminalApp,
  deps: ThreadTerminalOpenDeps = {},
): Promise<ThreadTerminalOpenResult> {
  const restoreDetail = createThreadRestoreDetail(thread)

  if (!restoreDetail.available || !restoreDetail.command || !restoreDetail.workdir || !restoreDetail.copyText) {
    return {
      terminalApp,
      status: 'unavailable',
      copiedFallback: false,
      message: '当前线程不可恢复。',
      workdir: null,
      command: null,
      errorMessage: null,
      fallbackErrorMessage: null,
      backendFallbackRequired: null,
    }
  }

  const openTerminal = deps.openTerminal ?? invokeOpenThreadRestoreInTerminal
  const writeClipboardText = deps.writeClipboardText ?? defaultWriteClipboardText

  try {
    const result = await openTerminal({
      terminalApp,
      workdir: restoreDetail.workdir,
      command: restoreDetail.command,
    })

    return {
      terminalApp: result.terminalApp,
      status: 'opened',
      copiedFallback: false,
      message: result.message || `${terminalApp} 已打开恢复命令。`,
      workdir: result.workdir || restoreDetail.workdir,
      command: result.command || restoreDetail.command,
      errorMessage: null,
      fallbackErrorMessage: null,
      backendFallbackRequired: Boolean(result.fallbackRequired),
    }
  } catch (openError) {
    const openErrorMessage = getErrorMessage(openError)
    try {
      await writeClipboardText(restoreDetail.copyText)

      return {
        terminalApp,
        status: 'fallback_copied',
        copiedFallback: true,
        message: `${terminalApp} 打开失败，恢复命令已复制。`,
        workdir: restoreDetail.workdir,
        command: restoreDetail.command,
        errorMessage: openErrorMessage,
        fallbackErrorMessage: null,
        backendFallbackRequired: null,
      }
    } catch (fallbackError) {
      const fallbackErrorMessage = getErrorMessage(fallbackError)

      return {
        terminalApp,
        status: 'fallback_failed',
        copiedFallback: false,
        message: `${terminalApp} 打开失败，请手动复制恢复命令。`,
        workdir: restoreDetail.workdir,
        command: restoreDetail.command,
        errorMessage: openErrorMessage,
        fallbackErrorMessage,
        backendFallbackRequired: null,
      }
    }
  }
}

async function invokeOpenThreadRestoreInTerminal(
  request: ThreadTerminalOpenRequest,
): Promise<ThreadTerminalBackendResult> {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<ThreadTerminalBackendResult>('open_thread_restore_in_terminal', { request })
}

async function defaultWriteClipboardText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
