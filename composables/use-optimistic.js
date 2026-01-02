/**
 * Optimistic Update Composable
 * Provides a standardized pattern for optimistic updates with automatic rollback on failure.
 * 
 * This composable encapsulates the common pattern of:
 * 1. Capturing original state before mutation
 * 2. Executing an API call
 * 3. Rolling back to original state on failure
 * 4. Showing error messages to the user
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

const useOptimistic = () => {
  /**
   * Get the UI store instance for showing error messages
   * @returns {Object|null} UI store instance or null
   */
  const getUIStore = () => {
    return window.useUIStore?.();
  };

  /**
   * Deep clone an object to capture state
   * Uses JSON parse/stringify for simplicity and to ensure a true deep copy
   * @param {*} obj - Object to clone
   * @returns {*} Deep cloned object
   */
  const deepClone = (obj) => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle primitive types
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => deepClone(item));
    }
    
    // Handle objects - use JSON for deep clone
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      // Fallback for objects that can't be JSON serialized
      console.warn('[useOptimistic] Could not deep clone object, using shallow copy');
      return { ...obj };
    }
  };

  /**
   * Execute an optimistic update with automatic rollback on failure
   * 
   * @param {Object} options - Configuration options
   * @param {Function} options.getState - Returns current state to capture before mutation
   * @param {Function} options.setState - Sets state (used for rollback on failure)
   * @param {Function} options.apiCall - The async API call to make
   * @param {Function} [options.onSuccess] - Called on success with API response
   * @param {string} [options.errorMessage] - Message to show on failure
   * @returns {Promise<{success: boolean, response?: *, error?: Error}>} Result object
   * 
   * Requirements:
   * - 6.1: Provide standard pattern for storing original state before mutations
   * - 6.2: Provide rollback mechanism when API calls fail
   * - 6.3: Restore original state and show error message on failure
   * - 6.4: Work with any store that implements the required interface
   * 
   * @example
   * const { execute } = useOptimistic();
   * 
   * // In a store action:
   * async deleteChore(choreId) {
   *   const result = await execute({
   *     getState: () => this.chores,
   *     setState: (state) => { this.chores = state; },
   *     apiCall: () => api.delete(`/chores/${choreId}`),
   *     onSuccess: () => {
   *       this.chores = this.chores.filter(c => c.id !== choreId);
   *     },
   *     errorMessage: 'Failed to delete chore'
   *   });
   *   return result;
   * }
   */
  async function execute({ getState, setState, apiCall, onSuccess, errorMessage }) {
    // Validate required parameters
    if (typeof getState !== 'function') {
      throw new Error('[useOptimistic] getState must be a function');
    }
    if (typeof setState !== 'function') {
      throw new Error('[useOptimistic] setState must be a function');
    }
    if (typeof apiCall !== 'function') {
      throw new Error('[useOptimistic] apiCall must be a function');
    }

    // Capture original state before any mutation (Requirement 6.1)
    const originalState = deepClone(getState());

    if (typeof CONFIG !== 'undefined' && CONFIG?.ENV?.IS_DEVELOPMENT) {
      console.log('[useOptimistic] Captured original state:', originalState);
    }

    try {
      // Execute the API call
      const response = await apiCall();

      if (typeof CONFIG !== 'undefined' && CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log('[useOptimistic] API call successful:', response);
      }

      // Call success handler if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(response);
      }

      return { success: true, response };
    } catch (error) {
      console.error('[useOptimistic] API call failed, rolling back:', error);

      // Rollback to original state (Requirement 6.2)
      setState(originalState);

      if (typeof CONFIG !== 'undefined' && CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log('[useOptimistic] Rolled back to original state:', originalState);
      }

      // Show error message to user (Requirement 6.3)
      const uiStore = getUIStore();
      if (uiStore && errorMessage) {
        // Use showError for error messages (more appropriate than showSuccess with ❌)
        if (typeof uiStore.showError === 'function') {
          uiStore.showError(errorMessage);
        } else if (typeof uiStore.showSuccess === 'function') {
          // Fallback to showSuccess with error indicator
          uiStore.showSuccess(`❌ ${errorMessage}`);
        }
      }

      return { success: false, error };
    }
  }

  // Return public API
  return {
    execute,
    // Expose deepClone for testing purposes
    _deepClone: deepClone
  };
};

// Make available globally for non-module usage
window.useOptimistic = useOptimistic;
