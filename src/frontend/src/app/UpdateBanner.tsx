import { useEffect, useState } from 'react'

import { applyAppUpdate, dismissAppUpdate, isAppUpdateDismissed, subscribeToAppUpdate } from './pwa'

export function UpdateBanner() {
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
        <p className="eyebrow">App update ready</p>
        <p className="supporting-text">
          A newer SafeScan version is available. Updating reloads the app, but your saved profile and local history stay on this device.
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
          Later
        </button>
        <button
          type="button"
          className="primary-action"
          onClick={() => {
            applyAppUpdate()
          }}
        >
          Update now
        </button>
      </div>
    </div>
  )
}
