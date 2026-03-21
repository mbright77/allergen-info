const RECENT_SEARCHES_STORAGE_KEY = 'safescan.recent-searches.v1'
const MAX_RECENT_SEARCHES = 6

export type RecentSearchEntry = {
  query: string
  selectedAllergens: string[]
  updatedAt: string
}

export function readRecentSearches(): RecentSearchEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isRecentSearchEntry)
  } catch {
    return []
  }
}

export function saveRecentSearch(query: string, selectedAllergens: readonly string[]) {
  if (typeof window === 'undefined') {
    return
  }

  const trimmedQuery = query.trim()

  if (!trimmedQuery) {
    return
  }

  const nextEntry: RecentSearchEntry = {
    query: trimmedQuery,
    selectedAllergens: [...selectedAllergens],
    updatedAt: new Date().toISOString(),
  }

  const currentEntries = readRecentSearches()
  const deduplicatedEntries = currentEntries.filter(
    (entry) => entry.query.localeCompare(trimmedQuery, undefined, { sensitivity: 'accent' }) !== 0,
  )

  const nextEntries = [nextEntry, ...deduplicatedEntries].slice(0, MAX_RECENT_SEARCHES)
  window.localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextEntries))
}

function isRecentSearchEntry(value: unknown): value is RecentSearchEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.query === 'string' &&
    Array.isArray(candidate.selectedAllergens) &&
    candidate.selectedAllergens.every((item) => typeof item === 'string') &&
    typeof candidate.updatedAt === 'string'
  )
}

export { RECENT_SEARCHES_STORAGE_KEY }
