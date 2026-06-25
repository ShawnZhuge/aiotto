import { buildExtensionHealthRows } from '../domain/extensionHealth'
import {
  loadCodexExtensionInventoryWithFallback,
  loadingExtensionInventory,
} from '../domain/extensionInventory'

async function toggleExtension(extensionId: string) {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke('toggle_extension', { extensionId })
}

async function checkExtensionHealth(projectPath?: string) {
  const inventory = await loadCodexExtensionInventoryWithFallback(projectPath)
  return buildExtensionHealthRows(inventory.healthChecks)
}

export const extensionsService = {
  loadingInventory: loadingExtensionInventory,
  loadExtensionInventory: loadCodexExtensionInventoryWithFallback,
  toggleExtension,
  checkExtensionHealth,
}
