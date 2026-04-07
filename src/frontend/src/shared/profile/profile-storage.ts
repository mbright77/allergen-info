const PROFILES_STORAGE_KEY = 'safescan.profiles.v1'

export type StoredProfile = {
  id: string
  name: string
  selectedAllergens: string[]
  createdAt: string
  updatedAt: string
}

export type StoredProfilesState = {
  activeProfileId: string | null
  profiles: StoredProfile[]
}

export function readStoredProfilesState(): StoredProfilesState {
  if (typeof window === 'undefined') {
    return emptyProfilesState()
  }

  const rawValue = window.localStorage.getItem(PROFILES_STORAGE_KEY)

  if (!rawValue) {
    return emptyProfilesState()
  }

  try {
    const parsed = JSON.parse(rawValue)

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
      return emptyProfilesState()
    }

    const profiles = parsed.profiles
      .map(normalizeStoredProfile)
      .filter((profile: StoredProfile | null): profile is StoredProfile => profile !== null)
    const activeProfileId =
      typeof parsed.activeProfileId === 'string' && profiles.some((profile: StoredProfile) => profile.id === parsed.activeProfileId)
        ? parsed.activeProfileId
        : profiles[0]?.id ?? null

    return {
      activeProfileId,
      profiles,
    }
  } catch {
    return emptyProfilesState()
  }
}

export function writeStoredProfilesState(state: StoredProfilesState) {
  if (typeof window === 'undefined') {
    return
  }

  const profiles = state.profiles.map(normalizeProfileForWrite)
  const activeProfileId = profiles.some((profile) => profile.id === state.activeProfileId)
    ? state.activeProfileId
    : profiles[0]?.id ?? null

  window.localStorage.setItem(
    PROFILES_STORAGE_KEY,
    JSON.stringify({
      activeProfileId,
      profiles,
    }),
  )
}

function normalizeStoredProfile(value: unknown): StoredProfile | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : ''
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : ''

  if (!id || !name) {
    return null
  }

  const selectedAllergens = Array.isArray(candidate.selectedAllergens)
    ? dedupeStringArray(candidate.selectedAllergens)
    : []

  return {
    id,
    name,
    selectedAllergens,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  }
}

function normalizeProfileForWrite(profile: StoredProfile): StoredProfile {
  return {
    id: profile.id.trim(),
    name: profile.name.trim(),
    selectedAllergens: dedupeStringArray(profile.selectedAllergens),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

function dedupeStringArray(values: unknown[]) {
  return values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .filter((value, index, array) => array.indexOf(value) === index)
}

function emptyProfilesState(): StoredProfilesState {
  return {
    activeProfileId: null,
    profiles: [],
  }
}

export { PROFILES_STORAGE_KEY }
