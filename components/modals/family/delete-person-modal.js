// Delete Person Modal Component
// _Requirements: 9.1, 9.2, 9.3, 9.4_
// Encapsulated modal for confirming family member deletion
const DeletePersonModal = Vue.defineComponent({
  name: 'DeletePersonModal',
  
  // Inject props from parent (preserves existing contracts)
  inject: ['showDeletePersonModal', 'personToDelete', 'executeDeletePerson', 'cancelDeletePerson'],
  
  methods: {
    /**
     * Execute delete - delegates to injected method
     * _Requirements: 9.4_
     */
    handleDelete() {
      this.executeDeletePerson?.();
    },
    
    /**
     * Handle cancel - delegates to injected method
     * _Requirements: 9.4_
     */
    handleCancel() {
      this.cancelDeletePerson?.();
    }
  },
  
  template: `
    <!-- Delete Person Confirmation Modal -->
    <!-- _Requirements: 9.1, 9.2, 9.3, 9.4_ -->
    <div v-if="showDeletePersonModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-error-50);">
            <div v-html="Helpers.IconLibrary.getIcon('user', 'lucide', 24, '')" style="color: var(--color-error-700);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Remove Family Member</h3>
        </div>
        <p class="text-secondary-custom mb-6">
          Are you sure you want to remove "<span class="font-medium text-primary-custom">{{ personToDelete?.displayName || personToDelete?.name || '' }}</span>" from the family? 
          All their assigned chores will be moved to unassigned. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button 
            @click="handleDelete"
            class="flex-1 btn-error"
          >
            Remove Person
          </button>
          <button 
            @click="handleCancel"
            class="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.DeletePersonModalComponent = DeletePersonModal;
