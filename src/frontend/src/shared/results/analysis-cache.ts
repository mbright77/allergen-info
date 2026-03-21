import type { AnalysisResponse } from '../domain/contracts'

const ANALYSIS_CACHE_STORAGE_KEY = 'safescan.analysis-cache.v1'
const MAX_CACHED_ANALYSES = 12

type CachedAnalysisEntry = {
  cacheKey: string
  response: AnalysisResponse
  updatedAt: string
}

export function buildAnalysisCacheKey(gtin: string, selectedAllergens: readonly string[]) {
  const normalizedAllergens = [...selectedAllergens]
    .filter((value) => value.trim().length > 0)
    .map((value) => value.trim().toLowerCase())
    .sort()

  return `${gtin.trim()}::${normalizedAllergens.join('|')}`
}

export function readCachedAnalysis(cacheKey: string): AnalysisResponse | null {
  return readEntries().find((entry) => entry.cacheKey === cacheKey)?.response ?? null
}

export function writeCachedAnalysis(cacheKey: string, response: AnalysisResponse) {
  if (typeof window === 'undefined') {
    return
  }

  const nextEntry: CachedAnalysisEntry = {
    cacheKey,
    response,
    updatedAt: new Date().toISOString(),
  }

  const nextEntries = [nextEntry, ...readEntries().filter((entry) => entry.cacheKey !== cacheKey)].slice(
    0,
    MAX_CACHED_ANALYSES,
  )

  window.localStorage.setItem(ANALYSIS_CACHE_STORAGE_KEY, JSON.stringify(nextEntries))
}

function readEntries(): CachedAnalysisEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(ANALYSIS_CACHE_STORAGE_KEY)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed.filter(isCachedAnalysisEntry) : []
  } catch {
    return []
  }
}

function isCachedAnalysisEntry(value: unknown): value is CachedAnalysisEntry {
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

export { ANALYSIS_CACHE_STORAGE_KEY }
