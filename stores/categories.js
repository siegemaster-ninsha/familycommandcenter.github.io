// Categories Store
// Manages quicklist categories for organizing chores
// **Feature: quicklist-categories**
// **Validates: Requirements 1.1, 1.3**

const useCategoriesStore = Pinia.defineStore('categories', {
  state: () => ({
    categories: [],
    loading: false,
    error: null
  }),
  
  getters: {
    // Returns categories sorted by sortOrder, with Uncategorized always last
    sortedCategories: (state) => {
      const sorted = [...state.categories].sort((a, b) => {
        // Uncategorized always last
        if (a.name === 'Uncategorized') return 1;
        if (b.name === 'Uncategorized') return -1;
        // Then by sortOrder
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
      return sorted;
    },
    
    // Get array of category names for validation
    categoryNames: (state) => state.categories.map(c => c.name),
    
    // Get category by ID
    categoryById: (state) => {
      return (id) => state.categories.find(c => c.id === id);
    },
    
    // Get category by name (case-insensitive)
    categoryByName: (state) => {
      return (name) => state.categories.find(
        c => c.name.toLowerCase() === (name || '').toLowerCase()
      );
    },
    
    // Category count
    categoryCount: (state) => state.categories.length
  },
  
  actions: {
    // Load categories from API
    async loadCategories() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.CATEGORIES);
        this.categories = data.categories || [];
        console.log('[OK] Categories loaded:', this.categories.length);
      } catch (error) {
        console.error('Failed to load categories:', error);
        this.error = error.message;
        this.categories = [];
      } finally {
        this.loading = false;
      }
    },
    
    // Create a new category
    // _Requirements: 1.2, 1.3_
    async createCategory(name) {
      // Client-side validation
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }
      if (trimmedName.length > 50) {
        return { success: false, error: 'Category name must be 50 characters or less' };
      }
      // Check for duplicate (case-insensitive)
      const existingNames = this.categories.map(c => c.name.toLowerCase());
      if (existingNames.includes(trimmedName.toLowerCase())) {
        return { success: false, error: 'Category name already exists' };
      }
      
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.CATEGORIES, {
          name: trimmedName
        });
        
        if (data.category) {
          this.categories.push(data.category);
          console.log('[OK] Category created:', data.category.name);
          return { success: true, category: data.category };
        }
        
        return { success: false, error: data.error || 'Failed to create category' };
      } catch (error) {
        console.error('Failed to create category:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Update (rename) a category
    // _Requirements: 1.4_
    async updateCategory(categoryId, name) {
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        return { success: false, error: 'Category name is required' };
      }
      if (trimmedName.length > 50) {
        return { success: false, error: 'Category name must be 50 characters or less' };
      }
      // Check for duplicate (case-insensitive), excluding current category
      const existingNames = this.categories
        .filter(c => c.id !== categoryId)
        .map(c => c.name.toLowerCase());
      if (existingNames.includes(trimmedName.toLowerCase())) {
        return { success: false, error: 'Category name already exists' };
      }
      
      // Optimistic update
      const category = this.categories.find(c => c.id === categoryId);
      const originalName = category ? category.name : null;
      if (category) {
        category.name = trimmedName;
      }
      
      try {
        const data = await apiService.put(
          `${CONFIG.API.ENDPOINTS.CATEGORIES}/${encodeURIComponent(categoryId)}`,
          { name: trimmedName }
        );
        
        if (data.category) {
          const index = this.categories.findIndex(c => c.id === categoryId);
          if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...data.category };
          }
          console.log('[OK] Category updated:', data.category.name);
          
          // Reload quicklist to reflect category name changes
          if (window.useChoresStore) {
            const choresStore = window.useChoresStore();
            await choresStore.loadQuicklistChores();
          }
          
          return { success: true, category: data.category };
        }
        
        return { success: false, error: data.error || 'Failed to update category' };
      } catch (error) {
        // Rollback on error
        if (category && originalName) {
          category.name = originalName;
        }
        console.error('Failed to update category:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Delete a category (moves items to Uncategorized)
    // _Requirements: 1.5_
    async deleteCategory(categoryId) {
      // Optimistic update
      const originalCategories = [...this.categories];
      this.categories = this.categories.filter(c => c.id !== categoryId);
      
      try {
        await apiService.delete(
          `${CONFIG.API.ENDPOINTS.CATEGORIES}/${encodeURIComponent(categoryId)}`
        );
        
        console.log('[OK] Category deleted:', categoryId);
        
        // Reload quicklist to reflect items moved to Uncategorized
        if (window.useChoresStore) {
          const choresStore = window.useChoresStore();
          await choresStore.loadQuicklistChores();
        }
        
        return { success: true };
      } catch (error) {
        // Rollback on error
        this.categories = originalCategories;
        console.error('Failed to delete category:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Initialize default categories for new accounts
    // _Requirements: 5.1_
    async initializeDefaultCategories() {
      try {
        const data = await apiService.post(`${CONFIG.API.ENDPOINTS.CATEGORIES}/initialize`);
        
        if (data.categories) {
          this.categories = data.categories;
          console.log('[OK] Default categories initialized:', this.categories.length);
          return { success: true, categories: data.categories };
        }
        
        return { success: false, error: data.error || 'Failed to initialize categories' };
      } catch (error) {
        console.error('Failed to initialize default categories:', error);
        return { success: false, error: error.message };
      }
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useCategoriesStore = useCategoriesStore;
}
