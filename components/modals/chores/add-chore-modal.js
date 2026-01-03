/**
 * Add Chore Modal Component
 * Encapsulated add chore flyout with inject-based state management
 * 
 * _Requirements: 4.1, 4.2, 4.3, 4.4_
 * - 4.1: Located at components/modals/chores/add-chore-modal.js
 * - 4.2: Access visibility state via injected prop (showAddChoreModal)
 * - 4.3: Access form data via injected prop (newChore)
 * - 4.4: Delegate actions to injected methods (addChore, cancelAddChore)
 */
const AddChoreModal = Vue.defineComponent({
  name: 'AddChoreModal',
  
  inject: ['showAddChoreModal', 'newChore', 'addChore', 'cancelAddChore'],
  
  methods: {
    /**
     * Handle add chore action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleAddChore() {
      this.addChore?.();
    },
    
    /**
     * Handle cancel action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleCancelAddChore() {
      this.cancelAddChore?.();
    }
  },

  template: `
    <!-- Add Chore Flyout -->
    <flyout-panel
      :open="showAddChoreModal"
      @close="handleCancelAddChore"
      title="Add New Chore"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newChore.name"
              type="text" 
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Amount ($)</label>
            <input 
              v-model.number="newChore.amount"
              type="number" 
              step="0.50"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            >
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newChore.isDetailed"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              >
              <span class="text-sm font-medium text-primary-custom">Requires details when created</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">If checked, you'll be prompted to add details for this chore</p>
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newChore.addToQuicklist"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              >
              <span class="text-sm font-medium text-primary-custom">Add to quicklist</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">Also add this chore to the quicklist for future use</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="handleAddChore"
            @touchend.prevent="handleAddChore"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            Add Chore
          </button>
          <button 
            @click="handleCancelAddChore"
            @touchend.prevent="handleCancelAddChore"
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
window.AddChoreModalComponent = AddChoreModal;
