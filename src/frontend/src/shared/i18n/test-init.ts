import { initReactI18next } from 'react-i18next'

import { defaultLanguage, defaultNamespace, namespaces } from './config'
import { i18n } from './init'
import { testResources } from './test-resources'

let isTestI18nInitialized = false

function updateDocumentLanguage(language: string) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = language
}

export async function initTestI18n() {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      defaultNS: defaultNamespace,
      fallbackLng: defaultLanguage,
      interpolation: {
        escapeValue: false,
      },
      lng: defaultLanguage,
      ns: namespaces,
      react: {
        useSuspense: false,
      },
      resources: testResources,
    })
  }

  await i18n.changeLanguage(defaultLanguage)

  if (!isTestI18nInitialized) {
    i18n.on('languageChanged', updateDocumentLanguage)
    updateDocumentLanguage(defaultLanguage)
    isTestI18nInitialized = true
  }
}
