import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

import { analyzeProduct } from '../../shared/api/products'
import { formatAllergenCode } from '../../shared/allergens/metadata'
import { buildAnalysisCacheKey, readCachedAnalysis, writeCachedAnalysis } from '../../shared/results/analysis-cache'
import type { AnalysisOverallStatus } from '../../shared/domain/contracts'
import { toSavedProductItem } from '../../shared/collections/saved-products'
import { useCollections } from '../../shared/collections/useCollections'
import { formatNumber } from '../../shared/i18n/format'
import { formatAnalysisStatus, formatCheckedStatus } from '../../shared/i18n/status'
import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'

export function ProductResultPage() {
  const { t, i18n } = useTranslation('results')
  const { gtin } = useParams()
  const { activeProfile, selectedAllergens } = useProfile()
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
            eyebrow: t('Hero.Contains.Eyebrow'),
            title: t('Hero.Contains.Title'),
            description: t('Hero.Contains.Description'),
          }
        case 'MayContain':
          return {
            className: 'caution',
            eyebrow: t('Hero.MayContain.Eyebrow'),
            title: t('Hero.MayContain.Title'),
            description: t('Hero.MayContain.Description'),
          }
        case 'Safe':
          return {
            className: 'safe',
            eyebrow: t('Hero.Safe.Eyebrow'),
            title: t('Hero.Safe.Title'),
            description: t('Hero.Safe.Description'),
          }
        default:
          return {
            className: 'unknown',
            eyebrow: t('Hero.Unknown.Eyebrow'),
            title: t('Hero.Unknown.Title'),
            description: t('Hero.Unknown.Description'),
          }
      }
  }, [resolvedAnalysis?.analysis.overallStatus, t])

  usePageTitle(resolvedAnalysis?.product.name ? t('Page.TitleWithName', { name: resolvedAnalysis.product.name }) : t('Page.Title'))

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
          <p className="eyebrow">{t('Loading.Title')}</p>
          <p className="supporting-text">{t('Loading.Description')}</p>
        </section>
      ) : null}

      {analysisQuery.isError && !cachedAnalysis ? (
        <section className="status-panel status-panel--error stack-sm" role="alert">
          <p className="eyebrow">{t('Error.Title')}</p>
          <p className="supporting-text">{t('Error.Description')}</p>
        </section>
      ) : null}

      {resolvedAnalysis ? (
        <>
          {isShowingCachedAnalysis ? (
            <section className="content-card content-card--accent stack-sm" role="status">
              <p className="eyebrow">{t('Offline.Title')}</p>
              <p className="supporting-text">{t('Offline.Description')}</p>
            </section>
          ) : null}

          <div className={`hero-card hero-card--${heroCopy.className} hero-card--result stack-md`}>
            <div className="hero-card__icon-shell" aria-hidden="true">
              <span className="material-symbols-outlined hero-card__icon">{getHeroIcon(resolvedAnalysis.analysis.overallStatus)}</span>
            </div>
            <p className="eyebrow eyebrow--light">{heroCopy.eyebrow}</p>
            <h1 className="display-title display-title--light">{heroCopy.title}</h1>
            <p className="supporting-text supporting-text--light">{heroCopy.description}</p>
          </div>

          <section className="result-product-card">
            <ResultProductArtwork product={resolvedAnalysis.product} />
            <div className="stack-sm">
              <p className="eyebrow">{resolvedAnalysis.product.category ?? t('Product.SummaryFallback')}</p>
              <h2 className="section-title">{resolvedAnalysis.product.name}</h2>
              <p className="supporting-text">
                {[resolvedAnalysis.product.brand, resolvedAnalysis.product.subtitle]
                  .filter(Boolean)
                  .join(' • ') || t('Product.DetailsFallback')}
              </p>
            </div>
          </section>

          <section className="result-bento-grid">
            <article className="status-summary-card stack-sm">
              <p className="eyebrow">{t('Summary.Analysis')}</p>
              <p className="status-summary-card__value">{formatAnalysisStatus(resolvedAnalysis.analysis.overallStatus)}</p>
            </article>
            <article className="status-summary-card stack-sm">
              <p className="eyebrow">{t('Summary.YourProfile')}</p>
              <p className="status-summary-card__value">
                {activeProfile
                  ? `${activeProfile.name} • ${t('Summary.AllergensChecked', { count: resolvedAnalysis.analysis.checkedAllergens.length, formattedCount: formatNumber(resolvedAnalysis.analysis.checkedAllergens.length, undefined, i18n.resolvedLanguage) })}`
                  : t('Summary.AllergensChecked', { count: resolvedAnalysis.analysis.checkedAllergens.length, formattedCount: formatNumber(resolvedAnalysis.analysis.checkedAllergens.length, undefined, i18n.resolvedLanguage) })}
              </p>
            </article>
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">{t('Summary.Title')}</p>
            <div className="status-summary-grid">
              <StatusSummaryCard
                label={t('Summary.OverallStatus')}
                value={formatAnalysisStatus(resolvedAnalysis.analysis.overallStatus)}
              />
              <StatusSummaryCard
                label={t('Summary.MatchedAllergens')}
                value={joinOrFallback(resolvedAnalysis.analysis.matchedAllergens, t('Summary.NoneDetected'))}
              />
              <StatusSummaryCard
                label={t('Summary.TraceWarnings')}
                value={joinOrFallback(resolvedAnalysis.analysis.traceAllergens, t('Summary.NoneReported'))}
              />
            </div>
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">{t('Sections.CheckedAllergens')}</p>
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
            <p className="eyebrow">{t('Sections.IngredientReview')}</p>
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
              <p className="supporting-text">{t('IngredientReview.NoMatches')}</p>
            )}
          </section>

          <section className="content-card stack-md">
            <p className="eyebrow">{t('Sections.NextActions')}</p>
            <div className="action-row">
              <Link to="/scan" className="primary-action primary-action--link">
                {t('Actions.ScanAnother')}
              </Link>
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  toggleFavorite(toSavedProductItem(resolvedAnalysis))
                }}
              >
                {isFavorite(resolvedAnalysis.product.gtin) ? t('Actions.RemoveFavorite') : t('Actions.SaveFavorite')}
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

function getHeroIcon(status: AnalysisOverallStatus) {
  switch (status) {
    case 'Safe':
      return 'check_circle'
    case 'MayContain':
      return 'warning'
    case 'Contains':
      return 'error'
    default:
      return 'help'
  }
}

function getProductMonogram(brand: string | null | undefined, name: string) {
  const source = (brand ?? name).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS'
}

function ResultProductArtwork({
  product,
}: {
  product: {
    brand?: string | null
    name: string
    imageUrl?: string | null
  }
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = !!product.imageUrl && !imageFailed

  return (
    <div className="result-product-card__media" aria-hidden="true">
      {showImage ? (
        <img
          className="result-product-card__image"
          src={product.imageUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {!showImage ? <span>{getProductMonogram(product.brand, product.name)}</span> : null}
    </div>
  )
}
