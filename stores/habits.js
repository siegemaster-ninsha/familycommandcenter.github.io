// Habits Store
// Manages habit tracking state: habits, completions, and grid view expansion
// **Feature: habit-tracking**
// **Validates: Requirements 2.1, 4.4, 4.5**

const useHabitsStore = Pinia.defineStore('habits', {
  state: () => ({
    // All habits for the account
    habits: [],
    
    // Completions map: { habitId: [date1, date2, ...] }
    completions: {},
    
    // Track which habit grids are expanded to month view (local state only)
    // { habitId: true/false }
    expandedGrids: {},
    
    // Loading state
    loading: false,
    
    // Error state
    error: null,
    
    // Habit flyout state (migrated from app.js)
    // **Feature: app-js-cleanup**
    // _Requirements: 2.1, 2.2, 2.3, 2.4_
    habitFlyoutMemberId: '',
    editingHabit: null,
    habitForm: { name: '' },
    habitFormError: '',
    habitFormSubmitting: false
  }),
  
  getters: {
    /**
     * Get habits filtered by member ID
     * **Feature: habit-tracking**
     * **Validates: Requirements 2.1**
     * 
     * @returns {function(string): Array} Function that returns habits for a member
     */
    habitsByMember: (state) => {
      return (memberId) => state.habits.filter(h => h.memberId === memberId);
    },
    
    /**
     * Check if a habit is completed on a specific date
     * **Feature: habit-tracking**
     * **Validates: Requirements 4.4**
     * 
     * @returns {function(string, string): boolean} Function that checks completion
     */
    isCompleted: (state) => {
      return (habitId, date) => {
        const habitCompletions = state.completions[habitId];
        return habitCompletions ? habitCompletions.includes(date) : false;
      };
    },
    
    /**
     * Check if a habit's grid is expanded to month view
     * **Feature: habit-tracking**
     * 
     * @returns {function(string): boolean} Function that checks expansion state
     */
    isGridExpanded: (state) => {
      return (habitId) => state.expandedGrids[habitId] ?? false;
    },
    
    /**
     * Get total habit count
     */
    habitCount: (state) => state.habits.length,
    
    /**
     * Check if there are any habits
     */
    hasHabits: (state) => state.habits.length > 0
  },
  
  actions: {
    /**
     * Fetch all habits for the account from the API
     * **Feature: habit-tracking**
     * **Validates: Requirements 2.1**
     */
    async fetchHabits() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await window.apiService.get('/habits');
        
        this.habits = response.habits || [];
        this.completions = response.completions || {};
        
        console.log('[Habits] Loaded', this.habits.length, 'habits');
        return { success: true };
      } catch (error) {
        console.error('[Habits] Failed to fetch habits:', error);
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Create a new habit for a family member
     * **Feature: habit-tracking**
     * **Validates: Requirements 2.1**
     * 
     * @param {string} memberId - Family member ID
     * @param {string} name - Habit name
     * @returns {Promise<{success: boolean, habit?: object, error?: string}>}
     */
    async createHabit(memberId, name) {
      if (!memberId) {
        return { success: false, error: 'Member ID is required' };
      }
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return { success: false, error: 'Habit name is required' };
      }
      
      try {
        const response = await window.apiService.post('/habits', {
          memberId,
          name: name.trim()
        });
        
        if (response.habit) {
          this.habits.push(response.habit);
          // Initialize empty completions for the new habit
          this.completions[response.habit.id] = [];
          
          console.log('[Habits] Created habit:', response.habit.name);
          
          // Show success toast
          if (window.useUIStore) {
            const uiStore = window.useUIStore();
            uiStore.showSuccess(`Habit "${response.habit.name}" created`);
          }
          
          return { success: true, habit: response.habit };
        }
        
        return { success: false, error: 'Failed to create habit' };
      } catch (error) {
        console.error('[Habits] Failed to create habit:', error);
        
        // Show error toast
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(error.message || 'Failed to create habit');
        }
        
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Update an existing habit
     * **Feature: habit-tracking**
     * 
     * @param {string} habitId - Habit ID
     * @param {object} updates - Fields to update (e.g., { name: 'New Name' })
     * @returns {Promise<{success: boolean, habit?: object, error?: string}>}
     */
    async updateHabit(habitId, updates) {
      if (!habitId) {
        return { success: false, error: 'Habit ID is required' };
      }
      
      const habit = this.habits.find(h => h.id === habitId);
      if (!habit) {
        return { success: false, error: 'Habit not found' };
      }
      
      // Store original for rollback
      const originalHabit = { ...habit };
      
      // Optimistic update
      Object.assign(habit, updates);
      
      try {
        const response = await window.apiService.put(`/habits/${habitId}`, updates);
        
        if (response.habit) {
          // Update with server response
          const index = this.habits.findIndex(h => h.id === habitId);
          if (index !== -1) {
            this.habits[index] = response.habit;
          }
          
          console.log('[Habits] Updated habit:', habitId);
          
          // Show success toast
          if (window.useUIStore) {
            const uiStore = window.useUIStore();
            uiStore.showSuccess('Habit updated');
          }
          
          return { success: true, habit: response.habit };
        }
        
        return { success: false, error: 'Failed to update habit' };
      } catch (error) {
        // Rollback on error
        Object.assign(habit, originalHabit);
        
        console.error('[Habits] Failed to update habit:', error);
        
        // Show error toast
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(error.message || 'Failed to update habit');
        }
        
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Delete a habit and all its completions
     * **Feature: habit-tracking**
     * 
     * @param {string} habitId - Habit ID
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteHabit(habitId) {
      if (!habitId) {
        return { success: false, error: 'Habit ID is required' };
      }
      
      const habitIndex = this.habits.findIndex(h => h.id === habitId);
      if (habitIndex === -1) {
        return { success: false, error: 'Habit not found' };
      }
      
      // Store for rollback
      const deletedHabit = this.habits[habitIndex];
      const deletedCompletions = this.completions[habitId] || [];
      
      // Optimistic delete
      this.habits.splice(habitIndex, 1);
      delete this.completions[habitId];
      delete this.expandedGrids[habitId];
      
      try {
        await window.apiService.delete(`/habits/${habitId}`);
        
        console.log('[Habits] Deleted habit:', habitId);
        
        // Show success toast
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showSuccess(`Habit "${deletedHabit.name}" deleted`);
        }
        
        return { success: true };
      } catch (error) {
        // Rollback on error
        this.habits.splice(habitIndex, 0, deletedHabit);
        this.completions[habitId] = deletedCompletions;
        
        console.error('[Habits] Failed to delete habit:', error);
        
        // Show error toast
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(error.message || 'Failed to delete habit');
        }
        
        return { success: false, error: error.message };
      }
    },

    /**
     * Toggle completion status for a habit on a specific date
     * Uses optimistic updates with rollback on error
     * **Feature: habit-tracking**
     * **Validates: Requirements 4.4, 4.5**
     * 
     * @param {string} habitId - Habit ID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<{success: boolean, completed?: boolean, error?: string}>}
     */
    async toggleCompletion(habitId, date) {
      if (!habitId) {
        return { success: false, error: 'Habit ID is required' };
      }
      
      if (!date) {
        return { success: false, error: 'Date is required' };
      }
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return { success: false, error: 'Date must be in YYYY-MM-DD format' };
      }
      
      // Initialize completions array if needed
      if (!this.completions[habitId]) {
        this.completions[habitId] = [];
      }
      
      const completions = this.completions[habitId];
      const wasCompleted = completions.includes(date);
      
      // Optimistic update - provide immediate visual feedback
      // **Validates: Requirements 4.4**
      if (wasCompleted) {
        // Remove completion
        const index = completions.indexOf(date);
        completions.splice(index, 1);
      } else {
        // Add completion
        completions.push(date);
      }
      
      try {
        const response = await window.apiService.post(`/habits/${habitId}/toggle`, { date });
        
        // Server confirmed the toggle
        console.log('[Habits] Toggled completion:', habitId, date, 'completed:', response.completed);
        
        return { success: true, completed: response.completed };
      } catch (error) {
        // Rollback on error
        // **Validates: Requirements 4.5**
        if (wasCompleted) {
          // Restore the completion
          completions.push(date);
        } else {
          // Remove the completion we added
          const index = completions.indexOf(date);
          if (index !== -1) {
            completions.splice(index, 1);
          }
        }
        
        console.error('[Habits] Failed to toggle completion:', error);
        
        // Show error toast
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError(error.message || 'Failed to update habit');
        }
        
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Toggle the grid view between compact (7 days) and expanded (month) view
     * This is local state only - not persisted to server
     * **Feature: habit-tracking**
     * 
     * @param {string} habitId - Habit ID
     */
    toggleGridView(habitId) {
      if (!habitId) {
        return;
      }
      
      const currentState = this.expandedGrids[habitId] ?? false;
      this.expandedGrids[habitId] = !currentState;
      
      console.log('[Habits] Grid view toggled:', habitId, 'expanded:', !currentState);
    },
    
    /**
     * Set the grid view state for a habit
     * **Feature: habit-tracking**
     * 
     * @param {string} habitId - Habit ID
     * @param {boolean} expanded - Whether the grid should be expanded
     */
    setGridExpanded(habitId, expanded) {
      if (!habitId) {
        return;
      }
      
      this.expandedGrids[habitId] = expanded;
    },
    
    /**
     * Collapse all expanded grids
     * **Feature: habit-tracking**
     */
    collapseAllGrids() {
      this.expandedGrids = {};
    },
    
    /**
     * Clear all habits data (useful for logout)
     */
    clearHabits() {
      this.habits = [];
      this.completions = {};
      this.expandedGrids = {};
      this.loading = false;
      this.error = null;
    },
    
    /**
     * Get a habit by ID
     * 
     * @param {string} habitId - Habit ID
     * @returns {object|null} Habit object or null if not found
     */
    getHabitById(habitId) {
      return this.habits.find(h => h.id === habitId) || null;
    },
    
    // ============================================
    // HABIT FLYOUT ACTIONS (migrated from app.js)
    // **Feature: app-js-cleanup**
    // _Requirements: 2.5_
    // ============================================
    
    /**
     * Open the habit flyout for creating or editing a habit
     * 
     * @param {string} memberId - Family member ID
     * @param {object|null} habit - Habit to edit, or null for new habit
     */
    openHabitFlyout(memberId, habit = null) {
      this.habitFlyoutMemberId = memberId;
      this.editingHabit = habit;
      this.habitForm.name = habit ? habit.name : '';
      this.habitFormError = '';
      this.habitFormSubmitting = false;
      
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('habitFlyout');
      
      if (typeof CONFIG !== 'undefined' && CONFIG.ENV?.IS_DEVELOPMENT) {
        console.log('🎯 openHabitFlyout via habitsStore');
      }
    },
    
    /**
     * Close the habit flyout and reset form state
     */
    closeHabitFlyout() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('habitFlyout');
      
      this.habitFlyoutMemberId = '';
      this.editingHabit = null;
      this.habitForm.name = '';
      this.habitFormError = '';
      this.habitFormSubmitting = false;
    },
    
    /**
     * Submit the habit form (create or update)
     * 
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async submitHabitForm() {
      const trimmedName = this.habitForm.name.trim();
      if (!trimmedName) {
        this.habitFormError = 'Habit name is required';
        return { success: false, error: 'Habit name is required' };
      }
      
      this.habitFormSubmitting = true;
      this.habitFormError = '';
      
      let result;
      if (this.editingHabit) {
        result = await this.updateHabit(this.editingHabit.id, { name: trimmedName });
      } else {
        result = await this.createHabit(this.habitFlyoutMemberId, trimmedName);
      }
      
      this.habitFormSubmitting = false;
      
      if (result.success) {
        this.closeHabitFlyout();
      } else {
        this.habitFormError = result.error || 'Failed to save habit';
      }
      
      return result;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useHabitsStore = useHabitsStore;
}
