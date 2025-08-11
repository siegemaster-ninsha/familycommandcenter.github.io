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
    'choresByPerson', 'people', 'assignSelectedChore', 'handleChoreClick'
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
      const selected = window.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
      const selectedClasses = selected ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102 active:scale-95";
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      return window.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
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
      return window.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return window.Helpers?.getCategoryLabel?.(category) || '';
    },

    selectChore(chore, event) {
      console.log('🎯 selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      console.log('🎯 Event type:', event.type, 'Event target:', event.target.tagName);
      console.trace('🎯 selectChore call stack');
      if (this.$parent.selectedChore && this.$parent.selectedChoreId !== chore.id && chore.assignedTo && chore.assignedTo !== 'unassigned') {
        console.log('Assigning selected chore to:', chore.assignedTo);
        this.assignSelectedChore(chore.assignedTo);
        return;
      }
      if (event && event.type === 'touchend') event.preventDefault();
      const handler = this.handleChoreClick || this.$parent?.handleChoreClick;
      if (typeof handler === 'function') {
        handler(chore);
      } else {
        console.warn('handleChoreClick not available');
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
      // Use the parent's optimized method instead of duplicating logic
      await this.$parent.handleChoreCompletion(chore);
    }
  }
});

// Export component for manual registration
window.FamilyMembersSectionComponent = FamilyMembersSection; 