// App Modals Component
const AppModals = Vue.defineComponent({
  template: `
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-red-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
              <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-[#0d0f1c]">Delete Chore</h3>
        </div>
        <p class="text-[#47569e] mb-6">
          Are you sure you want to delete "<span class="font-medium text-[#0d0f1c]">{{ choreToDelete?.name }}</span>"? This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button 
            @click="confirmDelete"
            class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button 
            @click="cancelDelete"
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add to Quicklist Modal -->
    <div v-if="showAddToQuicklistModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-purple-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="text-purple-600" viewBox="0 0 256 256">
              <path d="M200,32H163.74a47.92,47.92,0,0,0-71.48,0H56A16,16,0,0,0,40,48V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm-72,0a32,32,0,0,1,32,32H96A32,32,0,0,1,128,32Zm72,184H56V48H72V64a8,8,0,0,0,8,8H176a8,8,0,0,0,8-8V48h16V216Z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-[#0d0f1c]">Add to Quicklist</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Chore Name</label>
            <input 
              v-model="newQuicklistChore.name"
              type="text" 
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Amount ($)</label>
            <input 
              v-model.number="newQuicklistChore.amount"
              type="number" 
              step="0.25"
              min="0"
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.00"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Chore Type</label>
            <select 
              v-model="newQuicklistChore.category"
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="regular">🏠 Regular Chore</option>
              <option value="school">📚 School Chore</option>
              <option value="game">🎮 Electronics Requirement</option>
            </select>
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
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
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
          <h3 class="text-lg font-bold text-[#0d0f1c]">Add Family Member</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Name</label>
            <input 
              v-model="newPerson.name"
              type="text" 
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#607afb]"
              placeholder="Enter person's name"
              @keyup.enter="addPerson"
            >
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="addPerson"
            class="flex-1 bg-[#607afb] text-white py-2 px-4 rounded-lg hover:bg-[#4f68d8] transition-colors"
          >
            Add Person
          </button>
          <button 
            @click="cancelAddPerson"
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
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
          <h3 class="text-lg font-bold text-[#0d0f1c]">Remove Family Member</h3>
        </div>
        <p class="text-[#47569e] mb-6">
          Are you sure you want to remove "<span class="font-medium text-[#0d0f1c]">{{ personToDelete?.name }}</span>" from the family? 
          All their assigned chores will be moved to unassigned. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button 
            @click="confirmDeletePerson"
            class="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Remove Person
          </button>
          <button 
            @click="cancelDeletePerson"
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Add Chore Modal -->
    <div v-if="showAddChoreModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <h3 class="text-lg font-bold text-[#0d0f1c] mb-4">Add New Chore</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Chore Name</label>
            <input 
              v-model="newChore.name"
              type="text" 
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#607afb]"
              placeholder="Enter chore name"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Amount ($)</label>
            <input 
              v-model.number="newChore.amount"
              type="number" 
              step="0.50"
              min="0"
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#607afb]"
              placeholder="0.00"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-[#0d0f1c] mb-1">Chore Type</label>
            <select 
              v-model="newChore.category"
              class="w-full px-3 py-2 border border-[#ced2e9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#607afb]"
            >
              <option value="regular">🏠 Regular Chore</option>
              <option value="school">📚 School Chore</option>
              <option value="game">🎮 Electronics Requirement</option>
            </select>
            <p class="text-xs text-[#47569e] mt-1">
              <span v-if="newChore.category === 'school'">School chores help with learning habits</span>
              <span v-else-if="newChore.category === 'game'">Must be completed to earn electronics time</span>
              <span v-else>Regular household chore</span>
            </p>
          </div>
          <div>
            <label class="flex items-center gap-2">
              <input 
                type="checkbox" 
                v-model="newChore.addToQuicklist"
                class="h-4 w-4 rounded border-[#ced2e9] border-2 bg-transparent text-[#607afb] checked:bg-[#607afb] checked:border-[#607afb] focus:ring-0 focus:ring-offset-0"
              >
              <span class="text-sm text-[#0d0f1c]">⚡ Also add to Quicklist</span>
            </label>
            <p class="text-xs text-[#47569e] mt-1 ml-6">Make this chore available for quick assignment in the future</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button 
            @click="addChore"
            class="flex-1 bg-[#607afb] text-white py-2 px-4 rounded-lg hover:bg-[#4f68d8] transition-colors"
          >
            Add Chore
          </button>
          <button 
            @click="cancelAddChore"
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
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
          <h3 class="text-lg font-bold text-[#0d0f1c]">Start New Day</h3>
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
          <p class="text-[#47569e] text-sm">
            This action cannot be undone. Are you sure you want to start a new day?
          </p>
        </div>
        <div class="flex gap-3">
          <button 
            @click="startNewDay"
            class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
          >
            Start New Day
          </button>
          <button 
            @click="cancelNewDay"
            class="flex-1 bg-[#e6e9f4] text-[#0d0f1c] py-2 px-4 rounded-lg hover:bg-[#d0d4e8] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  inject: [
    'showDeleteModal', 'choreToDelete', 'showAddToQuicklistModal', 'newQuicklistChore',
    'showAddPersonModal', 'newPerson', 'showDeletePersonModal', 'personToDelete',
    'showAddChoreModal', 'newChore', 'showNewDayModal',
    'addChore', 'cancelAddChore', 'addPerson', 'cancelAddPerson',
    'addToQuicklist', 'cancelAddToQuicklist', 'startNewDay', 'cancelNewDay',
    'confirmDelete', 'cancelDelete', 'confirmDeletePerson', 'cancelDeletePerson'
  ],
  methods: {
    // Use injected methods directly - they're already bound to the parent context
  }
});

// Export component for manual registration
window.AppModalsComponent = AppModals; 