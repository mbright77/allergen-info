import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

import { useProfile } from '../../shared/profile/ProfileProvider'

const navigation = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'barcode_scanner' },
  { to: '/favorites', label: 'Favorites', icon: 'favorite' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false,
  )
  const [isProfilesOpen, setIsProfilesOpen] = useState(false)
  const { profiles, activeProfile, activeProfileId, hasProfiles, setActiveProfile } = useProfile()

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')
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

  useEffect(() => {
    setIsProfilesOpen(false)
  }, [location.pathname])

  return (
    <div className={isOnboardingRoute ? 'app-shell app-shell--no-nav' : 'app-shell'}>
      {isOffline ? (
        <div className="offline-banner" role="status" aria-live="polite">
          Offline mode: saved profiles, favorites, and history remain available.
        </div>
      ) : null}

      <header className={isOnboardingRoute ? 'top-bar top-bar--minimal' : 'top-bar'}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            SafeScan
          </span>
        </div>
        <div className="top-bar-actions" role="group" aria-label="App actions">
          <button type="button" className="icon-button" aria-label="Help">
            <span className="material-symbols-outlined" aria-hidden="true">
              help
            </span>
          </button>

          {isOnboardingRoute ? null : (
            <>
              <button type="button" className="icon-button" aria-label="Notifications">
                <span className="material-symbols-outlined" aria-hidden="true">
                  notifications
                </span>
              </button>
              {hasProfiles ? (
                <div className="profile-switcher-shell">
                  <button
                    type="button"
                    className="profile-switcher-trigger"
                    aria-label="Profiles"
                    aria-expanded={isProfilesOpen}
                    aria-haspopup="menu"
                    onClick={() => setIsProfilesOpen((current) => !current)}
                  >
                    <span className="avatar-shell" aria-hidden="true">
                      {activeProfileMonogram}
                    </span>
                    <span className="profile-switcher-trigger__copy">
                      <span className="profile-switcher-trigger__label">Active profile</span>
                      <span className="profile-switcher-trigger__value">{activeProfile?.name}</span>
                    </span>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      expand_more
                    </span>
                  </button>

                  {isProfilesOpen ? (
                    <div className="profile-switcher-menu content-card stack-sm" role="menu" aria-label="Saved profiles">
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
                              ? `${profile.selectedAllergens.length} allergens`
                              : 'No allergens selected'}
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
                        <span className="profile-switcher-item__title">Add profile</span>
                        <span className="profile-switcher-item__meta">Create another named profile</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </header>

      <main className="page-frame">{children}</main>

      {isOnboardingRoute ? null : (
        <nav className="bottom-nav" aria-label="Primary navigation">
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
