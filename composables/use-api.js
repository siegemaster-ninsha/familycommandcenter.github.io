/**
 * API Service Composable
 * Provides a standardized interface for making HTTP requests with automatic
 * authentication headers and error handling.
 * 
 * Extracts apiCall logic from app.js into a reusable composable.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

const useApi = () => {
  /**
   * Get the auth store instance (lazy loaded to avoid circular dependencies)
   * @returns {Object|null} Auth store instance or null
   */
  const getAuthStore = () => {
    return window.useAuthStore?.();
  };

  /**
   * Get the UI store instance for showing auth modals
   * @returns {Object|null} UI store instance or null
   */
  const getUIStore = () => {
    return window.useUIStore?.();
  };

  /**
   * Get the current account ID from app.js or auth store
   * @returns {string|null} Account ID or null
   */
  const getAccountId = () => {
    // Try to get from Vue app instance first (for backward compatibility)
    const vueApp = window.vueApp;
    if (vueApp?.accountId) {
      return vueApp.accountId;
    }
    
    // Fall back to auth store
    const authStore = getAuthStore();
    return authStore?.accountId || null;
  };

  /**
   * Handle authentication required scenario
   * Shows login modal and clears auth state
   */
  const handleAuthenticationRequired = () => {
    const uiStore = getUIStore();
    if (uiStore) {
      uiStore.openModal('login');
    }
    
    // Also try to call app.js method for backward compatibility
    const vueApp = window.vueApp;
    if (vueApp?.handleAuthenticationRequired) {
      vueApp.handleAuthenticationRequired();
    }
  };

  /**
   * Make an API call with automatic authentication headers
   * 
   * @param {string} endpoint - API endpoint (e.g., '/chores')
   * @param {Object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {Error} On network or API errors
   * 
   * Requirements:
   * - 5.1: Handle all HTTP requests with consistent authentication headers
   * - 5.2: Automatically include Authorization header if authenticated
   * - 5.3: Automatically include X-Account-Id header if available
   * - 5.4: Trigger auth flow on 401 responses
   */
  async function call(endpoint, options = {}) {
    try {
      const url = CONFIG.getApiUrl(endpoint);
      
      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log(`🌐 [useApi] Making API call to: ${url}`);
      }

      // Build headers with authentication
      const authHeader = window.authService?.getAuthHeader();
      const accountId = getAccountId();
      
      const headers = {
        'Content-Type': 'application/json',
        ...(accountId && { 'X-Account-Id': accountId }),
        ...(authHeader && { Authorization: authHeader }),
        ...options.headers
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log(`📡 [useApi] Response status: ${response.status} for ${endpoint}`);
      }

      // Handle 401 Unauthorized - trigger auth flow
      if (response.status === 401) {
        console.warn('[useApi] Authentication required or token expired');
        handleAuthenticationRequired();
        throw new Error('Authentication required');
      }

      // Handle other error responses
      if (!response.ok) {
        let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
        
        // Try to get more detailed error from response body
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
        } catch {
          // Ignore parsing errors for error responses
        }
        
        throw new Error(`${errorMessage} for ${endpoint}`);
      }

      const data = await response.json();
      
      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log(`✅ [useApi] API call successful for ${endpoint}:`, data);
      }
      
      return data;
    } catch (error) {
      console.error(`❌ [useApi] API Error for ${endpoint}:`, error);
      
      // Add more specific error handling for network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to the API. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Parsed JSON response
   */
  function get(endpoint, options = {}) {
    return call(endpoint, { method: 'GET', ...options });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Parsed JSON response
   */
  function post(endpoint, data, options = {}) {
    return call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Parsed JSON response
   */
  function put(endpoint, data, options = {}) {
    return call(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} Parsed JSON response
   */
  function del(endpoint, options = {}) {
    return call(endpoint, { method: 'DELETE', ...options });
  }

  // Return public API
  return {
    call,
    get,
    post,
    put,
    delete: del
  };
};

// Make available globally for non-module usage
window.useApi = useApi;
