import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfile } from '../../shared/profile/ProfileProvider'
import { readRecentSearches, saveRecentSearch } from '../../shared/search/recent-searches'
import { useBarcodeScanner } from './useBarcodeScanner'

export function ScanPage() {
  const navigate = useNavigate()
  const { selectedAllergens } = useProfile()
  const [searchValue, setSearchValue] = useState('')
  const [isScannerActive, setIsScannerActive] = useState(false)
  const recentSearches = useMemo(() => readRecentSearches(), [searchValue])

  const handleDetectedBarcode = useCallback(
    (detectedValue: string) => {
      navigate(`/results/${encodeURIComponent(detectedValue)}`)
    },
    [navigate],
  )

  const scanner = useBarcodeScanner({
    enabled: isScannerActive,
    onDetected: handleDetectedBarcode,
  })

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
      <div className="scanner-panel stack-lg">
        <form className="search-bar" onSubmit={handleSubmit}>
          <span className="material-symbols-outlined" aria-hidden="true">
            search
          </span>
          <input
            type="search"
            name="query"
            placeholder="Search for a product..."
            aria-label="Search for a product"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <button type="submit" className="search-bar__submit" aria-label="Submit search">
            <span className="material-symbols-outlined" aria-hidden="true">
              arrow_forward
            </span>
          </button>
        </form>

        {!isScannerActive ? <h1 className="sr-only">Scan or search for a product</h1> : null}

        <section className="scanner-stage">
          <div className="scanner-stage__status">
            <span className="scanner-stage__status-dot" aria-hidden="true" />
            <span>System Ready</span>
          </div>

          {isScannerActive ? (
            <div className="scanner-active stack-lg">
              <div className="stack-sm scanner-copy scanner-copy--active">
                <h1 className="display-title display-title--light">Scanning Barcode</h1>
                <p className="supporting-text supporting-text--light">
                  Align the barcode within the frame.
                </p>
              </div>

              <div className="scanner-frame">
                <video ref={scanner.videoRef} className="scanner-video" muted playsInline aria-label="Live barcode scanner preview" />
                <span className="scanner-corner scanner-corner--tl" />
                <span className="scanner-corner scanner-corner--tr" />
                <span className="scanner-corner scanner-corner--bl" />
                <span className="scanner-corner scanner-corner--br" />
              </div>

              <div className="scanner-stage__actions">
                <button type="button" className="secondary-action" onClick={() => setIsScannerActive(false)}>
                  Stop scanning
                </button>
                <button type="button" className="torch-button" aria-label="Toggle flashlight">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    flashlight_on
                  </span>
                </button>
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
                <span className="scanner-launch__title">Tap to Scan</span>
                <span id="scanner-launch-description" className="scanner-launch__description">
                  Search first if you want. When you are ready, tap here and the camera will activate for a live barcode scan.
                </span>
                <span className="scanner-corner scanner-corner--tl" />
                <span className="scanner-corner scanner-corner--tr" />
                <span className="scanner-corner scanner-corner--bl" />
                <span className="scanner-corner scanner-corner--br" />
              </button>
            </div>
          )}
        </section>

        {scanner.errorMessage ? (
          <div className="scanner-status scanner-status--warning" role="alert">
            <p className="eyebrow eyebrow--light">Scanner status</p>
            <p className="supporting-text supporting-text--light">{scanner.errorMessage}</p>
          </div>
        ) : (
          <div className="scanner-status" role="status" aria-live="polite">
            <p className="eyebrow eyebrow--light">Scanner status</p>
            <p className="supporting-text supporting-text--light">
              {!isScannerActive && 'Camera stays off until you tap the scan card.'}
              {isScannerActive && scanner.status === 'requesting' && 'Requesting camera access...'}
              {isScannerActive && scanner.status === 'active' && 'Scanner ready. Position the barcode in the frame.'}
              {isScannerActive && scanner.status === 'idle' && 'Scanner initializing...'}
            </p>
          </div>
        )}

        {recentSearches.length > 0 ? (
          <section className="recent-searches stack-sm">
            <p className="eyebrow eyebrow--light">Recent searches</p>
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
          <h2 className="section-title">Tips for Precision Scanning</h2>
          <div className="scanner-tips__grid">
            <article className="scanner-tip-card stack-sm">
              <span className="material-symbols-outlined scanner-tip-card__icon" aria-hidden="true">
                lightbulb
              </span>
              <h3 className="section-title scanner-tip-card__title">Good Lighting</h3>
              <p className="supporting-text">
                Ensure the product is in a well-lit area to help our AI identify fine print ingredients.
              </p>
            </article>
            <article className="scanner-tip-card stack-sm">
              <span className="material-symbols-outlined scanner-tip-card__icon" aria-hidden="true">
                straighten
              </span>
              <h3 className="section-title scanner-tip-card__title">Keep it Steady</h3>
              <p className="supporting-text">
                Hold your phone parallel to the barcode for the fastest recognition speed.
              </p>
            </article>
          </div>
        </section>
      </div>

      <div className="analysis-banner">
        <div className="analysis-banner__icon">
          <span className="material-symbols-outlined" aria-hidden="true">
            shield
          </span>
        </div>
        <div>
          <p className="eyebrow">Live Analysis</p>
          <p className="analysis-banner__text">Auto-detecting peanuts and gluten</p>
        </div>
      </div>
    </section>
  )
}
