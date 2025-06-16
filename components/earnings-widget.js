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
            @click="openSpendingModal(person)"
            class="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            :title="'Click to spend money for ' + person.name"
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
      
      <!-- Spending Modal -->
      <div v-if="showSpendingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="bg-red-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
                <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,64H224V88H32ZM32,192V104H224v88Z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-[#0d0f1c]">Spend Money</h3>
              <p class="text-sm text-[#47569e]">{{ selectedPerson?.name }} - \${{ selectedPerson?.earnings.toFixed(2) }} available</p>
            </div>
          </div>
          
          <!-- Amount Display -->
          <div class="mb-4">
            <div class="text-center bg-gray-50 rounded-lg p-4 mb-4">
              <div class="text-2xl font-bold text-[#0d0f1c]">\${{ spendAmount.toFixed(2) }}</div>
              <div class="text-sm text-[#47569e]">Amount to spend</div>
            </div>
          </div>
          
          <!-- Number Pad -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <button
              v-for="number in [1,2,3,4,5,6,7,8,9]"
              :key="number"
              @click="addDigit(number)"
              class="bg-gray-100 hover:bg-gray-200 text-[#0d0f1c] font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {{ number }}
            </button>
            <button
              @click="addDecimal"
              class="bg-gray-100 hover:bg-gray-200 text-[#0d0f1c] font-bold py-3 px-4 rounded-lg transition-colors"
            >
              .
            </button>
            <button
              @click="addDigit(0)"
              class="bg-gray-100 hover:bg-gray-200 text-[#0d0f1c] font-bold py-3 px-4 rounded-lg transition-colors"
            >
              0
            </button>
            <button
              @click="clearAmount"
              class="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              @click="closeSpendingModal"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmSpending"
              :disabled="spendAmount <= 0 || spendAmount > selectedPerson?.earnings"
              class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Spend Money
            </button>
          </div>
        </div>
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
      showDetails: false,
      showSpendingModal: false,
      selectedPerson: null,
      spendAmount: 0,
      spendAmountString: '0'
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
  },
  methods: {
    openSpendingModal(person) {
      this.selectedPerson = person;
      this.spendAmount = 0;
      this.spendAmountString = '0';
      this.showSpendingModal = true;
    },
    
    closeSpendingModal() {
      this.showSpendingModal = false;
      this.selectedPerson = null;
      this.spendAmount = 0;
      this.spendAmountString = '0';
    },
    
    addDigit(digit) {
      if (this.spendAmountString === '0') {
        this.spendAmountString = digit.toString();
      } else {
        this.spendAmountString += digit.toString();
      }
      this.updateSpendAmount();
    },
    
    addDecimal() {
      if (!this.spendAmountString.includes('.')) {
        this.spendAmountString += '.';
        this.updateSpendAmount();
      }
    },
    
    clearAmount() {
      this.spendAmountString = '0';
      this.spendAmount = 0;
    },
    
    updateSpendAmount() {
      const amount = parseFloat(this.spendAmountString);
      this.spendAmount = isNaN(amount) ? 0 : amount;
    },
    
    async confirmSpending() {
      if (this.spendAmount <= 0 || this.spendAmount > this.selectedPerson.earnings) {
        return;
      }
      
      try {
        // Call the parent's API to subtract earnings
        const response = await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${this.selectedPerson.name}/earnings`, {
          method: 'PUT',
          body: JSON.stringify({ 
            amount: this.spendAmount,
            operation: 'subtract'
          })
        });
        
        // Reload earnings data
        await this.$parent.loadEarnings();
        
        // Close modal
        this.closeSpendingModal();
        
        // Show success message
        if (this.$parent.triggerConfetti) {
          this.$parent.triggerConfetti();
        }
        if (this.$parent.showSuccessMessage !== undefined) {
          this.$parent.showSuccessMessage = true;
          this.$parent.completedChoreMessage = `${this.selectedPerson.name} spent $${this.spendAmount.toFixed(2)}!`;
          
          setTimeout(() => {
            this.$parent.showSuccessMessage = false;
          }, 3000);
        }
      } catch (error) {
        console.error('Error spending money:', error);
        alert('Failed to spend money. Please try again.');
      }
    }
  }
});

// Export component for manual registration
window.EarningsWidgetComponent = EarningsWidget; 