import { createBrowserRouter, Navigate } from 'react-router-dom'

import { App } from './App'
import { FavoritesPage } from '../features/favorites/FavoritesPage'
import { HelpPage } from '../features/help/HelpPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { HomePage } from '../features/home/HomePage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { NewProfilePage } from '../features/profile/NewProfilePage'
import { ProductResultPage } from '../features/results/ProductResultPage'
import { ScannedResultPage } from '../features/results/ScannedResultPage'
import { ScanPage } from '../features/scanner/ScanPage'
import { SearchResultsPage } from '../features/search/SearchResultsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { useProfile } from '../shared/profile/ProfileProvider'

const routerBasename = import.meta.env.BASE_URL || '/'

function StartupRedirect() {
  const { hasProfiles } = useProfile()

  return <Navigate to={hasProfiles ? '/home' : '/onboarding'} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <StartupRedirect /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'scan', element: <ScanPage /> },
      { path: 'search/results', element: <SearchResultsPage /> },
      { path: 'results/scan/:code', element: <ScannedResultPage /> },
      { path: 'results/:gtin', element: <ProductResultPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profiles/new', element: <NewProfilePage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'help', element: <HelpPage /> },
    ],
  },
], {
  basename: routerBasename,
})
