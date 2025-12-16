// Offline Store
// Manages offline state: network status, pending sync count, last sync time

const useOfflineStore = Pinia.defineStore('offline', {
  state: () => ({
    // Network status
    isOnline: true,
    
    // Sync tracking
    pendingSyncCount: 0,
    lastSyncTime: null,
    syncInProgress: false,
    
    // Error tracking
    lastSyncError: null
  }),
  
  getters: {
    // Check if there are pending changes to sync
    hasPendingChanges: (state) => state.pendingSyncCount > 0,
    
    // Get formatted last sync time
    formattedLastSyncTime: (state) => {
      if (!state.lastSyncTime) return 'Never';
      
      const date = new Date(state.lastSyncTime);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString();
    },
    
    // Get sync status message
    syncStatusMessage: (state) => {
      if (state.syncInProgress) return 'Syncing...';
      if (!state.isOnline) {
        if (state.pendingSyncCount > 0) {
          return `Offline - ${state.pendingSyncCount} change${state.pendingSyncCount > 1 ? 's' : ''} pending`;
        }
        return 'Offline';
      }
      if (state.pendingSyncCount > 0) {
        return `${state.pendingSyncCount} change${state.pendingSyncCount > 1 ? 's' : ''} pending`;
      }
      return 'All synced';
    }
  },
  
  actions: {
    // Update online status
    setOnlineStatus(status) {
      const wasOffline = !this.isOnline;
      this.isOnline = status;
      
      console.log(`[NETWORK] Online status: ${status ? 'online' : 'offline'}`);
      
      // If coming back online, handle transition
      if (wasOffline && status) {
        this._handleOnlineTransition();
      }
    },
    
    // Handle transition from offline to online
    async _handleOnlineTransition() {
      console.log('[SYNC] Back online, handling transition...');
      
      // First, process any pending sync queue
      if (this.pendingSyncCount > 0) {
        console.log(`[SYNC] Processing ${this.pendingSyncCount} pending changes...`);
        window.dispatchEvent(new CustomEvent('process-sync-queue'));
      }
      
      // Then refresh data from server
      await this._refreshDataFromServer();
    },
    
    // Refresh all data from server after coming online
    async _refreshDataFromServer() {
      console.log('[SYNC] Refreshing data from server...');
      
      try {
        // Refresh chores
        if (window.useChoresStore) {
          const choresStore = window.useChoresStore();
          await choresStore.loadChores();
          await choresStore.loadQuicklistChores();
        }
        
        // Refresh family members
        if (window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        // Refresh shopping items
        if (window.useShoppingStore) {
          const shoppingStore = window.useShoppingStore();
          await shoppingStore.loadItems();
          await shoppingStore.loadQuickItems();
        }
        
        console.log('[OK] Data refreshed from server');
      } catch (error) {
        console.error('Failed to refresh data from server:', error);
      }
    },
    
    // Increment pending sync count
    incrementPendingSync() {
      this.pendingSyncCount++;
      console.log(`[QUEUE] Pending sync count: ${this.pendingSyncCount}`);
    },
    
    // Decrement pending sync count
    decrementPendingSync() {
      if (this.pendingSyncCount > 0) {
        this.pendingSyncCount--;
      }
      console.log(`[QUEUE] Pending sync count: ${this.pendingSyncCount}`);
    },
    
    // Set pending sync count directly
    setPendingSyncCount(count) {
      this.pendingSyncCount = Math.max(0, count);
    },
    
    // Update last sync time
    updateLastSyncTime(time = Date.now()) {
      this.lastSyncTime = time;
    },
    
    // Set sync in progress
    setSyncInProgress(inProgress) {
      this.syncInProgress = inProgress;
    },
    
    // Set sync error
    setSyncError(error) {
      this.lastSyncError = error;
      if (error) {
        console.error('[ERROR] Sync error:', error);
      }
    },
    
    // Clear sync error
    clearSyncError() {
      this.lastSyncError = null;
    },
    
    // Trigger sync (dispatches event for sync queue to handle)
    triggerSync() {
      if (!this.isOnline) {
        console.log('[WARN] Cannot sync while offline');
        return false;
      }
      
      if (this.syncInProgress) {
        console.log('[WARN] Sync already in progress');
        return false;
      }
      
      window.dispatchEvent(new CustomEvent('process-sync-queue'));
      return true;
    },
    
    // Reset store state
    reset() {
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.pendingSyncCount = 0;
      this.lastSyncTime = null;
      this.syncInProgress = false;
      this.lastSyncError = null;
    },
    
    // Check if a feature is available (some features require network)
    isFeatureAvailable(featureName) {
      // Features that require network connectivity
      const networkRequiredFeatures = [
        'newDay',           // Starting a new day requires server sync
        'parentInvite',     // Creating parent invites requires server
        'createChild',      // Creating child accounts requires server
        'approveChore',     // Approving chores requires server confirmation
        'spendingRequest',  // Spending requests require server
        'accountSettings',  // Account settings changes require server
        'weatherWidget',    // Weather data requires network
        'triviaWidget',     // Trivia requires network
        'dadJokeWidget'     // Dad jokes require network
      ];
      
      // If online, all features are available
      if (this.isOnline) {
        return true;
      }
      
      // If offline, check if feature requires network
      return !networkRequiredFeatures.includes(featureName);
    },
    
    // Get message for disabled feature
    getDisabledFeatureMessage(featureName) {
      const messages = {
        newDay: 'Starting a new day requires an internet connection.',
        parentInvite: 'Creating parent invites requires an internet connection.',
        createChild: 'Creating child accounts requires an internet connection.',
        approveChore: 'Approving chores requires an internet connection.',
        spendingRequest: 'Spending requests require an internet connection.',
        accountSettings: 'Changing account settings requires an internet connection.',
        weatherWidget: 'Weather data requires an internet connection.',
        triviaWidget: 'Trivia requires an internet connection.',
        dadJokeWidget: 'Dad jokes require an internet connection.'
      };
      
      return messages[featureName] || 'This feature requires an internet connection.';
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useOfflineStore = useOfflineStore;
}
