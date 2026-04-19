import { useEffect } from 'react'

import { i18n } from './init'

export function usePageTitle(title: string) {
  useEffect(() => {
    const appName = i18n.t('AppName', { ns: 'common' })
    document.title = title ? `${title} | ${appName}` : appName
  }, [title])
}
