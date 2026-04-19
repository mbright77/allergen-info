import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { router as appRouter } from './router'
import { CollectionsProvider } from '../shared/collections/CollectionsProvider'
import { languageStorageKey } from '../shared/i18n/config'
import { i18n } from '../shared/i18n/init'
import { ProfileProvider } from '../shared/profile/ProfileProvider'
import { PROFILES_STORAGE_KEY } from '../shared/profile/profile-storage'

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
    void i18n.changeLanguage('en')
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

    expect(screen.getByText(/Create your Safe Zone/i)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /primary navigation/i })).not.toBeInTheDocument()
  })

  it('opens the help page from the top bar help icon', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

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

    await user.click(screen.getByRole('button', { name: /help/i }))

    expect(await screen.findByText(/How SafeScan uses your profile/i)).toBeInTheDocument()
  })

  it('routes the app root to onboarding when no profiles exist', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/'],
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

    expect(await screen.findByText(/Create your Safe Zone/i)).toBeInTheDocument()
  })

  it('routes the app root to home when an active profile exists', async () => {
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })

    const router = createMemoryRouter(appRouter.routes, {
      initialEntries: ['/'],
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

    expect(await screen.findByText(/Anna is active with 1 monitored allergens/i)).toBeInTheDocument()
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
      screen.getByText(/offline mode: saved profiles, favorites, and history remain available/i),
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

  it('shows language options in the profile menu and switches the active language', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

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

    await user.click(screen.getByRole('button', { name: /profiles/i }))

    expect(screen.getByRole('group', { name: /language options/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: /english/i })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('menuitemradio', { name: /svenska/i }))

    expect(document.documentElement.lang).toBe('sv')

    await user.click(screen.getByRole('button', { name: /profiler/i }))

    expect(screen.getByRole('menuitemradio', { name: /svenska/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: /english/i })).toHaveAttribute('aria-checked', 'false')
  })

  it('restores the persisted language on a new app render', async () => {
    window.localStorage.setItem(languageStorageKey, 'sv')
    window.localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify({
        activeProfileId: 'p1',
        profiles: [
          { id: 'p1', name: 'Anna', selectedAllergens: ['milk'], createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
        ],
      }),
    )

    await i18n.changeLanguage('sv')

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

    expect(document.documentElement.lang).toBe('sv')
    expect(await screen.findByRole('button', { name: /hjälp/i })).toBeInTheDocument()
  })
})
