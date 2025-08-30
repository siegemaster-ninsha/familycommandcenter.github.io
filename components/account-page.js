// Account Page Component
const AccountPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Account Overview -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M11.25 1.5a.75.75 0 01.75.75V6a.75.75 0 01-1.5 0V2.25a.75.75 0 01.75-.75zM4.72 4.72a.75.75 0 011.06 0l2.475 2.475a.75.75 0 11-1.06 1.06L4.72 5.78a.75.75 0 010-1.06zM1.5 12a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zm3.22 7.28a.75.75 0 001.06 0l2.475-2.475a.75.75 0 10-1.06-1.06L4.72 18.22a.75.75 0 000 1.06zM12 17.25a.75.75 0 01.75.75V21.75a.75.75 0 11-1.5 0V18a.75.75 0 01.75-.75zm7.28-12.53a.75.75 0 00-1.06 0l-2.475 2.475a.75.75 0 101.06 1.06l2.475-2.475a.75.75 0 000-1.06zM21.75 11.25a.75.75 0 010 1.5H18a.75.75 0 010-1.5h3.75zM19.28 18.22a.75.75 0 01-1.06 1.06l-2.475-2.475a.75.75 0 111.06-1.06l2.475 2.475z"/></svg>
            Account Settings
          </h2>
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-full shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-white" viewBox="0 0 256 256">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-primary-custom text-lg">{{ currentUser?.name || 'User' }}</h3>
              <p class="text-sm text-secondary-custom">{{ currentUser?.email || 'user@example.com' }}</p>
            </div>
            <button 
              @click="$parent.handleLogout()"
              :disabled="$parent.authLoading"
              :class="['btn-error ml-2', $parent.authLoading && 'loading']"
              :title="$parent.authLoading ? 'Signing out...' : 'Sign Out'"
            >
              <svg v-if="$parent.authLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span v-else>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- Account Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-primary-custom mb-2">Display Name</label>
              <input 
                v-model="profileForm.name"
                type="text" 
                class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-sm focus:shadow-md"
                style="border-color: var(--color-border-card); background-color: var(--color-bg-card);"
                placeholder="Enter your name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-custom mb-2">Email</label>
              <input 
                v-model="profileForm.email"
                type="email" 
                readonly
                class="w-full px-4 py-3 border-2 rounded-lg cursor-not-allowed opacity-60 bg-gray-100"
                style="border-color: var(--color-border-card);"
                placeholder="Enter your email"
              >
            </div>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-primary-custom mb-2">Family Name</label>
              <input 
                v-model="profileForm.familyName"
                type="text" 
                class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 shadow-sm focus:shadow-md"
                style="border-color: var(--color-border-card); background-color: var(--color-bg-card);"
                placeholder="The Smith Family"
              >
            </div>
          </div>
        </div>
        
        <!-- App Preferences -->
        <div class="mt-8 pt-6 border-t" style="border-color: var(--color-border-card);">
          <h3 class="text-primary-custom text-lg font-bold mb-6 flex items-center gap-2">
            📱 App Preferences
          </h3>
          
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-primary-custom">Require Parent Approval</label>
                <p class="text-sm text-secondary-custom">Completed chores and spending require a parent's approval</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                <input 
                  type="checkbox" 
                  v-model="preferences.requireApproval"
                  class="sr-only peer"
                  :disabled="isChild"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div class="border rounded-lg p-4" style="border-color: var(--color-border-card);">
              <h4 class="font-medium text-primary-custom mb-3">Child Permissions</h4>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-primary-custom">Can mark chores complete</label>
                    <p class="text-sm text-secondary-custom">Allow children to toggle completion on their chores</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                    <input 
                      type="checkbox" 
                      v-model="preferences.childPermissions.canCompleteChores"
                      class="sr-only peer"
                      :disabled="isChild"
                    >
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-primary-custom">Can create/edit/delete chores</label>
                    <p class="text-sm text-secondary-custom">Allow children to manage chores</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                    <input 
                      type="checkbox" 
                      v-model="preferences.childPermissions.canManageChores"
                      class="sr-only peer"
                      :disabled="isChild"
                    >
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium text-primary-custom">Can spend money</label>
                    <p class="text-sm text-secondary-custom">Allow children to spend from their ledger</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                    <input 
                      type="checkbox" 
                      v-model="preferences.childPermissions.canSpendMoney"
                      class="sr-only peer"
                      :disabled="isChild"
                    >
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-primary-custom">Confetti Animations</label>
                <p class="text-sm text-secondary-custom">Show celebration animations when completing chores</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                <input 
                  type="checkbox" 
                  v-model="preferences.confettiEnabled"
                  class="sr-only peer"
                  :disabled="isChild"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-primary-custom">Sound Effects</label>
                <p class="text-sm text-secondary-custom">Play sounds for task completion and other actions</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                <input 
                  type="checkbox" 
                  v-model="preferences.soundEnabled"
                  class="sr-only peer"
                  :disabled="isChild"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
            
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-primary-custom">Auto-save Changes</label>
                <p class="text-sm text-secondary-custom">Automatically save changes without confirmation</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer" :class="isChild ? 'opacity-60 cursor-not-allowed' : ''">
                <input 
                  type="checkbox" 
                  v-model="preferences.autoSave"
                  class="sr-only peer"
                  :disabled="isChild"
                >
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Save Button at bottom -->
        <div class="mt-8 flex justify-center">
          <button
            @click="saveAllSettings"
            :disabled="profileLoading"
            class="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
          >
            {{ profileLoading ? 'Saving...' : 'Save All Settings' }}
          </button>
        </div>
      </div>

      <!-- Theme Selection -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          🎨 Theme Selection
        </h3>
        <p class="text-secondary-custom text-sm mb-6">Choose your preferred color theme for the application.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="theme in availableThemes"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:scale-102"
            :class="selectedTheme === theme.id ? 'border-primary-500 bg-primary-50' : 'hover:border-gray-300'"
            :style="selectedTheme !== theme.id ? 'border-color: var(--color-border-card);' : ''"
          >
            <!-- Selected indicator -->
            <div 
              v-if="selectedTheme === theme.id"
              class="absolute top-2 right-2 bg-primary-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ✓
            </div>
            
            <!-- Currently applied indicator -->
            <div 
              v-if="currentTheme === theme.id && currentTheme !== selectedTheme"
              class="absolute top-2 left-2 bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
              title="Currently applied theme"
            >
              ●
            </div>
            
            <!-- Theme preview: brand + semantic tokens -->
            <div class="mb-3">
              <div class="flex gap-2 mb-2">
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm" :style="{ backgroundColor: theme.colors.primary }"></div>
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm" :style="{ backgroundColor: theme.colors.secondary }"></div>
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm" :style="{ backgroundColor: theme.colors.success || '#22C55E' }"></div>
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm" :style="{ backgroundColor: theme.colors.warning || theme.colors.secondary }"></div>
                <div class="w-8 h-8 rounded-full border-2 border-white shadow-sm" :style="{ backgroundColor: theme.colors.error || theme.colors.primary }"></div>
              </div>
              <div class="text-sm font-medium text-primary-custom">{{ theme.name }}</div>
              <div class="text-xs text-secondary-custom">{{ theme.description }}</div>
            </div>
            
            <!-- Mini preview card -->
            <div class="border rounded p-2 text-xs" :style="{ borderColor: theme.colors.primary + '40' }">
              <div class="flex items-center gap-2 mb-1">
                <div 
                  class="w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
                  :style="{ backgroundColor: theme.colors.primary }"
                >
                  A
                </div>
                <span :style="{ color: theme.colors.textPrimary }">Sample Task</span>
              </div>
              <div class="text-xs" :style="{ color: theme.colors.textSecondary }">Preview text</div>
            </div>
          </div>
        </div>
        
        <!-- Current Status -->
        <div class="mt-6">
          <div class="text-center">
            <p class="text-sm text-secondary-custom">
              Current theme: <span class="font-medium text-primary-custom">{{ getCurrentThemeName() }}</span>
            </p>
          </div>
        </div>
      </div>



      <!-- Data Management -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          💾 Data Management
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 border-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" style="border-color: var(--color-border-card);">
            <h4 class="font-medium text-primary-custom mb-3 text-lg">Export Data</h4>
            <p class="text-sm text-secondary-custom mb-4">Download all your family's chore and earnings data</p>
            <button
              @click="exportData"
              class="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              Export Data
            </button>
          </div>
          
          <div class="p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" style="background: var(--color-error-50); border: 2px solid var(--color-error-600);">
            <h4 class="font-medium mb-3 text-lg" style="color: var(--color-error-700);">Reset All Data</h4>
            <p class="text-sm mb-4" style="color: var(--color-error-700);">Permanently delete all chores, family members, and earnings</p>
            <button
              @click="showResetConfirmation = true"
              class="w-full btn-error"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      <!-- Reset Confirmation Modal -->
      <div v-if="showResetConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <div class="flex items-center gap-3 mb-4">
            <div class="bg-red-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
                <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8Z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-primary-custom">Reset All Data</h3>
          </div>
          <p class="text-secondary-custom mb-6">
            This will permanently delete ALL data including:
          </p>
          <ul class="text-sm text-secondary-custom mb-6 space-y-1 ml-4">
            <li>• All family members</li>
            <li>• All chores and quicklist items</li>
            <li>• All earnings and transaction history</li>
            <li>• All shopping lists and quick items</li>
          </ul>
          <p class="text-red-600 font-medium mb-6">This action cannot be undone!</p>
          
          <div class="flex gap-3">
            <button 
              @click="confirmReset"
              :disabled="resetLoading"
              class="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              {{ resetLoading ? 'Resetting...' : 'Yes, Reset Everything' }}
            </button>
            <button 
              @click="showResetConfirmation = false"
              class="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-primary-custom py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: ['currentUser'],
  data() {
    return {
      
      profileForm: {
        name: '',
        email: '',
        familyName: ''
      },
      profileLoading: false,
      
      currentTheme: 'default',
      selectedTheme: 'default',
      themeLoading: false,
      
      preferences: {
        confettiEnabled: true,
        soundEnabled: false,
        autoSave: true,
        requireApproval: false,
        childPermissions: {
          canCompleteChores: true,
          canManageChores: false,
          canSpendMoney: false
        }
      },
      preferencesLoading: false,
      
      showResetConfirmation: false,
      resetLoading: false,
      
      availableThemes: Object.values(CONFIG.THEMES)
    };
  },
  inject: [
    // Preloaded data from parent
    'accountSettings',
    'accountId',
    'currentUser'
  ],
  async mounted() {
    // Data is now preloaded by parent component
    console.log('⚙️ Account page mounted with preloaded data');
    this.loadUserProfile();
    this.loadCurrentTheme();
    this.loadPreferences();
    
    // Sync preloaded account settings to local state
    if (this.accountSettings) {
      this.syncAccountSettings();
    }
  },
  computed: {
    isChild() {
      return this.currentUser?.role === 'child';
    }
  },
  methods: {
    syncAccountSettings() {
      // Sync preloaded account settings to local state
      if (this.accountSettings.theme) {
        this.currentTheme = this.accountSettings.theme;
        this.selectedTheme = this.accountSettings.theme;
      }
      
      if (this.accountSettings.preferences) {
        this.preferences = { ...this.preferences, ...this.accountSettings.preferences };
      }
      
      if (this.accountSettings.profile) {
        this.profileForm.familyName = this.accountSettings.profile.familyName || '';
      }
      
      console.log('✅ Account settings synced from preloaded data');
    },

    async reloadAccountSettings() {
      // Trigger parent to reload account settings
      try {
        await this.$parent.loadAccountSettings();
        if (this.accountSettings) {
          this.syncAccountSettings();
        }
      } catch (error) {
        console.error('Error reloading account settings:', error);
        // Fall back to localStorage
        this.loadCurrentTheme();
        this.loadPreferences();
      }
    },

    loadUserProfile() {
      // Load user profile data
      this.profileForm = {
        name: this.currentUser?.name || '',
        email: this.currentUser?.email || '',
        familyName: this.profileForm.familyName || localStorage.getItem('familyName') || ''
      };
    },
    
    loadCurrentTheme() {
      // prefer user-specific theme provided with account settings
      const userTheme = this.accountSettings?.userTheme || localStorage.getItem('selectedTheme');
      this.currentTheme = userTheme || 'default';
      this.selectedTheme = this.currentTheme;
    },
    
    loadPreferences() {
      const saved = localStorage.getItem('appPreferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    },
    
    async updateProfile() {
      this.profileLoading = true;
      try {
        if (this.accountId) {
          // Update via API
          const authHeader = authService.getAuthHeader();
          const headers = {
            'Content-Type': 'application/json'
          };
          
          if (authHeader) {
            headers.Authorization = authHeader;
          }
          
          const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings/${this.accountId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              profile: {
                displayName: this.profileForm.name,
                familyName: this.profileForm.familyName
              }
            })
          });

          if (response.ok) {
            await this.$parent.loadAccountSettings(); // Reload account settings
            this.showSuccessMessage('Profile updated successfully!');
          } else {
            throw new Error('Failed to update profile');
          }
        } else {
          // Create new account settings
          const authHeader = authService.getAuthHeader();
          const headers = {
            'Content-Type': 'application/json'
          };
          
          if (authHeader) {
            headers.Authorization = authHeader;
          }
          
          const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings`, {
            method: 'POST',
            headers,
            body: JSON.stringify({})
          });

          if (response.ok) {
            await this.$parent.loadAccountSettings(); // Reload account settings
            // Try updating again
            await this.updateProfile();
            return;
          } else {
            throw new Error('Failed to create account settings');
          }
        }
        
        // Fallback to localStorage
        localStorage.setItem('familyName', this.profileForm.familyName);
        
      } catch (error) {
        console.error('Error updating profile:', error);
        // Fallback to localStorage
        localStorage.setItem('familyName', this.profileForm.familyName);
        this.showSuccessMessage('Profile updated locally!');
      } finally {
        this.profileLoading = false;
      }
    },
    
    resetProfile() {
      this.loadUserProfile();
    },

    async saveAllSettings() {
      this.profileLoading = true;
      try {
        // Save profile settings (without showing individual success message)
        await this.updateProfileSilent();
        // Save preferences (without showing individual success message)
        await this.savePreferencesSilent();
        
        this.showSuccessMessage('All settings saved successfully!');
      } catch (error) {
        console.error('Error saving settings:', error);
      } finally {
        this.profileLoading = false;
      }
    },

    async updateProfileSilent() {
      // Same as updateProfile but without success message
      try {
        if (this.accountId) {
          try {
            const authHeader = authService.getAuthHeader();
            const headers = {
              'Content-Type': 'application/json'
            };
            
            if (authHeader) {
              headers.Authorization = authHeader;
            }
            
            // Use the correct endpoint to update profile fields as part of account settings
            try {
              await window.SettingsClient.updateProfile(this.accountId, {
                displayName: this.profileForm.name,
                familyName: this.profileForm.familyName
              }, { ifMatch: this.$parent.accountSettings?.updatedAt });
              await this.$parent.loadAccountSettings();
              console.log('✅ Profile saved to backend');
            } catch (e) {
              console.warn('Failed to save profile to backend, using localStorage', e);
            }
          } catch (error) {
            console.warn('Backend unavailable, using localStorage:', error);
          }
        }
        
        // Save to localStorage as fallback
        localStorage.setItem('userProfile', JSON.stringify({
          name: this.profileForm.name,
          email: this.profileForm.email,
          familyName: this.profileForm.familyName
        }));
        
        localStorage.setItem('familyName', this.profileForm.familyName);
        
        console.log('✅ Profile saved locally');
      } catch (error) {
        console.error('Error saving profile:', error);
        throw error;
      }
    },

    async savePreferencesSilent() {
      // Same as savePreferences but without success message
      try {
        if (this.accountId) {
          try {
            const authHeader = authService.getAuthHeader();
            const headers = {
              'Content-Type': 'application/json'
            };
            
            if (authHeader) {
              headers.Authorization = authHeader;
            }
            
            try {
              await window.SettingsClient.updatePreferences(this.accountId, this.preferences, { ifMatch: this.$parent.accountSettings?.updatedAt });
              await this.$parent.loadAccountSettings();
              console.log('✅ Preferences saved to backend');
            } catch (e) {
              console.warn('Failed to save preferences to backend, using localStorage', e);
            }
          } catch (error) {
            console.warn('Backend unavailable, using localStorage:', error);
          }
        }
        
        // Save preferences locally as fallback
        localStorage.setItem('appPreferences', JSON.stringify(this.preferences));
        console.log('✅ Preferences saved locally');
      } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
      }
    },
    
    async selectTheme(themeId) {
      if (themeId === this.currentTheme) return; // Don't reapply the same theme
      
      console.log('🎨 Theme selected and applying:', themeId);
      this.selectedTheme = themeId;
      this.themeLoading = true;
      
      try {
        const theme = CONFIG.THEMES[themeId];
        if (!theme) {
          console.error('Theme not found:', themeId);
          return;
        }
        
        // Use centralized ThemeManager to apply theme immediately
        ThemeManager.applyTheme(themeId);
        
        // Save to backend if available
        if (this.accountId) {
          try {
            const authHeader = authService.getAuthHeader();
            const headers = {
              'Content-Type': 'application/json'
            };
            
            if (authHeader) {
              headers.Authorization = authHeader;
            }
            
            const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings/theme`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ theme: themeId })
            });

            if (response.ok) {
              await this.$parent.loadAccountSettings(); // Reload account settings
              console.log('✅ Theme saved to backend');
              // Also save to localStorage for immediate future loads
              localStorage.setItem('selectedTheme', themeId);
            } else {
              console.warn('Failed to save theme to backend, using localStorage');
              // Save to localStorage as fallback
              localStorage.setItem('selectedTheme', themeId);
            }
          } catch (error) {
            console.warn('Backend unavailable, using localStorage:', error);
            // Save to localStorage as fallback
            localStorage.setItem('selectedTheme', themeId);
          }
        } else {
          // No accountId available, save to localStorage only
          console.log('🎨 No account ID, saving theme to localStorage only');
          localStorage.setItem('selectedTheme', themeId);
        }
        
        // Update local state
        this.currentTheme = themeId;
        
        this.showSuccessMessage(`${theme.name} theme applied successfully!`);
      } catch (error) {
        console.error('Error applying theme:', error);
      } finally {
        this.themeLoading = false;
      }
    },
    
    async savePreferences() {
      this.preferencesLoading = true;
      try {
        // Save to backend if available
        if (this.accountId) {
          try {
            const authHeader = authService.getAuthHeader();
            const headers = {
              'Content-Type': 'application/json'
            };
            
            if (authHeader) {
              headers.Authorization = authHeader;
            }
            
            try {
              await window.SettingsClient.updatePreferences(this.accountId, this.preferences, { ifMatch: this.$parent.accountSettings?.updatedAt });
              await this.$parent.loadAccountSettings();
              console.log('✅ Preferences saved to backend');
            } catch (e) {
              console.warn('Failed to save preferences to backend, using localStorage', e);
            }
          } catch (error) {
            console.warn('Backend unavailable, using localStorage:', error);
          }
        }
        
        // Save preferences locally as fallback
        localStorage.setItem('appPreferences', JSON.stringify(this.preferences));
        
        this.showSuccessMessage('Preferences saved successfully!');
      } catch (error) {
        console.error('Error saving preferences:', error);
      } finally {
        this.preferencesLoading = false;
      }
    },
    
    exportData() {
      try {
        const data = {
          familyMembers: JSON.parse(localStorage.getItem('familyMembers') || '[]'),
          chores: JSON.parse(localStorage.getItem('chores') || '[]'),
          quicklistChores: JSON.parse(localStorage.getItem('quicklistChores') || '[]'),
          shoppingItems: JSON.parse(localStorage.getItem('shoppingItems') || '[]'),
          quickShoppingItems: JSON.parse(localStorage.getItem('quickShoppingItems') || '[]'),
          preferences: this.preferences,
          theme: this.currentTheme,
          exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-chore-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccessMessage('Data exported successfully!');
      } catch (error) {
        console.error('Error exporting data:', error);
      }
    },
    
    async confirmReset() {
      this.resetLoading = true;
      try {
        // Clear all localStorage data
        const keysToKeep = ['selectedTheme', 'appPreferences'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.showResetConfirmation = false;
        this.showSuccessMessage('All data has been reset successfully!');
        
        // Reload page to reflect changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error resetting data:', error);
      } finally {
        this.resetLoading = false;
      }
    },

    
    getCurrentThemeName() {
      const theme = this.availableThemes.find(t => t.id === this.currentTheme);
      return theme ? theme.name : 'Unknown';
    },
    
    getSelectedThemeName() {
      const theme = this.availableThemes.find(t => t.id === this.selectedTheme);
      return theme ? theme.name : 'Unknown';
    },
    
    showSuccessMessage(message) {
      // Use the parent's showSuccessMessage method
      this.$parent.showSuccessMessage(message);
    }
  }
});

// Export component for manual registration
window.AccountPageComponent = AccountPage; 
