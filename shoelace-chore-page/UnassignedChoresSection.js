// UnassignedChoresSection Component - Handles unassigned chores display
const UnassignedChoresSection = Vue.defineComponent({
  components: {
    'icon-container': window.IconContainerComponent
  },
  template: `
    <sl-card class="unassigned-section">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 20, 'text-primary-500')"></div>
            Unassigned Chores
          </h2>
          <sl-button variant="primary" @click="openAddChoreModal">
            <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16)"></div>
            Add New Chore
          </sl-button>
        </div>
      </template>

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
          :class="getUnassignedCardClasses(chore)"
          :aria-selected="isChoreSelected(chore)"
          role="option"
          @click="selectChore(chore, $event)"
        >
          <template #header>
            <div class="category-icon flex items-center justify-center rounded-lg size-12 text-white bg-white bg-opacity-20 shrink-0">
              <div v-html="getCategoryIcon(chore.category)"></div>
            </div>
            <div class="flex flex-col flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-medium flex-1">{{ chore.name }}</h3>
                <sl-badge variant="neutral" size="small" class="shrink-0">{{ getCategoryLabel(chore.category) }}</sl-badge>
              </div>
            </div>
          </template>

          <!-- default slot content -->
          <p v-if="chore.details" class="text-sm opacity-80 mb-2">{{ chore.details }}</p>
          <div v-if="chore.amount > 0" class="text-sm font-medium">{{ formatAmount(chore.amount) }}</div>

          <template #footer>
            <div class="flex justify-end">
              <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                <div v-html="Helpers.IconLibrary.getIcon('trash-2', 'lucide', 14)"></div>
                Delete
              </sl-button>
            </div>
          </template>
        </sl-card>
      </div>
    </sl-card>
  `,
  inject: [
    'choresByPerson', 'Helpers', 'showAddChoreModal',
    'handleChoreClick', 'selectionStore'
  ],
  methods: {
    openAddChoreModal() {
      this.$parent?.openAddChoreModal?.();
    },
    selectChore(chore, event) {
      if (event && (event.type === 'touchend' || event.type === 'touchstart')) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (chore.isSelecting) return;
      chore.isSelecting = true;
      try {
        if (this.$parent.selectedChore && this.$parent.selectedChoreId !== chore.id && chore.assignedTo && chore.assignedTo !== 'unassigned') {
          this.assignSelectedChore(chore.assignedTo);
          this.$parent.selectedChoreId = null;
          this.$parent.selectedQuicklistChore = null;
          return;
        }
        const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') handler(chore);
      } finally {
        setTimeout(() => { chore.isSelecting = false; }, 100);
      }
    },
    getCategoryIcon(category) {
      return this.Helpers?.getCategoryIcon?.(category) || '';
    },
    getCategoryLabel(category) {
      return this.Helpers?.getCategoryLabel?.(category) || '';
    },
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
    },
    getUnassignedCardClasses(chore) {
      const classes = [];
      if (chore.isSelecting) classes.push('opacity-75');
      if (this.isChoreSelected(chore)) classes.push('ring-4 ring-primary-500 ring-opacity-75 shadow-xl scale-105 border-2 border-primary-300 bg-primary-50');
      else classes.push('hover:shadow-md hover:-translate-y-1');
      return classes.join(' ');
    },
    formatAmount(amount) {
      return '$' + amount.toFixed(2);
    },
    async deleteChore(chore) {
      if (chore) await this.$parent.deleteChore(chore);
    },
    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    }
  }
});

// Export component for manual registration
window.UnassignedChoresSectionComponent = UnassignedChoresSection;
