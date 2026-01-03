/**
 * Confirm Modal Component
 * Encapsulated email confirmation modal with store-based state management
 * 
 * _Requirements: 3.1, 3.2, 3.3, 3.4_
 * - 3.1: Located at components/modals/auth/confirm-modal.js
 * - 3.2: Access visibility state via uiStore.isModalOpen('confirm')
 * - 3.3: Access form data via authStore.authForm, authStore.authError, authStore.authLoading
 * - 3.4: Delegate actions to authStore methods
 */
const ConfirmModal = Vue.defineComponent({
  name: 'ConfirmModal',
  
  setup() {
    const uiStore = window.useUIStore?.();
    const authStore = window.useAuthStore?.();
    return { uiStore, authStore };
  },
  
  computed: {
    // Visibility state from uiStore
    isOpen() {
      return this.uiStore?.isModalOpen('confirm') || false;
    },
    // Form data from authStore
    authForm() {
      return this.authStore?.authForm || { email: '', confirmationCode: '' };
    },
    authError() {
      return this.authStore?.authError || null;
    },
    authLoading() {
      return this.authStore?.authLoading || false;
    }
  },
  
  methods: {
    handleConfirmSignup() {
      this.authStore?.handleConfirmSignup();
    },
    closeModal() {
      this.authStore?.closeAuthModals();
    }
  },

  template: `
    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="rounded-lg p-6 w-96 max-w-[90vw] modal-panel" style="background: var(--color-surface-3);">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-warning-50);">
            <div v-html="Helpers.IconLibrary.getIcon('mail', 'lucide', 24, '')" style="color: var(--color-warning-700);"></div>
          </div>
          <h3 class="text-lg font-bold" style="color: var(--color-text-primary);">Confirm Email</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <p class="mb-4" style="color: var(--color-text-secondary);">
          We've sent a confirmation code to <strong style="color: var(--color-text-primary);">{{ authForm.email }}</strong>. 
          Please enter the code below to verify your email.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Confirmation Code</label>
            <input 
              v-model="authForm.confirmationCode"
              type="text" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="Enter 6-digit code"
              @keyup.enter="handleConfirmSignup"
            >
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleConfirmSignup"
            :disabled="authLoading"
            class="w-full py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            style="background: var(--color-primary-500); color: white;"
          >
            {{ authLoading ? 'Confirming...' : 'Confirm Email' }}
          </button>
          <button 
            @click="closeModal"
            class="w-full py-2 px-4 rounded-lg transition-colors"
            style="background: var(--color-surface-2); color: var(--color-text-primary);"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.ConfirmModalComponent = ConfirmModal;
