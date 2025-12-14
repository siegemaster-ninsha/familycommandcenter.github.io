// Service Worker for Family Command Center
// Provides offline capabilities and background token refresh for mobile

const CACHE_NAME = 'family-command-center-v1';
// Use the actual API endpoint for token refresh
const TOKEN_REFRESH_URL = 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com/dev/auth/token-refresh';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔧 Service Worker cache opened');
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle fetch events - intercept API calls for token refresh
self.addEventListener('fetch', (event) => {
  // Only handle API requests that might need authentication
  if (event.request.url.includes('/api/') && event.request.headers.get('Authorization')) {
    event.respondWith(
      handleApiRequest(event.request)
    );
  }
});

// Handle API requests with token refresh logic
async function handleApiRequest(request) {
  try {
    // Try the original request first
    let response = await fetch(request);

    // If we get a 401, try to refresh the token
    if (response.status === 401) {
      console.log('🔄 Token expired, attempting refresh...');

      try {
        // Try to refresh the token
        const refreshResponse = await fetch(TOKEN_REFRESH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: await getStoredRefreshToken()
          })
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();

          // Update stored tokens
          await storeTokens(tokenData);

          // Retry the original request with new token
          const newRequest = new Request(request, {
            headers: {
              ...request.headers,
              'Authorization': `Bearer ${tokenData.accessToken}`
            }
          });

          response = await fetch(newRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
      }
    }

    return response;
  } catch (error) {
    console.error('❌ API request failed:', error);
    throw error;
  }
}

// Helper functions for token management
async function getStoredRefreshToken() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      const client = clients[0];
      return await client.postMessage({ type: 'GET_REFRESH_TOKEN' });
    }
  } catch (error) {
    console.error('Failed to get refresh token:', error);
  }
  return null;
}

async function storeTokens(tokenData) {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      const client = clients[0];
      client.postMessage({
        type: 'STORE_TOKENS',
        tokens: tokenData
      });
    }
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for token refresh (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'token-refresh') {
    event.waitUntil(refreshTokensInBackground());
  }
});

async function refreshTokensInBackground() {
  console.log('🔄 Background token refresh...');
  try {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      const response = await fetch(TOKEN_REFRESH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const tokenData = await response.json();
        await storeTokens(tokenData);
        console.log('✅ Background token refresh successful');
      }
    }
  } catch (error) {
    console.error('❌ Background token refresh failed:', error);
  }
}
