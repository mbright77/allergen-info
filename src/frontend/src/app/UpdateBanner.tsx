import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { applyAppUpdate, dismissAppUpdate, isAppUpdateDismissed, subscribeToAppUpdate } from './pwa'

export function UpdateBanner() {
  const { t } = useTranslation('app')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    return subscribeToAppUpdate(() => {
      if (!isAppUpdateDismissed()) {
        setIsVisible(true)
      }
    })
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <div className="stack-sm">
        <p className="eyebrow">{t('UpdateBanner.Eyebrow')}</p>
        <p className="supporting-text">
          {t('UpdateBanner.Message')}
        </p>
      </div>
      <div className="update-banner__actions">
        <button
          type="button"
          className="secondary-action"
          onClick={() => {
            dismissAppUpdate()
            setIsVisible(false)
          }}
        >
          {t('UpdateBanner.Later')}
        </button>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            applyAppUpdate()
          }}
        >
          {t('UpdateBanner.UpdateNow')}
        </button>
      </div>
    </div>
  )
}
