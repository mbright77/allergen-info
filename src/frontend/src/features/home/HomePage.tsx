import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/CollectionsProvider'
import { useProfile } from '../../shared/profile/ProfileProvider'
import { readRecentSearches } from '../../shared/search/recent-searches'

export function HomePage() {
  const { selectedAllergens } = useProfile()
  const { favorites, history } = useCollections()
  const recentSearches = readRecentSearches()

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg">
        <p className="eyebrow">Welcome</p>
        <h1 className="display-title">Safe choices, faster.</h1>
        <p className="supporting-text">
          Your profile is active with {selectedAllergens.length} monitored allergens. Start from scanning or jump back into a recent product.
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
        <div className="status-summary-grid">
          <HomeMetricCard label="Saved profile" value={`${selectedAllergens.length} allergens`} />
          <HomeMetricCard label="Favorites" value={`${favorites.length} items`} />
          <HomeMetricCard label="Recent checks" value={`${history.length} products`} />
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">Recent searches</p>
        {recentSearches.length > 0 ? (
          <div className="chip-row">
            {recentSearches.slice(0, 4).map((entry) => (
              <Link key={`${entry.query}-${entry.updatedAt}`} to={`/search/results?q=${encodeURIComponent(entry.query)}`} className="filter-chip secondary-action--link">
                {entry.query}
              </Link>
            ))}
          </div>
        ) : (
          <p className="supporting-text">Recent searches will appear here after you search from the scanner screen.</p>
        )}
      </section>
    </section>
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
