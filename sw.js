// Service Worker for Family Command Center
// Provides offline capabilities, caching, and background token refresh

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

// IMPORTANT: This version MUST be updated with each deployment to bust the cache
// The deploy script should update this automatically
const CACHE_VERSION = 'v1.0.93-1766444862';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DATA_CACHE = `data-${CACHE_VERSION}`;

// Use the actual API endpoint for token refresh
const TOKEN_REFRESH_URL = 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com/dev/auth/token-refresh';
const API_BASE_URL = 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com';

// External CDN resources to cache for offline use
const CDN_ASSETS = [
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js'
];

// Assets to precache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './auth.js',
  './config.js',
  './styles.css',
  './manifest.json',
  // Services
  './services/api.js',
  // Stores
  './stores/auth.js',
  './stores/ui.js',
  './stores/chores.js',
  './stores/shopping.js',
  './stores/family.js',
  './stores/dashboard.js',
  // Utils
  './utils/helpers.js',
  './utils/settings.js',
  // Components
  './components/ui-components.js',
  './components/quicklist-section.js',
  './components/nav-menu.js',
  './components/unassigned-section.js',
  './components/family-members-section.js',
  './components/trash-section.js',
  './components/app-modals.js',
  './components/earnings-widget.js',
  './components/family-page.js',
  './components/shopping-page.js',
  './components/tailwind-chore-page.js',
  './components/account-page.js',
  './components/widget-configurator.js',
  './components/dashboard-page.js',
  // Widget system
  './widgets/base/widget-types.js',
  './widgets/base/WidgetBase.js',
  './widgets/base/widget-registry.js',
  './widgets/earnings-summary-widget.js',
  './widgets/weather-widget.js',
  './widgets/advice-widget.js',
  './widgets/trivia-widget.js',
  './widgets/dad-joke-widget.js',
  // Config
  './config/weather-config.js',
  // Icons
  './icons/icon-72x72.svg',
  './icons/icon-96x96.svg',
  './icons/icon-128x128.svg',
  './icons/icon-144x144.svg',
  './icons/icon-152x152.svg',
  './icons/icon-192x192.svg',
  './icons/icon-384x384.svg',
  './icons/icon-512x512.svg'
];

// =============================================================================
// INSTALL EVENT - Precache static assets
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[CONFIG] Service Worker installing...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(async (cache) => {
        console.log('[CONFIG] Precaching static assets...');
        // Use addAll for atomic caching - if one fails, all fail
        try {
          await cache.addAll(PRECACHE_ASSETS);
        } catch (error) {
          console.warn('[WARN] Some local assets failed to precache:', error);
          // Fall back to adding assets individually
          await Promise.all(
            PRECACHE_ASSETS.map((url) => 
              cache.add(url).catch((err) => {
                console.warn(`[WARN] Failed to cache: ${url}`, err);
              })
            )
          );
        }
        
        // Cache CDN assets (Lucide icons, etc.) - these may fail due to CORS
        console.log('[CONFIG] Caching CDN assets (Lucide icons)...');
        await Promise.all(
          CDN_ASSETS.map((url) => 
            fetch(url, { mode: 'cors' })
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn(`[WARN] CDN asset returned non-OK status: ${url}`);
              })
              .catch((err) => {
                console.warn(`[WARN] Failed to cache CDN asset: ${url}`, err);
              })
          )
        );
      })
      .then(() => {
        console.log('[OK] Static assets precached successfully');
      })
  );
});


// =============================================================================
// ACTIVATE EVENT - Clean up old caches
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[CONFIG] Service Worker activating...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches that don't match current version
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('[CLEANUP] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[OK] Old caches cleaned up');
        // Claim all clients immediately
        return self.clients.claim();
      })
      .then(() => {
        console.log('[OK] Service Worker now controlling all clients');
      })
  );
});

// =============================================================================
// FETCH EVENT - Caching strategies
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.href.includes(API_BASE_URL) || url.pathname.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle HTML requests with network-first strategy
  if (request.headers.get('accept')?.includes('text/html') || 
      url.pathname.endsWith('.html') ||
      url.pathname === '/' ||
      url.pathname.endsWith('/')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle CDN assets (Lucide icons) with cache-first strategy
  if (isCdnAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Default: network-first for everything else
  event.respondWith(handleNetworkFirst(request));
});

// =============================================================================
// CACHING STRATEGY HANDLERS
// =============================================================================

/**
 * Cache-first strategy for static assets (CSS, JS, images, fonts)
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Return cached version, but update cache in background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Not in cache, fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[ERROR] Failed to fetch static asset:', request.url, error);
    // Return a fallback response if available
    return new Response('Asset not available offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

/**
 * Network-first strategy for HTML pages
 */
async function handleHtmlRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[OFFLINE] Network unavailable, serving cached HTML');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try to return the main index.html as fallback
    const fallback = await caches.match('./index.html');
    if (fallback) {
      return fallback;
    }
    
    return new Response('Page not available offline', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

/**
 * Network-first strategy for API calls with cache fallback
 */
async function handleApiRequest(request) {
  try {
    // Check if request has auth header that might need refresh
    if (request.headers.get('Authorization')) {
      return await handleAuthenticatedApiRequest(request);
    }
    
    const networkResponse = await fetch(request);
    
    // Cache successful GET responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[OFFLINE] Network unavailable, checking cache for API data');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Add header to indicate this is cached data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Network unavailable and no cached data',
      offline: true 
    }), { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle authenticated API requests with token refresh
 */
async function handleAuthenticatedApiRequest(request) {
  try {
    let response = await fetch(request);
    
    // If we get a 401, try to refresh the token
    if (response.status === 401) {
      console.log('[RETRY] Token expired, attempting refresh...');
      
      try {
        const refreshToken = await getStoredRefreshToken();
        
        if (refreshToken) {
          const refreshResponse = await fetch(TOKEN_REFRESH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          
          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json();
            await storeTokens(tokenData);
            
            // Retry with new token
            const newHeaders = new Headers(request.headers);
            newHeaders.set('Authorization', `Bearer ${tokenData.accessToken}`);
            
            const newRequest = new Request(request.url, {
              method: request.method,
              headers: newHeaders,
              body: request.body,
              mode: request.mode,
              credentials: request.credentials
            });
            
            response = await fetch(newRequest);
          }
        }
      } catch (refreshError) {
        console.error('[ERROR] Token refresh failed:', refreshError);
      }
    }
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[ERROR] Authenticated API request failed:', error);
    
    // Try cache fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Generic network-first strategy
 */
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if URL is a static asset
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const pathname = url.pathname.toLowerCase();
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Check if URL is a CDN asset (Lucide icons, etc.)
 */
function isCdnAsset(url) {
  return CDN_ASSETS.some(cdnUrl => url.href === cdnUrl || url.href.startsWith(cdnUrl.replace('@latest', '')));
}

/**
 * Update cache in background without blocking response
 */
function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    })
    .catch(() => {
      // Silently fail - we already have cached version
    });
}

/**
 * Get refresh token from client
 */
async function getStoredRefreshToken() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data?.refreshToken);
        };
        clients[0].postMessage({ type: 'GET_REFRESH_TOKEN' }, [messageChannel.port2]);
        
        // Timeout after 1 second
        setTimeout(() => resolve(null), 1000);
      });
    }
  } catch (error) {
    console.error('Failed to get refresh token:', error);
  }
  return null;
}

/**
 * Store tokens in client
 */
async function storeTokens(tokenData) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'STORE_TOKENS',
        tokens: tokenData
      });
    });
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}


// =============================================================================
// MESSAGE HANDLING - Communication with app
// =============================================================================

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      console.log('[SYNC] Skip waiting requested, activating new service worker');
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHED_URLS':
      getCachedUrls().then((urls) => {
        event.ports[0]?.postMessage({ urls });
      });
      break;
  }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[CLEANUP] All caches cleared');
}

/**
 * Get list of cached URLs
 */
async function getCachedUrls() {
  const urls = [];
  const cacheNames = await caches.keys();
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    urls.push(...keys.map((req) => req.url));
  }
  
  return urls;
}

// =============================================================================
// SERVICE WORKER UPDATE NOTIFICATION
// =============================================================================

// When a new service worker is installed and waiting, notify the app
self.addEventListener('install', () => {
  // This runs when a new SW is installed
  // The app will be notified via the 'controllerchange' event
});

// Notify clients when this service worker takes control
self.addEventListener('activate', () => {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_ACTIVATED',
        version: CACHE_VERSION
      });
    });
  });
});

// =============================================================================
// BACKGROUND SYNC (if supported)
// =============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'token-refresh') {
    event.waitUntil(refreshTokensInBackground());
  }
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(processSyncQueue());
  }
});

async function refreshTokensInBackground() {
  console.log('[SYNC] Background token refresh...');
  try {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      const response = await fetch(TOKEN_REFRESH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        await storeTokens(tokenData);
        console.log('[OK] Background token refresh successful');
      }
    }
  } catch (error) {
    console.error('[ERROR] Background token refresh failed:', error);
  }
}

async function processSyncQueue() {
  console.log('[SYNC] Processing sync queue...');
  // This will be implemented by the SyncQueue service
  // The service worker just triggers the sync
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'PROCESS_SYNC_QUEUE' });
  });
}

// =============================================================================
// EXPORTS FOR TESTING
// =============================================================================

// Export constants and functions for testing (only in test environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_VERSION,
    STATIC_CACHE,
    DATA_CACHE,
    PRECACHE_ASSETS,
    CDN_ASSETS,
    isStaticAsset,
    isCdnAsset
  };
}
