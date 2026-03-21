import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'

export function FavoritesPage() {
  const { favorites } = useCollections()

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg">
        <p className="eyebrow">Favorites</p>
        <h1 className="display-title">Your saved products.</h1>
        <p className="supporting-text">Keep frequently checked items close at hand while the backend remains placeholder-driven.</p>
      </section>

      {favorites.length > 0 ? (
        <div className="stack-md">
          {favorites.map((favorite) => (
            <article key={favorite.gtin} className="content-card stack-sm">
              <p className="eyebrow">{favorite.brand ?? 'Saved product'}</p>
              <h2 className="section-title">{favorite.name}</h2>
              <p className="supporting-text">{favorite.subtitle ?? favorite.category ?? 'Saved from product analysis'}</p>
              <div className="action-row">
                <Link to={`/results/${encodeURIComponent(favorite.gtin)}`} className="secondary-action secondary-action--link">
                  Open result
                </Link>
                <span className={`inline-status inline-status--${toStatusTone(favorite.overallStatus)}`}>
                  {formatStatus(favorite.overallStatus)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="content-card stack-md">
          <p className="eyebrow">No favorites yet</p>
          <p className="supporting-text">Save products from the result screen to build your trusted shortlist.</p>
          <Link to="/scan" className="primary-action primary-action--link">
            Start scanning
          </Link>
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
