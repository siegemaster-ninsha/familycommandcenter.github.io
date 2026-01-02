// Habit Flyout Component
// Flyout panel for creating and editing habits
// Uses the existing flyout-panel component
// **Feature: habit-tracking**
// **Validates: Requirements 1.1, 1.2, 5.1, 5.5**

const HabitFlyout = Vue.defineComponent({
  name: 'HabitFlyout',
  
  props: {
    // Whether the flyout is open
    open: {
      type: Boolean,
      default: false
    },
    // Habit object for edit mode (null for create mode)
    // { id, name, memberId }
    habit: {
      type: Object,
      default: null
    },
    // Member ID for creating new habits
    memberId: {
      type: String,
      default: ''
    }
  },
  
  emits: ['close', 'save'],
  
  template: `
    <flyout-panel
      :open="open"
      @close="handleClose"
      :title="isEditMode ? 'Edit Habit' : 'New Habit'"
      :show-footer="true"
      width="400px"
    >
      <template #default>
        <!-- **Validates: Requirements 1.1, 1.2, 5.1** -->
        <div class="habit-flyout-content">
          <label class="habit-flyout-label" for="habit-name-input">
            Habit Name
          </label>
          <input
            id="habit-name-input"
            ref="nameInput"
            v-model="name"
            @keydown.enter="handleSubmit"
            @input="clearError"
            type="text"
            class="habit-flyout-input"
            :class="{ 'habit-flyout-input--error': validationError }"
            placeholder="e.g., Read 30 minutes"
            maxlength="100"
            aria-describedby="habit-hint habit-error"
          />
          <p id="habit-hint" class="habit-flyout-hint">
            {{ name.length }}/100 characters
          </p>
          <!-- **Validates: Requirements 1.4** - Validation error display -->
          <p 
            v-if="validationError" 
            id="habit-error" 
            class="habit-flyout-error" 
            role="alert"
          >
            {{ validationError }}
          </p>
        </div>
      </template>
      
      <template #footer>
        <!-- **Validates: Requirements 5.5** - Theme-aware styling -->
        <div class="habit-flyout-footer">
          <button 
            @click="handleClose" 
            class="btn-secondary btn-compact"
            type="button"
          >
            Cancel
          </button>
          <button 
            @click="handleSubmit"
            :disabled="isSubmitting"
            class="btn-primary btn-compact"
            type="button"
          >
            <span v-if="isSubmitting" class="habit-flyout-spinner"></span>
            <span v-else>{{ isEditMode ? 'Save' : 'Create' }}</span>
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  data() {
    return {
      // Form state
      name: '',
      validationError: '',
      isSubmitting: false
    };
  },
  
  computed: {
    /**
     * Check if we're in edit mode (habit prop provided)
     * @returns {boolean}
     */
    isEditMode() {
      return this.habit !== null && this.habit !== undefined;
    },
    
    /**
     * Get the effective member ID (from habit in edit mode, or prop in create mode)
     * @returns {string}
     */
    effectiveMemberId() {
      return this.isEditMode ? this.habit.memberId : this.memberId;
    }
  },
  
  watch: {
    /**
     * When flyout opens, initialize form state
     * **Validates: Requirements 1.2, 5.1**
     */
    open: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          // Initialize form based on mode
          if (this.isEditMode) {
            // Edit mode: pre-fill with existing habit name
            // **Validates: Requirements 5.1**
            this.name = this.habit.name || '';
          } else {
            // Create mode: empty form
            // **Validates: Requirements 1.2**
            this.name = '';
          }
          
          // Clear any previous errors
          this.validationError = '';
          this.isSubmitting = false;
          
          // Focus the input after flyout animation
          this.$nextTick(() => {
            setTimeout(() => {
              if (this.$refs.nameInput) {
                this.$refs.nameInput.focus();
              }
            }, 100);
          });
        }
      }
    },
    
    /**
     * Update form when habit prop changes (for edit mode)
     */
    habit: {
      handler(newHabit) {
        if (this.open && newHabit) {
          this.name = newHabit.name || '';
        }
      }
    }
  },
  
  methods: {
    /**
     * Handle close request
     */
    handleClose() {
      this.$emit('close');
    },
    
    /**
     * Clear validation error when user types
     */
    clearError() {
      if (this.validationError) {
        this.validationError = '';
      }
    },
    
    /**
     * Validate the form
     * **Validates: Requirements 1.4**
     * @returns {boolean} True if valid
     */
    validate() {
      const trimmedName = this.name.trim();
      
      // Check for empty name
      if (!trimmedName) {
        this.validationError = 'Habit name is required';
        return false;
      }
      
      // Check for whitespace-only name
      if (trimmedName.length === 0) {
        this.validationError = 'Habit name cannot be empty';
        return false;
      }
      
      return true;
    },
    
    /**
     * Handle form submission
     * **Validates: Requirements 1.3, 5.2**
     */
    async handleSubmit() {
      // Prevent double submission
      if (this.isSubmitting) {
        return;
      }
      
      // Validate form
      if (!this.validate()) {
        // Focus input on validation error
        if (this.$refs.nameInput) {
          this.$refs.nameInput.focus();
        }
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        // Emit save event with form data
        // Parent component handles the actual API call
        this.$emit('save', {
          name: this.name.trim(),
          memberId: this.effectiveMemberId,
          habitId: this.isEditMode ? this.habit.id : null,
          isEdit: this.isEditMode
        });
        
        // Note: Parent component should close the flyout on success
        // We don't close here to allow for error handling
      } catch (error) {
        console.error('[HabitFlyout] Submit error:', error);
        this.validationError = error.message || 'An error occurred';
      } finally {
        this.isSubmitting = false;
      }
    }
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.HabitFlyout = HabitFlyout;
}
