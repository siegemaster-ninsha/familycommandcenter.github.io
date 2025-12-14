// Shopping Store
// Manages shopping items, quick items, and stores

const useShoppingStore = Pinia.defineStore('shopping', {
  state: () => ({
    items: [],
    quickItems: [],
    stores: [],
    loading: false,
    error: null
  }),
  
  getters: {
    // get items by category
    itemsByCategory: (state) => {
      const grouped = {};
      
      state.items.forEach(item => {
        const category = item.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      });
      
      return grouped;
    },
    
    // get completed items
    completedItems: (state) => {
      return state.items.filter(item => item.completed);
    },
    
    // get pending items
    pendingItems: (state) => {
      return state.items.filter(item => !item.completed);
    },
    
    // get completion percentage
    completionPercentage: (state) => {
      if (state.items.length === 0) return 0;
      const completed = state.items.filter(item => item.completed).length;
      return Math.round((completed / state.items.length) * 100);
    },
    
    // check if all items are complete
    allItemsComplete: (state) => {
      return state.items.length > 0 && state.items.every(item => item.completed);
    },
    
    // get item by ID
    itemById: (state) => {
      return (id) => state.items.find(item => item.id === id);
    },
    
    // get store by ID
    storeById: (state) => {
      return (id) => state.stores.find(store => store.id === id);
    },
    
    // item counts
    itemCount: (state) => state.items.length,
    completedCount: (state) => state.items.filter(item => item.completed).length,
    pendingCount: (state) => state.items.filter(item => !item.completed).length
  },
  
  actions: {
    // load shopping items
    async loadItems() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS);
        this.items = data.items || [];
        console.log('✅ Shopping items loaded:', this.items.length);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to load shopping items:', error);
        this.items = [];
      } finally {
        this.loading = false;
      }
    },
    
    // load quick items
    async loadQuickItems() {
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS);
        this.quickItems = data.quickItems || [];
        console.log('✅ Quick items loaded:', this.quickItems.length);
      } catch (error) {
        console.error('Failed to load quick items:', error);
        this.quickItems = [];
      }
    },
    
    // load stores
    async loadStores() {
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.STORES);
        this.stores = data.stores || [];
        console.log('✅ Stores loaded:', this.stores.length);
      } catch (error) {
        console.error('Failed to load stores:', error);
        this.stores = [];
      }
    },
    
    // add shopping item
    async addItem(itemData) {
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS, itemData);
        
        if (data.item) {
          this.items.push(data.item);
          console.log('✅ Shopping item added:', data.item.name);
          return { success: true, item: data.item };
        }
        
        return { success: false, error: 'Failed to add item' };
      } catch (error) {
        console.error('Failed to add shopping item:', error);
        return { success: false, error: error.message };
      }
    },
    
    // update shopping item
    async updateItem(itemId, updates) {
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`, updates);
        
        if (data.item) {
          const index = this.items.findIndex(item => item.id === itemId);
          if (index !== -1) {
            this.items[index] = { ...this.items[index], ...data.item };
          }
          console.log('✅ Shopping item updated:', itemId);
          return { success: true, item: data.item };
        }
        
        return { success: false, error: 'Failed to update item' };
      } catch (error) {
        console.error('Failed to update shopping item:', error);
        return { success: false, error: error.message };
      }
    },
    
    // delete shopping item
    async deleteItem(itemId) {
      // optimistic update
      const originalItems = [...this.items];
      this.items = this.items.filter(item => item.id !== itemId);
      
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`);
        console.log('✅ Shopping item deleted:', itemId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete shopping item:', error);
        // rollback on error
        this.items = originalItems;
        return { success: false, error: error.message };
      }
    },
    
    // toggle item completion
    async toggleItemComplete(itemId) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        console.warn('Item not found for completion toggle');
        return { success: false };
      }
      
      // optimistic update
      const originalCompleted = item.completed;
      item.completed = !item.completed;
      
      try {
        await this.updateItem(itemId, { completed: item.completed });
        console.log('✅ Item completion toggled:', item.name);
        return { success: true };
      } catch (error) {
        // rollback on error
        item.completed = originalCompleted;
        return { success: false, error: error.message };
      }
    },
    
    // mark all items as complete
    async markAllComplete() {
      const uncompleted = this.items.filter(item => !item.completed);
      
      if (uncompleted.length === 0) {
        console.log('All items already completed');
        return { success: true };
      }
      
      // optimistic update
      const originalItems = JSON.parse(JSON.stringify(this.items));
      this.items.forEach(item => {
        item.completed = true;
      });
      
      try {
        // update each item
        await Promise.all(
          uncompleted.map(item => this.updateItem(item.id, { completed: true }))
        );
        
        console.log('✅ All items marked complete');
        return { success: true };
      } catch (error) {
        console.error('Failed to mark all complete:', error);
        // rollback on error
        this.items = originalItems;
        return { success: false, error: error.message };
      }
    },
    
    // clear completed items
    async clearCompleted() {
      const completed = this.items.filter(item => item.completed);
      
      if (completed.length === 0) {
        console.log('No completed items to clear');
        return { success: true };
      }
      
      try {
        // delete each completed item
        await Promise.all(
          completed.map(item => this.deleteItem(item.id))
        );
        
        console.log('✅ Completed items cleared');
        return { success: true };
      } catch (error) {
        console.error('Failed to clear completed items:', error);
        return { success: false, error: error.message };
      }
    },
    
    // clear all items
    async clearAll() {
      if (this.items.length === 0) {
        console.log('No items to clear');
        return { success: true };
      }
      
      const itemsCopy = [...this.items];
      
      try {
        // delete all items
        await Promise.all(
          itemsCopy.map(item => this.deleteItem(item.id))
        );
        
        console.log('✅ All items cleared');
        return { success: true };
      } catch (error) {
        console.error('Failed to clear all items:', error);
        return { success: false, error: error.message };
      }
    },
    
    // quick items management
    async addQuickItem(quickItemData) {
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS, quickItemData);
        
        if (data.quickItem) {
          this.quickItems.push(data.quickItem);
          console.log('✅ Quick item added:', data.quickItem.name);
          return { success: true, quickItem: data.quickItem };
        }
        
        return { success: false, error: 'Failed to add quick item' };
      } catch (error) {
        console.error('Failed to add quick item:', error);
        return { success: false, error: error.message };
      }
    },
    
    async deleteQuickItem(quickItemId) {
      // optimistic update
      const originalQuickItems = [...this.quickItems];
      this.quickItems = this.quickItems.filter(item => item.id !== quickItemId);
      
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS}/${quickItemId}`);
        console.log('✅ Quick item deleted:', quickItemId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete quick item:', error);
        // rollback on error
        this.quickItems = originalQuickItems;
        return { success: false, error: error.message };
      }
    },
    
    // store management
    async addStore(storeData) {
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.STORES, storeData);
        
        if (data.store) {
          this.stores.push(data.store);
          console.log('✅ Store added:', data.store.name);
          return { success: true, store: data.store };
        }
        
        return { success: false, error: 'Failed to add store' };
      } catch (error) {
        console.error('Failed to add store:', error);
        return { success: false, error: error.message };
      }
    },
    
    async updateStore(storeId, updates) {
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.STORES}/${storeId}`, updates);
        
        if (data.store) {
          const index = this.stores.findIndex(store => store.id === storeId);
          if (index !== -1) {
            this.stores[index] = { ...this.stores[index], ...data.store };
          }
          console.log('✅ Store updated:', storeId);
          return { success: true, store: data.store };
        }
        
        return { success: false, error: 'Failed to update store' };
      } catch (error) {
        console.error('Failed to update store:', error);
        return { success: false, error: error.message };
      }
    },
    
    async deleteStore(storeId) {
      // optimistic update
      const originalStores = [...this.stores];
      this.stores = this.stores.filter(store => store.id !== storeId);
      
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.STORES}/${storeId}`);
        console.log('✅ Store deleted:', storeId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete store:', error);
        // rollback on error
        this.stores = originalStores;
        return { success: false, error: error.message };
      }
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useShoppingStore = useShoppingStore;
}

