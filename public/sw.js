// Service Worker for Push Notifications and Caching
const CACHE_NAME = 'kick-ai-v2'
const urlsToCache = [
  '/',
  '/trial',
  '/pricing'
]

// Install event - cache resources with better error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core resources...')
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('[SW] Some resources failed to cache, continuing anyway:', error)
          return Promise.resolve()
        })
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error)
      })
  )
  self.skipWaiting() // Take control immediately
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim() // Take control of all clients
    })
  )
})

// Push event - show notification with better error handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received')
  try {
    const data = event.data?.json() || {}
    const title = data.title || 'Kick AI - Football Match Alert'
              const options = {
            body: data.body || 'Your match is starting soon!',
            icon: '/icon-192x192.svg',
            badge: '/badge-72x72.svg',
      data: { url: data.url || '/' },
      tag: 'match-alert', // Prevent duplicate notifications
      renotify: true,
      requireInteraction: false, // Allow auto-dismiss
      actions: [
        {
          action: 'open',
          title: 'Watch Now',
                          icon: '/icon-192x192.svg'
        },
        {
          action: 'close',
          title: 'Dismiss'
        }
      ]
    }
    event.waitUntil(
      self.registration.showNotification(title, options)
        .catch((error) => {
          console.error('[SW] Failed to show notification:', error)
        })
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

// Notification click event with better error handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)
  event.notification.close()
  
  if (event.action === 'close') {
    return
  }
  
  const url = event.notification?.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Found', clientList.length, 'clients')
        
        // Check if there's already a window/tab open with a similar URL
        for (const client of clientList) {
          const clientUrl = new URL(client.url)
          const targetUrl = new URL(url, self.location.origin)
          
          if (clientUrl.origin === targetUrl.origin && 'focus' in client) {
            console.log('[SW] Focusing existing client')
            return client.focus().then(() => {
              // Navigate to the specific URL if different
              if (client.url !== targetUrl.href && 'navigate' in client) {
                return client.navigate(targetUrl.href)
              }
            })
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          console.log('[SW] Opening new window for:', url)
          return clients.openWindow(url)
        }
      })
      .catch((error) => {
        console.error('[SW] Notification click handling failed:', error)
      })
  )
})

// Fetch event for offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same origin
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request).catch(() => {
            // If both cache and network fail, return a basic offline page for HTML requests
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return new Response('App is offline. Please check your connection.', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html' }
              })
            }
          })
        })
    )
  }
})


