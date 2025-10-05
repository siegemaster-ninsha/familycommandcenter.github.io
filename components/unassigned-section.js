// Unassigned Section Component
const UnassignedSection = Vue.defineComponent({
  template: `
    <div class="mb-6 sm:mb-8">
      <h2 class="text-primary-custom text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em] px-2 sm:px-4 pb-3 pt-5">Unassigned Chores</h2>
      <div 
        class="min-h-[120px] sm:min-h-[100px] rounded-lg mx-2 sm:mx-4 p-3 sm:p-4 border-2 border-dashed"
        :style="{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-card)' }"
        :class="[selectedChore ? 'cursor-pointer' : '']"
        @click="selectedChore ? assignSelectedChore('unassigned') : null"
      >
        <!-- Empty state when no chores -->
                  <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-secondary-custom py-6 sm:py-6 flex flex-col items-center justify-center">
            <p class="text-sm px-2">No unassigned chores</p>
            <p class="text-xs mt-2 px-2">Create new chores here - they'll be available for any family member to pick up</p>
            <p v-if="selectedChore" class="text-xs mt-2 text-primary-600 px-2">Tap here to move selected chore to unassigned</p>
          </div>
        
        <!-- Container for chores and add button -->
        <div v-else class="space-y-3 sm:space-y-2 mb-4">
          <div 
            v-for="chore in choresByPerson.unassigned" 
            :key="chore.id"
            :class="getChoreClasses(chore)"
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
                  <p class="text-primary-custom text-base sm:text-base font-medium leading-normal line-clamp-2 sm:line-clamp-1">{{ chore.name }}</p>
                  <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                    {{ getCategoryLabel(chore.category) }}
                  </span>
                </div>
                <p v-if="chore.amount > 0" class="text-secondary-custom text-sm font-normal leading-normal line-clamp-2">\${{ chore.amount.toFixed(2) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-xs text-secondary-custom bg-white px-2 py-1 rounded">Tap to select</span>
            </div>
          </div>
        </div>
        
        <!-- Add new chore button - always visible inside container -->
        <div class="flex items-center justify-center" :class="choresByPerson.unassigned.length === 0 ? 'mt-4' : ''">
          <button
            @click="openAddChoreModal()"
            class="flex items-center gap-2 px-4 py-3 sm:px-4 sm:py-2 rounded-lg border-2 border-dashed transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center"
            :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', borderColor: 'var(--color-primary-300)' }"
            title="Add new chore to unassigned"
          >
            <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
            <span class="text-sm font-medium">Add New Chore</span>
          </button>
        </div>
      </div>
    </div>
  `,
  inject: ['choresByPerson', 'showAddChoreModal', 'assignSelectedChore', 'selectedChore', 'handleChoreClick', 'openAddChoreModal', 'selectionStore', 'Helpers'],
  methods: {
    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[96px] sm:min-h-[72px] py-4 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200 touch-target";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selected = this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
      const selectedClasses = selected ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102 active:scale-95";
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
    },

    getCategoryStyle(category) {
      switch(category) {
        case 'school':
          return {
            background: 'bg-primary-50 border-l-primary-500',
            icon: 'text-primary-600',
            badge: 'bg-primary-100 text-primary-800'
          };
        case 'game':
          return {
            background: 'bg-success-50 border-l-success-600',
            icon: 'text-[color:var(--color-success-600)]',
            badge: 'bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)]'
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
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
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
      
      if (event && event.type === 'touchend') event.preventDefault();
      const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
      if (typeof handler === 'function') {
        handler(chore);
      } else {
        console.warn('handleChoreClick not available');
      }
    },


  }
});

// Export component for manual registration
window.UnassignedSectionComponent = UnassignedSection; 
