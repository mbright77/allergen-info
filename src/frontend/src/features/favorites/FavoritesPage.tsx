import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'

export function FavoritesPage() {
  const { favorites } = useCollections()

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">Favorites</p>
        <h1 className="display-title">Your saved products.</h1>
        <p className="supporting-text">Save trusted products here so you can revisit them quickly before your next shop.</p>
      </section>

      {favorites.length > 0 ? (
        <div className="saved-item-list">
          {favorites.map((favorite) => (
            <article key={favorite.gtin} className="saved-item-card">
              <div className="saved-item-card__media" aria-hidden="true">
                <span>{getProductMonogram(favorite.brand, favorite.name)}</span>
              </div>
              <div className="stack-sm saved-item-card__body">
                <p className="eyebrow">{favorite.brand ?? 'Saved product'}</p>
                <h2 className="section-title">{favorite.name}</h2>
                <p className="supporting-text">{favorite.subtitle ?? favorite.category ?? 'Saved from product analysis'}</p>
              </div>
              <div className="saved-item-card__footer">
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
