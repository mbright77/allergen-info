import { createElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { App } from './App'
import { StartupRedirect } from './StartupRedirect'
import { FavoritesPage } from '../features/favorites/FavoritesPage'
import { HelpPage } from '../features/help/HelpPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { HomePage } from '../features/home/HomePage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { NewProfilePage } from '../features/profile/NewProfilePage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { ProductResultPage } from '../features/results/ProductResultPage'
import { ScannedResultPage } from '../features/results/ScannedResultPage'
import { ScanPage } from '../features/scanner/ScanPage'
import { SearchResultsPage } from '../features/search/SearchResultsPage'

const routerBasename = import.meta.env.BASE_URL || '/'

export const router = createBrowserRouter([
  {
    path: '/',
    element: createElement(App),
    children: [
      { index: true, element: createElement(StartupRedirect) },
      { path: 'onboarding', element: createElement(OnboardingPage) },
      { path: 'home', element: createElement(HomePage) },
      { path: 'scan', element: createElement(ScanPage) },
      { path: 'search/results', element: createElement(SearchResultsPage) },
      { path: 'results/scan/:code', element: createElement(ScannedResultPage) },
      { path: 'results/:gtin', element: createElement(ProductResultPage) },
      { path: 'favorites', element: createElement(FavoritesPage) },
      { path: 'profile', element: createElement(ProfilePage) },
      { path: 'profiles/new', element: createElement(NewProfilePage) },
      { path: 'history', element: createElement(HistoryPage) },
      { path: 'help', element: createElement(HelpPage) },
    ],
  },
], {
  basename: routerBasename,
})
