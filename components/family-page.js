// Family Page Component
const FamilyPage = Vue.defineComponent({
  data() {
    return {
      expandedCards: {}
    };
  },
  template: `
    <div class="space-y-6 sm:space-y-8 pb-24 sm:pb-0">
      <!-- Family Overview -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625-7.128h4.125c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H21a9 9 0 0 0-7.5-4.03V2.25c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125V4.02A9 9 0 0 0 3 8.25H2.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125H3a9.38 9.38 0 0 0 2.625 7.128L3.375 21.3c-.331.481-.02 1.125.561 1.262l1.5.375c.581.137 1.125-.02 1.262-.561L9 19.875a9.38 9.38 0 0 0 6 0l2.302 2.401c.137.481.681.698 1.262.561l1.5-.375c.581-.137.892-.781.561-1.262l-2.25-3.3Z"/>
              </svg>
              <span>Family Members</span>
            </h2>
            <div class="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <button
                @click="$parent.openCreateChildModal()"
                class="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                <span class="font-medium">Add Child</span>
              </button>
              <button
                @click="$parent.createParentInvite()"
                class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>
                </svg>
                <span class="font-medium">Invite Parent</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div
              v-for="person in allPeople"
              :key="person.id"
              class="w-full"
            >
              <div class="family-card border rounded-lg p-4 sm:p-6 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-102 h-full overflow-hidden" style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);">
                <!-- Header Section - Primary Information -->
                <div class="flex items-center gap-4 mb-4">
                  <div class="family-avatar rounded-full w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center font-bold text-white shadow-lg bg-gradient-to-br from-primary-400 to-primary-600 text-xl sm:text-2xl flex-shrink-0">
                    {{ (person.displayName || person.name).charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-white text-lg sm:text-xl truncate mb-1">{{ person.displayName || person.name }}</h3>
                    <p class="text-sm text-white text-opacity-80 mb-2">{{ person.role || 'Family Member' }}</p>
                    <div class="flex items-center gap-3">
                      <span
                        :class="getElectronicsStatusClass(person.electronicsStatus.status)"
                        class="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-2"
                      >
                        <span class="text-sm" v-html="getElectronicsStatusIcon(person.electronicsStatus.status)"></span>
                        <span>{{ getElectronicsStatusText(person.electronicsStatus.status) }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Key Metrics Section -->
                <div class="flex items-center justify-between mb-4">
                  <div class="text-center">
                    <div class="text-sm text-white text-opacity-80 mb-1">Total Earnings</div>
                    <div class="text-2xl sm:text-3xl font-bold text-white">\${{ person.earnings.toFixed(2) }}</div>
                  </div>
                  <div class="text-center">
                    <div class="text-sm text-white text-opacity-80 mb-1">Completed Chores</div>
                    <div class="text-xl sm:text-2xl font-semibold text-white">{{ person.completedChores || 0 }}</div>
                  </div>
                  <button
                    @click="toggleExpanded(person.id)"
                    class="flex items-center justify-center w-10 h-10 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-200 touch-target flex-shrink-0"
                    :aria-expanded="!!expandedCards[person.id]"
                    title="More options"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="[expandedCards[person.id] ? 'rotate-180' : 'rotate-0', 'transition-transform duration-200 w-5 h-5']">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                    </svg>
                  </button>
                </div>

                <!-- Expanded details -->
                <transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 -translate-y-2 max-h-0"
                  enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
                  leave-to-class="opacity-0 -translate-y-2 max-h-0"
                >
                  <div v-show="expandedCards[person.id]" class="space-y-6">
                    <!-- Member Settings Section -->
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                        </svg>
                        Member Settings
                      </h4>

                      <div class="space-y-4">
                        <!-- Display Name Editor -->
                        <div v-if="person.userId" class="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label class="text-sm text-white text-opacity-90 font-medium min-w-[100px]">Display name</label>
                          <input
                            v-model="person.displayName"
                            @blur="$parent.updateFamilyMemberDisplayName(person)"
                            class="flex-1 text-sm border rounded-lg px-3 py-2 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                            placeholder="Optional"
                          />
                        </div>

                        <!-- Chore Board Toggle -->
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                          <label class="text-sm text-white text-opacity-90 font-medium min-w-[100px]">Show on chore board</label>
                          <div class="flex items-center gap-3">
                            <sl-switch
                              :checked="person.enabledForChores"
                              @sl-change="person.enabledForChores = !person.enabledForChores; $parent.updateMemberChoresEnabled(person)"
                              size="small"
                              class="family-card-switch"
                            >
                              {{ person.enabledForChores ? 'Visible' : 'Hidden' }}
                            </sl-switch>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Actions Section -->
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
                        </svg>
                        Actions
                      </h4>

                      <div class="flex flex-col sm:flex-row gap-3">
                        <button
                          v-if="$parent.currentUser?.role === 'parent'"
                          @click="$parent.openSpendingModal(person)"
                          class="flex items-center justify-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] shadow-md hover:shadow-lg"
                        >
                          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                          </svg>
                          <span class="font-medium">Manage Spending</span>
                        </button>

                        <button
                          v-if="$parent.canRemoveMember(person)"
                          @click="$parent.removeMember(person)"
                          class="flex items-center justify-center gap-2 bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] shadow-md hover:shadow-lg"
                        >
                          <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                          </svg>
                          <span class="font-medium">Remove Member</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </transition>
            </div>
          </div>
        </div>

          <!-- Spending Requests (Parents Only) -->
          <div v-if="$parent.currentUser?.role === 'parent'" class="mt-6 sm:mt-8">
            <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 class="text-primary-custom text-xl font-bold flex items-center gap-2">
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/>
                  </svg>
                  <span>Spending Requests</span>
                </h3>
                <button
                  @click="$parent.loadSpendingRequests()"
                  class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] justify-center shadow-md hover:shadow-lg"
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  Refresh
                </button>
              </div>
              <div v-if="$parent.spendingRequests.length === 0" class="text-center py-8 text-secondary-custom">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" class="mx-auto mb-3 opacity-50" viewBox="0 0 256 256">
                  <path d="M216,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80L128,32Z"/>
                </svg>
                <p class="text-base font-medium">No pending requests.</p>
              </div>
              <div v-else class="space-y-3 sm:space-y-4">
                <div
                  v-for="req in $parent.spendingRequests"
                  :key="req.id"
                  class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border transition-colors duration-200 hover:shadow-md"
                  style="background-color: var(--color-primary-500); border-color: var(--color-primary-600);"
                >
                  <div class="text-white mb-3 sm:mb-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-bold text-base sm:text-lg">{{ req.name }}</span>
                      <span class="text-sm text-white text-opacity-90">requests to spend</span>
                    </div>
                    <div class="flex items-center gap-3 text-sm">
                      <span class="font-semibold text-error-400">\${{ Number(req.amount).toFixed(2) }}</span>
                      <span class="text-white text-opacity-70">{{ new Date(req.createdAt).toLocaleString() }}</span>
                    </div>
                  </div>
                  <button
                    @click="$parent.approveSpendingRequest(req.id)"
                    class="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] justify-center shadow-md hover:shadow-lg self-start sm:self-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/>
                    </svg>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="allPeople.length === 0" class="text-center py-12 sm:py-16 text-secondary-custom">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" class="mx-auto mb-4 opacity-50" viewBox="0 0 256 256">
            <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
          </svg>
          <p class="text-lg sm:text-xl font-medium">No family members added yet.</p>
          <p class="text-sm sm:text-base mt-2">Use "Add Child" or "Invite Parent" to get started.</p>
        </div>
      </div>
    </div>
  `,
  inject: ['allPeople', 'confirmDeletePerson'],
  methods: {
    toggleExpanded(id) {
      if (!id) return;
      const current = !!this.expandedCards[id];
      this.expandedCards = { ...this.expandedCards, [id]: !current };
    },
    handleDeletePerson(person) {
      this.confirmDeletePerson(person);
    },

    getElectronicsStatusClass(status) {
      switch(status) {
        case 'allowed': return 'bg-success-600 text-white';
        case 'restricted': return 'bg-warning-600 text-white';
        case 'blocked': return 'bg-error-600 text-white';
        default: return 'bg-success-600 text-white';
      }
    },

    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Electronics Allowed';
        case 'restricted': return 'Electronics Limited';
        case 'blocked': return 'Electronics Blocked';
        default: return 'Electronics Allowed';
      }
    },

    getElectronicsStatusIcon(status) {
      switch(status) {
        case 'allowed':
          return `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
          </svg>`;
        case 'restricted':
          return `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>`;
        case 'blocked':
          return `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>`;
        default:
          return `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/>
          </svg>`;
      }
    }
  }
});

// Export component for manual registration
window.FamilyPageComponent = FamilyPage; 
