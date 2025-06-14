// Quicklist Section Component
const { defineComponent } = Vue;

const QuicklistSection = defineComponent({
  template: `
    <div class="mb-8">
      <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">⚡ Quicklist</h2>
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg mx-4 p-4">
        <p class="text-[#47569e] text-sm mb-3 text-center">Drag these common chores to assign them quickly</p>
        
        <div class="flex flex-wrap gap-2 justify-center">
          <div 
            v-for="quickChore in quicklistChores" 
            :key="quickChore.id"
            :class="getQuicklistChoreClasses(quickChore)"
            draggable="true"
            @dragstart="handleQuicklistDragStart($event, quickChore)"
            @click="selectQuicklistChore(quickChore)"
          >
            <!-- Remove button -->
            <button
              @click.stop="removeFromQuicklist(quickChore.id)"
              class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              title="Remove from quicklist"
            >
              ×
            </button>
            
            <div
              class="flex items-center justify-center rounded-lg bg-purple-100 shrink-0 size-8 text-purple-600"
              v-html="getCategoryIcon(quickChore.category)"
            >
            </div>
            <div class="flex flex-col">
              <p class="text-[#0d0f1c] text-sm font-medium leading-tight">{{ quickChore.name }}</p>
              <p v-if="quickChore.amount > 0" class="text-[#47569e] text-xs">\${{ quickChore.amount.toFixed(2) }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
              {{ getCategoryLabel(quickChore.category) }}
            </span>
          </div>
          
          <!-- Add to Quicklist button -->
          <div class="flex items-center justify-center">
            <button
              @click="showAddToQuicklistModal = true"
              class="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg border-2 border-dashed border-purple-300 transition-colors duration-200"
              title="Add new chore to quicklist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              <span class="text-sm font-medium">Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: ['quicklistChores', 'showAddToQuicklistModal'],
  methods: {
    getQuicklistChoreClasses(quickChore) {
      const baseClasses = "relative group flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm cursor-pointer border-l-4 border-purple-500 transition-all duration-200";
      const selectedClasses = this.isChoreSelected(quickChore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-105";
      
      return `${baseClasses} ${selectedClasses}`;
    },
    
    isChoreSelected(chore) {
      return this.$parent.selectedQuicklistChore && chore.name === this.$parent.selectedQuicklistChore.name;
    },
    
    getCategoryIcon(category) {
      switch(category) {
        case 'school':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24ZM72,40H200V184H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40Z"></path>
          </svg>`;
        case 'game':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M192,88h16a8,8,0,0,1,0,16H192a8,8,0,0,1,0-16ZM48,104H64a8,8,0,0,0,0-16H48a8,8,0,0,0,0,16ZM208,40H48A24,24,0,0,0,24,64V192a24,24,0,0,0,24,24H208a24,24,0,0,0,24-24V64A24,24,0,0,0,208,40ZM216,192a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8V192Z"></path>
          </svg>`;
        default:
          return `<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A8,8,0,0,0,32,110.62V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V110.62A8,8,0,0,0,218.83,103.77ZM208,208H48V115.54L128,44.77,208,115.54V208Z"></path>
          </svg>`;
      }
    },
    
    getCategoryLabel(category) {
      switch(category) {
        case 'school': return '📚 School';
        case 'game': return '⚡ Electronics';
        default: return '🏠 Regular';
      }
    },
    
    handleQuicklistDragStart(event, quickChore) {
      // Create a new chore instance from the quicklist template
      const newChore = {
        name: quickChore.name,
        amount: quickChore.amount,
        category: quickChore.category,
        assignedTo: 'unassigned',
        completed: false,
        isNewFromQuicklist: true
      };
      this.$parent.draggedChore = newChore;
      event.dataTransfer.effectAllowed = 'copy';
    },
    
    selectQuicklistChore(quickChore) {
      // Create a new chore instance from the quicklist template
      const newChore = {
        name: quickChore.name,
        amount: quickChore.amount,
        category: quickChore.category,
        assignedTo: 'unassigned',
        completed: false,
        isNewFromQuicklist: true
      };
      // Clear any existing regular chore selection
      this.$parent.selectedChoreId = null;
      this.$parent.selectedQuicklistChore = newChore;
      console.log('Quicklist chore selected:', newChore.name);
    },
    
    async removeFromQuicklist(quicklistId) {
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.$parent.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
      }
    }
  }
});

// Export component for manual registration
window.QuicklistSectionComponent = QuicklistSection; 