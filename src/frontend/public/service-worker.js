const SHELL_CACHE_PREFIX = 'safescan-shell-'
const RUNTIME_CACHE = 'safescan-runtime-v1'

function getVersion() {
  const url = new URL(self.location.href)
  return url.searchParams.get('v') ?? 'dev'
}

function getBasePath() {
  const pathname = new URL(self.location.href).pathname
  return pathname.replace(/service-worker\.js$/, '') || '/'
}

const SHELL_CACHE = `${SHELL_CACHE_PREFIX}${getVersion()}`
const BASE_PATH = getBasePath()
const APP_SHELL_PATHS = [BASE_PATH, `${BASE_PATH}manifest.webmanifest`, `${BASE_PATH}favicon.svg`, `${BASE_PATH}404.html`]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_PATHS)).catch(() => undefined),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.map((key) => {
          if (key.startsWith(SHELL_CACHE_PREFIX) && key !== SHELL_CACHE) {
            return caches.delete(key)
          }

          return Promise.resolve(false)
        }),
      )

      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL_CACHE)
        return cache.match(BASE_PATH)
      }),
    )
    return
  }

  if (url.origin !== self.location.origin) {
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            void caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned))
          }

          return response
        })
        .catch(async () => {
        const cache = await caches.open(RUNTIME_CACHE)
        return cache.match(request)
        }),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(request).then((response) => {
        if (!response.ok || response.type === 'opaque') {
          return response
        }

        const cloned = response.clone()
        void caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned))
        return response
      })
    }),
  )
})
