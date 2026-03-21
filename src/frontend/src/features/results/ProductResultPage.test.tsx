import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
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
      'safescan.profile.v1',
      JSON.stringify({ selectedAllergens: ['milk_protein', 'soy', 'nuts'] }),
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
              contains: ['milk_protein', 'soy'],
              mayContain: ['nuts'],
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
            matchedAllergens: ['milk_protein', 'soy'],
            traceAllergens: ['nuts'],
            checkedAllergens: [
              { code: 'milk_protein', status: 'Contains' },
              { code: 'soy', status: 'Contains' },
              { code: 'nuts', status: 'MayContain' },
            ],
            ingredientHighlights: [
              { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk_protein' },
              { text: 'soy lecithin', severity: 'Contains', allergenCode: 'soy' },
            ],
            explanations: ['The product contains selected allergens: milk_protein, soy.'],
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
  })

  it('falls back to a cached analysis when offline', async () => {
    window.localStorage.setItem(
      'safescan.profile.v1',
      JSON.stringify({ selectedAllergens: ['milk_protein'] }),
    )
    window.localStorage.setItem(
      ANALYSIS_CACHE_STORAGE_KEY,
      JSON.stringify([
        {
          cacheKey: '1735000111004::milk_protein',
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
                contains: ['milk_protein', 'soy'],
                mayContain: ['nuts'],
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
              matchedAllergens: ['milk_protein'],
              traceAllergens: [],
              checkedAllergens: [{ code: 'milk_protein', status: 'Contains' }],
              ingredientHighlights: [
                { text: 'whey powder (milk)', severity: 'Contains', allergenCode: 'milk_protein' },
              ],
              explanations: ['The product contains selected allergens: milk_protein.'],
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
