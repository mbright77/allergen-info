import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { ScannedResultPage } from './ScannedResultPage'

function renderScannedResultPage(code = '1735000111001') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      { path: '/results/scan/:code', element: <ScannedResultPage /> },
      { path: '/results/:gtin', element: <p>Canonical result route</p> },
      { path: '/scan', element: <p>Scan route</p> },
      { path: '/search/results', element: <p>Search results route</p> },
    ],
    { initialEntries: [`/results/scan/${code}`] },
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

  return { router }
}

describe('ScannedResultPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('redirects to the canonical result route when full data is available', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          resolution: {
            mode: 'Full',
            scannedCode: '1735000111001',
            resolvedGtin: '1735000111001',
            message: null,
          },
          product: {
            gtin: '1735000111001',
            name: 'The Original Oat Milk',
            brand: 'Oatly',
            category: 'Beverage',
            subtitle: 'Clean label oat drink',
            ingredientsText: 'Water, oats 10%',
            allergenStatements: { contains: [], mayContain: [] },
            nutritionSummary: null,
            imageUrl: null,
            source: 'placeholder',
          },
          analysis: {
            overallStatus: 'Safe',
            matchedAllergens: [],
            traceAllergens: [],
            checkedAllergens: [],
            ingredientHighlights: [],
            explanations: ['No selected allergens were detected in the available product data.'],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const { router } = renderScannedResultPage()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/results/1735000111001')
    })
  })

  it('renders a fallback state when only basic product info is available', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          resolution: {
            mode: 'Basic',
            scannedCode: '1735000111001',
            resolvedGtin: '1735000111001',
            message: 'No allergen info found. Showing basic product information only.',
          },
          product: {
            gtin: '1735000111001',
            name: 'The Original Oat Milk',
            brand: 'Oatly',
            category: 'Beverage',
            subtitle: 'Clean label oat drink',
            ingredientsText: 'Detailed ingredients were unavailable for this product.',
            allergenStatements: { contains: [], mayContain: [] },
            nutritionSummary: null,
            imageUrl: null,
            source: 'dabas-search',
          },
          analysis: {
            overallStatus: 'Unknown',
            matchedAllergens: [],
            traceAllergens: [],
            checkedAllergens: [{ code: 'milk_protein', status: 'Unknown' }],
            ingredientHighlights: [],
            explanations: ['No allergen info found. Showing basic product information only.'],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderScannedResultPage()

    expect(await screen.findByRole('heading', { name: /We found the product, but not the detailed allergen data/i })).toBeInTheDocument()
    expect(screen.getByText(/The Original Oat Milk/i)).toBeInTheDocument()
    expect(screen.getByText(/Showing basic product information only/i)).toBeInTheDocument()
  })

  it('renders an unknown state when the barcode falls back to an unverified search match', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          resolution: {
            mode: 'Unverified',
            scannedCode: '1735000111001',
            resolvedGtin: '1735000111004',
            message: 'This barcode did not resolve to a verified GTIN match. The product was found via search only, so the status is unknown.',
          },
          product: {
            gtin: '1735000111004',
            name: 'Cookie Bites',
            brand: 'Test Brand',
            category: 'Cookies',
            subtitle: 'Crunchy wheat cookies',
            ingredientsText: 'Wheat flour, sugar, butter.',
            allergenStatements: { contains: [], mayContain: [] },
            nutritionSummary: null,
            imageUrl: null,
            source: 'dabas',
          },
          analysis: {
            overallStatus: 'Unknown',
            matchedAllergens: [],
            traceAllergens: [],
            checkedAllergens: [{ code: 'gluten', status: 'Unknown' }],
            ingredientHighlights: [],
            explanations: ['This barcode did not resolve to a verified GTIN match. The product was found via search only, so the status is unknown.'],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderScannedResultPage()

    expect(await screen.findByRole('heading', { name: /barcode could not be verified/i })).toBeInTheDocument()
    expect(screen.getByText(/Cookie Bites/i)).toBeInTheDocument()
    expect(screen.getByText(/status is unknown/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Unknown$/i).length).toBeGreaterThan(0)
  })

  it('renders a not found state when the barcode cannot be matched', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          resolution: {
            mode: 'NotFound',
            scannedCode: '0000000000000',
            resolvedGtin: null,
            message: 'No product was found for this barcode.',
          },
          product: null,
          analysis: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderScannedResultPage('0000000000000')

    expect(await screen.findByText(/We could not match this barcode yet/i)).toBeInTheDocument()
    expect(screen.getByText(/0000000000000/i)).toBeInTheDocument()
  })
})
