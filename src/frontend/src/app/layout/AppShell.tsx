import { useEffect, useState, type PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'barcode_scanner' },
  { to: '/favorites', label: 'Favorites', icon: 'favorite' },
  { to: '/profile', label: 'Profile', icon: 'person' },
]

export function AppShell({ children }: PropsWithChildren) {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine === false : false,
  )

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
    <div className="app-shell">
      {isOffline ? (
        <div className="offline-banner" role="status" aria-live="polite">
          Offline mode: saved profile, favorites, and history remain available.
        </div>
      ) : null}

      <header className="top-bar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            SafeScan
          </span>
        </div>
        <div className="top-bar-actions" aria-label="App actions">
          <button type="button" className="icon-button" aria-label="Notifications">
            <span className="material-symbols-outlined" aria-hidden="true">
              notifications
            </span>
          </button>
          <button type="button" className="icon-button" aria-label="Help">
            <span className="material-symbols-outlined" aria-hidden="true">
              help
            </span>
          </button>
          <div className="avatar-shell" aria-hidden="true">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>
      </header>

      <main className="page-frame">{children}</main>

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
    </div>
  )
}
