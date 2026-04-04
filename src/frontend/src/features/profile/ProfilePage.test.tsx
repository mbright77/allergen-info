import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILE_STORAGE_KEY } from '../../shared/profile/profile-storage'
import { ProfilePage } from './ProfilePage'

function renderProfilePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter([{ path: '/profile', element: <ProfilePage /> }], {
    initialEntries: ['/profile'],
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

describe('ProfilePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('loads allergen options and updates the stored profile', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ selectedAllergens: ['milk'] }),
    )

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { code: 'milk', label: 'Milk' },
          { code: 'soybeans', label: 'Soybeans' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderProfilePage()

    const soybeansButton = await screen.findByRole('button', { name: 'Soybeans' })
    expect(screen.getByRole('button', { name: 'Milk' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(soybeansButton)

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? '{}')).toEqual({
        selectedAllergens: ['milk', 'soybeans'],
      })
    })
  })
})
