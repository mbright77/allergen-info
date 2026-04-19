import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/useCollections'
import { formatNumber } from '../../shared/i18n/format'
import { usePageTitle } from '../../shared/i18n/usePageTitle'
import { useProfile } from '../../shared/profile/useProfile'
import { readRecentSearches } from '../../shared/search/recent-searches'

export function HomePage() {
  const { t, i18n } = useTranslation('home')
  const { activeProfile, selectedAllergens } = useProfile()
  const { favorites, history } = useCollections()
  const recentSearches = readRecentSearches()
  const activeProfileName = activeProfile?.name ?? t('Page.Title')

  usePageTitle(t('Page.Title'))

  return (
    <section className="stack-xl">
      <section className="hero-card hero-card--safe home-hero stack-lg">
        <p className="eyebrow eyebrow--light">{t('Hero.Eyebrow')}</p>
        <h1 className="display-title display-title--light">{t('Hero.Title')}</h1>
        <p className="supporting-text supporting-text--light">
          {t('Hero.Description', {
            name: activeProfileName,
            formattedCount: formatNumber(selectedAllergens.length, undefined, i18n.resolvedLanguage),
          })}
        </p>
        <div className="action-row">
          <Link to="/scan" className="primary-action primary-action--link">
            {t('Actions.ScanOrSearch')}
          </Link>
          <Link to="/favorites" className="secondary-action secondary-action--link">
            {t('Actions.ReviewFavorites')}
          </Link>
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Snapshot.Title')}</p>
        <div className="result-bento-grid">
          <HomeMetricCard label={activeProfileName} value={t('Snapshot.AllergensCount', { count: selectedAllergens.length, formattedCount: formatNumber(selectedAllergens.length, undefined, i18n.resolvedLanguage) })} />
          <HomeMetricCard label={t('Snapshot.FavoritesLabel')} value={t('Snapshot.ItemsCount', { count: favorites.length, formattedCount: formatNumber(favorites.length, undefined, i18n.resolvedLanguage) })} />
          <HomeMetricCard label={t('Snapshot.RecentChecksLabel')} value={t('Snapshot.ProductsCount', { count: history.length, formattedCount: formatNumber(history.length, undefined, i18n.resolvedLanguage) })} />
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('RecentSearches.Title')}</p>
        {recentSearches.length > 0 ? (
          <div className="saved-item-list">
            {recentSearches.slice(0, 4).map((entry) => (
              <Link
                key={`${entry.query}-${entry.updatedAt}`}
                to={`/search/results?q=${encodeURIComponent(entry.query)}`}
                className="saved-item-card saved-item-card--compact"
                aria-label={t('RecentSearches.CardLabel', { query: entry.query })}
              >
                <RecentSearchArtwork entry={entry} />
                <div className="stack-sm saved-item-card__body">
                  <p className="eyebrow">{t('RecentSearches.Eyebrow')}</p>
                  <h2 className="section-title">{entry.query}</h2>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="supporting-text">{t('RecentSearches.Empty')}</p>
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
