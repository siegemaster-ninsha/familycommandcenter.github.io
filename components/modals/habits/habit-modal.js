// Habit Modal Component
// _Requirements: 6.4, 12.1, 12.2, 12.3, 12.4_
// **Feature: habit-tracking, app-js-cleanup**
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
const HabitModal = Vue.defineComponent({
  name: 'HabitModal',
  
  setup() {
    // Use habitsStore directly instead of inject
    // **Feature: app-js-cleanup**
    // _Requirements: 2.5, 2.6, 6.4_
    const habitsStore = window.useHabitsStore?.();
    const uiStore = window.useUIStore?.();
    
    return {
      habitsStore,
      uiStore
    };
  },
  
  computed: {
    // Computed properties that delegate to habitsStore
    // _Requirements: 2.1, 2.2, 2.3, 2.4_
    showHabitFlyout() {
      return this.uiStore?.isModalOpen?.('habitFlyout') || false;
    },
    editingHabit() {
      return this.habitsStore?.editingHabit || null;
    },
    habitForm() {
      return this.habitsStore?.habitForm || { name: '' };
    },
    habitFormError() {
      return this.habitsStore?.habitFormError || '';
    },
    habitFormSubmitting() {
      return this.habitsStore?.habitFormSubmitting || false;
    }
  },
  
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
    // Methods delegating to habitsStore
    // **Feature: app-js-cleanup**
    // _Requirements: 2.5, 2.6_
    
    /**
     * Close the habit flyout
     */
    closeHabitFlyout() {
      if (this.habitsStore?.closeHabitFlyout) {
        this.habitsStore.closeHabitFlyout();
      }
    },
    
    /**
     * Submit the habit form
     */
    submitHabitForm() {
      if (this.habitsStore?.submitHabitForm) {
        this.habitsStore.submitHabitForm();
      }
    }
  }
});

// Export for CDN-based registration
// _Requirements: 16.3_
window.HabitModalComponent = HabitModal;
