import { Navigate } from 'react-router-dom'

import { useProfile } from '../shared/profile/useProfile'

export function StartupRedirect() {
  const { hasProfiles } = useProfile()

  return <Navigate to={hasProfiles ? '/home' : '/onboarding'} replace />
}
