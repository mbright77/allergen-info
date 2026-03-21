import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { searchProducts } from '../../shared/api/products'
import { getSearchCardMeta, formatPreviewStatus, toStatusClassName } from '../../shared/domain/search'
import type { SearchResult } from '../../shared/domain/contracts'
import { saveRecentSearch } from '../../shared/search/recent-searches'

export function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q')?.trim() ?? ''
  const selectedAllergens = useMemo(() => searchParams.getAll('selectedAllergens'), [searchParams])

  const searchQuery = useQuery({
    queryKey: ['products', 'search', query, selectedAllergens],
    queryFn: () => searchProducts(query, selectedAllergens),
    enabled: query.length > 0,
  })

  const results = searchQuery.data?.results ?? []

  useEffect(() => {
    if (query.length > 0 && searchQuery.data) {
      saveRecentSearch(query, selectedAllergens)
    }
  }, [query, searchQuery.data, selectedAllergens])

  function handleSelectResult(result: SearchResult) {
    navigate(`/results/${encodeURIComponent(result.gtin)}`)
  }

  return (
    <section className="stack-xl">
      <div className="content-card stack-md">
        <p className="supporting-text">Search results for</p>
        <h1 className="display-title display-title--italic">'{query || 'Search'}'</h1>
        <div className="chip-row">
          <span className="filter-chip filter-chip--active">All Results</span>
          <span className="filter-chip">Organic</span>
          <span className="filter-chip">Unsweetened</span>
          <span className="filter-chip">Gluten-Free</span>
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

      {searchQuery.isError ? (
        <section className="status-panel status-panel--error stack-sm" role="alert">
          <p className="eyebrow">Search unavailable</p>
          <p className="supporting-text">We could not load results right now. Please try again in a moment.</p>
        </section>
      ) : null}

      {!searchQuery.isLoading && !searchQuery.isError && query.length > 0 && results.length === 0 ? (
        <section className="content-card stack-md">
          <p className="eyebrow">No results yet</p>
          <p className="supporting-text">Try another product name, ingredient, GTIN, or brand.</p>
        </section>
      ) : null}

      {!searchQuery.isLoading && !searchQuery.isError && results.length > 0 ? (
        <div className="search-grid">
          {results.map((result) => {
            const statusClassName = toStatusClassName(result.previewStatus)

            return (
              <article key={result.gtin} className="search-card">
                <button
                  type="button"
                  className="search-card__button"
                  onClick={() => handleSelectResult(result)}
                  aria-label={`View details for ${result.name}`}
                >
                  <div className={`search-card__media search-card__media--${statusClassName}`}>
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
                    {result.previewNote ? <p className="search-card__note">{result.previewNote}</p> : null}
                  </div>
                </button>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
