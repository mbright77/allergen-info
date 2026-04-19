export const defaultLanguage = 'en'

export const supportedLanguages = [
  { code: 'en', labelKey: 'Languages.English' },
  { code: 'sv', labelKey: 'Languages.Swedish' },
] as const

export const defaultNamespace = 'common'

export const namespaces = [
  'common',
  'app',
  'onboarding',
  'home',
  'scanner',
  'search',
  'results',
  'profile',
  'favorites',
  'history',
  'help',
] as const

export type AppNamespace = (typeof namespaces)[number]
export type AppLanguage = (typeof supportedLanguages)[number]['code']

export const languageStorageKey = 'safescan-language'

export function getLocalesLoadPath() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

  return `${normalizedBaseUrl}locales/{{lng}}/{{ns}}.json`
}
