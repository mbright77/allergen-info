import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { analyzeScannedProduct } from '../../shared/api/products'
import { toSavedProductItem, useCollections } from '../../shared/collections/CollectionsProvider'
import type { AnalysisOverallStatus, ScanAnalysisResponse } from '../../shared/domain/contracts'
import { useProfile } from '../../shared/profile/ProfileProvider'

export function ScannedResultPage() {
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

  useEffect(() => {
    if (scanQuery.data?.resolution.mode === 'Full' && scanQuery.data.resolution.resolvedGtin) {
      navigate(`/results/${encodeURIComponent(scanQuery.data.resolution.resolvedGtin)}`, { replace: true })
    }
  }, [navigate, scanQuery.data])

  useEffect(() => {
    if (scanQuery.data?.resolution.mode === 'Basic' && scanQuery.data.product && scanQuery.data.analysis) {
      addHistoryEntry(toSavedProductItem({ product: scanQuery.data.product, analysis: scanQuery.data.analysis }))
    }
  }, [addHistoryEntry, scanQuery.data])

  if (scanQuery.isLoading) {
    return (
      <section className="content-card stack-md">
        <p className="eyebrow">Resolving scan</p>
        <p className="supporting-text">Searching for the scanned barcode and checking whether detailed allergen data is available...</p>
      </section>
    )
  }

  if (scanQuery.isError) {
    return (
      <section className="status-panel status-panel--error stack-sm" role="alert">
        <p className="eyebrow">Scan unavailable</p>
        <p className="supporting-text">We could not resolve this scan right now. Please try again or search manually.</p>
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
          <p className="eyebrow eyebrow--light">No product found</p>
          <h1 className="display-title display-title--light">We could not match this barcode yet.</h1>
          <p className="supporting-text supporting-text--light">Try scanning again in better light, or use search to find the product manually.</p>
        </section>

        <section className="content-card stack-md">
          <p className="eyebrow">Scanned code</p>
          <p className="section-title">{scanQuery.data.resolution.scannedCode}</p>
          <div className="action-row">
            <Link to="/scan" className="primary-action primary-action--link">
              Scan again
            </Link>
            <Link to={`/search/results?q=${encodeURIComponent(scanQuery.data.resolution.scannedCode)}`} className="secondary-action secondary-action--link">
              Search manually
            </Link>
          </div>
        </section>
      </section>
    )
  }

  return <ScannedFallbackResult response={scanQuery.data} />
}

function ScannedFallbackResult({ response }: { response: ScanAnalysisResponse }) {
  const { product, analysis, resolution } = response

  if (!product || !analysis) {
    return null
  }

  return (
    <section className="stack-xl">
      <div className="hero-card hero-card--unknown hero-card--result stack-md">
        <div className="hero-card__icon-shell" aria-hidden="true">
          <span className="material-symbols-outlined hero-card__icon">help</span>
        </div>
        <p className="eyebrow eyebrow--light">No allergen info found</p>
        <h1 className="display-title display-title--light">We found the product, but not the detailed allergen data.</h1>
        <p className="supporting-text supporting-text--light">{resolution.message ?? 'Showing basic product information only.'}</p>
      </div>

      <section className="result-product-card">
        <div className="result-product-card__media" aria-hidden="true">
          <span>{getProductMonogram(product.brand, product.name)}</span>
        </div>
        <div className="stack-sm">
          <p className="eyebrow">{product.category ?? 'Product summary'}</p>
          <h2 className="section-title">{product.name}</h2>
          <p className="supporting-text">
            {[product.brand, product.subtitle].filter(Boolean).join(' • ') || 'Basic product details only'}
          </p>
        </div>
      </section>

      <section className="result-bento-grid">
        <article className="status-summary-card stack-sm">
          <p className="eyebrow">Analysis</p>
          <p className="status-summary-card__value">Unknown</p>
        </article>
        <article className="status-summary-card stack-sm">
          <p className="eyebrow">Resolved GTIN</p>
          <p className="status-summary-card__value">{resolution.resolvedGtin ?? product.gtin}</p>
        </article>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">What we know</p>
        <div className="status-summary-grid">
          <StatusSummaryCard label="Overall status" value={formatOverallStatus(analysis.overallStatus)} />
          <StatusSummaryCard label="Matched allergens" value="No detail available" />
          <StatusSummaryCard label="Trace warnings" value="No detail available" />
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Checked allergens</p>
        <div className="checked-allergen-list">
          {analysis.checkedAllergens.map((checkedAllergen) => (
            <div key={checkedAllergen.code} className="checked-allergen-item">
              <span>{formatAllergenCode(checkedAllergen.code)}</span>
              <span className="inline-status inline-status--neutral">Unknown</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Next actions</p>
        <p className="supporting-text">Search manually or try another scan if you need a product with detailed allergen data.</p>
        <div className="action-row">
          <Link to="/scan" className="primary-action primary-action--link">
            Scan another product
          </Link>
          <Link to={`/search/results?q=${encodeURIComponent(resolution.scannedCode)}`} className="secondary-action secondary-action--link">
            Search manually
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

function formatOverallStatus(status: AnalysisOverallStatus) {
  return status === 'Unknown' ? 'Unknown' : status
}

function formatAllergenCode(code: string) {
  return code
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function getProductMonogram(brand: string | null | undefined, name: string) {
  const source = (brand ?? name).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS'
}
