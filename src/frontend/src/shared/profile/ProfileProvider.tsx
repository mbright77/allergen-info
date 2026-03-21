import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { readStoredProfile, writeStoredProfile } from './profile-storage'

type ProfileContextValue = {
  selectedAllergens: string[]
  setSelectedAllergens: (selectedAllergens: string[]) => void
  toggleAllergen: (code: string) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: PropsWithChildren) {
  const [selectedAllergens, setSelectedAllergensState] = useState<string[]>(() => readStoredProfile().selectedAllergens)

  useEffect(() => {
    writeStoredProfile({ selectedAllergens })
  }, [selectedAllergens])

  const setSelectedAllergens = useCallback((nextSelectedAllergens: string[]) => {
    setSelectedAllergensState(Array.from(new Set(nextSelectedAllergens)))
  }, [])

  const toggleAllergen = useCallback((code: string) => {
    setSelectedAllergensState((current) =>
      current.includes(code) ? current.filter((value) => value !== code) : [...current, code],
    )
  }, [])

  const value = useMemo<ProfileContextValue>(
    () => ({
      selectedAllergens,
      setSelectedAllergens,
      toggleAllergen,
    }),
    [selectedAllergens, setSelectedAllergens, toggleAllergen],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const context = useContext(ProfileContext)

  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }

  return context
}
