// ShoelaceQuicklistSection Component - Handles the quicklist functionality for Shoelace UI
const ShoelaceQuicklistSection = Vue.defineComponent({
  components: {
    'loading-spinner': window.LoadingSpinnerComponent,
    'error-state': window.ErrorStateComponent,
    'empty-state': window.EmptyStateComponent,
    'icon-container': window.IconContainerComponent
  },
  template: `
    <sl-card class="quicklist-section shadow-xl">
      <template #header>
        <div class="flex items-center justify-between">
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
            <sl-button variant="outline" size="small" @click="toggleSelectionMode" :disabled="isQuicklistEmpty()">
              <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 16)"></div>
              {{ getSelectionButtonText() }}
            </sl-button>
            <sl-button variant="primary" size="small" @click="openAddToQuicklistModal">
              <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16)"></div>
              Add
            </sl-button>
          </div>
        </div>
      </template>

      <!-- Selection mode indicator -->
      <div v-if="selectionMode" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('info', 'lucide', 16, 'text-blue-600 dark:text-blue-400')"></div>
          <span>{{ getSelectedChoresText() }}</span>
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
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <sl-card
          v-for="quickChore in quicklistChores"
          :key="quickChore.id"
          class="quicklist-chore-card cursor-pointer transition-all duration-300 group"
          :class="getQuicklistCardClasses(quickChore)"
          :aria-selected="isQuicklistChoreSelected(quickChore)"
          role="option"
          @click="handleQuicklistCardClick(quickChore, $event)"
        >
          <template #header>
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
                {{ formatAmount(quickChore.amount) }}
              </div>
            </div>

            <sl-badge variant="neutral" size="small" class="shrink-0">
              {{ getCategoryLabel(quickChore.category) }}
            </sl-badge>
          </template>

          <template #footer>
            <div class="text-xs text-slate-500 dark:text-slate-400">
              {{ getQuicklistChoreStatusText(quickChore) }}
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
          </template>
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
      <div v-if="isQuicklistEmpty()" class="flex flex-col items-center justify-center py-16 text-center">
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
    </sl-card>
  `,
  inject: [
    'quicklistChores', 'Helpers', 'showAddToQuicklistModal',
    'handleQuicklistChoreClick', 'selectionStore'
  ],
  data() {
    return {
      quicklistLoading: false,
      quicklistError: null,
      selectionMode: false,
      selectedChores: new Set(),
      lastSelectedChore: null
    }
  },
  computed: {
    primaryButton() {
      return {
        text: 'Add',
        icon: 'plus',
        action: this.openAddToQuicklistModal
      };
    },
    secondaryButton() {
      return {
        text: this.getSelectionButtonText(),
        icon: 'check',
        variant: 'outline',
        action: this.toggleSelectionMode,
        disabled: this.isQuicklistEmpty()
      };
    }
  },
  methods: {
    toggleSelectionMode() {
      this.selectionMode = !this.selectionMode;
      if (!this.selectionMode) this.selectedChores.clear();
    },
    openAddToQuicklistModal() {
      this.$parent?.openAddToQuicklistModal?.();
    },
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
        await this.$parent.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST + '/' + quicklistId, { method: 'DELETE' });
        await this.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
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
        if (typeof handler === 'function') handler(quickChore);
      } finally {
        setTimeout(() => { quickChore.isSelecting = false; }, 100);
      }
    },
    getCategoryIcon(category) {
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },
    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },
    isQuicklistChoreSelected(quickChore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, quickChore) || false;
    },
    toggleChoreSelection(choreId) {
      this.selectedChores.has(choreId) ? this.selectedChores.delete(choreId) : this.selectedChores.add(choreId);
      this.$forceUpdate();
    },
    getQuicklistCardClasses(quickChore) {
      const classes = ['transform hover:scale-105 hover:shadow-xl'];
      if (quickChore.isSelecting) classes.push('opacity-50 scale-95');
      if (this.isQuicklistChoreSelected(quickChore)) classes.push('ring-4 ring-blue-500 ring-opacity-75 shadow-xl scale-105 border-2 border-blue-300 bg-blue-50 dark:bg-blue-900/20');
      if (this.selectionMode && this.selectedChores.has(quickChore.id)) classes.push('ring-4 ring-green-500 ring-opacity-75 bg-green-50 dark:bg-green-900/20');
      return classes.join(' ');
    },
    handleQuicklistCardClick(quickChore, event) {
      if (this.selectionMode) {
        this.toggleChoreSelection(quickChore.id);
      } else {
        this.selectQuicklistChore(quickChore, event);
      }
    },
    isQuicklistEmpty() {
      return this.quicklistChores.length === 0 && !this.quicklistLoading;
    },
    getSelectedChoresText() {
      const count = this.selectedChores.size;
      return `${count} chore${count !== 1 ? 's' : ''} selected`;
    },
    getSelectionButtonText() {
      return this.selectionMode ? 'Cancel' : 'Select';
    },
    formatAmount(amount) {
      return '$' + amount.toFixed(2);
    },
    getQuicklistChoreStatusText(quickChore) {
      return this.isQuicklistChoreSelected(quickChore) ? 'Selected' : 'Click to assign';
    }
  }
});

// Export component for manual registration
window.ShoelaceQuicklistSectionComponent = ShoelaceQuicklistSection;
