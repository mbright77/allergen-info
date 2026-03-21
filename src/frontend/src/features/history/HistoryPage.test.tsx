import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { HISTORY_STORAGE_KEY } from '../../shared/collections/storage'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { HistoryPage } from './HistoryPage'

function renderHistoryPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter([{ path: '/history', element: <HistoryPage /> }], {
    initialEntries: ['/history'],
  })

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

describe('HistoryPage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('renders persisted history entries', () => {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          gtin: '1735000111004',
          name: 'Milk Chocolate Bar',
          brand: 'Marabou',
          category: 'Chocolate',
          subtitle: 'Classic milk chocolate',
          overallStatus: 'Contains',
          updatedAt: '2026-03-21T10:00:00Z',
        },
      ]),
    )

    renderHistoryPage()

    expect(screen.getByText(/Milk Chocolate Bar/i)).toBeInTheDocument()
    expect(screen.getByText(/Warning/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view analysis/i })).toBeInTheDocument()
  })
})
