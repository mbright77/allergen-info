import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { formatNumber } from '../../shared/i18n/format'
import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'
import { readRecentSearches, saveRecentSearch } from '../../shared/search/recent-searches'
import { useBarcodeScanner } from './useBarcodeScanner'

export function ScanPage() {
  const { t, i18n } = useTranslation('scanner')
  const navigate = useNavigate()
  const { activeProfile, selectedAllergens } = useProfile()
  const [searchValue, setSearchValue] = useState('')
  const [isScannerActive, setIsScannerActive] = useState(false)
  const recentSearches = useMemo(() => readRecentSearches(), [])

  const handleDetectedBarcode = useCallback(
    (detectedValue: string) => {
      navigate(`/results/scan/${encodeURIComponent(detectedValue)}`)
    },
    [navigate],
  )

  const scanner = useBarcodeScanner({
    enabled: isScannerActive,
    onDetected: handleDetectedBarcode,
  })
  const { containerRef, controls: scannerControls, errorMessage: scannerErrorMessage, status: scannerStatus, zoomCapabilities: zoomCapability } = scanner

  usePageTitle(t('Page.Title'))

  const [torchOn, setTorchOn] = useState(false)
  const [zoomValue, setZoomValue] = useState<number | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get('query') ?? '').trim()

    if (!query) {
      return
    }

    const searchParams = new URLSearchParams({ q: query })

    for (const allergen of selectedAllergens) {
      searchParams.append('selectedAllergens', allergen)
    }

    saveRecentSearch(query, selectedAllergens)

    navigate(`/search/results?${searchParams.toString()}`)
  }

  return (
    <section className="scanner-page">
      <div className="scanner-backdrop" aria-hidden="true" />
      <div className="content-card scanner-panel stack-lg">
        <form className="search-bar" onSubmit={handleSubmit}>
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
          <input
            type="search"
            name="query"
            placeholder={t('Search.Placeholder')}
            aria-label={t('Search.AriaLabel')}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <button type="submit" className="search-bar__submit" aria-label={t('Search.SubmitAriaLabel')}>
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        </form>
        <section className="content-card content-card--soft-highlight stack-sm scan-profile-banner">
          <p className="eyebrow">{t('ProfileBanner.Eyebrow')}</p>
          <p className="supporting-text">
            {activeProfile
              ? selectedAllergens.length > 0
                ? t('ProfileBanner.Selected', {
                    name: activeProfile.name,
                    formattedCount: formatNumber(selectedAllergens.length, undefined, i18n.resolvedLanguage),
                  })
                : t('ProfileBanner.SelectedEmpty', { name: activeProfile.name })
              : t('ProfileBanner.NoActive')}
          </p>
        </section>
        {!isScannerActive ? <h1 className="sr-only">{t('Hero.HiddenTitle')}</h1> : null}

        <section className="scanner-stage">
          <div className="scanner-stage__status">
            <span className="scanner-stage__status-dot" aria-hidden="true" />
            <span>{t('Hero.SystemReady')}</span>
          </div>

          {isScannerActive ? (
            <div className="scanner-active stack-lg">
              <div className="stack-sm scanner-copy scanner-copy--active">
                <h1 className="display-title display-title--light">{t('Hero.ScanningTitle')}</h1>
                <p className="supporting-text supporting-text--light">
                  {t('Hero.ScanningDescription')}
                </p>
              </div>

              <div className="scanner-frame">
                <div
                  id="barcode-scanner-region"
                  ref={containerRef}
                  className="scanner-video scanner-video--mount"
                  aria-hidden="true"
                />
                <span className="scanner-corner scanner-corner--tl" />
                <span className="scanner-corner scanner-corner--tr" />
                <span className="scanner-corner scanner-corner--bl" />
                <span className="scanner-corner scanner-corner--br" />
              </div>

              <div className="scanner-stage__actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setIsScannerActive(false)
                    setZoomValue(null)
                    setTorchOn(false)
                  }}
                >
                  {t('Actions.StopScanning')}
                </button>
                <button
                    type="button"
                    className="torch-button"
                    aria-label={t('Actions.ToggleFlashlight')}
                    onClick={async () => {
                    const ok = await scannerControls?.toggleTorch?.(!torchOn)
                      if (ok) setTorchOn((v) => !v)
                    }}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {torchOn ? 'flashlight_off' : 'flashlight_on'}
                  </span>
                </button>

                {zoomCapability ? (
                  <div className="zoom-control">
                    <label className="eyebrow eyebrow--light">{t('Actions.Zoom')}</label>
                    <input
                      type="range"
                      min={zoomCapability.min ?? 1}
                      max={zoomCapability.max ?? 1}
                      step={Math.max(((zoomCapability.max ?? 1) - (zoomCapability.min ?? 1)) / 10, 0.1)}
                      value={zoomValue ?? (zoomCapability.min ?? 1)}
                      onChange={async (e) => {
                        const v = Number(e.currentTarget.value)
                        const ok = await scannerControls?.setZoom?.(v)
                        if (ok) setZoomValue(v)
                      }}
                      aria-label={t('Actions.CameraZoom')}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="scanner-launch-shell stack-md">
              <button
                type="button"
                className="scanner-launch"
                onClick={() => setIsScannerActive(true)}
                aria-describedby="scanner-launch-description"
              >
                <span className="scanner-launch__icon" aria-hidden="true">
                  <span className="material-symbols-outlined">barcode_scanner</span>
                </span>
                <span className="scanner-launch__title">{t('Hero.LaunchTitle')}</span>
                <span id="scanner-launch-description" className="scanner-launch__description">
                  {t('Hero.LaunchDescription')}
                </span>
                <span className="scanner-corner scanner-corner--tl" />
                <span className="scanner-corner scanner-corner--tr" />
                <span className="scanner-corner scanner-corner--bl" />
                <span className="scanner-corner scanner-corner--br" />
              </button>
            </div>
          )}
        </section>

        {scannerErrorMessage ? (
          <div className="scanner-status scanner-status--warning" role="alert">
            <p className="eyebrow eyebrow--light">{t('Status.Title')}</p>
            <p className="supporting-text supporting-text--light">{scannerErrorMessage}</p>
          </div>
        ) : (
          <div className="scanner-status" role="status" aria-live="polite">
            <p className="eyebrow eyebrow--light">{t('Status.Title')}</p>
            <p className="supporting-text supporting-text--light">
              {!isScannerActive && t('Status.CameraOff')}
              {isScannerActive && scannerStatus === 'requesting' && t('Status.Requesting')}
              {isScannerActive && scannerStatus === 'active' && t('Status.Active')}
              {isScannerActive && scannerStatus === 'idle' && t('Status.Idle')}
            </p>
          </div>
        )}

        {recentSearches.length > 0 ? (
          <section className="recent-searches stack-sm">
            <p className="eyebrow eyebrow--light">{t('RecentSearches.Title')}</p>
            <div className="chip-row">
              {recentSearches.map((entry) => (
                <button
                  key={`${entry.query}-${entry.updatedAt}`}
                  type="button"
                  className="recent-search-chip"
                  onClick={() => {
                    setSearchValue(entry.query)
                    const params = new URLSearchParams({ q: entry.query })
                    for (const allergen of entry.selectedAllergens) {
                      params.append('selectedAllergens', allergen)
                    }
                    navigate(`/search/results?${params.toString()}`)
                  }}
                >
                  {entry.query}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="scanner-tips stack-md">
          <h2 className="section-title">{t('Tips.Title')}</h2>
          <div className="scanner-tips__grid">
            <article className="scanner-tip-card stack-sm">
              <span className="material-symbols-outlined scanner-tip-card__icon" aria-hidden="true">
                lightbulb
              </span>
              <h3 className="section-title scanner-tip-card__title">{t('Tips.LightingTitle')}</h3>
              <p className="supporting-text">
                {t('Tips.LightingDescription')}
              </p>
            </article>
            <article className="scanner-tip-card stack-sm">
              <span className="material-symbols-outlined scanner-tip-card__icon" aria-hidden="true">
                straighten
              </span>
              <h3 className="section-title scanner-tip-card__title">{t('Tips.SteadyTitle')}</h3>
              <p className="supporting-text">
                {t('Tips.SteadyDescription')}
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  )
}
