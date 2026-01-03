/**
 * Login Modal Component
 * Encapsulated login modal with store-based state management
 * 
 * _Requirements: 1.1, 1.2, 1.3, 1.4_
 * - 1.1: Located at components/modals/auth/login-modal.js
 * - 1.2: Access visibility state via uiStore.isModalOpen('login')
 * - 1.3: Access form data via authStore.authForm, authStore.authError, authStore.authLoading
 * - 1.4: Delegate actions to authStore methods
 */
const LoginModal = Vue.defineComponent({
  name: 'LoginModal',
  
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
      return this.uiStore?.isModalOpen('login') || false;
    },
    // Form data from authStore
    authForm() {
      return this.authStore?.authForm || { mode: 'parent', email: '', username: '', password: '' };
    },
    authError() {
      return this.authStore?.authError || null;
    },
    authLoading() {
      return this.authStore?.authLoading || false;
    }
  },
  
  methods: {
    handleLogin() {
      this.authStore?.handleLogin();
    },
    showSignupForm() {
      this.authStore?.showSignupForm();
    },
    closeModal() {
      this.authStore?.closeAuthModals();
    }
  },

  template: `
    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="rounded-lg p-6 w-96 max-w-[90vw] modal-panel" style="background: var(--color-surface-3);">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-primary-50);">
            <div v-html="Helpers.IconLibrary.getIcon('logIn', 'lucide', 24, '')" style="color: var(--color-primary-600);"></div>
          </div>
          <h3 class="text-lg font-bold" style="color: var(--color-text-primary);">Sign In</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-primary);">
              <input type="radio" value="parent" v-model="authForm.mode"> Parent
            </label>
            <label class="flex items-center gap-2 text-sm" style="color: var(--color-text-primary);">
              <input type="radio" value="child" v-model="authForm.mode"> Child
            </label>
          </div>
          <div v-if="authForm.mode === 'parent'">
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Email</label>
            <input 
              v-model="authForm.email"
              type="email" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="Enter your email"
              @keyup.enter="handleLogin"
            >
          </div>
          <div v-else>
            <label class="block text-sm font-medium mb-1" style="color: var(--color-text-primary);">Username</label>
            <input 
              v-model="authForm.username"
              type="text" 
              class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
              placeholder="Enter your username"
              @keyup.enter="handleLogin"
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
                placeholder="Enter your password"
                @keyup.enter="handleLogin"
              >
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-2 flex items-center" style="color: var(--color-text-secondary);">
                <div v-if="showPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, '')"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('eye', 'lucide', 20, '')"></div>
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleLogin"
            :disabled="authLoading"
            class="w-full py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            style="background: var(--color-primary-500); color: white;"
          >
            {{ authLoading ? 'Signing In...' : 'Sign In' }}
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
              @click="showSignupForm"
              class="hover:underline text-sm"
              style="color: var(--color-text-secondary);"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.LoginModalComponent = LoginModal;
