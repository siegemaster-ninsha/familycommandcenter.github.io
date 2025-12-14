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
    localRecipeIds: new Set()
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
    }
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
        console.log('✅ Recipes loaded:', this.recipes.length);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to load recipes:', error);
        this.recipes = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Scrape a recipe from URL
     * @param {string} url - Recipe URL to scrape
     * @returns {Object} Scraped recipe data (not saved)
     */
    async scrapeRecipe(url) {
      this.scraping = true;
      this.scrapeError = null;
      this.scrapedRecipe = null;
      
      try {
        const data = await apiService.post(`${CONFIG.API.ENDPOINTS.RECIPES}/scrape`, { url });
        this.scrapedRecipe = data.recipe;
        console.log('✅ Recipe scraped:', this.scrapedRecipe?.title);
        return { success: true, recipe: this.scrapedRecipe };
      } catch (error) {
        this.scrapeError = error.message;
        console.error('Failed to scrape recipe:', error);
        return { success: false, error: error.message };
      } finally {
        this.scraping = false;
      }
    },
    
    /**
     * Save a recipe (new or scraped)
     * @param {Object} recipeData - Recipe data to save
     * @returns {Object} Result with saved recipe
     */
    async saveRecipe(recipeData) {
      // Generate a temporary local ID for offline items
      const tempId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const localRecipe = {
        ...recipeData,
        id: tempId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Optimistically add to local state immediately
      this.recipes.push(localRecipe);
      this.localRecipeIds.add(tempId);
      console.log('✅ Recipe added locally:', localRecipe.title);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'CREATE',
            entity: 'recipe',
            entityId: tempId,
            data: recipeData
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, recipe: localRecipe, offline: true };
      }
      
      // Online - try to sync immediately
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.RECIPES, recipeData);
        
        if (data.recipe) {
          // Replace temp recipe with server recipe
          const index = this.recipes.findIndex(r => r.id === tempId);
          if (index !== -1) {
            this.recipes[index] = data.recipe;
          }
          this.localRecipeIds.delete(tempId);
          
          // Clear scraped recipe after successful save
          this.scrapedRecipe = null;
          
          console.log('✅ Recipe synced:', data.recipe.title);
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
            data: recipeData
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
      console.log('✅ Recipe updated locally:', recipeId);
      
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
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.RECIPES}/${recipeId}`, updates);
        
        if (data.recipe) {
          // Update with server response
          if (index !== -1) {
            this.recipes[index] = { ...this.recipes[index], ...data.recipe };
          }
          console.log('✅ Recipe update synced:', recipeId);
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
      console.log('✅ Recipe deleted locally:', recipeId);
      
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
        console.log('✅ Recipe delete synced:', recipeId);
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
        console.log('✅ Tags loaded:', this.tags.length);
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
        console.log('✅ LLM health checked:', this.llmHealth?.status);
        return { success: true, health: this.llmHealth };
      } catch (error) {
        console.error('Failed to check LLM health:', error);
        this.llmHealth = { status: 'unhealthy', error: error.message };
        return { success: false, health: this.llmHealth };
      }
    },
    
    // === Utility Actions ===
    
    /**
     * Clear all errors
     */
    clearErrors() {
      this.error = null;
      this.scrapeError = null;
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
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useRecipeStore = useRecipeStore;
}
