import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../../shared/profile/profile-storage'
import { ANALYSIS_CACHE_STORAGE_KEY } from '../../shared/results/analysis-cache'
import { ProductResultPage } from './ProductResultPage'

function renderProductResultPage(gtin = '1735000111004') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      { path: '/results/:gtin', element: <ProductResultPage /> },
      { path: '/scan', element: <p>Scan route</p> },
    ],
    { initialEntries: [`/results/${gtin}`] },
  )

  render(
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <CollectionsProvider>
          <RouterProvider router={router} />
        </CollectionsProvider>
      </ProfileProvider>
    </QueryClientProvider>,
  )
}

describe('ProductResultPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('renders a warning state from backend analysis data', async () => {
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk', 'soybeans', 'tree_nuts'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          product: {
            gtin: '1735000111004',
            name: 'Milk Chocolate Bar',
            brand: 'Marabou',
            category: 'Chocolate',
            subtitle: 'Classic milk chocolate',
            ingredientsText: 'Sugar, cocoa butter, whey powder (milk), soy lecithin, flavoring.',
            allergenStatements: {
              contains: ['milk', 'soybeans'],
              mayContain: ['tree_nuts'],
            },
            nutritionSummary: {
              energyKcal: 550,
              sugarGrams: 58,
            },
            imageUrl: 'https://cdn.example.test/chocolate.jpg',
            source: 'placeholder',
          },
          analysis: {
            overallStatus: 'Contains',
            matchedAllergens: ['milk', 'soybeans'],
            traceAllergens: ['tree_nuts'],
            checkedAllergens: [
              { code: 'milk', status: 'Contains' },
              { code: 'soybeans', status: 'Contains' },
              { code: 'tree_nuts', status: 'MayContain' },
            ],
            ingredientHighlights: [
              { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk' },
              { text: 'soy lecithin', severity: 'Contains', allergenCode: 'soybeans' },
            ],
            explanations: ['The product contains selected allergens: Milk, Soybeans.'],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderProductResultPage()

    expect(await screen.findByText(/not safe for your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/Milk Chocolate Bar/i)).toBeInTheDocument()
    expect(screen.getByText(/Overall status/i)).toBeInTheDocument()
    expect(screen.getByText(/Ingredient review/i)).toBeInTheDocument()
    expect(document.querySelector('.result-product-card__image')).toHaveAttribute('src', 'https://cdn.example.test/chocolate.jpg')
  })

  it('falls back to a cached analysis when offline', async () => {
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )
    window.localStorage.setItem(
      ANALYSIS_CACHE_STORAGE_KEY,
      JSON.stringify([
        {
          cacheKey: '1735000111004::milk',
          updatedAt: '2026-03-21T10:00:00Z',
          response: {
            product: {
              gtin: '1735000111004',
              name: 'Milk Chocolate Bar',
              brand: 'Marabou',
              category: 'Chocolate',
              subtitle: 'Classic milk chocolate',
              ingredientsText: 'Sugar, cocoa butter, whey powder (milk), soy lecithin, flavoring.',
              allergenStatements: {
                contains: ['milk', 'soybeans'],
                mayContain: ['tree_nuts'],
              },
              nutritionSummary: {
                energyKcal: 550,
                sugarGrams: 58,
              },
              imageUrl: null,
              source: 'placeholder',
            },
            analysis: {
              overallStatus: 'Contains',
              matchedAllergens: ['milk'],
              traceAllergens: [],
              checkedAllergens: [{ code: 'milk', status: 'Contains' }],
              ingredientHighlights: [
                { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk' },
              ],
              explanations: ['The product contains selected allergens: Milk.'],
            },
          },
        },
      ]),
    )

    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('offline'))

    renderProductResultPage()

    expect(await screen.findByText(/showing your last saved analysis/i)).toBeInTheDocument()
    expect(screen.getByText(/Milk Chocolate Bar/i)).toBeInTheDocument()
    expect(screen.getByText(/This product is not safe for your profile/i)).toBeInTheDocument()
  })
})
