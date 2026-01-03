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

    <!-- Habit Modal Component -->
    <!-- _Requirements: 12.5, 14.4_ -->
    <!-- **Feature: habit-tracking** -->
    <habit-modal></habit-modal>

    <!-- New Day Modal Component -->
    <!-- _Requirements: 13.5, 14.4_ -->
    <new-day-modal></new-day-modal>

    <!-- Auth Modals (store-based, encapsulated components) -->
    <!-- _Requirements: 1.5, 2.5, 3.5, 14.4_ -->
    <login-modal></login-modal>
    <signup-modal></signup-modal>
    <confirm-modal></confirm-modal>

    <!-- Chore Details Modal Component -->
    <!-- _Requirements: 5.5, 14.4_ -->
    <chore-details-modal></chore-details-modal>

    <!-- Spending Modal Component -->
    <!-- _Requirements: 10.5, 14.4_ -->
    <spending-modal></spending-modal>

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

    // NOTE: The following methods have been moved to individual modal components:
    // - closeHabitFlyout -> habit-modal.js
    // - submitHabitForm -> habit-modal.js
    // - handleStartNewDay -> new-day-modal.js
    // - handleCancelNewDay -> new-day-modal.js
    // - handleConfirmSpending -> spending-modal.js
    // - handleCloseSpendingModal -> spending-modal.js

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
