// Heroicons are loaded via CDN in index.html
// Cache bust: 2026-01-02-family-modals-registration

// Configure Vue for Shoelace custom elements
const { createApp } = Vue;

// Initialize Pinia (state management)
const pinia = Pinia.createPinia();
if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Pinia initialized');

// Initialize API Service
if (window.initializeApiService) {
  window.initializeApiService();
}

// Phase 1: Store instances will be initialized after app.use(pinia)
// Store initialization happens in initializeApp() function below

const app = createApp({
  data() {
    return {
      // NOTE: Authentication state moved to authStore
      // Components should use useAuthStore() instead
      // - isAuthenticated, currentUser, accountId, accountSettings
      // - authForm, authError, authLoading
      // - showLoginModal, showSignupModal, showConfirmModal (now in uiStore modal registry)
      
      // NOTE: Modal boolean flags moved to uiStore modal registry
      // Components should use useUIStore().openModal(name) / closeModal(name) instead
      // Modal state is now accessed via computed properties that delegate to uiStore
      // _Requirements: 4.5_
      
      newChore: {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      },
      // **Feature: habit-tracking** - Habit flyout state
      // NOTE: showHabitFlyout moved to uiStore modal registry
      habitFlyoutMemberId: '',
      editingHabit: null,
      habitForm: {
        name: ''
      },
      habitFormError: '',
      habitFormSubmitting: false,
      newQuicklistChore: {
        name: '',
        amount: 0,
        category: 'regular',
        categoryId: '',  // Category ID for grouping (empty = Uncategorized)
        isDetailed: false,
        defaultDetails: ''
      },
      // Chore details form data (modal state in uiStore)
      choreDetailsForm: {
        name: '',
        details: '',
        amount: 0,
        category: 'regular',
        assignedTo: '',
        isNewFromQuicklist: false,
      },
      // selectedQuicklistChore and multiAssignSelectedMembers moved to chores store
      // Schedule modal data - **Feature: weekly-chore-scheduling**
      scheduleModalChore: null,
      // Default order modal data
      defaultOrderMember: null,
      // Assign category modal data
      assignCategoryChore: null,
      assignCategorySelectedId: '',
      // Person management - NOTE: people array moved to familyStore.members
      // Components should use useFamilyStore().members instead
      newPerson: { name: '' },
      personToDelete: null,
      // Child creation & parent invites
      childForm: { username: '', password: '', displayName: '' },
      inviteData: { token: '', expiresAt: null },
      // NOTE: pendingInviteToken moved to authStore.pendingInviteToken
      // Spending requests - NOTE: moved to familyStore.spendingRequests
      // Components should use useFamilyStore().spendingRequests instead
      // New Day functionality
      newDayLoading: false,
      // Spending modal data
      selectedPerson: null,
      spendAmount: 0,
      spendAmountString: '0',
    // Page navigation
    currentPage: 'chores', // Default to chores page

    // Helper methods
    getIcon(iconName, library = 'lucide', size = 16, className = '') {
      if (typeof window.Helpers !== 'undefined' && window.Helpers.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(iconName, library, size, className);
      }
      console.warn(`Icon "${iconName}" requested but Helpers not available yet`);
      return '';
    },

    // Existing data
      // NOTE: chores, quicklistChores, selectedChoreId moved to choresStore
      // Components should use useChoresStore() instead of $parent references
      showConfetti: false,
      confettiPieces: [],
      showSuccessMessageFlag: false,
      completedChoreMessage: '',
      // Mobile nav state
      mobileNavOpen: false,
      // Nav items (extensible)
      navItems: [
        { key: 'chores', label: 'Chores' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'family', label: 'Family' },
        { key: 'shopping', label: 'Shopping' },
        { key: 'recipes', label: 'Recipes' },
        { key: 'learning', label: "Kid's Center" },
        { key: 'account', label: 'Account' }
      ],
      
      // Shopping page data now managed by Pinia store (stores/shopping.js)
      // These are kept for backward compatibility but delegate to the store
      // shoppingItems, shoppingQuickItems, stores - accessed via computed properties
      
      // NOTE: accountSettings and accountId moved to authStore
      // Components should use useAuthStore().accountSettings and useAuthStore().accountId instead
      
      loading: true,
      error: null
    }
  },
  computed: {
    // NOTE: choresByPerson moved to choresStore.choresByPerson
    // Components should use useChoresStore().choresByPerson instead
    
    // NOTE: earnings and electronicsStatus moved to familyStore
    // Components should use useFamilyStore().earnings and useFamilyStore().electronicsStatus instead
    
    // NOTE: selectedChore moved to choresStore.selectedChore
    // Components should use useChoresStore().selectedChore instead
    
    // ============================================
    // AUTH STATE COMPUTED PROPERTIES
    // These delegate to authStore for backward compatibility
    // _Requirements: 3.1, 3.2, 3.5_
    // ============================================
    isAuthenticated() {
      return this.$authStore?.isAuthenticated || false;
    },
    currentUser() {
      return this.$authStore?.currentUser || null;
    },
    accountId() {
      return this.$authStore?.accountId || null;
    },
    accountSettings() {
      return this.$authStore?.accountSettings || null;
    },
    authForm() {
      return this.$authStore?.authForm || {
        mode: 'parent',
        email: '',
        username: '',
        password: '',
        name: '',
        confirmationCode: ''
      };
    },
    authError() {
      return this.$authStore?.authError || null;
    },
    authLoading() {
      return this.$authStore?.authLoading || false;
    },
    pendingInviteToken: {
      get() {
        return this.$authStore?.pendingInviteToken || null;
      },
      set(value) {
        if (this.$authStore) {
          this.$authStore.pendingInviteToken = value;
        }
      }
    },
    // Auth modal state - now from uiStore modal registry
    showLoginModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('login') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('login');
          } else {
            this.$uiStore.closeModal('login');
          }
        }
      }
    },
    showSignupModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('signup') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('signup');
          } else {
            this.$uiStore.closeModal('signup');
          }
        }
      }
    },
    showConfirmModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('confirm') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('confirm');
          } else {
            this.$uiStore.closeModal('confirm');
          }
        }
      }
    },
    
    // ============================================
    // MODAL STATE COMPUTED PROPERTIES
    // These delegate to uiStore modal registry for backward compatibility
    // _Requirements: 4.1, 4.2, 4.3, 4.5_
    // ============================================
    showAddChoreModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('addChore') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('addChore');
          } else {
            this.$uiStore.closeModal('addChore');
          }
        }
      }
    },
    showAddToQuicklistModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('addToQuicklist') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('addToQuicklist');
          } else {
            this.$uiStore.closeModal('addToQuicklist');
          }
        }
      }
    },
    showChoreDetailsModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('choreDetails') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('choreDetails');
          } else {
            this.$uiStore.closeModal('choreDetails');
          }
        }
      }
    },
    showMultiAssignModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('multiAssign') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('multiAssign');
          } else {
            this.$uiStore.closeModal('multiAssign');
          }
        }
      }
    },
    showCategoryManagementModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('categoryManagement') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('categoryManagement');
          } else {
            this.$uiStore.closeModal('categoryManagement');
          }
        }
      }
    },
    showScheduleModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('schedule') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('schedule');
          } else {
            this.$uiStore.closeModal('schedule');
          }
        }
      }
    },
    showDefaultOrderModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('defaultOrder') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('defaultOrder');
          } else {
            this.$uiStore.closeModal('defaultOrder');
          }
        }
      }
    },
    showAssignCategoryModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('assignCategory') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('assignCategory');
          } else {
            this.$uiStore.closeModal('assignCategory');
          }
        }
      }
    },
    showAddPersonModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('addPerson') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('addPerson');
          } else {
            this.$uiStore.closeModal('addPerson');
          }
        }
      }
    },
    showDeletePersonModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('deletePerson') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('deletePerson');
          } else {
            this.$uiStore.closeModal('deletePerson');
          }
        }
      }
    },
    showCreateChildModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('createChild') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('createChild');
          } else {
            this.$uiStore.closeModal('createChild');
          }
        }
      }
    },
    showInviteModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('invite') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('invite');
          } else {
            this.$uiStore.closeModal('invite');
          }
        }
      }
    },
    showNewDayModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('newDay') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('newDay');
          } else {
            this.$uiStore.closeModal('newDay');
          }
        }
      }
    },
    showSpendingModal: {
      get() {
        return this.$uiStore?.isModalOpen?.('spending') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('spending');
          } else {
            this.$uiStore.closeModal('spending');
          }
        }
      }
    },
    // **Feature: habit-tracking** - Habit flyout modal state
    showHabitFlyout: {
      get() {
        return this.$uiStore?.isModalOpen?.('habitFlyout') || false;
      },
      set(value) {
        if (this.$uiStore) {
          if (value) {
            this.$uiStore.openModal('habitFlyout');
          } else {
            this.$uiStore.closeModal('habitFlyout');
          }
        }
      }
    },
    
    // whether any modal is currently open (used to lock/unlock body scroll on mobile)
    // Now delegates to uiStore.hasAnyModalOpen
    // _Requirements: 4.4, 4.5_
    isAnyModalOpen() {
      return this.$uiStore?.hasAnyModalOpen || false;
    },
    // Offline store for checking network status
    // _Requirements: 4.4_
    offlineStore() {
      if (typeof window !== 'undefined' && window.useOfflineStore) {
        return window.useOfflineStore();
      }
      // Return a default object if store is not available
      return { isOnline: true };
    },
    
    // ============================================
    // BRIDGE COMPUTED PROPERTIES: Expose stores for watchers
    // These computed properties allow the bridge watchers to observe
    // store state changes and sync them to legacy app.js properties.
    // 
    // **Feature: app-js-refactoring**
    // **Validates: Requirements 8.1, 8.2**
    // ============================================
    
    // NOTE: $choresStore bridge removed - chore state now lives exclusively in choresStore
    // Components should use useChoresStore() directly
    
    // NOTE: $familyStore bridge removed - family state now lives exclusively in familyStore
    // Components should use useFamilyStore() directly
    
    // Expose auth store for bridge watchers
    $authStore() {
      if (typeof window !== 'undefined' && window.useAuthStore) {
        return window.useAuthStore();
      }
      // Return a default object if store is not available
      return { isAuthenticated: false, currentUser: null };
    },
    
    // Expose UI store for bridge watchers
    // **Feature: app-js-refactoring**
    // **Validates: Requirements 8.1, 8.2**
    $uiStore() {
      if (typeof window !== 'undefined' && window.useUIStore) {
        return window.useUIStore();
      }
      // Return a default object if store is not available
      return { currentPage: 'chores' };
    }
  },
  methods: {
    // WebSocket initialization - delegates to composable
    // WebSocket now updates stores directly, no app.js state updates needed
    initWebsocket() {
      const ws = window.useWebSocket?.();
      if (!ws) {
        console.warn('[app.js] useWebSocket not available');
        return;
      }

      // NOTE: All WebSocket callbacks now update stores directly
      // Family member updates are handled by the WebSocket composable updating familyStore
      ws.onAppStateUpdate({
        updatePerson: (memberId, updates) => {
          const familyStore = window.useFamilyStore?.();
          if (familyStore) {
            const idx = familyStore.members.findIndex(m => m.id === memberId);
            if (idx >= 0) {
              familyStore.members[idx] = { ...familyStore.members[idx], ...updates };
            }
          }
        }
      });

      ws.connect();
    },
    
    // NOTE: apiCall method removed - use useApi() composable instead
    // All API calls now use the useApi composable for consistent authentication headers
    // and error handling. Components should call: const api = window.useApi(); api.call(endpoint, options)
    // _Requirements: 5.5_

    // modal open/close helpers (standardized)
    // Each open method uses uiStore.openModal() which captures scroll position
    // _Requirements: 4.2, 4.3, 4.5_
    openAddChoreModal() {
      this.$uiStore?.openModal('addChore');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openAddChoreModal via uiStore');
    },
    closeAddChoreModal() {
      this.$uiStore?.closeModal('addChore');
    },
    // **Feature: habit-tracking** - Habit flyout methods
    openHabitFlyout(memberId, habit = null) {
      this.habitFlyoutMemberId = memberId;
      this.editingHabit = habit;
      this.habitForm.name = habit ? habit.name : '';
      this.habitFormError = '';
      this.habitFormSubmitting = false;
      this.$uiStore?.openModal('habitFlyout');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openHabitFlyout via uiStore');
    },
    closeHabitFlyout() {
      this.$uiStore?.closeModal('habitFlyout');
      this.habitFlyoutMemberId = '';
      this.editingHabit = null;
      this.habitForm.name = '';
      this.habitFormError = '';
      this.habitFormSubmitting = false;
    },
    async submitHabitForm() {
      const trimmedName = this.habitForm.name.trim();
      if (!trimmedName) {
        this.habitFormError = 'Habit name is required';
        return;
      }
      
      this.habitFormSubmitting = true;
      this.habitFormError = '';
      
      const habitsStore = window.useHabitsStore?.();
      if (!habitsStore) {
        this.habitFormError = 'Store not available';
        this.habitFormSubmitting = false;
        return;
      }
      
      let result;
      if (this.editingHabit) {
        result = await habitsStore.updateHabit(this.editingHabit.id, { name: trimmedName });
      } else {
        result = await habitsStore.createHabit(this.habitFlyoutMemberId, trimmedName);
      }
      
      this.habitFormSubmitting = false;
      
      if (result.success) {
        this.closeHabitFlyout();
      } else {
        this.habitFormError = result.error || 'Failed to save habit';
      }
    },
    openAddToQuicklistModal() {
      this.$uiStore?.openModal('addToQuicklist');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openAddToQuicklistModal via uiStore');
    },
    closeAddToQuicklistModal() {
      this.$uiStore?.closeModal('addToQuicklist');
    },
    closeCreateChildModal() {
      this.$uiStore?.closeModal('createChild');
    },
    closeInviteModal() {
      this.$uiStore?.closeModal('invite');
    },

    // Cache for /auth/me response to avoid duplicate API calls
    // NOTE: _authMeCache moved to authStore._authMeCache
    
    async refreshCurrentUser() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.refreshCurrentUser();
      }
    },
    
  // Data loading methods
  async loadAllData() {
    try {
      this.loading = true;
      this.error = null;
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🔄 Starting to load all application data...');
        console.log('🌐 API Base URL:', CONFIG.API.BASE_URL);
      }
      
      // check authentication first
      if (!this.isAuthenticated) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔒 User not authenticated, skipping data load');
        this.loading = false;
        return;
      }
      
      // Note: refreshCurrentUser() is already called in mounted() before loadAllData()
      // No need to call it again here - the accountId/role is already primed

      // load account settings first so X-Account-Id header is available for all subsequent calls (children/coparents see the same list)
      try {
        await this.loadAccountSettings();
      } catch (e) {
        console.warn('account settings load failed; proceeding with defaults', e);
      }
      
      // Get stores for loading data
      const choresStore = window.useChoresStore?.();
      const familyStore = window.useFamilyStore?.();
      
      // Load family members first (electronics status depends on members being loaded)
      await familyStore?.loadMembers();
      
      // Load remaining data in parallel
      // Note: loadEarnings just reloads members, so we skip it since members are already loaded
      await Promise.all([
        // Core chore page data - now uses choresStore
        choresStore?.loadChores(),
        familyStore?.loadElectronicsStatus(),
        choresStore?.loadQuicklistChores(),
        this.loadCategories(),
        
        // Shopping page data
        this.loadShoppingItems(),
        this.loadShoppingQuickItems(),
        this.loadStores()
      ]);
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ All application data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        this.error = `Failed to load data: ${error.message}. Please check your connection and API configuration.`;
      } finally {
        this.loading = false;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🏁 Loading complete. Loading state:', this.loading);
      }
    },
    
    // NOTE: loadChores moved to choresStore.loadChores()
    // Components should use useChoresStore().loadChores() instead
    
    // NOTE: loadFamilyMembers moved to familyStore.loadMembers()
    // Components should use useFamilyStore().loadMembers() instead
    
    // NOTE: loadEarnings moved to familyStore.loadEarnings()
    // Components should use useFamilyStore().loadEarnings() instead
    
    // NOTE: loadElectronicsStatus moved to familyStore.loadElectronicsStatus()
    // Components should use useFamilyStore().loadElectronicsStatus() instead

    // NOTE: updateElectronicsStatusOptimistically moved to familyStore.updateElectronicsStatusOptimistically()
    // Components should use useFamilyStore().updateElectronicsStatusOptimistically() instead
    
    // NOTE: loadQuicklistChores moved to choresStore.loadQuicklistChores()
    // Components should use useChoresStore().loadQuicklistChores() instead

    async loadCategories() {
      try {
        const categoriesStore = window.useCategoriesStore ? window.useCategoriesStore() : null;
        if (categoriesStore) {
          await categoriesStore.loadCategories();
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📁 Categories loaded:', categoriesStore.categories.length);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    },

    async loadUserTheme() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.loadUserTheme();
      }
    },

    // Shopping page data loading methods
    async loadShoppingItems() {
      // Delegate to Pinia store - single source of truth
      const shoppingStore = window.useShoppingStore();
      await shoppingStore.loadItems();
    },

    async loadShoppingQuickItems() {
      // Delegate to Pinia store - single source of truth
      const shoppingStore = window.useShoppingStore();
      await shoppingStore.loadQuickItems();
    },

    async loadStores() {
      // Delegate to Pinia store - single source of truth
      const shoppingStore = window.useShoppingStore();
      await shoppingStore.loadStores();
    },

    // Account page data loading methods
    async loadAccountSettings() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.loadAccountSettings();
      }
    },
    

    
    // Chore selection methods - now delegate to chores store
    handleChoreClick(chore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Chore clicked:', chore.name);
      
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.warn('Chores store not available');
        return;
      }
      
      // If the same chore is clicked again, deselect it
      if (choresStore.selectedChoreId === chore.id) {
        choresStore.selectedChoreId = null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Deselected chore');
      } else {
        choresStore.selectedChoreId = chore.id;
        choresStore.selectedQuicklistChore = null; // Clear quicklist selection
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Selected chore:', chore.name);
      }
    },
    
    handleQuicklistChoreClick(chore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Quicklist chore clicked:', chore.name);
      
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.warn('Chores store not available');
        return;
      }
      
      // If the same quicklist chore is clicked again, deselect it
      if (choresStore.selectedQuicklistChore && choresStore.selectedQuicklistChore.id === chore.id) {
        choresStore.selectedQuicklistChore = null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Deselected quicklist chore');
      } else {
        choresStore.selectedQuicklistChore = { ...chore, isNewFromQuicklist: true };
        choresStore.selectedChoreId = null; // Clear regular chore selection
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Selected quicklist chore:', chore.name);
      }
    },
    
    // Person management methods
    async addPerson() {
      alert('Manual people are no longer supported. Use "Add Child" or "Invite Parent".');
    },
    
    cancelAddPerson() {
      this.$uiStore?.closeModal('addPerson');
      this.newPerson = { name: '', displayName: '' };
    },

    openAddPersonModal() {
      alert('Manual people are no longer supported. Use "Add Child" or "Invite Parent".');
    },
    async updateFamilyMemberDisplayName(person) {
      try {
        // require user-linked member to update profile; disallow for legacy/manual rows
        if (!person?.userId) return;
        const api = window.useApi();
        await api.post(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS, { userId: person.userId, displayName: person.displayName || person.name, name: person.displayName || person.name });
        // Reload family members from familyStore
        const familyStore = window.useFamilyStore?.();
        if (familyStore) {
          await familyStore.loadMembers(false);
        }
      } catch (e) {
        console.warn('failed to update display name', e);
      }
    },
    async updateMemberChoresEnabled(person) {
      try {
        const authStore = window.useAuthStore?.();
        
        // Ensure we know the account first
        if (!this.accountId && !this.accountSettings?.accountId) {
          try { await this.loadAccountSettings(); } catch { /* ignore - will use defaults */ }
        }

        // Optimistically update local state via authStore
        const prefs = this.accountSettings?.preferences || {};
        const current = { ...(prefs.membersChoresEnabled || {}) };
        const enabled = !!person.enabledForChores;
        // Write both userId and name keys for stability across backfills
        if (person.userId) current[person.userId] = enabled;
        if (person.name) current[person.name] = enabled;
        
        if (authStore) {
          authStore.accountSettings = {
            ...(authStore.accountSettings || {}),
            preferences: { ...prefs, membersChoresEnabled: current }
          };
        }

        const accountId = this.accountId || this.accountSettings?.accountId;
        if (!accountId) {
          console.warn('Cannot persist member visibility: missing accountId');
          return;
        }

        // Prefer granular endpoint with optional OCC
        const memberKey = person.userId || person.name;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] persist start', { accountId, memberKey, enabled, before: { ...(this.accountSettings?.preferences?.membersChoresEnabled || {}) } });
        let res;
        try {
          res = await window.SettingsClient.updateMemberVisibility(accountId, memberKey, enabled, { ifMatch: this.accountSettings?.updatedAt });
        } catch (e) {
          console.warn('[Visibility] granular failed; falling back to bulk', e?.message || e);
          // fallback to bulk partial update
          res = await window.SettingsClient.updatePreferences(accountId, { membersChoresEnabled: current }, { ifMatch: this.accountSettings?.updatedAt });
        }
        // Sync local cache with server echo via authStore
        if (res && res.preferences && authStore) {
          authStore.accountSettings = {
            ...authStore.accountSettings,
            preferences: res.preferences,
            updatedAt: res.updatedAt || authStore.accountSettings?.updatedAt
          };
          if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] persist done', { updatedAt: authStore.accountSettings.updatedAt, after: res.preferences?.membersChoresEnabled || {} });
        }
      } catch (e) {
        console.warn('failed to persist member chores enabled', e);
        this.showSuccessMessage('❌ Failed to save board visibility.');
      }
    },
    canRemoveMember(person) {
      // cannot remove account creator (owner)
      const ownerUserId = this.accountSettings?.userId;
      return person?.userId ? person.userId !== ownerUserId : true;
    },
    // NOTE: removeMember now delegates to familyStore.removeMember()
    async removeMember(person) {
      const familyStore = window.useFamilyStore?.();
      if (!familyStore) {
        console.error('Family store not available');
        return;
      }
      
      if (!confirm(`Remove ${person.displayName || person.name} from this account?`)) return;
      
      const result = await familyStore.removeMember(person.id);
      if (!result.success) {
        alert(result.error || 'Failed to remove member');
      }
    },
    
    // Child management
    // _Requirements: 4.2, 4.3, 4.5_
    openCreateChildModal() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.resetChildForm();
      }
      this.childForm = { username: '', password: '', displayName: '' };
      this.$uiStore?.openModal('createChild');
    },
    // NOTE: createChild now delegates to familyStore.createChild()
    async createChild() {
      if (!this.childForm.username || !this.childForm.password) return;
      
      const familyStore = window.useFamilyStore?.();
      if (!familyStore) {
        console.error('Family store not available');
        return;
      }
      
      const result = await familyStore.createChild({
        username: this.childForm.username,
        password: this.childForm.password,
        displayName: this.childForm.displayName
      });
      
      if (result.success) {
        this.$uiStore?.closeModal('createChild');
        this.childForm = { username: '', password: '', displayName: '' };
        alert('Child account created. Share the username and password with your child.');
      } else {
        console.error('Failed to create child', result.error);
        alert(result.error || 'Failed to create child');
      }
    },
    
    // Parent invites
    // _Requirements: 4.2, 4.3, 4.5_
    async createParentInvite() {
      try {
        // lock scroll for iOS safari during modal
        document.body.classList.add('modal-open');
        const api = window.useApi();
        const res = await api.post(CONFIG.API.ENDPOINTS.PARENT_INVITE, {});
        this.inviteData = res;
        this.$uiStore?.openModal('invite');
      } catch (e) {
        console.error('Failed to create invite', e);
        alert('Failed to create invite');
      } finally {
        // ensure lock only remains if modal actually opened
        if (!this.showInviteModal) {
          document.body.classList.remove('modal-open');
        }
      }
    },
    async acceptParentInvite(token) {
      try {
        // ensure we have a valid auth header at accept time; if not, route to signup
        if (!authService.getAuthHeader()) {
          this.pendingInviteToken = token;
          this.showSignupForm();
          return;
        }
        const api = window.useApi();
        await api.post(CONFIG.API.ENDPOINTS.PARENT_ACCEPT_INVITE, { token });
        await this.refreshCurrentUser();
        await this.loadAllData();
        alert('Invite accepted. You now have access to this account.');
      } catch (e) {
        console.error('Failed to accept invite', e);
        const message = e?.message || 'Failed to accept invite';
        alert(message);
      }
    },
    
    // NOTE: Spending requests now delegate to familyStore
    async loadSpendingRequests() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        await familyStore.loadSpendingRequests();
      }
    },
    async approveSpendingRequest(requestId) {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        const result = await familyStore.approveSpendingRequest(requestId);
        if (!result.success) {
          console.error('Failed to approve request', result.error);
        }
      }
    },
    
    // _Requirements: 4.2, 4.3, 4.5_
    confirmDeletePerson(person) {
      this.personToDelete = person;
      this.$uiStore?.openModal('deletePerson');
    },
    
    async performDeletePerson() {
      if (this.personToDelete) {
        const familyStore = window.useFamilyStore?.();
        const api = window.useApi();
        
        try {
          const name = this.personToDelete.name;
          const userId = this.personToDelete.userId;
          const memberId = this.personToDelete.id;
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`🗑️ Removing person via modal: name=${name}, userId=${userId || 'none'}`);

          // if we know the Cognito userId, remove the account membership first to prevent auto re-creation
          if (userId) {
            await api.delete(`/family-members/memberships/${encodeURIComponent(userId)}`);
          } else {
            // fallback: delete the family member card by visible name
            await api.delete(`/family-members/by-name/${encodeURIComponent(name)}`);
          }

          if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`✅ Removal complete for: ${name}`);

          // Remove person from familyStore
          if (familyStore) {
            familyStore.members = familyStore.members.filter(p => p.id !== memberId);
          }

          // Reload data to ensure both pages reflect removal
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
          this.showSuccessMessage(`❌ Failed to delete ${this.personToDelete.name}: ${error.message}`);
        }

        this.personToDelete = null;
        this.$uiStore?.closeModal('deletePerson');
      }
    },
    
    async executeDeletePerson() {
      // This method is deprecated - use performDeletePerson() instead
      if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('executeDeletePerson is deprecated, redirecting to performDeletePerson');
      await this.performDeletePerson();
    },
    
    cancelDeletePerson() {
      this.personToDelete = null;
      this.$uiStore?.closeModal('deletePerson');
    },
    
    showDeletePersonModalFor(person) {
      this.personToDelete = person;
      this.$uiStore?.openModal('deletePerson');
    },
    
    // NOTE: addChore moved to choresStore.createChore()
    // Components should use useChoresStore().createChore() instead
    
    cancelAddChore() {
      this.$uiStore?.closeModal('addChore');
      this.newChore = { name: '', amount: 0, category: 'regular', addToQuicklist: false, isDetailed: false };
    },
    
    async addToQuicklist() {
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        return;
      }
      
      if (this.newQuicklistChore.name.trim() && this.newQuicklistChore.amount >= 0) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically adding to quicklist:', this.newQuicklistChore.name);
        
        // Store original state for potential rollback
        const originalQuicklistChores = [...choresStore.quicklistChores];
        const quicklistData = {
          name: this.newQuicklistChore.name.trim(),
          amount: this.newQuicklistChore.amount,
          category: this.newQuicklistChore.category,
          categoryId: this.newQuicklistChore.categoryId || null,  // Category ID for grouping
          isDetailed: this.newQuicklistChore.isDetailed || false,
          defaultDetails: this.newQuicklistChore.defaultDetails || ''
        };
        
        try {
          // OPTIMISTIC UPDATE: Add to quicklist immediately
          const tempQuicklistChore = {
            id: `temp-quicklist-${Date.now()}`,
            ...quicklistData,
            isOptimistic: true
          };
          choresStore.quicklistChores.push(tempQuicklistChore);
          
          // Close modal immediately for instant feedback
          this.cancelAddToQuicklist();
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - quicklist item added');
          
          // Make API call in background using useApi composable
          const api = window.useApi();
          const response = await api.post(CONFIG.API.ENDPOINTS.QUICKLIST, quicklistData);
          
          // Update only the ID and optimistic flag - avoid full object replacement to prevent flash
          const quicklistIndex = choresStore.quicklistChores.findIndex(c => c.id === tempQuicklistChore.id);
          if (quicklistIndex !== -1) {
            const existing = choresStore.quicklistChores[quicklistIndex];
            // Only update the ID from server response, keep other properties to avoid re-render flash
            existing.id = response.quicklistChore.id;
            existing.isOptimistic = false;
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed quicklist creation');
          
        } catch (error) {
          console.error('❌ Quicklist creation failed, rolling back optimistic update:', error);
          
          // ROLLBACK: Restore original state
          choresStore.quicklistChores.splice(0, choresStore.quicklistChores.length, ...originalQuicklistChores);
          
          // Reopen modal with original data
          this.$uiStore?.openModal('addToQuicklist');
          
          // Show error message
          this.showSuccessMessage(`❌ Failed to add "${quicklistData.name}" to quicklist. Please try again.`);
        }
      }
    },
    
    cancelAddToQuicklist() {
      this.$uiStore?.closeModal('addToQuicklist');
      this.newQuicklistChore = { name: '', amount: 0, category: 'regular', categoryId: '', isDetailed: false, defaultDetails: '' };
    },

    // Multi-assignment modal methods for quicklist chores
    // _Requirements: 4.2, 4.3, 4.5_
    openMultiAssignModal(quicklistChore) {
      const choresStore = window.useChoresStore?.();
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🎯 Parent openMultiAssignModal called with:', quicklistChore?.name);
        console.log('📊 Current modal state before:', {
          showMultiAssignModal: this.showMultiAssignModal,
          selectedQuicklistChore: choresStore?.selectedQuicklistChore?.name || 'none'
        });
      }

      if (choresStore) {
        choresStore.selectQuicklistChore(quicklistChore);
        choresStore.clearMemberSelection();
      }
      this.$uiStore?.openModal('multiAssign');

      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📊 Modal state after:', {
        showMultiAssignModal: this.showMultiAssignModal,
        selectedQuicklistChore: choresStore?.selectedQuicklistChore?.name || 'none',
        multiAssignSelectedMembers: choresStore?.multiAssignSelectedMembers || []
      });
    },

    cancelMultiAssignment() {
      this.$uiStore?.closeModal('multiAssign');
      const choresStore = window.useChoresStore?.();
      if (choresStore) {
        choresStore.clearSelection();
      }
    },

    // Category management modal methods
    // _Requirements: 1.1, 4.2, 4.3, 4.5_
    openCategoryManagementModal() {
      this.$uiStore?.openModal('categoryManagement');
    },
    
    closeCategoryManagementModal() {
      this.$uiStore?.closeModal('categoryManagement');
    },
    
    // Schedule modal methods
    // **Feature: weekly-chore-scheduling**
    // **Validates: Requirements 1.2, 1.3, 1.5, 4.2, 4.3, 4.5**
    openScheduleModal(quicklistChore) {
      this.scheduleModalChore = quicklistChore;
      this.$uiStore?.openModal('schedule');
    },
    
    closeScheduleModal() {
      this.$uiStore?.closeModal('schedule');
      this.scheduleModalChore = null;
    },
    
    // Default order modal methods
    // _Requirements: 4.2, 4.3, 4.5_
    openDefaultOrderModal(member) {
      this.defaultOrderMember = member;
      this.$uiStore?.openModal('defaultOrder');
    },
    
    closeDefaultOrderModal() {
      this.$uiStore?.closeModal('defaultOrder');
      this.defaultOrderMember = null;
    },
    
    // Handle default order save from modal
    async handleDefaultOrderSave({ memberId, defaultOrderMap }) {
      const uiStore = window.useUIStore?.();
      const familyStore = window.useFamilyStore?.();
      
      // Guard against undefined memberId (can happen if modal triggers save after closing)
      if (!memberId) {
        console.warn('[handleDefaultOrderSave] No memberId provided, skipping');
        return;
      }
      
      if (!familyStore) {
        console.error('[handleDefaultOrderSave] Family store not available');
        return;
      }
      
      try {
        const result = await familyStore.updateDefaultOrder(memberId, defaultOrderMap);
        
        if (result.success) {
          if (uiStore) {
            uiStore.showSuccess('Default order saved');
          }
          this.closeDefaultOrderModal();
        } else {
          if (uiStore) {
            uiStore.showError(result.error || 'Failed to save default order');
          }
        }
      } catch (error) {
        console.error('Failed to save default order:', error);
        if (uiStore) {
          uiStore.showError('Failed to save default order');
        }
      }
    },
    
    // Handle schedule save from modal
    // Uses chores store for quicklist data
    async handleScheduleSave({ quicklistId, schedule }) {
      const uiStore = window.useUIStore?.();
      const choresStore = window.useChoresStore?.();
      
      if (!choresStore) {
        console.error('[handleScheduleSave] Chores store not available');
        return;
      }
      
      // Verify the quicklist chore exists in store
      const quicklistChore = choresStore.quicklistChores.find(c => c.id === quicklistId);
      if (!quicklistChore) {
        console.error('[handleScheduleSave] Quicklist chore not found:', quicklistId);
        if (uiStore) {
          uiStore.showError('Quicklist chore not found');
        }
        return;
      }
      
      try {
        // Use chores store action to update schedule
        const result = await choresStore.updateQuicklistFullSchedule(quicklistId, schedule);
        
        if (result.success) {
          if (uiStore) {
            uiStore.showSuccess('Schedule updated successfully');
          }
          this.closeScheduleModal();
        } else {
          if (uiStore) {
            uiStore.showError(result.error || 'Failed to update schedule');
          }
        }
      } catch (error) {
        console.error('Failed to save schedule:', error);
        if (uiStore) {
          uiStore.showError('Failed to update schedule');
        }
      }
    },
    
    // Update quicklist chore category (inline dropdown)
    async updateQuicklistCategory(chore, categoryId, categoryName) {
      if (!chore) return;
      
      try {
        // Update the quicklist chore with the new category using useApi composable
        const api = window.useApi();
        await api.put(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${chore.id}`, {
          categoryId: categoryId || null,
          categoryName: categoryName
        });
        
        // Reload quicklist to reflect changes
        await this.loadQuicklistChores();
        
        // Show success message
        const uiStore = window.useUIStore?.();
        if (uiStore) {
          const displayName = categoryName || 'Uncategorized';
          uiStore.showSuccess(`Moved to "${displayName}"`);
        }
      } catch (error) {
        console.error('Failed to update category:', error);
        const uiStore = window.useUIStore?.();
        if (uiStore) {
          uiStore.showError('Failed to update category');
        }
      }
    },

    async confirmMultiAssignment() {
      const choresStore = window.useChoresStore?.();
      const familyStore = window.useFamilyStore?.();
      
      if (!choresStore || !choresStore.selectedQuicklistChore || choresStore.multiAssignSelectedMembers.length === 0) {
        return;
      }

      // Set loading state on the modal component if available
      if (this.$refs.appModalsComponent) {
        this.$refs.appModalsComponent.multiAssignLoading = true;
      }

      const selectedMembers = choresStore.multiAssignSelectedMembers;
      const quicklistChore = choresStore.selectedQuicklistChore;
      const people = familyStore?.members || [];
      const results = [];

      try {
        // Create all assignments in parallel for better performance
        const assignmentPromises = selectedMembers.map(async (memberId) => {
          const member = people.find(p => p.id === memberId);
          if (!member) return { memberId, success: false, error: 'Member not found' };

          // Use displayName with fallback to name for backward compatibility
          const memberDisplayName = member.displayName || member.name;

          try {
            // Check if quicklist chore requires details
            if (quicklistChore.isDetailed) {
              // For detailed chores, we'll need to handle this differently
              // For now, assign without details (could be enhanced later)
              await this.assignQuicklistChoreToMember(quicklistChore, memberDisplayName);
              return { memberId, memberName: memberDisplayName, success: true };
            } else {
              await this.assignQuicklistChoreToMember(quicklistChore, memberDisplayName);
              return { memberId, memberName: memberDisplayName, success: true };
            }
          } catch (error) {
            console.error(`Failed to assign chore to ${memberDisplayName}:`, error);
            return { memberId, memberName: memberDisplayName, success: false, error: error.message };
          }
        });

        // Wait for all assignments to complete (success or failure)
        const assignmentResults = await Promise.allSettled(assignmentPromises);

        // Process results
        const successful = assignmentResults.filter(result =>
          result.status === 'fulfilled' && result.value.success
        ).map(result => result.value);

        const failed = assignmentResults.filter(result =>
          result.status === 'rejected' ||
          (result.status === 'fulfilled' && !result.value.success)
        ).map(result => result.status === 'rejected' ? result.reason : result.value);

        results.push(...successful, ...failed);

        // Show appropriate message based on results
        if (successful.length > 0) {
          const memberNames = successful.map(s => s.memberName).join(', ');
          this.showSuccessMessage(`✅ Assigned "${quicklistChore.name}" to ${successful.length} member${successful.length !== 1 ? 's' : ''}: ${memberNames}`);
        }

        if (failed.length > 0) {
          console.error('Some assignments failed:', failed);
          if (successful.length === 0) {
            this.showSuccessMessage(`❌ Failed to assign "${quicklistChore.name}" to any family members`);
          } else {
            this.showSuccessMessage(`⚠️ Assigned to ${successful.length} members, but ${failed.length} assignment${failed.length !== 1 ? 's' : ''} failed`);
          }
        }

        // Close modal and reset state
        this.cancelMultiAssignment();

      } catch (error) {
        console.error('Unexpected error in confirmMultiAssignment:', error);
        this.showSuccessMessage('❌ An unexpected error occurred while assigning chores');
      } finally {
        // Reset loading state on the modal component if available
        if (this.$refs.appModalsComponent) {
          this.$refs.appModalsComponent.multiAssignLoading = false;
        }
      }
    },

    async assignQuicklistChoreToMember(quicklistChore, memberName) {
      // Use chores store for state management
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        throw new Error('Chores store not available');
      }

      // Create optimistic chore with temp ID
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newChore = {
        id: tempId,
        name: quicklistChore.name,
        amount: quicklistChore.amount || 0,
        category: quicklistChore.category || 'regular',
        details: '',
        assignedTo: memberName,
        completed: false,
        isPendingApproval: false,
        isOptimistic: true
      };

      // Add optimistic chore to store immediately
      choresStore.chores.push(newChore);
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - quicklist chore added for', memberName);

      // Update electronics status optimistically if needed
      if (newChore.category === 'game') {
        const familyStore = window.useFamilyStore?.();
        if (familyStore) {
          familyStore.updateElectronicsStatusOptimistically(memberName);
        }
      }

      try {
        // Make API call to create the chore using useApi composable
        const choreData = {
          name: newChore.name,
          amount: newChore.amount,
          category: newChore.category,
          assignedTo: memberName,
          completed: false
        };

        const api = window.useApi();
        const response = await api.post(CONFIG.API.ENDPOINTS.CHORES, choreData);

        // Update the optimistic chore with real data from server
        const choreIndex = choresStore.chores.findIndex(c => c.id === tempId);
        if (choreIndex !== -1) {
          choresStore.chores[choreIndex] = {
            ...response.chore,
            isOptimistic: false
          };
        }
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed quicklist chore creation for', memberName);
      } catch (error) {
        // Rollback optimistic update on error
        const choreIndex = choresStore.chores.findIndex(c => c.id === tempId);
        if (choreIndex !== -1) {
          choresStore.chores.splice(choreIndex, 1);
        }
        console.error('Failed to create quicklist chore:', error);
        throw error;
      }
    },

    // Chore details modal methods
    // _Requirements: 4.2, 4.3, 4.5_
    openChoreDetailsModal(choreData, assignedTo = '', isNewFromQuicklist = false) {
      this.choreDetailsForm = {
        name: choreData.name,
        details: '',
        amount: choreData.amount,
        category: choreData.category,
        assignedTo: assignedTo,
        isNewFromQuicklist: isNewFromQuicklist,
        quicklistChoreId: choreData.id
      };
      this.$uiStore?.openModal('choreDetails');
    },

    async confirmChoreDetails() {
      if (!this.choreDetailsForm.details.trim()) {
        // Allow empty details, but at least ensure it's not just whitespace
        this.choreDetailsForm.details = '';
      }

      // Get stores
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        this.showSuccessMessage(`❌ Failed to create chore. Please try again.`);
        return;
      }

      // Get API service
      const api = window.useApi();

      try {
        if (this.choreDetailsForm.isNewFromQuicklist) {
          // Create new chore from quicklist with details
          const choreData = {
            name: this.choreDetailsForm.name,
            amount: this.choreDetailsForm.amount,
            category: this.choreDetailsForm.category,
            assignedTo: this.choreDetailsForm.assignedTo,
            completed: false,
            details: this.choreDetailsForm.details.trim(),
            isDetailed: true
          };
          
          // Create the chore with details using useApi composable
          const response = await api.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
          
          // Add to chores store
          choresStore.chores.push(response.chore);
          
          // Clear selections
          choresStore.selectedChoreId = null;
          choresStore.selectedQuicklistChore = null;
          
        } else {
          // Handle regular chore creation with details
          const choreData = {
            name: this.choreDetailsForm.name,
            amount: this.choreDetailsForm.amount,
            category: this.choreDetailsForm.category,
            assignedTo: this.choreDetailsForm.assignedTo || 'unassigned',
            completed: false,
            details: this.choreDetailsForm.details.trim(),
            isDetailed: true
          };
          
          const response = await api.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
          
          // Add to chores store
          choresStore.chores.push(response.chore);
          
          // Also add to quicklist if requested
          if (this.newChore.addToQuicklist) {
            const quicklistData = {
              name: choreData.name,
              amount: choreData.amount,
              category: choreData.category,
              isDetailed: true
            };
            
            const quicklistResponse = await api.post(CONFIG.API.ENDPOINTS.QUICKLIST, quicklistData);
            
            choresStore.quicklistChores.push(quicklistResponse.quicklistChore);
          }
        }
        
        this.cancelChoreDetails();
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Chore with details created successfully');
        
      } catch (error) {
        console.error('❌ Failed to create chore with details:', error);
        this.showSuccessMessage(`❌ Failed to create chore. Please try again.`);
      }
    },

    cancelChoreDetails() {
      this.$uiStore?.closeModal('choreDetails');
      this.choreDetailsForm = {
        name: '',
        details: '',
        amount: 0,
        category: 'regular',
        assignedTo: '',
        isNewFromQuicklist: false,
        quicklistChoreId: null
      };
    },

    // New Day functionality
    // _Requirements: 4.1, 4.2, 6.3_
    async startNewDay() {
      // Get chores store for state access
      const choresStore = window.useChoresStore?.();
      const familyStore = window.useFamilyStore?.();
      
      try {
        this.newDayLoading = true;
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          const chores = choresStore?.chores || [];
          const members = familyStore?.members || [];
          console.log('🌅 Starting new day...');
          console.log('📊 Current state before new day:');
          console.log('  - Chores count:', chores.length);
          console.log('  - Chores:', chores.map(c => `${c.name} (${c.assignedTo})`));
          console.log('  - People completed chores:', members.map(p => `${p.name}: ${p.completedChores}`));
        }
        
        // Use useApi composable for API call
        const api = window.useApi();
        const response = await api.post(CONFIG.API.ENDPOINTS.CHORES_NEW_DAY, {
          dailyChores: [] // Could be extended later to include predefined daily chores
        });
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ New day API response:', response);
        
        // Reload all data to reflect changes
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔄 Reloading all data after new day...');
        await this.loadAllData();
        
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          const choresAfter = choresStore?.chores || [];
          const membersAfter = familyStore?.members || [];
          console.log('📊 State after reload:');
          console.log('  - Chores count:', choresAfter.length);
          console.log('  - Chores:', choresAfter.map(c => `${c.name} (${c.assignedTo})`));
          console.log('  - People completed chores:', membersAfter.map(p => `${p.name}: ${p.completedChores}`));
        }
        
        // Parse summary from enhanced response format
        const summary = response?.summary || {};
        const {
          choresRemoved = 0,
          completedChoresCleared = 0,
          dailyChoresCleared = 0,
          dailyChoresCreated = 0,
          duplicatesSkipped = 0
        } = summary;
        
        // Build detailed success message with counts
        const messageParts = [];
        if (choresRemoved > 0) {
          const details = [];
          if (completedChoresCleared > 0) details.push(`${completedChoresCleared} completed`);
          if (dailyChoresCleared > 0) details.push(`${dailyChoresCleared} daily`);
          messageParts.push(`${choresRemoved} chore${choresRemoved !== 1 ? 's' : ''} cleared${details.length > 0 ? ` (${details.join(', ')})` : ''}`);
        }
        if (dailyChoresCreated > 0) {
          messageParts.push(`${dailyChoresCreated} daily chore${dailyChoresCreated !== 1 ? 's' : ''} created`);
        }
        if (duplicatesSkipped > 0) {
          messageParts.push(`${duplicatesSkipped} duplicate${duplicatesSkipped !== 1 ? 's' : ''} skipped`);
        }
        
        const detailMessage = messageParts.length > 0 
          ? messageParts.join(', ')
          : 'Board ready for new day';
        
        this.showSuccessMessage(`🌅 New day started! ${detailMessage}. Earnings preserved.`);
        
        this.$uiStore?.closeModal('newDay');
      } catch (error) {
        console.error('❌ Failed to start new day:', error);
        this.showSuccessMessage(`❌ Failed to start new day: ${error.message}`);
      } finally {
        this.newDayLoading = false;
      }
    },

    cancelNewDay() {
      this.$uiStore?.closeModal('newDay');
    },

    // Open New Day modal with scroll position capture
    // _Requirements: 4.2, 4.3, 4.5_
    openNewDayModal() {
      if (!this.offlineStore.isOnline) {
        return;
      }
      this.$uiStore?.openModal('newDay');
    },

    // Page navigation
    setCurrentPage(page) {
      this.currentPage = page;
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📄 Switched to page:', page);
    },


    // Authentication and user management
    async handleAuthenticationRequired() {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔒 Authentication required - clearing auth state');
      
      // Clear auth state via authStore
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.isAuthenticated = false;
        authStore.currentUser = null;
      }
      
      // Clear chores store data
      const choresStore = window.useChoresStore?.();
      if (choresStore) {
        choresStore.chores = [];
        choresStore.quicklistChores = [];
        choresStore.selectedChoreId = null;
        choresStore.selectedQuicklistChore = null;
      }
      
      // Clear family store data
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.members = [];
        familyStore.spendingRequests = [];
      }
      
      // if an invite token is present, guide to signup instead of login
      try {
        const url = new URL(window.location.href);
        const inviteToken = (authStore?.pendingInviteToken) || url.searchParams.get('invite');
        if (inviteToken) {
          if (authStore) {
            authStore.pendingInviteToken = inviteToken;
          }
          this.showSignupForm();
          return;
        }
      } catch (e) {
        // ignore url parsing errors
      }
      // default to login modal
      this.showLoginForm();
    },

    async handleLogin() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.handleLogin();
      }
    },

    async handleSignup() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.handleSignup();
      }
    },

    async handleConfirmSignup() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.handleConfirmSignup();
      }
    },

    async handleLogout() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.handleLogout();
      }
    },

    showLoginForm() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.showLoginForm();
      }
    },

    showSignupForm() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.showSignupForm();
      }
    },

    closeAuthModals() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.closeAuthModals();
      }
    },

    clearAuthForm() {
      // Delegate to authStore
      // _Requirements: 3.3, 3.5_
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.clearAuthForm();
      }
    },
    
    async removeFromQuicklist(quicklistId) {
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        return;
      }
      
      // Store original state for rollback
      const originalQuicklistChores = [...choresStore.quicklistChores];
      
      // OPTIMISTIC UPDATE: Remove immediately from UI
      const index = choresStore.quicklistChores.findIndex(c => c.id === quicklistId);
      if (index !== -1) {
        choresStore.quicklistChores.splice(index, 1);
      }
      
      try {
        const api = window.useApi();
        await api.delete(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`);
        // No need to reload - optimistic update already removed it
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed quicklist deletion');
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
        // ROLLBACK: Restore original state on failure
        choresStore.quicklistChores.splice(0, choresStore.quicklistChores.length, ...originalQuicklistChores);
      }
    },
    

    
    // NOTE: deleteChore moved to choresStore.deleteChore()
    // Components should use useChoresStore().deleteChore() instead
    
    // NOTE: handleChoreCompletion moved to choresStore.toggleComplete()
    // Components should use useChoresStore().toggleComplete() instead
    
    // NOTE: approveChore moved to choresStore.approveChore()
    // Components should use useChoresStore().approveChore() instead

    // NOTE: reassignChore moved to choresStore.assignChore()
    // Components should use useChoresStore().assignChore() instead
    
    triggerConfetti(chore = null) {
      // Delegate to celebrations composable
      const celebrations = window.useCelebrations?.();
      if (celebrations) {
        celebrations.celebrate({ chore, accountSettings: this.accountSettings });
      } else {
        console.warn('[app.js] useCelebrations not available');
      }
    },

    // Mobile optimization - refresh tokens when app becomes visible
    setupVisibilityChangeListener() {
      // Listen for messages from service worker
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data?.type === 'STORE_TOKENS' && event.data?.tokens) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔄 Storing tokens from service worker...');
          authService.setTokens(event.data.tokens);
          authService.storeTokens(event.data.tokens);
        }
      });

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && this.isAuthenticated && authService.isAuthenticated()) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📱 App became visible, checking token refresh...');
          // Force a token refresh check when app becomes visible
          authService.refreshAccessToken().catch(error => {
            console.warn('Token refresh on visibility change failed:', error);
          });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Also handle page focus for additional reliability
      window.addEventListener('focus', () => {
        if (this.isAuthenticated && authService.isAuthenticated()) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔍 App gained focus, checking token refresh...');
          authService.refreshAccessToken().catch(error => {
            console.warn('Token refresh on focus failed:', error);
          });
        }
      });

      // Handle page blur for mobile optimization
      // Only refresh tokens when actually going to background, not when focus moves to modals/drawers
      window.addEventListener('blur', () => {
        // Skip if focus is still within the document (e.g., moved to a modal/drawer)
        // Use a small delay to let focus settle, then check if document is actually hidden
        setTimeout(() => {
          // Only refresh if the document is actually hidden (app went to background)
          // or if activeElement is null/body (focus left the window entirely)
          const focusLeftWindow = !document.hasFocus();
          if (focusLeftWindow && this.isAuthenticated && authService.isAuthenticated()) {
            if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📱 App going to background, refreshing tokens proactively...');
            // Proactively refresh tokens before app goes to background
            authService.refreshAccessToken().catch(error => {
              console.warn('Token refresh on blur failed:', error);
            });
          }
        }, 100);
      });
    },

    // Add method for click-to-assign functionality with optimistic updates
    async assignSelectedChore(assignTo) {
      // Get chores store
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        return;
      }
      
      const selectedChore = choresStore.selectedChore;
      
      if (!selectedChore) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('No chore selected for assignment');
        return;
      }
      
      if (!assignTo) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('No assignee specified');
        return;
      }
      
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically assigning chore:', selectedChore.name, 'to:', assignTo);
      
      // Store original state for potential rollback
      const originalChores = [...choresStore.chores];
      const selectedChoreCopy = { ...selectedChore };
      
      // Get API service
      const api = window.useApi();
      
      try {
        if (selectedChore.isNewFromQuicklist) {
          // Check if this quicklist chore requires details
          const quicklistChore = choresStore.quicklistChores.find(qc => qc.name === selectedChore.name);
          if (quicklistChore && quicklistChore.isDetailed) {
            // Open details modal for detailed quicklist chore
            this.openChoreDetailsModal(selectedChore, assignTo, true);
            return;
          }
          
          // OPTIMISTIC UPDATE: Add new chore immediately to UI
          const newChore = {
            id: `temp-${Date.now()}`, // Temporary ID
            name: selectedChore.name,
            amount: selectedChore.amount || 0,
            category: selectedChore.category || 'regular',
            assignedTo: assignTo,
            completed: false,
            isDetailed: false,
            details: '',
            isOptimistic: true // Flag to identify optimistic updates
          };
          
          // Add to chores store immediately for instant UI update
          choresStore.chores.push(newChore);
          
          // Clear selection immediately for instant feedback
          choresStore.selectedChoreId = null;
          choresStore.selectedQuicklistChore = null;
          
          // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status if this is an electronics chore
          if (newChore.category === 'game') {
            const familyStore = window.useFamilyStore?.();
            if (familyStore) {
              familyStore.updateElectronicsStatusOptimistically(assignTo);
            }
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - new chore added');
          
          // Now make API call in background using useApi composable
          const choreData = {
            name: newChore.name,
            amount: newChore.amount,
            category: newChore.category,
            assignedTo: assignTo,
            completed: false
          };
          
          const response = await api.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
          
          // Update the temporary chore with real data from server
          const choreIndex = choresStore.chores.findIndex(c => c.id === newChore.id);
          if (choreIndex !== -1) {
            choresStore.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed new chore creation');
          
        } else {
          // OPTIMISTIC UPDATE: Move existing chore immediately
          const choreIndex = choresStore.chores.findIndex(c => c.id === selectedChore.id);
          const oldAssignedTo = choresStore.chores[choreIndex]?.assignedTo;
          if (choreIndex !== -1) {
            // Update assignment immediately for instant UI feedback
            choresStore.chores[choreIndex] = {
              ...choresStore.chores[choreIndex],
              assignedTo: assignTo,
              isOptimistic: true
            };
            
            // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status for both old and new assignees if this is an electronics chore
            if (choresStore.chores[choreIndex].category === 'game') {
              const familyStore = window.useFamilyStore?.();
              if (familyStore) {
                if (oldAssignedTo && oldAssignedTo !== 'unassigned') {
                  familyStore.updateElectronicsStatusOptimistically(oldAssignedTo);
                }
                if (assignTo && assignTo !== 'unassigned') {
                  familyStore.updateElectronicsStatusOptimistically(assignTo);
                }
              }
            }
          }
          
          // Clear selection immediately for instant feedback
          choresStore.selectedChoreId = null;
          choresStore.selectedQuicklistChore = null;
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - chore moved');
          
          // Now make API call in background using useApi composable
          const response = await api.put(`${CONFIG.API.ENDPOINTS.CHORES}/${selectedChoreCopy.id}/assign`, { assignedTo: assignTo });
          
          // Update with server response
          if (choreIndex !== -1) {
            choresStore.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed chore assignment');
        }
        
        // Reload earnings and electronics status in background (non-blocking)
        const familyStore = window.useFamilyStore?.();
        if (familyStore) {
          Promise.all([
            familyStore.loadEarnings(),
            familyStore.loadElectronicsStatus(),
            familyStore.loadMembers()
          ]).catch(error => {
            console.warn('Background data refresh failed:', error);
          });
        }
        
      } catch (error) {
        console.error('❌ Assignment failed, rolling back optimistic update:', error);
        
        // ROLLBACK: Restore original state
        choresStore.chores = originalChores;
        choresStore.selectedChoreId = selectedChoreCopy.isNewFromQuicklist ? null : selectedChoreCopy.id;
        choresStore.selectedQuicklistChore = selectedChoreCopy.isNewFromQuicklist ? selectedChoreCopy : null;
        
        // Show user-friendly error message
        this.showSuccessMessage(`❌ Failed to assign "${selectedChoreCopy.name}". Please try again.`);
      }
    },

    // User display helper methods
    getUserDisplayName(user) {
      if (!user) return 'User';
      return user.name || user.email?.split('@')[0] || 'User';
    },

    getUserInitial(user) {
      if (!user) return 'U';
      const name = this.getUserDisplayName(user);
      return name.charAt(0).toUpperCase();
    },

    showSuccessMessage(message) {
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🎉 showSuccessMessage called with:', message);
        console.trace('showSuccessMessage call stack:');
      }
      // suppress generic auth-required notices when signup modal is already being shown for invite flow
      if (this.showSignupModal && typeof message === 'string' && /authentication required/i.test(message)) {
        return;
      }
      this.completedChoreMessage = message;
      this.showSuccessMessageFlag = true;
      setTimeout(() => {
        this.showSuccessMessageFlag = false;
        this.completedChoreMessage = '';
      }, 3000);
    },
    
    clearSuccessMessage() {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🧹 Manually clearing success message');
      this.showSuccessMessageFlag = false;
      this.completedChoreMessage = '';
    },

    // Spending modal methods
    // _Requirements: 4.2, 4.3, 4.5_
    openSpendingModal(person) {
      this.selectedPerson = person;
      this.spendAmount = 0;
      this.spendAmountString = '0';
      this.$uiStore?.openModal('spending');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openSpendingModal via uiStore');
    },

    closeSpendingModal() {
      this.$uiStore?.closeModal('spending');
      this.selectedPerson = null;
      this.spendAmount = 0;
      this.spendAmountString = '0';
    },

    addDigit(digit) {
      if (this.spendAmountString === '0') {
        this.spendAmountString = digit.toString();
      } else {
        this.spendAmountString += digit.toString();
      }
      this.updateSpendAmount();
    },

    addDecimal() {
      if (!this.spendAmountString.includes('.')) {
        this.spendAmountString += '.';
        this.updateSpendAmount();
      }
    },

    clearSpendAmount() {
      this.spendAmountString = '0';
      this.spendAmount = 0;
    },

    updateSpendAmount() {
      const amount = parseFloat(this.spendAmountString);
      this.spendAmount = isNaN(amount) ? 0 : Number(amount);
    },

    async confirmSpending() {
      if (this.spendAmount <= 0 || this.spendAmount > this.selectedPerson.earnings) return;
      try {
        const requireApproval = !!this.accountSettings?.preferences?.requireApproval;
        const isChild = this.currentUser?.role === 'child';
        const canSpend = !!this.accountSettings?.preferences?.childPermissions?.canSpendMoney;
        const personName = this.selectedPerson.name;
        const spentAmount = this.spendAmount;

        if (requireApproval && isChild && canSpend) {
          // create spend request instead of immediate deduction using useApi composable
          const api = window.useApi();
          await api.post(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodeURIComponent(personName)}/spend-requests`, { amount: Number(spentAmount) });
          alert('Spend request submitted for approval.');
          this.closeSpendingModal();
          return;
        }

        // immediate deduction (parent or approval disabled) using useApi composable
        const api = window.useApi();
        await api.put(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodeURIComponent(personName)}/earnings`, { amount: Number(spentAmount), operation: 'subtract' });

        // Reload earnings from familyStore
        const familyStore = window.useFamilyStore?.();
        if (familyStore) {
          await familyStore.loadEarnings();
        }
        this.triggerConfetti();
        this.showSuccessMessageFlag = true;
        this.completedChoreMessage = `${personName} spent $${spentAmount.toFixed(2)}!`;
        setTimeout(() => { this.showSuccessMessageFlag = false; }, 3000);
        this.closeSpendingModal();
      } catch (error) {
        console.error('Error spending money:', error);
        alert('Failed to spend money. Please try again.');
      }
    }
  },
  
  watch: {
    // Sync accountId to apiService when it changes
    accountId: {
      immediate: true,
      handler(newVal) {
        if (window.apiService && newVal) {
          window.apiService.setAccountId(newVal);
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔗 apiService.accountId synced:', newVal);
        }
      }
    },
    // toggle body scroll lock whenever any modal opens/closes
    isAnyModalOpen(newVal) {
      if (newVal) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    },
    
    showSuccessMessageFlag() {
      // Verbose flag tracking removed - use browser DevTools if needed
    },
    
    // ============================================
    // BRIDGE WATCHERS: Sync store state to legacy app.js properties
    // These watchers maintain backward compatibility during migration
    // by syncing Pinia store state to app.js data properties.
    // Components not yet migrated can continue using $parent references.
    // 
    // **Feature: app-js-refactoring**
    // **Validates: Requirements 8.1, 8.2**
    // ============================================
    
    // NOTE: Chores bridge watchers removed - chore state now lives exclusively in choresStore
    // Components should use useChoresStore() directly
    
    // NOTE: Family bridge watchers removed - family state now lives exclusively in familyStore
    // Components should use useFamilyStore() directly
    
    // NOTE: Auth bridge watchers removed - auth state now accessed via computed properties
    // that delegate to authStore. Components should use useAuthStore() directly.
    // _Requirements: 3.5_
    
    // Bridge: Sync uiStore.currentPage → this.currentPage
    // **Feature: app-js-refactoring**
    // **Validates: Requirements 8.1, 8.2**
    '$uiStore.currentPage': {
      handler(newPage) {
        if (newPage && newPage !== this.currentPage) {
          this.currentPage = newPage;
          if (CONFIG.ENV.IS_DEVELOPMENT) {
            console.log('🔄 [Bridge] uiStore.currentPage → app.currentPage synced:', newPage);
          }
        }
      }
    }
  },
  
  async mounted() {
    try {
      // Close mobile nav when clicking outside the mobile nav container
      document.addEventListener('click', (e) => {
        try {
          if (!e.target.closest('.mobile-nav')) this.mobileNavOpen = false;
        } catch { /* ignore DOM errors */ }
      });
      // Debug initial success message state
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔍 Initial success message state:', {
        showSuccessMessageFlag: this.showSuccessMessageFlag,
        completedChoreMessage: this.completedChoreMessage
      });
      
      // Clear any stray success messages on app start
      if (this.showSuccessMessageFlag && !this.completedChoreMessage) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🧹 Clearing stray success message on app start');
        this.clearSuccessMessage();
      }
      
      // check authentication first
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 App starting - checking authentication...');
      
      // check if authService exists
      if (typeof authService === 'undefined') {
        console.error('❌ authService not found! Check if auth.js loaded properly.');
        const authStore = window.useAuthStore?.();
        if (authStore) {
          authStore.isAuthenticated = false;
        }
        this.loading = false;
        return;
      }
      
      // wait a moment for authService to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // ============================================
      // INITIALIZATION SEQUENCE: auth → theme → data
      // Each phase must complete before the next begins
      // (Property 5: Initialization Order - Requirements 4.4)
      // ============================================
      
      // PHASE 1: Authentication
      const isAuthenticated = await authService.initializeAuth();
      const authStore = window.useAuthStore?.();
      
      if (isAuthenticated) {
        // Update authStore with authentication state
        if (authStore) {
          authStore.isAuthenticated = true;
          authStore.currentUser = authService.currentUser;
        }
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ [Phase 1] User is authenticated:', this.currentUser);
        
        // Complete auth phase: fetch user/memberships to prime X-Account-Id
        try { 
          await this.refreshCurrentUser(); 
        } catch (e) { 
          console.warn('initial refreshCurrentUser failed', e); 
        }
        
        // PHASE 2: Theme (after auth completes)
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 [Phase 2] Loading user theme...');
        await this.loadUserTheme();
        
        // PHASE 3: Data loading (after theme completes)
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📦 [Phase 3] Loading application data...');
        await this.loadAllData();
        
        // PHASE 4: Real-time connections (after data loads)
        this.initWebsocket();

        // Add visibility change listener for mobile optimization
        this.setupVisibilityChangeListener();
        
        // PHASE 5: Start midnight scheduler for automatic new day trigger
        if (window.MidnightScheduler) {
          window.MidnightScheduler.start();
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🌙 [Phase 5] Midnight scheduler started');
        }
      // if invite token present, show accept prompt after load (only if still authenticated)
      const url = new URL(window.location.href);
      const inviteToken = url.searchParams.get('invite');
      if (inviteToken) {
        // if auth was cleared during load due to 401s, pivot to signup flow instead of prompting accept
        if (!this.isAuthenticated || !authService.getAuthHeader()) {
          if (authStore) {
            authStore.pendingInviteToken = inviteToken;
          }
          this.showSignupForm();
        } else {
          const accept = confirm('You have been invited to join a family account. Accept invitation?');
          if (accept) {
            // prevent auth-required popup by deferring accept until after data loads and ensuring auth header exists
            if (!authService.getAuthHeader()) {
              if (authStore) {
                authStore.pendingInviteToken = inviteToken;
              }
              this.showSignupForm();
            } else {
              await this.acceptParentInvite(inviteToken);
            }
            url.searchParams.delete('invite');
            window.history.replaceState({}, document.title, url.toString());
          }
        }
      }
      } else {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('❌ [Phase 1] User not authenticated - ready for login');
        if (authStore) {
          authStore.isAuthenticated = false;
        }
        this.loading = false;

        // PHASE 2: Theme for unauthenticated users (login page)
        // This is the single initialization point for non-authenticated state
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 [Phase 2] Initializing default theme for login page...');
        ThemeManager.initializeTheme();

        // if an invite is present and user is unauthenticated, guide them to create an account
        try {
          const url = new URL(window.location.href);
          const inviteToken = url.searchParams.get('invite');
          if (inviteToken) {
            if (authStore) {
              authStore.pendingInviteToken = inviteToken;
            }
            // default to signup flow for invited users
            this.showSignupForm();
          }
        } catch (e) {
          console.warn('failed to detect pending invite while unauthenticated', e);
        }
      }
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      const authStore = window.useAuthStore?.();
      if (authStore) {
        authStore.isAuthenticated = false;
      }
      this.loading = false;
    }
  },

  provide() {
    return {
      // Global utilities and helpers
      Helpers: window.Helpers,
      CONFIG: window.CONFIG,

      // Provide reactive data to child components
      // Readonly computed values for display data
      loading: Vue.computed(() => this.loading),
      error: Vue.computed(() => this.error),
      selectedChore: Vue.computed(() => {
        // Use chores store for selection state
        const store = window.useChoresStore?.();
        return store?.selectedChore || null;
      }),
      selectedChoreId: Vue.computed(() => {
        const store = window.useChoresStore?.();
        return store?.selectedChoreId || null;
      }),
      selectedQuicklistChore: Vue.computed(() => {
        const store = window.useChoresStore?.();
        return store?.selectedQuicklistChore || null;
      }),
      // lightweight selection store for centralized selection handling
      selectionStore: {
        state: {
          selectedChore: Vue.computed(() => {
            const store = window.useChoresStore?.();
            return store?.selectedChore || null;
          }),
          selectedChoreId: Vue.computed(() => {
            const store = window.useChoresStore?.();
            return store?.selectedChoreId || null;
          }),
          selectedQuicklistChore: Vue.computed(() => {
            const store = window.useChoresStore?.();
            return store?.selectedQuicklistChore || null;
          })
        },
        selectChore: (chore) => this.handleChoreClick(chore),
        selectQuicklist: (quickChore) => this.handleQuicklistChoreClick(quickChore),
        clear: () => {
          const store = window.useChoresStore?.();
          if (store) {
            store.selectedChoreId = null;
            store.selectedQuicklistChore = null;
          }
        }
      },
      showSuccessMessageFlag: Vue.computed(() => this.showSuccessMessageFlag),
      completedChoreMessage: Vue.computed(() => this.completedChoreMessage),
      showConfetti: Vue.computed(() => this.showConfetti),
      confettiPieces: Vue.computed(() => this.confettiPieces),
      quicklistChores: Vue.computed(() => {
        const store = window.useChoresStore?.();
        return store?.quicklistChores || [];
      }),
      categories: Vue.computed(() => {
        const categoriesStore = window.useCategoriesStore ? window.useCategoriesStore() : null;
        return categoriesStore ? categoriesStore.sortedCategories : [];
      }),
      choresByPerson: Vue.computed(() => {
        const store = window.useChoresStore?.();
        return store?.choresByPerson || {};
      }),
      // expose only members enabled for chores on chores page by default; family page iterates over same array but includes toggle to change flag
      // filtered list for boards (Chores page) - now uses familyStore
      people: Vue.computed(() => {
        const familyStore = window.useFamilyStore?.();
        const members = familyStore?.members || [];
        return members.filter(p => p.showOnChoreBoard !== false);
      }),
      // unfiltered list for Family page management - now uses familyStore
      allPeople: Vue.computed(() => {
        const familyStore = window.useFamilyStore?.();
        return familyStore?.members || [];
      }),
      personToDelete: Vue.computed(() => this.personToDelete),
      
      // Shopping page data - provided from Pinia store (single source of truth)
      shoppingItems: Vue.computed(() => {
        const store = window.useShoppingStore();
        return store.items || [];
      }),
      shoppingQuickItems: Vue.computed(() => {
        const store = window.useShoppingStore();
        return store.quickItems || [];
      }),
      stores: Vue.computed(() => {
        const store = window.useShoppingStore();
        return store.stores || [];
      }),
      
      // Preloaded account page data
      accountSettings: Vue.computed(() => this.accountSettings),
      accountId: Vue.computed(() => this.accountId),
      // spendingRequests now uses familyStore
      spendingRequests: Vue.computed(() => {
        const familyStore = window.useFamilyStore?.();
        return familyStore?.spendingRequests || [];
      }),
      
      // Modal state computed values (readonly)
      showAddToQuicklistModal: Vue.computed(() => this.showAddToQuicklistModal),
      showAddChoreModal: Vue.computed(() => this.showAddChoreModal),
      // **Feature: habit-tracking** - Habit flyout state
      showHabitFlyout: Vue.computed(() => this.showHabitFlyout),
      habitFlyoutMemberId: Vue.computed(() => this.habitFlyoutMemberId),
      editingHabit: Vue.computed(() => this.editingHabit),
      habitForm: Vue.toRef(this, 'habitForm'),
      habitFormError: Vue.computed(() => this.habitFormError),
      habitFormSubmitting: Vue.computed(() => this.habitFormSubmitting),
      showAddPersonModal: Vue.computed(() => this.showAddPersonModal),
      showDeletePersonModal: Vue.computed(() => this.showDeletePersonModal),
      showNewDayModal: Vue.computed(() => this.showNewDayModal),
      newDayLoading: Vue.computed(() => this.newDayLoading),
      showSpendingModal: Vue.computed(() => this.showSpendingModal),
      showChoreDetailsModal: Vue.computed(() => this.showChoreDetailsModal),
      showMultiAssignModal: Vue.computed(() => this.showMultiAssignModal),
      multiAssignSelectedMembers: Vue.computed(() => {
        const store = window.useChoresStore?.();
        return store?.multiAssignSelectedMembers || [];
      }),
      showCategoryManagementModal: Vue.computed(() => this.showCategoryManagementModal),
      // Schedule modal state - **Feature: weekly-chore-scheduling**
      showScheduleModal: Vue.computed(() => this.showScheduleModal),
      scheduleModalChore: Vue.computed(() => this.scheduleModalChore),
      // Default order modal state
      showDefaultOrderModal: Vue.computed(() => this.showDefaultOrderModal),
      defaultOrderMember: Vue.computed(() => this.defaultOrderMember),
      // add child / invite parent modal flags
      showCreateChildModal: Vue.computed(() => this.showCreateChildModal),
      showInviteModal: Vue.computed(() => this.showInviteModal),
      selectedPerson: Vue.computed(() => this.selectedPerson),
      spendAmount: Vue.computed(() => this.spendAmount),
      spendAmountString: Vue.computed(() => this.spendAmountString),
      currentPage: Vue.computed(() => this.currentPage),
      
      // NOTE: Authentication modal state now accessed via computed properties
      // that delegate to uiStore and authStore. Components should use
      // useAuthStore() and useUIStore() directly.
      // _Requirements: 3.5_
      
      // Form data as reactive refs
      newQuicklistChore: Vue.toRef(this, 'newQuicklistChore'),
      newPerson: Vue.toRef(this, 'newPerson'),
      newChore: Vue.toRef(this, 'newChore'),
      // NOTE: authForm now accessed via authStore.authForm
      choreDetailsForm: Vue.toRef(this, 'choreDetailsForm'),
      
      // Provide methods that child components need
      loadAllData: this.loadAllData,
      assignSelectedChore: this.assignSelectedChore,
      handleChoreClick: this.handleChoreClick,
      handleQuicklistChoreClick: this.handleQuicklistChoreClick,
      setCurrentPage: this.setCurrentPage,
      confirmDeletePerson: this.confirmDeletePerson,
      addChore: this.addChore,
      cancelAddChore: this.cancelAddChore,
      addPerson: this.addPerson,
      cancelAddPerson: this.cancelAddPerson,
      openAddPersonModal: this.openAddPersonModal,
      addToQuicklist: this.addToQuicklist,
      cancelAddToQuicklist: this.cancelAddToQuicklist,
      openChoreDetailsModal: this.openChoreDetailsModal,
      openAddChoreModal: this.openAddChoreModal,
      closeAddChoreModal: this.closeAddChoreModal,
      openAddToQuicklistModal: this.openAddToQuicklistModal,
      closeAddToQuicklistModal: this.closeAddToQuicklistModal,
      closeCreateChildModal: this.closeCreateChildModal,
      closeInviteModal: this.closeInviteModal,
      confirmChoreDetails: this.confirmChoreDetails,
      cancelChoreDetails: this.cancelChoreDetails,
      startNewDay: this.startNewDay,
      cancelNewDay: this.cancelNewDay,
      openMultiAssignModal: this.openMultiAssignModal,
      confirmMultiAssignment: this.confirmMultiAssignment,
      cancelMultiAssignment: this.cancelMultiAssignment,
      openCategoryManagementModal: this.openCategoryManagementModal,
      closeCategoryManagementModal: this.closeCategoryManagementModal,
      // Schedule modal methods - **Feature: weekly-chore-scheduling**
      openScheduleModal: this.openScheduleModal,
      closeScheduleModal: this.closeScheduleModal,
      handleScheduleSave: this.handleScheduleSave,
      // Default order modal methods
      openDefaultOrderModal: this.openDefaultOrderModal,
      closeDefaultOrderModal: this.closeDefaultOrderModal,
      handleDefaultOrderSave: this.handleDefaultOrderSave,
      updateQuicklistCategory: this.updateQuicklistCategory,
      deleteChore: this.deleteChore,
      reassignChore: this.reassignChore,
      deletePerson: this.performDeletePerson,
      executeDeletePerson: this.executeDeletePerson,
      cancelDeletePerson: this.cancelDeletePerson,
      triggerConfetti: this.triggerConfetti,
      // NOTE: loadEarnings moved to familyStore.loadEarnings()
      // Components should use useFamilyStore().loadEarnings() instead
      showSuccessMessage: this.showSuccessMessage,
      
      // Data reload methods for child components
      loadShoppingItems: this.loadShoppingItems,
      loadShoppingQuickItems: this.loadShoppingQuickItems,
      loadStores: this.loadStores,
      loadAccountSettings: this.loadAccountSettings,
      
      // Spending modal methods (also used by children like EarningsWidget)
      openSpendingModal: this.openSpendingModal,
      closeSpendingModal: this.closeSpendingModal,
      addDigit: this.addDigit,
      addDecimal: this.addDecimal,
      clearSpendAmount: this.clearSpendAmount,
      confirmSpending: this.confirmSpending,
      
      // User data
      currentUser: Vue.computed(() => this.currentUser),
      
      // NOTE: Authentication methods now delegate to authStore
      // Components should use useAuthStore() directly for auth operations
      // These are kept for backward compatibility during migration
      // _Requirements: 3.5_
      handleLogin: this.handleLogin,
      handleSignup: this.handleSignup,
      handleConfirmSignup: this.handleConfirmSignup,
      handleLogout: this.handleLogout,
      showLoginForm: this.showLoginForm,
      showSignupForm: this.showSignupForm,
      closeAuthModals: this.closeAuthModals,
      // Child/Parent invites
      openCreateChildModal: this.openCreateChildModal,
      createParentInvite: this.createParentInvite,
      // Spending approvals
      loadSpendingRequests: this.loadSpendingRequests,
      approveSpendingRequest: this.approveSpendingRequest
      ,
      // NOTE: apiCall removed - use window.useApi() composable instead
      // Components should call: const api = window.useApi(); api.call(endpoint, options)
      // _Requirements: 5.5_
      
      // Categories store for category management
      categoriesStore: Vue.computed(() => window.useCategoriesStore?.())
    };
  }
});

// Configure Vue compiler options for Shoelace custom elements
app.config.compilerOptions = {
  isCustomElement: (tag) => {
    if (tag.startsWith('sl-')) {
      console.log(`🔧 Vue compiler: Treating ${tag} as custom element`);
      return true;
    }
    return false;
  }
};

// Function to check if all components are loaded
function checkAndRegisterComponents() {
  console.log('🔧 Checking component availability...');
  
  // Check if all components are available
  const requiredComponents = [
    'UIComponents',
    'QuicklistSectionComponent',
    'UnassignedSectionComponent',
    'FamilyMembersSectionComponent',
    'TrashSectionComponent',
    'AppModalsComponent',
    'EarningsWidgetComponent',
    'FamilyPageComponent',
    'ShoppingPageComponent',
    'TailwindChorePageComponent',
    'AccountPageComponent',
    'NavMenuComponent'
  ];
  
  const missingComponents = requiredComponents.filter(comp => !window[comp]);
  
  if (missingComponents.length > 0) {
    console.log('⏳ Waiting for components:', missingComponents);
    setTimeout(checkAndRegisterComponents, 100); // Check again in 100ms
    return;
  }
  
  console.log('🔧 All components available, registering...');

  // Shoelace components are native custom elements handled by isCustomElement
  console.log('📦 Shoelace components configured as native custom elements');

  // Register UI components
  if (window.UIComponents) {
    Object.entries(window.UIComponents).forEach(([name, component]) => {
      console.log(`📦 Registering ${name}`);
      app.component(name, component);
    });
  }

  // Register section components with kebab-case names to match HTML
  console.log('📦 Registering quicklist-section');
  app.component('quicklist-section', window.QuicklistSectionComponent);
  
  console.log('📦 Registering unassigned-section');
  app.component('unassigned-section', window.UnassignedSectionComponent);
  
  console.log('📦 Registering family-members-section');
  app.component('family-members-section', window.FamilyMembersSectionComponent);
  
  console.log('📦 Registering trash-section');
  app.component('trash-section', window.TrashSectionComponent);
  
  // Auth Modal Components - must be registered before app-modals
  // _Requirements: 16.3, 16.4_
  console.log('📦 Registering login-modal');
  if (window.LoginModalComponent) {
    app.component('login-modal', window.LoginModalComponent);
  }
  
  console.log('📦 Registering signup-modal');
  if (window.SignupModalComponent) {
    app.component('signup-modal', window.SignupModalComponent);
  }
  
  console.log('📦 Registering confirm-modal');
  if (window.ConfirmModalComponent) {
    app.component('confirm-modal', window.ConfirmModalComponent);
  }
  
  // Chore Modal Components - must be registered before app-modals
  // _Requirements: 4.5, 5.5, 6.5, 11.5, 16.3, 16.4_
  console.log('📦 Registering add-chore-modal');
  if (window.AddChoreModalComponent) {
    app.component('add-chore-modal', window.AddChoreModalComponent);
  }
  
  console.log('📦 Registering chore-details-modal');
  if (window.ChoreDetailsModalComponent) {
    app.component('chore-details-modal', window.ChoreDetailsModalComponent);
  }
  
  console.log('📦 Registering add-to-quicklist-modal');
  if (window.AddToQuicklistModalComponent) {
    app.component('add-to-quicklist-modal', window.AddToQuicklistModalComponent);
  }
  
  console.log('📦 Registering multi-assign-modal');
  if (window.MultiAssignModalComponent) {
    app.component('multi-assign-modal', window.MultiAssignModalComponent);
  }
  
  // Family Modal Components - must be registered before app-modals
  // _Requirements: 7.5, 8.5, 9.5, 16.3, 16.4_
  console.log('📦 Registering create-child-modal');
  if (window.CreateChildModalComponent) {
    app.component('create-child-modal', window.CreateChildModalComponent);
  }
  
  console.log('📦 Registering invite-parent-modal');
  if (window.InviteParentModalComponent) {
    app.component('invite-parent-modal', window.InviteParentModalComponent);
  }
  
  console.log('📦 Registering delete-person-modal');
  if (window.DeletePersonModalComponent) {
    app.component('delete-person-modal', window.DeletePersonModalComponent);
  }
  
  // Spending Modal Component - must be registered before app-modals
  // _Requirements: 10.5, 16.3, 16.4_
  console.log('📦 Registering spending-modal');
  if (window.SpendingModalComponent) {
    app.component('spending-modal', window.SpendingModalComponent);
  }
  
  // Habit Modal Component - must be registered before app-modals
  // _Requirements: 12.5, 16.3, 16.4_
  console.log('📦 Registering habit-modal');
  if (window.HabitModalComponent) {
    app.component('habit-modal', window.HabitModalComponent);
  }
  
  // New Day Modal Component - must be registered before app-modals
  // _Requirements: 13.5, 16.3, 16.4_
  console.log('📦 Registering new-day-modal');
  if (window.NewDayModalComponent) {
    app.component('new-day-modal', window.NewDayModalComponent);
  }
  
  console.log('📦 Registering app-modals');
  app.component('app-modals', window.AppModalsComponent);
  
  console.log('📦 Registering earnings-widget');
  app.component('earnings-widget', window.EarningsWidgetComponent);
  
  console.log('📦 Registering weather-widget');
  app.component('weather-widget', window.WeatherWidget);

  console.log('📦 Registering advice-widget');
  app.component('advice-widget', window.AdviceWidget);

  console.log('📦 Registering trivia-widget');
  app.component('trivia-widget', window.TriviaWidget);
  
  console.log('📦 Registering family-page');
  app.component('family-page', window.FamilyPageComponent);
  
  console.log('📦 Registering shopping-page');
  app.component('shopping-page', window.ShoppingPageComponent);
  
  console.log('📦 Registering chore-page');
  app.component('chore-page', window.TailwindChorePageComponent);

  console.log('📦 Registering account-page');
  app.component('account-page', window.AccountPageComponent);

  console.log('📦 Registering recipe-page');
  app.component('recipe-page', window.RecipePageComponent);

  console.log('📦 Registering image-capture-modal');
  app.component('image-capture-modal', window.ImageCaptureModal);

  console.log('📦 Registering flyout-panel');
  if (window.FlyoutPanel) {
    app.component('flyout-panel', window.FlyoutPanel);
  }

  console.log('📦 Registering category-selector');
  if (window.CategorySelectorComponent) {
    app.component('category-selector', window.CategorySelectorComponent);
  }

  console.log('📦 Registering category-management-modal');
  if (window.CategoryManagementModalComponent) {
    app.component('category-management-modal', window.CategoryManagementModalComponent);
  }

  console.log('📦 Registering schedule-modal');
  if (window.ScheduleModalComponent) {
    app.component('schedule-modal', window.ScheduleModalComponent);
  }

  console.log('📦 Registering habit-card');
  if (window.HabitCard) {
    app.component('habit-card', window.HabitCard);
  }

  console.log('📦 Registering default-order-modal');
  if (window.DefaultOrderModalComponent) {
    app.component('default-order-modal', window.DefaultOrderModalComponent);
  }

  console.log('📦 Registering nav-menu');
  app.component('nav-menu', window.NavMenuComponent);

  console.log('📦 Registering widget-configurator');
  app.component('widget-configurator', window.WidgetConfiguratorComponent);

  console.log('📦 Registering dashboard-page');
  app.component('dashboard-page', window.DashboardPageComponent);

  console.log('📦 Registering offline-indicator');
  if (window.OfflineIndicator) {
    app.component('offline-indicator', window.OfflineIndicator);
  }

  console.log('📦 Registering update-prompt');
  if (window.UpdatePrompt) {
    app.component('update-prompt', window.UpdatePrompt);
  }

  console.log('📦 Registering keyboard-input');
  if (window.KeyboardInput) {
    app.component('keyboard-input', window.KeyboardInput);
  }

  console.log('📦 Registering ai-chat-panel');
  if (window.AIChatPanel) {
    app.component('ai-chat-panel', window.AIChatPanel);
  }

  console.log('📦 Registering learning-hub-page');
  if (window.LearningHubPage) {
    app.component('learning-hub-page', window.LearningHubPage);
  }

  // Homework grading components (Task 8 & 10)
  console.log('📦 Registering submission-card');
  if (window.SubmissionCard) {
    app.component('submission-card', window.SubmissionCard);
  }

  console.log('📦 Registering homework-detail-view');
  if (window.HomeworkDetailView) {
    app.component('homework-detail-view', window.HomeworkDetailView);
  }

  console.log('📦 Registering homework-grading-panel');
  if (window.HomeworkGradingPanel) {
    app.component('homework-grading-panel', window.HomeworkGradingPanel);
  }

  // Kid's Center and Decision Wheel components
  console.log('📦 Registering decision-wheel-panel');
  if (window.DecisionWheelPanel) {
    app.component('decision-wheel-panel', window.DecisionWheelPanel);
  }

  console.log('📦 Registering kids-center-page');
  if (window.KidsCenterPage) {
    app.component('kids-center-page', window.KidsCenterPage);
  }

  console.log('✅ All components registered, mounting app...');

  // Use Pinia for state management
  app.use(pinia);
  console.log('✅ Pinia plugin added to app');

  // Initialize Pinia stores (Phase 1)
  try {
    // Create store instances
    const authStore = useAuthStore();
    const uiStore = useUIStore();
    const choresStore = useChoresStore();
    const shoppingStore = useShoppingStore();
    const familyStore = useFamilyStore();
    const dashboardStore = useDashboardStore();
    const offlineStore = useOfflineStore();
    
    console.log('✅ All stores initialized');
    
    // Initialize network status service and connect to offline store
    if (window.networkStatus) {
      window.networkStatus.init();
      window.networkStatus.subscribe((isOnline) => {
        offlineStore.setOnlineStatus(isOnline);
      });
      console.log('✅ Network status service initialized');
    }
    
    // Auth initialization is handled in mounted() via authService.initializeAuth()
    // The auth store state is synced after successful authentication
    console.log('✅ Auth store ready (initialization deferred to mounted)');
    
    // Make stores available globally for debugging
    if (typeof window !== 'undefined') {
      window.stores = {
        auth: authStore,
        ui: uiStore,
        chores: choresStore,
        shopping: shoppingStore,
        family: familyStore,
        dashboard: dashboardStore,
        offline: offlineStore
      };
      
      // Debug helper
      window.debugStores = function() {
        console.log('=== Pinia Stores Debug Info ===');
        console.log('Auth:', authStore.$state);
        console.log('UI:', uiStore.$state);
        console.log('Chores:', { count: choresStore.choreCount, quicklist: choresStore.quicklistCount });
        console.log('Shopping:', { items: shoppingStore.itemCount, stores: shoppingStore.stores.length });
        console.log('Family:', { members: familyStore.memberCount });
        console.log('Dashboard:', { widgets: dashboardStore.widgetCount });
        console.log('Offline:', offlineStore.$state);
      };
    }
  } catch (error) {
    console.error('❌ Store initialization error:', error);
  }

  // Mount the app
  app.mount('#app');
}

// Wait for DOM to be ready and Helpers to be available, then start checking for components
function initializeApp() {
  // Wait for Helpers to be available
  if (typeof window.Helpers === 'undefined') {
    console.log('⏳ Waiting for Helpers to be available...');
    setTimeout(initializeApp, 50);
    return;
  }

  console.log('✅ Helpers available, initializing app...');

  // Make Helpers available globally to Vue components
  app.config.globalProperties.Helpers = window.Helpers;

  checkAndRegisterComponents();
}

document.addEventListener('DOMContentLoaded', function() {
  // Start checking for Helpers availability
  initializeApp();
}); 
