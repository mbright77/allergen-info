import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'
import { useProfile } from '../../shared/profile/ProfileProvider'
import { readRecentSearches } from '../../shared/search/recent-searches'

export function HomePage() {
  const { activeProfile, selectedAllergens } = useProfile()
  const { favorites, history } = useCollections()
  const recentSearches = readRecentSearches()
  const activeProfileName = activeProfile?.name ?? 'Your profile'

  return (
    <section className="stack-xl">
      <section className="hero-card hero-card--safe home-hero stack-lg">
        <p className="eyebrow eyebrow--light">Welcome</p>
        <h1 className="display-title display-title--light">Safe choices, faster.</h1>
        <p className="supporting-text supporting-text--light">
          {activeProfileName} is active with {selectedAllergens.length} monitored allergens. Start with search, or launch the camera only when you are ready to scan.
        </p>
        <div className="action-row">
          <Link to="/scan" className="primary-action primary-action--link">
            Scan or search now
          </Link>
          <Link to="/favorites" className="secondary-action secondary-action--link">
            Review favorites
          </Link>
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Snapshot</p>
        <div className="result-bento-grid">
          <HomeMetricCard label={activeProfileName} value={`${selectedAllergens.length} allergens`} />
          <HomeMetricCard label="Favorites" value={`${favorites.length} items`} />
          <HomeMetricCard label="Recent checks" value={`${history.length} products`} />
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Recent searches</p>
        {recentSearches.length > 0 ? (
          <div className="saved-item-list">
            {recentSearches.slice(0, 4).map((entry) => (
              <Link
                key={`${entry.query}-${entry.updatedAt}`}
                to={`/search/results?q=${encodeURIComponent(entry.query)}`}
                className="saved-item-card saved-item-card--compact"
              >
                <RecentSearchArtwork entry={entry} />
                <div className="stack-sm saved-item-card__body">
                  <p className="eyebrow">Recent search</p>
                  <h2 className="section-title">{entry.query}</h2>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="supporting-text">Recent searches will appear here after you search from the scanner screen or launch a manual scan.</p>
        )}
      </section>
    </section>
  )
}

function RecentSearchArtwork({
  entry,
}: {
  entry: {
    query: string
    imageUrl?: string | null
  }
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = !!entry.imageUrl && !imageFailed

  return (
    <div className="saved-item-card__media" aria-hidden="true">
      {showImage ? (
        <img
          className="result-product-card__image"
          src={entry.imageUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {!showImage ? <span>#{entry.query.charAt(0).toUpperCase()}</span> : null}
    </div>
  )
}

function HomeMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="status-summary-card stack-sm">
      <p className="eyebrow">{label}</p>
      <p className="status-summary-card__value">{value}</p>
    </article>
  )
}
