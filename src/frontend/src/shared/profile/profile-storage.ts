const PROFILE_STORAGE_KEY = 'safescan.profile.v1'

export type StoredProfile = {
  selectedAllergens: string[]
}

export function readStoredProfile(): StoredProfile {
  if (typeof window === 'undefined') {
    return { selectedAllergens: [] }
  }

  const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY)

  if (!rawValue) {
    return { selectedAllergens: [] }
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (
      parsed &&
      typeof parsed === 'object' &&
      'selectedAllergens' in parsed &&
      Array.isArray(parsed.selectedAllergens)
    ) {
      return {
        selectedAllergens: parsed.selectedAllergens.filter(
          (value: unknown): value is string => typeof value === 'string' && value.length > 0,
        ),
      }
    }
  } catch {
    // ignore malformed local storage and reset to defaults
  }

  return { selectedAllergens: [] }
}

export function writeStoredProfile(profile: StoredProfile) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export { PROFILE_STORAGE_KEY }
