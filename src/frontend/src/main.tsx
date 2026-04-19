import '@fontsource-variable/material-symbols-outlined'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { router } from './app/router'
import { registerAppServiceWorker } from './app/pwa'
import './index.css'
import { CollectionsProvider } from './shared/collections/CollectionsProvider'
import { initI18n } from './shared/i18n/init'
import { ProfileProvider } from './shared/profile/ProfileProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

void initI18n().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <CollectionsProvider>
            <RouterProvider router={router} />
          </CollectionsProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})

void registerAppServiceWorker()
