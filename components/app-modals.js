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
    <!-- Add to Quicklist Modal Component -->
    <!-- _Requirements: 6.5, 14.4_ -->
    <add-to-quicklist-modal></add-to-quicklist-modal>

    

    <!-- Delete Person Modal Component -->
    <!-- _Requirements: 9.5, 14.4_ -->
    <delete-person-modal></delete-person-modal>

    <!-- Add Chore Modal Component -->
    <!-- _Requirements: 4.5, 14.4_ -->
    <add-chore-modal></add-chore-modal>

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
      @close="handleCancelNewDay"
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
            @click="handleStartNewDay"
            @touchend.prevent="handleStartNewDay"
            :disabled="newDayLoading"
            class="flex-1 btn-warning btn-compact flex items-center justify-center gap-2"
          >
            <div v-if="newDayLoading" class="new-day-spinner" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ newDayLoading ? 'Starting...' : 'Start New Day' }}
          </button>
          <button 
            @click="handleCancelNewDay"
            @touchend.prevent="handleCancelNewDay"
            :disabled="newDayLoading"
            class="btn-secondary btn-compact"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Auth Modals (store-based, encapsulated components) -->
    <!-- _Requirements: 1.5, 2.5, 3.5, 14.4_ -->
    <login-modal></login-modal>
    <signup-modal></signup-modal>
    <confirm-modal></confirm-modal>

    <!-- Chore Details Modal Component -->
    <!-- _Requirements: 5.5, 14.4_ -->
    <chore-details-modal></chore-details-modal>

    <!-- Spending Flyout -->
    <flyout-panel
      :open="showSpendingModal"
      @close="handleCloseSpendingModal"
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
            @click="handleConfirmSpending"
            @touchend.prevent="handleConfirmSpending"
            :disabled="spendAmount <= 0 || spendAmount > selectedPerson?.earnings"
            class="flex-1 btn-error btn-compact px-3 py-1.5 text-sm disabled:bg-[color:var(--color-neutral-300)] disabled:cursor-not-allowed"
          >
            Spend Money
          </button>
          <button
            @click="handleCloseSpendingModal"
            @touchend.prevent="handleCloseSpendingModal"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </template>
    </flyout-panel>

    <!-- Create Child Modal Component -->
    <!-- _Requirements: 7.5, 14.4_ -->
    <create-child-modal></create-child-modal>

    <!-- Invite Parent Modal Component -->
    <!-- _Requirements: 8.5, 14.4_ -->
    <invite-parent-modal></invite-parent-modal>

    <!-- Multi-Assign Modal Component -->
    <!-- _Requirements: 11.5, 14.4_ -->
    <multi-assign-modal></multi-assign-modal>

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
      :quicklist-chore="effectiveScheduleModalChore"
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
      // Note: showLoginPassword and showSignupPassword moved to individual modal components
      // Note: multiAssignLoading moved to multi-assign-modal.js
      // Note: showChildPassword moved to create-child-modal.js
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
    // NOTE: Auth modal state (showLoginModal, showSignupModal, showConfirmModal, authForm, authError, authLoading)
    // now accessed via authStore directly - see setup() and computed properties
    'showMultiAssignModal', 'selectedQuicklistChore', 'multiAssignSelectedMembers',
    // **Feature: habit-tracking** - Habit flyout
    'showHabitFlyout', 'habitFlyoutMemberId', 'editingHabit', 'habitForm', 'habitFormError', 'habitFormSubmitting',
    'addChore', 'cancelAddChore', 'addPerson', 'cancelAddPerson',
    'addToQuicklist', 'cancelAddToQuicklist', 'startNewDay', 'cancelNewDay',
    'executeDeletePerson', 'cancelDeletePerson',
    'confirmChoreDetails', 'cancelChoreDetails',
    'closeSpendingModal', 'addDigit', 'addDecimal', 'clearSpendAmount', 'confirmSpending',
    // NOTE: Auth methods (handleLogin, handleSignup, handleConfirmSignup, showLoginForm, showSignupForm, closeAuthModals)
    // now accessed via authStore directly - see setup() and computed properties
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
    
    // Schedule modal chore - read from UI store modal data first, fall back to injected prop
    // This allows both tailwind-chore-page (uses uiStore.openModal with data) and 
    // app.js (sets scheduleModalChore directly) to work
    effectiveScheduleModalChore() {
      const modalData = this.uiStore.getModalData('schedule');
      return modalData?.quicklistChore || this.scheduleModalChore;
    },
    
    // NOTE: The following computed properties have been moved to individual family modal components:
    // - childForm -> create-child-modal.js
    // - inviteData -> invite-parent-modal.js
    // - inviteExpiresAt -> invite-parent-modal.js
    // - inviteToken -> invite-parent-modal.js
    // - currentUser -> invite-parent-modal.js
    // - accountSettings -> invite-parent-modal.js
    
    // Auth modal state - now from authStore
    // _Requirements: 3.1, 3.2, 3.5_
    showLoginModal() {
      return this.uiStore.isModalOpen('login');
    },
    showSignupModal() {
      return this.uiStore.isModalOpen('signup');
    },
    showConfirmModal() {
      return this.uiStore.isModalOpen('confirm');
    },
    authForm() {
      return this.authStore.authForm;
    },
    authError() {
      return this.authStore.authError;
    },
    authLoading() {
      return this.authStore.authLoading;
    }
  },
  methods: {
    // =============================================
    // STORE DELEGATION METHODS
    // These methods delegate to stores instead of $parent
    // _Requirements: 4.2, 4.3, 7.1, 7.2_
    // =============================================

    // =============================================
    // AUTH STORE DELEGATION METHODS
    // These methods delegate to authStore instead of app.js
    // _Requirements: 3.2, 3.3, 3.5_
    // =============================================

    /**
     * Handle login - delegates to authStore
     */
    async handleLogin() {
      await this.authStore.handleLogin();
    },

    /**
     * Handle signup - delegates to authStore
     */
    async handleSignup() {
      await this.authStore.handleSignup();
    },

    /**
     * Handle signup confirmation - delegates to authStore
     */
    async handleConfirmSignup() {
      await this.authStore.handleConfirmSignup();
    },

    /**
     * Show login form - delegates to authStore
     */
    showLoginForm() {
      this.authStore.showLoginForm();
    },

    /**
     * Show signup form - delegates to authStore
     */
    showSignupForm() {
      this.authStore.showSignupForm();
    },

    /**
     * Close auth modals - delegates to authStore
     */
    closeAuthModals() {
      this.authStore.closeAuthModals();
    },

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

    // NOTE: The following methods have been moved to individual chore modal components:
    // - getCategoryLabel -> chore-details-modal.js
    // - onQuicklistCategoryCreated -> add-to-quicklist-modal.js, multi-assign-modal.js
    // - updateQuicklistChoreCategory -> multi-assign-modal.js
    // - updateQuicklistCategory -> multi-assign-modal.js
    // - getElectronicsStatusClass -> multi-assign-modal.js
    // - getElectronicsStatusStyle -> multi-assign-modal.js
    // - getElectronicsStatusText -> multi-assign-modal.js
    // - toggleMemberSelection -> multi-assign-modal.js

    // NOTE: The following methods have been moved to individual family modal components:
    // - createChild -> create-child-modal.js
    // - getInviteLink -> invite-parent-modal.js
    // - copyInviteLink -> invite-parent-modal.js
    // - getInviteText -> invite-parent-modal.js
    // - shareInvite -> invite-parent-modal.js

    // =============================================
    // INJECTED FUNCTION WRAPPERS
    // These wrap injected functions to work with Vue event modifiers
    // Vue's template compiler needs local methods for .prevent modifier
    // _Requirements: 4.2, 4.3_
    // =============================================
    
    // NOTE: The following wrapper methods have been moved to individual chore modal components:
    // - handleAddToQuicklist -> add-to-quicklist-modal.js
    // - handleCancelAddToQuicklist -> add-to-quicklist-modal.js
    // - handleAddChore -> add-chore-modal.js
    // - handleCancelAddChore -> add-chore-modal.js
    // - handleConfirmChoreDetails -> chore-details-modal.js
    // - handleCancelChoreDetails -> chore-details-modal.js
    // - handleConfirmMultiAssignment -> multi-assign-modal.js
    // - handleCancelMultiAssignment -> multi-assign-modal.js
    // - toggleMemberSelection -> multi-assign-modal.js
    
    handleStartNewDay() {
      this.startNewDay?.();
    },
    handleCancelNewDay() {
      this.cancelNewDay?.();
    },
    handleConfirmSpending() {
      this.confirmSpending?.();
    },
    handleCloseSpendingModal() {
      this.closeSpendingModal?.();
    }
  }
});

// Export component for manual registration
window.AppModalsComponent = AppModals; 
