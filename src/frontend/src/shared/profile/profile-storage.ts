const PROFILE_STORAGE_KEY = 'safescan.profile.v2'
const LEGACY_PROFILE_STORAGE_KEY = 'safescan.profile.v1'

export type StoredProfile = {
  selectedAllergens: string[]
}

export function readStoredProfile(): StoredProfile {
  if (typeof window === 'undefined') {
    return { selectedAllergens: [] }
  }

  const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY)

  if (!rawValue) {
    return readLegacyStoredProfile()
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

function readLegacyStoredProfile(): StoredProfile {
  const rawValue = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY)

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
      const migratedSelections = parsed.selectedAllergens
        .flatMap((value: unknown) => (typeof value === 'string' ? migrateLegacyAllergenCode(value) : []))
        .filter((value: string, index: number, values: string[]) => values.indexOf(value) === index)

      writeStoredProfile({ selectedAllergens: migratedSelections })

      return {
        selectedAllergens: migratedSelections,
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

function migrateLegacyAllergenCode(code: string): string[] {
  switch (code) {
    case 'milk_protein':
    case 'lactose':
      return ['milk']
    case 'egg':
      return ['eggs']
    case 'gluten':
      return ['cereals_containing_gluten']
    case 'nuts':
      return ['tree_nuts']
    case 'soy':
      return ['soybeans']
    case 'peanuts':
      return ['peanuts']
    case 'fish':
      return ['fish']
    case 'shellfish':
      return ['crustaceans', 'molluscs']
    default:
      return []
  }
}

export { PROFILE_STORAGE_KEY }
