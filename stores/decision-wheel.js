// Decision Wheel Store
// Manages decision wheel state: options, wheel configuration, spinning, and winner
// **Feature: decision-wheel**
// **Validates: Requirements 4.4, 4.5, 5.2, 5.3, 6.1, 6.3, 6.4, 7.1, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4**
// **Feature: decision-wheel-persistence**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4**

// Local storage key for persisting options
const STORAGE_KEY = 'fcc_decision_wheel_options';

// Wheel constraints
const MIN_WHEEL_OPTIONS = 2;
const MAX_WHEEL_OPTIONS = 12;

/**
 * Generate a UUID v4
 * @returns {string} A unique identifier
 */
function generateUUID() {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const useDecisionWheelStore = Pinia.defineStore('decisionWheel', {
  state: () => ({
    // All saved decision options
    // Array of { id: string, text: string, createdAt: number }
    savedOptions: [],
    
    // Options currently on the wheel (subset of savedOptions by ID)
    // Array of option IDs
    wheelOptions: [],
    
    // Whether the wheel is currently spinning
    isSpinning: false,
    
    // The winning option after a spin (option object or null)
    winner: null,
    
    // Whether to show the winner announcement overlay
    showWinner: false,
    
    // Whether to show the new option flyout
    showNewOptionFlyout: false,
    
    // Backend sync state
    // **Feature: decision-wheel-persistence**
    isLoadingFromBackend: false,
    backendSyncEnabled: false,
    lastSyncError: null
  }),
  
  getters: {
    /**
     * Check if the wheel can be spun (at least 2 options and not already spinning)
     * **Validates: Requirements 6.3, 9.1**
     */
    canSpin: (state) => {
      return state.wheelOptions.length >= MIN_WHEEL_OPTIONS && !state.isSpinning;
    },
    
    /**
     * Check if more options can be added to the wheel (max 12)
     * **Validates: Requirements 6.3**
     */
    canAddToWheel: (state) => {
      return state.wheelOptions.length < MAX_WHEEL_OPTIONS;
    },
    
    /**
     * Check if a specific option is currently on the wheel
     * **Validates: Requirements 6.4, 6.5**
     * @returns {function(string): boolean}
     */
    isOnWheel: (state) => {
      return (optionId) => state.wheelOptions.includes(optionId);
    },
    
    /**
     * Get the full option objects for options currently on the wheel
     * @returns {Array} Array of option objects on the wheel
     */
    wheelOptionObjects: (state) => {
      return state.wheelOptions
        .map(id => state.savedOptions.find(opt => opt.id === id))
        .filter(opt => opt !== undefined);
    },
    
    /**
     * Get the count of options on the wheel
     */
    wheelOptionCount: (state) => {
      return state.wheelOptions.length;
    }
  },
  
  actions: {
    /**
     * Create a new decision option
     * **Validates: Requirements 4.4, 4.5**
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 3.3, 5.2, 5.4**
     * 
     * @param {string} text - The option text
     * @returns {{ success: boolean, error?: string, option?: object }}
     */
    createOption(text) {
      // Validate input - reject empty or whitespace-only strings
      // **Validates: Requirements 4.5**
      if (!text || typeof text !== 'string') {
        return { success: false, error: 'Option text is required' };
      }
      
      const trimmedText = text.trim();
      
      if (trimmedText.length === 0) {
        return { success: false, error: 'Option cannot be blank' };
      }
      
      // Check for maximum length (50 characters as per design)
      if (trimmedText.length > 50) {
        return { success: false, error: 'Option must be 50 characters or less' };
      }
      
      // Create the new option
      // **Validates: Requirements 4.4**
      const newOption = {
        id: generateUUID(),
        text: trimmedText,
        createdAt: Date.now()
      };
      
      this.savedOptions.push(newOption);
      
      // Persist to storage
      this.saveToStorage();
      
      // Sync with backend if authenticated (non-blocking)
      // **Feature: decision-wheel-persistence**
      // **Validates: Requirements 3.3, 5.2, 5.4**
      this.syncCreateOption(trimmedText, newOption.id);
      
      console.log('[DecisionWheel] Option created:', newOption.id);
      
      return { success: true, option: newOption };
    },
    
    /**
     * Sync a created option to the backend
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 3.3, 5.2, 5.4**
     * 
     * @param {string} text - The option text
     * @param {string} localId - The local ID of the option
     */
    async syncCreateOption(text, localId) {
      // Check if authenticated
      const authStore = window.useAuthStore ? window.useAuthStore() : null;
      if (!authStore || !authStore.isAuthenticated) {
        console.log('[DecisionWheel] Not authenticated, skipping backend sync for create');
        return;
      }
      
      // Check if API service is available
      if (!window.apiService) {
        console.log('[DecisionWheel] API service not available, skipping backend sync');
        return;
      }
      
      try {
        const response = await window.apiService.createDecisionWheelOption(text);
        
        if (response && response.success && response.data) {
          // Update local option with backend ID and timestamps
          const localOption = this.savedOptions.find(opt => opt.id === localId);
          if (localOption) {
            localOption.backendId = response.data.id;
            localOption.accountId = response.data.accountId;
            this.saveToStorage();
          }
          console.log('[DecisionWheel] Option synced to backend:', response.data.id);
        }
      } catch (error) {
        // **Validates: Requirements 5.2, 5.4**
        // Keep local state, log warning, don't block UI
        console.warn('[DecisionWheel] Failed to sync option to backend:', error.message);
        this.lastSyncError = error.message;
      }
    },
    
    /**
     * Delete a decision option
     * **Validates: Requirements 5.2, 5.3**
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 3.4, 5.3, 5.4**
     * 
     * @param {string} optionId - The ID of the option to delete
     * @returns {{ success: boolean, error?: string }}
     */
    deleteOption(optionId) {
      if (!optionId) {
        return { success: false, error: 'Option ID is required' };
      }
      
      const optionIndex = this.savedOptions.findIndex(opt => opt.id === optionId);
      
      if (optionIndex === -1) {
        return { success: false, error: 'Option not found' };
      }
      
      // Get the option before removing (for backend sync)
      const option = this.savedOptions[optionIndex];
      const backendId = option.backendId || option.id;
      
      // Remove from saved options
      // **Validates: Requirements 5.2**
      this.savedOptions.splice(optionIndex, 1);
      
      // Also remove from wheel if present
      // **Validates: Requirements 5.3**
      const wheelIndex = this.wheelOptions.indexOf(optionId);
      if (wheelIndex !== -1) {
        this.wheelOptions.splice(wheelIndex, 1);
      }
      
      // Persist to storage
      this.saveToStorage();
      
      // Sync with backend if authenticated (non-blocking)
      // **Feature: decision-wheel-persistence**
      // **Validates: Requirements 3.4, 5.3, 5.4**
      this.syncDeleteOption(backendId);
      
      console.log('[DecisionWheel] Option deleted:', optionId);
      
      return { success: true };
    },
    
    /**
     * Sync a deleted option to the backend
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 3.4, 5.3, 5.4**
     * 
     * @param {string} optionId - The ID of the option to delete from backend
     */
    async syncDeleteOption(optionId) {
      // Check if authenticated
      const authStore = window.useAuthStore ? window.useAuthStore() : null;
      if (!authStore || !authStore.isAuthenticated) {
        console.log('[DecisionWheel] Not authenticated, skipping backend sync for delete');
        return;
      }
      
      // Check if API service is available
      if (!window.apiService) {
        console.log('[DecisionWheel] API service not available, skipping backend sync');
        return;
      }
      
      try {
        await window.apiService.deleteDecisionWheelOption(optionId);
        console.log('[DecisionWheel] Option deleted from backend:', optionId);
      } catch (error) {
        // **Validates: Requirements 5.3, 5.4**
        // Keep option removed from local state, log warning, don't block UI
        console.warn('[DecisionWheel] Failed to delete option from backend:', error.message);
        this.lastSyncError = error.message;
      }
    },
    
    /**
     * Add an option to the wheel
     * **Validates: Requirements 6.1, 6.3, 6.4**
     * 
     * @param {string} optionId - The ID of the option to add
     * @returns {{ success: boolean, error?: string }}
     */
    addToWheel(optionId) {
      if (!optionId) {
        return { success: false, error: 'Option ID is required' };
      }
      
      // Check if option exists in saved options
      const option = this.savedOptions.find(opt => opt.id === optionId);
      if (!option) {
        return { success: false, error: 'Option not found' };
      }
      
      // Check if already on wheel (idempotent - no error, just no-op)
      // **Validates: Requirements 6.4**
      if (this.wheelOptions.includes(optionId)) {
        return { success: true }; // Idempotent - already on wheel
      }
      
      // Check capacity
      // **Validates: Requirements 6.3**
      if (this.wheelOptions.length >= MAX_WHEEL_OPTIONS) {
        return { success: false, error: 'Wheel is full (max 12 options)' };
      }
      
      // Add to wheel
      // **Validates: Requirements 6.1**
      this.wheelOptions.push(optionId);
      
      console.log('[DecisionWheel] Option added to wheel:', optionId);
      
      return { success: true };
    },
    
    /**
     * Remove an option from the wheel
     * **Validates: Requirements 7.1, 7.3, 7.4**
     * 
     * @param {string} optionId - The ID of the option to remove
     * @returns {{ success: boolean, error?: string }}
     */
    removeFromWheel(optionId) {
      if (!optionId) {
        return { success: false, error: 'Option ID is required' };
      }
      
      const wheelIndex = this.wheelOptions.indexOf(optionId);
      
      if (wheelIndex === -1) {
        return { success: false, error: 'Option not on wheel' };
      }
      
      // Check minimum constraint
      // **Validates: Requirements 7.4**
      if (this.wheelOptions.length <= MIN_WHEEL_OPTIONS) {
        return { success: false, error: 'Need at least 2 options to spin' };
      }
      
      // Remove from wheel (option remains in savedOptions)
      // **Validates: Requirements 7.1, 7.3**
      this.wheelOptions.splice(wheelIndex, 1);
      
      console.log('[DecisionWheel] Option removed from wheel:', optionId);
      
      return { success: true };
    },
    
    /**
     * Open the new option flyout
     */
    openNewOptionFlyout() {
      this.showNewOptionFlyout = true;
    },
    
    /**
     * Close the new option flyout
     */
    closeNewOptionFlyout() {
      this.showNewOptionFlyout = false;
    },
    
    /**
     * Start the wheel spin
     * **Validates: Requirements 9.2, 9.4**
     */
    startSpin() {
      if (!this.canSpin) {
        console.warn('[DecisionWheel] Cannot spin - insufficient options or already spinning');
        return;
      }
      
      this.isSpinning = true;
      this.winner = null;
      this.showWinner = false;
      
      console.log('[DecisionWheel] Spin started');
    },
    
    /**
     * Complete the spin and set the winner
     * **Validates: Requirements 9.6, 10.1**
     * 
     * @param {number} winnerIndex - The index of the winning option in wheelOptions
     */
    completeSpin(winnerIndex) {
      if (winnerIndex < 0 || winnerIndex >= this.wheelOptions.length) {
        console.error('[DecisionWheel] Invalid winner index:', winnerIndex);
        this.isSpinning = false;
        return;
      }
      
      const winnerId = this.wheelOptions[winnerIndex];
      const winnerOption = this.savedOptions.find(opt => opt.id === winnerId);
      
      this.winner = winnerOption || null;
      this.isSpinning = false;
      this.showWinner = true;
      
      console.log('[DecisionWheel] Spin complete, winner:', winnerOption?.text);
    },
    
    /**
     * Dismiss the winner announcement
     * **Validates: Requirements 10.5**
     */
    dismissWinner() {
      this.showWinner = false;
      this.winner = null;
      
      console.log('[DecisionWheel] Winner dismissed');
    },
    
    /**
     * Load saved options from local storage
     * **Validates: Requirements 11.1, 11.2, 11.4**
     */
    loadFromStorage() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          
          if (Array.isArray(parsed)) {
            // Validate each option has required fields
            this.savedOptions = parsed.filter(opt => 
              opt && 
              typeof opt.id === 'string' && 
              typeof opt.text === 'string' &&
              typeof opt.createdAt === 'number'
            );
            
            console.log('[DecisionWheel] Loaded', this.savedOptions.length, 'options from storage');
          }
        }
      } catch (error) {
        // **Validates: Requirements 11.4**
        console.warn('[DecisionWheel] Failed to load from storage:', error);
        // Continue with empty state - in-memory only
      }
      
      // Wheel configuration is NOT persisted
      // **Validates: Requirements 11.3**
      this.wheelOptions = [];
    },
    
    /**
     * Load options from backend API when authenticated
     * Falls back to localStorage if not authenticated or API fails
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 3.1, 3.2, 5.1**
     */
    async loadFromBackend() {
      // First load from localStorage for immediate display
      this.loadFromStorage();
      
      // Check if authenticated
      const authStore = window.useAuthStore ? window.useAuthStore() : null;
      if (!authStore || !authStore.isAuthenticated) {
        // **Validates: Requirements 3.2**
        console.log('[DecisionWheel] Not authenticated, using localStorage only');
        this.backendSyncEnabled = false;
        return;
      }
      
      // Check if API service is available
      if (!window.apiService) {
        console.log('[DecisionWheel] API service not available, using localStorage only');
        this.backendSyncEnabled = false;
        return;
      }
      
      this.isLoadingFromBackend = true;
      this.lastSyncError = null;
      
      try {
        // **Validates: Requirements 3.1**
        const response = await window.apiService.getDecisionWheelOptions();
        
        if (response && response.success && Array.isArray(response.data)) {
          // Convert backend options to local format
          const backendOptions = response.data.map(opt => ({
            id: opt.id,
            text: opt.text,
            createdAt: new Date(opt.createdAt).getTime(),
            backendId: opt.id,
            accountId: opt.accountId
          }));
          
          // Merge with local options and migrate if needed
          await this.migrateLocalOptions(backendOptions);
          
          this.backendSyncEnabled = true;
          console.log('[DecisionWheel] Loaded', backendOptions.length, 'options from backend');
        }
      } catch (error) {
        // **Validates: Requirements 5.1**
        // Fall back to localStorage (already loaded above)
        console.warn('[DecisionWheel] Failed to load from backend, using localStorage:', error.message);
        this.lastSyncError = error.message;
        this.backendSyncEnabled = false;
      } finally {
        this.isLoadingFromBackend = false;
      }
    },
    
    /**
     * Migrate local options to backend on first sync
     * Deduplicates by text to avoid duplicates
     * **Feature: decision-wheel-persistence**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
     * 
     * @param {Array} backendOptions - Options already in the backend
     */
    async migrateLocalOptions(backendOptions) {
      // Get texts from backend options for deduplication
      const backendTexts = new Set(backendOptions.map(opt => opt.text.toLowerCase()));
      
      // Find local options not in backend (by text)
      // **Validates: Requirements 4.1**
      const localOnlyOptions = this.savedOptions.filter(
        opt => !opt.backendId && !backendTexts.has(opt.text.toLowerCase())
      );
      
      // Upload missing options to backend
      // **Validates: Requirements 4.2**
      const uploadedOptions = [];
      for (const localOpt of localOnlyOptions) {
        try {
          const response = await window.apiService.createDecisionWheelOption(localOpt.text);
          if (response && response.success && response.data) {
            uploadedOptions.push({
              id: response.data.id,
              text: response.data.text,
              createdAt: new Date(response.data.createdAt).getTime(),
              backendId: response.data.id,
              accountId: response.data.accountId
            });
            console.log('[DecisionWheel] Migrated local option to backend:', localOpt.text);
          }
        } catch (error) {
          console.warn('[DecisionWheel] Failed to migrate option:', localOpt.text, error.message);
        }
      }
      
      // Merge backend and uploaded options, deduplicate by text
      // **Validates: Requirements 4.3, 4.4**
      const allBackendOptions = [...backendOptions, ...uploadedOptions];
      const seenTexts = new Set();
      const mergedOptions = [];
      
      for (const opt of allBackendOptions) {
        const lowerText = opt.text.toLowerCase();
        if (!seenTexts.has(lowerText)) {
          seenTexts.add(lowerText);
          mergedOptions.push(opt);
        }
      }
      
      // Update saved options with merged result
      this.savedOptions = mergedOptions;
      this.saveToStorage();
      
      console.log('[DecisionWheel] Migration complete, total options:', mergedOptions.length);
    },
    
    /**
     * Save options to local storage
     * **Validates: Requirements 11.1**
     */
    saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedOptions));
      } catch (error) {
        // **Validates: Requirements 11.4**
        console.warn('[DecisionWheel] Failed to save to storage:', error);
        // Continue operating with in-memory storage only
      }
    },
    
    /**
     * Reset the store to initial state (useful for testing)
     */
    reset() {
      this.savedOptions = [];
      this.wheelOptions = [];
      this.isSpinning = false;
      this.winner = null;
      this.showWinner = false;
      this.showNewOptionFlyout = false;
      this.isLoadingFromBackend = false;
      this.backendSyncEnabled = false;
      this.lastSyncError = null;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useDecisionWheelStore = useDecisionWheelStore;
}
