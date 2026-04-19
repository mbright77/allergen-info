import { createContext } from 'react'

import type { StoredProfile } from './profile-storage'

export type Profile = StoredProfile

export type ProfileContextValue = {
  profiles: Profile[]
  activeProfileId: string | null
  activeProfile: Profile | null
  selectedAllergens: string[]
  hasProfiles: boolean
  createProfile: (input: { name: string; selectedAllergens: string[] }) => string
  setActiveProfile: (profileId: string) => void
  updateActiveProfile: (input: { name: string; selectedAllergens: string[] }) => void
  toggleAllergen: (code: string) => void
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)
