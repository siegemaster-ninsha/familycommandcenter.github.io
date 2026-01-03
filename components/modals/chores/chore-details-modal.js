/**
 * Chore Details Modal Component
 * Encapsulated chore details flyout with inject-based state management
 * 
 * _Requirements: 5.1, 5.2, 5.3, 5.4_
 * - 5.1: Located at components/modals/chores/chore-details-modal.js
 * - 5.2: Access visibility state via injected prop (showChoreDetailsModal)
 * - 5.3: Access form data via injected prop (choreDetailsForm)
 * - 5.4: Delegate actions to injected methods (confirmChoreDetails, cancelChoreDetails)
 */
const ChoreDetailsModal = Vue.defineComponent({
  name: 'ChoreDetailsModal',
  
  inject: ['showChoreDetailsModal', 'choreDetailsForm', 'confirmChoreDetails', 'cancelChoreDetails'],
  
  methods: {
    /**
     * Handle confirm action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleConfirmChoreDetails() {
      this.confirmChoreDetails?.();
    },
    
    /**
     * Handle cancel action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleCancelChoreDetails() {
      this.cancelChoreDetails?.();
    },
    
    /**
     * Get human-readable category label
     * @param {string} category - Category identifier
     * @returns {string} Human-readable label
     */
    getCategoryLabel(category) {
      switch(category) {
        case 'school': return 'School';
        case 'game': return 'Electronics';
        default: return 'Regular';
      }
    }
  },

  template: `
    <!-- Chore Details Flyout -->
    <flyout-panel
      :open="showChoreDetailsModal"
      @close="handleCancelChoreDetails"
      title="Add Chore Details"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="mb-4">
          <div class="rounded-lg p-3" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
            <p class="font-medium" style="color: var(--color-primary-700);">{{ choreDetailsForm.name }}</p>
            <div class="flex items-center gap-4 text-sm mt-1" style="color: var(--color-primary-600);">
              <span>\${{ choreDetailsForm.amount.toFixed(2) }}</span>
              <span>{{ getCategoryLabel(choreDetailsForm.category) }}</span>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Details</label>
            <textarea 
              v-model="choreDetailsForm.details"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
              rows="6"
              placeholder="Add any specific instructions, requirements, or notes for this chore..."
            ></textarea>
            <p class="text-xs text-secondary-custom mt-1">Optional: Add specific details about how to complete this chore</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="handleConfirmChoreDetails"
            @touchend.prevent="handleConfirmChoreDetails"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            Create Chore
          </button>
          <button 
            @click="handleCancelChoreDetails"
            @touchend.prevent="handleCancelChoreDetails"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>
  `
});

// Export component for CDN-based registration
window.ChoreDetailsModalComponent = ChoreDetailsModal;
