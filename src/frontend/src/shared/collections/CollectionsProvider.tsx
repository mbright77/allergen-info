import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import {
  readFavorites,
  readHistory,
  writeFavorites,
  writeHistory,
  type SavedProductItem,
} from './storage'
import { CollectionsContext, type CollectionsContextValue } from './CollectionsContext'
import { useProfile } from '../profile/useProfile'

export function CollectionsProvider({ children }: PropsWithChildren) {
  const { activeProfileId } = useProfile()
  const [favorites, setFavorites] = useState<SavedProductItem[]>(() => readFavorites(activeProfileId))
  const [history, setHistory] = useState<SavedProductItem[]>(() => readHistory())

  useEffect(() => {
    setFavorites(readFavorites(activeProfileId))
  }, [activeProfileId])

  useEffect(() => {
    writeFavorites(activeProfileId, favorites)
  }, [activeProfileId, favorites])

  useEffect(() => {
    writeHistory(history)
  }, [history])

  const isFavorite = useCallback(
    (gtin: string) => favorites.some((item) => item.gtin === gtin),
    [favorites],
  )

  const toggleFavorite = useCallback((item: SavedProductItem) => {
    if (!activeProfileId) {
      return
    }

    setFavorites((current) =>
      current.some((entry) => entry.gtin === item.gtin)
        ? current.filter((entry) => entry.gtin !== item.gtin)
        : [item, ...current],
    )
  }, [activeProfileId])

  const addHistoryEntry = useCallback((item: SavedProductItem) => {
    setHistory((current) => [item, ...current.filter((entry) => entry.gtin !== item.gtin)])
  }, [])

  const value = useMemo<CollectionsContextValue>(
    () => ({ favorites, history, isFavorite, toggleFavorite, addHistoryEntry }),
    [favorites, history, isFavorite, toggleFavorite, addHistoryEntry],
  )

  return <CollectionsContext.Provider value={value}>{children}</CollectionsContext.Provider>
}
