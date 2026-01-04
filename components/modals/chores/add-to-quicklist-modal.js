/**
 * Add to Quicklist Modal Component
 * Encapsulated add to quicklist flyout with store-based state management
 * 
 * _Requirements: 6.1, 6.2, 6.3, 6.4_
 * - 6.1: Located at components/modals/chores/add-to-quicklist-modal.js
 * - 6.2: Access visibility state via UI store
 * - 6.3: Access form data via local state and categories store
 * - 6.4: Use chores store addToQuicklist method
 */
const AddToQuicklistModal = Vue.defineComponent({
  name: 'AddToQuicklistModal',
  
  setup() {
    const choresStore = window.useChoresStore();
    const uiStore = window.useUIStore();
    const categoriesStore = window.useCategoriesStore?.() || null;
    return { choresStore, uiStore, categoriesStore };
  },
  
  data() {
    return {
      newQuicklistChore: {
        name: '',
        amount: 0,
        categoryId: '',
        isDetailed: false,
        defaultDetails: ''
      },
      isSubmitting: false
    };
  },
  
  computed: {
    isOpen() {
      return this.uiStore?.modals?.addToQuicklist?.isOpen || false;
    },
    
    categories() {
      return this.categoriesStore?.categories || [];
    }
  },
  
  methods: {
    /**
     * Handle add to quicklist action
     */
    async handleAddToQuicklist() {
      if (this.isSubmitting) return;
      if (!this.newQuicklistChore.name.trim()) return;
      
      this.isSubmitting = true;
      
      try {
        const quicklistData = {
          name: this.newQuicklistChore.name.trim(),
          amount: this.newQuicklistChore.amount || 0,
          categoryId: this.newQuicklistChore.categoryId || '',
          isDetailed: this.newQuicklistChore.isDetailed || false,
          defaultDetails: this.newQuicklistChore.defaultDetails || ''
        };
        
        // Use chores store to add to quicklist
        const result = await this.choresStore.addToQuicklist(quicklistData);
        
        if (result?.success !== false) {
          this.uiStore?.showSuccess?.(`Added to quicklist: ${quicklistData.name}`);
        } else {
          this.uiStore?.showError?.(result?.error || 'Failed to add to quicklist');
        }
        
        this.handleClose();
      } catch (error) {
        console.error('Failed to add to quicklist:', error);
        this.uiStore?.showError?.('Failed to add to quicklist');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    /**
     * Handle close/cancel action
     */
    handleClose() {
      this.uiStore?.closeModal('addToQuicklist');
      this.resetForm();
    },
    
    /**
     * Reset form to initial state
     */
    resetForm() {
      this.newQuicklistChore = {
        name: '',
        amount: 0,
        categoryId: '',
        isDetailed: false,
        defaultDetails: ''
      };
    },
    
    /**
     * Handle category created inline in quicklist form
     * @param {Object} category - The newly created category
     */
    onQuicklistCategoryCreated(category) {
      console.log('[OK] Category created inline:', category.name);
      this.newQuicklistChore.categoryId = category.id;
    }
  },

  template: `
    <!-- Add to Quicklist Flyout -->
    <flyout-panel
      :open="isOpen"
      @close="handleClose"
      title="Add to Quicklist"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newQuicklistChore.name"
              type="text" 
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Amount ($)</label>
            <input 
              v-model.number="newQuicklistChore.amount"
              type="number" 
              step="0.25"
              min="0"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="0.00"
            >
          </div>
          <!-- Category Selector -->
          <category-selector
            v-if="categoriesStore"
            v-model="newQuicklistChore.categoryId"
            :categories="categories"
            label="Category"
            @category-created="onQuicklistCategoryCreated"
          ></category-selector>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newQuicklistChore.isDetailed"
                class="w-4 h-4 rounded"
                style="color: var(--color-primary-600)"
              >
              <span class="text-sm font-medium text-primary-custom">Requires details when assigned</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">If checked, a details prompt will appear when this chore is assigned</p>
          </div>
          
          <!-- Optional Default Details Section -->
          <div v-if="newQuicklistChore.isDetailed" class="pt-2">
            <label class="block text-sm font-medium text-primary-custom mb-1">Default Details (Optional)</label>
            <textarea 
              v-model="newQuicklistChore.defaultDetails"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
              style="border-color: var(--color-border-card)"
              rows="3"
              placeholder="Add default instructions or notes that will pre-fill when assigning..."
            ></textarea>
            <p class="text-xs text-secondary-custom mt-1">These details will be pre-filled when assigning, but can be edited</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click.stop="handleAddToQuicklist"
            :disabled="isSubmitting || !newQuicklistChore.name.trim()"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            {{ isSubmitting ? 'Adding...' : 'Add to Quicklist' }}
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
window.AddToQuicklistModalComponent = AddToQuicklistModal;
