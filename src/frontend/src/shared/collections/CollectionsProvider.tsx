import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import {
  readFavorites,
  readHistory,
  writeFavorites,
  writeHistory,
  type SavedProductItem,
} from './storage'
import { CollectionsContext, type CollectionsContextValue } from './CollectionsContext'

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
