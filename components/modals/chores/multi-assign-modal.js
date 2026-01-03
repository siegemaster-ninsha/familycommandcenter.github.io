/**
 * Multi-Assign Modal Component
 * Encapsulated multi-assignment flyout for quicklist chores
 * 
 * _Requirements: 11.1, 11.2, 11.3, 11.4_
 * - 11.1: Located at components/modals/chores/multi-assign-modal.js
 * - 11.2: Access visibility state via injected prop (showMultiAssignModal)
 * - 11.3: Access data via injected props (selectedQuicklistChore, multiAssignSelectedMembers, people)
 * - 11.4: Delegate actions to choresStore.toggleMemberSelection and injected methods
 */
const MultiAssignModal = Vue.defineComponent({
  name: 'MultiAssignModal',
  
  setup() {
    // Access choresStore for toggleMemberSelection
    const choresStore = window.useChoresStore?.();
    return { choresStore };
  },
  
  inject: [
    'showMultiAssignModal', 
    'selectedQuicklistChore', 
    'multiAssignSelectedMembers', 
    'people',
    'categoriesStore',
    'confirmMultiAssignment', 
    'cancelMultiAssignment'
  ],
  
  data() {
    return {
      multiAssignLoading: false
    };
  },
  
  methods: {
    /**
     * Handle confirm multi-assignment action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleConfirmMultiAssignment() {
      this.confirmMultiAssignment?.();
    },
    
    /**
     * Handle cancel action with touchend support
     * Wrapper method for Vue event modifiers
     */
    handleCancelMultiAssignment() {
      this.cancelMultiAssignment?.();
    },
    
    /**
     * Toggle member selection for multi-assignment
     * Delegates to choresStore
     * @param {string} personId - The person ID to toggle
     */
    toggleMemberSelection(personId) {
      this.choresStore?.toggleMemberSelection(personId);
    },
    
    /**
     * Update quicklist chore category from the flyout
     * @param {string} categoryId - The category ID to set
     */
    async updateQuicklistChoreCategory(categoryId) {
      if (!this.selectedQuicklistChore) return;
      
      const categoryName = categoryId 
        ? this.categoriesStore?.categories?.find(c => c.id === categoryId)?.name || ''
        : '';
      
      console.log('[OK] Updating quicklist chore category:', {
        choreId: this.selectedQuicklistChore.id,
        categoryId,
        categoryName
      });
      
      // Update local state immediately for responsive UI
      this.selectedQuicklistChore.categoryId = categoryId || null;
      this.selectedQuicklistChore.categoryName = categoryName;
      
      // Call store method to persist the change
      try {
        await this.choresStore?.updateQuicklistChore(this.selectedQuicklistChore.id, { 
          categoryId: categoryId || null, 
          categoryName: categoryName 
        });
      } catch (error) {
        console.error('Failed to update quicklist category:', error);
      }
    },
    
    /**
     * Handle category created inline in quicklist form
     * @param {Object} category - The newly created category
     */
    onQuicklistCategoryCreated(category) {
      console.log('[OK] Category created inline:', category.name);
    },
    
    /**
     * Get electronics status style object
     * @param {string} status - Electronics status
     * @returns {Object} Style object for the status badge
     */
    getElectronicsStatusStyle(status) {
      switch(status) {
        case 'allowed': 
          return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
        case 'restricted': 
          return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' };
        case 'blocked': 
          return { backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' };
        default: 
          return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
      }
    },
    
    /**
     * Get electronics status text
     * @param {string} status - Electronics status
     * @returns {string} Human-readable status text
     */
    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    }
  },

  template: `
    <!-- Multi-Assignment Flyout for Quicklist Chores -->
    <flyout-panel
      :open="showMultiAssignModal"
      @close="handleCancelMultiAssignment"
      :show-footer="true"
      :show-header-close="false"
      width="500px"
    >
      <template #title>
        <h2 class="text-lg font-bold text-primary-custom">Assign "{{ selectedQuicklistChore?.name }}"</h2>
      </template>
      <template #default>
        <!-- Category Selector for Quicklist Chore -->
        <div class="mb-4 p-3 rounded-lg" style="background: var(--color-surface-2); border: 1px solid var(--color-border-card);">
          <category-selector
            :model-value="selectedQuicklistChore?.categoryId || ''"
            :categories="categoriesStore?.categories || []"
            label="Category"
            @update:model-value="updateQuicklistChoreCategory"
            @category-created="onQuicklistCategoryCreated"
          ></category-selector>
        </div>

        <p class="text-secondary-custom mb-4">
          Select which family members should be assigned this chore.
        </p>

        <!-- Family Member Cards -->
        <div class="space-y-3 mb-4">
          <div
            v-for="person in people"
            :key="person.id"
            class="relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
            :style="multiAssignSelectedMembers.includes(person.id) 
              ? { borderColor: 'var(--color-primary-500)', background: 'var(--color-primary-50)' } 
              : { borderColor: 'var(--color-border-card)', background: 'var(--color-surface-1)' }"
            @click="toggleMemberSelection(person.id)"
          >
            <div class="flex items-center gap-3">
              <!-- Checkbox -->
              <input
                type="checkbox"
                :checked="multiAssignSelectedMembers.includes(person.id)"
                @click.stop="toggleMemberSelection(person.id)"
                class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              >

              <!-- Person Info -->
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background: linear-gradient(to bottom right, var(--color-primary-500), var(--color-primary-600));">
                  {{ (person.displayName || person.name || '').charAt(0) }}
                </div>
                <div>
                  <h4 class="font-medium" style="color: var(--color-text-primary);">{{ person.displayName || person.name || '' }}</h4>
                  <p class="text-sm" style="color: var(--color-text-secondary);">\${{ person.earnings?.toFixed(2) || '0.00' }} earned</p>
                </div>
              </div>

              <!-- Electronics Status -->
              <div class="shrink-0">
                <div :style="getElectronicsStatusStyle(person.electronicsStatus?.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getElectronicsStatusText(person.electronicsStatus?.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Count -->
        <div v-if="multiAssignSelectedMembers.length > 0" class="p-3 rounded-lg" style="background: var(--color-primary-50);">
          <p class="text-sm" style="color: var(--color-primary-700);">
            <span class="font-medium">{{ multiAssignSelectedMembers.length }}</span> member{{ multiAssignSelectedMembers.length !== 1 ? 's' : '' }} selected
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button
            @click="handleConfirmMultiAssignment"
            @touchend.prevent="handleConfirmMultiAssignment"
            :disabled="multiAssignSelectedMembers.length === 0 || multiAssignLoading"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="multiAssignLoading" class="animate-spin h-4 w-4" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ multiAssignLoading ? 'Assigning...' : 'Assign to ' + multiAssignSelectedMembers.length + ' Member' + (multiAssignSelectedMembers.length !== 1 ? 's' : '') }}
          </button>
          <button
            @click="handleCancelMultiAssignment"
            @touchend.prevent="handleCancelMultiAssignment"
            :disabled="multiAssignLoading"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>
  `
});

// Export component for CDN-based registration
window.MultiAssignModalComponent = MultiAssignModal;
