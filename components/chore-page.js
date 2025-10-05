// Chore Page Component
const ChorePage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Quicklist Section -->
      <div class="w-full">
        <div class="card bg-base-100 shadow-xl" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6 flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-primary-500')"></div>
            Quicklist
          </h2>
          <p class="text-secondary-custom text-sm mb-4 sm:mb-6 text-center">Tap these common chores to assign them quickly</p>
        
        <!-- Loading state -->
        <div v-if="quicklistLoading" class="text-center py-8 sm:py-12">
          <div class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-primary-600 border-t-transparent"></div>
          <p class="text-secondary-custom mt-2">Loading quicklist...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="quicklistError" class="text-center py-8 sm:py-12" style="color: var(--color-error-700);">
          <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 48, 'mx-auto mb-3')" style="color: var(--color-error-700);"></div>
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
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div
            v-for="quickChore in quicklistChores"
            :key="quickChore.id"
            class="relative group flex items-center gap-3 sm:gap-4 p-4 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer touch-target border-2"
            :class="[
              quickChore.isSelecting ? 'opacity-75 pointer-events-none' : '',
              isQuicklistChoreSelected(quickChore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 border-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-400'
            ]"
            :style="isQuicklistChoreSelected(quickChore) ? 'background-color: var(--color-primary-600);' : 'background-color: var(--color-primary-500); border-color: var(--color-primary-600); box-shadow: var(--shadow-sm);'"
            @click.stop="onQuicklistClick(quickChore, $event)"
            @touchend.stop="onQuicklistClick(quickChore, $event)"
          >
            <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <!-- Remove button (integrated when selected) -->
              <button
                v-if="isQuicklistChoreSelected(quickChore)"
                @click.stop="removeFromQuicklist(quickChore.id)"
                class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2);"
                :class="'hover:scale-105 active:scale-95'"
                title="Remove from quicklist"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white drop-shadow-sm')"></div>
              </button>

              <div
                class="flex items-center justify-center rounded-lg shrink-0 size-12 sm:size-10 text-white bg-white bg-opacity-20"
                v-html="getCategoryIcon(quickChore.category)"
              >
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <p class="text-white text-base sm:text-sm font-medium leading-tight line-clamp-2">{{ quickChore.name }}</p>
                <p v-if="quickChore.amount > 0" class="text-white text-opacity-90 text-sm sm:text-xs mt-1">\${{ quickChore.amount.toFixed(2) }}</p>
              </div>
            </div>
            <span class="text-xs px-2 py-1 rounded-full shrink-0 self-start bg-white bg-opacity-20 text-white">
              {{ getCategoryLabel(quickChore.category) }}
            </span>
          </div>
          
          <!-- Add to Quicklist button -->
          <div class="flex items-center justify-center">
            <button
              @click="openAddToQuicklistModal()"
              class="flex items-center gap-2 btn btn-primary touch-target min-h-[48px] w-full sm:w-auto justify-center"
              title="Add new chore to quicklist"
            >
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
              <span class="text-sm font-medium">Add to Quicklist</span>
            </button>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="text-center py-8 text-secondary-custom">
          <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 48, 'mx-auto mb-3 opacity-50')" class="mx-auto mb-3 opacity-50"></div>
          <p>No quicklist chores yet.</p>
          <p class="text-sm mt-1">Add common chores for quick assignment!</p>
        </div>
        </div>
      </div>
    </div>
      <!-- Unassigned Chores -->
      <div class="w-full">
        <div class="card bg-base-100 shadow-xl" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6 flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 20, 'text-primary-500')"></div>
            Unassigned Chores
          </h2>

          <!-- Inner container for chores -->
          <div
            class="min-h-[120px] sm:min-h-[100px] rounded-lg p-4 sm:p-6 transition-all duration-200"
            style="background-color: var(--color-bg-card);"
            :class="[selectedChore ? 'cursor-pointer hover:shadow-lg hover:scale-102' : '']"
            @click="selectedChore ? assignSelectedChore('unassigned') : null"
          >
            <!-- Empty state when no chores -->
            <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-secondary-custom py-6 flex flex-col items-center justify-center">
              <p class="text-sm px-2">No unassigned chores</p>
              <p class="text-xs mt-2 px-2">Create new chores here - they'll be available for any family member to pick up</p>
            </div>
          
            <!-- Container for chores -->
            <div v-else class="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              <div
                v-for="chore in choresByPerson.unassigned"
                :key="chore.id"
                class="relative flex items-center gap-4 p-4 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer touch-target border-2"
                :class="[
                  chore.isSelecting ? 'opacity-75 pointer-events-none' : '',
                  isChoreSelected(chore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 border-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-400'
                ]"
                :style="isChoreSelected(chore) ? 'background-color: var(--color-primary-600);' : 'background-color: var(--color-primary-500); border-color: var(--color-primary-600); box-shadow: var(--shadow-sm);'"
                @click.stop="selectChore(chore, $event)"
                @touchend.stop="selectChore(chore, $event)"
              >
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 size-14 sm:size-12 text-white bg-white bg-opacity-20"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>
                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-2">
                      <p class="text-white text-base sm:text-base font-medium leading-normal line-clamp-2">{{ chore.name }}</p>
                      <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0 bg-white bg-opacity-20 text-white">
                        {{ getCategoryLabel(chore.category) }}
                      </span>
                    </div>
                    <p v-if="chore.details" class="text-white text-opacity-80 text-sm font-normal leading-normal mb-1">{{ chore.details }}</p>
                    <p v-if="chore.amount > 0" class="text-white text-opacity-90 text-sm font-normal leading-normal">\${{ chore.amount.toFixed(2) }}</p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      @click.stop="deleteChore(chore)"
                      class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                      style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                      :class="'hover:scale-105 active:scale-95'"
                      title="Delete chore"
                    >
                      <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 18, 'text-white drop-shadow-sm')"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          
          <!-- Add new chore button -->
          <div class="flex items-center justify-center">
            <button
              @click="openAddChoreModal()"
              class="flex items-center gap-2 btn btn-primary touch-target min-h-[48px] w-full sm:w-auto justify-center"
              title="Add new chore to unassigned"
            >
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
              <span class="text-sm font-medium">Add New Chore</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      

      <!-- Family Members & Assigned Chores -->
      <div class="w-full">
        <div class="card bg-base-100 shadow-xl" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6 flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('users', 'lucide', 20, 'text-primary-500')"></div>
            Family Members
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="person in people"
            :key="person.id"
            class="family-card border-2 rounded-xl p-4 sm:p-6 transition-all duration-200 shadow-lg hover:shadow-xl"
            :class="[
              selectedChore ? 'cursor-pointer hover:scale-102' : ''
            ]"
            style="border-color: var(--color-border-card);"
            @click="selectedChore ? assignSelectedChore(person.name) : null"
          >
            <!-- Person header -->
            <div class="flex items-center justify-between mb-4 sm:mb-6">
              <div class="flex items-center gap-3">
                <div class="avatar family-avatar text-white bg-gradient-to-br from-primary-500 to-primary-600 text-lg sm:text-xl">
                  {{ person.name.charAt(0) }}
                </div>
                <div>
                  <h3 class="font-bold text-primary-custom text-lg sm:text-xl">{{ person.name }}</h3>
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
            <div class="space-y-3 sm:space-y-4 min-h-[60px]">
              <div v-if="choresByPerson[person.name] && choresByPerson[person.name].length === 0" class="text-center py-4 sm:py-6 text-secondary-custom">
                <p class="text-sm">No chores assigned</p>
                <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
              </div>

              <div
                v-for="chore in choresByPerson[person.name]"
                :key="chore.id"
                class="relative flex items-center gap-4 p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer touch-target border-2"
                :class="[
                  chore.isSelecting ? 'opacity-75 pointer-events-none' : '',
                  isChoreSelected(chore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 border-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-400'
                ]"
                :style="isChoreSelected(chore) ? 'background-color: var(--color-primary-600);' : 'background-color: var(--color-primary-500); border-color: var(--color-primary-600); box-shadow: var(--shadow-sm);'"
                @click.stop="selectChore(chore, $event)"
              >
                <!-- Completion + approval UI -->
                <div class="shrink-0 flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="chore.completed"
                    @click.stop
                    @change="handleChoreCompletionToggle(chore, $event)"
                    class="w-5 h-5 sm:w-4 sm:h-4 rounded focus:outline-none focus:ring-2 focus:ring-success-600 focus:ring-offset-2 touch-target"
                    :class="chore.completed ? 'text-success-600' : 'text-gray-400'"
                  >
                  <button
                    v-if="$parent.currentUser?.role === 'parent' && chore.isPendingApproval"
                    @click.stop="$parent.approveChore(chore)"
                    class="btn btn-success btn-sm"
                  >Approve</button>
                </div>

                <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 size-12 sm:size-10 text-white bg-white bg-opacity-20"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>
                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-1">
                      <p
                        :class="chore.completed ? 'line-through text-white opacity-60' : 'text-white'"
                        class="text-sm sm:text-base font-medium leading-normal line-clamp-2"
                      >
                        {{ chore.name }}
                      </p>
                      <span class="text-xs px-2 py-1 rounded-full self-start sm:self-center shrink-0 bg-white bg-opacity-20 text-white">
                        {{ getCategoryLabel(chore.category) }}
                      </span>
                    </div>
                    <p v-if="chore.details" :class="chore.completed ? 'text-white opacity-50' : 'text-white text-opacity-80'" class="text-xs sm:text-sm font-normal leading-normal mb-1">
                      {{ chore.details }}
                    </p>
                    <p v-if="chore.amount > 0" :class="chore.completed ? 'text-white opacity-50' : 'text-white text-opacity-90'" class="text-xs sm:text-sm font-normal leading-normal">
                      \${{ chore.amount.toFixed(2) }}
                    </p>
                    <div v-if="chore.isPendingApproval" class="mt-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded" style="background: var(--color-warning-50); color: var(--color-warning-700);">
                      <span>Pending approval</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      @click.stop="deleteChore(chore)"
                      class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 touch-target rounded-md"
                      style="background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); width: 40px; height: 40px;"
                      :class="'hover:scale-105 active:scale-95'"
                      title="Delete chore"
                    >
                      <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 18, 'text-white drop-shadow-sm')"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>



      <!-- Earnings Summary -->
      <div class="w-full">
        <div class="card bg-base-100 shadow-xl" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] mb-4 sm:mb-6 flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('dollarSign', 'lucide', 20, 'text-primary-500')"></div>
            Earnings Summary
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div
              v-for="person in people"
              :key="person.id"
              class="earnings-card border-2 rounded-xl p-4 sm:p-6 cursor-pointer hover:shadow-xl hover:scale-102 transition-all duration-200 touch-target shadow-lg"
              style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
              @click="openSpendModal(person)"
              @touchend="openSpendModal(person)"
            >
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <h3 class="font-bold text-white text-lg sm:text-xl">{{ person.displayName || person.name }}</h3>
                  <p class="text-sm text-white text-opacity-90">Total Earnings</p>
                  <p class="text-xs text-white text-opacity-80 mt-1">
                    {{ person.completedChores || 0 }} chores completed
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-3xl sm:text-4xl font-bold text-white">\${{ person.earnings.toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'loading', 'error', 'Helpers',
    'showAddChoreModal', 'showAddToQuicklistModal',
    'handleChoreClick', 'handleQuicklistChoreClick', 'selectionStore'
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
    openAddToQuicklistModal() {
      const fn = this.$parent?.openAddToQuicklistModal || this.openAddToQuicklistModal;
      if (typeof fn === 'function') fn();
    },
    openAddChoreModal() {
      const fn = this.$parent?.openAddChoreModal || this.openAddChoreModal;
      if (typeof fn === 'function') fn();
    },
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
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
    },

    isQuicklistChoreSelected(quickChore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, quickChore) || false;
    },

    selectChore(chore, event) {
      // Prevent double-handling of touch events
      if (event && (event.type === 'touchend' || event.type === 'touchstart')) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Prevent rapid successive selections
      if (chore.isSelecting) return;
      chore.isSelecting = true;

      try {
        // Allow cross-assignment if:
        // 1. There's a currently selected chore
        // 2. The target chore has an assignee
        if (this.$parent.selectedChore &&
            this.$parent.selectedChoreId !== chore.id &&
            chore.assignedTo &&
            chore.assignedTo !== 'unassigned') {

          // Cross-assign the currently selected chore to the person who has the target chore
          this.assignSelectedChore(chore.assignedTo);
          // Clear any current selection since we're not selecting the target chore
          this.$parent.selectedChoreId = null;
          this.$parent.selectedQuicklistChore = null;
          return;
        }

        const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') {
          handler(chore);
        } else {
          console.warn('handleChoreClick not available');
        }

        this.$nextTick(() => {
          this.$forceUpdate();
          this.forceRepaintOnMobile();
        });
      } finally {
        // Reset the selecting flag after a short delay
        setTimeout(() => {
          chore.isSelecting = false;
        }, 100);
      }
    },

    onQuicklistClick(quickChore, event) {
      // Prevent double-handling of touch events
      if (event && (event.type === 'touchend' || event.type === 'touchstart')) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Prevent rapid successive selections
      if (quickChore.isSelecting) return;
      quickChore.isSelecting = true;

      try {
        const handler = this.selectionStore?.selectQuicklist || this.handleQuicklistChoreClick || this.$parent?.handleQuicklistChoreClick;
        if (typeof handler === 'function') {
          handler(quickChore);
        } else {
          console.warn('handleQuicklistChoreClick not available');
        }
      } finally {
        // Reset the selecting flag after a short delay
        setTimeout(() => {
          quickChore.isSelecting = false;
        }, 100);
      }
    },

    async deleteSelectedChore() {
      if (this.selectedChore) {
        await this.$parent.deleteChore(this.selectedChore);
      }
    },

    async deleteChore(chore) {
      if (chore) {
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
      // Prevent event propagation
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

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
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },

    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'badge badge-success';
        case 'restricted': return 'badge badge-warning';
        case 'blocked': return 'badge badge-error';
        default: return 'badge badge-success';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed'; // Default to allowed if status is undefined/unknown
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
