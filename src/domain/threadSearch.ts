import type { ThreadRecord } from './models'

export function searchThreadsBySummary(threads: ThreadRecord[], query: string): ThreadRecord[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return threads
  }

  return threads.filter((thread) => {
    const searchableText = normalizeSearchText(`${thread.title} ${thread.summary}`)
    return searchableText.includes(normalizedQuery)
  })
}

function normalizeSearchText(value: string): string {
  return value.trim().toLocaleLowerCase()
}
