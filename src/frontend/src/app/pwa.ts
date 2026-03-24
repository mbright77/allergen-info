import { APP_BUILD_VERSION } from './build-meta'

const UPDATE_DISMISSED_KEY = 'safescan.update.dismissed'
const appBasePath = import.meta.env.BASE_URL || '/'

type UpdateListener = (registration: ServiceWorkerRegistration) => void

let currentRegistration: ServiceWorkerRegistration | null = null
let pendingRegistration: ServiceWorkerRegistration | null = null
let hasReloadedForController = false
const listeners = new Set<UpdateListener>()

function emitUpdateAvailable(registration: ServiceWorkerRegistration) {
  pendingRegistration = registration
  window.sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'false')

  for (const listener of listeners) {
    listener(registration)
  }
}

function attachUpdateFoundListener(registration: ServiceWorkerRegistration) {
  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing

    if (!installingWorker) {
      return
    }

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        emitUpdateAvailable(registration)
      }
    })
  })
}

export function subscribeToAppUpdate(listener: UpdateListener) {
  listeners.add(listener)

  if (pendingRegistration) {
    listener(pendingRegistration)
  }

  return () => {
    listeners.delete(listener)
  }
}

export function isAppUpdateDismissed() {
  return window.sessionStorage.getItem(UPDATE_DISMISSED_KEY) === 'true'
}

export function dismissAppUpdate() {
  window.sessionStorage.setItem(UPDATE_DISMISSED_KEY, 'true')
}

export function applyAppUpdate() {
  if (!pendingRegistration?.waiting) {
    return false
  }

  pendingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

export async function registerAppServiceWorker() {
  if (import.meta.env.DEV || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  const serviceWorkerUrl = new URL(`service-worker.js?v=${APP_BUILD_VERSION}`, window.location.origin + appBasePath)
  const registration = await navigator.serviceWorker.register(serviceWorkerUrl.pathname + serviceWorkerUrl.search, {
    scope: appBasePath,
  })
  currentRegistration = registration

  attachUpdateFoundListener(registration)

  if (registration.waiting && navigator.serviceWorker.controller) {
    emitUpdateAvailable(registration)
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloadedForController) {
      return
    }

    hasReloadedForController = true
    window.location.reload()
  })

  window.setTimeout(() => {
    void currentRegistration?.update()
  }, 1_500)

  return registration
}
