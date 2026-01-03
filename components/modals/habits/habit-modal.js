// Habit Modal Component
// _Requirements: 12.1, 12.2, 12.3, 12.4_
// **Feature: habit-tracking**
const HabitModal = Vue.defineComponent({
  name: 'HabitModal',
  
  // Inject props from parent (preserves existing contracts)
  // _Requirements: 12.2, 12.3_
  inject: [
    'showHabitFlyout',
    'editingHabit',
    'habitForm',
    'habitFormError',
    'habitFormSubmitting'
  ],
  
  template: `
    <!-- Habit Flyout for create/edit -->
    <!-- _Requirements: 12.1, 12.2, 12.3, 12.4_ -->
    <!-- **Feature: habit-tracking** -->
    <flyout-panel
      :open="showHabitFlyout"
      @close="closeHabitFlyout"
      :title="editingHabit ? 'Edit Habit' : 'New Habit'"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Habit Name</label>
            <input
              v-model="habitForm.name"
              @keydown.enter="submitHabitForm"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="e.g., Read 30 minutes"
              maxlength="100"
            />
            <p class="text-xs text-secondary-custom mt-1">{{ habitForm.name.length }}/100 characters</p>
          </div>
          <div v-if="habitFormError" class="rounded-lg p-3" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
            <p class="text-sm" style="color: var(--color-error-700);">{{ habitFormError }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="submitHabitForm"
            @touchend.prevent="submitHabitForm"
            :disabled="habitFormSubmitting"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            {{ habitFormSubmitting ? 'Saving...' : (editingHabit ? 'Save' : 'Create Habit') }}
          </button>
          <button 
            @click="closeHabitFlyout"
            @touchend.prevent="closeHabitFlyout"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  methods: {
    // Methods delegating to $root
    // _Requirements: 12.4_
    
    /**
     * Close the habit flyout
     */
    closeHabitFlyout() {
      if (this.$root?.closeHabitFlyout) {
        this.$root.closeHabitFlyout();
      }
    },
    
    /**
     * Submit the habit form
     */
    submitHabitForm() {
      if (this.$root?.submitHabitForm) {
        this.$root.submitHabitForm();
      }
    }
  }
});

// Export for CDN-based registration
// _Requirements: 16.3_
window.HabitModalComponent = HabitModal;
