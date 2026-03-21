import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useProfile } from '../../shared/profile/ProfileProvider'
import { readRecentSearches, saveRecentSearch } from '../../shared/search/recent-searches'
import { useBarcodeScanner } from './useBarcodeScanner'

export function ScanPage() {
  const navigate = useNavigate()
  const { selectedAllergens } = useProfile()
  const [searchValue, setSearchValue] = useState('')
  const recentSearches = useMemo(() => readRecentSearches(), [searchValue])

  const handleDetectedBarcode = useCallback(
    (detectedValue: string) => {
      navigate(`/results/${encodeURIComponent(detectedValue)}`)
    },
    [navigate],
  )

  const scanner = useBarcodeScanner({
    enabled: true,
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
          <button type="submit" className="icon-button icon-button--ghost" aria-label="Submit search">
            <span className="material-symbols-outlined" aria-hidden="true">
              photo_camera
            </span>
          </button>
        </form>

        <div className="stack-sm scanner-copy">
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

        <button type="button" className="torch-button" aria-label="Toggle flashlight">
          <span className="material-symbols-outlined" aria-hidden="true">
            flashlight_on
          </span>
        </button>

        {scanner.errorMessage ? (
          <div className="scanner-status scanner-status--warning" role="status">
            <p className="eyebrow eyebrow--light">Scanner status</p>
            <p className="supporting-text supporting-text--light">{scanner.errorMessage}</p>
          </div>
        ) : null}

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
