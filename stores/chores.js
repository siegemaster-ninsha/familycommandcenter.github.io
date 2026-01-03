// Chores Store
// Manages chores, quicklist chores, and chore operations
// Enhanced with offline support - caches data and falls back when offline

const useChoresStore = Pinia.defineStore('chores', {
  state: () => ({
    chores: [],
    quicklistChores: [],
    selectedChoreId: null,
    selectedQuicklistChore: null,
    multiAssignSelectedMembers: [],
    loading: false,
    error: null,
    // Offline state tracking
    isUsingCachedData: false,
    
    // form states
    newChore: {
      name: '',
      amount: 0,
      category: 'regular',
      addToQuicklist: false,
      isDetailed: false
    },
    
    newQuicklistChore: {
      name: '',
      amount: 0,
      category: 'regular',
      isDetailed: false
    },
    
    choreDetailsForm: {
      name: '',
      details: '',
      amount: 0,
      category: 'regular',
      assignedTo: '',
      isNewFromQuicklist: false
    }
  }),
  
  getters: {
    // get selected chore object
    selectedChore: (state) => {
      if (state.selectedQuicklistChore) {
        return state.selectedQuicklistChore;
      }
      if (state.selectedChoreId) {
        return state.chores.find(c => c.id === state.selectedChoreId) || null;
      }
      return null;
    },
    
    // group chores by person (uses displayName field)
    choresByPerson: (state) => {
      const useFamilyStore = window.useFamilyStore;
      if (!useFamilyStore) {
        console.warn('useFamilyStore not available yet');
        return { unassigned: state.chores.filter(c => !c.assignedTo) };
      }
      
      const familyStore = useFamilyStore();
      const grouped = {
        unassigned: []
      };
      
      // add each person to the grouped object (keyed by displayName)
      if (Array.isArray(familyStore.members)) {
        familyStore.members.forEach(person => {
          if (person && person.displayName) {
            grouped[person.displayName] = [];
          }
        });
      }
      
      // assign chores to appropriate person or unassigned
      if (Array.isArray(state.chores)) {
        state.chores.forEach(chore => {
          if (chore.assignedTo && grouped[chore.assignedTo]) {
            grouped[chore.assignedTo].push(chore);
          } else if (!chore.assignedTo) {
            grouped.unassigned.push(chore);
          }
        });
      }
      
      return grouped;
    },
    
    // get unassigned chores
    unassignedChores: (state) => {
      return state.chores.filter(c => !c.assignedTo);
    },
    
    // get chores for a specific person
    choresForPerson: (state) => {
      return (personName) => state.chores.filter(c => c.assignedTo === personName);
    },
    
    // get completed chores
    completedChores: (state) => {
      return state.chores.filter(c => c.completed);
    },
    
    // get pending approval chores
    pendingApprovalChores: (state) => {
      return state.chores.filter(c => c.isPendingApproval);
    },
    
    // get chores pending sync (offline modifications)
    pendingSyncChores: (state) => {
      return state.chores.filter(c => c._pending);
    },
    
    // check if a specific chore is pending sync
    isChoresPendingSync: (state) => {
      return (choreId) => {
        const chore = state.chores.find(c => c.id === choreId);
        return chore ? !!chore._pending : false;
      };
    },
    
    // chore count
    choreCount: (state) => state.chores.length,
    
    // quicklist count
    quicklistCount: (state) => state.quicklistChores.length,
    
    /**
     * Groups quicklist items by their categoryName
     * Items with null/undefined categoryName go to "Uncategorized"
     * 
     * **Feature: quicklist-categories**
     * **Validates: Requirements 3.1**
     * 
     * @returns {Object} Object with category names as keys and arrays of chores as values
     */
    quicklistByCategory: (state) => {
      const useCategoriesStore = window.useCategoriesStore;
      const categories = useCategoriesStore ? useCategoriesStore().sortedCategories : [];
      
      // Use Object.create(null) to avoid prototype pollution issues
      const grouped = Object.create(null);
      
      // Initialize groups for each category
      categories.forEach(cat => {
        if (cat && cat.name) {
          grouped[cat.name] = [];
        }
      });
      
      // Always have Uncategorized group
      grouped['Uncategorized'] = [];
      
      // Assign chores to groups
      (state.quicklistChores || []).forEach(chore => {
        const categoryName = chore.categoryName || 'Uncategorized';
        if (Object.hasOwn(grouped, categoryName)) {
          grouped[categoryName].push(chore);
        } else {
          // Category doesn't exist in our list, put in Uncategorized
          grouped['Uncategorized'].push(chore);
        }
      });
      
      return grouped;
    },
    
    /**
     * Returns sorted category names with Uncategorized always last
     * 
     * **Feature: quicklist-categories**
     * **Validates: Requirements 3.5**
     * 
     * @returns {string[]} Sorted array of category names
     */
    sortedCategoryNames() {
      const grouped = this.quicklistByCategory;
      const useCategoriesStore = window.useCategoriesStore;
      const categories = useCategoriesStore ? useCategoriesStore().sortedCategories : [];
      
      // Build a map of category name to sortOrder
      const categoryOrder = new Map();
      categories.forEach((cat, idx) => {
        if (cat && cat.name) {
          categoryOrder.set(cat.name, cat.sortOrder ?? idx);
        }
      });
      
      const keys = Object.keys(grouped);
      
      return keys.sort((a, b) => {
        // Uncategorized always last
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        
        // Then by sortOrder from categories
        const orderA = categoryOrder.get(a) ?? Infinity;
        const orderB = categoryOrder.get(b) ?? Infinity;
        return orderA - orderB;
      });
    },
    
    /**
     * Filters quicklist items by search query while maintaining category grouping
     * Empty/whitespace queries return all items grouped by category
     * 
     * **Feature: quicklist-categories**
     * **Validates: Requirements 6.1, 6.2, 6.3**
     * 
     * @param {string} searchQuery - Search query string
     * @returns {Object} Filtered and grouped object
     */
    filteredQuicklistByCategory: (state) => {
      return (searchQuery) => {
        const useCategoriesStore = window.useCategoriesStore;
        const categories = useCategoriesStore ? useCategoriesStore().sortedCategories : [];
        
        // Filter by search query
        const query = (searchQuery || '').trim().toLowerCase();
        let filtered = state.quicklistChores || [];
        
        if (query) {
          filtered = filtered.filter(chore => {
            const name = (chore.name || '').toLowerCase();
            return name.includes(query);
          });
        }
        
        // Use Object.create(null) to avoid prototype pollution issues
        const grouped = Object.create(null);
        
        // Initialize groups for each category
        categories.forEach(cat => {
          if (cat && cat.name) {
            grouped[cat.name] = [];
          }
        });
        
        // Always have Uncategorized group
        grouped['Uncategorized'] = [];
        
        // Assign filtered chores to groups
        filtered.forEach(chore => {
          const categoryName = chore.categoryName || 'Uncategorized';
          if (Object.hasOwn(grouped, categoryName)) {
            grouped[categoryName].push(chore);
          } else {
            // Category doesn't exist in our list, put in Uncategorized
            grouped['Uncategorized'].push(chore);
          }
        });
        
        return grouped;
      };
    }
  },
  
  actions: {
    // load chores from API with offline cache support
    async loadChores() {
      this.loading = true;
      this.error = null;
      this.isUsingCachedData = false;
      
      const offlineStorage = window.offlineStorage;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      try {
        if (isOnline) {
          // Online: fetch from API and cache
          const data = await apiService.get(CONFIG.API.ENDPOINTS.CHORES);
          this.chores = data.chores || [];
          console.log('[OK] Chores loaded from API:', this.chores.length);
          
          // Cache the data for offline use
          if (offlineStorage) {
            try {
              await offlineStorage.cacheChores(this.chores);
            } catch (cacheError) {
              console.warn('Failed to cache chores:', cacheError);
            }
          }
        } else {
          // Offline: load from cache
          await this._loadChoresFromCache();
        }
      } catch (error) {
        console.error('Failed to load chores from API:', error);
        
        // Try to fall back to cached data
        if (offlineStorage) {
          await this._loadChoresFromCache();
        } else {
          this.error = error.message;
          this.chores = [];
        }
      } finally {
        this.loading = false;
      }
    },
    
    // Helper to load chores from cache
    async _loadChoresFromCache() {
      const offlineStorage = window.offlineStorage;
      if (!offlineStorage) {
        this.chores = [];
        return;
      }
      
      try {
        const cachedChores = await offlineStorage.getCachedChores();
        if (cachedChores && cachedChores.length > 0) {
          this.chores = cachedChores;
          this.isUsingCachedData = true;
          console.log('[CACHE] Chores loaded from cache:', this.chores.length);
        } else {
          console.log('[CACHE] No cached chores available');
          this.chores = [];
        }
      } catch (cacheError) {
        console.error('Failed to load chores from cache:', cacheError);
        this.chores = [];
      }
    },
    
    // load quicklist chores with offline cache support
    async loadQuicklistChores() {
      const offlineStorage = window.offlineStorage;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      try {
        if (isOnline) {
          // Online: fetch from API and cache
          const data = await apiService.get(CONFIG.API.ENDPOINTS.QUICKLIST);
          this.quicklistChores = data.quicklistChores || [];
          console.log('[OK] Quicklist chores loaded from API:', this.quicklistChores.length);
          
          // Cache the data for offline use
          if (offlineStorage) {
            try {
              await offlineStorage.cacheQuicklist(this.quicklistChores);
            } catch (cacheError) {
              console.warn('Failed to cache quicklist:', cacheError);
            }
          }
        } else {
          // Offline: load from cache
          await this._loadQuicklistFromCache();
        }
      } catch (error) {
        console.error('Failed to load quicklist from API:', error);
        
        // Try to fall back to cached data
        if (offlineStorage) {
          await this._loadQuicklistFromCache();
        } else {
          this.quicklistChores = [];
        }
      }
    },
    
    // Helper to load quicklist from cache
    async _loadQuicklistFromCache() {
      const offlineStorage = window.offlineStorage;
      if (!offlineStorage) {
        this.quicklistChores = [];
        return;
      }
      
      try {
        const cachedQuicklist = await offlineStorage.getCachedQuicklist();
        if (cachedQuicklist && cachedQuicklist.length > 0) {
          this.quicklistChores = cachedQuicklist;
          console.log('[CACHE] Quicklist loaded from cache:', this.quicklistChores.length);
        } else {
          console.log('[CACHE] No cached quicklist available');
          this.quicklistChores = [];
        }
      } catch (cacheError) {
        console.error('Failed to load quicklist from cache:', cacheError);
        this.quicklistChores = [];
      }
    },
    
    // create new chore with offline support
    async createChore(choreData) {
      
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
        
        // Check if this was queued for offline sync
        if (data._pending) {
          // Add to local state with pending flag
          const pendingChore = {
            ...data,
            _pending: true,
            _queueId: data._queueId,
            _queuedAt: data._queuedAt
          };
          this.chores.push(pendingChore);
          console.log('[QUEUE] Chore queued for sync:', pendingChore.name);
          
          // Update local cache with pending chore
          await this._updateLocalCache();
          
          return { success: true, chore: pendingChore, pending: true };
        }
        
        if (data.chore) {
          this.chores.push(data.chore);
          console.log('[OK] Chore created:', data.chore.name);
          
          // Update cache after successful creation
          await this._updateLocalCache();
          
          return { success: true, chore: data.chore };
        }
        
        return { success: false, error: 'Failed to create chore' };
      } catch (error) {
        console.error('Failed to create chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // update chore with offline support
    async updateChore(choreId, updates) {
      const chore = this.chores.find(c => c.id === choreId);
      const originalChore = chore ? { ...chore } : null;
      
      // Optimistic update
      if (chore) {
        Object.assign(chore, updates);
      }
      
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.CHORES}/${choreId}`, {
          ...updates,
          id: choreId,
          updatedAt: Date.now()
        });
        
        // Check if this was queued for offline sync
        if (data._pending) {
          const index = this.chores.findIndex(c => c.id === choreId);
          if (index !== -1) {
            this.chores[index] = {
              ...this.chores[index],
              ...updates,
              _pending: true,
              _queueId: data._queueId,
              _queuedAt: data._queuedAt
            };
          }
          console.log('[QUEUE] Chore update queued for sync:', choreId);
          
          // Update local cache
          await this._updateLocalCache();
          
          return { success: true, chore: this.chores[index], pending: true };
        }
        
        if (data.chore) {
          const index = this.chores.findIndex(c => c.id === choreId);
          if (index !== -1) {
            // Remove pending flags when server confirms
            this.chores[index] = { 
              ...this.chores[index], 
              ...data.chore,
              _pending: false,
              _queueId: undefined,
              _queuedAt: undefined
            };
          }
          console.log('[OK] Chore updated:', choreId);
          
          // Update cache after successful update
          await this._updateLocalCache();
          
          return { success: true, chore: data.chore };
        }
        
        return { success: false, error: 'Failed to update chore' };
      } catch (error) {
        // Rollback optimistic update on error
        if (originalChore && chore) {
          Object.assign(chore, originalChore);
        }
        console.error('Failed to update chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // delete chore with offline support
    async deleteChore(chore) {
      if (!chore || !chore.id) {
        console.warn('Invalid chore for deletion');
        return { success: false };
      }
      
      console.log('[DELETE] Deleting chore:', chore.name);
      
      // optimistic update
      const originalChores = [...this.chores];
      this.chores = this.chores.filter(c => c.id !== chore.id);
      
      try {
        const result = await apiService.delete(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}`);
        
        // Check if this was queued for offline sync
        if (result && result._pending) {
          console.log('[QUEUE] Chore deletion queued for sync:', chore.name);
          
          // Update local cache
          await this._updateLocalCache();
          
          return { success: true, pending: true };
        }
        
        console.log('[OK] Chore deleted:', chore.name);
        
        // Update cache after successful deletion
        await this._updateLocalCache();
        
        // reload family members to update earnings if chore was completed
        if (chore.completed && window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        return { success: true };
      } catch (error) {
        console.error('Failed to delete chore:', error);
        // rollback on error
        this.chores = originalChores;
        return { success: false, error: error.message };
      }
    },
    
    // Helper to update local cache after modifications
    async _updateLocalCache() {
      const offlineStorage = window.offlineStorage;
      if (offlineStorage) {
        try {
          await offlineStorage.cacheChores(this.chores);
        } catch (error) {
          console.warn('Failed to update chores cache:', error);
        }
      }
    },
    
    // assign chore to person
    async assignChore(choreId, personName) {
      const chore = this.chores.find(c => c.id === choreId);
      if (!chore) {
        console.warn('Chore not found for assignment');
        return { success: false };
      }
      
      // optimistic update
      const originalAssignedTo = chore.assignedTo;
      chore.assignedTo = personName;
      
      try {
        await this.updateChore(choreId, { assignedTo: personName });
        console.log('[OK] Chore assigned to:', personName);
        return { success: true };
      } catch (error) {
        // rollback on error
        chore.assignedTo = originalAssignedTo;
        return { success: false, error: error.message };
      }
    },
    
    // toggle chore completion
    async toggleComplete(chore) {
      if (!chore || !chore.id) return { success: false };
      
      const useUIStore = window.useUIStore;
      const useCelebrations = window.useCelebrations;
      
      // optimistic update
      const originalCompleted = chore.completed;
      const originalPendingApproval = chore.isPendingApproval;
      chore.completed = !chore.completed;
      
      // check if approval is required
      const accountSettings = window.accountSettings || {};
      const requireApproval = accountSettings.preferences?.requireApproval;
      
      if (chore.completed && requireApproval) {
        chore.isPendingApproval = true;
      }
      
      try {
        // Backend /complete endpoint toggles the state, so always use it
        const endpoint = `${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`;
        
        await apiService.put(endpoint);
        
        // Note: We don't reload family members here to avoid showing skeleton.
        // The backend updates earnings and WebSocket pushes chore updates.
        // Earnings will be refreshed on next natural data load.
        
        // show success message and celebration
        if (chore.completed) {
          if (useUIStore) {
            const uiStore = useUIStore();
            uiStore.showSuccess(`Completed: ${chore.name}`);
          }
          
          // Trigger celebration (unless approval is required)
          if (!requireApproval && useCelebrations) {
            const celebrations = useCelebrations();
            celebrations.celebrate({ chore, accountSettings });
          }
        }
        
        return { success: true };
      } catch (error) {
        // rollback on error
        chore.completed = originalCompleted;
        chore.isPendingApproval = originalPendingApproval;
        console.error('Failed to toggle completion:', error);
        return { success: false, error: error.message };
      }
    },
    
    // approve chore (requires network)
    async approveChore(chore) {
      if (!chore || !chore.id) return { success: false };
      
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('approveChore')) {
        const message = offlineStore.getDisabledFeatureMessage('approveChore');
        console.warn('[WARN] Cannot approve chore while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        await apiService.put(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/approve`);
        
        // update local state
        chore.isPendingApproval = false;
        chore.approved = true;
        
        // reload earnings
        if (window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        // show success
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showSuccess(`Approved: ${chore.name}`);
        }
        
        console.log('[OK] Chore approved:', chore.name);
        return { success: true };
      } catch (error) {
        console.error('Failed to approve chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // start new day (requires network)
    // Returns enhanced response with summary: { choresRemoved, completedChoresCleared, dailyChoresCleared, dailyChoresCreated, duplicatesSkipped, membersProcessed }
    // _Requirements: 4.2, 6.3_
    async startNewDay() {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('newDay')) {
        const message = offlineStore.getDisabledFeatureMessage('newDay');
        console.warn('[WARN] Cannot start new day while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        console.log('[INFO] Starting new day...');
        
        const response = await apiService.post(CONFIG.API.ENDPOINTS.NEW_DAY);
        
        // reload chores and family members
        await this.loadChores();
        
        if (window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        // Parse summary from response for detailed success message
        const summary = response?.summary || {};
        const {
          choresRemoved = 0,
          completedChoresCleared = 0,
          dailyChoresCleared = 0,
          dailyChoresCreated = 0,
          duplicatesSkipped = 0,
          membersProcessed = 0
        } = summary;
        
        // Build detailed success message with counts
        const messageParts = [];
        if (choresRemoved > 0) {
          messageParts.push(`${choresRemoved} chore${choresRemoved !== 1 ? 's' : ''} cleared`);
        }
        if (dailyChoresCreated > 0) {
          messageParts.push(`${dailyChoresCreated} daily chore${dailyChoresCreated !== 1 ? 's' : ''} created`);
        }
        if (duplicatesSkipped > 0) {
          messageParts.push(`${duplicatesSkipped} duplicate${duplicatesSkipped !== 1 ? 's' : ''} skipped`);
        }
        
        const detailMessage = messageParts.length > 0 
          ? messageParts.join(', ')
          : 'Board ready for new day';
        
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showSuccess(`🌅 New day started! ${detailMessage}. Earnings preserved.`);
        }
        
        console.log('[OK] New day started successfully', summary);
        return { 
          success: true, 
          summary: {
            choresRemoved,
            completedChoresCleared,
            dailyChoresCleared,
            dailyChoresCreated,
            duplicatesSkipped,
            membersProcessed
          }
        };
      } catch (error) {
        console.error('Failed to start new day:', error);
        return { success: false, error: error.message };
      }
    },
    
    // selection management
    selectChore(chore) {
      if (chore && chore.id) {
        this.selectedChoreId = chore.id;
        this.selectedQuicklistChore = null;
        console.log('Selected chore:', chore.name);
      }
    },
    
    selectQuicklistChore(chore) {
      this.selectedQuicklistChore = chore;
      this.selectedChoreId = null;
      console.log('Selected quicklist chore:', chore?.name);
    },
    
    clearSelection() {
      this.selectedChoreId = null;
      this.selectedQuicklistChore = null;
      this.multiAssignSelectedMembers = [];
    },
    
    // multi-assign helpers
    toggleMemberSelection(memberName) {
      const index = this.multiAssignSelectedMembers.indexOf(memberName);
      if (index === -1) {
        this.multiAssignSelectedMembers.push(memberName);
      } else {
        this.multiAssignSelectedMembers.splice(index, 1);
      }
    },
    
    clearMemberSelection() {
      this.multiAssignSelectedMembers = [];
    },
    
    // =============================================
    // WEEKLY SCHEDULE MANAGEMENT
    // **Feature: weekly-chore-scheduling**
    // **Validates: Requirements 1.3, 1.5**
    // =============================================
    
    /**
     * Update the schedule for a specific member on a quicklist chore
     * Uses optimistic update with rollback on error
     * 
     * @param {string} quicklistId - Quicklist chore ID
     * @param {string} memberId - Family member ID
     * @param {string[]} days - Array of day codes (sun, mon, tue, wed, thu, fri, sat)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateQuicklistSchedule(quicklistId, memberId, days) {
      // Find the quicklist chore
      const quicklistChore = this.quicklistChores.find(c => c.id === quicklistId);
      if (!quicklistChore) {
        console.error('[updateQuicklistSchedule] Quicklist chore not found:', quicklistId);
        return { success: false, error: 'Quicklist chore not found' };
      }
      
      // Store original schedule for rollback
      const originalSchedule = quicklistChore.schedule 
        ? JSON.parse(JSON.stringify(quicklistChore.schedule)) 
        : {};
      
      // Optimistic update
      if (!quicklistChore.schedule) {
        quicklistChore.schedule = {};
      }
      
      if (days && days.length > 0) {
        quicklistChore.schedule[memberId] = [...days];
      } else {
        // Empty days array removes member from schedule
        delete quicklistChore.schedule[memberId];
      }
      
      try {
        // Make API call to update schedule
        const encodedQuicklistId = encodeURIComponent(quicklistId);
        const response = await apiService.put(
          `${CONFIG.API.ENDPOINTS.QUICKLIST}/${encodedQuicklistId}/schedule`,
          { memberId, days }
        );
        
        // Update local state with server response if available
        if (response && response.quicklistChore) {
          const index = this.quicklistChores.findIndex(c => c.id === quicklistId);
          if (index !== -1) {
            this.quicklistChores[index] = {
              ...this.quicklistChores[index],
              ...response.quicklistChore
            };
          }
        }
        
        console.log('[OK] Schedule updated for quicklist:', quicklistId, 'member:', memberId);
        return { success: true };
      } catch (error) {
        // Rollback on error
        quicklistChore.schedule = originalSchedule;
        console.error('[updateQuicklistSchedule] Failed:', error);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Update the entire schedule for a quicklist chore (all members at once)
     * Used when saving from the schedule modal
     * 
     * @param {string} quicklistId - Quicklist chore ID
     * @param {Object} schedule - Schedule object { memberId: [days], ... }
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateQuicklistFullSchedule(quicklistId, schedule) {
      // Find the quicklist chore
      const quicklistChore = this.quicklistChores.find(c => c.id === quicklistId);
      if (!quicklistChore) {
        console.error('[updateQuicklistFullSchedule] Quicklist chore not found:', quicklistId);
        return { success: false, error: 'Quicklist chore not found' };
      }
      
      // Store original schedule for rollback
      const originalSchedule = quicklistChore.schedule 
        ? JSON.parse(JSON.stringify(quicklistChore.schedule)) 
        : {};
      
      // Optimistic update - replace entire schedule
      quicklistChore.schedule = schedule ? { ...schedule } : {};
      
      try {
        // Make API calls for each member in the new schedule
        // We need to update each member individually since the API expects per-member updates
        const memberIds = new Set([
          ...Object.keys(originalSchedule),
          ...Object.keys(schedule || {})
        ]);
        
        for (const memberId of memberIds) {
          const days = schedule[memberId] || [];
          const encodedQuicklistId = encodeURIComponent(quicklistId);
          await apiService.put(
            `${CONFIG.API.ENDPOINTS.QUICKLIST}/${encodedQuicklistId}/schedule`,
            { memberId, days }
          );
        }
        
        console.log('[OK] Full schedule updated for quicklist:', quicklistId);
        return { success: true };
      } catch (error) {
        // Rollback on error
        quicklistChore.schedule = originalSchedule;
        console.error('[updateQuicklistFullSchedule] Failed:', error);
        return { success: false, error: error.message };
      }
    },
    
    // form helpers
    resetNewChoreForm() {
      this.newChore = {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      };
    },
    
    resetQuicklistChoreForm() {
      this.newQuicklistChore = {
        name: '',
        amount: 0,
        category: 'regular',
        isDetailed: false
      };
    },
    
    resetChoreDetailsForm() {
      this.choreDetailsForm = {
        name: '',
        details: '',
        amount: 0,
        category: 'regular',
        assignedTo: '',
        isNewFromQuicklist: false
      };
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useChoresStore = useChoresStore;
}

