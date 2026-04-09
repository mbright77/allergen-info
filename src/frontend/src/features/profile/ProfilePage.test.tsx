import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CollectionsProvider } from '../../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../../shared/profile/profile-storage'
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

  it('loads the active profile and updates its stored name and allergens', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
          { id: 'p2', name: 'Leo', selectedAllergens: ['soybeans'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { code: 'milk', label: 'Milk' },
          { code: 'cereals_containing_gluten', label: 'Cereals containing gluten' },
          { code: 'soybeans', label: 'Soybeans' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    renderProfilePage()

    expect(await screen.findByDisplayValue('Anna')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Gluten' })).toBeInTheDocument()
    const soybeansButton = await screen.findByRole('button', { name: 'Soybeans' })
    expect(screen.getByRole('button', { name: 'Milk' })).toHaveAttribute('aria-pressed', 'true')

    await user.clear(screen.getByLabelText(/profile name/i))
    await user.type(screen.getByLabelText(/profile name/i), 'Anna Updated')
    await user.click(soybeansButton)
    await user.click(screen.getByRole('button', { name: /save profile changes/i }))

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PROFILES_STORAGE_KEY) ?? '{}')).toMatchObject({
        activeProfileId: 'p1',
        profiles: [
          {
            id: 'p1',
            name: 'Anna Updated',
            selectedAllergens: ['milk', 'soybeans'],
          },
          {
            id: 'p2',
            name: 'Leo',
            selectedAllergens: ['soybeans'],
          },
        ],
      })
    })
  })
})
