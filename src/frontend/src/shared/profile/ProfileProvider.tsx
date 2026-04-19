import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import {
  readStoredProfilesState,
  writeStoredProfilesState,
} from './profile-storage'
import { ProfileContext, type Profile, type ProfileContextValue } from './ProfileContext'

export function ProfileProvider({ children }: PropsWithChildren) {
  const [profilesState, setProfilesState] = useState(() => readStoredProfilesState())

  useEffect(() => {
    writeStoredProfilesState(profilesState)
  }, [profilesState])

  const activeProfile = useMemo(
    () => profilesState.profiles.find((profile) => profile.id === profilesState.activeProfileId) ?? null,
    [profilesState.activeProfileId, profilesState.profiles],
  )

  const createProfile = useCallback((input: { name: string; selectedAllergens: string[] }) => {
    const name = input.name.trim()

    if (!name) {
      throw new Error('Profile name is required')
    }

    const now = new Date().toISOString()
    const nextProfile: Profile = {
      id: globalThis.crypto?.randomUUID?.() ?? `profile-${Date.now()}`,
      name,
      selectedAllergens: Array.from(new Set(input.selectedAllergens)),
      createdAt: now,
      updatedAt: now,
    }

    setProfilesState((current) => ({
      activeProfileId: nextProfile.id,
      profiles: [...current.profiles, nextProfile],
    }))

    return nextProfile.id
  }, [])

  const setActiveProfile = useCallback((profileId: string) => {
    setProfilesState((current) => {
      if (!current.profiles.some((profile) => profile.id === profileId)) {
        return current
      }

      if (current.activeProfileId === profileId) {
        return current
      }

      return {
        ...current,
        activeProfileId: profileId,
      }
    })
  }, [])

  const updateActiveProfile = useCallback((input: { name: string; selectedAllergens: string[] }) => {
    const name = input.name.trim()

    if (!name) {
      throw new Error('Profile name is required')
    }

    setProfilesState((current) => {
      if (!current.activeProfileId) {
        return current
      }

      return {
        ...current,
        profiles: current.profiles.map((profile) =>
          profile.id === current.activeProfileId
            ? {
                ...profile,
                name,
                selectedAllergens: Array.from(new Set(input.selectedAllergens)),
                updatedAt: new Date().toISOString(),
              }
            : profile,
        ),
      }
    })
  }, [])

  const toggleAllergen = useCallback((code: string) => {
    setProfilesState((current) => {
      if (!current.activeProfileId) {
        return current
      }

      return {
        ...current,
        profiles: current.profiles.map((profile) => {
          if (profile.id !== current.activeProfileId) {
            return profile
          }

          const nextSelectedAllergens = profile.selectedAllergens.includes(code)
            ? profile.selectedAllergens.filter((value) => value !== code)
            : [...profile.selectedAllergens, code]

          return {
            ...profile,
            selectedAllergens: nextSelectedAllergens,
            updatedAt: new Date().toISOString(),
          }
        }),
      }
    })
  }, [])

  const value = useMemo<ProfileContextValue>(
    () => ({
      profiles: profilesState.profiles,
      activeProfileId: profilesState.activeProfileId,
      activeProfile,
      selectedAllergens: activeProfile?.selectedAllergens ?? [],
      hasProfiles: profilesState.profiles.length > 0,
      createProfile,
      setActiveProfile,
      updateActiveProfile,
      toggleAllergen,
    }),
    [activeProfile, createProfile, profilesState.activeProfileId, profilesState.profiles, setActiveProfile, toggleAllergen, updateActiveProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
