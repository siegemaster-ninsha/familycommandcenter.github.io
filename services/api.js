// Base API service - centralizes all API logic
// Extracted from app.js to enable reuse across stores

class ApiService {
  constructor(config, authService) {
    this.config = config;
    this.authService = authService;
    this.accountId = null;
  }

  setAccountId(accountId) {
    this.accountId = accountId;
  }

  async call(endpoint, options = {}) {
    const url = this.config.getApiUrl(endpoint);
    const authHeader = this.authService.getAuthHeader();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accountId && { 'X-Account-Id': this.accountId }),
      ...authHeader,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || `API Error: ${response.status}`);
      } catch (e) {
        throw new Error(`API Error: ${response.status}`);
      }
    }

    return await response.json();
  }

  get(endpoint, options) {
    return this.call(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options) {
    return this.call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  put(endpoint, data, options) {
    return this.call(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  delete(endpoint, options) {
    return this.call(endpoint, { method: 'DELETE', ...options });
  }
}

// Export singleton
// Will be initialized after CONFIG and authService are available
window.apiService = null;

// Initialization function to be called after dependencies are loaded
window.initializeApiService = function() {
  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG not available. Load config.js first.');
    return false;
  }
  
  if (typeof authService === 'undefined') {
    console.error('authService not available. Load auth.js first.');
    return false;
  }
  
  window.apiService = new ApiService(CONFIG, authService);
  console.log('✅ API Service initialized');
  return true;
};

