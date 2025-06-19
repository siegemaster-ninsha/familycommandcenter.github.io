// Family Page Component
const FamilyPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Family Overview -->
      <div class="rounded-lg border-2 p-6 shadow-lg" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em]">👨‍👩‍👧‍👦 Family Members</h2>
          <button
            @click="$parent.openAddPersonModal()"
            class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg touch-target min-h-[48px]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
            <span class="font-medium">Add Member</span>
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="person in people" 
            :key="person.id"
            class="family-card border-2 rounded-lg p-4 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-102"
            style="border-color: var(--color-border-card);"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="family-avatar rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-primary-500 to-primary-600 shadow-md">
                  {{ person.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="font-bold text-primary-custom text-lg">{{ person.name }}</h3>
                  <p class="text-sm text-secondary-custom">Family Member</p>
                </div>
              </div>
              <button
                @click="handleDeletePerson(person)"
                class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 touch-target"
                title="Remove family member"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                </svg>
              </button>
            </div>
            
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Electronics Status:</span>
                <span 
                  :class="getElectronicsStatusClass(person.electronicsStatus.status)"
                  class="text-sm font-medium px-2 py-1 rounded-full"
                >
                  {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                </span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Total Earnings:</span>
                <span class="text-lg font-bold text-emerald-600">\${{ person.earnings.toFixed(2) }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Completed Chores:</span>
                <span class="text-sm font-medium text-primary-custom">{{ person.completedChores || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="people.length === 0" class="text-center py-12 text-secondary-custom">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="mx-auto mb-4 opacity-50" viewBox="0 0 256 256">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
          <p class="text-lg font-medium">No family members added yet.</p>
          <p class="text-sm mt-2">Click "Add Member" to get started!</p>
        </div>
      </div>
    </div>
  `,
  inject: ['people', 'showAddPersonModal', 'confirmDeletePerson'],
  methods: {
    handleDeletePerson(person) {
      this.confirmDeletePerson(person);
    },

    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'bg-green-100 text-green-800';
        case 'restricted': return 'bg-yellow-100 text-yellow-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        default: return 'bg-slate-100 text-primary-custom';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return '✅ Allowed';
        case 'restricted': return '⚠️ Limited';
        case 'blocked': return '🚫 Blocked';
        default: return '❓ Unknown';
      }
    }
  }
});

// Export component for manual registration
window.FamilyPageComponent = FamilyPage; 