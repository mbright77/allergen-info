import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { router as appRouter } from './router'
import { CollectionsProvider } from '../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../shared/profile/ProfileProvider'

describe('app router', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

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

    expect(screen.getByText(/Define your/i)).toBeInTheDocument()
    expect(screen.getByText(/Safe Zone/i)).toBeInTheDocument()
  })

  it('renders an offline banner when the browser is offline', () => {
    const originalOnLine = navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/home'],
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

    expect(
      screen.getByText(/offline mode: saved profile, favorites, and history remain available/i),
    ).toBeInTheDocument()

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: originalOnLine,
    })
  })
})
