import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { analyzeScannedProduct } from '../../shared/api/products'
import { formatAllergenCode } from '../../shared/allergens/metadata'
import { toSavedProductItem } from '../../shared/collections/saved-products'
import { useCollections } from '../../shared/collections/useCollections'
import type { ScanAnalysisResponse } from '../../shared/domain/contracts'
import { formatAnalysisStatus } from '../../shared/i18n/status'
import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'

export function ScannedResultPage() {
  const { t } = useTranslation('results')
  const { code } = useParams()
  const navigate = useNavigate()
  const { selectedAllergens } = useProfile()
  const { addHistoryEntry } = useCollections()
  const normalizedCode = code ?? ''

  const scanQuery = useQuery({
    queryKey: ['scan-analysis', normalizedCode, selectedAllergens],
    queryFn: () =>
      analyzeScannedProduct({
        code: normalizedCode,
        selectedAllergens,
      }),
    enabled: normalizedCode.length > 0,
    retry: false,
  })

  usePageTitle(t('Scanned.PageTitle'))

  useEffect(() => {
    if (scanQuery.data?.resolution.mode === 'Full' && scanQuery.data.resolution.resolvedGtin) {
      navigate(`/results/${encodeURIComponent(scanQuery.data.resolution.resolvedGtin)}`, { replace: true })
    }
  }, [navigate, scanQuery.data])

  useEffect(() => {
    if (scanQuery.data?.resolution.mode !== 'Full' && scanQuery.data?.product && scanQuery.data?.analysis) {
      addHistoryEntry(toSavedProductItem({ product: scanQuery.data.product, analysis: scanQuery.data.analysis }))
    }
  }, [addHistoryEntry, scanQuery.data])

  if (scanQuery.isLoading) {
    return (
      <section className="content-card stack-md">
        <p className="eyebrow">{t('Scanned.Loading.Title')}</p>
        <p className="supporting-text">{t('Scanned.Loading.Description')}</p>
      </section>
    )
  }

  if (scanQuery.isError) {
    return (
      <section className="status-panel status-panel--error stack-sm" role="alert">
        <p className="eyebrow">{t('Scanned.Error.Title')}</p>
        <p className="supporting-text">{t('Scanned.Error.Description')}</p>
      </section>
    )
  }

  if (!scanQuery.data) {
    return null
  }

  if (scanQuery.data.resolution.mode === 'NotFound') {
    return (
      <section className="stack-xl">
        <section className="hero-card hero-card--unknown hero-card--result stack-md">
          <div className="hero-card__icon-shell" aria-hidden="true">
            <span className="material-symbols-outlined hero-card__icon">help</span>
          </div>
          <p className="eyebrow eyebrow--light">{t('Scanned.NotFound.Eyebrow')}</p>
          <h1 className="display-title display-title--light">{t('Scanned.NotFound.Title')}</h1>
          <p className="supporting-text supporting-text--light">{t('Scanned.NotFound.Description')}</p>
        </section>

        <section className="content-card stack-md">
          <p className="eyebrow">{t('Scanned.NotFound.ScannedCode')}</p>
          <p className="section-title">{scanQuery.data.resolution.scannedCode}</p>
          <div className="action-row">
            <Link to="/scan" className="primary-action primary-action--link">
              {t('Scanned.Actions.ScanAgain')}
            </Link>
            <Link to={`/search/results?q=${encodeURIComponent(scanQuery.data.resolution.scannedCode)}`} className="secondary-action secondary-action--link">
              {t('Scanned.Actions.SearchManually')}
            </Link>
          </div>
        </section>
      </section>
    )
  }

  return <ScannedFallbackResult response={scanQuery.data} />
}

function ScannedFallbackResult({ response }: { response: ScanAnalysisResponse }) {
  const { t } = useTranslation('results')
  const { product, analysis, resolution } = response

  if (!product || !analysis) {
    return null
  }

  const copy = getFallbackCopy(t, resolution.mode)

  return (
    <section className="stack-xl">
      <div className="hero-card hero-card--unknown hero-card--result stack-md">
        <div className="hero-card__icon-shell" aria-hidden="true">
          <span className="material-symbols-outlined hero-card__icon">help</span>
        </div>
        <p className="eyebrow eyebrow--light">{copy.eyebrow}</p>
        <h1 className="display-title display-title--light">{copy.title}</h1>
        <p className="supporting-text supporting-text--light">{resolution.message ?? copy.message}</p>
      </div>

      <section className="result-product-card">
        <ResultProductArtwork product={product} />
        <div className="stack-sm">
          <p className="eyebrow">{product.category ?? t('Scanned.Fallback.ProductSummary')}</p>
          <h2 className="section-title">{product.name}</h2>
          <p className="supporting-text">
            {[product.brand, product.subtitle].filter(Boolean).join(' • ') || t('Scanned.Fallback.BasicDetails')}
          </p>
        </div>
      </section>

      <section className="result-bento-grid">
        <article className="status-summary-card stack-sm">
          <p className="eyebrow">{t('Summary.Analysis')}</p>
          <p className="status-summary-card__value">{formatAnalysisStatus(analysis.overallStatus)}</p>
        </article>
        <article className="status-summary-card stack-sm">
          <p className="eyebrow">{t('Scanned.Fallback.ResolvedGtin')}</p>
          <p className="status-summary-card__value">{resolution.resolvedGtin ?? product.gtin}</p>
        </article>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Scanned.Fallback.WhatWeKnow')}</p>
        <div className="status-summary-grid">
          <StatusSummaryCard label={t('Summary.OverallStatus')} value={formatAnalysisStatus(analysis.overallStatus)} />
          <StatusSummaryCard label={t('Summary.MatchedAllergens')} value={t('Scanned.Fallback.NoDetailAvailable')} />
          <StatusSummaryCard label={t('Summary.TraceWarnings')} value={t('Scanned.Fallback.NoDetailAvailable')} />
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Sections.CheckedAllergens')}</p>
        <div className="checked-allergen-list">
          {analysis.checkedAllergens.map((checkedAllergen) => (
            <div key={checkedAllergen.code} className="checked-allergen-item">
              <span>{formatAllergenCode(checkedAllergen.code)}</span>
              <span className="inline-status inline-status--neutral">{formatAnalysisStatus('Unknown')}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Sections.NextActions')}</p>
        <p className="supporting-text">{copy.nextAction}</p>
        <div className="action-row">
          <Link to="/scan" className="primary-action primary-action--link">
            {t('Scanned.Actions.ScanAnother')}
          </Link>
          <Link to={`/search/results?q=${encodeURIComponent(resolution.scannedCode)}`} className="secondary-action secondary-action--link">
            {t('Scanned.Actions.SearchManually')}
          </Link>
        </div>
      </section>
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

function getFallbackCopy(
  t: ReturnType<typeof useTranslation<'results'>>['t'],
  mode: ScanAnalysisResponse['resolution']['mode'],
) {
  switch (mode) {
    case 'Unverified':
      return {
        eyebrow: t('Scanned.Modes.Unverified.Eyebrow'),
        title: t('Scanned.Modes.Unverified.Title'),
        message: t('Scanned.Modes.Unverified.Message'),
        nextAction: t('Scanned.Modes.Unverified.NextAction'),
      }
    case 'Basic':
    default:
      return {
        eyebrow: t('Scanned.Modes.Basic.Eyebrow'),
        title: t('Scanned.Modes.Basic.Title'),
        message: t('Scanned.Modes.Basic.Message'),
        nextAction: t('Scanned.Modes.Basic.NextAction'),
      }
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
