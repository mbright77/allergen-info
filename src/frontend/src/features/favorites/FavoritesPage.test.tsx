import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { FAVORITES_STORAGE_KEY } from '../../shared/collections/storage'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../../shared/profile/profile-storage'
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

  function seedActiveProfile(profileId = 'p1') {
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: profileId,
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-03-21T09:00:00Z', updatedAt: '2026-03-21T09:00:00Z' },
          { id: 'p2', name: 'Leo', selectedAllergens: ['peanuts'], createdAt: '2026-03-21T09:00:00Z', updatedAt: '2026-03-21T09:00:00Z' },
        ],
      }),
    )
  }

  it('renders persisted favorite products', () => {
    seedActiveProfile()
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({
        p1: [
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
        ],
      }),
    )

    const { container } = renderFavoritesPage()

    expect(screen.getByText(/The Original Oat Milk/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open result/i })).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/oat-milk.png')
  })

  it('renders persisted favorites without image urls', () => {
    seedActiveProfile()
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({
        p1: [
          {
            gtin: '1735000111002',
            name: 'Everyday Almond Drink',
            brand: 'Plenish',
            category: 'Beverage',
            subtitle: 'Unsweetened almond drink',
            overallStatus: 'MayContain',
            updatedAt: '2026-03-21T10:00:00Z',
          },
        ],
      }),
    )

    const { container } = renderFavoritesPage()

    expect(screen.getByText(/Everyday Almond Drink/i)).toBeInTheDocument()
    expect(screen.getByText(/Caution/i)).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('shows only favorites for the active profile', () => {
    seedActiveProfile('p2')
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({
        p1: [
          {
            gtin: '1735000111001',
            name: 'The Original Oat Milk',
            overallStatus: 'Safe',
            updatedAt: '2026-03-21T10:00:00Z',
          },
        ],
        p2: [
          {
            gtin: '1735000111003',
            name: 'Crunchy Peanut Butter',
            overallStatus: 'Contains',
            updatedAt: '2026-03-21T10:00:00Z',
          },
        ],
      }),
    )

    renderFavoritesPage()

    expect(screen.getByText(/Crunchy Peanut Butter/i)).toBeInTheDocument()
    expect(screen.queryByText(/The Original Oat Milk/i)).not.toBeInTheDocument()
  })
})
