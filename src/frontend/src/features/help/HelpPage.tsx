import { useTranslation } from 'react-i18next'

import { usePageTitle } from '../../shared/i18n/usePageTitle'

export function HelpPage() {
  const { t } = useTranslation('help')

  usePageTitle(t('Page.Title'))

  return (
    <section className="stack-xl">
      <section className="content-card stack-lg secondary-screen-hero">
        <p className="eyebrow">{t('Hero.Eyebrow')}</p>
        <h1 className="display-title">{t('Hero.Title')}</h1>
        <p className="supporting-text">
          {t('Hero.Description')}
        </p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Selection.Title')}</p>
        <p className="supporting-text">
          {t('Selection.ParagraphOne')}
        </p>
        <p className="supporting-text">
          {t('Selection.ParagraphTwo')}
        </p>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('Responses.Title')}</p>
        <div className="stack-sm">
          <p className="supporting-text">{t('Responses.Safe')}</p>
          <p className="supporting-text">{t('Responses.MayContain')}</p>
          <p className="supporting-text">{t('Responses.Contains')}</p>
          <p className="supporting-text">{t('Responses.Unknown')}</p>
        </div>
      </section>

      <section className="content-card stack-md">
        <p className="eyebrow">{t('BeforeBuy.Title')}</p>
        <p className="supporting-text">
          {t('BeforeBuy.Description')}
        </p>
      </section>
    </section>
  )
}
