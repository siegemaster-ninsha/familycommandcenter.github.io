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
      :show-header-close="false"
      width="400px"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Habit Name</label>
            <input
              ref="nameInput"
              v-model="name"
              @keydown.enter="handleSubmit"
              @input="clearError"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="e.g., Read 30 minutes"
              maxlength="100"
            />
            <p class="text-xs text-secondary-custom mt-1">{{ name.length }}/100 characters</p>
          </div>
          <div v-if="validationError" class="rounded-lg p-3" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
            <p class="text-sm" style="color: var(--color-error-700);">{{ validationError }}</p>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="handleSubmit"
            @touchend.prevent="handleSubmit"
            :disabled="isSubmitting"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Save' : 'Create Habit') }}
          </button>
          <button 
            @click="handleClose"
            @touchend.prevent="handleClose"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  data() {
    return {
      name: '',
      validationError: '',
      isSubmitting: false
    };
  },
  
  computed: {
    isEditMode() {
      return this.habit !== null && this.habit !== undefined;
    },
    
    effectiveMemberId() {
      return this.isEditMode ? this.habit.memberId : this.memberId;
    }
  },
  
  watch: {
    open: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          // Initialize form based on mode
          if (this.isEditMode) {
            this.name = this.habit.name || '';
          } else {
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
    
    habit: {
      handler(newHabit) {
        if (this.open && newHabit) {
          this.name = newHabit.name || '';
        }
      }
    }
  },
  
  methods: {
    handleClose() {
      this.$emit('close');
    },
    
    clearError() {
      if (this.validationError) {
        this.validationError = '';
      }
    },
    
    validate() {
      const trimmedName = this.name.trim();
      
      if (!trimmedName) {
        this.validationError = 'Habit name is required';
        return false;
      }
      
      return true;
    },
    
    async handleSubmit() {
      if (this.isSubmitting) {
        return;
      }
      
      if (!this.validate()) {
        if (this.$refs.nameInput) {
          this.$refs.nameInput.focus();
        }
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        this.$emit('save', {
          name: this.name.trim(),
          memberId: this.effectiveMemberId,
          habitId: this.isEditMode ? this.habit.id : null,
          isEdit: this.isEditMode
        });
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
