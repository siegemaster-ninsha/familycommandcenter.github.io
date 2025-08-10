// Chore Page Component
const ChorePage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Quicklist Section -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">⚡ Quicklist</h2>
        <p class="text-secondary-custom text-sm mb-4 text-center">Tap these common chores to assign them quickly</p>
        
        <!-- Loading state -->
        <div v-if="quicklistLoading" class="text-center py-8">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2">Loading quicklist...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="quicklistError" class="text-center py-8 text-red-600">
          <p class="font-medium">Error loading quicklist</p>
          <p class="text-sm mt-1">{{ quicklistError }}</p>
          <button 
            @click="loadQuicklistChores"
            class="mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Quicklist items -->
        <div v-else class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 justify-center mb-4">
          <div 
            v-for="quickChore in quicklistChores" 
            :key="quickChore.id"
            :class="[getQuicklistChoreClasses(quickChore), quickChore.isOptimistic ? 'optimistic-update' : '']"
            :style="getQuicklistChoreStyle(quickChore)"
            @click="selectQuicklistChore(quickChore, $event)"
            @touchend="selectQuicklistChore(quickChore, $event)"
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
              class="flex items-center justify-center rounded-lg shrink-0 size-10 sm:size-8 text-white bg-white bg-opacity-20"
              v-html="getCategoryIcon(quickChore.category)"
            >
            </div>
            <div class="flex flex-col flex-1 min-w-0">
              <p class="text-white text-sm font-medium leading-tight line-clamp-2 sm:line-clamp-1">{{ quickChore.name }}</p>
              <p v-if="quickChore.amount > 0" class="text-white text-opacity-90 text-xs">\${{ quickChore.amount.toFixed(2) }}</p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full shrink-0 self-start sm:self-center bg-white bg-opacity-20 text-white">
              {{ getCategoryLabel(quickChore.category) }}
            </span>
          </div>
          
          <!-- Add to Quicklist button -->
          <div class="flex items-center justify-center">
            <button
              @click="$parent.showAddToQuicklistModal = true"
              class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center"
              title="Add new chore to quicklist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              <span class="text-sm font-medium">Add to Quicklist</span>
            </button>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="text-center py-8 text-secondary-custom">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
          </svg>
          <p>No quicklist chores yet.</p>
          <p class="text-sm mt-1">Add common chores for quick assignment!</p>
        </div>
      </div>

      <!-- Unassigned Chores -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">📋 Unassigned Chores</h2>
        
        <!-- Inner container for chores -->
        <div 
          class="min-h-[120px] sm:min-h-[100px] rounded-lg p-4"
          style="background-color: var(--color-bg-card);"
          :class="[selectedChore ? 'cursor-pointer hover:shadow-md' : '']"
          :style="selectedChore ? 'cursor: pointer;' : ''"
          @click="selectedChore ? assignSelectedChore('unassigned') : null"
        >
            <!-- Empty state when no chores -->
            <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-secondary-custom py-6 flex flex-col items-center justify-center">
              <p class="text-sm px-2">No unassigned chores</p>
              <p class="text-xs mt-2 px-2">Create new chores here - they'll be available for any family member to pick up</p>
              
              <p v-if="selectedChore" class="text-xs mt-2 text-secondary-custom px-2">Tap here to move selected chore to unassigned</p>
            </div>
          
            <!-- Container for chores -->
            <div v-else class="space-y-3 sm:space-y-2 mb-4">
            <div 
              v-for="chore in choresByPerson.unassigned" 
              :key="chore.id"
              :class="[getChoreClasses(chore), chore.isOptimistic ? 'optimistic-update' : '', 'relative']"
              :style="getChoreStyle(chore)"
              @click.stop="selectChore(chore, $event)"
              @touchend.stop="selectChore(chore, $event)"
            >
              <!-- Delete button (only visible when selected) -->
              <button
                v-if="isChoreSelected(chore)"
                @click.stop="deleteChore(chore)"
                class="absolute -top-2 -right-2 btn-error rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg z-10 touch-target"
                title="Delete chore"
              >
                ×
              </button>
              <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div
                  class="flex items-center justify-center rounded-lg shrink-0 size-14 sm:size-12 text-white bg-white bg-opacity-20"
                  v-html="getCategoryIcon(chore.category)"
                >
                </div>
                                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <p class="text-white text-base sm:text-base font-medium leading-normal line-clamp-2 sm:line-clamp-1">{{ chore.name }}</p>
                      <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                        {{ getCategoryLabel(chore.category) }}
                      </span>
                    </div>
                    <p v-if="chore.details" class="text-white text-opacity-80 text-sm font-normal leading-normal mb-1">{{ chore.details }}</p>
                    <p v-if="chore.amount > 0" class="text-white text-opacity-90 text-sm font-normal leading-normal line-clamp-2">\${{ chore.amount.toFixed(2) }}</p>
                  </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-xs text-white px-2 py-1 rounded bg-white bg-opacity-20">Tap to select</span>
              </div>
            </div>
          </div>
          
          <!-- Add new chore button -->
          <div class="flex items-center justify-center" :class="choresByPerson.unassigned.length === 0 ? 'mt-4' : 'mt-4'">
            <button
              @click="$parent.showAddChoreModal = true"
              class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white px-4 py-3 sm:px-4 sm:py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
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

      <!-- Family Members & Assigned Chores -->
      <div class="rounded-lg border p-6 shadow-md" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">👨‍👩‍👧‍👦 Family Members</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            v-for="person in people" 
            :key="person.id"
            :class="[
              'family-card border-2 rounded-lg p-4 transition-all duration-200 shadow-lg',
              selectedChore ? 'cursor-pointer hover:shadow-xl hover:scale-102' : ''
            ]"
            style="border-color: var(--color-border-card);"
            @click="selectedChore ? assignSelectedChore(person.name) : null"
          >
            <!-- Person header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="avatar family-avatar text-white bg-gradient-to-br from-primary-500 to-primary-600">
                  {{ person.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-primary-custom">{{ person.name }}</h3>
                </div>
              </div>
              
              <!-- Electronics status -->
              <div class="flex items-center gap-2">
                <div :class="getElectronicsStatusClass(person.electronicsStatus.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                </div>
              </div>
            </div>
            

            
            <!-- Person's chores -->
            <div class="space-y-2 min-h-[60px]">
              <div v-if="choresByPerson[person.name] && choresByPerson[person.name].length === 0" class="text-center py-4 text-secondary-custom">
                <p class="text-sm">No chores assigned</p>
                <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
              </div>
              
              <div 
                v-for="chore in choresByPerson[person.name]" 
                :key="chore.id"
                :class="[getChoreClasses(chore), chore.isOptimistic ? 'optimistic-update' : '', 'relative']"
                :style="getChoreStyle(chore)"
                @click.stop="selectChore(chore, $event)"
              >
                <!-- Delete button (only visible when selected) -->
                <button
                  v-if="isChoreSelected(chore)"
                  @click.stop="deleteChore(chore)"
                  class="absolute -top-2 -right-2 btn-error rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors shadow-lg z-10 touch-target"
                  title="Delete chore"
                >
                  ×
                </button>
                <!-- Completion checkbox -->
                <div class="shrink-0 flex items-center" @click.stop @change.stop @mousedown.stop @mouseup.stop>
                  <input 
                    type="checkbox" 
                    :checked="chore.completed"
                    @click.stop
                    @change="handleChoreCompletionToggle(chore, $event)"
                    class="w-5 h-5 sm:w-4 sm:h-4 text-green-600 rounded focus:ring-green-500 focus:border-[#ced2e9] focus:outline-none touch-target"
                  >
                </div>
                
                <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 size-12 sm:size-10 text-white bg-white bg-opacity-20"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>
                                      <div class="flex flex-col justify-center min-w-0 flex-1">
                      <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <p 
                          :class="chore.completed ? 'line-through text-white opacity-60' : 'text-white'"
                          class="text-sm sm:text-base font-medium leading-normal line-clamp-2 sm:line-clamp-1"
                        >
                          {{ chore.name }}
                        </p>
                        <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                          {{ getCategoryLabel(chore.category) }}
                        </span>
                      </div>
                      <p v-if="chore.details" :class="chore.completed ? 'text-white opacity-50' : 'text-white text-opacity-80'" class="text-xs sm:text-sm font-normal leading-normal mb-1">
                        {{ chore.details }}
                      </p>
                      <p v-if="chore.amount > 0" :class="chore.completed ? 'text-white opacity-50' : 'text-white text-opacity-90'" class="text-xs sm:text-sm font-normal leading-normal line-clamp-2">
                        \${{ chore.amount.toFixed(2) }}
                      </p>
                      <div v-if="chore.isPendingApproval" class="mt-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                        <span>Pending approval</span>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      <!-- Earnings Summary -->
      <div class="rounded-lg border p-6 shadow-md" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">💰 Earnings Summary</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="earnings-card border-2 rounded-lg p-4 cursor-pointer hover:shadow-xl hover:scale-102 transition-all duration-200 touch-target shadow-lg"
            style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
            @click="openSpendModal(person)"
            @touchend="openSpendModal(person)"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <h3 class="font-bold text-white text-lg">{{ person.displayName || person.name }}</h3>
                <p class="text-sm text-white text-opacity-90">Total Earnings</p>
                <p class="text-xs text-white text-opacity-80 mt-1">
                  {{ person.completedChores || 0 }} chores completed
                </p>
              </div>
              <div class="text-right">
                <p class="text-3xl font-bold text-white">\${{ person.earnings.toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'loading', 'error',
    'showAddChoreModal', 'showAddToQuicklistModal'
  ],
  data() {
    return {
      quicklistLoading: false,
      quicklistError: null
    }
  },
  async mounted() {
    await this.loadQuicklistChores();
  },
  methods: {
    // Quicklist methods
    async loadQuicklistChores() {
      this.quicklistLoading = true;
      this.quicklistError = null;
      try {
        await this.$parent.loadQuicklistChores();
      } catch (error) {
        this.quicklistError = error.message;
      } finally {
        this.quicklistLoading = false;
      }
    },

    getQuicklistChoreClasses(quickChore) {
      const baseClasses = "quicklist-card relative group flex items-center gap-3 sm:gap-2 px-4 py-4 sm:px-3 sm:py-2 rounded-lg shadow-md cursor-pointer chore-item touch-feedback touch-target min-h-[68px] sm:min-h-[56px] border";
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hoverClasses = isTouch ? "" : "hover:shadow-lg hover:scale-105";
      const selectedClasses = this.isChoreSelected(quickChore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105 z-10 shadow-xl" : `${hoverClasses}`;
      
      return `${baseClasses} ${selectedClasses}`;
    },

    getQuicklistChoreStyle(quickChore) {
      // Provide high contrast background for quicklist items
      return {
        backgroundColor: 'var(--color-primary-500)',
        borderColor: 'var(--color-primary-600)',
        color: 'white'
      };
    },

    selectQuicklistChore(quickChore, event) {
      // For touch devices, prevent any hover-related delays
      if (event && event.type === 'touchend') {
        event.preventDefault();
      }
      
      // Check if the same quicklist chore is already selected
      if (this.$parent.selectedQuicklistChore && 
          this.$parent.selectedQuicklistChore.name === quickChore.name) {
        // Clicking the same quicklist chore deselects it
        console.log('Deselecting quicklist chore:', quickChore.name);
        this.$parent.selectedQuicklistChore = null;
        this.$parent.selectedChoreId = null;
      } else {
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
      }
      
      // Force re-render on mobile to ensure selection styling appears
      this.$nextTick(() => {
        this.$forceUpdate();
        this.forceRepaintOnMobile();
      });
    },



    async removeFromQuicklist(quicklistId) {
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
      }
    },

    // Regular chore methods
    getChoreClasses(chore) {
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[96px] sm:min-h-[72px] py-4 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-md cursor-pointer chore-item touch-feedback touch-target";
      const isUnassigned = chore.assignedTo === 'unassigned';
      const categoryClasses = this.getCategoryStyle(chore.category, isUnassigned).background;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hoverClasses = isTouch ? "" : "hover:shadow-lg hover:scale-102";
      const selectedClasses = this.isChoreSelected(chore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105 z-10 shadow-xl" : `${hoverClasses}`;
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    getChoreStyle(chore) {
      const isUnassigned = chore.assignedTo === 'unassigned';
      return this.getCategoryStyle(chore.category, isUnassigned).backgroundStyle;
    },

    isChoreSelected(chore) {
      if (this.$parent.selectedQuicklistChore && chore.name === this.$parent.selectedQuicklistChore.name) {
        return true;
      }
      return this.$parent.selectedChoreId && chore.id === this.$parent.selectedChoreId;
    },

    selectChore(chore, event) {
      console.log('selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      
      // For touch devices, prevent any hover-related delays
      if (event && event.type === 'touchend') {
        event.preventDefault();
      }
      
      // Special case: If we have a different chore selected and we click on a chore that's assigned to someone
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
      
      // Force re-render on mobile to ensure selection styling appears
      this.$nextTick(() => {
        this.$forceUpdate();
        this.forceRepaintOnMobile();
      });
    },



    async deleteSelectedChore() {
      if (this.selectedChore && !this.selectedChore.isNewFromQuicklist) {
        await this.$parent.deleteChore(this.selectedChore);
      }
    },

    async deleteChore(chore) {
      if (chore && !chore.isNewFromQuicklist) {
        await this.$parent.deleteChore(chore);
      }
    },

    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    },

    async handleChoreCompletion(chore) {
      await this.$parent.handleChoreCompletion(chore);
    },

    async handleChoreCompletionToggle(chore, event) {
      // Update the chore's completed status based on checkbox state
      const newCompletedState = event.target.checked;
      chore.completed = newCompletedState;
      
      // Call the parent's completion handler
      await this.$parent.handleChoreCompletion(chore);
    },

    // Utility methods
    getCategoryStyle(category, isUnassigned = false) {
      // All chores now use the same high-contrast primary color background
      return {
        background: 'border',
        backgroundStyle: 'background-color: var(--color-primary-500); border-color: var(--color-primary-600);',
        icon: 'text-white',
        badge: 'bg-white bg-opacity-20 text-white'
      };
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
            <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A8,8,0,0,0,32,110.62V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V110.62A8,8,0,0,0,218.83,103.77ZM208,208H48V115.54L128,44.77,208,115.54V208ZM112,176V136a8,8,0,0,1,8-8h16a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V144H120v32a8,8,0,0,1-16,0Z"></path>
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

    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'bg-green-100 text-green-800';
        case 'restricted': return 'bg-yellow-100 text-yellow-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        default: return 'bg-green-100 text-green-800'; // Default to allowed styling
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return '✅ Allowed';
        case 'restricted': return '⚠️ Limited';
        case 'blocked': return '🚫 Blocked';
        default: return '✅ Allowed'; // Default to allowed if status is undefined/unknown
      }
    },

    getCompletedChoresCount(personName) {
      if (!this.choresByPerson[personName]) return 0;
      return this.choresByPerson[personName].filter(chore => chore.completed).length;
    },

    getTotalEarnings() {
      return this.people.reduce((total, person) => total + person.earnings, 0);
    },

    forceRepaintOnMobile() {
      // Force repaint on mobile devices by triggering animation
      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        this.$nextTick(() => {
          // Find selected elements and trigger animation
          const selectedElements = document.querySelectorAll('.ring-4');
          selectedElements.forEach(el => {
            // Remove and re-add the class to trigger animation
            el.classList.remove('ring-4');
            el.offsetHeight; // Force reflow
            el.classList.add('ring-4');
            
            // Also force a style recalculation with transform
            el.style.transform = 'translateZ(0) scale(1.05)';
            setTimeout(() => {
              el.style.transform = 'translateZ(0) scale(1.05)';
            }, 50);
          });
        });
      }
    },

    openSpendModal(person) {
      // Call parent method to open spending modal
      if (this.$parent.openSpendingModal) {
        this.$parent.openSpendingModal(person);
      }
    }
  }
});

// Export component for manual registration
window.ChorePageComponent = ChorePage;