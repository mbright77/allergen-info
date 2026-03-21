import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { analyzeProduct } from '../../shared/api/products'
import type { AnalysisOverallStatus } from '../../shared/domain/contracts'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function ProductResultPage() {
  const { gtin } = useParams()
  const { selectedAllergens } = useProfile()

  const normalizedGtin = gtin ?? ''
  const analysisQuery = useQuery({
    queryKey: ['analysis', normalizedGtin, selectedAllergens],
    queryFn: () =>
      analyzeProduct({
        gtin: normalizedGtin,
        selectedAllergens,
      }),
    enabled: normalizedGtin.length > 0,
  })

  const heroCopy = useMemo(() => {
    const overallStatus = analysisQuery.data?.analysis.overallStatus

    switch (overallStatus) {
      case 'Contains':
        return {
          className: 'warning',
          eyebrow: 'Contains allergens',
          title: 'This product is not safe for your profile.',
          description: 'Confirmed allergen matches were found in the available product data.',
        }
      case 'MayContain':
        return {
          className: 'caution',
          eyebrow: 'Trace warning',
          title: 'Use caution before buying.',
          description: 'The product carries at least one trace warning for your selected allergens.',
        }
      case 'Safe':
        return {
          className: 'safe',
          eyebrow: 'Safe choice',
          title: 'Safe to enjoy.',
          description: 'No selected allergens were detected in the available product data.',
        }
      default:
        return {
          className: 'unknown',
          eyebrow: 'Analysis pending',
          title: 'We need more product data.',
          description: 'The app could not complete a confident analysis for this product yet.',
        }
    }
  }, [analysisQuery.data?.analysis.overallStatus])

  return (
    <section className="stack-xl">
      {analysisQuery.isLoading ? (
        <section className="content-card stack-md">
          <p className="eyebrow">Loading analysis</p>
          <p className="supporting-text">Checking the selected product against your saved allergen profile...</p>
        </section>
      ) : null}

      {analysisQuery.isError ? (
        <section className="status-panel status-panel--error stack-sm" role="alert">
          <p className="eyebrow">Analysis unavailable</p>
          <p className="supporting-text">We could not analyze this product right now. Please try another item or try again.</p>
        </section>
      ) : null}

      {analysisQuery.data ? (
        <>
          <div className={`hero-card hero-card--${heroCopy.className} stack-md`}>
            <p className="eyebrow eyebrow--light">{heroCopy.eyebrow}</p>
            <h1 className="display-title display-title--light">{heroCopy.title}</h1>
            <p className="supporting-text supporting-text--light">{heroCopy.description}</p>
          </div>

          <section className="content-card stack-md">
            <p className="eyebrow">Product summary</p>
            <h2 className="section-title">{analysisQuery.data.product.name}</h2>
            <p className="supporting-text">
              {[analysisQuery.data.product.brand, analysisQuery.data.product.category]
                .filter(Boolean)
                .join(' • ') || 'Product details'}
            </p>
            {analysisQuery.data.product.subtitle ? (
              <p className="supporting-text">{analysisQuery.data.product.subtitle}</p>
            ) : null}
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Analysis summary</p>
            <div className="status-summary-grid">
              <StatusSummaryCard
                label="Overall status"
                value={formatOverallStatus(analysisQuery.data.analysis.overallStatus)}
              />
              <StatusSummaryCard
                label="Matched allergens"
                value={joinOrFallback(analysisQuery.data.analysis.matchedAllergens, 'None detected')}
              />
              <StatusSummaryCard
                label="Trace warnings"
                value={joinOrFallback(analysisQuery.data.analysis.traceAllergens, 'None reported')}
              />
            </div>
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Checked allergens</p>
            <div className="checked-allergen-list">
              {analysisQuery.data.analysis.checkedAllergens.map((checkedAllergen) => (
                <div key={checkedAllergen.code} className="checked-allergen-item">
                  <span>{formatAllergenCode(checkedAllergen.code)}</span>
                  <span className={`inline-status inline-status--${toStatusTone(checkedAllergen.status)}`}>
                    {formatCheckedStatus(checkedAllergen.status)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Ingredient review</p>
            <p className="supporting-text">{analysisQuery.data.product.ingredientsText}</p>

            {analysisQuery.data.analysis.ingredientHighlights.length > 0 ? (
              <div className="highlight-list">
                {analysisQuery.data.analysis.ingredientHighlights.map((highlight) => (
                  <div key={`${highlight.allergenCode}-${highlight.text}`} className="highlight-item">
                    <span className={`inline-status inline-status--${toStatusTone(highlight.severity)}`}>
                      {formatCheckedStatus(highlight.severity)}
                    </span>
                    <span>{highlight.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="supporting-text">No highlighted ingredient matches were returned for your selected allergens.</p>
            )}
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Next actions</p>
            <div className="action-row">
              <Link to="/scan" className="primary-action primary-action--link">
                Scan another product
              </Link>
              <button type="button" className="secondary-action">
                Save to Favorites
              </button>
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}

function StatusSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="status-summary-card stack-sm">
      <p className="eyebrow">{label}</p>
      <p className="status-summary-card__value">{value}</p>
    </article>
  )
}

function joinOrFallback(values: string[], fallback: string) {
  return values.length > 0 ? values.map(formatAllergenCode).join(', ') : fallback
}

function formatOverallStatus(status: AnalysisOverallStatus) {
  switch (status) {
    case 'Safe':
      return 'Safe'
    case 'MayContain':
      return 'May contain traces'
    case 'Contains':
      return 'Contains allergen'
    default:
      return 'Unknown'
  }
}

function formatCheckedStatus(status: 'Contains' | 'MayContain' | 'NotFound' | 'Unknown') {
  switch (status) {
    case 'Contains':
      return 'Contains'
    case 'MayContain':
      return 'May contain'
    case 'NotFound':
      return 'Not found'
    default:
      return 'Unknown'
  }
}

function toStatusTone(status: 'Contains' | 'MayContain' | 'NotFound' | 'Unknown') {
  switch (status) {
    case 'Contains':
      return 'warning'
    case 'MayContain':
      return 'caution'
    case 'NotFound':
      return 'safe'
    default:
      return 'neutral'
  }
}

function formatAllergenCode(code: string) {
  return code
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}
