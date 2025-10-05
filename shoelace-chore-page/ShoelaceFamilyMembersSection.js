// ShoelaceFamilyMembersSection Component - Handles family members and assigned chores display for Shoelace UI
const ShoelaceFamilyMembersSection = Vue.defineComponent({
  components: {
    'icon-container': window.IconContainerComponent
  },
  template: `
    <sl-card class="family-section">
      <template #header>
        <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('users', 'lucide', 20, 'text-primary-500')"></div>
          Family Members
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <sl-card
          v-for="person in people"
          :key="person.id"
          class="family-member-card"
          :class="getFamilyMemberCardClasses()"
          @click="handleFamilyMemberClick(person)"
        >
          <template #header>
            <div class="flex items-center justify-between">
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
          </template>

          <!-- default slot content -->
          <div class="space-y-3 min-h-[60px]">
            <div v-if="hasNoAssignedChores(person)" class="text-center py-4 text-secondary-custom">
              <p class="text-sm">No chores assigned</p>
              <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
            </div>

            <sl-card
              v-for="chore in getPersonChores(person)"
              :key="chore.id"
              class="assigned-chore-card cursor-pointer transition-all duration-200"
              :class="getAssignedCardClasses(chore)"
              style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);"
              @click="selectChore(chore, $event)"
            >
              <template #header>
                <div class="p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div v-if="chore.amount > 0" class="text-lg font-bold text-white">
                      {{ formatAmount(chore.amount) }}
                    </div>
                    <sl-button variant="danger" size="small" @click.stop="deleteChore(chore)">
                      <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 16)"></div>
                    </sl-button>
                  </div>

                  <div class="flex items-center gap-3">
                    <!-- Video game controller icon for Electronics chores -->
                    <div v-if="isGameChore(chore)" class="shrink-0">
                      <div v-html="Helpers.IconLibrary.getIcon('gamepad-2', 'lucide', 20, 'text-white')"></div>
                    </div>

                    <h4 :class="getChoreCompletedClasses(chore)" class="font-medium text-white flex-1">
                      {{ chore.name }}
                    </h4>
                  </div>
                </div>
              </template>

              <template #footer>
                <div class="p-3 bg-slate-50 dark:bg-slate-800/50">
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
              </template>
            </sl-card>
          </div>
        </sl-card>
      </div>
    </sl-card>
  `,
  inject: [
    'people', 'choresByPerson', 'Helpers', 'selectionStore'
  ],
  methods: {
    getFamilyMemberCardClasses() {
      return this.selectedChore ? 'cursor-pointer' : '';
    },
    handleFamilyMemberClick(person) {
      if (this.selectedChore) {
        this.assignSelectedChore(person.name);
      }
    },
    hasNoAssignedChores(person) {
      return this.choresByPerson[person.name] && this.choresByPerson[person.name].length === 0;
    },
    getPersonChores(person) {
      return this.choresByPerson[person.name] || [];
    },
    getAssignedCardClasses(chore) {
      const classes = [];
      if (chore.isSelecting) classes.push('opacity-75');
      if (this.isChoreSelected(chore)) classes.push('ring-2 ring-primary-500 shadow-lg');
      else classes.push('hover:shadow-md hover:-translate-y-1');
      return classes.join(' ');
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
        const handler = this.selectionStore?.selectChore || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') handler(chore);
      } finally {
        setTimeout(() => { chore.isSelecting = false; }, 100);
      }
    },
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.$parent?.selectedChoreId, this.$parent?.selectedQuicklistChore, chore) || false;
    },
    getElectronicsStatusVariant(status) {
      switch (status) {
        case 'allowed': return 'success';
        case 'restricted': return 'warning';
        case 'blocked': return 'danger';
        default: return 'success';
      }
    },
    getElectronicsStatusText(status) {
      switch (status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    },
    async deleteChore(chore) {
      if (chore) await this.$parent.deleteChore(chore);
    },
    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    },
    async handleChoreCompletionToggle(chore, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      chore.completed = !chore.completed;
      await this.$parent.handleChoreCompletion(chore);
    },
    getChoreCompletedClasses(chore) {
      return chore.completed ? 'line-through opacity-60' : '';
    },
    isGameChore(chore) {
      return chore.category === 'game';
    },
    formatAmount(amount) {
      return '$' + amount.toFixed(2);
    }
  }
});

// Export component for manual registration
window.ShoelaceFamilyMembersSectionComponent = ShoelaceFamilyMembersSection;
