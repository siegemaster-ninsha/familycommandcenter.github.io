// Family Members Section Component  
const FamilyMembersSection = Vue.defineComponent({
  template: `
    <div class="mb-6">
      <div class="flex items-center justify-between px-2 sm:px-4 pb-3 pt-5">
        <h2 class="text-[#0d0f1c] text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">Family Members</h2>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <!-- Dynamic Person Sections -->
        <div 
          v-for="person in people"
          :key="person.id"
          :class="getDropZoneClasses(person.name)"
          @click="assignSelectedChore(person.name)"
          :data-person="person.name"
        >
          <div class="flex items-center justify-between px-3 sm:px-4 pb-3 pt-4 sm:pt-5">
            <h3 class="text-[#0d0f1c] text-lg sm:text-[20px] font-bold leading-tight tracking-[-0.015em]">{{ person.name }}</h3>
            <div class="flex items-center gap-2">
              <div class="text-xs px-2 py-1 rounded-full" 
                   :class="person.electronicsStatus.status === 'allowed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                {{ person.electronicsStatus.message }}
              </div>
            </div>
          </div>
          <div class="min-h-[120px] px-3 sm:px-4 pb-4">
            <div 
              v-for="chore in choresByPerson[person.name]" 
              :key="chore.id"
              :class="getChoreClasses(chore)"
              @click.stop="selectChore(chore, $event)"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <div
                  class="flex items-center justify-center rounded-lg bg-white shrink-0 size-12 sm:size-10"
                  :class="getCategoryStyle(chore.category).icon"
                  v-html="getCategoryIcon(chore.category)"
                >
                </div>
                <div class="flex flex-col justify-center min-w-0 flex-1">
                  <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <p class="text-[#0d0f1c] text-sm sm:text-sm font-medium leading-normal line-clamp-2 sm:line-clamp-1">{{ chore.name }}</p>
                    <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                      {{ getCategoryLabel(chore.category) }}
                    </span>
                  </div>
                  <p v-if="chore.amount > 0" class="text-[#47569e] text-xs font-normal leading-normal">\${{ chore.amount.toFixed(2) }}</p>
                </div>
              </div>
              <div class="shrink-0 flex items-center" @click.stop @change.stop @mousedown.stop @mouseup.stop>
                <div class="flex size-10 sm:size-6 items-center justify-center p-2 sm:p-0">
                  <input
                    type="checkbox"
                    :checked="chore.completed"
                    @change.stop="handleChoreCompletionChange(chore, $event)"
                    @click.stop
                    @mousedown.stop
                    @mouseup.stop
                    class="h-5 w-5 sm:h-4 sm:w-4 rounded border-[#ced2e9] border-2 bg-transparent text-[#607afb] checked:bg-[#607afb] checked:border-[#607afb] checked:bg-[image:--checkbox-tick-svg] focus:ring-0 focus:ring-offset-0 focus:border-[#ced2e9] focus:outline-none touch-target"
                  />
                </div>
              </div>
            </div>
            
            <!-- Assignment zone indicator -->
            <div v-if="choresByPerson[person.name].length === 0" class="text-center text-[#47569e] py-8 sm:py-8 border-2 border-dashed border-[#ced2e9] rounded-lg bg-[#f8f9fc] min-h-[80px] flex flex-col items-center justify-center">
              <p class="text-sm px-2">No chores assigned to {{ person.name }}</p>
              <p v-if="selectedChore" class="text-xs mt-2 text-blue-600 px-2">Tap here to assign selected chore</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  inject: [
    'choresByPerson', 'people', 'isDragOverTrash', 'assignSelectedChore'
  ],
  methods: {
    getDropZoneClasses(person) {
      const baseClasses = "bg-white rounded-lg shadow-sm border transition-all duration-200";
      const highlightClasses = this.$parent.selectedChore ? "ring-2 ring-green-400 ring-opacity-50 bg-green-50" : "";
      
      return `${baseClasses} ${highlightClasses}`;
    },

    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[88px] sm:min-h-[72px] py-3 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200 touch-target";
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



    selectChore(chore, event) {
      console.log('🎯 selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      console.log('🎯 Event type:', event.type, 'Event target:', event.target.tagName);
      console.trace('🎯 selectChore call stack');
      
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



    async handleChoreCompletionChange(chore, event) {
      console.log('🔲 Checkbox changed for chore:', chore.name, 'to:', event.target.checked);
      console.log('🔲 Current selectedChoreId before:', this.$parent.selectedChoreId);
      
      // Update the chore's completed status first
      chore.completed = event.target.checked;
      
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        console.log('🔲 Current selectedChoreId after API call:', this.$parent.selectedChoreId);
        
        if (chore.completed) {
          this.$parent.triggerConfetti();
          this.$parent.showSuccessMessage = true;
          this.$parent.completedChoreMessage = `${chore.name} completed!`;
          
          setTimeout(() => {
            this.$parent.showSuccessMessage = false;
          }, 3000);
        }
        
        console.log('🔲 Current selectedChoreId before loadEarnings:', this.$parent.selectedChoreId);
        await this.$parent.loadEarnings();
        console.log('🔲 Current selectedChoreId after loadEarnings:', this.$parent.selectedChoreId);
        await this.$parent.loadElectronicsStatus();
        console.log('🔲 Current selectedChoreId after loadElectronicsStatus:', this.$parent.selectedChoreId);
      } catch (error) {
        console.error('Failed to update chore completion:', error);
        // Revert the checkbox if API call failed
        chore.completed = !chore.completed;
      }
    },

    async handleChoreCompletion(chore) {
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        if (chore.completed) {
          this.$parent.triggerConfetti();
          this.$parent.showSuccessMessage = true;
          this.$parent.completedChoreMessage = `${chore.name} completed!`;
          
          setTimeout(() => {
            this.$parent.showSuccessMessage = false;
          }, 3000);
        }
        
        await this.$parent.loadEarnings();
        await this.$parent.loadElectronicsStatus();
      } catch (error) {
        console.error('Failed to update chore completion:', error);
        // Revert the checkbox if API call failed
        chore.completed = !chore.completed;
      }
    }
  }
});

// Export component for manual registration
window.FamilyMembersSectionComponent = FamilyMembersSection; 