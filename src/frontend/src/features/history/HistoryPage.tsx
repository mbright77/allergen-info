import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'

export function HistoryPage() {
  const { history } = useCollections()

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">History</p>
        <h1 className="display-title">Recent scans and checks.</h1>
        <p className="supporting-text">Your latest analyzed products appear here automatically after you open a result.</p>
      </section>

      {history.length > 0 ? (
        <div className="saved-item-list">
          {history.map((entry) => (
            <article key={`${entry.gtin}-${entry.updatedAt}`} className="saved-item-card">
              <div className="saved-item-card__media" aria-hidden="true">
                <span>{getProductMonogram(entry.brand, entry.name)}</span>
              </div>
              <div className="stack-sm saved-item-card__body">
                <p className="eyebrow">{entry.brand ?? 'Product check'}</p>
                <h2 className="section-title">{entry.name}</h2>
                <p className="supporting-text">{entry.subtitle ?? entry.category ?? 'Checked against your allergy profile'}</p>
              </div>
              <div className="saved-item-card__footer">
                <Link to={`/results/${encodeURIComponent(entry.gtin)}`} className="secondary-action secondary-action--link">
                  View analysis
                </Link>
                <span className={`inline-status inline-status--${toStatusTone(entry.overallStatus)}`}>
                  {formatStatus(entry.overallStatus)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="content-card stack-md">
          <p className="eyebrow">No history yet</p>
          <p className="supporting-text">Open a product analysis and it will appear here for quick revisit.</p>
        </section>
      )}
    </section>
  )
}

function getProductMonogram(brand: string | null | undefined, name: string) {
  const source = (brand ?? name).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS'
}

function formatStatus(status: 'Safe' | 'MayContain' | 'Contains' | 'Unknown') {
  switch (status) {
    case 'Safe':
      return 'Safe'
    case 'MayContain':
      return 'Caution'
    case 'Contains':
      return 'Warning'
    default:
      return 'Unknown'
  }
}

function toStatusTone(status: 'Safe' | 'MayContain' | 'Contains' | 'Unknown') {
  switch (status) {
    case 'Safe':
      return 'safe'
    case 'MayContain':
      return 'caution'
    case 'Contains':
      return 'warning'
    default:
      return 'neutral'
  }
}
