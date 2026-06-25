import type { ThreadMessagePreview } from './models'

const OPERATIONAL_LOG_PATTERNS = [
  /^Chunk ID:\s*[\w-]+(?:\s+Wall time:|\b)/i,
  /^Wall time:\s*[\d.]+/i,
  /^Process exited with code\s+-?\d+/i,
  /^Exit code:\s*-?\d+/i,
  /^Original token count:\s*\d+/i,
  /^Total output lines:\s*\d+/i,
  /^Output:\s*$/i,
]

export function isDisplayableConversationContent(content: string): boolean {
  const text = content.trim()
  if (!text) {
    return false
  }
  if (isToolCallPlaceholder(text)) {
    return false
  }
  return !OPERATIONAL_LOG_PATTERNS.some((pattern) => pattern.test(text))
}

export function isDisplayableConversationMessage(message: ThreadMessagePreview): boolean {
  return message.role !== 'tool' &&
    message.role !== 'developer' &&
    message.role !== 'system' &&
    isDisplayableConversationContent(message.content)
}

function isToolCallPlaceholder(content: string): boolean {
  return /^\[?Tool:\s+/i.test(content.trim())
}
