import { createContext } from 'react'

import type { SavedProductItem } from './storage'

export type CollectionsContextValue = {
  favorites: SavedProductItem[]
  history: SavedProductItem[]
  isFavorite: (gtin: string) => boolean
  toggleFavorite: (item: SavedProductItem) => void
  addHistoryEntry: (item: SavedProductItem) => void
}

export const CollectionsContext = createContext<CollectionsContextValue | null>(null)
