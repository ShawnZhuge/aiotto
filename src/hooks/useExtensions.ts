import { useState, useEffect } from 'react'
import type { CodexExtensionInventory } from '../domain/extensionInventory'
import { extensionsService } from '../services'

export interface Extension {
  id: string
  name: string
  version: string
  enabled: boolean
  healthy: boolean
  description: string
  author?: string
}

export function useExtensions() {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [inventory, setInventory] = useState<CodexExtensionInventory>(extensionsService.loadingInventory)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExtensions()
  }, [])

  async function loadExtensions() {
    try {
      setLoading(true)
      setError(null)

      const result = await extensionsService.loadExtensionInventory()

      setInventory(result)
      setExtensions([])
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载扩展失败')
      console.error('Failed to load extensions:', err)

      // 失败时使用空数组
      setExtensions([])
      setInventory(extensionsService.loadingInventory)
    } finally {
      setLoading(false)
    }
  }

  async function toggleExtension(extensionId: string) {
    try {
      await extensionsService.toggleExtension(extensionId)
      await extensionsService.checkExtensionHealth()
      await loadExtensions()
    } catch (err) {
      console.error('Failed to toggle extension:', err)
      throw err
    }
  }

  async function checkHealth() {
    try {
      await loadExtensions()
    } catch (err) {
      console.error('Failed to check extension health:', err)
      throw err
    }
  }

  return {
    extensions,
    inventory,
    loading,
    error,
    reload: loadExtensions,
    toggleExtension,
    checkHealth,
  }
}
