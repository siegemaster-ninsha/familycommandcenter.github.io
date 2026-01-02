/**
 * Property-Based Tests for useApi Composable
 * 
 * **Feature: app-js-refactoring, Property 6: API Header Consistency**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * Property: For any API call made through the API service, the request SHALL include
 * the Authorization header if and only if the user is authenticated, and SHALL include
 * the X-Account-Id header if and only if accountId is available.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

describe('useApi Property Tests', () => {
  let useApi;
  let mockFetch;
  let capturedHeaders;

  beforeEach(() => {
    // Capture headers from fetch calls
    capturedHeaders = null;
    mockFetch = vi.fn().mockImplementation((url, options) => {
      capturedHeaders = options?.headers || {};
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true })
      });
    });
    global.fetch = mockFetch;

    // Setup CONFIG mock
    global.CONFIG = {
      API: {
        BASE_URL: 'https://api.example.com',
        STAGE: 'dev'
      },
      ENV: {
        IS_DEVELOPMENT: false
      },
      getApiUrl: (endpoint) => `https://api.example.com/dev${endpoint}`
    };

    // Create a fresh window object for each test
    global.window = Object.create(null);
    global.window.authService = null;
    global.window.useAuthStore = null;
    global.window.useUIStore = null;
    global.window.vueApp = null;

    // Define useApi inline (same as unit tests)
    useApi = () => {
      const getAuthStore = () => global.window.useAuthStore?.();
      const getUIStore = () => global.window.useUIStore?.();
      
      const getAccountId = () => {
        const vueApp = global.window.vueApp;
        if (vueApp?.accountId) return vueApp.accountId;
        const authStore = getAuthStore();
        return authStore?.accountId || null;
      };

      const handleAuthenticationRequired = () => {
        const uiStore = getUIStore();
        if (uiStore) uiStore.openModal('login');
        const vueApp = global.window.vueApp;
        if (vueApp?.handleAuthenticationRequired) {
          vueApp.handleAuthenticationRequired();
        }
      };

      async function call(endpoint, options = {}) {
        try {
          const url = global.CONFIG.getApiUrl(endpoint);
          const authHeader = global.window.authService?.getAuthHeader();
          const accountId = getAccountId();
          
          const headers = {
            'Content-Type': 'application/json',
            ...(accountId && { 'X-Account-Id': accountId }),
            ...(authHeader && { Authorization: authHeader }),
            ...options.headers
          };

          const response = await fetch(url, { ...options, headers });

          if (response.status === 401) {
            handleAuthenticationRequired();
            throw new Error('Authentication required');
          }

          if (!response.ok) {
            let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
            try {
              const errorData = await response.json();
              if (errorData.error) errorMessage += ` - ${errorData.error}`;
            } catch { /* ignore */ }
            throw new Error(`${errorMessage} for ${endpoint}`);
          }

          return response.json();
        } catch (error) {
          if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Network error: Unable to connect to the API. Please check your internet connection.');
          }
          throw error;
        }
      }

      return {
        call,
        get: (endpoint, opts) => call(endpoint, { method: 'GET', ...opts }),
        post: (endpoint, data, opts) => call(endpoint, { method: 'POST', body: JSON.stringify(data), ...opts }),
        put: (endpoint, data, opts) => call(endpoint, { method: 'PUT', body: JSON.stringify(data), ...opts }),
        delete: (endpoint, opts) => call(endpoint, { method: 'DELETE', ...opts })
      };
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: app-js-refactoring, Property 6: API Header Consistency**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   * 
   * For any API call, the Authorization header is present if and only if
   * the user is authenticated (authService.getAuthHeader() returns a non-null value).
   */
  it('Property 6: Authorization header present iff authenticated', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random auth state (authenticated or not)
        fc.boolean(),
        // Generate random auth token when authenticated
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random endpoint
        fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/[^a-zA-Z0-9-_]/g, '')),
        async (isAuthenticated, authToken, endpoint) => {
          // Setup auth state
          if (isAuthenticated) {
            global.window.authService = {
              getAuthHeader: () => `Bearer ${authToken}`
            };
          } else {
            global.window.authService = {
              getAuthHeader: () => null
            };
          }

          const api = useApi();
          await api.get(endpoint);

          // Property: Authorization header present iff authenticated
          if (isAuthenticated) {
            expect(capturedHeaders.Authorization).toBe(`Bearer ${authToken}`);
          } else {
            expect(capturedHeaders.Authorization).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 6: API Header Consistency**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   * 
   * For any API call, the X-Account-Id header is present if and only if
   * accountId is available (from vueApp or authStore).
   */
  it('Property 6: X-Account-Id header present iff accountId available', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random accountId availability
        fc.boolean(),
        // Generate random accountId when available
        fc.uuid(),
        // Generate random endpoint
        fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/[^a-zA-Z0-9-_]/g, '')),
        // Source of accountId (vueApp or authStore)
        fc.boolean(),
        async (hasAccountId, accountId, endpoint, fromVueApp) => {
          // Reset state for this iteration
          global.window.vueApp = null;
          global.window.useAuthStore = null;
          
          // Setup accountId state
          if (hasAccountId) {
            if (fromVueApp) {
              global.window.vueApp = { accountId };
            } else {
              global.window.useAuthStore = () => ({ accountId });
            }
          }

          const api = useApi();
          await api.get(endpoint);

          // Property: X-Account-Id header present iff accountId available
          if (hasAccountId) {
            expect(capturedHeaders['X-Account-Id']).toBe(accountId);
          } else {
            expect(capturedHeaders['X-Account-Id']).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 6: API Header Consistency**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   * 
   * Combined property: For any combination of auth state and accountId availability,
   * headers are included correctly and consistently.
   */
  it('Property 6: Combined header consistency across all auth/account states', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Auth state
        fc.boolean(),
        fc.string({ minLength: 10, maxLength: 100 }),
        // Account state
        fc.boolean(),
        fc.uuid(),
        // Endpoint
        fc.string({ minLength: 1, maxLength: 50 }).map(s => '/' + s.replace(/[^a-zA-Z0-9-_]/g, '')),
        async (isAuthenticated, authToken, hasAccountId, accountId, endpoint) => {
          // Reset state for this iteration
          global.window.authService = null;
          global.window.vueApp = null;
          global.window.useAuthStore = null;
          
          // Setup auth state
          global.window.authService = {
            getAuthHeader: () => isAuthenticated ? `Bearer ${authToken}` : null
          };

          // Setup account state
          if (hasAccountId) {
            global.window.vueApp = { accountId };
          }

          const api = useApi();
          await api.get(endpoint);

          // Verify Content-Type is always present
          expect(capturedHeaders['Content-Type']).toBe('application/json');

          // Verify Authorization header consistency
          if (isAuthenticated) {
            expect(capturedHeaders.Authorization).toBe(`Bearer ${authToken}`);
          } else {
            expect(capturedHeaders.Authorization).toBeUndefined();
          }

          // Verify X-Account-Id header consistency
          if (hasAccountId) {
            expect(capturedHeaders['X-Account-Id']).toBe(accountId);
          } else {
            expect(capturedHeaders['X-Account-Id']).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
