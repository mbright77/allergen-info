import { useContext } from 'react'

import { CollectionsContext } from './CollectionsContext'

export function useCollections() {
  const context = useContext(CollectionsContext)

  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider')
  }

  return context
}
