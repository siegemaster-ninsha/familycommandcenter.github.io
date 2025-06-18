// Account Page Component
const AccountPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Account Overview -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em]">⚙️ Account Settings</h2>
          <div class="flex items-center gap-3">
            <div class="bg-primary-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-primary-600" viewBox="0 0 256 256">
                <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-primary-custom">{{ currentUser?.name || 'User' }}</h3>
              <p class="text-sm text-secondary-custom">{{ currentUser?.email || 'user@example.com' }}</p>
            </div>
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your name"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-primary-custom mb-2">Email</label>
              <input 
                v-model="profileForm.email"
                type="email" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="The Smith Family"
              >
            </div>
            <div class="flex gap-3">
              <button
                @click="updateProfile"
                :disabled="profileLoading"
                class="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {{ profileLoading ? 'Saving...' : 'Save Changes' }}
              </button>
              <button
                @click="resetProfile"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Theme Selection -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          🎨 Theme Selection
        </h3>
        <p class="text-secondary-custom text-sm mb-6">Choose your preferred color theme for the application.</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="theme in availableThemes"
            :key="theme.id"
            @click="selectTheme(theme.id)"
            class="relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md"
            :class="selectedTheme === theme.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
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
            
            <!-- Theme preview -->
            <div class="mb-3">
              <div class="flex gap-2 mb-2">
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  :style="{ backgroundColor: theme.colors.primary }"
                ></div>
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  :style="{ backgroundColor: theme.colors.secondary }"
                ></div>
                <div 
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                  :style="{ backgroundColor: theme.colors.success }"
                ></div>
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
        
        <!-- Current Status and Apply Button -->
        <div class="mt-6 space-y-3">
          <div class="text-center">
            <p class="text-sm text-secondary-custom">
              Currently applied: <span class="font-medium text-primary-custom">{{ getCurrentThemeName() }}</span>
              <span v-if="selectedTheme !== currentTheme" class="text-orange-600">
                → Selected: <span class="font-medium">{{ getSelectedThemeName() }}</span>
              </span>
            </p>
          </div>
          
          <div class="flex justify-center">
            <button
              v-if="selectedTheme !== currentTheme"
              @click="applyTheme"
              :disabled="themeLoading"
              class="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="themeLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ themeLoading ? 'Applying...' : 'Apply Theme' }}
            </button>
            <div v-else class="text-emerald-600 font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path>
              </svg>
              Theme Applied
            </div>
          </div>
        </div>
      </div>

      <!-- App Preferences -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          📱 App Preferences
        </h3>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="font-medium text-primary-custom">Confetti Animations</label>
              <p class="text-sm text-secondary-custom">Show celebration animations when completing chores</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="preferences.confettiEnabled"
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="font-medium text-primary-custom">Sound Effects</label>
              <p class="text-sm text-secondary-custom">Play sounds for task completion and other actions</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="preferences.soundEnabled"
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="font-medium text-primary-custom">Auto-save Changes</label>
              <p class="text-sm text-secondary-custom">Automatically save changes without confirmation</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="preferences.autoSave"
                class="sr-only peer"
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
        
        <div class="mt-6">
          <button
            @click="savePreferences"
            :disabled="preferencesLoading"
            class="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {{ preferencesLoading ? 'Saving...' : 'Save Preferences' }}
          </button>
        </div>
      </div>

      <!-- Data Management -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          💾 Data Management
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 border border-gray-200 rounded-lg">
            <h4 class="font-medium text-primary-custom mb-2">Export Data</h4>
            <p class="text-sm text-secondary-custom mb-3">Download all your family's chore and earnings data</p>
            <button
              @click="exportData"
              class="w-full bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Export Data
            </button>
          </div>
          
          <div class="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 class="font-medium text-red-600 mb-2">Reset All Data</h4>
            <p class="text-sm text-red-600 mb-3">Permanently delete all chores, family members, and earnings</p>
            <button
              @click="showResetConfirmation = true"
              class="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
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
              class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {{ resetLoading ? 'Resetting...' : 'Yes, Reset Everything' }}
            </button>
            <button 
              @click="showResetConfirmation = false"
              class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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
      accountSettings: null,
      accountId: null,
      
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
        autoSave: true
      },
      preferencesLoading: false,
      
      showResetConfirmation: false,
      resetLoading: false,
      
      availableThemes: Object.values(CONFIG.THEMES)
    };
  },
  async mounted() {
    await this.loadAccountSettings();
    this.loadUserProfile();
    this.loadCurrentTheme();
    this.loadPreferences();
  },
  methods: {
    async loadAccountSettings() {
      try {
        const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          this.accountSettings = await response.json();
          this.accountId = this.accountSettings.accountId;
          
          // Load settings into local state
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
          
          console.log('✅ Account settings loaded:', this.accountSettings);
        } else {
          console.log('No account settings found, using defaults');
        }
      } catch (error) {
        console.error('Error loading account settings:', error);
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
      this.currentTheme = localStorage.getItem('selectedTheme') || 'default';
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
          const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings/${this.accountId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              profile: {
                displayName: this.profileForm.name,
                familyName: this.profileForm.familyName
              }
            })
          });

          if (response.ok) {
            this.accountSettings = await response.json();
            this.showSuccessMessage('Profile updated successfully!');
          } else {
            throw new Error('Failed to update profile');
          }
        } else {
          // Create new account settings
          const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });

          if (response.ok) {
            this.accountSettings = await response.json();
            this.accountId = this.accountSettings.accountId;
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
    
    selectTheme(themeId) {
      console.log('🎨 Theme selected:', themeId);
      this.selectedTheme = themeId;
    },
    
    async applyTheme() {
      if (this.selectedTheme === this.currentTheme) return;
      
      this.themeLoading = true;
      try {
        const theme = CONFIG.THEMES[this.selectedTheme];
        if (!theme) {
          console.error('Theme not found:', this.selectedTheme);
          return;
        }
        
        // Use centralized ThemeManager to apply theme
        ThemeManager.applyTheme(this.selectedTheme);
        
        // Save to backend if available
        if (this.accountId) {
          try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings/${this.accountId}/theme`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ theme: this.selectedTheme })
            });

            if (response.ok) {
              this.accountSettings = await response.json();
              console.log('✅ Theme saved to backend');
            } else {
              console.warn('Failed to save theme to backend, using localStorage');
            }
          } catch (error) {
            console.warn('Backend unavailable, using localStorage:', error);
          }
        }
        
        // Update local state
        this.currentTheme = this.selectedTheme;
        
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
            const response = await fetch(`${CONFIG.API.BASE_URL}/account-settings/${this.accountId}/preferences`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ preferences: this.preferences })
            });

            if (response.ok) {
              this.accountSettings = await response.json();
              console.log('✅ Preferences saved to backend');
            } else {
              console.warn('Failed to save preferences to backend, using localStorage');
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