import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProfileProvider } from '../../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../../shared/profile/profile-storage'
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
      { path: '/home', element: <p>Home route</p> },
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

  it('requires a profile name and saves the first profile with optional allergens', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          { code: 'milk', label: 'Milk' },
          { code: 'cereals_containing_gluten', label: 'Cereals containing gluten' },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const { router } = renderOnboardingPage()

    await user.click(screen.getByRole('button', { name: /save profile and continue/i }))
    expect(await screen.findByText(/enter a profile name before saving/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/profile name/i), 'Anna')
    const milkButton = await screen.findByRole('button', { name: 'Milk' })
    await user.click(milkButton)
    await user.click(screen.getByRole('button', { name: /save profile and continue/i }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/home')
    })

    expect(JSON.parse(window.localStorage.getItem(PROFILES_STORAGE_KEY) ?? '{}')).toMatchObject({
      activeProfileId: expect.any(String),
      profiles: [
        {
          name: 'Anna',
          selectedAllergens: ['milk'],
        },
      ],
    })
  })

  it('allows saving an empty profile', async () => {
    const user = userEvent.setup()

    vi.spyOn(window, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ code: 'milk', label: 'Milk' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderOnboardingPage()

    await user.type(screen.getByLabelText(/profile name/i), 'Leo')
    await user.click(screen.getByRole('button', { name: /save profile and continue/i }))

    expect(JSON.parse(window.localStorage.getItem(PROFILES_STORAGE_KEY) ?? '{}')).toMatchObject({
      profiles: [
        {
          name: 'Leo',
          selectedAllergens: [],
        },
      ],
    })
  })
})
