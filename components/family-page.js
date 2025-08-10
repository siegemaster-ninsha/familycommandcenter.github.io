// Family Page Component
const FamilyPage = Vue.defineComponent({
  template: `
    <div class="space-y-6">
      <!-- Family Overview -->
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span>
            <span>Family Members</span>
          </h2>
          <div class="flex gap-2">
            <button
              @click="$parent.openAddPersonModal()"
              class="btn-primary touch-target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
              <span class="font-medium">Add Member</span>
            </button>
            <button
              @click="$parent.openCreateChildModal()"
              class="btn-success touch-target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,1,1-96-96A96.11,96.11,0,0,1,224,128Zm-104,8H88a8,8,0,0,0,0,16h32v32a8,8,0,0,0,16,0V152h32a8,8,0,0,0,0-16H136V120a8,8,0,0,0-16,0Z"></path></svg>
              <span class="font-medium">Add Child</span>
            </button>
            <button
              @click="$parent.createParentInvite()"
              class="btn-secondary touch-target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80L128,32Z"></path></svg>
              <span class="font-medium">Invite Parent</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            v-for="person in allPeople" 
            :key="person.id"
            class="family-card card p-4 hover:shadow-md"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="family-avatar rounded-full w-10 h-10 flex items-center justify-center font-semibold text-white shadow">
                  {{ (person.displayName || person.name).charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h3 class="font-semibold text-primary-custom text-base">{{ person.displayName || person.name }}</h3>
                  <p class="text-xs text-secondary-custom">{{ person.role || 'Family Member' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="inline-flex items-center gap-2 text-xs cursor-pointer select-none">
                  <span class="text-secondary-custom">Show on board</span>
                  <button @click="person.enabledForChores=!person.enabledForChores; $parent.updateMemberChoresEnabled(person)" :class="person.enabledForChores ? 'bg-green-500' : 'bg-gray-300'" class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors">
                    <span :class="person.enabledForChores ? 'translate-x-5' : 'translate-x-1'" class="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"></span>
                  </button>
                </label>
                <button
                  v-if="$parent.canRemoveMember(person)"
                  @click="$parent.removeMember(person)"
                  class="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                  title="Remove member from account"
                >Remove</button>
              </div>
            </div>

            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Electronics Status</span>
                <span 
                  :class="getElectronicsStatusClass(person.electronicsStatus.status)"
                  class="text-sm font-medium px-2 py-1 rounded-full"
                >
                  {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-secondary-custom">Display name</span>
                <input v-model="person.displayName" @blur="$parent.updateFamilyMemberDisplayName(person)" class="text-sm border rounded px-2 py-1 w-40" placeholder="optional" />
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Total Earnings</span>
                <span class="text-lg font-bold text-emerald-600">\${{ person.earnings.toFixed(2) }}</span>
              </div>
              
              <div class="flex justify-between items-center">
                <span class="text-sm text-secondary-custom font-medium">Completed Chores</span>
                <span class="text-sm font-medium text-primary-custom">{{ person.completedChores || 0 }}</span>
              </div>

              <div v-if="$parent.currentUser?.role === 'parent'" class="pt-1">
                <button @click="$parent.openSpendingModal(person)" class="btn-secondary w-full">Spend from \${{ person.earnings.toFixed(2) }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Spending Requests (Parents Only) -->
        <div v-if="$parent.currentUser?.role === 'parent'" class="mt-6 card">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-primary-custom text-lg font-bold">💳 Spending Requests</h3>
            <button @click="$parent.loadSpendingRequests()" class="btn-secondary">Refresh</button>
          </div>
          <div v-if="$parent.spendingRequests.length === 0" class="text-sm text-secondary-custom">No pending requests.</div>
          <div v-else class="space-y-2">
            <div v-for="req in $parent.spendingRequests" :key="req.id" class="flex items-center justify-between p-3 border rounded">
              <div class="text-sm">
                <span class="font-medium text-primary-custom">{{ req.name }}</span>
                <span class="ml-2">requests to spend</span>
                <span class="font-semibold text-red-600">\${{ Number(req.amount).toFixed(2) }}</span>
                <span class="ml-2 text-xs text-secondary-custom">{{ new Date(req.createdAt).toLocaleString() }}</span>
              </div>
              <button @click="$parent.approveSpendingRequest(req.id)" class="btn-success">Approve</button>
            </div>
          </div>
        </div>

        <div v-if="allPeople.length === 0" class="text-center py-12 text-secondary-custom">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="mx-auto mb-4 opacity-50" viewBox="0 0 256 256">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
          <p class="text-lg font-medium">No family members added yet.</p>
          <p class="text-sm mt-2">Click "Add Member" to get started!</p>
        </div>
      </div>
    </div>
  `,
  inject: ['allPeople', 'showAddPersonModal', 'confirmDeletePerson'],
  methods: {
    handleDeletePerson(person) {
      this.confirmDeletePerson(person);
    },

    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'status-success';
        case 'restricted': return 'status-warning';
        case 'blocked': return 'status-error';
        default: return 'status-success';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    }
  }
});

// Export component for manual registration
window.FamilyPageComponent = FamilyPage; 