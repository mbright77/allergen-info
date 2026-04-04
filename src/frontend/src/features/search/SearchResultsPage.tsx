import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { searchProducts } from '../../shared/api/products'
import { getSearchCardMeta, formatPreviewStatus, toStatusClassName } from '../../shared/domain/search'
import type { SearchResult } from '../../shared/domain/contracts'
import { saveRecentSearch } from '../../shared/search/recent-searches'
import {
  buildSearchResultsCacheKey,
  readCachedSearchResults,
  writeCachedSearchResults,
} from '../../shared/search/search-results-cache'

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')?.trim() ?? ''
  const selectedAllergens = useMemo(() => searchParams.getAll('selectedAllergens'), [searchParams])
  const searchCacheKey = useMemo(
    () => buildSearchResultsCacheKey(query, selectedAllergens),
    [query, selectedAllergens],
  )
  const cachedSearchResults = useMemo(() => readCachedSearchResults(searchCacheKey), [searchCacheKey])

  const searchQuery = useQuery({
    queryKey: ['products', 'search', query, selectedAllergens],
    queryFn: () => searchProducts(query, selectedAllergens),
    enabled: query.length > 0,
  })

  const resolvedSearchResponse = searchQuery.data ?? (searchQuery.isError ? cachedSearchResults : null)
  const results = resolvedSearchResponse?.results ?? []
  const isShowingCachedResults = searchQuery.isError && !!cachedSearchResults

  useEffect(() => {
    if (query.length > 0 && searchQuery.data) {
      saveRecentSearch(query, selectedAllergens)
      writeCachedSearchResults(searchCacheKey, searchQuery.data)
    }
  }, [query, searchCacheKey, searchQuery.data, selectedAllergens])

  function handleSelectResult(result: SearchResult) {
    navigate(`/results/${encodeURIComponent(result.gtin)}`)
  }

  return (
    <section className="stack-xl search-results-page">
      <div className="content-card stack-md">
        <p className="supporting-text">Search results for</p>
        <h1 className="display-title display-title--italic">'{query || 'Search'}'</h1>
        <div className="chip-row">
          <button type="button" className="filter-chip filter-chip--active" disabled aria-label="Filter: All Results (active)">All Results</button>
          <button type="button" className="filter-chip" disabled aria-label="Filter: Organic (coming soon)">Organic</button>
          <button type="button" className="filter-chip" disabled aria-label="Filter: Unsweetened (coming soon)">Unsweetened</button>
          <button type="button" className="filter-chip" disabled aria-label="Filter: Gluten-Free (coming soon)">Gluten-Free</button>
        </div>
      </div>

      {query.length === 0 ? (
        <section className="content-card stack-md">
          <p className="eyebrow">Start with a search</p>
          <p className="supporting-text">Enter a product name, ingredient, GTIN, or brand from the scanner search field.</p>
        </section>
      ) : null}

      {searchQuery.isLoading ? (
        <section className="content-card stack-md">
          <p className="eyebrow">Searching</p>
          <p className="supporting-text">Finding matching products and preparing preview insights...</p>
        </section>
      ) : null}

      {searchQuery.isError && !cachedSearchResults ? (
        <section className="status-panel status-panel--error stack-sm" role="alert">
          <p className="eyebrow">Search unavailable</p>
          <p className="supporting-text">We could not load results right now. Please try again in a moment.</p>
        </section>
      ) : null}

      {isShowingCachedResults ? (
        <section className="content-card content-card--accent stack-sm" role="status">
          <p className="eyebrow">Offline fallback</p>
          <p className="supporting-text">Showing your last saved search results while the network is unavailable.</p>
        </section>
      ) : null}

      {!searchQuery.isLoading && !searchQuery.isError && query.length > 0 && results.length === 0 ? (
        <section className="content-card stack-md">
          <p className="eyebrow">No results yet</p>
          <p className="supporting-text">Try another product name, ingredient, GTIN, or brand.</p>
        </section>
      ) : null}

      {!searchQuery.isLoading && results.length > 0 ? (
        <>
          <div className="search-grid">
            {results.map((result, index) => {
              const statusClassName = toStatusClassName(result.previewStatus)

              return (
                <article
                  key={result.gtin}
                  className={index === 0 ? 'search-card search-card--featured' : 'search-card'}
                >
                  <button
                    type="button"
                    className="search-card__button"
                    onClick={() => handleSelectResult(result)}
                    aria-label={`View details for ${result.name}`}
                  >
                    <div className={`search-card__media search-card__media--${statusClassName}`}>
                      <SearchCardArtwork result={result} />
                      {result.previewStatus ? (
                        <span className={`status-badge status-badge--${statusClassName}`}>
                          {formatPreviewStatus(result.previewStatus)}
                        </span>
                      ) : null}
                    </div>
                    <div className="stack-sm search-card__body">
                      <p className="eyebrow">{result.brand ?? 'Product'}</p>
                      <h2 className="section-title">{result.name}</h2>
                      <p className="supporting-text">{getSearchCardMeta(result)}</p>
                      <div className="search-card__meta-row">
                        {result.previewBadge ? <span className="search-insight search-insight--primary">{result.previewBadge}</span> : null}
                        {result.category ? <span className="search-insight">{result.category}</span> : null}
                      </div>
                      {result.previewNote ? <p className="search-card__note">{result.previewNote}</p> : null}
                    </div>
                  </button>
                </article>
              )
            })}
          </div>

          <section className="search-grid">
            <article className="search-card search-card--editorial search-card--editorial-feature">
              <div className="search-card__art-panel" aria-hidden="true">
                <span className="search-card__art-panel-bottle">O</span>
              </div>
              <div className="stack-sm search-card__body">
                <p className="search-insight search-insight--editorial">Editor&apos;s Choice</p>
                <h2 className="display-title search-editorial-title">Milked Oats, simplified.</h2>
                <p className="supporting-text">
                  The cleanest oat-milk options usually keep the ingredient list short and the emulsifiers out.
                </p>
                <p className="search-editorial-score">98/100 Purity Score</p>
              </div>
            </article>

            <article className="search-card search-card--notice">
              <div className="stack-md">
                <span className="material-symbols-outlined search-card__notice-icon" aria-hidden="true">
                  warning
                </span>
                <div className="stack-sm">
                  <h2 className="section-title search-notice-title">Notice anything?</h2>
                  <p className="supporting-text supporting-text--light">
                    Some oat milks contain seed oils and phosphates. Check the caution flags before buying.
                  </p>
                </div>
              </div>
              <button type="button" className="search-notice-action">
                Learn about additives
              </button>
            </article>
          </section>
        </>
      ) : null}
    </section>
  )
}

function getBrandMonogram(brand: string | null | undefined, name: string) {
  const source = (brand ?? name).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS'
}

function SearchCardArtwork({ result }: { result: SearchResult }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = !!result.imageUrl && !imageFailed

  return (
    <div className="search-card__artwork" aria-hidden="true">
      {showImage ? (
        <div className="search-card__image-frame">
          <img
            className="search-card__image"
            src={result.imageUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : null}
      {!showImage ? <span className="search-card__monogram">{getBrandMonogram(result.brand, result.name)}</span> : null}
    </div>
  )
}
