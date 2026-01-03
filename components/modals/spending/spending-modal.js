// Spending Modal Component
// _Requirements: 10.1, 10.2, 10.3, 10.4_
const SpendingModal = Vue.defineComponent({
  name: 'SpendingModal',
  
  setup() {
    const uiStore = window.useUIStore();
    const familyStore = window.useFamilyStore();
    return { uiStore, familyStore };
  },
  
  data() {
    return {
      spendAmount: 0,
      spendAmountString: '0',
      isSubmitting: false
    };
  },
  
  computed: {
    isOpen() {
      return this.uiStore?.modals?.spending?.isOpen || false;
    },
    selectedPerson() {
      return this.uiStore?.modals?.spending?.data?.selectedPerson || null;
    },
    maxAmount() {
      return this.selectedPerson?.earnings || 0;
    }
  },
  
  watch: {
    isOpen(newVal) {
      if (newVal) {
        // Reset form when opening
        this.spendAmount = 0;
        this.spendAmountString = '0';
      }
    }
  },
  
  template: `
    <!-- Spending Flyout -->
    <!-- _Requirements: 10.1, 10.2, 10.3, 10.4_ -->
    <flyout-panel
      :open="isOpen"
      @close="handleClose"
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
            @click="addDigit(number)"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {{ number }}
          </button>
          <button
            @click="addDecimal"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            .
          </button>
          <button
            @click="addDigit(0)"
            class="numpad-btn text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            0
          </button>
          <button
            @click="clearAmount"
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
            @click.stop="handleConfirmSpending"
            :disabled="isSubmitting || spendAmount <= 0 || spendAmount > maxAmount"
            class="flex-1 btn-error btn-compact px-3 py-1.5 text-sm disabled:bg-[color:var(--color-neutral-300)] disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'Processing...' : 'Spend Money' }}
          </button>
          <button
            @click.stop="handleClose"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  methods: {
    addDigit(n) {
      if (this.spendAmountString === '0') {
        this.spendAmountString = String(n);
      } else {
        this.spendAmountString += String(n);
      }
      this.updateAmount();
    },
    
    addDecimal() {
      if (!this.spendAmountString.includes('.')) {
        this.spendAmountString += '.';
        this.updateAmount();
      }
    },
    
    clearAmount() {
      this.spendAmountString = '0';
      this.spendAmount = 0;
    },
    
    updateAmount() {
      const amount = parseFloat(this.spendAmountString);
      this.spendAmount = isNaN(amount) ? 0 : Number(amount);
    },
    
    async handleConfirmSpending() {
      if (this.isSubmitting) return;
      if (this.spendAmount <= 0 || this.spendAmount > this.maxAmount) return;
      if (!this.selectedPerson) return;
      
      this.isSubmitting = true;
      
      try {
        const personName = this.selectedPerson.displayName || this.selectedPerson.name;
        const spentAmount = this.spendAmount;
        
        // Make API call to deduct earnings
        const api = window.useApi();
        await api.put(
          `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodeURIComponent(personName)}/earnings`,
          { amount: Number(spentAmount), operation: 'subtract' }
        );
        
        // Reload earnings
        await this.familyStore?.loadEarnings();
        
        // Show success
        this.uiStore?.showSuccess(`${personName} spent $${spentAmount.toFixed(2)}!`);
        
        this.handleClose();
      } catch (error) {
        console.error('Failed to process spending:', error);
        this.uiStore?.showError('Failed to process spending');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    handleClose() {
      this.uiStore?.closeModal('spending');
      this.clearAmount();
    }
  }
});

// Export for CDN-based registration
// _Requirements: 16.3_
window.SpendingModalComponent = SpendingModal;
