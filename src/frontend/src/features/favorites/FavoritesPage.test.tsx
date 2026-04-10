import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { FAVORITES_STORAGE_KEY } from '../../shared/collections/storage'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { FavoritesPage } from './FavoritesPage'

function renderFavoritesPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter([{ path: '/favorites', element: <FavoritesPage /> }], {
    initialEntries: ['/favorites'],
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <CollectionsProvider>
          <RouterProvider router={router} />
        </CollectionsProvider>
      </ProfileProvider>
    </QueryClientProvider>,
  )
}

describe('FavoritesPage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders persisted favorite products', () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          gtin: '1735000111001',
          name: 'The Original Oat Milk',
          brand: 'Oatly',
          category: 'Beverage',
          subtitle: 'Clean label oat drink',
          imageUrl: 'https://cdn.example.com/oat-milk.png',
          overallStatus: 'Safe',
          updatedAt: '2026-03-21T10:00:00Z',
        },
      ]),
    )

    const { container } = renderFavoritesPage()

    expect(screen.getByText(/The Original Oat Milk/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open result/i })).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/oat-milk.png')
  })

  it('renders persisted favorites without image urls', () => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          gtin: '1735000111002',
          name: 'Everyday Almond Drink',
          brand: 'Plenish',
          category: 'Beverage',
          subtitle: 'Unsweetened almond drink',
          overallStatus: 'MayContain',
          updatedAt: '2026-03-21T10:00:00Z',
        },
      ]),
    )

    const { container } = renderFavoritesPage()

    expect(screen.getByText(/Everyday Almond Drink/i)).toBeInTheDocument()
    expect(screen.getByText(/Caution/i)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
