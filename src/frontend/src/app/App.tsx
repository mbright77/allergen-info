import { Outlet } from 'react-router-dom'

import { AppShell } from './layout/AppShell'
import { UpdateBanner } from './UpdateBanner'

export function App() {
  return (
    <AppShell>
      <UpdateBanner />
      <Outlet />
    </AppShell>
  )
}
