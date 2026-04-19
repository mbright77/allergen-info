import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useCollections } from '../../shared/collections/useCollections'
import { formatCollectionStatus } from '../../shared/i18n/status'
import { usePageTitle } from '../../shared/i18n/usePageTitle'

export function FavoritesPage() {
  const { t } = useTranslation('favorites')
  const { favorites } = useCollections()

  usePageTitle(t('Page.Title'))

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">{t('Hero.Eyebrow')}</p>
        <h1 className="display-title">{t('Hero.Title')}</h1>
        <p className="supporting-text">{t('Hero.Description')}</p>
      </section>

      {favorites.length > 0 ? (
        <div className="saved-item-list">
          {favorites.map((favorite) => (
            <article key={favorite.gtin} className="saved-item-card">
              <FavoriteArtwork favorite={favorite} />
              <div className="stack-sm saved-item-card__body">
                <p className="eyebrow">{favorite.brand ?? t('Card.SavedProduct')}</p>
                <h2 className="section-title">{favorite.name}</h2>
                <p className="supporting-text">{favorite.subtitle ?? favorite.category ?? t('Card.SavedFromAnalysis')}</p>
              </div>
              <div className="saved-item-card__footer">
                <Link to={`/results/${encodeURIComponent(favorite.gtin)}`} className="secondary-action secondary-action--link">
                  {t('Actions.OpenResult')}
                </Link>
                <span className={`inline-status inline-status--${toStatusTone(favorite.overallStatus)}`}>
                  {formatCollectionStatus(favorite.overallStatus)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="content-card stack-md">
          <p className="eyebrow">{t('Empty.Title')}</p>
          <p className="supporting-text">{t('Empty.Description')}</p>
          <Link to="/scan" className="primary-action primary-action--link">
            {t('Actions.StartScanning')}
          </Link>
        </section>
      )}
    </section>
  )
}

function FavoriteArtwork({
  favorite,
}: {
  favorite: {
    brand?: string | null
    name: string
    imageUrl?: string | null
  }
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = !!favorite.imageUrl && !imageFailed

  return (
    <div className="saved-item-card__media" aria-hidden="true">
      {showImage ? (
        <img
          className="result-product-card__image"
          src={favorite.imageUrl ?? undefined}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      {!showImage ? <span>{getProductMonogram(favorite.brand, favorite.name)}</span> : null}
    </div>
  )
}

function getProductMonogram(brand: string | null | undefined, name: string) {
  const source = (brand ?? name).trim()
  const parts = source.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'SS'
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
