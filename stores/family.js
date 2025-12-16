// Family Store
// Manages family members, earnings, and spending requests
// Enhanced with offline support - caches data and falls back when offline

const useFamilyStore = Pinia.defineStore('family', {
  state: () => ({
    members: [],
    spendingRequests: [],
    loading: false,
    error: null,
    // Offline state tracking
    isUsingCachedData: false,
    
    // form states
    childForm: {
      username: '',
      password: '',
      displayName: ''
    },
    
    inviteData: {
      token: '',
      expiresAt: null
    },
    
    pendingInviteToken: null,
    
    spendAmount: 0,
    spendAmountString: '0'
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
    
    // get total family earnings
    totalEarnings: (state) => {
      return state.members.reduce((sum, member) => sum + (member.earnings || 0), 0);
    },
    
    // get total family completed chores
    totalCompletedChores: (state) => {
      return state.members.reduce((sum, member) => sum + (member.completedChores || 0), 0);
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
          
          // Normalize member data to ensure dailyChores is always an array
          const normalizeMembers = (members) => members.map(member => ({
            ...member,
            dailyChores: Array.isArray(member.dailyChores) ? member.dailyChores : []
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
          // Normalize member data to ensure dailyChores is always an array
          this.members = cachedMembers.map(member => ({
            ...member,
            dailyChores: Array.isArray(member.dailyChores) ? member.dailyChores : []
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
        const data = await apiService.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}/daily-chores`,
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
        const data = await apiService.post(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}/daily-chores`,
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
        const data = await apiService.delete(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}/daily-chores/${quicklistChoreId}`
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
        const authStore = window.useAuthStore ? window.useAuthStore() : null;
        const accountId = authStore?.accountId;
        
        if (!accountId) {
          console.error('Account ID not available');
          return { success: false, error: 'Account ID not available' };
        }
        
        // optimistic update
        const originalValue = member.showOnChoreBoard;
        member.showOnChoreBoard = !member.showOnChoreBoard;
        
        try {
          await apiService.put(
            `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${accountId}/${member.id}`,
            { showOnChoreBoard: member.showOnChoreBoard }
          );
          
          console.log('[OK] Member chore board visibility updated:', member.name);
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
    resetChildForm() {
      this.childForm = {
        username: '',
        password: '',
        displayName: ''
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
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useFamilyStore = useFamilyStore;
}

