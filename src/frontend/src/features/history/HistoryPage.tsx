import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { useCollections } from '../../shared/collections/useCollections'
import { formatCollectionStatus } from '../../shared/i18n/status'
import { usePageTitle } from '../../shared/i18n/usePageTitle'

export function HistoryPage() {
  const { t } = useTranslation('history')
  const { history } = useCollections()

  usePageTitle(t('Page.Title'))

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">{t('Hero.Eyebrow')}</p>
        <h1 className="display-title">{t('Hero.Title')}</h1>
        <p className="supporting-text">{t('Hero.Description')}</p>
      </section>

      {history.length > 0 ? (
        <div className="saved-item-list">
          {history.map((entry) => (
            <article key={`${entry.gtin}-${entry.updatedAt}`} className="saved-item-card">
              <div className="saved-item-card__media" aria-hidden="true">
                <span>{getProductMonogram(entry.brand, entry.name)}</span>
              </div>
              <div className="stack-sm saved-item-card__body">
                <p className="eyebrow">{entry.brand ?? t('Card.ProductCheck')}</p>
                <h2 className="section-title">{entry.name}</h2>
                <p className="supporting-text">{entry.subtitle ?? entry.category ?? t('Card.CheckedAgainstProfile')}</p>
              </div>
              <div className="saved-item-card__footer">
                <Link to={`/results/${encodeURIComponent(entry.gtin)}`} className="secondary-action secondary-action--link">
                  {t('Actions.ViewAnalysis')}
                </Link>
                <span className={`inline-status inline-status--${toStatusTone(entry.overallStatus)}`}>
                  {formatCollectionStatus(entry.overallStatus)}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="content-card stack-md">
          <p className="eyebrow">{t('Empty.Title')}</p>
          <p className="supporting-text">{t('Empty.Description')}</p>
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
