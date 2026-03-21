import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'

export function HistoryPage() {
  const { history } = useCollections()

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg">
        <p className="eyebrow">History</p>
        <h1 className="display-title">Recent scans and checks.</h1>
        <p className="supporting-text">Your latest analyzed products appear here automatically after you open a result.</p>
      </section>

      {history.length > 0 ? (
        <div className="stack-md">
          {history.map((entry) => (
            <article key={`${entry.gtin}-${entry.updatedAt}`} className="content-card stack-sm">
              <p className="eyebrow">{entry.brand ?? 'Product check'}</p>
              <h2 className="section-title">{entry.name}</h2>
              <p className="supporting-text">{entry.subtitle ?? entry.category ?? 'Checked against your allergy profile'}</p>
              <div className="action-row">
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
