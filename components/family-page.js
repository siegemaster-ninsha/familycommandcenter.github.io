// Family Page Component
const FamilyPage = Vue.defineComponent({
  name: 'FamilyPage',
  data() {
    return {
      expandedCards: {},
      // Daily chores UI state
      addingDailyChore: {}, // { [memberId]: boolean } - tracks which member's dropdown is open
      removingDailyChore: {}, // { [memberId_choreId]: boolean } - tracks removal confirmation
      dailyChoreLoading: {} // { [memberId]: boolean } - tracks loading state per member
    };
  },
  inject: ['allPeople', 'confirmDeletePerson'],
  template: `
    <div class="space-y-6 sm:space-y-8 pb-24 sm:pb-0">
      <!-- Family Overview -->
      <div class="w-full">
        <div class="w-full block rounded-lg border p-6" style="background-color: var(--color-bg-card); border-color: var(--color-border-card);">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <h2 class="text-primary-custom text-[22px] font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <div v-html="Helpers.IconLibrary.getIcon('settings', 'lucide', 24, 'text-primary-custom')"></div>
              <span>Family Members</span>
            </h2>
            <div class="flex gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
              <button
                @click="$parent.openCreateChildModal()"
                class="flex items-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
                <span class="font-medium">Add Child</span>
              </button>
              <button
                @click="$parent.createParentInvite()"
                class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[48px] w-full sm:w-auto justify-center shadow-md hover:shadow-lg"
              >
                <div v-html="Helpers.IconLibrary.getIcon('mail', 'lucide', 16, 'text-white')"></div>
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
                    <div v-html="Helpers.IconLibrary.getIcon('chevronDown', 'lucide', 20, 'text-white')" :class="[expandedCards[person.id] ? 'rotate-180' : 'rotate-0', 'transition-transform duration-200']"></div>
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
                        <div v-html="Helpers.IconLibrary.getIcon('user', 'lucide', 16, 'text-white')"></div>
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
                              @sl-change="handleChoreToggle(person, $event)"
                              size="small"
                              class="family-card-switch"
                            >
                              {{ person.enabledForChores ? 'Visible' : 'Hidden' }}
                            </sl-switch>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Daily Chores Section (Requirements 1.1, 1.4) -->
                    <div v-if="$parent.currentUser?.role === 'parent'" class="bg-white bg-opacity-10 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <div v-html="Helpers.IconLibrary.getIcon('calendar', 'lucide', 16, 'text-white')"></div>
                        Daily Chores
                        <span class="text-xs text-white text-opacity-70 font-normal ml-1">(auto-assigned each day)</span>
                      </h4>

                      <!-- Configured Daily Chores List -->
                      <div v-if="getDailyChoresForMember(person).length > 0" class="space-y-2 mb-4">
                        <div
                          v-for="dailyChore in getDailyChoresForMember(person)"
                          :key="dailyChore.id"
                          class="flex items-center justify-between bg-white bg-opacity-20 rounded-lg px-3 py-2"
                        >
                          <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              class="flex items-center justify-center rounded-lg shrink-0 w-8 h-8"
                              :style="{ background: 'rgba(255,255,255,0.3)' }"
                              v-html="getCategoryIconForDailyChore(dailyChore.category)"
                            ></div>
                            <div class="min-w-0 flex-1">
                              <p class="text-white text-sm font-medium truncate">{{ dailyChore.name }}</p>
                              <div class="flex items-center gap-2 text-xs text-white text-opacity-80">
                                <span v-if="dailyChore.amount > 0">\${{ dailyChore.amount.toFixed(2) }}</span>
                                <span class="px-1.5 py-0.5 rounded bg-white bg-opacity-20">{{ getCategoryLabel(dailyChore.category) }}</span>
                              </div>
                            </div>
                          </div>
                          <!-- Remove button with confirmation -->
                          <button
                            v-if="!removingDailyChore[person.id + '_' + dailyChore.id]"
                            @click="confirmRemoveDailyChore(person.id, dailyChore.id)"
                            :disabled="dailyChoreLoading[person.id]"
                            class="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-20 hover:bg-error-500 hover:bg-opacity-80 text-white transition-all duration-200 touch-target flex-shrink-0"
                            title="Remove from daily chores"
                          >
                            <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 16, 'text-white')"></div>
                          </button>
                          <!-- Confirmation buttons -->
                          <div v-else class="flex items-center gap-1 flex-shrink-0">
                            <button
                              @click="removeDailyChore(person.id, dailyChore.id)"
                              :disabled="dailyChoreLoading[person.id]"
                              class="flex items-center justify-center w-8 h-8 rounded-lg bg-error-500 hover:bg-error-600 text-white transition-all duration-200 touch-target"
                              title="Confirm remove"
                            >
                              <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 14, 'text-white')"></div>
                            </button>
                            <button
                              @click="cancelRemoveDailyChore(person.id, dailyChore.id)"
                              class="flex items-center justify-center w-8 h-8 rounded-lg bg-white bg-opacity-30 hover:bg-opacity-50 text-white transition-all duration-200 touch-target"
                              title="Cancel"
                            >
                              <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 14, 'text-white')"></div>
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Empty state -->
                      <div v-else class="text-center py-4 text-white text-opacity-70 text-sm mb-4">
                        <p>No daily chores configured</p>
                        <p class="text-xs mt-1">Add chores from your quicklist below</p>
                      </div>

                      <!-- Add Daily Chore Dropdown (Requirements 1.2) -->
                      <div class="relative">
                        <button
                          @click="toggleAddDailyChore(person.id)"
                          :disabled="dailyChoreLoading[person.id] || getAvailableQuicklistChores(person).length === 0"
                          class="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 touch-target min-h-[44px]"
                        >
                          <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
                          <span class="font-medium text-sm">
                            {{ getAvailableQuicklistChores(person).length === 0 ? 'No quicklist chores available' : 'Add Daily Chore' }}
                          </span>
                          <div 
                            v-if="getAvailableQuicklistChores(person).length > 0"
                            v-html="Helpers.IconLibrary.getIcon('chevronDown', 'lucide', 16, 'text-white')" 
                            :class="[addingDailyChore[person.id] ? 'rotate-180' : 'rotate-0', 'transition-transform duration-200 ml-auto']"
                          ></div>
                        </button>

                        <!-- Dropdown menu -->
                        <transition
                          enter-active-class="transition-all duration-200 ease-out"
                          enter-from-class="opacity-0 -translate-y-2"
                          enter-to-class="opacity-100 translate-y-0"
                          leave-active-class="transition-all duration-150 ease-in"
                          leave-from-class="opacity-100 translate-y-0"
                          leave-to-class="opacity-0 -translate-y-2"
                        >
                          <div 
                            v-if="addingDailyChore[person.id]"
                            class="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-xl border overflow-hidden max-h-60 overflow-y-auto"
                            style="border-color: var(--color-border-card);"
                          >
                            <div
                              v-for="quickChore in getAvailableQuicklistChores(person)"
                              :key="quickChore.id"
                              @click="addDailyChore(person.id, quickChore.id)"
                              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150 border-b last:border-b-0"
                              style="border-color: var(--color-border-card);"
                            >
                              <div
                                class="flex items-center justify-center rounded-lg shrink-0 w-8 h-8"
                                :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }"
                                v-html="getCategoryIconForDailyChore(quickChore.category)"
                              ></div>
                              <div class="min-w-0 flex-1">
                                <p class="text-primary-custom text-sm font-medium truncate">{{ quickChore.name }}</p>
                                <div class="flex items-center gap-2 text-xs text-secondary-custom">
                                  <span v-if="quickChore.amount > 0">\${{ quickChore.amount.toFixed(2) }}</span>
                                  <span class="px-1.5 py-0.5 rounded" :style="{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)' }">{{ getCategoryLabel(quickChore.category) }}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </transition>
                      </div>
                    </div>

                    <!-- Actions Section -->
                    <div class="bg-white bg-opacity-10 rounded-lg p-4">
                      <h4 class="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <div v-html="Helpers.IconLibrary.getIcon('settings', 'lucide', 16, 'text-white')"></div>
                        Actions
                      </h4>

                      <div class="flex flex-col sm:flex-row gap-3">
                        <button
                          v-if="$parent.currentUser?.role === 'parent'"
                          @click="$parent.openSpendingModal(person)"
                          class="flex items-center justify-center gap-2 bg-success-600 hover:bg-success-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] shadow-md hover:shadow-lg"
                        >
                          <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white')"></div>
                          <span class="font-medium">Manage Spending</span>
                        </button>

                        <button
                          v-if="$parent.canRemoveMember(person)"
                          @click="$parent.removeMember(person)"
                          class="flex items-center justify-center gap-2 bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] shadow-md hover:shadow-lg"
                        >
                          <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 16, 'text-white')"></div>
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
                  <div v-html="Helpers.IconLibrary.getIcon('credit-card', 'lucide', 24, 'text-primary-custom')"></div>
                  <span>Spending Requests</span>
                </h3>
                <button
                  @click="$parent.loadSpendingRequests()"
                  class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 touch-target min-h-[44px] justify-center shadow-md hover:shadow-lg"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('refresh-cw', 'lucide', 16, 'text-white')"></div>
                  Refresh
                </button>
              </div>
              <div v-if="$parent.spendingRequests.length === 0" class="text-center py-8 text-secondary-custom">
                <div v-html="Helpers.IconLibrary.getIcon('shield', 'lucide', 48, 'mx-auto mb-3 opacity-50')" class="mx-auto mb-3 opacity-50"></div>
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
                    <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 16, 'text-white')"></div>
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="allPeople.length === 0" class="text-center py-12 sm:py-16 text-secondary-custom">
          <div v-html="Helpers.IconLibrary.getIcon('users', 'lucide', 64, 'mx-auto mb-4 opacity-50')" class="mx-auto mb-4 opacity-50"></div>
          <p class="text-lg sm:text-xl font-medium">No family members added yet.</p>
          <p class="text-sm sm:text-base mt-2">Use "Add Child" or "Invite Parent" to get started.</p>
        </div>
      </div>
    </div>
  `,
  methods: {
    toggleExpanded(id) {
      if (!id) return;
      const current = !!this.expandedCards[id];
      this.expandedCards = { ...this.expandedCards, [id]: !current };
    },
    handleDeletePerson(person) {
      this.confirmDeletePerson(person);
    },
    handleChoreToggle(person, event) {
      person.enabledForChores = event.target.checked;
      this.$parent.updateMemberChoresEnabled(person);
    },

    // =============================================
    // DAILY CHORES METHODS (Requirements 1.1-1.4)
    // =============================================

    /**
     * Get the daily chores for a member with full quicklist details
     * Requirements: 1.1, 1.4
     */
    getDailyChoresForMember(person) {
      const dailyChoreIds = person.dailyChores || [];
      const quicklistChores = this.$parent.quicklistChores || [];
      
      // Map IDs to full quicklist chore objects, filtering out missing ones
      return dailyChoreIds
        .map(id => quicklistChores.find(qc => qc.id === id))
        .filter(chore => chore != null);
    },

    /**
     * Get quicklist chores that are NOT already in the member's daily chores
     * Requirements: 1.2
     */
    getAvailableQuicklistChores(person) {
      const dailyChoreIds = person.dailyChores || [];
      const quicklistChores = this.$parent.quicklistChores || [];
      
      return quicklistChores.filter(qc => !dailyChoreIds.includes(qc.id));
    },

    /**
     * Toggle the add daily chore dropdown
     */
    toggleAddDailyChore(memberId) {
      const current = !!this.addingDailyChore[memberId];
      // Close all other dropdowns first
      this.addingDailyChore = { [memberId]: !current };
    },

    /**
     * Add a quicklist chore to member's daily chores
     * Requirements: 1.2
     */
    async addDailyChore(memberId, quicklistChoreId) {
      // Close dropdown
      this.addingDailyChore = {};
      
      // Set loading state
      this.dailyChoreLoading = { ...this.dailyChoreLoading, [memberId]: true };
      
      try {
        const familyStore = window.useFamilyStore ? window.useFamilyStore() : null;
        if (familyStore) {
          const result = await familyStore.addMemberDailyChore(memberId, quicklistChoreId);
          if (result.success) {
            // Show success message
            if (window.useUIStore) {
              const uiStore = window.useUIStore();
              uiStore.showSuccess('Daily chore added');
            }
          } else {
            // Show error
            if (window.useUIStore) {
              const uiStore = window.useUIStore();
              uiStore.showError(result.error || 'Failed to add daily chore');
            }
          }
        }
      } catch (error) {
        console.error('Failed to add daily chore:', error);
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError('Failed to add daily chore');
        }
      } finally {
        this.dailyChoreLoading = { ...this.dailyChoreLoading, [memberId]: false };
      }
    },

    /**
     * Show confirmation for removing a daily chore
     * Requirements: 1.3
     */
    confirmRemoveDailyChore(memberId, choreId) {
      this.removingDailyChore = { ...this.removingDailyChore, [memberId + '_' + choreId]: true };
    },

    /**
     * Cancel removal confirmation
     */
    cancelRemoveDailyChore(memberId, choreId) {
      this.removingDailyChore = { ...this.removingDailyChore, [memberId + '_' + choreId]: false };
    },

    /**
     * Remove a quicklist chore from member's daily chores
     * Requirements: 1.3
     */
    async removeDailyChore(memberId, quicklistChoreId) {
      // Clear confirmation state
      this.removingDailyChore = { ...this.removingDailyChore, [memberId + '_' + quicklistChoreId]: false };
      
      // Set loading state
      this.dailyChoreLoading = { ...this.dailyChoreLoading, [memberId]: true };
      
      try {
        const familyStore = window.useFamilyStore ? window.useFamilyStore() : null;
        if (familyStore) {
          const result = await familyStore.removeMemberDailyChore(memberId, quicklistChoreId);
          if (result.success) {
            // Show success message
            if (window.useUIStore) {
              const uiStore = window.useUIStore();
              uiStore.showSuccess('Daily chore removed');
            }
          } else {
            // Show error
            if (window.useUIStore) {
              const uiStore = window.useUIStore();
              uiStore.showError(result.error || 'Failed to remove daily chore');
            }
          }
        }
      } catch (error) {
        console.error('Failed to remove daily chore:', error);
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showError('Failed to remove daily chore');
        }
      } finally {
        this.dailyChoreLoading = { ...this.dailyChoreLoading, [memberId]: false };
      }
    },

    /**
     * Get category icon for daily chore display
     */
    getCategoryIconForDailyChore(category) {
      if (typeof Helpers === 'undefined' || !Helpers.getCategoryIcon) {
        return '';
      }
      return Helpers.getCategoryIcon(category);
    },

    /**
     * Get category label for daily chore display
     */
    getCategoryLabel(category) {
      if (typeof Helpers === 'undefined' || !Helpers.getCategoryLabel) {
        switch(category) {
          case 'school': return 'School';
          case 'game': return 'Game';
          default: return 'Regular';
        }
      }
      return Helpers.getCategoryLabel(category);
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
      if (typeof Helpers === 'undefined' || !Helpers.IconLibrary) {
        return '';
      }

      switch(status) {
        case 'allowed':
          return `<div style="display: inline-block; width: 16px; height: 16px;">${Helpers.IconLibrary.getIcon('monitor', 'lucide', 16, 'text-current')}</div>`;
        case 'restricted':
          return `<div style="display: inline-block; width: 16px; height: 16px;">${Helpers.IconLibrary.getIcon('clock', 'lucide', 16, 'text-current')}</div>`;
        case 'blocked':
          return `<div style="display: inline-block; width: 16px; height: 16px;">${Helpers.IconLibrary.getIcon('ban', 'lucide', 16, 'text-current')}</div>`;
        default:
          return `<div style="display: inline-block; width: 16px; height: 16px;">${Helpers.IconLibrary.getIcon('monitor', 'lucide', 16, 'text-current')}</div>`;
      }
    }
  }
});

// Export component for manual registration
window.FamilyPageComponent = FamilyPage; 
