import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { formatNumber } from '../../shared/i18n/format'
import { supportedLanguages } from '../../shared/i18n/config'
import { useProfile } from '../../shared/profile/useProfile'

export function AppShell({ children }: PropsWithChildren) {
  const { t } = useTranslation(['common', 'app'])
  const location = useLocation()
  const navigate = useNavigate()
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false,
  )
  const { activeProfile, hasProfiles } = useProfile()

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
  const navigation = useMemo(
    () => [
      { to: '/home', label: t('Nav.Home', { ns: 'common' }), icon: 'home' },
      { to: '/scan', label: t('Nav.Scan', { ns: 'common' }), icon: 'barcode_scanner' },
      { to: '/favorites', label: t('Nav.Favorites', { ns: 'common' }), icon: 'favorite' },
      { to: '/profile', label: t('Nav.Profile', { ns: 'common' }), icon: 'person' },
    ],
    [t],
  )
  const activeProfileMonogram = useMemo(() => {
    if (!activeProfile) {
      return 'SS'
    }

    return activeProfile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'SS'
  }, [activeProfile])

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }

    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={isOnboardingRoute ? 'app-shell app-shell--no-nav' : 'app-shell'}>
      {isOffline ? (
        <div className="offline-banner" role="status" aria-live="polite">
          {t('OfflineBanner.Message', { ns: 'app' })}
        </div>
      ) : null}

      <header className={isOnboardingRoute ? 'top-bar top-bar--minimal' : 'top-bar'}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            {t('AppName', { ns: 'common' })}
          </span>
        </div>
        <div className="top-bar-actions" role="group" aria-label={t('TopBar.ActionsLabel', { ns: 'common' })}>
          <button type="button" className="icon-button" aria-label={t('TopBar.Help', { ns: 'common' })} onClick={() => navigate('/help')}>
            <span className="material-symbols-outlined" aria-hidden="true">
              help
            </span>
          </button>

          {isOnboardingRoute ? null : (
            <>
              {hasProfiles ? (
                <ProfileSwitcherMenu key={location.pathname} activeProfileMonogram={activeProfileMonogram} />
              ) : null}
            </>
          )}
        </div>
      </header>

      <main className="page-frame">{children}</main>

      {isOnboardingRoute ? null : (
        <nav className="bottom-nav" aria-label={t('Nav.PrimaryNavigation', { ns: 'app', defaultValue: 'Primary navigation' })}>
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'bottom-nav-item bottom-nav-item--active' : 'bottom-nav-item'
              }
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

function ProfileSwitcherMenu({ activeProfileMonogram }: { activeProfileMonogram: string }) {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const [isProfilesOpen, setIsProfilesOpen] = useState(false)
  const { profiles, activeProfileId, setActiveProfile } = useProfile()

  return (
    <div className="profile-switcher-shell">
      <button
        type="button"
        className="profile-switcher-trigger"
        aria-label={t('TopBar.Profiles')}
        aria-expanded={isProfilesOpen}
        aria-haspopup="menu"
        onClick={() => setIsProfilesOpen((current) => !current)}
      >
        <span className="avatar-shell" aria-hidden="true">
          {activeProfileMonogram}
        </span>
        <span className="material-symbols-outlined" aria-hidden="true">
          expand_more
        </span>
      </button>

      {isProfilesOpen ? (
        <div className="profile-switcher-menu content-card stack-sm" role="menu" aria-label={t('TopBar.SavedProfiles')}>
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              className={profile.id === activeProfileId ? 'profile-switcher-item profile-switcher-item--active' : 'profile-switcher-item'}
              role="menuitemradio"
              aria-checked={profile.id === activeProfileId}
              onClick={() => {
                setActiveProfile(profile.id)
                setIsProfilesOpen(false)
              }}
            >
              <span className="profile-switcher-item__title">{profile.name}</span>
              <span className="profile-switcher-item__meta">
                {profile.selectedAllergens.length > 0
                  ? t('TopBar.ProfileSummary', {
                      count: profile.selectedAllergens.length,
                      formattedCount: formatNumber(profile.selectedAllergens.length, undefined, i18n.resolvedLanguage),
                    })
                  : t('TopBar.ProfileSummaryEmpty')}
              </span>
            </button>
          ))}
          <button
            type="button"
            className="profile-switcher-item profile-switcher-item--create"
            role="menuitem"
            onClick={() => {
              setIsProfilesOpen(false)
              navigate('/profiles/new')
            }}
          >
            <span className="profile-switcher-item__title">{t('TopBar.AddProfileTitle')}</span>
            <span className="profile-switcher-item__meta">{t('TopBar.AddProfileDescription')}</span>
          </button>

          <div className="profile-switcher-item" role="group" aria-label={t('TopBar.LanguageLabel')}>
            <span className="profile-switcher-item__title">{t('TopBar.LanguageTitle')}</span>
            <div className="stack-sm">
              {supportedLanguages.map((language) => {
                const isActiveLanguage = (i18n.resolvedLanguage ?? i18n.language) === language.code

                return (
                  <button
                    key={language.code}
                    type="button"
                    className={isActiveLanguage ? 'profile-switcher-item profile-switcher-item--active' : 'profile-switcher-item'}
                    role="menuitemradio"
                    aria-checked={isActiveLanguage}
                    onClick={async () => {
                      await i18n.changeLanguage(language.code)
                      setIsProfilesOpen(false)
                    }}
                  >
                    <span className="profile-switcher-item__title">{t(language.labelKey)}</span>
                    <span className="profile-switcher-item__meta">
                      {isActiveLanguage ? t('TopBar.ActiveLanguage') : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
