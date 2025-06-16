// Chore Page Component
const ChorePage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Quicklist Section -->
      <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">⚡ Quicklist</h2>
        <p class="text-[#47569e] text-sm mb-4 text-center">Tap these common chores to assign them quickly</p>
        
        <!-- Loading state -->
        <div v-if="quicklistLoading" class="text-center py-8">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-600 border-t-transparent"></div>
          <p class="text-[#47569e] mt-2">Loading quicklist...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="quicklistError" class="text-center py-8 text-red-600">
          <p class="font-medium">Error loading quicklist</p>
          <p class="text-sm mt-1">{{ quicklistError }}</p>
          <button 
            @click="loadQuicklistChores"
            class="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Try Again
          </button>
        </div>
        
        <!-- Quicklist items -->
        <div v-else class="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-2 justify-center mb-4">
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
              class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 sm:w-5 sm:h-5 flex items-center justify-center text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 opacity-60 transition-opacity duration-200 hover:bg-red-600 touch-target"
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
          <div class="flex items-center justify-center">
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
        
        <!-- Empty state -->
        <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="text-center py-8 text-[#47569e]">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
          </svg>
          <p>No quicklist chores yet.</p>
          <p class="text-sm mt-1">Add common chores for quick assignment!</p>
        </div>
      </div>

      <!-- Unassigned Chores -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">📋 Unassigned Chores</h2>
        
        <div 
          class="min-h-[120px] sm:min-h-[100px] bg-[#f0f2f8] border-2 border-dashed border-[#ced2e9] rounded-lg p-4"
          @drop="handleDrop($event, 'unassigned')"
          @dragover.prevent
          @dragenter.prevent
        >
          <!-- Empty state when no chores -->
          <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-[#47569e] py-6 flex flex-col items-center justify-center">
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
          
          <!-- Add new chore button -->
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

      <!-- Family Members & Assigned Chores -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">👨‍👩‍👧‍👦 Family Members</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
            @drop="handleDrop($event, person.name)"
            @dragover.prevent
            @dragenter.prevent
          >
            <!-- Person header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="avatar bg-gradient-to-br from-[#607afb] to-[#a855f7] text-white">
                  {{ person.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-[#0d0f1c]">{{ person.name }}</h3>
                  <p class="text-sm text-[#47569e]">
                    <span class="font-semibold text-green-600">\${{ person.earnings.toFixed(2) }}</span> earned
                  </p>
                </div>
              </div>
              
              <!-- Electronics status -->
              <div class="flex items-center gap-2">
                <div :class="getElectronicsStatusClass(person.electronicsStatus.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                </div>
              </div>
            </div>
            
            <!-- Click-to-assign hint -->
            <div v-if="selectedChore" class="mb-3 text-center">
              <button
                @click="assignSelectedChore(person.name)"
                class="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg border-2 border-dashed border-blue-300 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="inline mr-2" viewBox="0 0 256 256">
                  <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
                </svg>
                Assign "{{ selectedChore.name }}" to {{ person.name }}
              </button>
              <p v-if="selectedChore.isNewFromQuicklist" class="text-xs mt-2 text-blue-600">Or tap here to assign selected chore</p>
              <p v-else class="text-xs mt-2 text-blue-600">Or tap here to assign selected chore</p>
            </div>
            
            <!-- Person's chores -->
            <div class="space-y-2 min-h-[60px]">
              <div v-if="choresByPerson[person.name] && choresByPerson[person.name].length === 0" class="text-center py-4 text-[#47569e]">
                <p class="text-sm">No chores assigned</p>
                <p class="text-xs mt-1">Drag chores here to assign them</p>
              </div>
              
              <div 
                v-for="chore in choresByPerson[person.name]" 
                :key="chore.id"
                :class="getChoreClasses(chore)"
                draggable="true"
                @dragstart="handleDragStart($event, chore)"
                @click.stop="selectChore(chore, $event)"
              >
                <!-- Completion checkbox -->
                <div class="shrink-0 flex items-center" @click.stop @change.stop @mousedown.stop @mouseup.stop>
                  <input 
                    type="checkbox" 
                    :checked="chore.completed"
                    @click.stop
                    @change="handleChoreCompletion(chore)"
                    class="w-5 h-5 sm:w-4 sm:h-4 text-green-600 rounded focus:ring-green-500 focus:border-[#ced2e9] focus:outline-none touch-target"
                  >
                </div>
                
                <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    class="flex items-center justify-center rounded-lg bg-white shrink-0 size-12 sm:size-10"
                    :class="getCategoryStyle(chore.category).icon"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>
                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <p 
                        :class="chore.completed ? 'line-through text-gray-500' : 'text-[#0d0f1c]'"
                        class="text-sm sm:text-base font-medium leading-normal line-clamp-2 sm:line-clamp-1"
                      >
                        {{ chore.name }}
                      </p>
                      <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0" :class="getCategoryStyle(chore.category).badge">
                        {{ getCategoryLabel(chore.category) }}
                      </span>
                    </div>
                    <p v-if="chore.amount > 0" :class="chore.completed ? 'text-gray-400' : 'text-[#47569e]'" class="text-xs sm:text-sm font-normal leading-normal line-clamp-2">
                      \${{ chore.amount.toFixed(2) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trash Section -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">🗑️ Delete Chores</h2>
        
        <div class="flex items-center justify-center">
          <div
            class="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-red-300 rounded-lg bg-red-50"
            @drop="handleTrashDrop($event)"
            @dragover.prevent
            @dragenter.prevent
            :class="isDragOverTrash ? 'bg-red-100 border-red-400' : ''"
          >
            <div
              @click="deleteSelectedChore"
              class="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center size-20 sm:size-16 touch-target"
              :class="selectedChore ? 'scale-110 shadow-xl' : ''"
              :title="selectedChore && !selectedChore.isNewFromQuicklist ? 'Tap to delete selected chore' : 'Drag chores here to delete them'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" class="sm:w-6 sm:h-6">
                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
              </svg>
            </div>
            
            <div class="text-center">
              <p class="text-red-700 font-semibold text-sm sm:text-base">
                {{ selectedChore ? 'Tap to delete' : 'Drag to delete' }}
              </p>
              <p class="text-red-600 text-xs sm:text-sm mt-1">
                {{ selectedChore ? '"' + selectedChore.name + '"' : 'Drop chores here to remove them' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Earnings Summary -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4">💰 Earnings Summary</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="avatar bg-gradient-to-br from-green-500 to-blue-500 text-white">
                  {{ person.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-[#0d0f1c]">{{ person.name }}</h3>
                  <p class="text-sm text-[#47569e]">Total Earnings</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-green-600">\${{ person.earnings.toFixed(2) }}</p>
                <p class="text-xs text-[#47569e]">
                  {{ getCompletedChoresCount(person.name) }} chores completed
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Total earnings -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#0d0f1c]">Family Total</h3>
            <p class="text-3xl font-bold text-green-600">\${{ getTotalEarnings().toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'isDragOverTrash', 'loading', 'error',
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
      const baseClasses = "relative group flex items-center gap-3 sm:gap-2 bg-white px-4 py-4 sm:px-3 sm:py-2 rounded-lg shadow-sm cursor-pointer border-l-4 border-purple-500 transition-all duration-200 touch-target min-h-[68px] sm:min-h-[56px]";
      const selectedClasses = this.isChoreSelected(quickChore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-105 active:scale-95";
      
      return `${baseClasses} ${selectedClasses}`;
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
      const baseClasses = "flex items-center gap-3 sm:gap-4 px-3 sm:px-4 min-h-[96px] sm:min-h-[72px] py-4 sm:py-2 justify-between mb-3 sm:mb-2 rounded-lg shadow-sm cursor-pointer border-l-4 transition-all duration-200 touch-target";
      const categoryClasses = this.getCategoryStyle(chore.category).background;
      const selectedClasses = this.isChoreSelected(chore) ? "ring-4 ring-blue-400 ring-opacity-75 transform scale-105" : "hover:shadow-md hover:scale-102 active:scale-95";
      
      return `${baseClasses} ${categoryClasses} ${selectedClasses}`;
    },

    isChoreSelected(chore) {
      if (this.$parent.selectedQuicklistChore && chore.name === this.$parent.selectedQuicklistChore.name) {
        return true;
      }
      return this.$parent.selectedChoreId && chore.id === this.$parent.selectedChoreId;
    },

    selectChore(chore, event) {
      console.log('selectChore called for:', chore.name, 'Current selectedChoreId:', this.$parent.selectedChoreId);
      
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
    },

    handleDragStart(event, chore) {
      this.$parent.draggedChore = chore;
      event.dataTransfer.effectAllowed = 'move';
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
    },

    async handleTrashDrop(event) {
      await this.$parent.handleTrashDrop(event);
    },

    async deleteSelectedChore() {
      if (this.selectedChore && !this.selectedChore.isNewFromQuicklist) {
        this.$parent.choreToDelete = this.selectedChore;
        this.$parent.showDeleteModal = true;
      }
    },

    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    },

    async handleChoreCompletion(chore) {
      await this.$parent.handleChoreCompletion(chore);
    },

    // Utility methods
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
        default: return 'bg-gray-100 text-gray-800';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return '✅ Allowed';
        case 'restricted': return '⚠️ Limited';
        case 'blocked': return '🚫 Blocked';
        default: return '❓ Unknown';
      }
    },

    getCompletedChoresCount(personName) {
      if (!this.choresByPerson[personName]) return 0;
      return this.choresByPerson[personName].filter(chore => chore.completed).length;
    },

    getTotalEarnings() {
      return this.people.reduce((total, person) => total + person.earnings, 0);
    }
  }
});

// Export component for manual registration
window.ChorePageComponent = ChorePage;