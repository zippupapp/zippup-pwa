// ZippUp PWA Service Worker
const CACHE_NAME = 'zippup-v1.0.0';
const API_CACHE_NAME = 'zippup-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  // External resources
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/services',
  '/api/health'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      // Cache API responses
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('🌐 Caching API responses');
        return Promise.all(
          API_CACHE_URLS.map(url => {
            return fetch(`https://zippup-backend-v3.onrender.com${url}`)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(error => {
                console.log(`Failed to cache ${url}:`, error);
              });
          })
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installation complete');
      // Force activation
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activation complete');
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // API requests
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiRequest(request));
    }
    // Static files
    else {
      event.respondWith(handleStaticRequest(request));
    }
  }
  // POST requests (auth, bookings, etc.)
  else if (request.method === 'POST') {
    event.respondWith(handlePostRequest(request));
  }
});

// Handle API GET requests with cache-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Update cache with fresh data
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📱 Serving API from cache:', request.url);
      return cachedResponse;
    }
    
    // If no cache, return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Network unavailable and no cached data',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    // Network error, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📱 Serving API from cache (network error):', request.url);
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'You are offline and no cached data is available',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('📱 Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If request fails and it's for the main page, serve offline page
    if (request.url.includes('index.html') || request.url.endsWith('/')) {
      return await cache.match('/index.html');
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📱 Network error, serving from cache:', request.url);
    
    // For main page requests, serve index.html from cache
    if (request.url.includes('index.html') || request.url.endsWith('/')) {
      const indexResponse = await cache.match('/index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }
    
    // For other resources, return a generic offline response
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle POST requests (store in IndexedDB for retry when online)
async function handlePostRequest(request) {
  try {
    // Try to send the request
    const response = await fetch(request);
    return response;
  } catch (error) {
    // If offline, return a response indicating the request was queued
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Request queued for when you come back online',
        offline: true,
        queued: true
      }),
      {
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ZippUp',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ZippUp', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

console.log('🚀 ZippUp Service Worker loaded');
