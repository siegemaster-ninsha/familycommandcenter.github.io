// Recipe Store
// Manages recipes, tags, and recipe scraping
// Supports offline-first operations with sync queue
//
// **Feature: recipe-scraper**
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 10.1, 10.2**

const useRecipeStore = Pinia.defineStore('recipes', {
  state: () => ({
    recipes: [],
    tags: [],
    currentRecipe: null,
    loading: false,
    error: null,
    // Scraping state
    scraping: false,
    scrapedRecipe: null,
    scrapeError: null,
    // LLM health status
    llmHealth: null,
    // Track local-only items (created offline, not yet synced)
    localRecipeIds: new Set(),
    // Image capture state
    // **Feature: recipe-image-capture**
    // **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    imageUploading: false,
    imageProcessing: false,
    imageProcessingStatus: '',
    imageError: null
  }),
  
  getters: {
    // Get recipes by tag
    recipesByTag: (state) => {
      return (tag) => state.recipes.filter(recipe => 
        recipe.tags && recipe.tags.includes(tag)
      );
    },
    
    // Get recipes matching all specified tags (AND logic)
    recipesByTags: (state) => {
      return (tags) => {
        if (!tags || tags.length === 0) return state.recipes;
        return state.recipes.filter(recipe => 
          tags.every(tag => recipe.tags && recipe.tags.includes(tag))
        );
      };
    },
    
    // Get recipe by ID
    recipeById: (state) => {
      return (id) => state.recipes.find(recipe => recipe.id === id);
    },
    
    // Recipe count
    recipeCount: (state) => state.recipes.length,
    
    // Check if LLM is healthy
    isLLMHealthy: (state) => state.llmHealth?.status === 'healthy',
    
    // Check if currently scraping
    isScraping: (state) => state.scraping,
    
    // Get all unique tags from recipes (derived)
    allTags: (state) => {
      const tagSet = new Set();
      state.recipes.forEach(recipe => {
        if (recipe.tags) {
          recipe.tags.forEach(tag => tagSet.add(tag));
        }
      });
      return Array.from(tagSet).sort();
    },
    
    // Check if image is being processed
    // **Feature: recipe-image-capture**
    isImageProcessing: (state) => state.imageProcessing || state.imageUploading
  },
  
  actions: {
    // === Recipe CRUD Operations ===
    
    /**
     * Load all recipes for the account
     * @param {Object} filters - Optional filters { category, tags }
     */
    async loadRecipes(filters = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        // Build query string from filters
        const params = new URLSearchParams();
        if (filters.category) {
          params.append('category', filters.category);
        }
        if (filters.tags && filters.tags.length > 0) {
          params.append('tags', filters.tags.join(','));
        }
        
        const queryString = params.toString();
        const endpoint = queryString 
          ? `${CONFIG.API.ENDPOINTS.RECIPES}?${queryString}`
          : CONFIG.API.ENDPOINTS.RECIPES;
        
        const data = await apiService.get(endpoint);
        this.recipes = data.recipes || [];
        console.log('[OK] Recipes loaded:', this.recipes.length);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to load recipes:', error);
        this.recipes = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Scrape a recipe from URL (async with polling)
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} url - Recipe URL to scrape
     * @returns {Object} Scraped recipe data (not saved)
     */
    async scrapeRecipe(url) {
      this.scraping = true;
      this.scrapeError = null;
      this.scrapedRecipe = null;
      
      try {
        // Start the async scraping job
        const startData = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/scrape`, { url });
        
        // Check if we got a jobId (async) or direct recipe (sync fallback)
        if (startData.jobId) {
          const jobId = startData.jobId;
          console.log('[OK] Scrape job started:', jobId);
          
          // Poll for completion
          const result = await this.pollJobStatus(jobId);
          
          if (result.status === 'completed') {
            this.scrapedRecipe = result.recipe;
            console.log('[OK] Recipe scraped:', this.scrapedRecipe?.title);
            return { success: true, recipe: this.scrapedRecipe };
          } else if (result.status === 'failed') {
            throw new Error(result.error || 'Scraping failed');
          } else {
            throw new Error('Scraping timed out');
          }
        } else if (startData.recipe) {
          // Direct response (backward compatibility)
          this.scrapedRecipe = startData.recipe;
          console.log('[OK] Recipe scraped:', this.scrapedRecipe?.title);
          return { success: true, recipe: this.scrapedRecipe };
        } else {
          throw new Error('Unexpected response from server');
        }
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapScrapeError(error.message);
        this.scrapeError = userFriendlyError;
        console.error('Failed to scrape recipe:', error);
        return { success: false, error: userFriendlyError };
      } finally {
        this.scraping = false;
      }
    },
    
    /**
     * Scrape a recipe from URL with job store tracking
     * **Feature: async-job-service**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.3, 6.3**
     * @param {string} url - Recipe URL to scrape
     * @param {Object} jobStore - Optional job store for tracking progress
     * @returns {Object} Result with jobId for tracking, or direct recipe
     */
    async scrapeRecipeWithJobTracking(url, jobStore = null) {
      this.scraping = true;
      this.scrapeError = null;
      this.scrapedRecipe = null;
      
      try {
        // Start the async scraping job
        const startData = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/scrape`, { url });
        
        // Check if we got a jobId (async) or direct recipe (sync fallback)
        if (startData.jobId) {
          const jobId = startData.jobId;
          console.log('[OK] Scrape job started:', jobId);
          
          // If job store is available, let it handle polling via events
          if (jobStore) {
            // Return immediately with jobId - job store will handle polling
            // The component will listen for job-completed/job-failed events
            return { success: true, jobId };
          }
          
          // Fallback: poll manually if no job store
          const result = await this.pollJobStatus(jobId);
          
          if (result.status === 'completed') {
            this.scrapedRecipe = result.recipe;
            console.log('[OK] Recipe scraped:', this.scrapedRecipe?.title);
            return { success: true, recipe: this.scrapedRecipe };
          } else if (result.status === 'failed') {
            throw new Error(result.error || 'Scraping failed');
          } else {
            throw new Error('Scraping timed out');
          }
        } else if (startData.recipe) {
          // Direct response (backward compatibility)
          this.scrapedRecipe = startData.recipe;
          console.log('[OK] Recipe scraped:', this.scrapedRecipe?.title);
          return { success: true, recipe: this.scrapedRecipe };
        } else {
          throw new Error('Unexpected response from server');
        }
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapScrapeError(error.message);
        this.scrapeError = userFriendlyError;
        console.error('Failed to scrape recipe:', error);
        return { success: false, error: userFriendlyError };
      } finally {
        this.scraping = false;
      }
    },
    
    /**
     * Map scrape errors to user-friendly messages
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    mapScrapeError(error) {
      if (!error) return 'Could not scrape recipe. Please try again.';
      
      const errorLower = error.toLowerCase();
      
      // Invalid URL
      if (errorLower.includes('invalid url')) {
        return 'Invalid URL. Please enter a valid recipe URL.';
      }
      
      // Timeout
      if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return 'Request timed out. The website may be slow or unavailable.';
      }
      
      // Could not fetch
      if (errorLower.includes('could not fetch')) {
        return 'Could not access the website. Please check the URL and try again.';
      }
      
      // Service unavailable
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'Recipe extraction service temporarily unavailable. Please try again later.';
      }
      
      // Could not extract
      if (errorLower.includes('could not extract')) {
        return 'Could not extract recipe from this page. The website format may not be supported.';
      }
      
      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      return error;
    },
    
    /**
     * Save a recipe (new or scraped)
     * @param {Object} recipeData - Recipe data to save
     * @returns {Object} Result with saved recipe
     */
    async saveRecipe(recipeData) {
      // Deep clone to unwrap Vue reactive proxies before API/IndexedDB operations
      const plainRecipeData = JSON.parse(JSON.stringify(recipeData));
      console.log('[DEBUG] store.saveRecipe - plainRecipeData.tags:', plainRecipeData.tags);
      
      // Generate a temporary local ID for offline items
      const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const localRecipe = {
        ...plainRecipeData,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('[DEBUG] store.saveRecipe - localRecipe.tags:', localRecipe.tags);
      
      // Optimistically add to local state immediately
      this.recipes.push(localRecipe);
      this.localRecipeIds.add(tempId);
      console.log('[OK] Recipe added locally:', localRecipe.title);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'CREATE',
            entity: 'recipe',
            entityId: tempId,
            data: plainRecipeData
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, recipe: localRecipe, offline: true };
      }
      
      // Online - try to sync immediately
      try {
        console.log('[DEBUG] store.saveRecipe - sending to API with tags:', plainRecipeData.tags);
        const data = await apiService.post(CONFIG.API.ENDPOINTS.RECIPES, plainRecipeData);
        console.log('[DEBUG] store.saveRecipe - server response tags:', data.recipe?.tags);
        
        if (data.recipe) {
          // Replace temp recipe with server recipe
          const index = this.recipes.findIndex(r => r.id === tempId);
          if (index !== -1) {
            this.recipes[index] = data.recipe;
            console.log('[DEBUG] store.saveRecipe - replaced local recipe, new tags:', this.recipes[index].tags);
          }
          this.localRecipeIds.delete(tempId);
          
          // Clear scraped recipe after successful save
          this.scrapedRecipe = null;
          
          console.log('[OK] Recipe synced:', data.recipe.title);
          return { success: true, recipe: data.recipe };
        }
        
        return { success: true, recipe: localRecipe };
      } catch (error) {
        console.warn('Failed to sync recipe, keeping local:', error.message);
        // Keep the local recipe, queue for sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'CREATE',
            entity: 'recipe',
            entityId: tempId,
            data: plainRecipeData
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, recipe: localRecipe, offline: true };
      }
    },
    
    /**
     * Update an existing recipe
     * @param {string} recipeId - Recipe ID to update
     * @param {Object} updates - Fields to update
     * @returns {Object} Result with updated recipe
     */
    async updateRecipe(recipeId, updates) {
      console.log('[DEBUG] updateRecipe called with:', { recipeId, updates });
      const recipe = this.recipes.find(r => r.id === recipeId);
      if (!recipe) {
        console.warn('Recipe not found for update:', recipeId);
        return { success: false, error: 'Recipe not found' };
      }
      
      // Optimistic update - apply changes immediately
      const index = this.recipes.findIndex(r => r.id === recipeId);
      if (index !== -1) {
        this.recipes[index] = { 
          ...this.recipes[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      console.log('[OK] Recipe updated locally:', recipeId, 'tags:', this.recipes[index]?.tags);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'recipe',
            entityId: recipeId,
            data: updates
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, recipe: this.recipes[index], offline: true };
      }
      
      // Online - try to sync immediately
      try {
        console.log('[DEBUG] Sending PUT request with updates:', updates);
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.RECIPES}/${recipeId}`, updates);
        console.log('[DEBUG] Server response:', data);
        
        if (data.recipe) {
          // Update with server response
          if (index !== -1) {
            this.recipes[index] = { ...this.recipes[index], ...data.recipe };
          }
          console.log('[OK] Recipe update synced:', recipeId, 'tags:', data.recipe?.tags);
          return { success: true, recipe: data.recipe };
        }
        
        return { success: true, recipe: this.recipes[index] };
      } catch (error) {
        console.warn('Failed to sync recipe update, keeping local state:', error.message);
        // Keep local state, queue for sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'recipe',
            entityId: recipeId,
            data: updates
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, recipe: this.recipes[index], offline: true };
      }
    },
    
    /**
     * Delete a recipe
     * @param {string} recipeId - Recipe ID to delete
     * @returns {Object} Result
     */
    async deleteRecipe(recipeId) {
      // Optimistic update - always remove from local state immediately
      this.recipes = this.recipes.filter(recipe => recipe.id !== recipeId);
      this.localRecipeIds.delete(recipeId);
      console.log('[OK] Recipe deleted locally:', recipeId);
      
      // Clear current recipe if it was the deleted one
      if (this.currentRecipe?.id === recipeId) {
        this.currentRecipe = null;
      }
      
      // If it's a local-only recipe that was never synced, no need to sync delete
      if (recipeId.startsWith('local_')) {
        return { success: true };
      }
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'DELETE',
            entity: 'recipe',
            entityId: recipeId,
            data: {}
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, offline: true };
      }
      
      // Online - try to sync
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.RECIPES}/${recipeId}`);
        console.log('[OK] Recipe delete synced:', recipeId);
        return { success: true };
      } catch (error) {
        console.warn('Failed to sync recipe delete, queuing:', error.message);
        // Queue for sync (recipe already removed from local state)
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'DELETE',
            entity: 'recipe',
            entityId: recipeId,
            data: {}
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, offline: true };
      }
    },
    
    /**
     * Set the current recipe for viewing/editing
     * @param {Object|null} recipe - Recipe to set as current
     */
    setCurrentRecipe(recipe) {
      this.currentRecipe = recipe;
    },
    
    /**
     * Clear the scraped recipe preview
     */
    clearScrapedRecipe() {
      this.scrapedRecipe = null;
      this.scrapeError = null;
    },

    // === Tag Management ===
    
    /**
     * Load all unique tags from recipes
     */
    async loadTags() {
      try {
        const data = await apiService.get(`${CONFIG.API.ENDPOINTS.RECIPES}/tags`);
        this.tags = data.tags || [];
        console.log('[OK] Tags loaded:', this.tags.length);
      } catch (error) {
        console.error('Failed to load tags:', error);
        this.tags = [];
      }
    },
    
    // === LLM Health Check ===
    
    /**
     * Check LLM server health status
     * @returns {Object} Health status
     */
    async checkLLMHealth() {
      try {
        const data = await apiService.get(`${CONFIG.API.ENDPOINTS.RECIPES}/health`);
        this.llmHealth = data.health;
        console.log('[OK] LLM health checked:', this.llmHealth?.status);
        return { success: true, health: this.llmHealth };
      } catch (error) {
        console.error('Failed to check LLM health:', error);
        this.llmHealth = { status: 'unhealthy', error: error.message };
        return { success: false, health: this.llmHealth };
      }
    },
    
    // === Image Capture Actions ===
    // **Feature: recipe-image-capture**
    // **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.1, 7.4**
    
    /**
     * Get presigned URL for image upload
     * **Validates: Requirements 6.1, 6.2, 7.1**
     * @param {string} fileExtension - File extension (jpg, png, heic, webp)
     * @returns {Object} Result with uploadUrl and s3Key
     */
    async getImageUploadUrl(fileExtension) {
      this.imageError = null;
      
      try {
        const data = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/upload-url`, {
          fileExtension
        });
        console.log('[OK] Image upload URL generated');
        return { success: true, uploadUrl: data.uploadUrl, s3Key: data.s3Key, expiresAt: data.expiresAt };
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapUploadUrlError(error.message);
        this.imageError = userFriendlyError;
        console.error('Failed to get image upload URL:', error);
        return { success: false, error: userFriendlyError };
      }
    },
    
    /**
     * Get presigned URLs for multiple image uploads
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.6**
     * @param {string[]} fileExtensions - Array of file extensions (jpg, png, heic, webp)
     * @returns {Object} Result with array of upload URLs
     */
    async getMultipleImageUploadUrls(fileExtensions) {
      this.imageError = null;
      
      try {
        const data = await apiService.getRecipeMultipleImageUploadUrls(fileExtensions);
        console.log('[OK] Multiple image upload URLs generated:', data.uploads?.length);
        return { success: true, uploads: data.uploads };
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapUploadUrlError(error.message);
        this.imageError = userFriendlyError;
        console.error('Failed to get multiple image upload URLs:', error);
        return { success: false, error: userFriendlyError };
      }
    },
    
    /**
     * Map upload URL errors to user-friendly messages
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    mapUploadUrlError(error) {
      if (!error) return 'Could not prepare image upload. Please try again.';
      
      const errorLower = error.toLowerCase();
      
      // File validation errors - already user-friendly
      if (errorLower.includes('unsupported image format')) {
        return 'Unsupported image format. Please use JPG, PNG, HEIC, or WebP.';
      }
      
      if (errorLower.includes('too large') || errorLower.includes('maximum size')) {
        return 'Image too large. Maximum size is 10MB.';
      }
      
      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      // Service errors
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'Upload service temporarily unavailable. Please try again later.';
      }
      
      return error;
    },
    
    /**
     * Process uploaded recipe image (async with polling)
     * **Validates: Requirements 5.2, 5.3, 5.4, 6.1, 6.2, 7.4**
     * @param {string} s3Key - S3 key of the uploaded image
     * @returns {Object} Result with extracted recipe
     */
    async processRecipeImage(s3Key) {
      this.imageProcessing = true;
      this.imageProcessingStatus = 'Starting image processing...';
      this.imageError = null;
      this.scrapedRecipe = null;
      
      try {
        // Start the async processing job
        const startData = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/process`, {
          s3Key
        });
        
        const jobId = startData.jobId;
        console.log('[OK] Image processing job started:', jobId);
        
        // Poll for completion
        this.imageProcessingStatus = 'Extracting recipe from image...';
        const result = await this.pollJobStatus(jobId);
        
        if (result.status === 'completed') {
          this.scrapedRecipe = result.recipe;
          console.log('[OK] Recipe extracted from image:', this.scrapedRecipe?.title);
          return { success: true, recipe: this.scrapedRecipe };
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Image processing failed');
        } else {
          throw new Error('Image processing timed out');
        }
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapImageProcessingError(error.message);
        this.imageError = userFriendlyError;
        console.error('Failed to process recipe image:', error);
        return { success: false, error: userFriendlyError };
      } finally {
        this.imageProcessing = false;
        this.imageProcessingStatus = '';
      }
    },
    
    /**
     * Process uploaded recipe image with job store tracking
     * **Feature: async-job-service**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 5.3, 6.3**
     * @param {string} s3Key - S3 key of the uploaded image
     * @param {Object} jobStore - Optional job store for tracking progress
     * @returns {Object} Result with jobId for tracking, or direct recipe
     */
    async processRecipeImageWithJobTracking(s3Key, jobStore = null) {
      this.imageProcessing = true;
      this.imageProcessingStatus = 'Starting image processing...';
      this.imageError = null;
      this.scrapedRecipe = null;
      
      try {
        // Start the async processing job
        const startData = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/image/process`, {
          s3Key
        });
        
        const jobId = startData.jobId;
        console.log('[OK] Image processing job started:', jobId);
        
        // If job store is available, let it handle polling via events
        if (jobStore) {
          this.imageProcessing = false;
          this.imageProcessingStatus = '';
          // Return immediately with jobId - job store will handle polling
          return { success: true, jobId };
        }
        
        // Fallback: poll manually if no job store
        this.imageProcessingStatus = 'Extracting recipe from image...';
        const result = await this.pollJobStatus(jobId);
        
        if (result.status === 'completed') {
          this.scrapedRecipe = result.recipe;
          console.log('[OK] Recipe extracted from image:', this.scrapedRecipe?.title);
          return { success: true, recipe: this.scrapedRecipe };
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Image processing failed');
        } else {
          throw new Error('Image processing timed out');
        }
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapImageProcessingError(error.message);
        this.imageError = userFriendlyError;
        console.error('Failed to process recipe image:', error);
        return { success: false, error: userFriendlyError };
      } finally {
        this.imageProcessing = false;
        this.imageProcessingStatus = '';
      }
    },
    
    /**
     * Process multiple uploaded recipe images (async with polling)
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 3.1, 3.4**
     * @param {string[]} s3Keys - Array of S3 keys of the uploaded images
     * @returns {Object} Result with extracted recipe including categories and sourceImageKeys
     */
    async processMultipleRecipeImages(s3Keys) {
      this.imageProcessing = true;
      this.imageProcessingStatus = `Processing ${s3Keys.length} image${s3Keys.length > 1 ? 's' : ''}...`;
      this.imageError = null;
      this.scrapedRecipe = null;
      
      try {
        // Start the async processing job for multiple images
        const startData = await apiService.processMultipleRecipeImages(s3Keys);
        
        const jobId = startData.jobId;
        console.log('[OK] Multi-image processing job started:', jobId);
        
        // Poll for completion
        this.imageProcessingStatus = `Extracting recipe from ${s3Keys.length} image${s3Keys.length > 1 ? 's' : ''}...`;
        const result = await this.pollJobStatus(jobId);
        
        if (result.status === 'completed') {
          this.scrapedRecipe = result.recipe;
          console.log('[OK] Recipe extracted from multiple images:', this.scrapedRecipe?.title);
          return { success: true, recipe: this.scrapedRecipe };
        } else if (result.status === 'failed') {
          throw new Error(result.error || 'Multi-image processing failed');
        } else {
          throw new Error('Multi-image processing timed out');
        }
      } catch (error) {
        // Map technical errors to user-friendly messages
        const userFriendlyError = this.mapImageProcessingError(error.message);
        this.imageError = userFriendlyError;
        console.error('Failed to process multiple recipe images:', error);
        return { success: false, error: userFriendlyError };
      } finally {
        this.imageProcessing = false;
        this.imageProcessingStatus = '';
      }
    },
    
    /**
     * Poll for job status until completion or timeout
     * @param {string} jobId - Job ID to poll
     * @param {number} maxAttempts - Maximum polling attempts (default 60 = 2 minutes)
     * @param {number} interval - Polling interval in ms (default 2000 = 2 seconds)
     * @returns {Object} Final job status
     */
    async pollJobStatus(jobId, maxAttempts = 60, interval = 2000) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const data = await apiService.get(`${CONFIG.API.ENDPOINTS.RECIPES}/image/job/${jobId}`);
          
          // Update status message based on job status
          if (data.status === 'processing') {
            this.imageProcessingStatus = 'Reading recipe from image...';
          }
          
          // Return if job is complete (success or failure)
          if (data.status === 'completed' || data.status === 'failed') {
            return data;
          }
          
          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, interval));
        } catch (error) {
          console.warn(`Poll attempt ${attempt + 1} failed:`, error.message);
          // Continue polling on transient errors
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
      
      // Timeout after max attempts
      return { status: 'timeout', error: 'Image processing timed out' };
    },
    
    /**
     * Map image processing errors to user-friendly messages
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    mapImageProcessingError(error) {
      if (!error) return 'An unexpected error occurred while processing the image.';
      
      const errorLower = error.toLowerCase();
      
      // Timeout errors
      if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return 'Image processing timed out. Please try again with a clearer image.';
      }
      
      // Service unavailable
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'Image processing service temporarily unavailable. Please try again in a few moments.';
      }
      
      // Vision/extraction errors
      if (errorLower.includes('could not read recipe') || errorLower.includes('could not extract')) {
        return 'Could not read recipe from image. Please ensure the recipe text is clearly visible and try again.';
      }
      
      // Image not found
      if (errorLower.includes('not found') || errorLower.includes('404')) {
        return 'Image not found. Please try uploading again.';
      }
      
      // Access denied
      if (errorLower.includes('access denied') || errorLower.includes('403')) {
        return 'Access denied. Please try uploading the image again.';
      }
      
      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      return error;
    },
    
    /**
     * Get presigned URL for viewing a recipe source image
     * **Validates: Requirements 8.3**
     * @param {string} s3Key - S3 key of the image
     * @returns {Object} Result with viewUrl
     */
    async getImageViewUrl(s3Key) {
      try {
        // Use the S3 key directly - API Gateway {key+} greedy parameter handles slashes
        const data = await apiService.get(`${CONFIG.API.ENDPOINTS.RECIPES}/image/${s3Key}`);
        console.log('[OK] Image view URL generated');
        return { success: true, viewUrl: data.viewUrl };
      } catch (error) {
        console.error('Failed to get image view URL:', error);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Set image uploading state
     * **Validates: Requirements 5.1**
     * @param {boolean} uploading - Whether upload is in progress
     */
    setImageUploading(uploading) {
      this.imageUploading = uploading;
    },
    
    /**
     * Clear image-related errors
     */
    clearImageError() {
      this.imageError = null;
    },
    
    // === Utility Actions ===
    
    /**
     * Clear all errors
     */
    clearErrors() {
      this.error = null;
      this.scrapeError = null;
      this.imageError = null;
    },
    
    /**
     * Reset store state
     */
    reset() {
      this.recipes = [];
      this.tags = [];
      this.currentRecipe = null;
      this.loading = false;
      this.error = null;
      this.scraping = false;
      this.scrapedRecipe = null;
      this.scrapeError = null;
      this.llmHealth = null;
      this.localRecipeIds.clear();
      // Reset image capture state
      this.imageUploading = false;
      this.imageProcessing = false;
      this.imageProcessingStatus = '';
      this.imageError = null;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useRecipeStore = useRecipeStore;
}
