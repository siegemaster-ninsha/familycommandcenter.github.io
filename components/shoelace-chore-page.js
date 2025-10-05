// Shoelace Chores Page Component - Modern, Reactive Implementation with Modular Components
const ShoelaceChorePage = Vue.defineComponent({
  components: {
    'quicklist-section': window.QuicklistSectionComponent,
    'unassigned-chores-section': window.UnassignedChoresSectionComponent,
    'family-members-section': window.ShoelaceFamilyMembersSectionComponent,
    'earnings-summary-section': window.EarningsSummarySectionComponent
  },
  async mounted() {
    await this.loadQuicklistChores();
  },
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <!-- Quicklist Section -->
        <quicklist-section />

        <!-- Unassigned Chores -->
        <unassigned-chores-section />

        <!-- Family Members & Assigned Chores -->
        <family-members-section />

        <!-- Earnings Summary -->
        <earnings-summary-section />
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
      // Data properties are now managed by individual components
    }
  },
  methods: {
    switchToOriginal() {
      this.$parent.setCurrentPage('chores');
    }
  }
});

// Export component for manual registration
window.ShoelaceChorePageComponent = ShoelaceChorePage;
