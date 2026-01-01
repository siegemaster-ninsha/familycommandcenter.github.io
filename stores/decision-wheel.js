// Decision Wheel Store
// Manages decision wheel state: options, wheel configuration, spinning, and winner
// **Feature: decision-wheel**
// **Validates: Requirements 4.4, 4.5, 5.2, 5.3, 6.1, 6.3, 6.4, 7.1, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4**

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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
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
    showNewOptionFlyout: false
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
      
      console.log('[DecisionWheel] Option created:', newOption.id);
      
      return { success: true, option: newOption };
    },
    
    /**
     * Delete a decision option
     * **Validates: Requirements 5.2, 5.3**
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
      
      console.log('[DecisionWheel] Option deleted:', optionId);
      
      return { success: true };
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
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useDecisionWheelStore = useDecisionWheelStore;
}
