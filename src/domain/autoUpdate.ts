import {
  createAttentionNotification,
  type AttentionNotification,
} from './attentionNotifications'

export type AutoUpdateStatus =
  | 'idle'
  | 'checking'
  | 'up_to_date'
  | 'available'
  | 'downloading'
  | 'installing'
  | 'restart_required'
  | 'blocked'
  | 'error'

export type AutoUpdatePlatformPackage = {
  signature?: string | null
  url?: string | null
  size?: number | null
}

export type AutoUpdateManifest = {
  version?: string | null
  pubDate?: string | null
  notes?: string | null
  platforms?: Record<string, AutoUpdatePlatformPackage | undefined> | null
}

export type AutoUpdateCheckResult = {
  status: Extract<AutoUpdateStatus, 'up_to_date' | 'available' | 'blocked' | 'error'>
  currentVersion: string
  latestVersion: string | null
  checkedAt: string
  source: string
  releaseNotes: string | null
  packageSizeBytes: number | null
  signatureConfigured: boolean
  downloadUrl: string | null
  errorCode?: string | null
  errorMessage?: string | null
}

export type AutoUpdateState = {
  status: AutoUpdateStatus
  currentVersion: string
  latestVersion: string | null
  checkedAt: string | null
  source: string | null
  releaseNotes: string | null
  packageSizeBytes: number | null
  signatureConfigured: boolean
  downloadUrl: string | null
  downloadProgressPercent: number | null
  blockedReason: string | null
  message: string | null
  errorCode: string | null
}

export type AutoUpdateEvent =
  | { type: 'check_started'; checkedAt: string }
  | { type: 'check_succeeded'; result: AutoUpdateCheckResult }
  | { type: 'download_progress'; downloadedBytes: number; totalBytes: number | null }
  | { type: 'install_started' }
  | { type: 'install_blocked'; reason: string; message: string }
  | { type: 'install_finished'; restartRequired: boolean }
  | { type: 'failed'; errorCode: string; message: string }

export function createInitialAutoUpdateState(currentVersion: string): AutoUpdateState {
  return {
    status: 'idle',
    currentVersion,
    latestVersion: null,
    checkedAt: null,
    source: null,
    releaseNotes: null,
    packageSizeBytes: null,
    signatureConfigured: false,
    downloadUrl: null,
    downloadProgressPercent: null,
    blockedReason: null,
    message: null,
    errorCode: null,
  }
}

export function evaluateUpdateManifest(input: {
  currentVersion: string
  currentPlatform: string
  manifest: AutoUpdateManifest
  checkedAt: string
  source: string
}): AutoUpdateCheckResult {
  const latestVersion = input.manifest.version?.trim() || null
  const platformPackage = input.manifest.platforms?.[input.currentPlatform] ?? null

  if (!latestVersion) {
    return createBlockedResult(input, null, platformPackage, 'missing_version', '更新清单缺少版本号。')
  }

  if (!platformPackage) {
    return createBlockedResult(input, latestVersion, null, 'platform_not_supported', '更新清单缺少当前 macOS 架构包。')
  }

  const signatureConfigured = Boolean(platformPackage.signature?.trim())
  if (!signatureConfigured) {
    return createBlockedResult(input, latestVersion, platformPackage, 'missing_signature', '更新包缺少签名，已阻止安装。')
  }

  if (!platformPackage.url?.trim()) {
    return createBlockedResult(input, latestVersion, platformPackage, 'missing_download_url', '更新包缺少下载地址。')
  }

  if (compareUpdateVersions(input.currentVersion, latestVersion) >= 0) {
    return {
      status: 'up_to_date',
      currentVersion: input.currentVersion,
      latestVersion,
      checkedAt: input.checkedAt,
      source: input.source,
      releaseNotes: input.manifest.notes ?? null,
      packageSizeBytes: normalizePackageSize(platformPackage.size),
      signatureConfigured,
      downloadUrl: platformPackage.url,
    }
  }

  return {
    status: 'available',
    currentVersion: input.currentVersion,
    latestVersion,
    checkedAt: input.checkedAt,
    source: input.source,
    releaseNotes: input.manifest.notes ?? null,
    packageSizeBytes: normalizePackageSize(platformPackage.size),
    signatureConfigured,
    downloadUrl: platformPackage.url,
  }
}

export function compareUpdateVersions(left: string, right: string): number {
  const leftParts = parseVersionParts(left)
  const rightParts = parseVersionParts(right)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0
    if (leftPart > rightPart) {
      return 1
    }
    if (leftPart < rightPart) {
      return -1
    }
  }

  return 0
}

export function reduceAutoUpdateEvent(state: AutoUpdateState, event: AutoUpdateEvent): AutoUpdateState {
  switch (event.type) {
    case 'check_started':
      return {
        ...state,
        status: 'checking',
        checkedAt: event.checkedAt,
        message: '正在检查更新。',
        errorCode: null,
      }
    case 'check_succeeded':
      return {
        ...state,
        status: event.result.status,
        latestVersion: event.result.latestVersion,
        checkedAt: event.result.checkedAt,
        source: event.result.source,
        releaseNotes: event.result.releaseNotes,
        packageSizeBytes: event.result.packageSizeBytes,
        signatureConfigured: event.result.signatureConfigured,
        downloadUrl: event.result.downloadUrl,
        blockedReason: event.result.status === 'blocked' ? event.result.errorCode ?? null : null,
        message: event.result.errorMessage ?? null,
        errorCode: event.result.errorCode ?? null,
      }
    case 'download_progress':
      return {
        ...state,
        status: 'downloading',
        downloadProgressPercent:
          event.totalBytes && event.totalBytes > 0
            ? Math.min(100, Math.max(0, Math.round((event.downloadedBytes / event.totalBytes) * 100)))
            : null,
        message: '正在下载更新。',
      }
    case 'install_started':
      return {
        ...state,
        status: 'installing',
        message: '正在安装更新。',
      }
    case 'install_blocked':
      return {
        ...state,
        status: 'blocked',
        blockedReason: event.reason,
        message: event.message,
        errorCode: event.reason,
      }
    case 'install_finished':
      return {
        ...state,
        status: event.restartRequired ? 'restart_required' : 'up_to_date',
        message: event.restartRequired ? '安装完成，需要重启 Aiotto。' : '安装完成。',
      }
    case 'failed':
      return {
        ...state,
        status: 'error',
        errorCode: event.errorCode,
        message: event.message,
      }
  }
}

export function buildUpdateNotifications(
  results: AutoUpdateCheckResult[],
  createdAt: string,
): AttentionNotification[] {
  return results.flatMap((result) => {
    if (result.status === 'available') {
      return [
        createAttentionNotification({
          id: `update-available-${result.latestVersion ?? 'unknown'}`,
          type: 'update_available',
          priority: 'medium',
          title: 'Aiotto 有新版本',
          body: `${result.currentVersion} -> ${result.latestVersion ?? 'Unknown'}，可在版本与更新中查看说明并安装。`,
          createdAt,
          targetPage: 'settings',
          targetId: 'settings:update',
          targetLabel: '版本与更新',
          system: true,
        }),
      ]
    }

    if (result.status === 'blocked') {
      return [
        createAttentionNotification({
          id: `update-blocked-${result.errorCode ?? 'unknown'}`,
          type: 'update_blocked',
          priority: 'high',
          title: '自动更新已阻止',
          body: result.errorMessage ?? '更新安装前检查未通过。',
          createdAt,
          targetPage: 'settings',
          targetId: 'settings:update',
          targetLabel: '版本与更新',
          system: true,
        }),
      ]
    }

    if (result.status === 'error') {
      return [
        createAttentionNotification({
          id: `update-failed-${result.errorCode ?? 'unknown'}`,
          type: 'update_failed',
          priority: 'high',
          title: '自动更新失败',
          body: result.errorMessage ?? '更新检查失败。',
          createdAt,
          targetPage: 'settings',
          targetId: 'settings:update',
          targetLabel: '版本与更新',
          system: true,
        }),
      ]
    }

    return []
  })
}

function createBlockedResult(
  input: {
    currentVersion: string
    manifest: AutoUpdateManifest
    checkedAt: string
    source: string
  },
  latestVersion: string | null,
  platformPackage: AutoUpdatePlatformPackage | null,
  errorCode: string,
  errorMessage: string,
): AutoUpdateCheckResult {
  return {
    status: 'blocked',
    currentVersion: input.currentVersion,
    latestVersion,
    checkedAt: input.checkedAt,
    source: input.source,
    releaseNotes: input.manifest.notes ?? null,
    packageSizeBytes: normalizePackageSize(platformPackage?.size),
    signatureConfigured: Boolean(platformPackage?.signature?.trim()),
    downloadUrl: platformPackage?.url?.trim() || null,
    errorCode,
    errorMessage,
  }
}

function normalizePackageSize(size: number | null | undefined): number | null {
  return Number.isFinite(size) && Number(size) > 0 ? Number(size) : null
}

function parseVersionParts(version: string): number[] {
  return version
    .replace(/^[^\d]*/, '')
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0))
}
