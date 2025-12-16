// Base API service - centralizes all API logic
// Extracted from app.js to enable reuse across stores
// Enhanced with offline support - queues changes when offline

class ApiService {
  constructor(config, authService) {
    this.config = config;
    this.authService = authService;
    this.accountId = null;
  }

  setAccountId(accountId) {
    this.accountId = accountId;
  }

  /**
   * Check if the browser is currently online
   * @returns {boolean}
   */
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Get the sync queue service
   * @returns {Object|null}
   */
  getSyncQueue() {
    return typeof window !== 'undefined' ? window.syncQueue : null;
  }

  /**
   * Get the offline store
   * @returns {Object|null}
   */
  getOfflineStore() {
    if (typeof window !== 'undefined' && window.useOfflineStore) {
      return window.useOfflineStore();
    }
    return null;
  }

  /**
   * Extract entity type and ID from endpoint
   * @param {string} endpoint - API endpoint
   * @returns {{entity: string, entityId: string|null}}
   */
  parseEndpoint(endpoint) {
    const parts = endpoint.split('/').filter(Boolean);
    
    // Map endpoint prefixes to entity types
    const entityMap = {
      'chores': 'chore',
      'family': 'familyMember',
      'quicklist': 'quicklist'
    };

    const entity = entityMap[parts[0]] || parts[0];
    const entityId = parts.length > 1 ? parts[1] : null;

    return { entity, entityId };
  }

  async call(endpoint, options = {}) {
    const url = this.config.getApiUrl(endpoint);
    const authHeader = this.authService.getAuthHeader();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accountId && { 'X-Account-Id': this.accountId }),
      ...(authHeader && { 'Authorization': authHeader }),
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

  /**
   * POST request with offline support
   * Queues the request if offline
   */
  async post(endpoint, data, options = {}) {
    // Check if this is a modifying request that can be queued
    if (!this.isOnline() && !options.skipOfflineQueue) {
      return this._queueChange('CREATE', endpoint, data);
    }

    return this.call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * PUT request with offline support
   * Queues the request if offline
   */
  async put(endpoint, data, options = {}) {
    if (!this.isOnline() && !options.skipOfflineQueue) {
      return this._queueChange('UPDATE', endpoint, data);
    }

    return this.call(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  /**
   * DELETE request with offline support
   * Queues the request if offline
   */
  async delete(endpoint, options = {}) {
    if (!this.isOnline() && !options.skipOfflineQueue) {
      return this._queueChange('DELETE', endpoint, null);
    }

    return this.call(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Queue a change for later synchronization
   * @param {string} type - 'CREATE' | 'UPDATE' | 'DELETE'
   * @param {string} endpoint - API endpoint
   * @param {Object|null} data - Request payload
   * @returns {Object} - Queued response with pending flag
   */
  async _queueChange(type, endpoint, data) {
    const syncQueue = this.getSyncQueue();
    const offlineStore = this.getOfflineStore();

    if (!syncQueue) {
      throw new Error('Sync queue not available - cannot queue offline changes');
    }

    const { entity, entityId } = this.parseEndpoint(endpoint);

    // For CREATE, generate a temporary ID if not provided
    const tempId = data?.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Queue the change
    const queueId = await syncQueue.enqueue({
      type,
      entity,
      entityId: entityId || tempId,
      data: data ? { ...data, id: data.id || tempId } : null,
      serverTimestamp: data?.updatedAt || null
    });

    // Update pending count in offline store
    if (offlineStore) {
      offlineStore.incrementPendingSync();
    }

    console.log(`[QUEUE] Queued offline ${type} for ${entity}:${entityId || tempId}`);

    // Return a response that indicates the change is pending
    return {
      ...data,
      id: data?.id || tempId,
      _pending: true,
      _queueId: queueId,
      _queuedAt: Date.now()
    };
  }

  // === Recipe Image Methods ===
  // **Feature: recipe-image-capture**
  // **Validates: Requirements 7.1, 7.4**
  
  /**
   * Get presigned URL for recipe image upload
   * **Validates: Requirements 7.1**
   * @param {string} extension - File extension (jpg, png, heic, webp)
   * @returns {Promise<Object>} Upload URL and S3 key
   */
  async getRecipeImageUploadUrl(extension) {
    return this.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/upload-url`, {
      fileExtension: extension
    });
  }
  
  /**
   * Process uploaded recipe image
   * **Validates: Requirements 7.4**
   * @param {string} s3Key - S3 key of the uploaded image
   * @returns {Promise<Object>} Extracted recipe data
   */
  async processRecipeImage(s3Key) {
    return this.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/process`, {
      s3Key
    });
  }
  
  /**
   * Get presigned URL for viewing a recipe source image
   * @param {string} s3Key - S3 key of the image
   * @returns {Promise<Object>} View URL
   */
  async getRecipeImageViewUrl(s3Key) {
    return this.get(`${CONFIG.API.ENDPOINTS.RECIPES}/image/${encodeURIComponent(s3Key)}`);
  }
  
  // === Multi-Image Recipe Methods ===
  // **Feature: multi-image-recipe-categories**
  // **Validates: Requirements 1.6, 3.1**
  
  /**
   * Get presigned URLs for multiple recipe image uploads
   * **Validates: Requirements 1.6**
   * @param {string[]} fileExtensions - Array of file extensions (jpg, png, heic, webp)
   * @returns {Promise<Object>} Array of upload URLs with S3 keys
   */
  async getRecipeMultipleImageUploadUrls(fileExtensions) {
    return this.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/upload-urls`, {
      fileExtensions
    });
  }
  
  /**
   * Process multiple uploaded recipe images
   * **Validates: Requirements 3.1**
   * @param {string[]} s3Keys - Array of S3 keys of the uploaded images
   * @returns {Promise<Object>} Extracted recipe data with categories and sourceImageKeys
   */
  async processMultipleRecipeImages(s3Keys) {
    return this.post(`${CONFIG.API.ENDPOINTS.RECIPES}/images/process`, {
      s3Keys
    });
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
  console.log('[OK] API Service initialized');
  return true;
};

