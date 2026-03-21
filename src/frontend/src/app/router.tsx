import { createBrowserRouter, Navigate } from 'react-router-dom'

import { App } from './App'
import { FavoritesPage } from '../features/favorites/FavoritesPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { HomePage } from '../features/home/HomePage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { ProductResultPage } from '../features/results/ProductResultPage'
import { ScanPage } from '../features/scanner/ScanPage'
import { SearchResultsPage } from '../features/search/SearchResultsPage'
import { ProfilePage } from '../features/profile/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/onboarding" replace /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'home', element: <HomePage /> },
      { path: 'scan', element: <ScanPage /> },
      { path: 'search/results', element: <SearchResultsPage /> },
      { path: 'results/:gtin', element: <ProductResultPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'history', element: <HistoryPage /> },
    ],
  },
])
