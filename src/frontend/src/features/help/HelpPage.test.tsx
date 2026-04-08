import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { HelpPage } from './HelpPage'

function renderHelpPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const router = createMemoryRouter([{ path: '/help', element: <HelpPage /> }], {
    initialEntries: ['/help'],
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('HelpPage', () => {
  it('renders guidance for profile selection and result meanings', () => {
    renderHelpPage()

    expect(screen.getByText(/How SafeScan uses your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/How allergen selection works/i)).toBeInTheDocument()
    expect(screen.getByText(/What the responses mean/i)).toBeInTheDocument()
    expect(screen.getByText(/Before you buy/i)).toBeInTheDocument()
    expect(screen.getByText(/Unknown/i)).toBeInTheDocument()
  })
})
