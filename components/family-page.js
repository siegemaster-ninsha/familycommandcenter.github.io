// Family Page Component
const FamilyPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Family Overview -->
      <div class="bg-white rounded-lg border border-[#e6e9f4] p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-[#0d0f1c] text-[22px] font-bold leading-tight tracking-[-0.015em]">👨‍👩‍👧‍👦 Family Members</h2>
          <button
            @click="$parent.openAddPersonModal()"
            class="flex items-center gap-2 bg-[#607afb] text-white px-4 py-2 rounded-lg hover:bg-[#4f68d8] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            Add Member
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="bg-[#607afb] text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                  {{ person.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="font-bold text-[#0d0f1c]">{{ person.name }}</h3>
                  <p class="text-sm text-[#47569e]">Family Member</p>
                </div>
              </div>
              <button
                @click="handleDeletePerson(person)"
                class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                title="Remove family member"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>
            
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-[#47569e]">Electronics Status:</span>
                <span 
                  :class="person.electronicsStatus.status === 'allowed' ? 'text-green-600' : 'text-red-600'"
                  class="text-sm font-medium"
                >
                  {{ person.electronicsStatus.status === 'allowed' ? '✅ Allowed' : '❌ Blocked' }}
                </span>
              </div>
              
              <div class="mt-3 pt-3 border-t border-blue-200">
                <p class="text-xs text-[#47569e]">{{ person.electronicsStatus.message }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="people.length === 0" class="text-center py-8 text-[#47569e]">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
          <p>No family members added yet.</p>
          <p class="text-sm mt-1">Click "Add Member" to get started!</p>
        </div>
      </div>

      <!-- Earnings Widget -->
      <earnings-widget></earnings-widget>
    </div>
  `,
  inject: ['people', 'showAddPersonModal', 'confirmDeletePerson'],
  methods: {
    handleDeletePerson(person) {
      this.confirmDeletePerson(person);
    }
  }
});

// Export component for manual registration
window.FamilyPageComponent = FamilyPage; 