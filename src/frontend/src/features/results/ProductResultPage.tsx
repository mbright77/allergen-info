import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'

import { analyzeProduct } from '../../shared/api/products'
import { buildAnalysisCacheKey, readCachedAnalysis, writeCachedAnalysis } from '../../shared/results/analysis-cache'
import type { AnalysisOverallStatus } from '../../shared/domain/contracts'
import { toSavedProductItem, useCollections } from '../../shared/collections/CollectionsProvider'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function ProductResultPage() {
  const { gtin } = useParams()
  const { selectedAllergens } = useProfile()
  const { addHistoryEntry, isFavorite, toggleFavorite } = useCollections()

  const normalizedGtin = gtin ?? ''
  const analysisCacheKey = useMemo(
    () => buildAnalysisCacheKey(normalizedGtin, selectedAllergens),
    [normalizedGtin, selectedAllergens],
  )
  const cachedAnalysis = useMemo(() => readCachedAnalysis(analysisCacheKey), [analysisCacheKey])
  const analysisQuery = useQuery({
    queryKey: ['analysis', normalizedGtin, selectedAllergens],
    queryFn: () =>
      analyzeProduct({
        gtin: normalizedGtin,
        selectedAllergens,
      }),
    enabled: normalizedGtin.length > 0,
  })
  const resolvedAnalysis = analysisQuery.data ?? (analysisQuery.isError ? cachedAnalysis : null)
  const isShowingCachedAnalysis = analysisQuery.isError && !!cachedAnalysis

  const heroCopy = useMemo(() => {
    const overallStatus = resolvedAnalysis?.analysis.overallStatus

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
  }, [resolvedAnalysis?.analysis.overallStatus])

  useEffect(() => {
    if (analysisQuery.data) {
      writeCachedAnalysis(analysisCacheKey, analysisQuery.data)
      addHistoryEntry(toSavedProductItem(analysisQuery.data))
    }
  }, [addHistoryEntry, analysisCacheKey, analysisQuery.data])

  useEffect(() => {
    if (isShowingCachedAnalysis && cachedAnalysis) {
      addHistoryEntry(toSavedProductItem(cachedAnalysis))
    }
  }, [addHistoryEntry, cachedAnalysis, isShowingCachedAnalysis])

  return (
    <section className="stack-xl">
      {analysisQuery.isLoading ? (
        <section className="content-card stack-md">
          <p className="eyebrow">Loading analysis</p>
          <p className="supporting-text">Checking the selected product against your saved allergen profile...</p>
        </section>
      ) : null}

      {analysisQuery.isError && !cachedAnalysis ? (
        <section className="status-panel status-panel--error stack-sm" role="alert">
          <p className="eyebrow">Analysis unavailable</p>
          <p className="supporting-text">We could not analyze this product right now. Please try another item or try again.</p>
        </section>
      ) : null}

      {resolvedAnalysis ? (
        <>
          {isShowingCachedAnalysis ? (
            <section className="content-card content-card--accent stack-sm" role="status">
              <p className="eyebrow">Offline fallback</p>
              <p className="supporting-text">Showing your last saved analysis for this product while the network is unavailable.</p>
            </section>
          ) : null}

          <div className={`hero-card hero-card--${heroCopy.className} stack-md`}>
            <p className="eyebrow eyebrow--light">{heroCopy.eyebrow}</p>
            <h1 className="display-title display-title--light">{heroCopy.title}</h1>
            <p className="supporting-text supporting-text--light">{heroCopy.description}</p>
          </div>

          <section className="content-card stack-md">
            <p className="eyebrow">Product summary</p>
            <h2 className="section-title">{resolvedAnalysis.product.name}</h2>
            <p className="supporting-text">
              {[resolvedAnalysis.product.brand, resolvedAnalysis.product.category]
                .filter(Boolean)
                .join(' • ') || 'Product details'}
            </p>
            {resolvedAnalysis.product.subtitle ? (
              <p className="supporting-text">{resolvedAnalysis.product.subtitle}</p>
            ) : null}
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Analysis summary</p>
            <div className="status-summary-grid">
              <StatusSummaryCard
                label="Overall status"
                value={formatOverallStatus(resolvedAnalysis.analysis.overallStatus)}
              />
              <StatusSummaryCard
                label="Matched allergens"
                value={joinOrFallback(resolvedAnalysis.analysis.matchedAllergens, 'None detected')}
              />
              <StatusSummaryCard
                label="Trace warnings"
                value={joinOrFallback(resolvedAnalysis.analysis.traceAllergens, 'None reported')}
              />
            </div>
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">Checked allergens</p>
            <div className="checked-allergen-list">
              {resolvedAnalysis.analysis.checkedAllergens.map((checkedAllergen) => (
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
            <p className="supporting-text">{resolvedAnalysis.product.ingredientsText}</p>

            {resolvedAnalysis.analysis.ingredientHighlights.length > 0 ? (
              <div className="highlight-list">
                {resolvedAnalysis.analysis.ingredientHighlights.map((highlight) => (
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
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  toggleFavorite(toSavedProductItem(resolvedAnalysis))
                }}
              >
                {isFavorite(resolvedAnalysis.product.gtin) ? 'Remove from Favorites' : 'Save to Favorites'}
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
