import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import type { AnalysisOverallStatus, AnalysisResponse } from '../domain/contracts'
import {
  readFavorites,
  readHistory,
  writeFavorites,
  writeHistory,
  type SavedProductItem,
} from './storage'

type CollectionsContextValue = {
  favorites: SavedProductItem[]
  history: SavedProductItem[]
  isFavorite: (gtin: string) => boolean
  toggleFavorite: (item: SavedProductItem) => void
  addHistoryEntry: (item: SavedProductItem) => void
}

const CollectionsContext = createContext<CollectionsContextValue | null>(null)

export function CollectionsProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<SavedProductItem[]>(() => readFavorites())
  const [history, setHistory] = useState<SavedProductItem[]>(() => readHistory())

  useEffect(() => {
    writeFavorites(favorites)
  }, [favorites])

  useEffect(() => {
    writeHistory(history)
  }, [history])

  const isFavorite = useCallback(
    (gtin: string) => favorites.some((item) => item.gtin === gtin),
    [favorites],
  )

  const toggleFavorite = useCallback((item: SavedProductItem) => {
    setFavorites((current) =>
      current.some((entry) => entry.gtin === item.gtin)
        ? current.filter((entry) => entry.gtin !== item.gtin)
        : [item, ...current],
    )
  }, [])

  const addHistoryEntry = useCallback((item: SavedProductItem) => {
    setHistory((current) => [item, ...current.filter((entry) => entry.gtin !== item.gtin)])
  }, [])

  const value = useMemo<CollectionsContextValue>(
    () => ({ favorites, history, isFavorite, toggleFavorite, addHistoryEntry }),
    [favorites, history, isFavorite, toggleFavorite, addHistoryEntry],
  )

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>
}

export function useCollections() {
  const context = useContext(CollectionsContext)

  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider')
  }

  return context
}

export function toSavedProductItem(response: AnalysisResponse): SavedProductItem {
  return {
    gtin: response.product.gtin,
    name: response.product.name,
    brand: response.product.brand,
    category: response.product.category,
    subtitle: response.product.subtitle,
    overallStatus: response.analysis.overallStatus as AnalysisOverallStatus,
    updatedAt: new Date().toISOString(),
  }
}
