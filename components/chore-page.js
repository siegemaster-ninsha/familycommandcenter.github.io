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
          <sl-card
            v-for="quickChore in quicklistChores"
            :key="quickChore.id"
            class="quicklist-chore-card transition-all duration-200 cursor-pointer touch-target"
            :class="[
              quickChore.isSelecting ? 'opacity-75 pointer-events-none' : '',
              isQuicklistChoreSelected(quickChore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 ring-2 ring-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5'
            ]"
            style="--background-color: var(--color-primary-500); --border-color: var(--color-primary-600);"
            @click.stop="onQuicklistClick(quickChore, $event)"
            @touchend.stop="onQuicklistClick(quickChore, $event)"
          >
            <div slot="header" class="flex items-center gap-3 p-1">
              <div
                class="flex items-center justify-center rounded-lg shrink-0 size-10 text-white bg-white bg-opacity-20"
                v-html="getCategoryIcon(quickChore.category)"
              >
              </div>
              <div class="flex flex-col flex-1 min-w-0">
                <h3 class="chore-name">{{ quickChore.name }}</h3>
                <div v-if="quickChore.amount > 0" class="chore-amount">\${{ quickChore.amount.toFixed(2) }}</div>
              </div>
              <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(quickChore.category) }}</sl-badge>
            </div>

            <div slot="footer" class="flex justify-end p-2 pt-0">
              <sl-button
                v-if="isQuicklistChoreSelected(quickChore)"
                variant="danger"
                size="small"
                @click.stop="removeFromQuicklist(quickChore.id)"
                title="Remove from quicklist"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white')"></div>
                Remove
              </sl-button>
            </div>
          </sl-card>
          
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
              <sl-card
                v-for="chore in choresByPerson.unassigned"
                :key="chore.id"
                class="unassigned-chore-card transition-all duration-200 cursor-pointer touch-target"
                :class="[
                  chore.isSelecting ? 'opacity-75 pointer-events-none' : '',
                  isChoreSelected(chore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 ring-2 ring-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5'
                ]"
                style="--background-color: var(--color-primary-500); --border-color: var(--color-primary-600);"
                @click.stop="selectChore(chore, $event)"
                @touchend.stop="selectChore(chore, $event)"
              >
                <div slot="header" class="flex items-center gap-3 p-1">
                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 size-12 text-white bg-white bg-opacity-20"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>
                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="chore-name flex-1">{{ chore.name }}</h3>
                      <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(chore.category) }}</sl-badge>
                    </div>
                  </div>
                </div>

                <div slot="content" class="p-1 pb-2">
                  <p v-if="chore.details" class="chore-details mb-2">{{ chore.details }}</p>
                  <div v-if="chore.amount > 0" class="chore-amount">\${{ chore.amount.toFixed(2) }}</div>
                </div>

                <div slot="footer" class="flex justify-end p-2 pt-0">
                  <sl-button
                    variant="danger"
                    size="small"
                    @click.stop="deleteChore(chore)"
                    title="Delete chore"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white')"></div>
                    Delete
                  </sl-button>
                </div>
              </sl-card>
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

              <sl-card
                v-for="chore in choresByPerson[person.name]"
                :key="chore.id"
                class="assigned-chore-card transition-all duration-200 cursor-pointer touch-target"
                :class="[
                  chore.isSelecting ? 'opacity-75 pointer-events-none' : '',
                  isChoreSelected(chore) ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 ring-2 ring-blue-400' : 'hover:shadow-lg hover:-translate-y-0.5'
                ]"
                style="--background-color: var(--color-primary-500); --border-color: var(--color-primary-600);"
                @click.stop="selectChore(chore, $event)"
              >
                <div slot="header" class="flex items-center gap-3 p-1">
                  <sl-checkbox
                    :checked="chore.completed"
                    @sl-change="handleChoreCompletionToggle(chore, $event)"
                    @click.stop
                    size="small"
                  ></sl-checkbox>

                  <div
                    class="flex items-center justify-center rounded-lg shrink-0 size-10 text-white bg-white bg-opacity-20"
                    v-html="getCategoryIcon(chore.category)"
                  >
                  </div>

                  <div class="flex flex-col justify-center min-w-0 flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 :class="chore.completed ? 'completed' : ''" class="chore-name flex-1">
                        {{ chore.name }}
                      </h3>
                      <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(chore.category) }}</sl-badge>
                    </div>
                  </div>
                </div>

                <div slot="content" class="p-1 pb-2">
                  <p v-if="chore.details" :class="chore.completed ? 'completed' : ''" class="chore-details mb-2">
                    {{ chore.details }}
                  </p>
                  <div v-if="chore.amount > 0" :class="chore.completed ? 'completed' : ''" class="chore-amount">
                    \${{ chore.amount.toFixed(2) }}
                  </div>
                  <div v-if="chore.isPendingApproval" class="pending-approval mt-2">
                    Pending approval
                  </div>
                </div>

                <div slot="footer" class="flex items-center justify-between p-2 pt-0">
                  <sl-button
                    v-if="$parent.currentUser?.role === 'parent' && chore.isPendingApproval"
                    variant="success"
                    size="small"
                    @click.stop="$parent.approveChore(chore)"
                  >
                    Approve
                  </sl-button>

                  <sl-button
                    variant="danger"
                    size="small"
                    @click.stop="deleteChore(chore)"
                    title="Delete chore"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14, 'text-white')"></div>
                    Delete
                  </sl-button>
                </div>
              </sl-card>
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
