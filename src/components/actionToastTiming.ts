export interface ActionToastReadableContent {
  description?: string | null
  message?: string | null
  title?: string | null
}

const actionToastMinAutoHideMs = 3000
const actionToastMaxAutoHideMs = 8000
const actionToastFreeCharacters = 12
const actionToastMsPerCharacter = 85

function countReadableCharacters(value?: string | null) {
  return Array.from(value?.replace(/\s+/g, '') ?? '').length
}

export function getActionToastAutoHideMs({ description, message, title }: ActionToastReadableContent) {
  const body = description ?? message
  const readableCharacters = countReadableCharacters(title) + countReadableCharacters(body)
  const extraCharacters = Math.max(0, readableCharacters - actionToastFreeCharacters)

  return Math.min(actionToastMaxAutoHideMs, actionToastMinAutoHideMs + extraCharacters * actionToastMsPerCharacter)
}
