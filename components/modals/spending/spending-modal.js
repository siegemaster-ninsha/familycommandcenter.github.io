// Spending Modal Component
// _Requirements: 10.1, 10.2, 10.3, 10.4_
const SpendingModal = Vue.defineComponent({
  name: 'SpendingModal',
  
  // Inject props from parent (preserves existing contracts)
  // _Requirements: 10.2, 10.3, 10.4_
  inject: [
    'showSpendingModal',
    'selectedPerson',
    'spendAmount',
    'spendAmountString',
    'addDigit',
    'addDecimal',
    'clearSpendAmount',
    'confirmSpending',
    'closeSpendingModal'
  ],
  
  template: `
    <!-- Spending Flyout -->
    <!-- _Requirements: 10.1, 10.2, 10.3, 10.4_ -->
    <flyout-panel
      :open="showSpendingModal"
      @close="handleCloseSpendingModal"
      :show-footer="true"
      :show-header-close="false"
      width="380px"
    >
      <template #title>
        <div>
          <h2 class="text-lg font-bold text-primary-custom">Spend Money</h2>
          <p class="text-sm text-secondary-custom">{{ selectedPerson?.displayName || selectedPerson?.name || '' }} - \${{ selectedPerson?.earnings?.toFixed(2) || '0.00' }} available</p>
        </div>
      </template>
      <template #default>
        <!-- Amount Display -->
        <div class="mb-4">
          <div class="text-center rounded-lg p-4 mb-4" style="background: var(--color-surface-1);">
            <div class="text-2xl font-bold text-primary-custom">\${{ spendAmountString }}</div>
            <div class="text-sm text-secondary-custom">Amount to spend</div>
          </div>
        </div>
        
        <!-- Number Pad -->
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="number in [1,2,3,4,5,6,7,8,9]"
            :key="number"
            @click="handleAddDigit(number)"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {{ number }}
          </button>
          <button
            @click="handleAddDecimal"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            .
          </button>
          <button
            @click="handleAddDigit(0)"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            0
          </button>
          <button
            @click="handleClearSpendAmount"
            class="font-bold py-3 px-4 rounded-lg transition-colors"
            style="background: var(--color-error-50); color: var(--color-error-700);"
          >
            Clear
          </button>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button
            @click="handleConfirmSpending"
            @touchend.prevent="handleConfirmSpending"
            :disabled="spendAmount <= 0 || spendAmount > selectedPerson?.earnings"
            class="flex-1 btn-error btn-compact px-3 py-1.5 text-sm disabled:bg-[color:var(--color-neutral-300)] disabled:cursor-not-allowed"
          >
            Spend Money
          </button>
          <button
            @click="handleCloseSpendingModal"
            @touchend.prevent="handleCloseSpendingModal"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  methods: {
    // Wrapper methods for numpad actions
    // _Requirements: 10.4_
    handleAddDigit(n) {
      this.addDigit?.(n);
    },
    handleAddDecimal() {
      this.addDecimal?.();
    },
    handleClearSpendAmount() {
      this.clearSpendAmount?.();
    },
    handleConfirmSpending() {
      this.confirmSpending?.();
    },
    handleCloseSpendingModal() {
      this.closeSpendingModal?.();
    }
  }
});

// Export for CDN-based registration
// _Requirements: 16.3_
window.SpendingModalComponent = SpendingModal;
