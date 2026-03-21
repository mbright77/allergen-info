import type { ProductSearchResponse } from '../domain/contracts'

const SEARCH_RESULTS_CACHE_STORAGE_KEY = 'safescan.search-results-cache.v1'
const MAX_CACHED_SEARCHES = 8

type CachedSearchResultsEntry = {
  cacheKey: string
  response: ProductSearchResponse
  updatedAt: string
}

export function buildSearchResultsCacheKey(query: string, selectedAllergens: readonly string[]) {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedAllergens = [...selectedAllergens]
    .filter((value) => value.trim().length > 0)
    .map((value) => value.trim().toLowerCase())
    .sort()

  return `${normalizedQuery}::${normalizedAllergens.join('|')}`
}

export function readCachedSearchResults(cacheKey: string): ProductSearchResponse | null {
  return readEntries().find((entry) => entry.cacheKey === cacheKey)?.response ?? null
}

export function writeCachedSearchResults(cacheKey: string, response: ProductSearchResponse) {
  if (typeof window === 'undefined') {
    return
  }

  const nextEntry: CachedSearchResultsEntry = {
    cacheKey,
    response,
    updatedAt: new Date().toISOString(),
  }

  const nextEntries = [nextEntry, ...readEntries().filter((entry) => entry.cacheKey !== cacheKey)].slice(
    0,
    MAX_CACHED_SEARCHES,
  )

  window.localStorage.setItem(SEARCH_RESULTS_CACHE_STORAGE_KEY, JSON.stringify(nextEntries))
}

function readEntries(): CachedSearchResultsEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(SEARCH_RESULTS_CACHE_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed.filter(isCachedSearchResultsEntry) : []
  } catch {
    return []
  }
}

function isCachedSearchResultsEntry(value: unknown): value is CachedSearchResultsEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.cacheKey === 'string' &&
    typeof candidate.updatedAt === 'string' &&
    !!candidate.response &&
    typeof candidate.response === 'object'
  )
}

export { SEARCH_RESULTS_CACHE_STORAGE_KEY }
