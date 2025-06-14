// Unassigned Section Component
const UnassignedSection = Vue.defineComponent({
  template: `
    <div class="mb-8">
      <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Unassigned Chores</h2>
      <div 
        class="min-h-[100px] bg-[#f0f2f8] border-2 border-dashed border-[#ced2e9] rounded-lg mx-4 p-4"
        @drop="handleDrop($event, 'unassigned')"
        @dragover.prevent
        @dragenter.prevent
      >
        <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-[#47569e] py-8">
          <p class="text-sm">All chores have been assigned!</p>
          <p class="text-xs mt-1">Drag completed chores here to unassign them.</p>
        </div>
        
        <div 
          v-for="chore in choresByPerson.unassigned" 
          :key="chore.id"
          :class="getChoreClasses(chore)"
          draggable="true"
          @dragstart="handleDragStart($event, chore)"
          @click.stop="selectChore(chore, $event)"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex items-center justify-center rounded-lg bg-white shrink-0 size-12"
              :class="getCategoryStyle(chore.category).icon"
              v-html="getCategoryIcon(chore.category)"
            >
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-2 mb-1">
                <p class="text-[#0d0f1c] text-base font-medium leading-normal line-clamp-1">{{ chore.name }}</p>
                <span class="text-xs px-2 py-1 rounded-full" :class="getCategoryStyle(chore.category).badge">
                  {{ getCategoryLabel(chore.category) }}
                </span>
              </div>
              <p v-if="chore.amount > 0" class="text-[#47569e] text-sm font-normal leading-normal line-clamp-2">\${{ chore.amount.toFixed(2) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-[#47569e] bg-white px-2 py-1 rounded">Drag to assign</span>
          </div>
        </div>
      </div>
      
      <!-- Add new chore button for unassigned -->
      <div class="flex px-4 py-3 justify-start">
        <button
          @click="$parent.showAddChoreModal = true"
          class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#607afb] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-[#4f68d8] transition-colors"
        >
          <span class="truncate">Add New Chore</span>
        </button>
      </div>
    </div>
  `,
  inject: ['choresByPerson', 'showAddChoreModal', 'assignSelectedChore'],
  methods: {
    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-4 px-4 min-h-[72px] py-2 justify-between mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selectedClasses = this.isChoreSelected(chore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102";
      
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