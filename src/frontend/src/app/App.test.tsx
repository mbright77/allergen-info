import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { router as appRouter } from './router'
import { CollectionsProvider } from '../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../shared/profile/ProfileProvider'

describe('app router', () => {
  it('renders onboarding content on the onboarding route', () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/onboarding'],
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

    expect(screen.getByText(/Create your personal safety profile/i)).toBeInTheDocument()
  })
})
