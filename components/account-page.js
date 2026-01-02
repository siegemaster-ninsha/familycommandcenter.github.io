// Account Page Component
const AccountPage = Vue.defineComponent({
  name: 'AccountPage',
  template: `
    <div class="space-y-6">
      <!-- Account Overview -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('sun', 'lucide', 20, 'text-primary-custom')"></div>
            Account Settings
          </h2>
          <div class="flex items-center gap-3">
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-full shadow-md">
              <div v-html="Helpers.IconLibrary.getIcon('user', 'lucide', 24, 'text-white')"></div>
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
              <div v-if="$parent.authLoading" class="animate-spin h-4 w-4" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
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
                  class="w-full px-4 py-3 border-2 rounded-lg cursor-not-allowed opacity-60"
                  style="border-color: var(--color-border-card); background-color: var(--color-neutral-100);"
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
            <div v-html="Helpers.IconLibrary.getIcon('smartphone', 'lucide', 20, 'text-primary-custom')"></div>
            App Preferences
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
                <div class="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" style="background-color: var(--color-neutral-200);"></div>
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
                <div class="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" style="background-color: var(--color-neutral-200);"></div>
              </label>
            </div>
            
            <!-- Celebration Style Selector -->
            <div v-if="preferences.confettiEnabled" class="flex items-center justify-between">
              <div>
                <label class="font-medium text-primary-custom">Celebration Style</label>
                <p class="text-sm text-secondary-custom">Choose how to celebrate completed chores</p>
              </div>
              <select 
                v-model="preferences.celebrationStyle"
                @change="previewCelebration"
                class="px-3 py-2 rounded-lg border text-sm"
                style="background-color: var(--color-surface); border-color: var(--color-border); color: var(--color-text-primary);"
                :disabled="isChild"
              >
                <option value="random">🎲 Random</option>
                <option value="confetti">🎊 Confetti</option>
                <option value="cannons">💥 Side Cannons</option>
                <option value="fireworks">🎆 Fireworks</option>
                <option value="nyancat">🌈 Nyan Cat</option>
                <option value="coins">🪙 Mario Coins</option>
              </select>
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
                <div class="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" style="background-color: var(--color-neutral-200);"></div>
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
                <div class="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" style="background-color: var(--color-neutral-200);"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Auto-save indicator -->
        <div class="mt-6 text-center text-sm text-secondary-custom">
          <span v-if="autoSaving" class="flex items-center justify-center gap-2">
            <div class="animate-spin h-4 w-4" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-secondary-custom')"></div>
            Saving...
          </span>
          <span v-else-if="lastSaved" class="text-green-600">
            Settings saved automatically
          </span>
        </div>
      </div>

      <!-- Theme Selection -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('palette', 'lucide', 20, 'text-primary-custom')"></div>
          Theme Selection
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
              class="absolute top-2 left-2 text-white rounded-full w-6 h-6 flex items-center justify-center"
              style="background: var(--color-primary-500);"
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

      <!-- Calendar Configuration (Parents Only) -->
      <div v-if="!isChild" class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('calendar', 'lucide', 20, 'text-primary-custom')"></div>
          Family Calendars
        </h3>
        <p class="text-secondary-custom text-sm mb-6">Link iCloud or other iCal calendars to show events on the chore board.</p>
        
        <!-- Loading state -->
        <div v-if="calendarLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin h-6 w-6" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 24, 'text-primary-custom')"></div>
        </div>
        
        <template v-else>
          <!-- Existing calendars -->
          <div v-if="calendars.length > 0" class="space-y-3 mb-6">
            <div 
              v-for="(cal, index) in calendars" 
              :key="cal.id"
              class="flex items-center gap-3 p-3 rounded-lg border"
              style="border-color: var(--color-border-card); background: var(--color-neutral-50);"
            >
              <span 
                class="w-3 h-3 rounded-full flex-shrink-0" 
                :style="{ background: getCalendarColor(index) }"
              ></span>
              <span class="flex-1 font-medium text-primary-custom">{{ cal.name }}</span>
              <button 
                @click="removeCalendar(cal.id)"
                class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove calendar"
              >
                <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 16, 'text-red-500')"></div>
              </button>
            </div>
          </div>
          
          <!-- Add calendar form -->
          <div v-if="showAddCalendarForm" class="p-4 rounded-lg border mb-4" style="border-color: var(--color-border-card); background: var(--color-neutral-50);">
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-primary-custom mb-1">Calendar Name</label>
                <input 
                  v-model="newCalendarName"
                  type="text"
                  placeholder="e.g., Family, Work, School"
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style="border-color: var(--color-border-card);"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-primary-custom mb-1">Calendar URL</label>
                <input 
                  v-model="newCalendarUrl"
                  type="url"
                  placeholder="webcal://p123-caldav.icloud.com/..."
                  class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  style="border-color: var(--color-border-card);"
                  @keyup.enter="saveCalendar"
                >
              </div>
              <p v-if="calendarError" class="text-sm text-red-500">{{ calendarError }}</p>
              <div class="flex gap-2">
                <button 
                  @click="saveCalendar"
                  :disabled="calendarSaving"
                  class="btn-primary touch-target"
                >
                  {{ calendarSaving ? 'Adding...' : 'Add Calendar' }}
                </button>
                <button 
                  @click="showAddCalendarForm = false; calendarError = null;"
                  class="btn-secondary touch-target"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <!-- Help text -->
            <div class="mt-4 p-3 rounded-lg" style="background: var(--color-primary-50);">
              <p class="text-sm text-primary-custom font-medium mb-2">How to get your iCloud calendar URL:</p>
              <ol class="text-sm text-secondary-custom space-y-1 ml-4 list-decimal">
                <li>Open Calendar app on iPhone/Mac</li>
                <li>Tap the calendar name → Share</li>
                <li>Enable "Public Calendar"</li>
                <li>Copy the webcal:// link</li>
              </ol>
            </div>
          </div>
          
          <!-- Add button -->
          <button 
            v-if="!showAddCalendarForm"
            @click="showAddCalendarForm = true"
            class="btn-primary touch-target flex items-center gap-2"
          >
            <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
            Add Calendar
          </button>
        </template>
      </div>

      <!-- Data Management -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <h3 class="text-primary-custom text-lg font-bold mb-4 flex items-center gap-2">
          <div v-html="Helpers.IconLibrary.getIcon('database', 'lucide', 20, 'text-primary-custom')"></div>
          Data Management
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-6 border-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" style="border-color: var(--color-border-card);">
              <h4 class="font-medium text-primary-custom mb-3 text-lg">Export Data</h4>
              <p class="text-sm text-secondary-custom mb-4">Download all your family's chore and earnings data</p>
            <button
              @click="exportData"
              class="w-full btn-success touch-target min-h-[48px] font-medium"
            >
              Export Data
            </button>
          </div>
          
          <!-- Clear Offline Data -->
          <div class="p-6 border-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200" style="border-color: var(--color-border-card);">
            <h4 class="font-medium text-primary-custom mb-3 text-lg">Clear Offline Data</h4>
            <p class="text-sm text-secondary-custom mb-2">Clear cached data stored for offline use</p>
            <p class="text-xs text-secondary-custom mb-4" v-if="storageStats">
              {{ storageStats.quota.usageFormatted }} used • {{ storageStats.totalItems }} items cached
            </p>
            <button
              @click="showClearCacheConfirmation = true"
              :disabled="clearCacheLoading"
              class="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              {{ clearCacheLoading ? 'Clearing...' : 'Clear Offline Data' }}
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
            <div class="p-2 rounded-full" style="background: var(--color-error-50);">
              <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 24, '')" style="color: var(--color-error-700);"></div>
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
          <p class="font-medium mb-6" style="color: var(--color-error-700);">This action cannot be undone!</p>
          
          <div class="flex gap-3">
            <button 
              @click="confirmReset"
              :disabled="resetLoading"
              class="flex-1 btn-error touch-target min-h-[48px] font-medium"
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

      <!-- Clear Cache Confirmation Modal -->
      <div v-if="showClearCacheConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 rounded-full" style="background: var(--color-warning-50, #FEF3C7);">
              <div v-html="Helpers.IconLibrary.getIcon('trash2', 'lucide', 24, '')" style="color: var(--color-warning-700, #B45309);"></div>
            </div>
            <h3 class="text-lg font-bold text-primary-custom">Clear Offline Data</h3>
          </div>
          <p class="text-secondary-custom mb-4">
            This will clear all locally cached data used for offline access:
          </p>
          <ul class="text-sm text-secondary-custom mb-4 space-y-1 ml-4">
            <li>• Cached chores and quicklist items</li>
            <li>• Cached family member data</li>
            <li>• Service worker cached assets</li>
            <li>• Pending offline changes (if any)</li>
          </ul>
          <p class="text-sm text-secondary-custom mb-6">
            Your server data will not be affected. The app will re-download data when you're online.
          </p>
          
          <div class="flex gap-3">
            <button 
              @click="confirmClearCache"
              :disabled="clearCacheLoading"
              class="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              {{ clearCacheLoading ? 'Clearing...' : 'Yes, Clear Cache' }}
            </button>
            <button 
              @click="showClearCacheConfirmation = false"
              class="flex-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-primary-custom py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg touch-target min-h-[48px] font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  inject: [
    // Preloaded data from parent
    'accountSettings',
    'accountId',
    'currentUser'
  ],
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
        celebrationStyle: 'random',
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
      
      // Clear cache state
      showClearCacheConfirmation: false,
      clearCacheLoading: false,
      storageStats: null,
      
      // Calendar state
      calendars: [],
      calendarLoading: false,
      calendarSaving: false,
      calendarError: null,
      showAddCalendarForm: false,
      newCalendarName: '',
      newCalendarUrl: '',
      
      availableThemes: Object.values(CONFIG.THEMES),
      
      // Auto-save state
      autoSaving: false,
      lastSaved: false,
      _autoSaveTimer: null,
      _initialLoad: true
    };
  },
  watch: {
    // Auto-save preferences when they change (debounced)
    preferences: {
      handler() {
        if (this._initialLoad) return; // Skip initial load
        this._debouncedSavePreferences();
      },
      deep: true
    },
    // Auto-save profile when it changes (debounced)
    'profileForm.name'() {
      if (this._initialLoad) return;
      this._debouncedSaveProfile();
    },
    'profileForm.familyName'() {
      if (this._initialLoad) return;
      this._debouncedSaveProfile();
    }
  },
  async mounted() {
    // Data is now preloaded by parent component
    console.log('⚙️ Account page mounted with preloaded data');
    this.loadUserProfile();
    this.loadCurrentTheme();
    this.loadPreferences();
    this.loadStorageStats();
    this.loadCalendars();
    
    // Sync preloaded account settings to local state
    if (this.accountSettings) {
      this.syncAccountSettings();
    }
    
    // Allow watchers to trigger auto-save after initial load
    this.$nextTick(() => {
      this._initialLoad = false;
    });
  },
  beforeUnmount() {
    // Clear any pending auto-save timers
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
    }
  },
  computed: {
    isChild() {
      return this.currentUser?.role === 'child';
    }
  },
  methods: {
    // Preview celebration when style is changed
    previewCelebration() {
      const style = this.preferences.celebrationStyle;
      console.log('🎉 Previewing celebration:', style);
      
      // Use the celebrations composable
      const celebrations = window.useCelebrations?.();
      if (!celebrations) {
        console.warn('[account-page] useCelebrations not available');
        return;
      }
      
      // Trigger the specific celebration based on selection
      switch (style) {
        case 'confetti':
          celebrations.triggerConfettiBurst();
          break;
        case 'cannons':
          celebrations.triggerSideCannons();
          break;
        case 'fireworks':
          celebrations.triggerFireworks();
          break;
        case 'nyancat':
          celebrations.triggerNyanCat();
          break;
        case 'coins':
          // Preview with a fake $1 chore
          celebrations.triggerCoinRain({ amount: 1 });
          break;
        case 'random':
          celebrations.triggerRandomCelebration({ amount: 1 });
          break;
      }
    },
    
    // Debounced auto-save for preferences (500ms delay)
    _debouncedSavePreferences() {
      if (this._autoSaveTimer) {
        clearTimeout(this._autoSaveTimer);
      }
      this._autoSaveTimer = setTimeout(() => {
        this._autoSavePreferences();
      }, 500);
    },
    
    // Debounced auto-save for profile (500ms delay)
    _debouncedSaveProfile() {
      if (this._autoSaveTimer) {
        clearTimeout(this._autoSaveTimer);
      }
      this._autoSaveTimer = setTimeout(() => {
        this._autoSaveProfile();
      }, 500);
    },
    
    // Auto-save preferences (non-blocking)
    async _autoSavePreferences() {
      this.autoSaving = true;
      this.lastSaved = false;
      try {
        // Save to localStorage immediately
        localStorage.setItem('appPreferences', JSON.stringify(this.preferences));
        
        // Save to backend if available
        if (this.accountId) {
          try {
            await window.SettingsClient.updatePreferences(this.accountId, this.preferences, { ifMatch: this.$parent.accountSettings?.updatedAt });
            console.log('✅ Preferences auto-saved to backend');
          } catch (e) {
            console.warn('Failed to auto-save preferences to backend:', e);
          }
        }
        this.lastSaved = true;
        // Clear the "saved" indicator after 2 seconds
        setTimeout(() => { this.lastSaved = false; }, 2000);
      } catch (error) {
        console.error('Auto-save preferences failed:', error);
      } finally {
        this.autoSaving = false;
      }
    },
    
    // Auto-save profile (non-blocking)
    async _autoSaveProfile() {
      this.autoSaving = true;
      this.lastSaved = false;
      try {
        // Save to localStorage immediately
        localStorage.setItem('familyName', this.profileForm.familyName);
        localStorage.setItem('userProfile', JSON.stringify({
          name: this.profileForm.name,
          email: this.profileForm.email,
          familyName: this.profileForm.familyName
        }));
        
        // Save to backend if available
        if (this.accountId) {
          try {
            await window.SettingsClient.updateProfile(this.accountId, {
              displayName: this.profileForm.name,
              familyName: this.profileForm.familyName
            }, { ifMatch: this.$parent.accountSettings?.updatedAt });
            console.log('✅ Profile auto-saved to backend');
          } catch (e) {
            console.warn('Failed to auto-save profile to backend:', e);
          }
        }
        this.lastSaved = true;
        // Clear the "saved" indicator after 2 seconds
        setTimeout(() => { this.lastSaved = false; }, 2000);
      } catch (error) {
        console.error('Auto-save profile failed:', error);
      } finally {
        this.autoSaving = false;
      }
    },
    
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
    
    selectTheme(themeId) {
      if (themeId === this.currentTheme) return; // Don't reapply the same theme
      
      console.log('🎨 Theme selected and applying:', themeId);
      
      const theme = CONFIG.THEMES[themeId];
      if (!theme) {
        console.error('Theme not found:', themeId);
        return;
      }
      
      // 1. Apply theme immediately (synchronous) - this is the critical path
      ThemeManager.applyTheme(themeId);
      
      // 2. Save to localStorage immediately (synchronous)
      try {
        localStorage.setItem('selectedTheme', themeId);
      } catch (e) {
        console.warn('Failed to save theme to localStorage:', e);
      }
      
      // 3. Update local state immediately
      this.selectedTheme = themeId;
      this.currentTheme = themeId;
      
      // 4. Show success message immediately
      this.showSuccessMessage(`${theme.name} theme applied successfully!`);
      
      // 5. Save to backend asynchronously (non-blocking)
      this._saveThemeToBackend(themeId);
    },
    
    // Non-blocking backend save for theme
    async _saveThemeToBackend(themeId) {
      if (!this.accountId) {
        console.log('🎨 No account ID, skipping backend save');
        return;
      }
      
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
          console.log('✅ Theme saved to backend');
          // Don't reload account settings - theme is already applied locally
          // Reloading can cause race conditions where old theme overwrites new one
        } else {
          console.warn('Failed to save theme to backend (non-critical)');
        }
      } catch (error) {
        console.warn('Backend unavailable for theme save (non-critical):', error);
        // Theme is already applied locally, so this is non-critical
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

    // Load storage statistics for display
    async loadStorageStats() {
      try {
        if (window.offlineStorage) {
          this.storageStats = await window.offlineStorage.getStorageStats();
          console.log('📊 Storage stats loaded:', this.storageStats);
        }
      } catch (error) {
        console.error('Error loading storage stats:', error);
        this.storageStats = null;
      }
    },

    // Clear all offline cached data
    async confirmClearCache() {
      this.clearCacheLoading = true;
      try {
        if (window.offlineStorage) {
          const result = await window.offlineStorage.clearAllCachedData();
          
          if (result.success) {
            this.showClearCacheConfirmation = false;
            this.showSuccessMessage('Offline data cleared successfully!');
            
            // Refresh storage stats
            await this.loadStorageStats();
            
            // Update offline store pending count
            if (window.useOfflineStore) {
              const offlineStore = window.useOfflineStore();
              offlineStore.setPendingSyncCount(0);
            }
          } else {
            throw new Error('Failed to clear some cached data');
          }
        } else {
          throw new Error('Offline storage not available');
        }
      } catch (error) {
        console.error('Error clearing cache:', error);
        this.showSuccessMessage('Error clearing cache: ' + error.message);
      } finally {
        this.clearCacheLoading = false;
      }
    },

    // Calendar management methods
    async loadCalendars() {
      this.calendarLoading = true;
      try {
        // Use centralized apiService for consistent auth/accountId handling
        const data = await window.apiService.get('/calendar/config');
        this.calendars = data.calendars || [];
      } catch (error) {
        console.error('Error loading calendars:', error);
      } finally {
        this.calendarLoading = false;
      }
    },
    
    async saveCalendar() {
      if (!this.newCalendarUrl.trim()) {
        this.calendarError = 'Please enter a calendar URL';
        return;
      }
      if (!this.newCalendarName.trim()) {
        this.calendarError = 'Please enter a calendar name';
        return;
      }
      
      this.calendarSaving = true;
      this.calendarError = null;
      
      try {
        // Use centralized apiService for consistent auth/accountId handling
        await window.apiService.put('/calendar/config', {
          calendarUrl: this.newCalendarUrl,
          name: this.newCalendarName
        });
        
        // Reset form and reload
        this.newCalendarName = '';
        this.newCalendarUrl = '';
        this.showAddCalendarForm = false;
        await this.loadCalendars();
        this.showSuccessMessage('Calendar added successfully!');
      } catch (error) {
        this.calendarError = error.message;
      } finally {
        this.calendarSaving = false;
      }
    },
    
    async removeCalendar(calendarId) {
      if (!confirm('Remove this calendar?')) return;
      
      try {
        // Use centralized apiService for consistent auth/accountId handling
        await window.apiService.delete(`/calendar/config?id=${calendarId}`);
        
        await this.loadCalendars();
        this.showSuccessMessage('Calendar removed');
      } catch (error) {
        console.error('Failed to remove calendar:', error);
      }
    },
    
    getCalendarColor(index) {
      const CALENDAR_COLORS = [
        'var(--color-primary-500)',
        'var(--color-secondary-500)',
        'var(--color-success-500)',
        'var(--color-warning-500)',
        '#e91e63',
        '#9c27b0',
        '#00bcd4',
        '#ff5722'
      ];
      return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
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
