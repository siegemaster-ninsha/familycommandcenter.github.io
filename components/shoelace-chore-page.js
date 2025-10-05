// Shoelace Chores Page Component - Modern, Reactive Implementation
const ShoelaceChorePage = Vue.defineComponent({
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

        <!-- Page Header & Quicklist Section -->
        <div class="w-full">
          <!-- Page Title and Stats -->
          <div class="mb-8">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-4">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75"></div>
                  <div class="relative bg-white dark:bg-slate-800 p-3 rounded-lg">
                    <div v-html="Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 24, 'text-blue-600 dark:text-blue-400')"></div>
                  </div>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Chores</h1>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Modern Shoelace Interface</p>
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="hidden sm:flex items-center gap-4 text-sm">
                <div class="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 14, 'text-blue-600 dark:text-blue-400')"></div>
                  <span class="font-medium text-blue-700 dark:text-blue-300">{{ quicklistChores.length }}</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <div v-html="Helpers.IconLibrary.getIcon('users', 'lucide', 14, 'text-green-600 dark:text-green-400')"></div>
                  <span class="font-medium text-green-700 dark:text-green-300">{{ people.length }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quicklist Section - Modern Design -->
          <sl-card class="quicklist-section shadow-xl">
            <div slot="header" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-75"></div>
                  <div class="relative bg-white dark:bg-slate-800 p-2 rounded-lg">
                    <div v-html="Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-yellow-600 dark:text-yellow-400')"></div>
                  </div>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-slate-900 dark:text-white">Quicklist</h2>
                  <p class="text-sm text-slate-600 dark:text-slate-400">Quick access to common chores</p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <sl-button variant="outline" size="small" @click="toggleSelectionMode" :disabled="quicklistChores.length === 0">
                  <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 16)"></div>
                  {{ selectionMode ? 'Cancel' : 'Select' }}
                </sl-button>
                <sl-button variant="primary" size="small" @click="openAddToQuicklistModal">
                  <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16)"></div>
                  Add
                </sl-button>
              </div>
            </div>

            <div slot="content" class="p-6">
              <!-- Selection mode indicator -->
              <div v-if="selectionMode" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div class="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <div v-html="Helpers.IconLibrary.getIcon('info', 'lucide', 16, 'text-blue-600 dark:text-blue-400')"></div>
                  <span>{{ selectedChores.size }} chore{{ selectedChores.size !== 1 ? 's' : '' }} selected</span>
                </div>
              </div>

              <!-- Loading state -->
              <div v-if="quicklistLoading" class="flex flex-col items-center justify-center py-12">
                <sl-spinner style="--size: 48px; --track-width: 4px;"></sl-spinner>
                <p class="text-slate-600 dark:text-slate-400 mt-4 animate-pulse">Loading quicklist...</p>
              </div>

              <!-- Error state -->
              <div v-else-if="quicklistError" class="flex flex-col items-center justify-center py-12 text-center">
                <div class="relative mb-4">
                  <div class="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full blur opacity-75"></div>
                  <div class="relative bg-white dark:bg-slate-800 p-4 rounded-full">
                    <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 24, 'text-red-600 dark:text-red-400')"></div>
                  </div>
                </div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Failed to Load</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-4 max-w-md">{{ quicklistError }}</p>
                <sl-button variant="outline" @click="loadQuicklistChores">
                  <div v-html="Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 16)"></div>
                  Try Again
                </sl-button>
              </div>

              <!-- Quicklist grid - Modern responsive layout -->
              <div v-else class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <sl-card
                  v-for="quickChore in quicklistChores"
                  :key="quickChore.id"
                  class="quicklist-chore-card cursor-pointer transition-all duration-300 group"
                  :class="[
                    'transform hover:scale-105 hover:shadow-xl',
                    quickChore.isSelecting ? 'opacity-50 scale-95' : '',
                    isQuicklistChoreSelected(quickChore) ? 'ring-2 ring-blue-500 shadow-lg scale-105' : '',
                    selectionMode && selectedChores.has(quickChore.id) ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''
                  ]"
                  @click="selectionMode ? toggleChoreSelection(quickChore.id) : selectQuicklistChore(quickChore, $event)"
                >
                  <div slot="header" class="flex items-center gap-3 p-4">
                    <!-- Selection checkbox (only in selection mode) -->
                    <sl-checkbox
                      v-if="selectionMode"
                      :checked="selectedChores.has(quickChore.id)"
                      @sl-change="toggleChoreSelection(quickChore.id)"
                      @click.stop
                      size="small"
                      class="mr-2"
                    ></sl-checkbox>

                    <div class="relative">
                      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                      <div class="relative bg-white dark:bg-slate-800 p-2 rounded-lg">
                        <div v-html="getCategoryIcon(quickChore.category)"></div>
                      </div>
                    </div>

                    <div class="flex flex-col flex-1 min-w-0">
                      <h3 class="font-semibold text-sm leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                        {{ quickChore.name }}
                      </h3>
                      <div v-if="quickChore.amount > 0" class="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                        {{ '$' + quickChore.amount.toFixed(2) }}
                      </div>
                    </div>

                    <sl-badge
                      variant="neutral"
                      size="small"
                      class="shrink-0"
                    >
                      {{ getCategoryLabel(quickChore.category) }}
                    </sl-badge>
                  </div>

                  <div slot="footer" class="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50">
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      {{ isQuicklistChoreSelected(quickChore) ? 'Selected' : 'Click to assign' }}
                    </div>
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

                <!-- Modern Add button -->
                <sl-card
                  class="add-quicklist-card border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer group"
                  @click="openAddToQuicklistModal"
                >
                  <div class="flex flex-col items-center justify-center h-full text-center p-6">
                    <div class="relative mb-3">
                      <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                      <div class="relative bg-white dark:bg-slate-800 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 24, 'text-blue-600 dark:text-blue-400')"></div>
                      </div>
                    </div>
                    <p class="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      Add to Quicklist
                    </p>
                  </div>
                </sl-card>
              </div>

              <!-- Modern empty state -->
              <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="flex flex-col items-center justify-center py-16 text-center">
                <div class="relative mb-6">
                  <div class="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur opacity-75"></div>
                  <div class="relative bg-white dark:bg-slate-800 p-6 rounded-full">
                    <div v-html="Helpers.IconLibrary.getIcon('sparkles', 'lucide', 32, 'text-slate-600 dark:text-slate-400')"></div>
                  </div>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Start Building Your Quicklist</h3>
                <p class="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                  Add commonly used chores here for faster assignment. Perfect for daily routines and frequent tasks.
                </p>
                <sl-button variant="primary" @click="openAddToQuicklistModal">
                  <div v-html="Helpers.IconLibrary.getIcon('plus-circle', 'lucide', 16)"></div>
                  Add Your First Chore
                </sl-button>
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
                  <div v-if="chore.amount > 0" class="text-sm font-medium">{{ '$' + chore.amount.toFixed(2) }}</div>
                </div>

                <div slot="footer" class="flex justify-end">
                  <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                    <div v-html="Helpers.IconLibrary.getIcon('trash-2', 'lucide', 14)"></div>
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
                      style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"
                      @click="selectChore(chore, $event)"
                    >
                      <div slot="header" class="p-4">
                        <div class="flex items-center justify-between mb-3">
                          <div v-if="chore.amount > 0" class="text-lg font-bold text-white">
                            {{ '$' + chore.amount.toFixed(2) }}
                          </div>
                          <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                            <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 16)"></div>
                          </sl-button>
                        </div>

                        <div class="flex items-center gap-3">
                          <!-- Video game controller icon for Electronics chores -->
                          <div v-if="chore.category === 'game'" class="shrink-0">
                            <div v-html="Helpers.IconLibrary.getIcon('gamepad-2', 'lucide', 20, 'text-white')"></div>
                          </div>

                          <h4 :class="chore.completed ? 'line-through opacity-60' : ''" class="font-medium text-white flex-1">
                            {{ chore.name }}
                          </h4>
                        </div>
                      </div>

                      <div slot="footer" class="p-3 bg-slate-50 dark:bg-slate-800/50">
                        <sl-button
                          variant="success"
                          size="small"
                          class="w-full"
                          @click.stop="handleChoreCompletionToggle(chore, $event)"
                        >
                          Mark Complete
                        </sl-button>

                        <sl-badge v-if="chore.isPendingApproval" variant="warning" size="small" class="mt-2 w-full justify-center">
                          Pending approval
                        </sl-badge>
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
                    <p class="text-2xl font-bold text-primary-600">{{ '$' + person.earnings.toFixed(2) }}</p>
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
    'handleChoreClick', 'handleQuicklistChoreClick', 'selectionStore'
  ],
  data() {
    return {
      quicklistLoading: false,
      quicklistError: null,
      // Enhanced selection state management
      selectionMode: false,
      selectedChores: new Set(),
      lastSelectedChore: null
    }
  },
  async mounted() {
    await this.loadQuicklistChores();
  },
  methods: {
    // Navigation methods
    switchToOriginal() {
      this.$parent.setCurrentPage('chores');
    },

    // Enhanced selection methods
    toggleSelectionMode() {
      this.selectionMode = !this.selectionMode;
      if (!this.selectionMode) {
        this.selectedChores.clear();
      }
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

    selectQuicklistChore(quickChore, event) {
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
        await this.$parent.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST + '/' + quicklistId, {
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

      // Toggle the completion status
      chore.completed = !chore.completed;
      await this.$parent.handleChoreCompletion(chore);
    },

    // Utility methods
    getCategoryIcon(category) {
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },

    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },


    openSpendModal(person) {
      if (this.$parent.openSpendingModal) {
        this.$parent.openSpendingModal(person);
      }
    },

    // Selection management methods
    toggleChoreSelection(choreId) {
      if (this.selectedChores.has(choreId)) {
        this.selectedChores.delete(choreId);
      } else {
        this.selectedChores.add(choreId);
      }
      this.$forceUpdate(); // Trigger reactivity for visual updates
    },

  }
});

// Export component for manual registration
window.ShoelaceChorePageComponent = ShoelaceChorePage;
