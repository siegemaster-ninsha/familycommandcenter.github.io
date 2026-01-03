/**
 * Signup Modal Component
 * Encapsulated signup modal with store-based state management
 * 
 * _Requirements: 2.1, 2.2, 2.3, 2.4_
 * - 2.1: Located at components/modals/auth/signup-modal.js
 * - 2.2: Access visibility state via uiStore.isModalOpen('signup')
 * - 2.3: Access form data via authStore.authForm, authStore.authError, authStore.authLoading
 * - 2.4: Delegate actions to authStore methods
 */
const SignupModal = Vue.defineComponent({
  name: 'SignupModal',
  
  setup() {
    const uiStore = window.useUIStore?.();
    const authStore = window.useAuthStore?.();
    return { uiStore, authStore };
  },
  
  data() {
    return {
      showPassword: false
    };
  },
  
  computed: {
    // Visibility state from uiStore
    isOpen() {
      return this.uiStore?.isModalOpen('signup') || false;
    },
    // Form data from authStore
    authForm() {
      return this.authStore?.authForm || { email: '', password: '', name: '' };
    },
    authError() {
      return this.authStore?.authError || null;
    },
    authLoading() {
      return this.authStore?.authLoading || false;
    }
  },
  
  methods: {
    handleSignup() {
      this.authStore?.handleSignup();
    },
    showLoginForm() {
      this.authStore?.showLoginForm();
    },
    closeModal() {
      this.authStore?.closeAuthModals();
    }
  },

  template: `
    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="rounded-lg p-6 w-96 max-w-[90vw] modal-panel" style="background: var(--color-surface-3);">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-success-50);">
            <div v-html="Helpers.IconLibrary.getIcon('userPlus', 'lucide', 24, '')" style="color: var(--color-success-600);"></div>
          </div>
          <h3 class="text-lg font-bold" style="color: var(--color-text-primary);">Create Account</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Name</label>
            <input 
              v-model="authForm.name"
              type="text" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="Enter your full name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Email</label>
            <input 
              v-model="authForm.email"
              type="email" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="Enter your email"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Display Name</label>
            <input 
              v-model="authForm.name"
              type="text" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="How your name appears"
            >
          </div>
          <div>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Password</label>
            <div class="relative">
              <input 
                :type="showPassword ? 'text' : 'password'"
                v-model="authForm.password"
                class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
                placeholder="Minimum 8 characters"
              >
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-2 flex items-center" style="color: var(--color-text-secondary);">
                <div v-if="showPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, '')"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('eye', 'lucide', 20, '')"></div>
              </button>
            </div>
            <p class="text-xs mt-1" style="color: var(--color-text-secondary);">Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleSignup"
            :disabled="authLoading"
            class="w-full btn-success disabled:opacity-50"
          >
            {{ authLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
          <button 
            @click="closeModal"
            class="w-full py-2 px-4 rounded-lg transition-colors"
            style="background: var(--color-surface-2); color: var(--color-text-primary);"
          >
            Cancel
          </button>
          <div class="text-center">
            <button 
              @click="showLoginForm"
              class="hover:underline text-sm"
              style="color: var(--color-text-secondary);"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.SignupModalComponent = SignupModal;
