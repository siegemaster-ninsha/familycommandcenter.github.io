// App Modals Component
const AppModals = Vue.defineComponent({
  template: `
    <!-- Add to Quicklist Modal -->
    <div v-if="showAddToQuicklistModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-purple-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-purple-600" viewBox="0 0 256 256">
              <path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H72V64a8,8,0,0,0,8,8H176a8,8,0,0,0,8-8V48h16V216Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add to Quicklist</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newQuicklistChore.name"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Type</label>
            <select 
              v-model="newQuicklistChore.category"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              >
              <span class="text-sm font-medium text-primary-custom">Requires details when assigned</span>
            </label>
            <p class="text-xs text-secondary-custom mt-1">If checked, a details prompt will appear when this chore is assigned</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="addToQuicklist"
            class="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
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

    <!-- Add Person Modal -->
    <div v-if="showAddPersonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-blue-600" viewBox="0 0 256 256">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add Family Member</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Name</label>
            <input 
              v-model="newPerson.name"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter person's name"
              @keyup.enter="addPerson"
            >
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="addPerson"
            class="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Add Person
          </button>
          <button 
            @click="cancelAddPerson"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Person Confirmation Modal -->
    <div v-if="showDeletePersonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
            </svg>
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
            class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Remove Person
          </button>
          <button 
            @click="cancelDeletePerson"
            class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add Chore Modal -->
    <div v-if="showAddChoreModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <h3 class="text-lg font-bold text-primary-custom mb-4">Add New Chore</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Name</label>
            <input 
              v-model="newChore.name"
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
    <div v-if="showNewDayModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-orange-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-orange-600" viewBox="0 0 256 256">
              <path d="M128,40a88,88,0,1,0,88,88A88.1,88.1,0,0,0,128,40Zm0,160a72,72,0,1,1,72-72A72.08,72.08,0,0,1,128,200ZM164.49,99.51a8,8,0,0,1,0,11.31L137.66,138.34a8,8,0,0,1-11.32,0L99.51,111.51a8,8,0,0,1,11.31-11.31L128,117.37l21.18-21.18A8,8,0,0,1,164.49,99.51Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Start New Day</h3>
        </div>
        <div class="space-y-4 mb-6">
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 class="font-medium text-orange-800 mb-2">🌅 What happens when you start a new day:</h4>
            <ul class="text-sm text-orange-700 space-y-1">
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
            class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="newDayLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
    <div v-if="showLoginModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-blue-600" viewBox="0 0 256 256">
              <path d="M141.66,133.66l-40,40A8,8,0,0,1,88,168V136H24a8,8,0,0,1,0-16H88V88a8,8,0,0,1,13.66-5.66l40,40A8,8,0,0,1,141.66,133.66ZM192,32H136a8,8,0,0,0,0,16h56V208H136a8,8,0,0,0,0,16h56a16,16,0,0,0,16-16V48A16,16,0,0,0,192,32Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Sign In</h3>
        </div>
        <div v-if="authError" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-red-600 text-sm">{{ authError }}</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Email</label>
            <input 
              v-model="authForm.email"
              type="email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your email"
              @keyup.enter="handleLogin"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <input 
              v-model="authForm.password"
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your password"
              @keyup.enter="handleLogin"
            >
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
    <div v-if="showSignupModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-green-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-green-600" viewBox="0 0 256 256">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Create Account</h3>
        </div>
        <div v-if="authError" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-red-600 text-sm">{{ authError }}</p>
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
            <label class="block text-sm font-medium text-primary-custom mb-1">Password</label>
            <input 
              v-model="authForm.password"
              type="password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Minimum 8 characters"
            >
            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters with uppercase, lowercase, and numbers.</p>
          </div>
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button 
            @click="handleSignup"
            :disabled="authLoading"
            class="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
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
    <div v-if="showConfirmModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-yellow-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-yellow-600" viewBox="0 0 256 256">
              <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Confirm Email</h3>
        </div>
        <div v-if="authError" class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p class="text-red-600 text-sm">{{ authError }}</p>
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
    <div v-if="showChoreDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-blue-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-blue-600" viewBox="0 0 256 256">
              <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24ZM72,40H200V184H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Add Chore Details</h3>
        </div>
        <div class="mb-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-blue-800 font-medium">{{ choreDetailsForm.name }}</p>
            <div class="flex items-center gap-4 text-sm text-blue-600 mt-1">
              <span>${{ choreDetailsForm.amount.toFixed(2) }}</span>
              <span>{{ getCategoryLabel(choreDetailsForm.category) }}</span>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-primary-custom mb-1">Chore Details</label>
            <textarea 
              v-model="choreDetailsForm.details"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows="4"
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
    <div v-if="showSpendingModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
              <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,64H224V88H32ZM32,192V104H224v88Z"></path>
            </svg>
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
            class="bg-red-100 hover:bg-red-200 text-red-600 font-bold py-3 px-4 rounded-lg transition-colors"
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
            class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Spend Money
          </button>
        </div>
      </div>
    </div>
  `,
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
    'handleLogin', 'handleSignup', 'handleConfirmSignup', 'showLoginForm', 'showSignupForm', 'closeAuthModals'
  ],
  methods: {
    // Use injected methods directly - they're already bound to the parent context
    getCategoryLabel(category) {
      switch(category) {
        case 'school': return '📚 School';
        case 'game': return '⚡ Electronics';
        default: return '🏠 Regular';
      }
    }
  }
});

// Export component for manual registration
window.AppModalsComponent = AppModals; 