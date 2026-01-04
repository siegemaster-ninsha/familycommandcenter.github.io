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
      // ============================================
      // MINIMAL APP STATE - All other state lives in Pinia stores
      // _Requirements: 8.4_
      // ============================================
      
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
      
      // App-level loading and error state
      loading: true,
      error: null
    }
  },
  computed: {
    // Template-required computed properties - these are needed by index.html template
    // Components should use stores directly, but the main template needs these
    isAuthenticated() {
      const authStore = window.useAuthStore?.();
      return authStore?.isAuthenticated || false;
    },
    currentUser() {
      const authStore = window.useAuthStore?.();
      return authStore?.currentUser || null;
    },
    offlineStore() {
      return window.useOfflineStore?.() || { isOnline: true };
    },
    // Page navigation - reads from uiStore so nav-menu updates work
    currentPage() {
      const uiStore = window.useUIStore?.();
      return uiStore?.currentPage || 'chores';
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
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('addChore');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openAddChoreModal via uiStore');
    },
    closeAddChoreModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('addChore');
    },
    // NOTE: Habit flyout methods migrated to habitsStore
    // Components should use useHabitsStore().openHabitFlyout(), closeHabitFlyout(), submitHabitForm()
    // _Requirements: 2.5, 2.6_
    openAddToQuicklistModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('addToQuicklist');
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎯 openAddToQuicklistModal via uiStore');
    },
    closeAddToQuicklistModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('addToQuicklist');
    },
    closeCreateChildModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('createChild');
    },
    closeInviteModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('invite');
    },
    
  // Data loading methods
  // _Requirements: 5.2, 8.5_ - Pure orchestration, calls store methods directly
  async loadAllData() {
    try {
      this.loading = true;
      this.error = null;
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🔄 Starting to load all application data...');
        console.log('🌐 API Base URL:', CONFIG.API.BASE_URL);
      }
      
      // check authentication first - use authStore directly
      const authStore = window.useAuthStore?.();
      if (!authStore?.isAuthenticated) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔒 User not authenticated, skipping data load');
        this.loading = false;
        return;
      }
      
      // Note: refreshCurrentUser() is already called in mounted() before loadAllData()
      // No need to call it again here - the accountId/role is already primed

      // load account settings first so X-Account-Id header is available for all subsequent calls
      try {
        await authStore.loadAccountSettings();
      } catch (e) {
        console.warn('account settings load failed; proceeding with defaults', e);
      }
      
      // Get stores for loading data
      const choresStore = window.useChoresStore?.();
      const familyStore = window.useFamilyStore?.();
      const shoppingStore = window.useShoppingStore?.();
      const categoriesStore = window.useCategoriesStore?.();
      
      // Load family members first (electronics status depends on members being loaded)
      await familyStore?.loadMembers();
      
      // Load remaining data in parallel - call store methods directly
      await Promise.all([
        // Core chore page data
        choresStore?.loadChores(),
        familyStore?.loadElectronicsStatus(),
        choresStore?.loadQuicklistChores(),
        categoriesStore?.loadCategories(),
        
        // Shopping page data
        shoppingStore?.loadItems(),
        shoppingStore?.loadQuickItems(),
        shoppingStore?.loadStores()
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
    
    // _Requirements: 8.5_ - Kept for mounted() hook orchestration
    async refreshCurrentUser() {
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.refreshCurrentUser();
      }
    },
    
    // _Requirements: 8.5_ - Kept for mounted() hook orchestration
    async loadUserTheme() {
      const authStore = window.useAuthStore?.();
      if (authStore) {
        await authStore.loadUserTheme();
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
      // Use familyStore for newPerson state
      // _Requirements: 1.5, 1.6_
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.resetNewPersonForm();
      }
    },

    openAddPersonModal() {
      alert('Manual people are no longer supported. Use "Add Child" or "Invite Parent".');
    },
    // NOTE: updateFamilyMemberDisplayName migrated to familyStore.updateFamilyMemberDisplayName()
    // Components should use useFamilyStore().updateFamilyMemberDisplayName(person) instead
    // _Requirements: 5.8_
    
    // NOTE: updateMemberChoresEnabled migrated to familyStore.updateMemberChoresEnabledSetting()
    // Components should use useFamilyStore().updateMemberChoresEnabledSetting(person) instead
    // _Requirements: 5.9_
    
    canRemoveMember(person) {
      // cannot remove account creator (owner)
      // Use authStore directly instead of computed property
      const authStore = window.useAuthStore?.();
      const ownerUserId = authStore?.accountSettings?.userId;
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
    // _Requirements: 1.4, 1.6, 4.2, 4.3, 4.5_
    openCreateChildModal() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.resetChildForm();
      }
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('createChild');
    },
    // NOTE: createChild now delegates to familyStore.createChild()
    async createChild() {
      const familyStore = window.useFamilyStore?.();
      if (!familyStore) {
        console.error('Family store not available');
        return;
      }
      
      // Use familyStore.childForm instead of this.childForm
      // _Requirements: 1.4, 1.6_
      if (!familyStore.childForm.username || !familyStore.childForm.password) return;
      
      const result = await familyStore.createChild({
        username: familyStore.childForm.username,
        password: familyStore.childForm.password,
        displayName: familyStore.childForm.displayName
      });
      
      if (result.success) {
        const uiStore = window.useUIStore?.();
        uiStore?.closeModal('createChild');
        familyStore.resetChildForm();
        alert('Child account created. Share the username and password with your child.');
      } else {
        console.error('Failed to create child', result.error);
        alert(result.error || 'Failed to create child');
      }
    },
    
    // Parent invites
    // _Requirements: 4.2, 4.3, 4.5_
    // _Requirements: 8.4_ - Now uses familyStore.inviteData instead of app.js data
    async createParentInvite() {
      try {
        // lock scroll for iOS safari during modal
        document.body.classList.add('modal-open');
        const familyStore = window.useFamilyStore?.();
        if (familyStore) {
          await familyStore.createParentInvite();
        }
        const uiStore = window.useUIStore?.();
        uiStore?.openModal('invite');
      } catch (e) {
        console.error('Failed to create invite', e);
        alert('Failed to create invite');
      } finally {
        // ensure lock only remains if modal actually opened
        const uiStore = window.useUIStore?.();
        if (!uiStore?.isModalOpen?.('invite')) {
          document.body.classList.remove('modal-open');
        }
      }
    },
    async acceptParentInvite(token) {
      try {
        // ensure we have a valid auth header at accept time; if not, route to signup
        if (!authService.getAuthHeader()) {
          const authStore = window.useAuthStore?.();
          if (authStore) {
            authStore.pendingInviteToken = token;
          }
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
    // NOTE: Now delegates to familyStore
    confirmDeletePerson(person) {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.openDeletePersonModal(person);
      }
    },
    
    async performDeletePerson() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore?.personToDelete) {
        const api = window.useApi();
        
        try {
          const name = familyStore.personToDelete.name;
          const userId = familyStore.personToDelete.userId;
          const memberId = familyStore.personToDelete.id;
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
          familyStore.members = familyStore.members.filter(p => p.id !== memberId);

          // Reload data to ensure both pages reflect removal
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
          this.showSuccessMessage(`❌ Failed to delete ${familyStore.personToDelete.name}: ${error.message}`);
        }

        familyStore.closeDeletePersonModal();
      }
    },
    
    async executeDeletePerson() {
      // This method is deprecated - use performDeletePerson() instead
      if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('executeDeletePerson is deprecated, redirecting to performDeletePerson');
      await this.performDeletePerson();
    },
    
    cancelDeletePerson() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.closeDeletePersonModal();
      }
    },
    
    showDeletePersonModalFor(person) {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.openDeletePersonModal(person);
      }
    },
    
    // NOTE: addChore moved to choresStore.createChore()
    // Components should use useChoresStore().createChore() instead
    
    cancelAddChore() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('addChore');
      // Reset form via choresStore
      const choresStore = window.useChoresStore?.();
      choresStore?.resetNewChoreForm();
    },
    
    // NOTE: addToQuicklist now delegates to choresStore.createQuicklistChore()
    async addToQuicklist() {
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        return;
      }
      
      const formData = choresStore.newQuicklistChore;
      if (!formData.name.trim() || formData.amount < 0) {
        return;
      }
      
      const quicklistData = {
        name: formData.name.trim(),
        amount: formData.amount,
        category: formData.category,
        categoryId: formData.categoryId || null,
        isDetailed: formData.isDetailed || false,
        defaultDetails: formData.defaultDetails || ''
      };
      
      // Close modal immediately for instant feedback
      this.cancelAddToQuicklist();
      
      const result = await choresStore.createQuicklistChore(quicklistData);
      
      if (!result.success) {
        // Reopen modal with original data on failure
        Object.assign(choresStore.newQuicklistChore, quicklistData);
        const uiStore = window.useUIStore?.();
        uiStore?.openModal('addToQuicklist');
        this.showSuccessMessage(`❌ Failed to add "${quicklistData.name}" to quicklist. Please try again.`);
      }
    },
    
    cancelAddToQuicklist() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('addToQuicklist');
      // Reset form via choresStore
      const choresStore = window.useChoresStore?.();
      choresStore?.resetNewQuicklistChoreForm();
    },

    // Multi-assignment modal methods for quicklist chores
    // _Requirements: 4.2, 4.3, 4.5_
    openMultiAssignModal(quicklistChore) {
      const choresStore = window.useChoresStore?.();
      const uiStore = window.useUIStore?.();
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🎯 Parent openMultiAssignModal called with:', quicklistChore?.name);
        console.log('📊 Current modal state before:', {
          showMultiAssignModal: uiStore?.isModalOpen?.('multiAssign'),
          selectedQuicklistChore: choresStore?.selectedQuicklistChore?.name || 'none'
        });
      }

      if (choresStore) {
        choresStore.selectQuicklistChore(quicklistChore);
        choresStore.clearMemberSelection();
      }
      uiStore?.openModal('multiAssign');

      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📊 Modal state after:', {
        showMultiAssignModal: uiStore?.isModalOpen?.('multiAssign'),
        selectedQuicklistChore: choresStore?.selectedQuicklistChore?.name || 'none',
        multiAssignSelectedMembers: choresStore?.multiAssignSelectedMembers || []
      });
    },

    cancelMultiAssignment() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('multiAssign');
      const choresStore = window.useChoresStore?.();
      if (choresStore) {
        choresStore.clearSelection();
      }
    },

    // Category management modal methods
    // _Requirements: 1.1, 4.2, 4.3, 4.5_
    openCategoryManagementModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('categoryManagement');
    },
    
    closeCategoryManagementModal() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('categoryManagement');
    },
    
    // Schedule modal methods
    // **Feature: weekly-chore-scheduling**
    // **Validates: Requirements 1.2, 1.3, 1.5, 4.2, 4.3, 4.5**
    // NOTE: Now delegates to choresStore
    openScheduleModal(quicklistChore) {
      const choresStore = window.useChoresStore?.();
      if (choresStore) {
        choresStore.openScheduleModal(quicklistChore);
      }
    },
    
    closeScheduleModal() {
      const choresStore = window.useChoresStore?.();
      if (choresStore) {
        choresStore.closeScheduleModal();
      }
    },
    
    // Default order modal methods
    // _Requirements: 4.2, 4.3, 4.5_
    // NOTE: Now delegates to familyStore
    openDefaultOrderModal(member) {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.openDefaultOrderModal(member);
      }
    },
    
    closeDefaultOrderModal() {
      const familyStore = window.useFamilyStore?.();
      if (familyStore) {
        familyStore.closeDefaultOrderModal();
      }
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

    // NOTE: confirmMultiAssignment moved to choresStore.confirmMultiAssignment()
    // Components should use useChoresStore().confirmMultiAssignment() directly
    // _Requirements: 5.5_

    // NOTE: assignQuicklistChoreToMember moved to choresStore.assignQuicklistChoreToMember()
    // Components should use useChoresStore().assignQuicklistChoreToMember() directly
    // _Requirements: 5.5_

    // NOTE: openChoreDetailsModal moved to choresStore.openChoreDetailsModal()
    // Components should use useChoresStore().openChoreDetailsModal() directly
    // _Requirements: 5.6_

    // NOTE: confirmChoreDetails moved to choresStore.confirmChoreDetails()
    // Components should use useChoresStore().confirmChoreDetails() directly
    // _Requirements: 5.6_

    // NOTE: cancelChoreDetails moved to choresStore.cancelChoreDetails()
    // Components should use useChoresStore().cancelChoreDetails() directly
    // _Requirements: 5.6_

    // NOTE: startNewDay moved to choresStore.startNewDay()
    // The new-day-modal now calls choresStore directly
    // _Requirements: 4.1, 4.2, 6.3_

    cancelNewDay() {
      const uiStore = window.useUIStore?.();
      uiStore?.closeModal('newDay');
    },

    // Open New Day modal with scroll position capture
    // _Requirements: 4.2, 4.3, 4.5_
    openNewDayModal() {
      // Use offlineStore directly instead of computed property
      const offlineStore = window.useOfflineStore?.();
      if (offlineStore && !offlineStore.isOnline) {
        return;
      }
      const uiStore = window.useUIStore?.();
      uiStore?.openModal('newDay');
    },

    // Page navigation - delegates to uiStore
    setCurrentPage(page) {
      const uiStore = window.useUIStore?.();
      if (uiStore) {
        uiStore.setCurrentPage(page);
      }
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
    
    // NOTE: removeFromQuicklist now delegates to choresStore.removeQuicklistChore()
    async removeFromQuicklist(quicklistId) {
      const choresStore = window.useChoresStore?.();
      if (!choresStore) {
        console.error('Chores store not available');
        return;
      }
      await choresStore.removeQuicklistChore(quicklistId);
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
      // Use authStore directly instead of computed property
      const celebrations = window.useCelebrations?.();
      const authStore = window.useAuthStore?.();
      if (celebrations) {
        celebrations.celebrate({ chore, accountSettings: authStore?.accountSettings });
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
        // Use authStore directly instead of computed property
        const authStore = window.useAuthStore?.();
        if (document.visibilityState === 'visible' && authStore?.isAuthenticated && authService.isAuthenticated()) {
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
        // Use authStore directly instead of computed property
        const authStore = window.useAuthStore?.();
        if (authStore?.isAuthenticated && authService.isAuthenticated()) {
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
          // Use authStore directly instead of computed property
          const authStore = window.useAuthStore?.();
          if (focusLeftWindow && authStore?.isAuthenticated && authService.isAuthenticated()) {
            if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📱 App going to background, refreshing tokens proactively...');
            // Proactively refresh tokens before app goes to background
            authService.refreshAccessToken().catch(error => {
              console.warn('Token refresh on blur failed:', error);
            });
          }
        }, 100);
      });
    },

    // NOTE: assignSelectedChore moved to choresStore.assignSelectedChore()
    // Components should use useChoresStore().assignSelectedChore() directly
    // _Requirements: 5.3_

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

    // _Requirements: 8.4_ - Now delegates to uiStore
    showSuccessMessage(message) {
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🎉 showSuccessMessage called with:', message);
      }
      // suppress generic auth-required notices when signup modal is already being shown for invite flow
      const uiStore = window.useUIStore?.();
      const authStore = window.useAuthStore?.();
      if (uiStore?.isModalOpen?.('signup') && typeof message === 'string' && /authentication required/i.test(message)) {
        return;
      }
      // Delegate to uiStore
      uiStore?.showSuccess(message, 3000);
    },

    // NOTE: Spending modal methods migrated to familyStore
    // Components should use useFamilyStore() directly
    // - openSpendingModal(), closeSpendingModal(), addDigit(), addDecimal(), clearSpendAmount()
    // confirmSpending() is now handled by the spending-modal component directly
    // _Requirements: 3.3, 3.4_
  },
  
  // NOTE: Watch handlers for store sync removed - all components now use stores directly
  // The body scroll lock is now handled by uiStore directly
  // _Requirements: 8.8_
  
  async mounted() {
    try {
      // Close mobile nav when clicking outside the mobile nav container
      document.addEventListener('click', (e) => {
        try {
          if (!e.target.closest('.mobile-nav')) this.mobileNavOpen = false;
        } catch { /* ignore DOM errors */ }
      });
      
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
        try {
          ThemeManager.initializeTheme();
        } catch (themeError) {
          console.warn('Theme initialization failed, forcing loading screen hide:', themeError);
          // Direct fallback: hide loading screen manually
          const loadingScreen = document.getElementById('app-loading-screen');
          if (loadingScreen) {
            loadingScreen.style.display = 'none';
            document.body.classList.remove('app-loading');
          }
        }

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
      // Ensure loading screen is hidden even on error
      try {
        ThemeManager.initializeTheme();
      } catch (themeError) {
        console.warn('Theme initialization failed, forcing loading screen hide:', themeError);
        // Direct fallback: hide loading screen manually
        const loadingScreen = document.getElementById('app-loading-screen');
        if (loadingScreen) {
          loadingScreen.style.display = 'none';
          document.body.classList.remove('app-loading');
        }
      }
    }
  }
  
  // NOTE: provide() function removed - all components now use stores directly
  // Components should use useChoresStore(), useFamilyStore(), useAuthStore(), useUIStore(), etc.
  // _Requirements: 7.6_
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

  // Mount the app and expose instance globally for bridge pattern
  // This allows auth.js and other modules to call loadAllData() after sign-in
  const mountedApp = app.mount('#app');
  window.vueApp = mountedApp;
  if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Vue app mounted and exposed as window.vueApp');
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
