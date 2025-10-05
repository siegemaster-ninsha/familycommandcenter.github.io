// Tailwind Chore Page Component with Reusable Cards
// Using standard Tailwind components instead of custom components

// Unified Chore Card Component
const ChoreCard = {
  template: `
    <div
      class="relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer border-2 hover:shadow-lg hover:-translate-y-0.5"
      :class="[
        isSelected ? 'shadow-lg shadow-blue-400/25 scale-105 z-10 border-blue-400 bg-blue-600' : 'hover:border-blue-400 bg-blue-500 border-blue-600'
      ]"
      @click.stop="handleClick"
      @touchend.stop="handleClick"
    >
      <!-- Category icon -->
      <div
        class="flex items-center justify-center rounded-xl text-white bg-gradient-to-br from-white/30 to-white/10 border border-white/20 shadow-lg shrink-0 transition-all duration-200 hover:scale-105 hover:shadow-xl"
        :class="getIconSize()"
        v-html="getCategoryIcon(chore.category) || ''"
      >
      </div>

      <!-- Chore content -->
      <div class="flex flex-col justify-center min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <!-- Completion checkbox (not for quicklist) -->
          <input
            v-if="type !== 'quicklist'"
            type="checkbox"
            :checked="chore.completed"
            @click.stop
            @change="handleToggleComplete"
            class="w-5 h-5 rounded focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            :class="chore.completed ? 'text-green-600' : 'text-gray-400'"
          >

          <p
            :class="chore.completed && type !== 'quicklist' ? 'line-through text-white opacity-60 flex-1' : 'text-white flex-1'"
            class="text-sm font-medium leading-normal line-clamp-2"
          >
            {{ chore.name }}
          </p>

          <!-- Small category icon next to name -->
        </div>

        <p v-if="chore.details" :class="chore.completed && type !== 'quicklist' ? 'text-white opacity-50' : 'text-white text-opacity-80'" class="text-xs font-normal leading-normal mb-1">
          {{ chore.details }}
        </p>
        <p v-if="chore.amount > 0" :class="chore.completed && type !== 'quicklist' ? 'text-white opacity-50' : 'text-white text-opacity-90'" class="text-xs font-normal leading-normal">
          \${{ chore.amount.toFixed(2) }}
        </p>
      </div>

      <!-- Action buttons -->
      <div class="shrink-0 flex items-center gap-2">
        <!-- Approval button (assigned type only) -->
        <button
          v-if="type === 'assigned' && showApprovalButton && chore.isPendingApproval"
          @click.stop="handleApprove"
          class="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
        >
          Approve
        </button>

        <!-- Delete/Remove button -->
        <button
          @click.stop="handleDelete"
          class="flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-200 rounded-md bg-white bg-opacity-10 border border-white border-opacity-20 hover:scale-105 active:scale-95"
          :class="getButtonSize()"
          :title="getButtonTitle()"
        >
          <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('trash', 'lucide', getTrashIconSize(), 'text-white drop-shadow-sm') : ''"></div>
        </button>
      </div>
    </div>
  `,
  props: {
    chore: { type: Object, required: true },
    type: { type: String, required: true, validator: (value) => ['quicklist', 'unassigned', 'assigned'].includes(value) },
    isSelected: { type: Boolean, default: false },
    showApprovalButton: { type: Boolean, default: false },
    Helpers: { type: Object, required: true },
    // Event handlers
    onClick: { type: Function, required: true },
    onToggleComplete: { type: Function },
    onApprove: { type: Function },
    onDelete: { type: Function }
  },
  methods: {
    getCategoryIcon(category) {
      try {
        return this.Helpers?.getCategoryIcon?.(category) || '';
      } catch (error) {
        console.warn('Failed to get category icon for:', category, error);
        return '';
      }
    },
    getIconSize() {
      return 'w-14 h-14';
    },
    getButtonSize() {
      return this.type === 'quicklist' ? 'w-8 h-8' : 'w-10 h-10';
    },
    getTrashIconSize() {
      return this.type === 'quicklist' ? 16 : 18;
    },
    getButtonTitle() {
      return this.type === 'quicklist' ? 'Remove from quicklist' : 'Delete chore';
    },
    handleClick() {
      this.onClick(this.chore, event);
    },
    handleToggleComplete(event) {
      if (this.onToggleComplete) {
        this.onToggleComplete(this.chore, event);
      }
    },
    handleApprove() {
      if (this.onApprove) {
        this.onApprove(this.chore);
      }
    },
    handleDelete() {
      if (this.onDelete) {
        this.onDelete(this.chore);
      }
    }
  }
};

// Legacy component aliases for backward compatibility (not used in current implementation)

const PersonCard = {
  template: `
    <div
      class="border-2 rounded-xl p-6 transition-all duration-200 shadow-lg hover:shadow-xl"
      :class="[canAssign ? 'cursor-pointer hover:scale-102 bg-gray-50' : 'bg-white']"
      style="border-color: rgb(229 231 235);"
      @click="canAssign ? onAssign() : null"
    >
      <!-- Person header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {{ person.name.charAt(0) }}
          </div>
          <div>
            <h3 class="font-bold text-gray-900 text-xl">{{ person.name }}</h3>
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
      <div class="space-y-3 min-h-[60px]">
        <div v-if="!personChores || personChores.length === 0" class="text-center py-6 text-gray-500">
          <p class="text-sm">No chores assigned</p>
          <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
        </div>

        <chore-card
          v-for="chore in personChores"
          :key="chore.id"
          :chore="chore"
          type="assigned"
          :is-selected="isChoreSelected(chore)"
          :show-approval-button="showApprovalButton"
          :Helpers="Helpers"
          @click="onChoreClick(chore, $event)"
          @toggle-complete="onChoreToggle(chore, $event)"
          @approve="onChoreApprove(chore)"
          @delete="onChoreDelete(chore)"
        />
      </div>
    </div>
  `,
  props: {
    person: { type: Object, required: true },
    personChores: { type: Array, default: () => [] },
    canAssign: { type: Boolean, default: false },
    showApprovalButton: { type: Boolean, default: false },
    selectedChoreId: { type: String, default: null },
    selectedQuicklistChore: { type: Object, default: null },
    Helpers: { type: Object, required: true },
    onAssign: { type: Function, required: true },
    onChoreClick: { type: Function, required: true },
    onChoreToggle: { type: Function, required: true },
    onChoreApprove: { type: Function, required: true },
    onChoreDelete: { type: Function, required: true }
  },
  components: {
    ChoreCard
  },
  methods: {
    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'bg-green-100 text-green-800';
        case 'restricted': return 'bg-yellow-100 text-yellow-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        default: return 'bg-green-100 text-green-800';
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
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, chore) || false;
    }
  }
};

const EarningsCard = {
  template: `
    <div
      class="border-2 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:scale-102 transition-all duration-200 shadow-lg bg-blue-500 border-blue-600"
      @click="onClick"
      @touchend="onClick"
    >
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <h3 class="font-bold text-white text-xl">{{ person.displayName || person.name }}</h3>
          <p class="text-sm text-white text-opacity-90">Total Earnings</p>
          <p class="text-xs text-white text-opacity-80 mt-1">
            {{ completedChoresCount }} chores completed
          </p>
        </div>
        <div class="text-right">
          <p class="text-4xl font-bold text-white">\${{ person.earnings.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  `,
  props: {
    person: { type: Object, required: true },
    onClick: { type: Function, required: true }
  },
  computed: {
    completedChoresCount() {
      return this.person.completedChores || 0;
    }
  }
};

// Main Component
const TailwindChorePage = Vue.defineComponent({
  template: `
    <div class="space-y-6 pb-24 sm:pb-0">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 24, 'text-blue-500') : ''"></div>
          Chores
        </h1>
        <div class="text-sm text-gray-600">
          <span class="bg-gray-100 px-2 py-1 rounded">Tailwind Version</span>
        </div>
      </div>

      <!-- Quicklist Section -->
      <div class="w-full">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 class="text-gray-900 text-2xl font-bold leading-tight mb-6 flex items-center gap-2">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('zap', 'lucide', 20, 'text-blue-500') : ''"></div>
            Quicklist
          </h2>
          <p class="text-gray-600 text-sm mb-6 text-center">Tap these common chores to assign them quickly</p>

          <!-- Loading state -->
          <div v-if="quicklistLoading" class="text-center py-12">
            <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-600 mt-2">Loading quicklist...</p>
          </div>

          <!-- Error state -->
          <div v-else-if="quicklistError" class="text-center py-12">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 48, 'text-red-500') : ''" class="mx-auto mb-3"></div>
            <p class="font-medium text-red-700">Error loading quicklist</p>
            <p class="text-sm mt-1 text-red-600">{{ quicklistError }}</p>
            <button
              @click="loadQuicklistChores"
              class="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>

          <!-- Quicklist items -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            <chore-card
              v-for="quickChore in quicklistChores"
              :key="quickChore.id"
              :chore="quickChore"
              type="quicklist"
              :is-selected="isQuicklistChoreSelected(quickChore)"
              :Helpers="Helpers"
              @click="onQuicklistClick(quickChore, $event)"
              @delete="removeFromQuicklist(quickChore.id)"
            />

            <!-- Add to Quicklist button -->
            <div class="flex items-center justify-center">
              <button
                @click="openAddToQuicklistModal()"
                class="flex items-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors min-h-[48px] w-full sm:w-auto justify-center font-medium"
                title="Add new chore to quicklist"
              >
                <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white') : ''"></div>
                <span>Add to Quicklist</span>
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="quicklistChores.length === 0 && !quicklistLoading" class="text-center py-8 text-gray-500">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('minus', 'lucide', 48, 'text-gray-400') : ''" class="mx-auto mb-3"></div>
            <p>No quicklist chores yet.</p>
            <p class="text-sm mt-1">Add common chores for quick assignment!</p>
          </div>
        </div>
      </div>

      <!-- Unassigned Chores -->
      <div class="w-full">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 class="text-gray-900 text-2xl font-bold leading-tight mb-6 flex items-center gap-2">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 20, 'text-blue-500') : ''"></div>
            Unassigned Chores
          </h2>

          <!-- Inner container for chores -->
          <div
            class="min-h-[120px] rounded-lg p-6 transition-all duration-200 bg-gray-50"
            :class="[selectedChore ? 'cursor-pointer hover:shadow-lg hover:scale-102' : '']"
            @click="selectedChore ? assignSelectedChore('unassigned') : null"
          >
            <!-- Empty state when no chores -->
            <div v-if="choresByPerson.unassigned.length === 0" class="text-center text-gray-500 py-6 flex flex-col items-center justify-center">
              <p class="text-sm px-2">No unassigned chores</p>
              <p class="text-xs mt-2 px-2">Create new chores here - they'll be available for any family member to pick up</p>
            </div>

            <!-- Container for chores -->
            <div v-else class="space-y-4 mb-6">
              <chore-card
                v-for="chore in choresByPerson.unassigned"
                :key="chore.id"
                :chore="chore"
                type="unassigned"
                :is-selected="isChoreSelected(chore)"
                :Helpers="Helpers"
                @click="selectChore(chore, $event)"
                @delete="deleteChore(chore)"
              />
            </div>

            <!-- Add new chore button -->
            <div class="flex items-center justify-center">
              <button
                @click="openAddChoreModal()"
                class="flex items-center gap-2 px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors min-h-[48px] w-full sm:w-auto justify-center font-medium"
                title="Add new chore to unassigned"
              >
                <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white') : ''"></div>
                <span>Add New Chore</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Family Members & Assigned Chores -->
      <div class="w-full">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 class="text-gray-900 text-2xl font-bold leading-tight mb-6 flex items-center gap-2">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('users', 'lucide', 20, 'text-blue-500') : ''"></div>
            Family Members
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <person-card
              v-for="person in people"
              :key="person.id"
              :person="person"
              :person-chores="choresByPerson[person.name] || []"
              :can-assign="!!selectedChore"
              :show-approval-button="currentUser?.role === 'parent'"
              :selected-chore-id="selectedChoreId"
              :selected-quicklist-chore="selectedQuicklistChore"
              :Helpers="Helpers"
              @assign="assignSelectedChore(person.name)"
              @chore-click="selectChore"
              @chore-toggle="handleChoreCompletionToggle"
              @chore-approve="approveChore"
              @chore-delete="deleteChore"
            />
          </div>
        </div>
      </div>

      <!-- Earnings Summary -->
      <div class="w-full">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 class="text-gray-900 text-2xl font-bold leading-tight mb-6 flex items-center gap-2">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('dollarSign', 'lucide', 20, 'text-blue-500') : ''"></div>
            Earnings Summary
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <earnings-card
              v-for="person in people"
              :key="person.id"
              :person="person"
              @click="openSpendModal(person)"
            />
          </div>
        </div>
      </div>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'loading', 'error', 'Helpers', 'CONFIG', 'currentUser',
    'showAddChoreModal', 'showAddToQuicklistModal',
    'handleChoreClick', 'handleQuicklistChoreClick', 'selectionStore'
  ],
  components: {
    ChoreCard,
    PersonCard,
    EarningsCard
  },
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
        await this.$parent.apiCall(`${this.CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
      }
    },

    // Regular chore methods
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, chore) || false;
    },

    isQuicklistChoreSelected(quickChore) {
      return this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, quickChore) || false;
    },

    selectChore(chore, event) {
      if (event && (event.type === 'touchend' || event.type === 'touchstart') && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
      }

      if (chore.isSelecting) return;
      chore.isSelecting = true;

      try {
        if (this.selectedChore &&
            this.selectedChoreId !== chore.id &&
            chore.assignedTo &&
            chore.assignedTo !== 'unassigned') {
          this.assignSelectedChore(chore.assignedTo);
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          return;
        }

        const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') {
          handler(chore);
        } else {
          console.warn('handleChoreClick not available');
        }
      } finally {
        setTimeout(() => {
          chore.isSelecting = false;
        }, 100);
      }
    },

    onQuicklistClick(quickChore, event) {
      if (event && (event.type === 'touchend' || event.type === 'touchstart') && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
      }

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
        setTimeout(() => {
          quickChore.isSelecting = false;
        }, 100);
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

    async handleChoreCompletionToggle(chore, event) {
      // Safely handle event object
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
      }

      // Get the checked state safely
      const newCompletedState = event && event.target ? event.target.checked : !chore.completed;
      chore.completed = newCompletedState;

      await this.$parent.handleChoreCompletion(chore);
    },

    async approveChore(chore) {
      await this.$parent.approveChore(chore);
    },

    openSpendModal(person) {
      if (this.$parent.openSpendingModal) {
        this.$parent.openSpendingModal(person);
      }
    }
  }
});

// Export component for manual registration
window.TailwindChorePageComponent = TailwindChorePage;
