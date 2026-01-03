// Family Store
// Manages family members, earnings, and spending requests
// Enhanced with offline support - caches data and falls back when offline

/**
 * Compute the priority chore for a family member
 * 
 * The priority chore is the incomplete chore with the lowest sort order value.
 * Chores without a sort order are treated as having Infinity (lowest priority).
 * 
 * @param {Array<Object>} chores - Array of chore objects with id and completed properties
 * @param {Object} choreSortOrder - Map of choreId -> sortOrder (integer)
 * @returns {Object|null} The priority chore, or null if no incomplete chores exist
 * 
 * **Feature: chore-priority, Property 5: Priority Chore Computation**
 * **Validates: Requirements 2.1, 2.3, 2.4**
 */
function computePriorityChore(chores, choreSortOrder = {}) {
  // Handle edge cases
  if (!Array.isArray(chores) || chores.length === 0) {
    return null;
  }

  // Filter to incomplete chores only (Requirements 2.1, 2.3)
  const incompleteChores = chores.filter(chore => !chore.completed);

  // If all chores are completed, return null (Requirement 2.2)
  if (incompleteChores.length === 0) {
    return null;
  }

  // Sort by sort order (chores without order go to end with Infinity)
  const sorted = [...incompleteChores].sort((a, b) => {
    const orderA = choreSortOrder[a.id] ?? Infinity;
    const orderB = choreSortOrder[b.id] ?? Infinity;
    return orderA - orderB;
  });

  // Return the first item (lowest sort order = highest priority)
  return sorted[0];
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.computePriorityChore = computePriorityChore;
}

const useFamilyStore = Pinia.defineStore('family', {
  state: () => ({
    members: [],
    spendingRequests: [],
    // Start with loading: true so skeletons show immediately on page load
    // Stores will set to false once data is fetched
    loading: true,
    error: null,
    // Offline state tracking
    isUsingCachedData: false,
    
    // form states
    // _Requirements: 1.4_
    childForm: {
      username: '',
      password: '',
      displayName: ''
    },
    
    // _Requirements: 1.5_
    newPerson: {
      name: ''
    },
    
    inviteData: {
      token: '',
      expiresAt: null
    },
    
    pendingInviteToken: null,
    
    // Spending modal state
    // _Requirements: 3.1, 3.2_
    selectedPerson: null,
    spendAmount: 0,
    spendAmountString: '0',
    
    // Modal state
    // _Requirements: 4.2_
    // Default order modal data
    defaultOrderMember: null,
    // Person delete modal data
    personToDelete: null
  }),
  
  getters: {
    // get enabled members (visible on chore board)
    enabledMembers: (state) => {
      return state.members.filter(member => member.showOnChoreBoard !== false);
    },
    
    // get all members including hidden
    allMembers: (state) => {
      return state.members;
    },
    
    // get pending spending requests
    pendingRequests: (state) => {
      return state.spendingRequests.filter(req => req.status === 'pending');
    },
    
    // get member by ID
    memberById: (state) => {
      return (id) => state.members.find(member => member.id === id);
    },
    
    // get member by name (uses displayName field)
    memberByName: (state) => {
      return (name) => state.members.find(member => member.displayName === name);
    },
    
    // get daily chores for a member by ID
    memberDailyChores: (state) => {
      return (memberId) => {
        const member = state.members.find(m => m.id === memberId);
        return member?.dailyChores || [];
      };
    },
    
    // get chore sort order for a member by ID
    // **Feature: chore-priority**
    // **Validates: Requirements 5.2**
    memberChoreSortOrder: (state) => {
      return (memberId) => {
        const member = state.members.find(m => m.id === memberId);
        return member?.choreSortOrder || {};
      };
    },
    
    // compute priority chore for each member
    // Returns map of memberId → priorityChoreId
    // **Feature: chore-priority**
    // **Validates: Requirements 2.1**
    priorityChoreByMember: (state) => {
      const useChoresStore = window.useChoresStore;
      if (!useChoresStore) {
        return {};
      }
      
      const choresStore = useChoresStore();
      const result = {};
      
      state.members.forEach(member => {
        // Get chores assigned to this member (by displayName)
        const memberChores = (choresStore.chores || []).filter(
          chore => chore.assignedTo === member.displayName
        );
        
        // Compute priority chore using the same logic as backend
        const priorityChore = computePriorityChore(memberChores, member.choreSortOrder || {});
        result[member.id] = priorityChore ? priorityChore.id : null;
      });
      
      return result;
    },
    
    // get priority chore ID for a specific member
    // **Feature: chore-priority**
    // **Validates: Requirements 2.1**
    getPriorityChoreId: (state) => {
      return (memberId) => {
        const useChoresStore = window.useChoresStore;
        if (!useChoresStore) return null;
        
        const member = state.members.find(m => m.id === memberId);
        if (!member) return null;
        
        const choresStore = useChoresStore();
        const memberChores = (choresStore.chores || []).filter(
          chore => chore.assignedTo === member.displayName
        );
        
        const priorityChore = computePriorityChore(memberChores, member.choreSortOrder || {});
        return priorityChore ? priorityChore.id : null;
      };
    },
    
    // get total family earnings
    totalEarnings: (state) => {
      return state.members.reduce((sum, member) => sum + (member.earnings || 0), 0);
    },
    
    // get total family completed chores
    totalCompletedChores: (state) => {
      return state.members.reduce((sum, member) => sum + (member.completedChores || 0), 0);
    },
    
    // get earnings by member name (for backward compatibility with app.js)
    // Returns object keyed by displayName with earnings value
    // _Requirements: 2.1, 2.4_
    earnings: (state) => {
      const earningsObj = {};
      state.members.forEach(member => {
        earningsObj[member.displayName || member.name] = member.earnings || 0;
      });
      return earningsObj;
    },
    
    // get electronics status by member name (for backward compatibility with app.js)
    // Returns object keyed by displayName with electronicsStatus value
    // _Requirements: 2.1, 2.4_
    electronicsStatus: (state) => {
      const statusObj = {};
      state.members.forEach(member => {
        statusObj[member.displayName || member.name] = member.electronicsStatus || { status: 'allowed', message: 'Electronics allowed' };
      });
      return statusObj;
    },
    
    // get children only
    children: (state) => {
      return state.members.filter(member => member.role === 'child');
    },
    
    // get parents only
    parents: (state) => {
      return state.members.filter(member => member.role === 'parent');
    },
    
    // member count
    memberCount: (state) => state.members.length
  },
  
  actions: {
    // load family members with offline cache support
    async loadMembers(preserveOptimisticUpdates = false) {
      this.loading = true;
      this.error = null;
      this.isUsingCachedData = false;
      
      const offlineStorage = window.offlineStorage;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      try {
        if (isOnline) {
          // Online: fetch from API and cache
          const data = await apiService.get(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
          
          // API returns { familyMembers: [...] } - use familyMembers key only
          const familyMembers = data.familyMembers || [];
          
          // Normalize member data to ensure dailyChores and choreSortOrder are always present
          const normalizeMembers = (members) => members.map(member => ({
            ...member,
            dailyChores: Array.isArray(member.dailyChores) ? member.dailyChores : [],
            choreSortOrder: member.choreSortOrder && typeof member.choreSortOrder === 'object' ? member.choreSortOrder : {}
          }));
          
          if (preserveOptimisticUpdates) {
            // preserve earnings from optimistic updates (keyed by displayName)
            const earningsMap = {};
            this.members.forEach(member => {
              earningsMap[member.displayName] = {
                earnings: member.earnings,
                completedChores: member.completedChores
              };
            });
            
            this.members = normalizeMembers(familyMembers).map(member => ({
              ...member,
              ...(earningsMap[member.displayName] || {})
            }));
          } else {
            this.members = normalizeMembers(familyMembers);
          }
          
          console.log('[OK] Family members loaded from API:', this.members.length);
          
          // Cache the data for offline use
          if (offlineStorage) {
            try {
              await offlineStorage.cacheFamilyMembers(this.members);
            } catch (cacheError) {
              console.warn('Failed to cache family members:', cacheError);
            }
          }
        } else {
          // Offline: load from cache
          await this._loadMembersFromCache();
        }
      } catch (error) {
        console.error('Failed to load family members from API:', error);
        
        // Try to fall back to cached data
        if (offlineStorage) {
          await this._loadMembersFromCache();
        } else {
          this.error = error.message;
          this.members = [];
        }
      } finally {
        this.loading = false;
      }
    },
    
    // Helper to load family members from cache
    async _loadMembersFromCache() {
      const offlineStorage = window.offlineStorage;
      if (!offlineStorage) {
        this.members = [];
        return;
      }
      
      try {
        const cachedMembers = await offlineStorage.getCachedFamilyMembers();
        if (cachedMembers && cachedMembers.length > 0) {
          // Normalize member data to ensure dailyChores and choreSortOrder are always present
          this.members = cachedMembers.map(member => ({
            ...member,
            dailyChores: Array.isArray(member.dailyChores) ? member.dailyChores : [],
            choreSortOrder: member.choreSortOrder && typeof member.choreSortOrder === 'object' ? member.choreSortOrder : {}
          }));
          this.isUsingCachedData = true;
          console.log('[CACHE] Family members loaded from cache:', this.members.length);
        } else {
          console.log('[CACHE] No cached family members available');
          this.members = [];
        }
      } catch (cacheError) {
        console.error('Failed to load family members from cache:', cacheError);
        this.members = [];
      }
    },
    
    // create child account (requires network)
    async createChild(childData) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('createChild')) {
        const message = offlineStore.getDisabledFeatureMessage('createChild');
        console.warn('[WARN] Cannot create child while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.CREATE_CHILD, {
          username: childData.username,
          password: childData.password,
          displayName: childData.displayName
        });
        
        if (data.success) {
          // reload members to include new child
          await this.loadMembers();
          console.log('[OK] Child created:', childData.displayName);
          return { success: true };
        }
        
        return { success: false, error: data.error || 'Failed to create child' };
      } catch (error) {
        console.error('Failed to create child:', error);
        return { success: false, error: error.message };
      }
    },
    
    // update member
    async updateMember(memberId, updates) {
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}`, updates);
        
        if (data.member) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = { ...this.members[index], ...data.member };
          }
          console.log('[OK] Member updated:', memberId);
          return { success: true, member: data.member };
        }
        
        return { success: false, error: 'Failed to update member' };
      } catch (error) {
        console.error('Failed to update member:', error);
        return { success: false, error: error.message };
      }
    },
    
    // =============================================
    // CHORE SORT ORDER MANAGEMENT
    // **Feature: chore-priority**
    // =============================================
    
    /**
     * Update a family member's chore sort order
     * 
     * @param {string} memberId - Family member ID
     * @param {Object} sortOrder - Map of choreId -> sortOrder (integer)
     * @returns {Promise<{success: boolean, member?: Object, error?: string}>}
     * 
     * **Feature: chore-priority**
     * **Validates: Requirements 6.1**
     */
    async updateSortOrder(memberId, sortOrder) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('sortOrder')) {
        const message = offlineStore.getDisabledFeatureMessage('sortOrder') || 'Sort order management requires network connectivity';
        console.warn('[WARN] Cannot update sort order while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      // Find the member and store original sort order for rollback
      const member = this.members.find(m => m.id === memberId);
      const originalSortOrder = member ? { ...(member.choreSortOrder || {}) } : {};
      
      // Also track app.js people array for optimistic update
      const app = window.app;
      const appMemberIndex = app?.people?.findIndex(m => m.id === memberId) ?? -1;
      const appMember = appMemberIndex !== -1 ? app.people[appMemberIndex] : null;
      const appOriginalSortOrder = appMember ? { ...(appMember.choreSortOrder || {}) } : {};
      
      // Optimistic update - both Pinia store AND app.js people array
      // This ensures immediate UI feedback before API response
      // IMPORTANT: Replace entire object to trigger Vue reactivity (nested mutations don't trigger updates)
      const newSortOrder = sortOrder && typeof sortOrder === 'object' ? { ...sortOrder } : {};
      if (member) {
        member.choreSortOrder = newSortOrder;
      }
      if (appMember && appMemberIndex !== -1) {
        // Replace the entire object in the array to trigger Vue reactivity
        app.people[appMemberIndex] = { ...appMember, choreSortOrder: newSortOrder };
      }
      
      try {
        // URL-encode memberId to handle special characters like # in MEMBER#uuid
        const encodedMemberId = encodeURIComponent(memberId);
        const data = await apiService.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}/sort-order`,
          { sortOrder }
        );
        
        // Backend returns 'familyMember' key
        const memberData = data.familyMember || data.member;
        if (memberData) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = {
              ...this.members[index],
              ...memberData,
              choreSortOrder: memberData.choreSortOrder && typeof memberData.choreSortOrder === 'object' 
                ? memberData.choreSortOrder 
                : {}
            };
          }
          
          // Also update app.js people array (used by chore page)
          // This ensures immediate UI update without waiting for WebSocket
          const app = window.app;
          if (app && app.people) {
            const appIndex = app.people.findIndex(m => m.id === memberId);
            if (appIndex !== -1) {
              app.people[appIndex] = {
                ...app.people[appIndex],
                choreSortOrder: memberData.choreSortOrder && typeof memberData.choreSortOrder === 'object' 
                  ? memberData.choreSortOrder 
                  : {}
              };
            }
          }
          
          console.log('[OK] Member sort order updated:', memberId);
          return { success: true, member: memberData };
        }
        
        return { success: false, error: 'Failed to update sort order' };
      } catch (error) {
        // Rollback on error - both Pinia store AND app.js people array
        // IMPORTANT: Replace entire object to trigger Vue reactivity
        if (member) {
          member.choreSortOrder = originalSortOrder;
        }
        if (app && app.people && appMemberIndex !== -1) {
          app.people[appMemberIndex] = { 
            ...app.people[appMemberIndex], 
            choreSortOrder: appOriginalSortOrder 
          };
        }
        console.error('Failed to update sort order:', error);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Update sort order for a member based on an ordered list of chore IDs
     * Normalizes to contiguous 0, 1, 2... values
     * 
     * @param {string} memberId - Family member ID
     * @param {string[]} orderedChoreIds - Array of chore IDs in desired order
     * @returns {Promise<{success: boolean, member?: Object, error?: string}>}
     * 
     * **Feature: chore-priority**
     * **Validates: Requirements 4.1, 4.2**
     */
    async reorderChores(memberId, orderedChoreIds) {
      // Build normalized sort order map (0, 1, 2...)
      const sortOrder = {};
      orderedChoreIds.forEach((choreId, index) => {
        sortOrder[choreId] = index;
      });
      
      return this.updateSortOrder(memberId, sortOrder);
    },
    
    /**
     * Update a family member's default chore order
     * This determines the initial sort order when New Day creates chores from scheduled quicklist items
     * 
     * @param {string} memberId - Family member ID
     * @param {Object} defaultOrderMap - Map of quicklistChoreId -> sortOrder (non-negative integers)
     * @returns {Promise<{success: boolean, member?: Object, error?: string}>}
     */
    async updateDefaultOrder(memberId, defaultOrderMap) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('defaultOrder')) {
        const message = offlineStore.getDisabledFeatureMessage('defaultOrder') || 'Default order management requires network connectivity';
        console.warn('[WARN] Cannot update default order while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      // Find the member and store original default order for rollback
      const member = this.members.find(m => m.id === memberId);
      const originalDefaultOrder = member ? { ...(member.defaultChoreOrder || {}) } : {};
      
      // Optimistic update
      if (member) {
        member.defaultChoreOrder = defaultOrderMap && typeof defaultOrderMap === 'object' ? { ...defaultOrderMap } : {};
      }
      
      try {
        // URL-encode memberId to handle special characters like # in MEMBER#uuid
        const encodedMemberId = encodeURIComponent(memberId);
        const data = await apiService.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}/default-order`,
          { defaultOrder: defaultOrderMap }
        );
        
        // Backend returns 'familyMember' key
        const memberData = data.familyMember || data.member;
        if (memberData) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = {
              ...this.members[index],
              ...memberData,
              defaultChoreOrder: memberData.defaultChoreOrder && typeof memberData.defaultChoreOrder === 'object' 
                ? memberData.defaultChoreOrder 
                : {}
            };
          }
          
          // Also update app.js people array
          const app = window.app;
          if (app && app.people) {
            const appIndex = app.people.findIndex(m => m.id === memberId);
            if (appIndex !== -1) {
              app.people[appIndex] = {
                ...app.people[appIndex],
                defaultChoreOrder: memberData.defaultChoreOrder && typeof memberData.defaultChoreOrder === 'object' 
                  ? memberData.defaultChoreOrder 
                  : {}
              };
            }
          }
          
          console.log('[OK] Member default order updated:', memberId);
          return { success: true, member: memberData };
        }
        
        return { success: false, error: 'Failed to update default order' };
      } catch (error) {
        // Rollback on error
        if (member) {
          member.defaultChoreOrder = originalDefaultOrder;
        }
        console.error('Failed to update default order:', error);
        return { success: false, error: error.message };
      }
    },
    
    // =============================================
    // DAILY CHORES MANAGEMENT
    // =============================================
    
    // Update member's entire daily chores list (PUT)
    // Requirements: 1.2, 1.3
    async updateMemberDailyChores(memberId, dailyChores) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('dailyChores')) {
        const message = offlineStore.getDisabledFeatureMessage('dailyChores') || 'Daily chores management requires network connectivity';
        console.warn('[WARN] Cannot update daily chores while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      // Optimistic update
      const member = this.members.find(m => m.id === memberId);
      const originalDailyChores = member ? [...(member.dailyChores || [])] : [];
      
      if (member) {
        member.dailyChores = Array.isArray(dailyChores) ? dailyChores : [];
      }
      
      try {
        // URL-encode memberId to handle special characters like # in MEMBER#uuid
        const encodedMemberId = encodeURIComponent(memberId);
        const data = await apiService.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}/daily-chores`,
          { dailyChores }
        );
        
        if (data.member) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = {
              ...this.members[index],
              ...data.member,
              dailyChores: Array.isArray(data.member.dailyChores) ? data.member.dailyChores : []
            };
          }
          console.log('[OK] Member daily chores updated:', memberId);
          return { success: true, member: data.member };
        }
        
        return { success: false, error: 'Failed to update daily chores' };
      } catch (error) {
        // Rollback on error
        if (member) {
          member.dailyChores = originalDailyChores;
        }
        console.error('Failed to update member daily chores:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Add a single daily chore to member (POST)
    // Requirements: 1.2
    async addMemberDailyChore(memberId, quicklistChoreId) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('dailyChores')) {
        const message = offlineStore.getDisabledFeatureMessage('dailyChores') || 'Daily chores management requires network connectivity';
        console.warn('[WARN] Cannot add daily chore while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      // Optimistic update
      const member = this.members.find(m => m.id === memberId);
      const originalDailyChores = member ? [...(member.dailyChores || [])] : [];
      
      if (member && !member.dailyChores.includes(quicklistChoreId)) {
        member.dailyChores = [...(member.dailyChores || []), quicklistChoreId];
      }
      
      try {
        // URL-encode memberId to handle special characters like # in MEMBER#uuid
        const encodedMemberId = encodeURIComponent(memberId);
        const data = await apiService.post(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}/daily-chores`,
          { quicklistChoreId }
        );
        
        if (data.member) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = {
              ...this.members[index],
              ...data.member,
              dailyChores: Array.isArray(data.member.dailyChores) ? data.member.dailyChores : []
            };
          }
          console.log('[OK] Daily chore added to member:', memberId);
          return { success: true, member: data.member };
        }
        
        return { success: false, error: 'Failed to add daily chore' };
      } catch (error) {
        // Rollback on error
        if (member) {
          member.dailyChores = originalDailyChores;
        }
        console.error('Failed to add daily chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // Remove a daily chore from member (DELETE)
    // Requirements: 1.3
    async removeMemberDailyChore(memberId, quicklistChoreId) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('dailyChores')) {
        const message = offlineStore.getDisabledFeatureMessage('dailyChores') || 'Daily chores management requires network connectivity';
        console.warn('[WARN] Cannot remove daily chore while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      // Optimistic update
      const member = this.members.find(m => m.id === memberId);
      const originalDailyChores = member ? [...(member.dailyChores || [])] : [];
      
      if (member) {
        member.dailyChores = (member.dailyChores || []).filter(id => id !== quicklistChoreId);
      }
      
      try {
        // URL-encode memberId and quicklistChoreId to handle special characters
        const encodedMemberId = encodeURIComponent(memberId);
        const encodedQuicklistId = encodeURIComponent(quicklistChoreId);
        const data = await apiService.delete(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}/daily-chores/${encodedQuicklistId}`
        );
        
        if (data.member) {
          const index = this.members.findIndex(m => m.id === memberId);
          if (index !== -1) {
            this.members[index] = {
              ...this.members[index],
              ...data.member,
              dailyChores: Array.isArray(data.member.dailyChores) ? data.member.dailyChores : []
            };
          }
          console.log('[OK] Daily chore removed from member:', memberId);
          return { success: true, member: data.member };
        }
        
        return { success: false, error: 'Failed to remove daily chore' };
      } catch (error) {
        // Rollback on error
        if (member) {
          member.dailyChores = originalDailyChores;
        }
        console.error('Failed to remove daily chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // update member chore board visibility
    async updateMemberChoresEnabled(member) {
      try {
        // optimistic update
        const originalValue = member.showOnChoreBoard;
        member.showOnChoreBoard = !member.showOnChoreBoard;
        
        try {
          // URL-encode memberId to handle special characters like # in MEMBER#uuid
          const encodedMemberId = encodeURIComponent(member.id);
          await apiService.put(
            `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedMemberId}`,
            { showOnChoreBoard: member.showOnChoreBoard }
          );
          
          console.log('[OK] Member chore board visibility updated:', member.displayName);
          return { success: true };
        } catch (error) {
          // rollback on error
          member.showOnChoreBoard = originalValue;
          throw error;
        }
      } catch (error) {
        console.error('Failed to update member chore board visibility:', error);
        return { success: false, error: error.message };
      }
    },
    
    // remove member
    async removeMember(memberId) {
      // optimistic update
      const originalMembers = [...this.members];
      this.members = this.members.filter(m => m.id !== memberId);
      
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}`);
        console.log('[OK] Member removed:', memberId);
        return { success: true };
      } catch (error) {
        console.error('Failed to remove member:', error);
        // rollback on error
        this.members = originalMembers;
        return { success: false, error: error.message };
      }
    },
    
    // spending requests
    async loadSpendingRequests() {
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.SPENDING_REQUESTS);
        this.spendingRequests = data.requests || [];
        console.log('[OK] Spending requests loaded:', this.spendingRequests.length);
      } catch (error) {
        console.error('Failed to load spending requests:', error);
        this.spendingRequests = [];
      }
    },
    
    // create spending request (requires network)
    async createSpendingRequest(personName, amount) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('spendingRequest')) {
        const message = offlineStore.getDisabledFeatureMessage('spendingRequest');
        console.warn('[WARN] Cannot create spending request while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.SPENDING_REQUESTS, {
          personName,
          amount
        });
        
        if (data.request) {
          this.spendingRequests.push(data.request);
          console.log('[OK] Spending request created:', amount);
          return { success: true, request: data.request };
        }
        
        return { success: false, error: 'Failed to create spending request' };
      } catch (error) {
        console.error('Failed to create spending request:', error);
        return { success: false, error: error.message };
      }
    },
    
    // approve spending request (requires network)
    async approveSpendingRequest(requestId) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('spendingRequest')) {
        const message = offlineStore.getDisabledFeatureMessage('spendingRequest');
        console.warn('[WARN] Cannot approve spending request while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        await apiService.put(`${CONFIG.API.ENDPOINTS.SPENDING_REQUESTS}/${requestId}/approve`);
        
        // update local state
        const request = this.spendingRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'approved';
        }
        
        // reload members to update earnings
        await this.loadMembers();
        
        console.log('[OK] Spending request approved:', requestId);
        return { success: true };
      } catch (error) {
        console.error('Failed to approve spending request:', error);
        return { success: false, error: error.message };
      }
    },
    
    // deny spending request (requires network)
    async denySpendingRequest(requestId) {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('spendingRequest')) {
        const message = offlineStore.getDisabledFeatureMessage('spendingRequest');
        console.warn('[WARN] Cannot deny spending request while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        await apiService.put(`${CONFIG.API.ENDPOINTS.SPENDING_REQUESTS}/${requestId}/deny`);
        
        // update local state
        const request = this.spendingRequests.find(r => r.id === requestId);
        if (request) {
          request.status = 'denied';
        }
        
        console.log('[OK] Spending request denied:', requestId);
        return { success: true };
      } catch (error) {
        console.error('Failed to deny spending request:', error);
        return { success: false, error: error.message };
      }
    },
    
    // parent invite (requires network)
    async createParentInvite() {
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('parentInvite')) {
        const message = offlineStore.getDisabledFeatureMessage('parentInvite');
        console.warn('[WARN] Cannot create parent invite while offline');
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(message);
        }
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.PARENT_INVITE);
        
        if (data.token) {
          this.inviteData = {
            token: data.token,
            expiresAt: data.expiresAt
          };
          console.log('[OK] Parent invite created');
          return { success: true, token: data.token, expiresAt: data.expiresAt };
        }
        
        return { success: false, error: 'Failed to create invite' };
      } catch (error) {
        console.error('Failed to create parent invite:', error);
        return { success: false, error: error.message };
      }
    },
    
    // earnings
    async loadEarnings() {
      // earnings are part of family members, so just reload members
      await this.loadMembers();
    },
    
    // load electronics status for all members
    // _Requirements: 2.3_
    async loadElectronicsStatus() {
      try {
        // Load electronics status for each member individually
        for (const member of this.members) {
          try {
            const memberName = member.displayName || member.name;
            const response = await apiService.get(`${CONFIG.API.ENDPOINTS.ELECTRONICS_STATUS}/${memberName}`);
            member.electronicsStatus = response;
          } catch (error) {
            console.error(`Failed to load electronics status for ${member.displayName || member.name}:`, error);
            member.electronicsStatus = { status: 'allowed', message: 'Electronics allowed' };
          }
        }
        console.log('[OK] Electronics status loaded for all members');
      } catch (error) {
        console.error('Failed to load electronics status:', error);
      }
    },
    
    // Optimistically update electronics status for a member based on current chores
    // Uses chores store to check for incomplete electronics chores
    // _Requirements: 2.3_
    updateElectronicsStatusOptimistically(memberName) {
      const member = this.members.find(m => (m.displayName || m.name) === memberName);
      if (!member) return;

      // Get chores from chores store
      const choresStore = window.useChoresStore?.();
      const chores = choresStore?.chores || [];

      // Count incomplete electronics chores for this member
      const incompleteElectronicsChores = chores.filter(chore => 
        chore.assignedTo === memberName && 
        chore.category === 'game' && 
        !chore.completed
      );

      const allowed = incompleteElectronicsChores.length === 0;
      
      member.electronicsStatus = {
        status: allowed ? 'allowed' : 'blocked',
        message: allowed ? 'Electronics allowed' : `${incompleteElectronicsChores.length} electronics task${incompleteElectronicsChores.length > 1 ? 's' : ''} remaining`
      };
    },
    
    // update earnings for a specific member (optimistic, uses displayName)
    updateMemberEarnings(memberName, earningsChange, choresChange = 0) {
      const member = this.members.find(m => m.displayName === memberName);
      if (member) {
        member.earnings = (member.earnings || 0) + earningsChange;
        member.completedChores = (member.completedChores || 0) + choresChange;
        console.log(`Updated earnings for ${memberName}: ${member.earnings}`);
      }
    },
    
    // form helpers
    // _Requirements: 1.4_
    resetChildForm() {
      this.childForm = {
        username: '',
        password: '',
        displayName: ''
      };
    },
    
    // _Requirements: 1.5_
    resetNewPersonForm() {
      this.newPerson = {
        name: ''
      };
    },
    
    resetInviteData() {
      this.inviteData = {
        token: '',
        expiresAt: null
      };
    },
    
    setSpendAmount(amount) {
      this.spendAmount = amount;
      this.spendAmountString = amount.toString();
    },
    
    // =============================================
    // SPENDING MODAL ACTIONS
    // _Requirements: 3.3_
    // =============================================
    
    /**
     * Open the spending modal for a person
     * @param {Object} person - The person to spend money for
     */
    openSpendingModal(person) {
      this.selectedPerson = person;
      this.spendAmount = 0;
      this.spendAmountString = '0';
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('spending');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openSpendingModal via familyStore');
    },
    
    /**
     * Close the spending modal and reset state
     */
    closeSpendingModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('spending');
      this.selectedPerson = null;
      this.spendAmount = 0;
      this.spendAmountString = '0';
    },
    
    /**
     * Add a digit to the spend amount string
     * Handles leading zero removal
     * @param {number} digit - The digit to add (0-9)
     * 
     * **Feature: app-js-cleanup, Property 2: Spending Amount Digit Accumulation**
     * **Validates: Requirements 3.2, 3.3**
     */
    addDigit(digit) {
      if (this.spendAmountString === '0') {
        this.spendAmountString = digit.toString();
      } else {
        this.spendAmountString += digit.toString();
      }
      this.updateSpendAmount();
    },
    
    /**
     * Add a decimal point to the spend amount string
     * Only adds if no decimal exists
     * 
     * **Feature: app-js-cleanup, Property 3: Spending Amount Decimal Handling**
     * **Validates: Requirements 3.2, 3.3**
     */
    addDecimal() {
      if (!this.spendAmountString.includes('.')) {
        this.spendAmountString += '.';
        this.updateSpendAmount();
      }
    },
    
    /**
     * Clear the spend amount to zero
     */
    clearSpendAmount() {
      this.spendAmountString = '0';
      this.spendAmount = 0;
    },
    
    /**
     * Update the numeric spendAmount from the string representation
     */
    updateSpendAmount() {
      const amount = parseFloat(this.spendAmountString);
      this.spendAmount = isNaN(amount) ? 0 : Number(amount);
    },
    
    // =============================================
    // DEFAULT ORDER MODAL ACTIONS
    // _Requirements: 4.2_
    // =============================================
    
    /**
     * Open the default order modal for a family member
     * @param {Object} member - The family member to set default order for
     */
    openDefaultOrderModal(member) {
      this.defaultOrderMember = member;
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('defaultOrder');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openDefaultOrderModal via familyStore');
    },
    
    /**
     * Close the default order modal and reset state
     */
    closeDefaultOrderModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('defaultOrder');
      this.defaultOrderMember = null;
    },
    
    // =============================================
    // DELETE PERSON MODAL ACTIONS
    // _Requirements: 4.2_
    // =============================================
    
    /**
     * Open the delete person confirmation modal
     * @param {Object} person - The person to delete
     */
    openDeletePersonModal(person) {
      this.personToDelete = person;
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('deletePerson');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openDeletePersonModal via familyStore');
    },
    
    /**
     * Close the delete person modal and reset state
     */
    closeDeletePersonModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('deletePerson');
      this.personToDelete = null;
    },
    
    // =============================================
    // SPENDING CONFIRMATION
    // _Requirements: 5.7_
    // =============================================
    
    /**
     * Confirm spending for the selected person
     * Deducts the spend amount from the person's earnings
     * 
     * @returns {Promise<{success: boolean, error?: string}>}
     * 
     * **Feature: app-js-cleanup, Property 6: Spending Deduction Correctness**
     * **Validates: Requirements 5.7**
     */
    async confirmSpending() {
      if (!this.selectedPerson) {
        return { success: false, error: 'No person selected' };
      }
      
      const spendAmount = this.spendAmount;
      const maxAmount = this.selectedPerson.earnings || 0;
      
      if (spendAmount <= 0) {
        return { success: false, error: 'Spend amount must be greater than zero' };
      }
      
      if (spendAmount > maxAmount) {
        return { success: false, error: 'Spend amount exceeds available earnings' };
      }
      
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('spending')) {
        const message = offlineStore.getDisabledFeatureMessage('spending') || 'Spending requires network connectivity';
        console.warn('[WARN] Cannot process spending while offline');
        const uiStore = window.useUIStore?.();
        uiStore?.showError(message);
        return { success: false, error: message, offlineBlocked: true };
      }
      
      const personName = this.selectedPerson.displayName || this.selectedPerson.name;
      
      try {
        // Make API call to deduct earnings
        const encodedName = encodeURIComponent(personName);
        await apiService.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedName}/earnings`,
          { amount: Number(spendAmount), operation: 'subtract' }
        );
        
        // Optimistically update earnings instead of reloading all members
        // This avoids showing skeleton loading state
        this.updateMemberEarnings(personName, -spendAmount, 0);
        
        // Show success
        const uiStore = window.useUIStore?.();
        uiStore?.showSuccess(`${personName} spent $${spendAmount.toFixed(2)}!`);
        
        // Close the modal
        this.closeSpendingModal();
        
        console.log('[OK] Spending confirmed:', personName, spendAmount);
        return { success: true };
      } catch (error) {
        console.error('Failed to process spending:', error);
        const uiStore = window.useUIStore?.();
        uiStore?.showError('Failed to process spending');
        return { success: false, error: error.message };
      }
    },
    
    // =============================================
    // FAMILY MEMBER DISPLAY NAME UPDATE
    // _Requirements: 5.8_
    // =============================================
    
    /**
     * Update a family member's display name
     * Only works for user-linked members (not legacy/manual rows)
     * 
     * @param {Object} person - The person to update
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateFamilyMemberDisplayName(person) {
      // Require user-linked member to update profile; disallow for legacy/manual rows
      if (!person?.userId) {
        return { success: false, error: 'Cannot update display name for non-user-linked members' };
      }
      
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('updateMember')) {
        const message = offlineStore.getDisabledFeatureMessage('updateMember') || 'Updating members requires network connectivity';
        console.warn('[WARN] Cannot update display name while offline');
        const uiStore = window.useUIStore?.();
        uiStore?.showError(message);
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        await apiService.post(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS, {
          userId: person.userId,
          displayName: person.displayName || person.name,
          name: person.displayName || person.name
        });
        
        // Reload family members
        await this.loadMembers(false);
        
        console.log('[OK] Display name updated:', person.displayName || person.name);
        return { success: true };
      } catch (error) {
        console.warn('Failed to update display name:', error);
        return { success: false, error: error.message };
      }
    },
    
    // =============================================
    // MEMBER CHORES ENABLED (VISIBILITY) UPDATE
    // _Requirements: 5.9_
    // =============================================
    
    /**
     * Update whether a member is enabled for chores (visible on chore board)
     * Persists the setting to account preferences
     * 
     * @param {Object} person - The person to update (must have enabledForChores property set)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async updateMemberChoresEnabledSetting(person) {
      const authStore = window.useAuthStore?.();
      const uiStore = window.useUIStore?.();
      
      // Check if feature is available offline
      const offlineStore = window.useOfflineStore ? window.useOfflineStore() : null;
      if (offlineStore && !offlineStore.isFeatureAvailable('settings')) {
        const message = offlineStore.getDisabledFeatureMessage('settings') || 'Settings changes require network connectivity';
        console.warn('[WARN] Cannot update member visibility while offline');
        uiStore?.showError(message);
        return { success: false, error: message, offlineBlocked: true };
      }
      
      try {
        // Ensure we know the account first
        const accountId = authStore?.accountId || authStore?.accountSettings?.accountId;
        if (!accountId) {
          try {
            await authStore?.loadAccountSettings?.();
          } catch {
            /* ignore - will use defaults */
          }
        }
        
        const finalAccountId = authStore?.accountId || authStore?.accountSettings?.accountId;
        if (!finalAccountId) {
          console.warn('Cannot persist member visibility: missing accountId');
          return { success: false, error: 'Missing account ID' };
        }
        
        // Optimistically update local state via authStore
        const prefs = authStore?.accountSettings?.preferences || {};
        const current = { ...(prefs.membersChoresEnabled || {}) };
        const enabled = !!person.enabledForChores;
        
        // Write both userId and name keys for stability across backfills
        if (person.userId) current[person.userId] = enabled;
        if (person.name) current[person.name] = enabled;
        
        if (authStore) {
          authStore.accountSettings = {
            ...(authStore.accountSettings || {}),
            preferences: { ...prefs, membersChoresEnabled: current }
          };
        }
        
        // Prefer granular endpoint with optional OCC
        const memberKey = person.userId || person.name;
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          console.debug('[Visibility] persist start', {
            accountId: finalAccountId,
            memberKey,
            enabled,
            before: { ...(authStore?.accountSettings?.preferences?.membersChoresEnabled || {}) }
          });
        }
        
        let res;
        try {
          res = await window.SettingsClient.updateMemberVisibility(
            finalAccountId,
            memberKey,
            enabled,
            { ifMatch: authStore?.accountSettings?.updatedAt }
          );
        } catch (e) {
          console.warn('[Visibility] granular failed; falling back to bulk', e?.message || e);
          // Fallback to bulk partial update
          res = await window.SettingsClient.updatePreferences(
            finalAccountId,
            { membersChoresEnabled: current },
            { ifMatch: authStore?.accountSettings?.updatedAt }
          );
        }
        
        // Sync local cache with server echo via authStore
        if (res && res.preferences && authStore) {
          authStore.accountSettings = {
            ...authStore.accountSettings,
            preferences: res.preferences,
            updatedAt: res.updatedAt || authStore.accountSettings?.updatedAt
          };
          if (CONFIG.ENV.IS_DEVELOPMENT) {
            console.debug('[Visibility] persist done', {
              updatedAt: authStore.accountSettings.updatedAt,
              after: res.preferences?.membersChoresEnabled || {}
            });
          }
        }
        
        console.log('[OK] Member chores enabled updated:', memberKey, enabled);
        return { success: true };
      } catch (error) {
        console.warn('Failed to persist member chores enabled:', error);
        uiStore?.showError('Failed to save board visibility.');
        return { success: false, error: error.message };
      }
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useFamilyStore = useFamilyStore;
}

