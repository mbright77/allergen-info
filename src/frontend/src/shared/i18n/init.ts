import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import {
  defaultNamespace,
  defaultLanguage,
  getLocalesLoadPath,
  languageStorageKey,
  supportedLanguages,
} from './config'

let isLanguageListenerAttached = false

function updateDocumentLanguage(language: string) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = language
}

function ensureLanguageListener() {
  if (isLanguageListenerAttached) {
    return
  }

  i18n.on('languageChanged', updateDocumentLanguage)
  isLanguageListenerAttached = true
}

function getInitialLanguage() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return window.localStorage.getItem(languageStorageKey) ?? undefined
}

export async function initI18n() {
  if (!i18n.isInitialized) {
    await i18n
      .use(HttpBackend)
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        backend: {
          loadPath: getLocalesLoadPath(),
        },
        defaultNS: defaultNamespace,
        fallbackLng: defaultLanguage,
        interpolation: {
          escapeValue: false,
        },
        load: 'languageOnly',
        lng: getInitialLanguage(),
        ns: [defaultNamespace, 'app'],
        react: {
          useSuspense: false,
        },
        supportedLngs: supportedLanguages.map((language) => language.code),
        detection: {
          caches: ['localStorage'],
          lookupLocalStorage: languageStorageKey,
          order: ['localStorage', 'navigator', 'htmlTag'],
        },
      })
  }

  ensureLanguageListener()
  updateDocumentLanguage(i18n.resolvedLanguage ?? i18n.language)

  return i18n
}

export { i18n }
