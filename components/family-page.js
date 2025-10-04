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
              <span>👨‍👩‍👧‍👦</span>
              <span>Family Members</span>
            </h2>
            <div class="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <button
                @click="$parent.openCreateChildModal()"
                class="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a96,96,0,1,1-96-96A96.11,96.11,0,0,1,224,128Zm-104,8H88a8,8,0,0,0,0,16h32v32a8,8,0,0,0,16,0V152h32a8,8,0,0,0,0-16H136V120a8,8,0,0,0-16,0Z"></path></svg>
                <span class="font-medium">Add Child</span>
              </button>
              <button
                @click="$parent.createParentInvite()"
                class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80L128,32Z"></path></svg>
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
                <div class="flex items-center justify-between mb-4 sm:mb-6">
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="family-avatar rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center font-semibold text-white shadow-lg bg-gradient-to-br from-primary-500 to-primary-600 text-lg sm:text-xl">
                      {{ (person.displayName || person.name).charAt(0).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <h3 class="font-bold text-white text-base sm:text-lg truncate">{{ person.displayName || person.name }}</h3>
                      <p class="text-xs sm:text-sm text-white text-opacity-90">{{ person.role || 'Family Member' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span
                      :class="getElectronicsStatusClass(person.electronicsStatus.status)"
                      class="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-20 text-white"
                    >
                      {{ getElectronicsStatusText(person.electronicsStatus.status) }}
                    </span>
                    <div class="text-right">
                      <div class="text-xs text-white text-opacity-80">Earnings</div>
                      <div class="text-base sm:text-lg font-bold text-white">\${{ person.earnings.toFixed(2) }}</div>
                    </div>
                    <button
                      @click="toggleExpanded(person.id)"
                      class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-200 touch-target"
                      :aria-expanded="!!expandedCards[person.id]"
                      title="More actions"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" :class="[expandedCards[person.id] ? 'rotate-180' : 'rotate-0', 'transition-transform duration-200']"><path d="M128,160a8,8,0,0,1-5.66-2.34l-48-48a8,8,0,0,1,11.32-11.32L128,140.69l42.34-42.35a8,8,0,0,1,11.32,11.32l-48,48A8,8,0,0,1,128,160Z"></path></svg>
                    </button>
                  </div>
                </div>

                <!-- Expanded details -->
                <transition
                  enter-active-class="transition-all duration-300 ease-out"
                  enter-from-class="opacity-0 -translate-y-2 max-h-0"
                  enter-to-class="opacity-100 translate-y-0 max-h-[400px]"
                  leave-active-class="transition-all duration-200 ease-in"
                  leave-from-class="opacity-100 translate-y-0 max-h-[400px]"
                  leave-to-class="opacity-0 -translate-y-2 max-h-0"
                >
                  <div v-show="expandedCards[person.id]" class="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                      <div class="flex items-center gap-3 mb-4" v-if="person.userId">
                        <span class="text-sm text-white text-opacity-90 font-medium">Display name</span>
                        <input
                          v-model="person.displayName"
                          @blur="$parent.updateFamilyMemberDisplayName(person)"
                          class="flex-1 text-sm border rounded-lg px-3 py-2 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-60 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                          placeholder="optional"
                        />
                      </div>
                      <div class="flex justify-between items-center mb-4">
                        <span class="text-sm text-white text-opacity-90 font-medium">Completed chores</span>
                        <span class="text-base sm:text-lg font-bold text-white">{{ person.completedChores || 0 }}</span>
                      </div>

                      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <label class="flex items-center gap-3 text-sm cursor-pointer select-none">
                          <span class="text-white text-opacity-90">Show on board</span>
                          <button
                            @click="person.enabledForChores=!person.enabledForChores; $parent.updateMemberChoresEnabled(person)"
                            :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50', person.enabledForChores ? 'bg-success-600' : 'bg-gray-400']"
                            aria-label="Toggle show on board"
                          >
                            <span
                              :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200', person.enabledForChores ? 'translate-x-6' : 'translate-x-1']"
                            />
                          </button>
                        </label>

                        <div class="flex gap-2 sm:gap-3">
                          <button
                            v-if="$parent.currentUser?.role === 'parent'"
                            @click="$parent.openSpendingModal(person)"
                            class="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition-colors duration-200 touch-target"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                              <path d="M216,80V208a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V80L128,32Z"/>
                            </svg>
                            Spend
                          </button>
                          <button
                            v-if="$parent.canRemoveMember(person)"
                            @click="$parent.removeMember(person)"
                            class="flex items-center gap-2 bg-error-600 hover:bg-error-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 touch-target"
                            title="Remove member from account"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
                            </svg>
                            Remove
                          </button>
                        </div>
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
                  <span>💳</span>
                  <span>Spending Requests</span>
                </h3>
                <button
                  @click="$parent.loadSpendingRequests()"
                  class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] justify-center shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M197.66,66.34a8,8,0,0,1,0,11.32L179.31,96,200,116.69a8,8,0,0,1-11.31,11.32L168,107.32l-20.69,20.69a8,8,0,0,1-11.32-11.32L156.68,96,136,75.31a8,8,0,0,1,11.32-11.32L168,84.68l20.69-20.69A8,8,0,0,1,197.66,66.34Z"/>
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
        case 'allowed': return 'bg-success-600';
        case 'restricted': return 'bg-warning-600';
        case 'blocked': return 'bg-error-600';
        default: return 'bg-success-600';
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
