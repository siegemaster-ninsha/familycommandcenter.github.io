// Shopping Store
// Manages shopping items, quick items, and stores
// Supports offline-first operations with sync queue

const useShoppingStore = Pinia.defineStore('shopping', {
  state: () => ({
    items: [],
    quickItems: [],
    stores: [],
    loading: false,
    error: null,
    // Track local-only items (created offline, not yet synced)
    localItemIds: new Set()
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
        console.log('[OK] Shopping items loaded:', this.items.length);
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
        // Backend returns { items: [...] }, not { quickItems: [...] }
        this.quickItems = data.items || data.quickItems || [];
        console.log('[OK] Quick items loaded:', this.quickItems.length);
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
        console.log('[OK] Stores loaded:', this.stores.length);
      } catch (error) {
        console.error('Failed to load stores:', error);
        this.stores = [];
      }
    },
    
    // add shopping item (offline-first)
    async addItem(itemData) {
      // Generate a temporary local ID for offline items
      const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const localItem = {
        ...itemData,
        id: tempId,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      // Optimistically add to local state immediately
      this.items.push(localItem);
      this.localItemIds.add(tempId);
      console.log('[OK] Shopping item added locally:', localItem.name);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'CREATE',
            entity: 'shoppingItem',
            entityId: tempId,
            data: itemData
          });
          
          // Update offline store pending count
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, item: localItem, offline: true };
      }
      
      // Online - try to sync immediately
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS, itemData);
        
        if (data.item) {
          // Replace temp item with server item
          const index = this.items.findIndex(i => i.id === tempId);
          if (index !== -1) {
            this.items[index] = data.item;
          }
          this.localItemIds.delete(tempId);
          console.log('[OK] Shopping item synced:', data.item.name);
          return { success: true, item: data.item };
        }
        
        return { success: true, item: localItem };
      } catch (error) {
        console.warn('Failed to sync shopping item, keeping local:', error.message);
        // Keep the local item, queue for sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'CREATE',
            entity: 'shoppingItem',
            entityId: tempId,
            data: itemData
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, item: localItem, offline: true };
      }
    },
    
    // update shopping item (offline-first)
    async updateItem(itemId, updates) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        console.warn('Item not found for update:', itemId);
        return { success: false, error: 'Item not found' };
      }
      

      
      // Optimistic update - apply changes immediately
      const index = this.items.findIndex(i => i.id === itemId);
      if (index !== -1) {
        this.items[index] = { ...this.items[index], ...updates };
      }
      console.log('[OK] Shopping item updated locally:', itemId);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'shoppingItem',
            entityId: itemId,
            data: updates
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, item: this.items[index], offline: true };
      }
      
      // Online - try to sync immediately
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`, updates);
        
        if (data.item) {
          // Update with server response
          if (index !== -1) {
            this.items[index] = { ...this.items[index], ...data.item };
          }
          console.log('[OK] Shopping item update synced:', itemId);
          return { success: true, item: data.item };
        }
        
        return { success: true, item: this.items[index] };
      } catch (error) {
        console.warn('Failed to sync item update, keeping local state:', error.message);
        // Keep local state, queue for sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'shoppingItem',
            entityId: itemId,
            data: updates
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, item: this.items[index], offline: true };
      }
    },
    
    // delete shopping item (offline-first)
    async deleteItem(itemId) {
      // Optimistic update - always remove from local state immediately
      this.items = this.items.filter(item => item.id !== itemId);
      this.localItemIds.delete(itemId);
      console.log('[OK] Shopping item deleted locally:', itemId);
      
      // If it's a local-only item that was never synced, no need to sync delete
      if (itemId.startsWith('local_')) {
        return { success: true };
      }
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'DELETE',
            entity: 'shoppingItem',
            entityId: itemId,
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
        await apiService.delete(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`);
        console.log('[OK] Shopping item delete synced:', itemId);
        return { success: true };
      } catch (error) {
        console.warn('Failed to sync item delete, queuing:', error.message);
        // Queue for sync (item already removed from local state)
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'DELETE',
            entity: 'shoppingItem',
            entityId: itemId,
            data: {}
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, offline: true };
      }
    },
    
    // toggle item completion (offline-first)
    async toggleItemComplete(itemId) {
      const item = this.items.find(i => i.id === itemId);
      if (!item) {
        console.warn('Item not found for completion toggle');
        return { success: false };
      }
      
      // Optimistic update - always update local state immediately
      item.completed = !item.completed;
      console.log('[OK] Item completion toggled locally:', item.name, '->', item.completed);
      
      // Check if online
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!isOnline) {
        // Queue for later sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'shoppingItem',
            entityId: itemId,
            data: { completed: item.completed }
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, offline: true };
      }
      
      // Online - try to sync
      try {
        await apiService.put(`${CONFIG.API.ENDPOINTS.SHOPPING_ITEMS}/${itemId}`, { completed: item.completed });
        console.log('[OK] Item completion synced:', item.name);
        return { success: true };
      } catch (error) {
        console.warn('Failed to sync item toggle, keeping local state:', error.message);
        // Keep local state, queue for sync
        if (window.syncQueue) {
          await window.syncQueue.enqueue({
            type: 'UPDATE',
            entity: 'shoppingItem',
            entityId: itemId,
            data: { completed: item.completed }
          });
          
          if (window.useOfflineStore) {
            window.useOfflineStore().incrementPendingSync();
          }
        }
        return { success: true, offline: true };
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
        
        console.log('[OK] All items marked complete');
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
        
        console.log('[OK] Completed items cleared');
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
        
        console.log('[OK] All items cleared');
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
          console.log('[OK] Quick item added:', data.quickItem.name);
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
        console.log('[OK] Quick item deleted:', quickItemId);
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
          console.log('[OK] Store added:', data.store.name);
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
          console.log('[OK] Store updated:', storeId);
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
        console.log('[OK] Store deleted:', storeId);
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

