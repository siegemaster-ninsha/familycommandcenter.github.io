// Earnings Widget Component
const EarningsWidget = Vue.defineComponent({
  template: `
    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div v-if="!individualsOnly" class="flex items-center justify-between mb-4">
        <h3 class="text-primary-custom text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
          📊 Earnings
        </h3>
        <div v-if="compact" class="text-2xl font-bold earnings-text">
          \${{ totalEarnings.toFixed(2) }}
        </div>
      </div>
      
      <div v-else class="mb-4">
        <h3 class="text-primary-custom text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
          💰 Individual Earnings
        </h3>
      </div>
      
      <!-- Compact view (single row) -->
      <div v-if="compact && !individualsOnly" class="grid grid-cols-3 gap-3 text-center">
        <div class="rounded-lg p-3" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
          <div class="text-lg font-bold text-primary-500 mb-1">{{ people.length }}</div>
          <div class="text-xs text-primary-600">Members</div>
        </div>
        
        <div class="rounded-lg p-3" style="background: var(--color-secondary-100); border: 1px solid var(--color-secondary-200);">
          <div class="text-lg font-bold" style="color: var(--color-secondary-600);">{{ activeMembers }}</div>
          <div class="text-xs" style="color: var(--color-secondary-600);">Active</div>
        </div>
        
        <div class="rounded-lg p-3" style="background: var(--color-warning-50); border: 1px solid color-mix(in srgb, var(--color-warning-600) 20%, white);">
          <div class="text-lg font-bold" style="color: var(--color-warning-700);">\${{ averageEarnings.toFixed(2) }}</div>
          <div class="text-xs" style="color: var(--color-warning-700);">Average</div>
        </div>
      </div>
      
      <!-- Full view (2x2 grid) -->
      <div v-else-if="!individualsOnly" class="grid grid-cols-2 gap-4">
        <div class="earnings-card rounded-lg p-4 text-center">
          <div class="text-2xl font-bold earnings-text mb-1">
            \${{ totalEarnings.toFixed(2) }}
          </div>
          <div class="text-sm earnings-text">Total Family Earnings</div>
        </div>
        
        <div class="rounded-lg p-4 text-center" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
          <div class="text-2xl font-bold text-primary-500 mb-1">
            {{ people.length }}
          </div>
          <div class="text-sm text-primary-600">Family Members</div>
        </div>
        
        <div class="rounded-lg p-4 text-center" style="background: var(--color-secondary-100); border: 1px solid var(--color-secondary-200);">
          <div class="text-2xl font-bold" style="color: var(--color-secondary-600);">
            {{ activeMembers }}
          </div>
          <div class="text-sm" style="color: var(--color-secondary-600);">Members with Earnings</div>
        </div>
        
        <div class="rounded-lg p-4 text-center" style="background: var(--color-warning-50); border: 1px solid color-mix(in srgb, var(--color-warning-600) 20%, white);">
          <div class="text-2xl font-bold" style="color: var(--color-warning-700);">
            \${{ averageEarnings.toFixed(2) }}
          </div>
          <div class="text-sm" style="color: var(--color-warning-700);">Average Earnings</div>
        </div>
      </div>
      
      <!-- Individual member earnings (optional detailed view) -->
      <div v-if="(showDetails && people.length > 0) || individualsOnly" :class="individualsOnly ? 'mt-0' : 'mt-4 pt-4 border-t border-gray-200'">
        <h4 v-if="!individualsOnly" class="text-sm font-medium text-secondary-custom mb-3">Individual Earnings</h4>
        <div class="space-y-2">
          <div 
            v-for="person in people" 
            :key="person.id"
            @click="openSpendingModal(person)"
            class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            :title="'Click to spend money for ' + (person.displayName || person.name || '')"
          >
            <div class="flex items-center gap-3">
              <div class="earnings-avatar rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {{ (person.displayName || person.name || '').charAt(0).toUpperCase() }}
              </div>
              <span class="text-base font-medium text-primary-custom">{{ person.displayName || person.name || '' }}</span>
            </div>
            <span class="badge badge-success">\${{ person.earnings.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Toggle details button -->
      <div v-if="!compact && !individualsOnly && people.length > 0" class="mt-4 text-center">
        <button
          @click="showDetails = !showDetails"
          class="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          {{ showDetails ? 'Hide Details' : 'Show Individual Earnings' }}
        </button>
      </div>
    </div>
  `,
  props: {
    compact: {
      type: Boolean,
      default: false
    },
    detailsToggle: {
      type: Boolean,
      default: true
    },
    individualsOnly: {
      type: Boolean,
      default: false
    }
  },
  inject: ['people', 'triggerConfetti', 'loadEarnings', 'showSuccessMessage', 'completedChoreMessage', 'openSpendingModal'],
  data() {
    return {
      showDetails: false
    };
  },
  computed: {
    totalEarnings() {
      return this.people.reduce((total, person) => total + person.earnings, 0);
    },
    
    activeMembers() {
      return this.people.filter(person => person.earnings > 0).length;
    },
    
    averageEarnings() {
      return this.people.length > 0 ? this.totalEarnings / this.people.length : 0;
    }
  }
});

// Export component for manual registration
window.EarningsWidgetComponent = EarningsWidget; 
