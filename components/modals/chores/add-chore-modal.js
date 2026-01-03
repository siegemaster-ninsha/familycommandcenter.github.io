/**
 * Add Chore Modal Component
 * Encapsulated add chore flyout with store-based state management
 * 
 * _Requirements: 4.1, 4.2, 4.3, 4.4_
 * - 4.1: Located at components/modals/chores/add-chore-modal.js
 * - 4.2: Access visibility state via UI store
 * - 4.3: Access form data via chores store
 * - 4.4: Use chores store createChore method
 */
const AddChoreModal = Vue.defineComponent({
  name: 'AddChoreModal',
  
  setup() {
    const choresStore = window.useChoresStore();
    const uiStore = window.useUIStore();
    return { choresStore, uiStore };
  },
  
  data() {
    return {
      newChore: {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      },
      isSubmitting: false
    };
  },
  
  computed: {
    isOpen() {
      return this.uiStore?.modals?.addChore?.isOpen || false;
    }
  },
  
  methods: {
    /**
     * Handle add chore action
     * Creates chore via store and optionally adds to quicklist
     */
    async handleAddChore() {
      if (this.isSubmitting) return;
      if (!this.newChore.name.trim()) return;
      
      this.isSubmitting = true;
      
      try {
        const choreData = {
          name: this.newChore.name.trim(),
          amount: this.newChore.amount || 0,
          category: this.newChore.category || 'regular',
          isDetailed: this.newChore.isDetailed || false
        };
        
        // If detailed chore, emit event to show details modal instead
        if (this.newChore.isDetailed) {
          this.$emit('show-details-modal', choreData, 'unassigned', this.newChore.addToQuicklist);
          this.handleClose();
          return;
        }
        
        // Create the chore via store
        const result = await this.choresStore.createChore(choreData);
        
        if (result.success) {
          // Also add to quicklist if checkbox was checked
          if (this.newChore.addToQuicklist) {
            await this.addToQuicklist(choreData);
          }
          
          this.uiStore?.showSuccess(`Added: ${choreData.name}`);
        } else {
          this.uiStore?.showError(result.error || 'Failed to create chore');
        }
        
        this.handleClose();
      } catch (error) {
        console.error('Failed to add chore:', error);
        this.uiStore?.showError('Failed to create chore');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    /**
     * Add chore to quicklist
     */
    async addToQuicklist(choreData) {
      try {
        const api = window.useApi();
        await api.post(CONFIG.API.ENDPOINTS.QUICKLIST, {
          name: choreData.name,
          amount: choreData.amount,
          category: choreData.category,
          isDetailed: choreData.isDetailed
        });
      } catch (error) {
        console.error('Failed to add to quicklist:', error);
        // Don't fail the whole operation if quicklist add fails
      }
    },
    
    /**
     * Handle close/cancel action
     */
    handleClose() {
      this.uiStore?.closeModal('addChore');
      this.resetForm();
    },
    
    /**
     * Reset form to initial state
     */
    resetForm() {
      this.newChore = {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      };
    }
  },

  template: `
    <!-- Add Chore Flyout -->
    <flyout-panel
      :open="isOpen"
      @close="handleClose"
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
            @click.stop="handleAddChore"
            :disabled="isSubmitting || !newChore.name.trim()"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            {{ isSubmitting ? 'Adding...' : 'Add Chore' }}
          </button>
          <button 
            @click.stop="handleClose"
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
