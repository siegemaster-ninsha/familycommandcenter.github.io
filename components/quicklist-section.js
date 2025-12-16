// Quicklist Section Component
const QuicklistSection = Vue.defineComponent({
  name: 'QuicklistSection',
  template: `
    <div class="mb-6 sm:mb-8">
      <h2 class="text-primary-custom text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] px-2 sm:px-4 pb-3 pt-5 flex items-center gap-2">
        <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-primary-custom')"></div>
        Quicklist
      </h2>
      <div class="rounded-lg mx-2 sm:mx-4 p-3 sm:p-4 border-2 border-dashed" :style="{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-card)' }">
        <p class="text-secondary-custom text-sm mb-4 sm:mb-3 text-center px-2">Select these common chores to assign them quickly</p>
        
        <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 justify-center">
          <div 
            v-for="quickChore in quicklistChores" 
            :key="quickChore.id"
            :class="getQuicklistChoreClasses(quickChore)"
            @click="selectQuicklistChore(quickChore)"
          >
            <div class="flex items-center gap-3 sm:gap-2 flex-1 min-w-0">
              <!-- Remove button (integrated when selected) -->
              <button
                v-if="Helpers?.isChoreSelected?.($parent?.selectedChoreId, $parent?.selectedQuicklistChore, quickChore)"
                @click.stop="removeFromQuicklist(quickChore.id)"
                class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);"
                :class="'hover:scale-105 active:scale-95'"
                title="Remove from quicklist"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-red-600 drop-shadow-sm')"></div>
              </button>

              <div
                class="flex items-center justify-center rounded-lg shrink-0 size-10 sm:size-8"
                :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }"
                v-html="getCategoryIcon(quickChore.category)"
              >
              </div>
              <div class="flex flex-col flex-1 min-w-0">
              <p class="text-primary-custom text-sm font-medium leading-tight line-clamp-2 sm:line-clamp-1">{{ quickChore.name }}</p>
              <p v-if="quickChore.amount > 0" class="text-secondary-custom text-xs">\${{ quickChore.amount.toFixed(2) }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full shrink-0 self-start sm:self-center" :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-800)' }">
              {{ getCategoryLabel(quickChore.category) }}
            </span>
          </div>
          
          <!-- Add to Quicklist button -->
          <div class="flex items-center justify-center mt-2 sm:mt-0">
            <button
              @click="$parent.showAddToQuicklistModal = true"
              class="flex items-center gap-2 px-4 py-3 sm:px-3 sm:py-2 rounded-lg border-2 border-dashed transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center"
              :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderColor: 'var(--color-primary-300)' }"
              title="Add new chore to quicklist"
            >
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
              <span class="text-sm font-medium">Add to Quicklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: ['quicklistChores', 'showAddToQuicklistModal', 'handleQuicklistChoreClick', 'openAddToQuicklistModal', 'Helpers'],
  methods: {
    getQuicklistChoreClasses(quickChore) {
      const baseClasses = "relative group flex items-center gap-3 sm:gap-2 bg-white px-4 py-4 sm:px-3 sm:py-2 rounded-lg shadow-sm cursor-pointer border-l-4 border-primary-500 transition-all duration-200 touch-target min-h-[68px] sm:min-h-[56px]";
      const selected = this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, quickChore) || false;
      const selectedClasses = selected ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-105 active:scale-95";
      return `${baseClasses} ${selectedClasses}`;
    },
    
    getCategoryIcon(category) {
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },
    
    selectQuicklistChore(quickChore) {
      const handler = this.handleQuicklistChoreClick || this.$parent?.handleQuicklistChoreClick;
      if (typeof handler === 'function') {
        handler(quickChore);
      } else {
        console.warn('handleQuicklistChoreClick not available');
      }
      console.log('Quicklist chore selected:', quickChore.name);
    },
    
    async removeFromQuicklist(quicklistId) {
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.$parent.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
        // Show user-friendly error message
        this.$parent.showSuccessMessage(`Failed to remove item from quicklist. Please try again.`);
      }
    }
  }
});

// Export component for manual registration
window.QuicklistSectionComponent = QuicklistSection; 
