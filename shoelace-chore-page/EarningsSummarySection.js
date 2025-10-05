// EarningsSummarySection Component - Displays earnings summary for family members
const EarningsSummarySection = Vue.defineComponent({
  template: `
    <sl-card class="earnings-section">
      <template #header>
        <h2 class="text-lg font-semibold text-primary-custom flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('dollarSign', 'lucide', 20, 'text-primary-500')"></div>
          Earnings Summary
        </h2>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <sl-card
          v-for="person in people"
          :key="person.id"
          class="earnings-card cursor-pointer hover:shadow-lg transition-all duration-200"
          @click="openSpendModal(person)"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">{{ getPersonDisplayName(person) }}</h3>
              <div class="text-right">
                <p class="text-2xl font-bold text-primary-600">{{ formatAmount(person.earnings) }}</p>
                <p class="text-xs opacity-75">{{ getCompletedChoresCount(person) }} chores completed</p>
              </div>
            </div>
          </template>
        </sl-card>
      </div>
    </sl-card>
  `,
  inject: [
    'people', 'Helpers'
  ],
  methods: {
    formatAmount(amount) {
      return '$' + amount.toFixed(2);
    },
    getPersonDisplayName(person) {
      return person.displayName || person.name;
    },
    getCompletedChoresCount(person) {
      return person.completedChores || 0;
    },
    openSpendModal(person) {
      if (this.$parent.openSpendingModal) this.$parent.openSpendingModal(person);
    }
  }
});

// Export component for manual registration
window.EarningsSummarySectionComponent = EarningsSummarySection;
