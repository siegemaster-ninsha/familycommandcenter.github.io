// Quicklist Section Component
const QuicklistSection = Vue.defineComponent({
  template: `
    <div class="mb-6 sm:mb-8">
      <h2 class="text-[#0d0f1c] text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] px-2 sm:px-4 pb-3 pt-5">⚡ Quicklist</h2>
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg mx-2 sm:mx-4 p-3 sm:p-4">
        <p class="text-[#47569e] text-sm mb-4 sm:mb-3 text-center px-2">Select these common chores to assign them quickly</p>
        
        <div class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 justify-center">
          <div 
            v-for="quickChore in quicklistChores" 
            :key="quickChore.id"
            :class="getQuicklistChoreClasses(quickChore)"
            @click="selectQuicklistChore(quickChore)"
          >
            <!-- Remove button -->
            <button
              @click.stop="removeFromQuicklist(quickChore.id)"
              class="absolute -top-1 -right-1 btn-error rounded-full w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-opacity duration-200"
              title="Remove from quicklist"
            >
              ×
            </button>
            
            <div
              class="flex items-center justify-center rounded-lg bg-purple-100 shrink-0 size-10 sm:size-8 text-purple-600"
              v-html="getCategoryIcon(quickChore.category)"
            >
            </div>
            <div class="flex flex-col flex-1 min-w-0">
              <p class="text-[#0d0f1c] text-sm font-medium leading-tight line-clamp-2 sm:line-clamp-1">{{ quickChore.name }}</p>
              <p v-if="quickChore.amount > 0" class="text-[#47569e] text-xs">\${{ quickChore.amount.toFixed(2) }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 shrink-0 self-start sm:self-center">
              {{ getCategoryLabel(quickChore.category) }}
            </span>
          </div>
          
          <!-- Add to Quicklist button -->
          <div class="flex items-center justify-center mt-2 sm:mt-0">
            <button
              @click="$parent.showAddToQuicklistModal = true"
              class="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 text-purple-700 px-4 py-3 sm:px-3 sm:py-2 rounded-lg border-2 border-dashed border-purple-300 transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center"
              title="Add new chore to quicklist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              <span class="text-sm font-medium">Add to Quicklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: ['quicklistChores', 'showAddToQuicklistModal', 'handleQuicklistChoreClick', 'openAddToQuicklistModal'],
  methods: {
    getQuicklistChoreClasses(quickChore) {
      const baseClasses = "relative group flex items-center gap-3 sm:gap-2 bg-white px-4 py-4 sm:px-3 sm:py-2 rounded-lg shadow-sm cursor-pointer border-l-4 border-purple-500 transition-all duration-200 touch-target min-h-[68px] sm:min-h-[56px]";
      const selected = window.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, quickChore) || false;
      const selectedClasses = selected ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-105 active:scale-95";
      return `${baseClasses} ${selectedClasses}`;
    },
    
    getCategoryIcon(category) {
      return window.Helpers?.getCategoryIcon?.(category) || '';
    },
    
    getCategoryLabel(category) {
      return window.Helpers?.getCategoryLabel?.(category) || '';
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
        this.$parent.showSuccessMessage(`❌ Failed to remove item from quicklist. Please try again.`);
      }
    }
  }
});

// Export component for manual registration
window.QuicklistSectionComponent = QuicklistSection; 