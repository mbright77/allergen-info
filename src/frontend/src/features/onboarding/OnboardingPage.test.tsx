import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILE_STORAGE_KEY } from '../../shared/profile/profile-storage'
import { OnboardingPage } from './OnboardingPage'

function renderOnboardingPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter(
    [
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/scan', element: <p>Scanner route</p> },
    ],
    { initialEntries: ['/onboarding'] },
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

describe('OnboardingPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('loads allergens, saves selection, and navigates to scan', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { code: 'milk_protein', label: 'Milk Protein' },
          { code: 'gluten', label: 'Gluten' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const { router } = renderOnboardingPage()

    const milkProteinButton = await screen.findByRole('button', { name: 'Milk Protein' })
    await user.click(milkProteinButton)
    await user.click(screen.getByRole('button', { name: /save & start scanning/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/scan')
    })

    expect(JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? '{}')).toEqual({
      selectedAllergens: ['milk_protein'],
    })
  })
})
