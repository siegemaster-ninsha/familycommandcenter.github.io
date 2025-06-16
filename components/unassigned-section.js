// Unassigned Section Component
const UnassignedSection = Vue.defineComponent({
  template: `
    <div class="mb-6 sm:mb-8">
      <h2 class="text-[#0d0f1c] text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] px-2 sm:px-4 pb-3 pt-5">Unassigned Chores</h2>
      <div 
        class="min-h-[120px] sm:min-h-[100px] bg-[#f0f2f8] border-2 border-dashed border-[#ced2e9] rounded-lg mx-2 sm:mx-4 p-3 sm:p-4"
        @drop="handleDrop($event, 'unassigned')"
        @dragover.prevent
        @dragenter.prevent
      >
        <!-- Empty state when no chores -->
        <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-[#47569e] py-6 sm:py-6 flex flex-col items-center justify-center">
          <p class="text-sm px-2">No unassigned chores</p>
          <p class="text-xs mt-2 px-2">Create a new chore or drag completed chores here to unassign them</p>
        </div>
        
        <!-- Container for chores and add button -->
        <div v-else class="space-y-3 sm:space-y-2 mb-4">
          <div 
            v-for="chore in choresByPerson.unassigned" 
            :key="chore.id"
            :class="getChoreClasses(chore)"
            draggable="true"
            @dragstart="handleDragStart($event, chore)"
            @click.stop="selectChore(chore, $event)"
          >
            <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div
                class="flex items-center justify-center rounded-lg bg-white shrink-0 size-14 sm:size-12"
                :class="getCategoryStyle(chore.category).icon"
                v-html="getCategoryIcon(chore.category)"
              >
              </div>
              <div class="flex flex-col justify-center min-w-0 flex-1">
                <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                  <p class="text-[#0d0f1c] text-base sm:text-base font-medium leading-normal line-clamp-2 sm:line-clamp-1">{{ chore.name }}</p>
                  <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                    {{ getCategoryLabel(chore.category) }}
                  </span>
                </div>
                <p v-if="chore.amount > 0" class="text-[#47569e] text-sm font-normal leading-normal line-clamp-2">\${{ chore.amount.toFixed(2) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-[#47569e] bg-white px-2 py-1 rounded hidden sm:inline">Drag to assign</span>
              <span class="text-xs text-[#47569e] bg-white px-2 py-1 rounded sm:hidden">Tap to select</span>
            </div>
          </div>
        </div>
        
        <!-- Add new chore button - always visible inside container -->
        <div class="flex items-center justify-center" :class="choresByPerson.unassigned.length === 0 ? 'mt-4' : ''">
          <button
            @click="$parent.showAddChoreModal = true"
            class="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700 px-4 py-3 sm:px-4 sm:py-2 rounded-lg border-2 border-dashed border-blue-300 transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center"
            title="Add new chore to unassigned"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            <span class="text-sm font-medium">Add New Chore</span>
          </button>
        </div>
      </div>
    </div>
  `,
  inject: ['choresByPerson', 'showAddChoreModal', 'assignSelectedChore'],
  methods: {
    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[96px] sm:min-h-[72px] py-4 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200 touch-target";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selectedClasses = this.isChoreSelected(chore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102 active:scale-95";
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      return this.$parent.selectedChoreId && chore.id === this.$parent.selectedChoreId;
    },

    getCategoryStyle(category) {
      switch(category) {
        case 'school':
          return {
            background: 'bg-blue-50 border-l-blue-500',
            icon: 'text-blue-600',
            badge: 'bg-blue-100 text-blue-800'
          };
        case 'game':
          return {
            background: 'bg-green-50 border-l-green-500',
            icon: 'text-green-600',
            badge: 'bg-green-100 text-green-800'
          };
        default:
          return {
            background: 'bg-[#f8f9fc] border-l-gray-300',
            icon: 'text-[#0d0f1c]',
            badge: 'bg-gray-100 text-gray-800'
          };
      }
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
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11a16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A8,8,0,0,0,32,110.62V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V110.62A8,8,0,0,0,218.83,103.77ZM208,208H48V115.54L128,44.77,208,115.54V208ZM112,176V136a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V144H120v32a8,8,0,0,1-16,0Z"></path>
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

    handleDragStart(event, chore) {
      this.$parent.draggedChore = chore;
      event.dataTransfer.effectAllowed = 'move';
    },

    selectChore(chore, event) {
      console.log('selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      
      // Special case: If we have a different chore selected and we click on a chore that's assigned to someone,
      // assign the selected chore to that person
      if (this.$parent.selectedChore && 
          this.$parent.selectedChoreId !== chore.id && 
          chore.assignedTo && 
          chore.assignedTo !== 'unassigned') {
        console.log('Assigning selected chore to:', chore.assignedTo);
        this.assignSelectedChore(chore.assignedTo);
        return;
      }
      
      if (this.$parent.selectedChoreId === chore.id) {
        // Clicking the same chore deselects it
        console.log('Deselecting chore:', chore.name);
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
      } else {
        // Select the chore
        console.log('Selecting chore:', chore.name, 'ID:', chore.id);
        this.$parent.selectedChoreId = chore.id;
        this.$parent.selectedQuicklistChore = null;
      }
    },

    async handleDrop(event, assignTo) {
      event.preventDefault();
      if (this.$parent.draggedChore) {
        try {
          if (this.$parent.draggedChore.isNewFromQuicklist) {
            // This is a new chore from quicklist
            const choreData = {
              name: this.$parent.draggedChore.name,
              amount: this.$parent.draggedChore.amount,
              category: this.$parent.draggedChore.category,
              assignedTo: assignTo
            };
            await this.$parent.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
              method: 'POST',
              body: JSON.stringify(choreData)
            });
          } else {
            // This is an existing chore being moved
            await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.$parent.draggedChore.id}/assign`, {
              method: 'PUT',
              body: JSON.stringify({ assignedTo: assignTo })
            });
          }
          
          // Reload data to get updated state
          await this.$parent.loadChores();
          await this.$parent.loadEarnings();
          await this.$parent.loadElectronicsStatus();
        } catch (error) {
          console.error('Failed to assign chore:', error);
        }
        
        this.$parent.draggedChore = null;
      }
    }
  }
});

// Export component for manual registration
window.UnassignedSectionComponent = UnassignedSection; 