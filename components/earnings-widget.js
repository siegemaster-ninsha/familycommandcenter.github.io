// Earnings Widget Component
const EarningsWidget = Vue.defineComponent({
  template: `
    <div class="bg-white rounded-lg border border-[#e6e9f4] p-4 shadow-sm">
      <div v-if="!individualsOnly" class="flex items-center justify-between mb-4">
        <h3 class="text-[#0d0f1c] text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
          📊 Earnings
        </h3>
        <div v-if="compact" class="text-2xl font-bold text-green-600">
          \${{ totalEarnings.toFixed(2) }}
        </div>
      </div>
      
      <div v-else class="mb-4">
        <h3 class="text-[#0d0f1c] text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
          💰 Individual Earnings
        </h3>
      </div>
      
      <!-- Compact view (single row) -->
      <div v-if="compact && !individualsOnly" class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="text-lg font-bold text-blue-600 mb-1">{{ people.length }}</div>
          <div class="text-xs text-blue-700">Members</div>
        </div>
        
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div class="text-lg font-bold text-purple-600 mb-1">{{ activeMembers }}</div>
          <div class="text-xs text-purple-700">Active</div>
        </div>
        
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div class="text-lg font-bold text-orange-600 mb-1">\${{ averageEarnings.toFixed(2) }}</div>
          <div class="text-xs text-orange-700">Average</div>
        </div>
      </div>
      
      <!-- Full view (2x2 grid) -->
      <div v-else-if="!individualsOnly" class="grid grid-cols-2 gap-4">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-green-600 mb-1">
            \${{ totalEarnings.toFixed(2) }}
          </div>
          <div class="text-sm text-green-700">Total Family Earnings</div>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-blue-600 mb-1">
            {{ people.length }}
          </div>
          <div class="text-sm text-blue-700">Family Members</div>
        </div>
        
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-purple-600 mb-1">
            {{ activeMembers }}
          </div>
          <div class="text-sm text-purple-700">Members with Earnings</div>
        </div>
        
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div class="text-2xl font-bold text-orange-600 mb-1">
            \${{ averageEarnings.toFixed(2) }}
          </div>
          <div class="text-sm text-orange-700">Average Earnings</div>
        </div>
      </div>
      
      <!-- Individual member earnings (optional detailed view) -->
      <div v-if="(showDetails && people.length > 0) || individualsOnly" :class="individualsOnly ? 'mt-0' : 'mt-4 pt-4 border-t border-[#e6e9f4]'">
        <h4 v-if="!individualsOnly" class="text-sm font-medium text-[#47569e] mb-3">Individual Earnings</h4>
        <div class="space-y-2">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="bg-[#607afb] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {{ person.name.charAt(0).toUpperCase() }}
              </div>
              <span class="text-base font-medium text-[#0d0f1c]">{{ person.name }}</span>
            </div>
            <span class="font-bold text-green-600 text-lg">\${{ person.earnings.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Toggle details button -->
      <div v-if="!compact && !individualsOnly && people.length > 0" class="mt-4 text-center">
        <button
          @click="showDetails = !showDetails"
          class="text-xs text-[#607afb] hover:text-[#4f68d8] font-medium transition-colors"
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
  inject: ['people'],
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