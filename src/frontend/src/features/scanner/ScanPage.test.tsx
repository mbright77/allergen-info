import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { RECENT_SEARCHES_STORAGE_KEY } from '../../shared/search/recent-searches'
import { ScanPage } from './ScanPage'

function renderScanPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      { path: '/scan', element: <ScanPage /> },
      { path: '/search/results', element: <p>Search results route</p> },
    ],
    { initialEntries: ['/scan'] },
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

describe('ScanPage', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('stores recent searches when submitting the search form', async () => {
    const user = userEvent.setup()
    const { router } = renderScanPage()

    await user.type(screen.getByRole('searchbox', { name: /search for a product/i }), 'oat milk')
    await user.click(screen.getByRole('button', { name: /submit search/i }))

    expect(router.state.location.search).toContain('q=oat+milk')
    expect(JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })

  it('keeps the camera inactive until the user explicitly starts scanning', async () => {
    renderScanPage()

    expect(screen.getByRole('button', { name: /tap to scan/i })).toBeInTheDocument()
    expect(screen.getByText(/camera stays off until you tap the scan card/i)).toBeInTheDocument()
  })
})
