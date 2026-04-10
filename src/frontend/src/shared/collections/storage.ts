import type { AnalysisOverallStatus } from '../domain/contracts'

const FAVORITES_STORAGE_KEY = 'safescan.favorites.v1'
const HISTORY_STORAGE_KEY = 'safescan.history.v1'
const MAX_HISTORY_ITEMS = 20

export type SavedProductItem = {
  gtin: string
  name: string
  brand?: string | null
  category?: string | null
  subtitle?: string | null
  imageUrl?: string | null
  overallStatus: AnalysisOverallStatus
  updatedAt: string
}

export function readFavorites(): SavedProductItem[] {
  return readCollection(FAVORITES_STORAGE_KEY)
}

export function writeFavorites(items: SavedProductItem[]) {
  writeCollection(FAVORITES_STORAGE_KEY, items)
}

export function readHistory(): SavedProductItem[] {
  return readCollection(HISTORY_STORAGE_KEY)
}

export function writeHistory(items: SavedProductItem[]) {
  writeCollection(HISTORY_STORAGE_KEY, items.slice(0, MAX_HISTORY_ITEMS))
}

function readCollection(storageKey: string): SavedProductItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  const rawValue = window.localStorage.getItem(storageKey)

  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed.filter(isSavedProductItem) : []
  } catch {
    return []
  }
}

function writeCollection(storageKey: string, items: SavedProductItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items))
}

function isSavedProductItem(value: unknown): value is SavedProductItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.gtin === 'string' &&
    typeof candidate.name === 'string' &&
    (candidate.imageUrl === undefined || candidate.imageUrl === null || typeof candidate.imageUrl === 'string') &&
    typeof candidate.overallStatus === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

export { FAVORITES_STORAGE_KEY, HISTORY_STORAGE_KEY }
