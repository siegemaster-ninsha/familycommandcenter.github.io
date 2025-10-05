// App Modals Component
const AppModals = Vue.defineComponent({
  template: `
    <!-- Add to Quicklist Modal -->
    <div v-if="showAddToQuicklistModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-primary-50);">
            <div v-html="Helpers.IconLibrary.getIcon('monitor', 'lucide', 24, '')" style="color: var(--color-primary-600);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add to Quicklist</h3>
        </div>
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
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Type</label>
            <select 
              v-model="newQuicklistChore.category"
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              style="border-color: var(--color-border-card)"
            >
              <option value="regular">🏠 Regular Chore</option>
              <option value="school">📚 School Chore</option>
              <option value="game">🎮 Electronics Requirement</option>
            </select>
          </div>
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
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="addToQuicklist"
            class="flex-1 btn-secondary"
          >
            Add to Quicklist
          </button>
          <button 
            @click="cancelAddToQuicklist"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    

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
          Are you sure you want to remove "<span class="font-medium text-primary-custom">{{ personToDelete?.name }}</span>" from the family? 
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

    <!-- Add Chore Modal -->
    <div v-if="showAddChoreModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <h3 class="text-lg font-bold text-primary-custom mb-4">Add New Chore</h3>
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
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Type</label>
            <select 
              v-model="newChore.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="regular">🏠 Regular Chore</option>
              <option value="school">📚 School Chore</option>
              <option value="game">🎮 Electronics Requirement</option>
            </select>
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
        <div class="flex gap-3 mt-6">
          <button 
            @click="addChore"
            class="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add Chore
          </button>
          <button 
            @click="cancelAddChore"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- New Day Confirmation Modal -->
    <div v-if="showNewDayModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-warning-50);">
            <div v-html="Helpers.IconLibrary.getIcon('checkCircle', 'lucide', 24, '')" style="color: var(--color-warning-700);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Start New Day</h3>
        </div>
        <div class="space-y-4 mb-6">
          <div class="rounded-lg p-4" style="background: var(--color-warning-50); border: 1px solid color-mix(in srgb, var(--color-warning-600) 20%, white);">
            <h4 class="font-medium mb-2" style="color: var(--color-warning-700);">🌅 What happens when you start a new day:</h4>
            <ul class="text-sm space-y-1" style="color: var(--color-warning-700);">
              <li>• All current chores will be deleted</li>
              <li>• Family members' earnings will be <strong>preserved</strong></li>
              <li>• The board will be cleared for fresh daily chores</li>
            </ul>
          </div>
          <p class="text-secondary-custom text-sm">
            This action cannot be undone. Are you sure you want to start a new day?
          </p>
        </div>
        <div class="flex gap-3">
          <button 
            @click="startNewDay"
            :disabled="newDayLoading"
            class="flex-1 btn-warning disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <div v-if="newDayLoading" class="animate-spin h-4 w-4" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ newDayLoading ? 'Starting New Day...' : 'Start New Day' }}
          </button>
          <button 
            @click="cancelNewDay"
            :disabled="newDayLoading"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <div v-if="showLoginModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-primary-50);">
            <div v-html="Helpers.IconLibrary.getIcon('logIn', 'lucide', 24, '')" style="color: var(--color-primary-600);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Sign In</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="parent" v-model="authForm.mode"> Parent
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="radio" value="child" v-model="authForm.mode"> Child
            </label>
          </div>
          <div v-if="authForm.mode === 'parent'">
            <label class="block text-sm font-medium text-primary-custom mb-1">Email</label>
            <input 
              v-model="authForm.email"
              type="email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your email"
              @keyup.enter="handleLogin"
            >
          </div>
          <div v-else>
            <label class="block text-sm font-medium text-primary-custom mb-1">Username</label>
            <input 
              v-model="authForm.username"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your username"
              @keyup.enter="handleLogin"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <div class="relative">
              <input 
                :type="showLoginPassword ? 'text' : 'password'"
                v-model="authForm.password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Enter your password"
                @keyup.enter="handleLogin"
              >
              <button type="button" @click="showLoginPassword = !showLoginPassword" class="absolute inset-y-0 right-2 text-gray-500 hover:text-gray-700">
                <span v-if="showLoginPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleLogin"
            :disabled="authLoading"
            class="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {{ authLoading ? 'Signing In...' : 'Sign In' }}
          </button>
          <button 
            @click="closeAuthModals"
            class="w-full bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div class="text-center">
            <button 
              @click="showSignupForm"
              class="text-primary-custom hover:underline text-sm"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Signup Modal -->
    <div v-if="showSignupModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-success-50);">
            <div v-html="Helpers.IconLibrary.getIcon('userPlus', 'lucide', 24, '')" style="color: var(--color-success-600);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Create Account</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Name</label>
            <input 
              v-model="authForm.name"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your full name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Email</label>
            <input 
              v-model="authForm.email"
              type="email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your email"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Display Name</label>
            <input 
              v-model="authForm.name"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="How your name appears"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <div class="relative">
              <input 
                :type="showSignupPassword ? 'text' : 'password'"
                v-model="authForm.password"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
                placeholder="Minimum 8 characters"
              >
              <button type="button" @click="showSignupPassword = !showSignupPassword" class="absolute inset-y-0 right-2 text-gray-500 hover:text-gray-700">
                <span v-if="showSignupPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
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
            class="w-full bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <div class="text-center">
            <button 
              @click="showLoginForm"
              class="text-primary-custom hover:underline text-sm"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Confirmation Modal -->
   <div v-if="showConfirmModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-warning-50);">
            <div v-html="Helpers.IconLibrary.getIcon('mail', 'lucide', 24, '')" style="color: var(--color-warning-700);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Confirm Email</h3>
        </div>
        <div v-if="authError" class="rounded-lg p-3 mb-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
          <p class="text-sm" style="color: var(--color-error-700);">{{ authError }}</p>
        </div>
        <p class="text-secondary-custom mb-4">
          We've sent a confirmation code to <strong>{{ authForm.email }}</strong>. 
          Please enter the code below to verify your email.
        </p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Confirmation Code</label>
            <input 
              v-model="authForm.confirmationCode"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter 6-digit code"
              @keyup.enter="handleConfirmSignup"
            >
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleConfirmSignup"
            :disabled="authLoading"
            class="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {{ authLoading ? 'Confirming...' : 'Confirm Email' }}
          </button>
          <button 
            @click="closeAuthModals"
            class="w-full bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Chore Details Modal -->
    <div v-if="showChoreDetailsModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-primary-50);">
            <div v-html="Helpers.IconLibrary.getIcon('fileText', 'lucide', 24, '')" style="color: var(--color-primary-600);"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add Chore Details</h3>
        </div>
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
        <div class="flex gap-3 mt-6">
          <button 
            @click="confirmChoreDetails"
            class="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Create Chore
          </button>
          <button 
            @click="cancelChoreDetails"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Spending Modal -->
    <div v-if="showSpendingModal" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-full max-w-sm mx-4 modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-full" style="background: var(--color-error-50);">
            <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 24, '')" style="color: var(--color-error-700);"></div>
          </div>
          <div>
            <h3 class="text-lg font-bold text-primary-custom">Spend Money</h3>
            <p class="text-sm text-secondary-custom">{{ selectedPerson?.name }} - \${{ selectedPerson?.earnings.toFixed(2) }} available</p>
          </div>
        </div>
        
        <!-- Amount Display -->
        <div class="mb-4">
          <div class="text-center bg-gray-50 rounded-lg p-4 mb-4">
            <div class="text-2xl font-bold text-primary-custom">\${{ spendAmountString }}</div>
            <div class="text-sm text-secondary-custom">Amount to spend</div>
          </div>
        </div>
        
        <!-- Number Pad -->
        <div class="grid grid-cols-3 gap-2 mb-4">
          <button
            v-for="number in [1,2,3,4,5,6,7,8,9]"
            :key="number"
            @click="addDigit(number)"
            class="bg-gray-100 hover:bg-gray-200 text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            {{ number }}
          </button>
          <button
            @click="addDecimal"
            class="bg-gray-100 hover:bg-gray-200 text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
          >
            .
          </button>
          <button
            @click="addDigit(0)"
            class="bg-gray-100 hover:bg-gray-200 text-primary-custom font-bold py-3 px-4 rounded-lg transition-colors"
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
        
        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button
            @click="closeSpendingModal"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="confirmSpending"
            :disabled="spendAmount <= 0 || spendAmount > selectedPerson?.earnings"
            class="flex-1 px-4 py-2 btn-error disabled:bg-[color:var(--color-neutral-300)] disabled:cursor-not-allowed"
          >
            Spend Money
          </button>
        </div>
      </div>
    </div>

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
            <input v-model="$parent.childForm.username" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Enter a username">
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <div class="relative">
              <input :type="showChildPassword ? 'text' : 'password'" v-model="$parent.childForm.password" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10" placeholder="Enter a password">
              <button type="button" @click="showChildPassword = !showChildPassword" class="absolute inset-y-0 right-2 text-gray-500 hover:text-gray-700">
                <span v-if="showChildPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Display Name (optional)</label>
            <input v-model="$parent.childForm.displayName" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Sam">
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="$parent.createChild" class="flex-1 btn-success">Create</button>
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
        <div class="text-xs text-secondary-custom mb-4">Expires: {{ new Date($parent.inviteData.expiresAt).toLocaleString() }}</div>
        <div class="flex gap-3">
          <button @click="shareInvite()" class="flex-1 btn-secondary">Share</button>
          <button @click="copyInviteLink()" class="flex-1 btn-secondary">Copy Link</button>
          <button @click="closeInviteModal" class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      showLoginPassword: false,
      showSignupPassword: false,
      showChildPassword: false
    };
  },
  inject: [
    'showAddToQuicklistModal', 'newQuicklistChore',
    'showAddPersonModal', 'newPerson', 'showDeletePersonModal', 'personToDelete',
    'showAddChoreModal', 'newChore', 'showNewDayModal', 'newDayLoading',
    'showChoreDetailsModal', 'choreDetailsForm',
    'showSpendingModal', 'selectedPerson', 'spendAmount', 'spendAmountString',
    'showLoginModal', 'showSignupModal', 'showConfirmModal', 'authForm', 'authError', 'authLoading',
    'addChore', 'cancelAddChore', 'addPerson', 'cancelAddPerson',
    'addToQuicklist', 'cancelAddToQuicklist', 'startNewDay', 'cancelNewDay',
    'executeDeletePerson', 'cancelDeletePerson',
    'confirmChoreDetails', 'cancelChoreDetails',
    'closeSpendingModal', 'addDigit', 'addDecimal', 'clearSpendAmount', 'confirmSpending',
    'handleLogin', 'handleSignup', 'handleConfirmSignup', 'showLoginForm', 'showSignupForm', 'closeAuthModals',
    // add child / invite parent modals
    'showCreateChildModal', 'showInviteModal', 'closeCreateChildModal', 'closeInviteModal'
  ],
  methods: {
    // Use injected methods directly - they're already bound to the parent context
    getCategoryLabel(category) {
      switch(category) {
        case 'school': return 'School';
        case 'game': return 'Electronics';
        default: return 'Regular';
      }
    },
    getInviteLink() {
      const token = this.$parent?.inviteData?.token || '';
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
      const familyName = this.$parent?.accountSettings?.profile?.familyName || this.$parent?.currentUser?.name || 'a family';
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
        } catch {}
      }
    }
  }
});

// Export component for manual registration
window.AppModalsComponent = AppModals; 
