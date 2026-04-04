import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { SEARCH_RESULTS_CACHE_STORAGE_KEY } from '../../shared/search/search-results-cache'
import { SearchResultsPage } from './SearchResultsPage'

function renderSearchResultsPage(query = 'oat') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      { path: '/search/results', element: <SearchResultsPage /> },
      { path: '/results/:gtin', element: <p>Result route</p> },
    ],
    { initialEntries: [`/search/results?q=${query}`] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <RouterProvider router={router} />
      </ProfileProvider>
    </QueryClientProvider>,
  )

  return { router }
}

describe('SearchResultsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('renders backend search results and navigates to the result route', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          query: 'oat',
          results: [
            {
              gtin: '1735000111001',
              name: 'The Original Oat Milk',
              subtitle: 'Clean label oat drink',
              brand: 'Oatly',
              category: 'Beverage',
              imageUrl: 'https://cdn.example.test/oat-medium.jpg',
              packageSize: '1 l',
              articleNumber: 'OAT-1001',
              articleType: 'BaseArticle',
              previewStatus: 'Safe',
              previewBadge: 'Clean Label',
              previewNote: 'Auto-detecting peanuts and cereals containing gluten',
              updatedAt: '2026-03-21T10:00:00Z',
              source: 'placeholder-search',
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const { router } = renderSearchResultsPage()

    const cardButton = await screen.findByRole('button', { name: /view details for the original oat milk/i })
    expect(screen.getAllByText(/Clean Label/i)).toHaveLength(2)
    expect(document.querySelector('.search-card__image')).toHaveAttribute('src', 'https://cdn.example.test/oat-medium.jpg')

    await user.click(cardButton)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/results/1735000111001')
    })
  })

  it('accepts backend timestamps with explicit utc offsets', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          query: 'oat milk',
          results: [
            {
              gtin: '1735000111002',
              name: 'Barista Blend Oat Milk',
              subtitle: 'Barista-style oat drink',
              brand: 'Califia Farms',
              category: 'Beverage',
              imageUrl: null,
              packageSize: '1 l',
              articleNumber: 'CAL-2002',
              articleType: 'BaseArticle',
              previewStatus: 'Safe',
              previewBadge: 'Added Sugars',
              previewNote: 'Placeholder data includes a caution preview for nut traces.',
              updatedAt: '2026-03-21T10:05:00+00:00',
              source: 'placeholder-search',
            },
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderSearchResultsPage('oat milk')

    expect(await screen.findByRole('button', { name: /view details for barista blend oat milk/i })).toBeInTheDocument()
    expect(screen.queryByText(/Search unavailable/i)).not.toBeInTheDocument()
  })

  it('renders an empty state when no results are returned', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ query: 'oat', results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderSearchResultsPage()

    expect(await screen.findByText(/No results yet/i)).toBeInTheDocument()
  })

  it('falls back to cached search results when offline', async () => {
    window.localStorage.setItem(
      SEARCH_RESULTS_CACHE_STORAGE_KEY,
      JSON.stringify([
        {
          cacheKey: 'oat::',
          updatedAt: '2026-03-21T10:00:00Z',
          response: {
            query: 'oat',
            results: [
              {
                gtin: '1735000111001',
                name: 'The Original Oat Milk',
                subtitle: 'Clean label oat drink',
                brand: 'Oatly',
                category: 'Beverage',
                imageUrl: null,
                packageSize: '1 l',
                articleNumber: 'OAT-1001',
                articleType: 'BaseArticle',
                previewStatus: 'Safe',
                previewBadge: 'Clean Label',
                previewNote: 'Cached search result',
                updatedAt: '2026-03-21T10:00:00Z',
                source: 'placeholder-search',
              },
            ],
          },
        },
      ]),
    )

    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('offline'))

    renderSearchResultsPage()

    expect(await screen.findByText(/showing your last saved search results/i)).toBeInTheDocument()
    expect(screen.getByText(/The Original Oat Milk/i)).toBeInTheDocument()
  })
})
