// Shoelace Chores Page Component
const ShoelaceChorePage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Page Header with Toggle -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-primary-custom flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 24, 'text-primary-500')"></div>
          Chores (Shoelace Version)
        </h1>
        <sl-button variant="outline" @click="switchToOriginal">
          <div v-html="Helpers.IconLibrary.getIcon('arrowLeft', 'lucide', 16)"></div>
          Back to Original
        </sl-button>
      </div>

      <!-- Quicklist Section -->
      <div class="w-full">
        <sl-card class="quicklist-section">
          <div slot="header" class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-primary-500')"></div>
              Quicklist
            </h2>
            <sl-button variant="primary" size="small" @click="openAddToQuicklistModal">
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16)"></div>
              Add to Quicklist
            </sl-button>
          </div>

          <div slot="content">
            <p class="text-secondary-custom text-sm mb-4 text-center">Tap these common chores to assign them quickly</p>

            <!-- Loading state -->
            <div v-if="quicklistLoading" class="text-center py-8">
              <sl-spinner></sl-spinner>
              <p class="text-secondary-custom mt-2">Loading quicklist...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="quicklistError" class="text-center py-8" style="color: var(--color-error-700);">
              <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 48, 'mx-auto mb-3')" style="color: var(--color-error-700);"></div>
              <p class="font-medium">Error loading quicklist</p>
              <p class="text-sm mt-1">{{ quicklistError }}</p>
              <sl-button variant="outline" @click="loadQuicklistChores" class="mt-3">
                Try Again
              </sl-button>
            </div>

            <!-- Quicklist grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <sl-card
                v-for="quickChore in quicklistChores"
                :key="quickChore.id"
                class="quicklist-chore-card cursor-pointer transition-all duration-200"
                :class="[
                  quickChore.isSelecting ? 'opacity-75' : '',
                  isQuicklistChoreSelected(quickChore) ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md hover:-translate-y-1'
                ]"
                @click="onQuicklistClick(quickChore, $event)"
              >
                <div slot="header" class="flex items-center gap-3">
                  <div class="category-icon flex items-center justify-center rounded-lg size-10 text-white bg-white bg-opacity-20 shrink-0">
                    <div v-html="getCategoryIcon(quickChore.category)"></div>
                  </div>
                  <div class="flex flex-col flex-1 min-w-0">
                    <h3 class="font-medium text-sm leading-tight line-clamp-2">{{ quickChore.name }}</h3>
                    <div v-if="quickChore.amount > 0" class="text-xs opacity-90 mt-1">\${{ quickChore.amount.toFixed(2) }}</div>
                  </div>
                  <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(quickChore.category) }}</sl-badge>
                </div>

                <div slot="footer" class="flex justify-end">
                  <sl-button
                    v-if="isQuicklistChoreSelected(quickChore)"
                    variant="danger"
                    size="small"
                    @click.stop="removeFromQuicklist(quickChore.id)"
                  >
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14)"></div>
                    Remove
                  </sl-button>
                </div>
              </sl-card>

              <!-- Add button -->
              <sl-card class="add-quicklist-card border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors cursor-pointer" @click="openAddToQuicklistModal">
                <div class="flex flex-col items-center justify-center h-full text-center p-4">
                  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 24, 'text-gray-400')"></div>
                  <p class="text-sm text-gray-500 mt-2">Add to Quicklist</p>
                </div>
              </sl-card>
            </div>

            <!-- Empty state -->
            <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="text-center py-8 text-secondary-custom">
              <div v-html="Helpers.IconLibrary.getIcon('minus', 'lucide', 48, 'mx-auto mb-3 opacity-50')"></div>
              <p>No quicklist chores yet.</p>
              <p class="text-sm mt-1">Add common chores for quick assignment!</p>
            </div>
          </div>
        </sl-card>
      </div>

      <!-- Unassigned Chores -->
      <div class="w-full">
        <sl-card class="unassigned-section">
          <div slot="header" class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 20, 'text-primary-500')"></div>
              Unassigned Chores
            </h2>
            <sl-button variant="primary" @click="openAddChoreModal">
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16)"></div>
              Add New Chore
            </sl-button>
          </div>

          <div slot="content">
            <!-- Empty state when no chores -->
            <div v-if="choresByPerson.unassigned.length === 0" class="text-center py-8 text-secondary-custom">
              <p class="text-sm">No unassigned chores</p>
              <p class="text-xs mt-2">Create new chores here - they'll be available for any family member to pick up</p>
            </div>

            <!-- Unassigned chores list -->
            <div v-else class="space-y-3">
              <sl-card
                v-for="chore in choresByPerson.unassigned"
                :key="chore.id"
                class="unassigned-chore-card cursor-pointer transition-all duration-200"
                :class="[
                  chore.isSelecting ? 'opacity-75' : '',
                  isChoreSelected(chore) ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md hover:-translate-y-1'
                ]"
                @click="selectChore(chore, $event)"
              >
                <div slot="header" class="flex items-center gap-3">
                  <div class="category-icon flex items-center justify-center rounded-lg size-12 text-white bg-white bg-opacity-20 shrink-0">
                    <div v-html="getCategoryIcon(chore.category)"></div>
                  </div>
                  <div class="flex flex-col flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="font-medium flex-1">{{ chore.name }}</h3>
                      <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(chore.category) }}</sl-badge>
                    </div>
                  </div>
                </div>

                <div slot="content">
                  <p v-if="chore.details" class="text-sm opacity-80 mb-2">{{ chore.details }}</p>
                  <div v-if="chore.amount > 0" class="text-sm font-medium">\${{ chore.amount.toFixed(2) }}</div>
                </div>

                <div slot="footer" class="flex justify-end">
                  <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                    <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14)"></div>
                    Delete
                  </sl-button>
                </div>
              </sl-card>
            </div>
          </div>
        </sl-card>
      </div>

      <!-- Family Members & Assigned Chores -->
      <div class="w-full">
        <sl-card class="family-section">
          <div slot="header">
            <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('users', 'lucide', 20, 'text-primary-500')"></div>
              Family Members
            </h2>
          </div>

          <div slot="content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <sl-card
                v-for="person in people"
                :key="person.id"
                class="family-member-card"
                :class="selectedChore ? 'cursor-pointer' : ''"
                @click="selectedChore ? assignSelectedChore(person.name) : null"
              >
                <div slot="header" class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="family-avatar rounded-full size-12 flex items-center justify-center font-bold text-white bg-gradient-to-br from-primary-500 to-primary-600 text-lg">
                      {{ person.name.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="font-semibold text-lg">{{ person.name }}</h3>
                      <div class="flex items-center gap-2 mt-1">
                        <sl-badge
                          :variant="getElectronicsStatusVariant(person.electronicsStatus.status)"
                          size="small"
                        >
                          {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                        </sl-badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div slot="content">
                  <!-- Person's chores -->
                  <div class="space-y-3 min-h-[60px]">
                    <div v-if="choresByPerson[person.name] && choresByPerson[person.name].length === 0" class="text-center py-4 text-secondary-custom">
                      <p class="text-sm">No chores assigned</p>
                      <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
                    </div>

                    <sl-card
                      v-for="chore in choresByPerson[person.name]"
                      :key="chore.id"
                      class="assigned-chore-card cursor-pointer transition-all duration-200"
                      :class="[
                        chore.isSelecting ? 'opacity-75' : '',
                        isChoreSelected(chore) ? 'ring-2 ring-primary-500 shadow-lg' : 'hover:shadow-md hover:-translate-y-1'
                      ]"
                      @click="selectChore(chore, $event)"
                    >
                      <div slot="header" class="flex items-center gap-3">
                        <sl-checkbox
                          :checked="chore.completed"
                          @sl-change="handleChoreCompletionToggle(chore, $event)"
                          @click.stop
                          size="small"
                        ></sl-checkbox>

                        <div class="category-icon flex items-center justify-center rounded-lg size-10 text-white bg-white bg-opacity-20 shrink-0">
                          <div v-html="getCategoryIcon(chore.category)"></div>
                        </div>

                        <div class="flex flex-col flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <h4 :class="chore.completed ? 'line-through opacity-60' : ''" class="font-medium flex-1">
                              {{ chore.name }}
                            </h4>
                            <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(chore.category) }}</sl-badge>
                          </div>
                        </div>
                      </div>

                      <div slot="content">
                        <p v-if="chore.details" :class="chore.completed ? 'opacity-50' : 'opacity-80'" class="text-sm mb-2">
                          {{ chore.details }}
                        </p>
                        <div v-if="chore.amount > 0" :class="chore.completed ? 'opacity-50' : ''" class="text-sm font-medium">
                          \${{ chore.amount.toFixed(2) }}
                        </div>
                        <sl-badge v-if="chore.isPendingApproval" variant="warning" size="small" class="mt-2">
                          Pending approval
                        </sl-badge>
                      </div>

                      <div slot="footer" class="flex items-center justify-between">
                        <sl-button
                          v-if="$parent.currentUser?.role === 'parent' && chore.isPendingApproval"
                          variant="success"
                          size="small"
                          @click.stop="$parent.approveChore(chore)"
                        >
                          Approve
                        </sl-button>

                        <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                          <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 14)"></div>
                          Delete
                        </sl-button>
                      </div>
                    </sl-card>
                  </div>
                </div>
              </sl-card>
            </div>
          </div>
        </sl-card>
      </div>

      <!-- Earnings Summary -->
      <div class="w-full">
        <sl-card class="earnings-section">
          <div slot="header">
            <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('dollarSign', 'lucide', 20, 'text-primary-500')"></div>
              Earnings Summary
            </h2>
          </div>

          <div slot="content">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <sl-card
                v-for="person in people"
                :key="person.id"
                class="earnings-card cursor-pointer hover:shadow-lg transition-all duration-200"
                @click="openSpendModal(person)"
              >
                <div slot="header" class="flex items-center justify-between">
                  <h3 class="font-semibold">{{ person.displayName || person.name }}</h3>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-primary-600">\${{ person.earnings.toFixed(2) }}</p>
                    <p class="text-xs opacity-75">{{ person.completedChores || 0 }} chores completed</p>
                  </div>
                </div>
              </sl-card>
            </div>
          </div>
        </sl-card>
      </div>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'loading', 'error', 'Helpers',
    'showAddChoreModal', 'showAddToQuicklistModal',
    'handleChoreClick', 'handleQuicklistChoreClick', 'selectionStore',
    'currentChorePage'
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
    // Navigation methods
    switchToOriginal() {
      // Call parent method to switch back to original page
      this.$parent.toggleChorePageVersion();
    },

    // Modal methods
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

    // Chore selection methods
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
    },

    isQuicklistChoreSelected(quickChore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, quickChore) || false;
    },

    selectChore(chore, event) {
      if (event && (event.type === 'touchend' || event.type === 'touchstart')) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (chore.isSelecting) return;
      chore.isSelecting = true;

      try {
        // Allow cross-assignment if there's a currently selected chore
        if (this.$parent.selectedChore &&
            this.$parent.selectedChoreId !== chore.id &&
            chore.assignedTo &&
            chore.assignedTo !== 'unassigned') {

          this.assignSelectedChore(chore.assignedTo);
          this.$parent.selectedChoreId = null;
          this.$parent.selectedQuicklistChore = null;
          return;
        }

        const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') {
          handler(chore);
        }
      } finally {
        setTimeout(() => {
          chore.isSelecting = false;
        }, 100);
      }
    },

    onQuicklistClick(quickChore, event) {
      if (event && (event.type === 'touchend' || event.type === 'touchstart')) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (quickChore.isSelecting) return;
      quickChore.isSelecting = true;

      try {
        const handler = this.selectionStore?.selectQuicklist || this.handleQuicklistChoreClick || this.$parent?.handleQuicklistChoreClick;
        if (typeof handler === 'function') {
          handler(quickChore);
        }
      } finally {
        setTimeout(() => {
          quickChore.isSelecting = false;
        }, 100);
      }
    },

    // Chore action methods
    async deleteChore(chore) {
      if (chore) {
        await this.$parent.deleteChore(chore);
      }
    },

    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    },

    async handleChoreCompletionToggle(chore, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      chore.completed = event.target.checked;
      await this.$parent.handleChoreCompletion(chore);
    },

    // Utility methods
    getCategoryIcon(category) {
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },

    getElectronicsStatusVariant(status) {
      switch(status) {
        case 'allowed': return 'success';
        case 'restricted': return 'warning';
        case 'blocked': return 'danger';
        default: return 'success';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    },

    openSpendModal(person) {
      if (this.$parent.openSpendingModal) {
        this.$parent.openSpendingModal(person);
      }
    }
  }
});

// Export component for manual registration
window.ShoelaceChorePageComponent = ShoelaceChorePage;
