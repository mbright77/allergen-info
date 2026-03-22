import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { router as appRouter } from './router'
import { CollectionsProvider } from '../shared/collections/CollectionsProvider'
import { ProfileProvider } from '../shared/profile/ProfileProvider'

const pwaMocks = vi.hoisted(() => {
  return {
    subscribeToAppUpdate: vi.fn(),
    isAppUpdateDismissed: vi.fn(() => false),
    dismissAppUpdate: vi.fn(),
    applyAppUpdate: vi.fn(),
  }
})

vi.mock('./pwa', () => pwaMocks)

describe('app router', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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
    expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument()
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

  it('shows an app update banner when a waiting update is reported', async () => {
    pwaMocks.subscribeToAppUpdate.mockImplementation((listener: () => void) => {
      listener()
      return () => undefined
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

    expect(screen.getByText(/app update ready/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update now/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /later/i })).toBeInTheDocument()
  })

  it('dismisses the app update banner for the current page session', async () => {
    pwaMocks.subscribeToAppUpdate.mockImplementation((listener: () => void) => {
      listener()
      return () => undefined
    })

    const user = userEvent.setup()
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

    await user.click(screen.getByRole('button', { name: /later/i }))

    expect(pwaMocks.dismissAppUpdate).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/app update ready/i)).not.toBeInTheDocument()
  })

  it('applies the waiting update when the user accepts it', async () => {
    pwaMocks.subscribeToAppUpdate.mockImplementation((listener: () => void) => {
      listener()
      return () => undefined
    })

    const user = userEvent.setup()
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

    await user.click(screen.getByRole('button', { name: /update now/i }))

    expect(pwaMocks.applyAppUpdate).toHaveBeenCalledTimes(1)
  })
})
