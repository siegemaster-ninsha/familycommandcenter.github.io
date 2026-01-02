// App Modals Component
const AppModals = Vue.defineComponent({
  name: 'AppModals',
  setup() {
    // Access stores directly instead of using $parent
    // _Requirements: 4.2, 4.3, 7.1, 7.2_
    const familyStore = window.useFamilyStore();
    const authStore = window.useAuthStore();
    const uiStore = window.useUIStore();
    const choresStore = window.useChoresStore();
    
    return {
      familyStore,
      authStore,
      uiStore,
      choresStore
    };
  },
  template: `
    <!-- Add to Quicklist Flyout -->
    <flyout-panel
      :open="showAddToQuicklistModal"
      @close="cancelAddToQuicklist"
      title="Add to Quicklist"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newQuicklistChore.name"
              type="text" 
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Amount ($)</label>
            <input 
              v-model.number="newQuicklistChore.amount"
              type="number" 
              step="0.25"
              min="0"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="0.00"
            >
          </div>
          <!-- Category Selector - Requirements 2.1, 2.2 -->
          <category-selector
            v-model="newQuicklistChore.categoryId"
            :categories="categoriesStore?.categories || []"
            label="Category"
            @category-created="onQuicklistCategoryCreated"
          ></category-selector>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newQuicklistChore.isDetailed"
                class="w-4 h-4 rounded"
                style="color: var(--color-primary-600)"
              >
              <span class="text-sm font-medium text-primary-custom">Requires details when assigned</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">If checked, a details prompt will appear when this chore is assigned</p>
          </div>
          
          <!-- Optional Default Details Section -->
          <div v-if="newQuicklistChore.isDetailed" class="pt-2">
            <label class="block text-sm font-medium text-primary-custom mb-1">Default Details (Optional)</label>
            <textarea 
              v-model="newQuicklistChore.defaultDetails"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
              style="border-color: var(--color-border-card)"
              rows="3"
              placeholder="Add default instructions or notes that will pre-fill when assigning..."
            ></textarea>
            <p class="text-xs text-secondary-custom mt-1">These details will be pre-filled when assigning, but can be edited</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="addToQuicklist"
            @touchend.prevent="addToQuicklist"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            Add to Quicklist
          </button>
          <button 
            @click="cancelAddToQuicklist"
            @touchend.prevent="cancelAddToQuicklist"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    

    <!-- Delete Person Confirmation Modal -->
    <div v-if="showDeletePersonModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-error-50);">
            <div v-html="Helpers.IconLibrary.getIcon('user', 'lucide', 24, '')" style="color: var(--color-error-700);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Remove Family Member</h3>
        </div>
        <p class="text-secondary-custom mb-6">
          Are you sure you want to remove "<span class="font-medium text-primary-custom">{{ personToDelete?.displayName || personToDelete?.name || '' }}</span>" from the family? 
          All their assigned chores will be moved to unassigned. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button 
            @click="executeDeletePerson"
            class="flex-1 btn-error"
          >
            Remove Person
          </button>
          <button 
            @click="cancelDeletePerson"
            class="flex-1 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add Chore Flyout -->
    <flyout-panel
      :open="showAddChoreModal"
      @close="cancelAddChore"
      title="Add New Chore"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newChore.name"
              type="text" 
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Amount ($)</label>
            <input 
              v-model.number="newChore.amount"
              type="number" 
              step="0.50"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            >
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newChore.isDetailed"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              >
              <span class="text-sm font-medium text-primary-custom">Requires details when created</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">If checked, you'll be prompted to add details for this chore</p>
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                v-model="newChore.addToQuicklist"
                class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              >
              <span class="text-sm font-medium text-primary-custom">Add to quicklist</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">Also add this chore to the quicklist for future use</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="addChore"
            @touchend.prevent="addChore"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            Add Chore
          </button>
          <button 
            @click="cancelAddChore"
            @touchend.prevent="cancelAddChore"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Habit Flyout for create/edit -->
    <!-- **Feature: habit-tracking** -->
    <flyout-panel
      :open="showHabitFlyout"
      @close="closeHabitFlyout"
      :title="editingHabit ? 'Edit Habit' : 'New Habit'"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Habit Name</label>
            <input
              v-model="habitForm.name"
              @keydown.enter="submitHabitForm"
              type="text"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
              placeholder="e.g., Read 30 minutes"
              maxlength="100"
            />
            <p class="text-xs text-secondary-custom mt-1">{{ habitForm.name.length }}/100 characters</p>
          </div>
          <div v-if="habitFormError" class="rounded-lg p-3" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
            <p class="text-sm" style="color: var(--color-error-700);">{{ habitFormError }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="submitHabitForm"
            @touchend.prevent="submitHabitForm"
            :disabled="habitFormSubmitting"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            {{ habitFormSubmitting ? 'Saving...' : (editingHabit ? 'Save' : 'Create Habit') }}
          </button>
          <button 
            @click="closeHabitFlyout"
            @touchend.prevent="closeHabitFlyout"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- New Day Confirmation Flyout -->
    <!-- _Requirements: 4.1, 4.2_ -->
    <flyout-panel
      :open="showNewDayModal"
      @close="cancelNewDay"
      title="Start New Day"
      :show-footer="true"
      :show-header-close="false"
      width="400px"
    >
      <template #default>
        <div class="new-day-flyout-content">
          <!-- What will be cleared -->
          <div class="new-day-info-card new-day-info-card--error">
            <h4 class="new-day-info-title new-day-info-title--error">
              <span v-html="Helpers.IconLibrary.getIcon('trash2', 'lucide', 18, '')"></span> What will be cleared:
            </h4>
            <ul class="new-day-info-list new-day-info-list--error">
              <li>• All <strong>completed</strong> chores will be removed</li>
              <li>• All <strong>daily chores</strong> (configured per member) will be removed</li>
            </ul>
          </div>
          <!-- What will be created -->
          <div class="new-day-info-card new-day-info-card--success">
            <h4 class="new-day-info-title new-day-info-title--success">
              <span v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 18, '')"></span> What will be created:
            </h4>
            <ul class="new-day-info-list new-day-info-list--success">
              <li>• Fresh daily chores from each member's configured list</li>
              <li>• Duplicates will be automatically skipped</li>
            </ul>
          </div>
          <!-- What will be preserved -->
          <div class="new-day-info-card new-day-info-card--primary">
            <h4 class="new-day-info-title new-day-info-title--primary">
              <span v-html="Helpers.IconLibrary.getIcon('shield', 'lucide', 18, '')"></span> What will be preserved:
            </h4>
            <ul class="new-day-info-list new-day-info-list--primary">
              <li>• All family members' <strong>earnings</strong></li>
              <li>• Non-daily incomplete chores remain on the board</li>
            </ul>
          </div>
          <p class="new-day-warning-text">
            This action cannot be undone. Are you sure you want to start a new day?
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="startNewDay"
            @touchend.prevent="startNewDay"
            :disabled="newDayLoading"
            class="flex-1 btn-warning btn-compact flex items-center justify-center gap-2"
          >
            <div v-if="newDayLoading" class="new-day-spinner" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ newDayLoading ? 'Starting...' : 'Start New Day' }}
          </button>
          <button 
            @click="cancelNewDay"
            @touchend.prevent="cancelNewDay"
            :disabled="newDayLoading"
            class="btn-secondary btn-compact"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Login Modal -->
    <div v-if="showLoginModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
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
                :type="showLoginPassword ? 'text' : 'password'"
                v-model="authForm.password"
                class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
                placeholder="Enter your password"
                @keyup.enter="handleLogin"
              >
              <button type="button" @click="showLoginPassword = !showLoginPassword" class="absolute inset-y-0 right-2 flex items-center" style="color: var(--color-text-secondary);">
                <div v-if="showLoginPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, '')"></div>
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
            @click="closeAuthModals"
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

    <!-- Signup Modal -->
    <div v-if="showSignupModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
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
                :type="showSignupPassword ? 'text' : 'password'"
                v-model="authForm.password"
                class="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                style="background: var(--color-surface-2); border: 1px solid var(--color-border-card); color: var(--color-text-primary);"
                placeholder="Minimum 8 characters"
              >
              <button type="button" @click="showSignupPassword = !showSignupPassword" class="absolute inset-y-0 right-2 flex items-center" style="color: var(--color-text-secondary);">
                <div v-if="showSignupPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, '')"></div>
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
            @click="closeAuthModals"
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

    <!-- Email Confirmation Modal -->
   <div v-if="showConfirmModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
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
            @click="closeAuthModals"
            class="w-full py-2 px-4 rounded-lg transition-colors"
            style="background: var(--color-surface-2); color: var(--color-text-primary);"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Chore Details Flyout -->
    <flyout-panel
      :open="showChoreDetailsModal"
      @close="cancelChoreDetails"
      title="Add Chore Details"
      :show-footer="true"
      :show-header-close="false"
    >
      <template #default>
        <div class="mb-4">
          <div class="rounded-lg p-3" style="background: var(--color-primary-50); border: 1px solid var(--color-primary-200);">
            <p class="font-medium" style="color: var(--color-primary-700);">{{ choreDetailsForm.name }}</p>
            <div class="flex items-center gap-4 text-sm mt-1" style="color: var(--color-primary-600);">
              <span>\${{ choreDetailsForm.amount.toFixed(2) }}</span>
              <span>{{ getCategoryLabel(choreDetailsForm.category) }}</span>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Details</label>
            <textarea 
              v-model="choreDetailsForm.details"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
              rows="6"
              placeholder="Add any specific instructions, requirements, or notes for this chore..."
            ></textarea>
            <p class="text-xs text-secondary-custom mt-1">Optional: Add specific details about how to complete this chore</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="confirmChoreDetails"
            @touchend.prevent="confirmChoreDetails"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm"
          >
            Create Chore
          </button>
          <button 
            @click="cancelChoreDetails"
            @touchend.prevent="cancelChoreDetails"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Spending Flyout -->
    <flyout-panel
      :open="showSpendingModal"
      @close="closeSpendingModal"
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
            @click="clearSpendAmount"
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
            @click="confirmSpending"
            @touchend.prevent="confirmSpending"
            :disabled="spendAmount <= 0 || spendAmount > selectedPerson?.earnings"
            class="flex-1 btn-error btn-compact px-3 py-1.5 text-sm disabled:bg-[color:var(--color-neutral-300)] disabled:cursor-not-allowed"
          >
            Spend Money
          </button>
          <button
            @click="closeSpendingModal"
            @touchend.prevent="closeSpendingModal"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Create Child Modal -->
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
              <input :type="showChildPassword ? 'text' : 'password'" v-model="childForm.password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10" placeholder="Enter a password">
              <button type="button" @click="showChildPassword = !showChildPassword" class="absolute inset-y-0 right-2 text-gray-500 hover:text-gray-700 flex items-center">
                <div v-if="showChildPassword" v-html="Helpers.IconLibrary.getIcon('eyeOff', 'lucide', 20, 'text-gray-500')"></div>
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
          <button @click="closeCreateChildModal" class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Invite Parent Modal -->
    <div v-if="showInviteModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-indigo-100 p-2 rounded-full">
            <div v-html="Helpers.IconLibrary.getIcon('shield', 'lucide', 24, 'text-indigo-600')"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Invite Parent</h3>
        </div>
        <p class="text-sm text-secondary-custom mb-3">Share this link with the parent you want to invite. It will be valid for 7 days.</p>
        <div class="bg-gray-50 rounded p-3 text-xs break-all mb-3">{{ getInviteLink() }}</div>
        <div class="text-xs text-secondary-custom mb-4">Expires: {{ inviteExpiresAt }}</div>
        <div class="flex gap-3">
          <button @click="shareInvite()" class="flex-1 btn-secondary">Share</button>
          <button @click="copyInviteLink()" class="flex-1 btn-secondary">Copy Link</button>
          <button @click="closeInviteModal" class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>

    <!-- Multi-Assignment Flyout for Quicklist Chores -->
    <flyout-panel
      :open="showMultiAssignModal"
      @close="cancelMultiAssignment"
      :show-footer="true"
      :show-header-close="false"
      width="500px"
    >
      <template #title>
        <h2 class="text-lg font-bold text-primary-custom">Assign "{{ selectedQuicklistChore?.name }}"</h2>
      </template>
      <template #default>
        <!-- Category Selector for Quicklist Chore -->
        <div class="mb-4 p-3 rounded-lg" style="background: var(--color-surface-2); border: 1px solid var(--color-border-card);">
          <category-selector
            :model-value="selectedQuicklistChore?.categoryId || ''"
            :categories="categoriesStore?.categories || []"
            label="Category"
            @update:model-value="updateQuicklistChoreCategory"
            @category-created="onQuicklistCategoryCreated"
          ></category-selector>
        </div>

        <p class="text-secondary-custom mb-4">
          Select which family members should be assigned this chore.
        </p>

        <!-- Family Member Cards -->
        <div class="space-y-3 mb-4">
          <div
            v-for="person in people"
            :key="person.id"
            class="relative border-2 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg"
            :style="multiAssignSelectedMembers.includes(person.id) 
              ? { borderColor: 'var(--color-primary-500)', background: 'var(--color-primary-50)' } 
              : { borderColor: 'var(--color-border-card)', background: 'var(--color-surface-1)' }"
            @click="toggleMemberSelection(person.id)"
          >
            <div class="flex items-center gap-3">
              <!-- Checkbox -->
              <input
                type="checkbox"
                :checked="multiAssignSelectedMembers.includes(person.id)"
                @click.stop="toggleMemberSelection(person.id)"
                class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              >

              <!-- Person Info -->
              <div class="flex items-center gap-3 flex-1">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background: linear-gradient(to bottom right, var(--color-primary-500), var(--color-primary-600));">
                  {{ (person.displayName || person.name || '').charAt(0) }}
                </div>
                <div>
                  <h4 class="font-medium" style="color: var(--color-text-primary);">{{ person.displayName || person.name || '' }}</h4>
                  <p class="text-sm" style="color: var(--color-text-secondary);">\${{ person.earnings?.toFixed(2) || '0.00' }} earned</p>
                </div>
              </div>

              <!-- Electronics Status -->
              <div class="shrink-0">
                <div :style="getElectronicsStatusStyle(person.electronicsStatus?.status)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ getElectronicsStatusText(person.electronicsStatus?.status) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Count -->
        <div v-if="multiAssignSelectedMembers.length > 0" class="p-3 rounded-lg" style="background: var(--color-primary-50);">
          <p class="text-sm" style="color: var(--color-primary-700);">
            <span class="font-medium">{{ multiAssignSelectedMembers.length }}</span> member{{ multiAssignSelectedMembers.length !== 1 ? 's' : '' }} selected
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button
            @click="confirmMultiAssignment"
            @touchend.prevent="confirmMultiAssignment"
            :disabled="multiAssignSelectedMembers.length === 0 || multiAssignLoading"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="multiAssignLoading" class="animate-spin h-4 w-4" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ multiAssignLoading ? 'Assigning...' : 'Assign to ' + multiAssignSelectedMembers.length + ' Member' + (multiAssignSelectedMembers.length !== 1 ? 's' : '') }}
          </button>
          <button
            @click="cancelMultiAssignment"
            @touchend.prevent="cancelMultiAssignment"
            :disabled="multiAssignLoading"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Category Management Modal -->
    <!-- _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_ -->
    <category-management-modal
      :open="showCategoryManagementModal"
      @close="closeCategoryManagementModal"
    ></category-management-modal>
    
    <!-- Schedule Modal for Weekly Chore Scheduling -->
    <!-- **Feature: weekly-chore-scheduling** -->
    <!-- **Validates: Requirements 1.2, 1.3, 1.5** -->
    <schedule-modal
      :open="showScheduleModal"
      :quicklist-chore="scheduleModalChore"
      :family-members="people"
      @save="handleScheduleSave"
      @close="closeScheduleModal"
    ></schedule-modal>
    
    <!-- Default Order Modal for setting initial chore order on New Day -->
    <default-order-modal
      :open="showDefaultOrderModal"
      :member="defaultOrderMember"
      :quicklist-chores="quicklistChores"
      @save="handleDefaultOrderSave"
      @close="closeDefaultOrderModal"
    ></default-order-modal>
  `,
  data() {
    return {
      showLoginPassword: false,
      showSignupPassword: false,
      showChildPassword: false,
      multiAssignLoading: false
    };
  },
  mounted() {
    console.log('🔧 AppModals component mounted');
  },
  watch: {
    showMultiAssignModal(newVal, oldVal) {
      console.log('👀 showMultiAssignModal changed:', { old: oldVal, new: newVal });
      if (newVal) {
        console.log('📋 Modal props:', {
          showMultiAssignModal: this.showMultiAssignModal,
          selectedQuicklistChore: this.selectedQuicklistChore?.name || 'none',
          multiAssignSelectedMembers: this.multiAssignSelectedMembers
        });
      }
    }
  },
  inject: [
    'showAddToQuicklistModal', 'newQuicklistChore',
    'showAddPersonModal', 'newPerson', 'showDeletePersonModal', 'personToDelete',
    'showAddChoreModal', 'newChore', 'showNewDayModal', 'newDayLoading',
    'showChoreDetailsModal', 'choreDetailsForm',
    'showSpendingModal', 'selectedPerson', 'spendAmount', 'spendAmountString',
    'showLoginModal', 'showSignupModal', 'showConfirmModal', 'authForm', 'authError', 'authLoading',
    'showMultiAssignModal', 'selectedQuicklistChore', 'multiAssignSelectedMembers',
    // **Feature: habit-tracking** - Habit flyout
    'showHabitFlyout', 'habitFlyoutMemberId', 'editingHabit', 'habitForm', 'habitFormError', 'habitFormSubmitting',
    'addChore', 'cancelAddChore', 'addPerson', 'cancelAddPerson',
    'addToQuicklist', 'cancelAddToQuicklist', 'startNewDay', 'cancelNewDay',
    'executeDeletePerson', 'cancelDeletePerson',
    'confirmChoreDetails', 'cancelChoreDetails',
    'closeSpendingModal', 'addDigit', 'addDecimal', 'clearSpendAmount', 'confirmSpending',
    'handleLogin', 'handleSignup', 'handleConfirmSignup', 'showLoginForm', 'showSignupForm', 'closeAuthModals',
    'confirmMultiAssignment', 'cancelMultiAssignment',
    // add child / invite parent modals
    'showCreateChildModal', 'showInviteModal', 'closeCreateChildModal', 'closeInviteModal',
    'people',
    // Category management
    'categoriesStore',
    'showCategoryManagementModal',
    'closeCategoryManagementModal',
    // Schedule modal - **Feature: weekly-chore-scheduling**
    'showScheduleModal',
    'scheduleModalChore',
    'closeScheduleModal',
    'handleScheduleSave',
    // Default order modal
    'showDefaultOrderModal',
    'defaultOrderMember',
    'closeDefaultOrderModal',
    'handleDefaultOrderSave',
    'quicklistChores'
  ],
  computed: {
    // Map store data to component properties for template access
    // _Requirements: 4.2, 4.3, 7.1, 7.2_
    childForm() {
      return this.familyStore.childForm;
    },
    inviteData() {
      return this.familyStore.inviteData;
    },
    inviteExpiresAt() {
      const expiresAt = this.familyStore.inviteData?.expiresAt;
      return expiresAt ? new Date(expiresAt).toLocaleString() : '';
    },
    inviteToken() {
      return this.familyStore.inviteData?.token || '';
    },
    currentUser() {
      return this.authStore.currentUser;
    },
    accountSettings() {
      return this.authStore.accountSettings;
    }
  },
  methods: {
    // =============================================
    // STORE DELEGATION METHODS
    // These methods delegate to stores instead of $parent
    // _Requirements: 4.2, 4.3, 7.1, 7.2_
    // =============================================

    /**
     * Close the habit flyout
     * **Feature: habit-tracking**
     */
    closeHabitFlyout() {
      // Call the injected method from parent (still needed for now)
      // This will be fully migrated when habits store is complete
      if (this.$root?.closeHabitFlyout) {
        this.$root.closeHabitFlyout();
      }
    },

    /**
     * Submit the habit form
     * **Feature: habit-tracking**
     */
    submitHabitForm() {
      // Call the injected method from parent (still needed for now)
      if (this.$root?.submitHabitForm) {
        this.$root.submitHabitForm();
      }
    },

    /**
     * Create a child account
     */
    async createChild() {
      const result = await this.familyStore.createChild(this.childForm);
      if (result.success) {
        this.uiStore.showSuccess('Child account created');
        this.familyStore.resetChildForm();
        this.closeCreateChildModal();
      } else {
        this.uiStore.showError(result.error || 'Failed to create child account');
      }
    },

    /**
     * Update quicklist chore category
     */
    async updateQuicklistCategory(chore, categoryId, categoryName) {
      try {
        await this.choresStore.updateQuicklistChore(chore.id, { 
          categoryId: categoryId || null, 
          categoryName: categoryName || '' 
        });
      } catch (error) {
        console.error('Failed to update quicklist category:', error);
        this.uiStore.showError('Failed to update category');
      }
    },

    // Handle category created inline in quicklist form
    onQuicklistCategoryCreated(category) {
      console.log('[OK] Category created inline:', category.name);
    },
    // Update quicklist chore category from the flyout
    async updateQuicklistChoreCategory(categoryId) {
      if (!this.selectedQuicklistChore) return;
      
      const categoryName = categoryId 
        ? this.categoriesStore?.categories?.find(c => c.id === categoryId)?.name || ''
        : '';
      
      console.log('[OK] Updating quicklist chore category:', {
        choreId: this.selectedQuicklistChore.id,
        categoryId,
        categoryName
      });
      
      // Update local state immediately for responsive UI
      this.selectedQuicklistChore.categoryId = categoryId || null;
      this.selectedQuicklistChore.categoryName = categoryName;
      
      // Call store method to persist the change
      await this.updateQuicklistCategory(
        this.selectedQuicklistChore,
        categoryId,
        categoryName
      );
    },
    getCategoryLabel(category) {
      switch(category) {
        case 'school': return 'School';
        case 'game': return 'Electronics';
        default: return 'Regular';
      }
    },
    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'bg-green-100 text-green-800';
        case 'restricted': return 'bg-yellow-100 text-yellow-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        default: return 'bg-green-100 text-green-800';
      }
    },
    getElectronicsStatusStyle(status) {
      switch(status) {
        case 'allowed': return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
        case 'restricted': return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' };
        case 'blocked': return { backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' };
        default: return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
      }
    },
    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    },
    getInviteLink() {
      const token = this.inviteToken || '';
      const url = new URL(window.location.href);
      // build a link that preserves the repo/site path (important for GitHub Pages project sites)
      url.search = '';
      url.hash = '';
      // optional: drop trailing index.html for cleaner URL
      const cleanPath = url.pathname.replace(/index\.html$/i, '');
      return `${url.origin}${cleanPath}?invite=${encodeURIComponent(token)}`;
    },
    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.getInviteText());
      } catch (e) {
        console.warn('failed to copy invite link', e);
      }
    },
    getInviteText() {
      const familyName = this.accountSettings?.profile?.familyName || this.currentUser?.name || 'a family';
      const link = this.getInviteLink();
      return `You've been invited to join ${familyName}'s family on Family Command Center!\n\nAccept your invite: ${link}`;
    },
    async shareInvite() {
      const text = this.getInviteText();
      const link = this.getInviteLink();
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Family Command Center Invite', text, url: link });
        } else {
          await navigator.clipboard.writeText(text);
          alert('Invite text copied. Paste it into your message.');
        }
      } catch (e) {
        console.warn('share failed', e);
        try {
          await navigator.clipboard.writeText(text);
          alert('Invite text copied. Paste it into your message.');
        } catch { /* clipboard fallback failed */ }
      }
    },
    toggleMemberSelection(personId) {
      const index = this.multiAssignSelectedMembers.indexOf(personId);
      if (index > -1) {
        this.multiAssignSelectedMembers.splice(index, 1);
      } else {
        this.multiAssignSelectedMembers.push(personId);
      }
    }
  }
});

// Export component for manual registration
window.AppModalsComponent = AppModals; 
