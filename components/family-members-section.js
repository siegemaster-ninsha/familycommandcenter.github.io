// Family Members Section Component  
const FamilyMembersSection = Vue.defineComponent({
  name: 'FamilyMembersSection',
  template: `
    <div class="mb-6">
      <div class="flex items-center justify-between px-2 sm:px-4 pb-3 pt-5">
        <h2 class="text-primary-custom text-lg sm:text-[22px] font-bold leading-tight tracking-[-0.015em]">Family Members</h2>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <!-- Dynamic Person Sections -->
        <div 
          v-for="person in people"
          :key="person.id"
          :class="getDropZoneClasses(person.displayName)"
          @click="assignSelectedChore(person.displayName)"
          :data-person="person.displayName"
        >
          <div class="flex items-center justify-between px-3 sm:px-4 pb-3 pt-4 sm:pt-5">
            <h3 class="text-primary-custom text-lg sm:text-[20px] font-bold leading-tight tracking-[-0.015em]">{{ person.displayName || person.name }}</h3>
            <div class="flex items-center gap-2">
              <div class="text-xs px-2 py-1 rounded-full"
                   :style="(person.electronicsStatus?.status || 'allowed') === 'allowed' ? { background: 'var(--color-success-50)', color: 'var(--color-success-700)' } : { background: 'var(--color-error-50)', color: 'var(--color-error-700)' }">
                {{ person.electronicsStatus?.message || 'Electronics allowed' }}
              </div>
            </div>
          </div>
          <div class="min-h-[120px] px-3 sm:px-4 pb-4">
            <div 
              v-for="chore in choresByPerson[person.displayName]" 
              :key="chore.id"
              :class="getChoreClasses(chore)"
              :style="isChoreSelected(chore) ? { '--tw-ring-color': 'var(--color-primary-400)' } : {}"
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
                    <p class="text-primary-custom text-sm sm:text-sm font-medium leading-normal line-clamp-2 sm:line-clamp-1">{{ chore.name }}</p>
                    <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                      {{ getCategoryLabel(chore.category) }}
                    </span>
                  </div>
                  <p v-if="chore.amount > 0" class="text-secondary-custom text-xs font-normal leading-normal">\${{ chore.amount.toFixed(2) }}</p>
                </div>
              </div>
              <div class="shrink-0 flex items-center gap-2" @click.stop @change.stop @mousedown.stop @mouseup.stop>
                <div class="flex size-10 sm:size-6 items-center justify-center p-2 sm:p-0">
                  <input
                    type="checkbox"
                    :checked="chore.completed"
                    @change.stop="handleChoreCompletionChange(chore, $event)"
                    @click.stop
                    @mousedown.stop
                    @mouseup.stop
                    class="h-5 w-5 sm:h-4 sm:w-4 rounded border-2 bg-transparent text-current checked:bg-current checked:border-current checked:bg-[image:--checkbox-tick-svg] focus:ring-0 focus:ring-offset-0 focus:outline-none touch-target"
                    :style="{ borderColor: 'var(--color-border-card)', color: 'var(--color-primary-500)' }"
                  />
                </div>
                <button
                  v-if="currentUser?.role === 'parent' && chore.isPendingApproval"
                  @click.stop="approveChore(chore)"
                  class="px-2 py-1 text-xs rounded btn-success"
                >Approve</button>
              </div>
            </div>
            
            <!-- Assignment zone indicator -->
            <div v-if="choresByPerson[person.displayName]?.length === 0" class="text-center text-secondary-custom py-8 sm:py-8 border-2 border-dashed rounded-lg min-h-[80px] flex flex-col items-center justify-center" :style="{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border-card)' }">
              <p class="text-sm px-2">No chores assigned to {{ person.displayName || person.name }}</p>
              <p v-if="selectedChore" class="text-xs mt-2 text-primary-600 px-2">Tap here to assign selected chore</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  inject: ['Helpers'],
  setup() {
    // Access stores directly instead of using $parent
    // _Requirements: 7.1, 7.2_
    const choresStore = window.useChoresStore();
    const familyStore = window.useFamilyStore();
    const authStore = window.useAuthStore();
    
    return {
      choresStore,
      familyStore,
      authStore
    };
  },
  computed: {
    // Map store data to component properties
    choresByPerson() {
      return this.choresStore.choresByPerson;
    },
    // Use enabledMembers to filter out hidden members (showOnChoreBoard === false)
    people() {
      return this.familyStore.enabledMembers;
    },
    selectedChore() {
      return this.choresStore.selectedChore;
    },
    selectedChoreId() {
      return this.choresStore.selectedChoreId;
    },
    selectedQuicklistChore() {
      return this.choresStore.selectedQuicklistChore;
    },
    currentUser() {
      return this.authStore.currentUser;
    }
  },
  methods: {
    getDropZoneClasses() {
      const baseClasses = "bg-white rounded-lg shadow-sm border transition-all duration-200";
      const highlightClasses = this.selectedChore ? "ring-2 ring-success-600 ring-opacity-50 bg-success-50" : "";
      
      return `${baseClasses} ${highlightClasses}`;
    },

    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[88px] sm:min-h-[72px] py-3 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200 touch-target";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selected = this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, chore) || false;
      const selectedClasses = selected ? "ring-4 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102 active:scale-95";
      // Ring color applied via inline style in template for theme support
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      return window.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, chore) || false;
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
            icon: 'text-success-600',
            badge: 'bg-success-50 text-success-700'
          };
        default:
          return {
            background: 'bg-gray-50 border-l-gray-300',
            icon: 'text-primary-custom',
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

    assignSelectedChore(assignTo) {
      // Use chores store to assign chore
      const selectedChore = this.choresStore.selectedChore;
      if (selectedChore) {
        this.choresStore.assignChore(selectedChore.id, assignTo);
        this.choresStore.clearSelection();
      }
    },

    selectChore(chore, event) {
      console.log('🎯 selectChore called for:', chore.name, 'Current selectedChoreId:', this.selectedChoreId);
      console.log('🎯 Event type:', event.type, 'Event target:', event.target.tagName);
      console.trace('🎯 selectChore call stack');
      if (this.selectedChore && this.selectedChoreId !== chore.id && chore.assignedTo && chore.assignedTo !== 'unassigned') {
        console.log('Assigning selected chore to:', chore.assignedTo);
        this.assignSelectedChore(chore.assignedTo);
        return;
      }
      if (event && event.type === 'touchend') event.preventDefault();
      // Use chores store to select chore
      this.choresStore.selectChore(chore);
    },

    async handleChoreCompletionChange(chore, event) {
      console.log('🔲 Checkbox changed for chore:', chore.name, 'to:', event.target.checked);
      chore.completed = event.target.checked;
      // Use chores store instead of $parent
      await this.choresStore.toggleComplete(chore);
    },

    async approveChore(chore) {
      // Use chores store instead of $parent
      await this.choresStore.approveChore(chore);
    }
  }
});

// Export component for manual registration
window.FamilyMembersSectionComponent = FamilyMembersSection; 
