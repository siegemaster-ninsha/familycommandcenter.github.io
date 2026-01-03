// Create Child Modal Component
// _Requirements: 7.1, 7.2, 7.3, 7.4_
// Encapsulated modal for creating child accounts
const CreateChildModal = Vue.defineComponent({
  name: 'CreateChildModal',
  
  // Access stores in setup()
  setup() {
    const familyStore = window.useFamilyStore?.();
    const uiStore = window.useUIStore?.();
    return { familyStore, uiStore };
  },
  
  // Inject props from parent (preserves existing contracts)
  inject: ['showCreateChildModal', 'closeCreateChildModal'],
  
  data() {
    return {
      showPassword: false
    };
  },
  
  computed: {
    // Access form data from familyStore
    // _Requirements: 7.3_
    childForm() {
      return this.familyStore?.childForm || { username: '', password: '', displayName: '' };
    }
  },
  
  methods: {
    /**
     * Create a child account - delegates to familyStore
     * _Requirements: 7.4_
     */
    async createChild() {
      const result = await this.familyStore?.createChild(this.childForm);
      if (result?.success) {
        this.uiStore?.showSuccess('Child account created');
        this.familyStore?.resetChildForm();
        this.closeCreateChildModal?.();
      } else {
        this.uiStore?.showError(result?.error || 'Failed to create child account');
      }
    },
    
    /**
     * Handle cancel - delegates to injected method
     */
    handleCancel() {
      this.closeCreateChildModal?.();
    }
  },
  
  template: `
    <!-- Create Child Modal -->
    <!-- _Requirements: 7.1, 7.2, 7.3, 7.4_ -->
    <div v-if="showCreateChildModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-success-50);">
            <div v-html="Helpers.IconLibrary.getIcon('userPlus', 'lucide', 24, '')" style="color: var(--color-success-600);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add Child Account</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Username</label>
            <input v-model="childForm.username" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter a username">
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <div class="relative">
              <input :type="showPassword ? 'text' : 'password'" v-model="childForm.password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10" placeholder="Enter a password">
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-2 text-gray-500 hover:text-gray-700 flex items-center">
                <div v-if="showPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, 'text-gray-500')"></div>
                <div v-else v-html="Helpers.IconLibrary.getIcon('eye', 'lucide', 20, 'text-gray-500')"></div>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Display Name (optional)</label>
            <input v-model="childForm.displayName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Sam">
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="createChild" class="flex-1 btn-success">Create</button>
          <button @click="handleCancel" class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.CreateChildModalComponent = CreateChildModal;
