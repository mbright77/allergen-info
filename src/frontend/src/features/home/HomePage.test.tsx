import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { FAVORITES_STORAGE_KEY, HISTORY_STORAGE_KEY } from '../../shared/collections/storage'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../../shared/profile/profile-storage'
import { RECENT_SEARCHES_STORAGE_KEY } from '../../shared/search/recent-searches'
import { HomePage } from './HomePage'

function renderHomePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter([{ path: '/home', element: <HomePage /> }], {
    initialEntries: ['/home'],
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

describe('HomePage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders persisted profile, collections, and recent searches', async () => {
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          {
            id: 'p1',
            name: 'Anna',
            selectedAllergens: ['milk', 'soybeans', 'cereals_containing_gluten'],
            createdAt: '2026-03-21T09:00:00Z',
            updatedAt: '2026-03-21T09:00:00Z',
          },
        ],
      }),
    )
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify([
        {
          gtin: '1',
          name: 'Favorite Product',
          overallStatus: 'Safe',
          updatedAt: '2026-03-21T10:00:00Z',
        },
      ]),
    )
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          gtin: '2',
          name: 'Checked Product',
          overallStatus: 'Contains',
          updatedAt: '2026-03-21T11:00:00Z',
        },
        {
          gtin: '3',
          name: 'Another Product',
          overallStatus: 'MayContain',
          updatedAt: '2026-03-21T12:00:00Z',
        },
      ]),
    )
    window.localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify([
        {
          query: 'oat milk',
          selectedAllergens: ['milk'],
          updatedAt: '2026-03-21T13:00:00Z',
        },
      ]),
    )

    renderHomePage()

    expect(screen.getByText(/Anna is active with 3 monitored allergens/i)).toBeInTheDocument()
    expect(screen.getByText(/3 allergens/i)).toBeInTheDocument()
    expect(screen.getByText(/1 items/i)).toBeInTheDocument()
    expect(screen.getByText(/2 products/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /recent search oat milk/i })).toBeInTheDocument()
  })

  it('renders a recent-search image when one is stored', () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify([
        {
          query: 'oat milk',
          selectedAllergens: ['milk'],
          imageUrl: 'https://cdn.example.com/oat-milk.png',
          updatedAt: '2026-03-21T13:00:00Z',
        },
      ]),
    )

    const { container } = renderHomePage()

    expect(screen.getByRole('link', { name: /recent search oat milk/i })).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/oat-milk.png')
  })

  it('renders recent-search fallback media when no image is stored', () => {
    window.localStorage.setItem(
      RECENT_SEARCHES_STORAGE_KEY,
      JSON.stringify([
        {
          query: 'almond drink',
          selectedAllergens: ['tree_nuts'],
          updatedAt: '2026-03-21T13:00:00Z',
        },
      ]),
    )

    const { container } = renderHomePage()

    expect(screen.getByRole('link', { name: /recent search almond drink/i })).toBeInTheDocument()
    expect(screen.getByText('#A')).toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
