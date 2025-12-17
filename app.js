// Heroicons are loaded via CDN in index.html

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
      // Authentication state
      isAuthenticated: false,
      currentUser: null,
      showLoginModal: false,
      showSignupModal: false,
      showConfirmModal: false,
      authForm: {
        mode: 'parent',
        email: '',
        username: '',
        password: '',
        name: '',
        confirmationCode: ''
      },
      authError: null,
      authLoading: false,
      
      showAddChoreModal: false,
      newChore: {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      },
      showAddToQuicklistModal: false,
      newQuicklistChore: {
        name: '',
        amount: 0,
        category: 'regular',
        categoryId: '',  // Category ID for grouping (empty = Uncategorized)
        isDetailed: false,
        defaultDetails: ''
      },
      // New modal for chore details
      showChoreDetailsModal: false,
      choreDetailsForm: {
        name: '',
        details: '',
        amount: 0,
        category: 'regular',
        assignedTo: '',
        isNewFromQuicklist: false,
      },
      // Multi-assignment modal for quicklist chores
      showMultiAssignModal: false,
      selectedQuicklistChore: null,
      multiAssignSelectedMembers: [],
      // Category management modal
      showCategoryManagementModal: false,
      // Assign category modal (for uncategorized quicklist chores)
      showAssignCategoryModal: false,
      assignCategoryChore: null,
      assignCategorySelectedId: '',
      // Person management
      people: [],
      // manual add person removed
      showAddPersonModal: false,
      newPerson: { name: '' },
      showDeletePersonModal: false,
      personToDelete: null,
      // Child creation & parent invites
      showCreateChildModal: false,
      childForm: { username: '', password: '', displayName: '' },
      showInviteModal: false,
      inviteData: { token: '', expiresAt: null },
      pendingInviteToken: null,
      // Spending requests (for parents)
      spendingRequests: [],
      // New Day functionality
      showNewDayModal: false,
      newDayLoading: false,
      // Spending modal
      showSpendingModal: false,
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
      chores: [],
      selectedChoreId: null, // Changed from selectedChore to selectedChoreId
      // selectedQuicklistChore defined above in multi-assignment modal section
      showConfetti: false,
      confettiPieces: [],
      showSuccessMessageFlag: false,
      completedChoreMessage: '',
      quicklistChores: [],
      // Mobile nav state
      mobileNavOpen: false,
      // Nav items (extensible)
      navItems: [
        { key: 'chores', label: 'Chores' },
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'family', label: 'Family' },
        { key: 'shopping', label: 'Shopping' },
        { key: 'recipes', label: 'Recipes' },
        { key: 'account', label: 'Account' }
      ],
      
      // Shopping page data now managed by Pinia store (stores/shopping.js)
      // These are kept for backward compatibility but delegate to the store
      // shoppingItems, shoppingQuickItems, stores - accessed via computed properties
      
      // Account page data (preloaded for instant page switching)
      accountSettings: null,
      accountId: null,
      
      loading: true,
      error: null,
      // realtime
      socket: null,
      socketConnected: false,
      socketRetryMs: 1000
    }
  },
  computed: {
    choresByPerson() {
      const grouped = {
        unassigned: []
      };
      
      // Add each person to the grouped object
      if (Array.isArray(this.people)) {
        this.people.forEach(person => {
          if (person && person.name) {
            grouped[person.name] = [];
          }
        });
      }
      
      // Group chores by assigned person
      if (Array.isArray(this.chores)) {
        this.chores.forEach(chore => {
          if (chore && chore.assignedTo) {
            if (grouped[chore.assignedTo]) {
              grouped[chore.assignedTo].push(chore);
            } else {
              // If assignedTo person doesn't exist, put it in unassigned
              grouped.unassigned.push(chore);
            }
          } else {
            // If chore doesn't have assignedTo, put it in unassigned
            grouped.unassigned.push(chore);
          }
        });
      }
      
      return grouped;
    },
    
    // Legacy computed properties for backward compatibility with API calls
    earnings() {
      const earningsObj = {};
      this.people.forEach(person => {
        earningsObj[person.name] = person.earnings;
      });
      return earningsObj;
    },
    
    electronicsStatus() {
      const statusObj = {};
      this.people.forEach(person => {
        statusObj[person.name] = person.electronicsStatus;
      });
      return statusObj;
    },
    
    // Get the selected chore object from the ID
    selectedChore() {
      if (this.selectedQuicklistChore) {
        return this.selectedQuicklistChore;
      }
      
      if (this.selectedChoreId) {
        if (!Array.isArray(this.chores)) {
          console.warn('Chores is not an array:', this.chores);
          return null;
        }
        
        return this.chores.find(chore => chore && chore.id === this.selectedChoreId) || null;
      }
      
      return null;
    },
    // whether any modal is currently open (used to lock/unlock body scroll on mobile)
    isAnyModalOpen() {
      return (
        this.showAddToQuicklistModal ||
        this.showAddChoreModal ||
        this.showAddPersonModal ||
        this.showDeletePersonModal ||
        this.showNewDayModal ||
        this.showSpendingModal ||
        this.showChoreDetailsModal ||
        this.showLoginModal ||
        this.showSignupModal ||
        this.showConfirmModal ||
        this.showInviteModal ||
        this.showCreateChildModal
      );
    },
    // Offline store for checking network status
    // _Requirements: 4.4_
    offlineStore() {
      if (typeof window !== 'undefined' && window.useOfflineStore) {
        return window.useOfflineStore();
      }
      // Return a default object if store is not available
      return { isOnline: true };
    }
  },
  methods: {
    initWebsocket() {
      try {
        if (this.socket) {
          try { this.socket.close(); } catch { /* ignore close errors */ }
          this.socket = null;
        }
        const token = authService.idToken || authService.accessToken;
        if (!token) return;
        const wsBase = (CONFIG.API.WS_BASE || CONFIG.API.BASE_URL).replace('https://', 'wss://');
        const stage = CONFIG.API.STAGE || 'dev';
        const url = wsBase.replace(/\/$/, '') + `/${stage}?token=${encodeURIComponent(token)}`;
        const s = new WebSocket(url);
        this.socket = s;
        s.onopen = () => { this.socketConnected = true; this.socketRetryMs = 1000; };
        s.onclose = () => { this.socketConnected = false; const d = Math.min(this.socketRetryMs, 30000); setTimeout(() => this.initWebsocket(), d); this.socketRetryMs *= 2; };
        s.onerror = () => { try { s.close(); } catch { /* ignore */ } };
        s.onmessage = (e) => {
          try { const msg = JSON.parse(e.data); this.handleRealtimeMessage(msg); } catch { /* ignore parse errors */ }
        };
      } catch (e) { console.warn('ws init failed', e); }
    },
    handleRealtimeMessage(msg) {
      if (!msg || !msg.type) return;
      switch (msg.type) {
        case 'chore.created': {
          const created = msg.data?.chore;
          if (!created) break;
          // if an optimistic temp chore exists that matches this server-created chore, replace it
          const tempIdx = this.chores.findIndex(c => c?.isOptimistic && c.name === created.name && c.assignedTo === created.assignedTo && c.amount === created.amount && c.category === created.category);
          if (tempIdx >= 0) {
            this.chores[tempIdx] = created;
            break;
          }
          // otherwise add only if we don't already have this id
          if (!this.chores.some(c => c.id === created.id)) this.chores.push(created);
          break;
        }
        case 'chore.updated': {
          const updated = msg.data?.chore;
          if (!updated) break;
          const i = this.chores.findIndex(c => c.id === updated.id);
          if (i >= 0) this.chores[i] = updated; else this.chores.push(updated);
          break;
        }
        case 'chore.deleted':
          if (msg.data?.id) this.chores = this.chores.filter(c => c.id !== msg.data.id);
          break;
      }
    },
    // API helper methods
    async apiCall(endpoint, options = {}) {
      try {
        const url = CONFIG.getApiUrl(endpoint);
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`🌐 Making API call to: ${url}`);
        
        // add authentication header if user is logged in
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json',
          ...(this.accountId && { 'X-Account-Id': this.accountId }),
          ...options.headers
        };
        
        if (authHeader) headers.Authorization = authHeader;
        
        const response = await fetch(url, {
          headers,
          ...options
        });
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`📡 Response status: ${response.status} for ${endpoint}`);
        
        // handle authentication errors
        if (response.status === 401) {
          console.warn('Authentication required or token expired');
          await this.handleAuthenticationRequired();
          throw new Error('Authentication required');
        }
        
        if (!response.ok) {
          let errorMessage = `API call failed: ${response.status} ${response.statusText}`;
          
          // Try to get more detailed error from response body
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage += ` - ${errorData.error}`;
            }
          } catch (e) {
            // Ignore parsing errors for error responses
          }
          
          throw new Error(`${errorMessage} for ${endpoint}`);
        }
        
        const data = await response.json();
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`✅ API call successful for ${endpoint}:`, data);
        return data;
      } catch (error) {
        console.error(`❌ API Error for ${endpoint}:`, error);
        
        // Add more specific error handling
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          throw new Error(`Network error: Unable to connect to the API. Please check your internet connection and API configuration.`);
        }
        
        throw error;
      }
    },

    // modal open/close helpers (standardized)
    // Each open method captures scroll position for flyout-panel to use
    openAddChoreModal() {
      window.__flyoutScrollY = window.scrollY;
      console.log('🎯 openAddChoreModal - captured scroll:', window.__flyoutScrollY);
      this.showAddChoreModal = true;
    },
    closeAddChoreModal() {
      this.showAddChoreModal = false;
    },
    openAddToQuicklistModal() {
      window.__flyoutScrollY = window.scrollY;
      console.log('🎯 openAddToQuicklistModal - captured scroll:', window.__flyoutScrollY);
      this.showAddToQuicklistModal = true;
    },
    closeAddToQuicklistModal() {
      this.showAddToQuicklistModal = false;
    },
    closeCreateChildModal() {
      this.showCreateChildModal = false;
    },
    closeInviteModal() {
      this.showInviteModal = false;
    },

    // Cache for /auth/me response to avoid duplicate API calls
    _authMeCache: null,
    
    async refreshCurrentUser() {
      try {
        const me = await authService.getCurrentUser();
        if (me) {
          this.currentUser = me;
        }
        // enrich with server-side account and role when missing
        if (!this.currentUser?.role || !this.currentUser?.accountId) {
          try {
            // Use cached response if available (prevents duplicate /auth/me calls)
            let res = this._authMeCache;
            if (!res) {
              res = await this.apiCall(CONFIG.API.ENDPOINTS.AUTH_ME);
              this._authMeCache = res; // Cache for subsequent calls
            } else if (CONFIG.ENV.IS_DEVELOPMENT) {
              console.log('👤 Using cached /auth/me response');
            }
            if (res && (res.accountId || res.role)) {
              this.currentUser = { ...this.currentUser, role: res.role || this.currentUser?.role, memberships: res.memberships };
              this.accountId = res.accountId || this.accountId;
            }
          } catch (e) {
            // ignore if /auth/me unavailable
          }
        } else {
          this.accountId = this.currentUser.accountId || this.accountId;
        }
      } catch (e) {
        console.warn('Failed to refresh current user', e);
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
        
        // Load remaining data in parallel
        await Promise.all([
          // Core chore page data
          this.loadChores(),
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadQuicklistChores(),
          this.loadFamilyMembers(),
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
    
    async loadChores() {
      try {
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES);
        this.chores = response.chores || [];
      } catch (error) {
        console.error('Failed to load chores:', error);
        this.chores = [];
      }
    },
    
    async loadFamilyMembers(preserveOptimisticUpdates = false) {
      try {
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          console.log('👥 Loading family members, preserveOptimisticUpdates:', preserveOptimisticUpdates);
          console.log('[debug] BEFORE loadFamilyMembers() people:', (this.people || []).map(p => ({ name: p.name, userId: p.userId, role: p.role, enabledForChores: p.enabledForChores })));
        }
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          console.log('👥 Family members API response count:', (response?.familyMembers || []).length);
          console.log('[debug] server familyMembers snapshot:', (response.familyMembers || []).map(m => ({ name: m.name, userId: m.userId, role: m.role, completedChores: m.completedChores })));
        }
        
        if (response.familyMembers && response.familyMembers.length > 0) {
          // optionally filter for chores view based on account settings preferences
          const membersChoresEnabled = this.accountSettings?.preferences?.membersChoresEnabled || {};
          const resolveEnabled = (member) => {
            // Prefer stable userId when available; fallback to name
            if (member && member.userId && Object.prototype.hasOwnProperty.call(membersChoresEnabled, member.userId)) {
              const val = membersChoresEnabled[member.userId] !== false;
              if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] resolve', { member: member.name, userId: member.userId, via: 'userId', value: val });
              return val;
            }
            if (member && member.name && Object.prototype.hasOwnProperty.call(membersChoresEnabled, member.name)) {
              const val = membersChoresEnabled[member.name] !== false;
              if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] resolve', { member: member.name, via: 'name', value: val });
              return val;
            }
            if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] resolve', { member: member?.name, via: 'default', value: true });
            return true;
          };
          if (preserveOptimisticUpdates) {
            if (CONFIG.ENV.IS_DEVELOPMENT) console.log('👥 Merging with optimistic updates...');
            // Merge server data with existing optimistic updates
            response.familyMembers.forEach(serverMember => {
              const existingPerson = this.people.find(p => p.name === serverMember.name);
              if (existingPerson) {
                if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`👥 Merging ${serverMember.name}: existing completedChores=${existingPerson.completedChores}, server completedChores=${serverMember.completedChores}`);
                // Preserve optimistic completedChores count, but update other fields
                existingPerson.earnings = serverMember.earnings || 0;
                // Keep the existing completedChores if it's higher (optimistic update)
                existingPerson.completedChores = Math.max(existingPerson.completedChores || 0, serverMember.completedChores || 0);
                if (serverMember.id) existingPerson.id = serverMember.id;
                // Always refresh board visibility from account preferences
                existingPerson.enabledForChores = resolveEnabled(serverMember);
                if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`👥 Result for ${serverMember.name}: completedChores=${existingPerson.completedChores}`);
              } else {
                if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`👥 Adding new person from server: ${serverMember.name}`);
                // New person from server
                this.people.push({
                  id: serverMember.id || serverMember.name.toLowerCase(),
                  name: serverMember.name,
                  displayName: serverMember.displayName || serverMember.name,
                  userId: serverMember.userId || null,
                  role: serverMember.role || null,
                  earnings: serverMember.earnings || 0,
                  completedChores: serverMember.completedChores || 0,
                  electronicsStatus: { status: 'allowed', message: 'Electronics allowed' },
                  enabledForChores: resolveEnabled(serverMember)
                });
              }
            });
          } else {
            if (CONFIG.ENV.IS_DEVELOPMENT) {
              console.log('👥 Full refresh - replacing all family member data');
              console.log('👥 Server data:', response.familyMembers.map(m => `${m.displayName || m.name}: completedChores=${m.completedChores}`));
            }
            // Normal full refresh - replace all data
            this.people = response.familyMembers.map(member => ({
              id: member.id || (member.displayName || member.name || '').toLowerCase(),
              name: member.displayName || member.name,
              displayName: member.displayName || member.name,
              userId: member.userId || null,
              role: member.role || null,
              earnings: member.earnings || 0,
              completedChores: member.completedChores || 0,
              electronicsStatus: { status: 'allowed', message: 'Electronics allowed' },
              enabledForChores: resolveEnabled(member)
            }));
            if (CONFIG.ENV.IS_DEVELOPMENT) console.log('👥 Final people data:', this.people.map(p => `${p.name}: completedChores=${p.completedChores}`));
          }
        } else {
          // backend returned no family members; show empty state without synthesizing placeholders
          this.people = [];
        }
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('[debug] AFTER loadFamilyMembers() people:', (this.people || []).map(p => ({ name: p.name, userId: p.userId, role: p.role, enabledForChores: p.enabledForChores, completedChores: p.completedChores })));
      } catch (error) {
        console.error('Failed to load family members:', error);
        // Don't clear people array on error, keep existing
      }
    },
    
    async loadEarnings() {
      try {
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.EARNINGS);
        
        // Update earnings for each person
        this.people.forEach(person => {
          person.earnings = response.earnings[person.name] || 0;
        });
      } catch (error) {
        console.error('Failed to load earnings:', error);
      }
    },
    
    async loadElectronicsStatus() {
      try {
        // Load electronics status for each person individually
        for (const person of this.people) {
          try {
            const response = await this.apiCall(`${CONFIG.API.ENDPOINTS.ELECTRONICS_STATUS}/${person.name}`);
            person.electronicsStatus = response;
          } catch (error) {
            console.error(`Failed to load electronics status for ${person.name}:`, error);
            person.electronicsStatus = { status: 'allowed', message: 'Electronics allowed' };
          }
        }
      } catch (error) {
        console.error('Failed to load electronics status:', error);
      }
    },

    // Optimistically update electronics status for a person based on current chores
    updateElectronicsStatusOptimistically(personName) {
      const person = this.people.find(p => p.name === personName);
      if (!person) return;

      // Count incomplete electronics chores for this person
      const incompleteElectronicsChores = this.chores.filter(chore => 
        chore.assignedTo === personName && 
        chore.category === 'game' && 
        !chore.completed
      );

      const allowed = incompleteElectronicsChores.length === 0;
      
      person.electronicsStatus = {
        status: allowed ? 'allowed' : 'blocked',
        message: allowed ? 'Electronics allowed' : `${incompleteElectronicsChores.length} electronics task${incompleteElectronicsChores.length > 1 ? 's' : ''} remaining`
      };
    },
    
    async loadQuicklistChores() {
      try {
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST);
        this.quicklistChores = response.quicklistChores || [];
      } catch (error) {
        console.error('Failed to load quicklist chores:', error);
        this.quicklistChores = [];
      }
    },

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
      try {
        // PWA optimization: localStorage is source of truth for current device
        // Apply localStorage theme immediately (no flash, works offline)
        const localTheme = localStorage.getItem('selectedTheme') || 'default';
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 Applying localStorage theme:', localTheme);
        ThemeManager.applyTheme(localTheme);
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 Loading account settings (for caching, not theme override)...');
        const headerAccountId = this.accountId || this.accountSettings?.accountId || null;
        let response;
        try {
          response = await window.SettingsClient.get(headerAccountId, { ifNoneMatch: this.accountSettings?.updatedAt });
        } catch (e) {
          console.warn('SettingsClient.get failed, falling back to apiCall', e?.message || e);
          response = await this.apiCall(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
        }
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 Account settings response:', response);
        
        // Cache the account settings to avoid duplicate API calls in loadAllData()
        if (response) {
          this.accountSettings = response;
          this.accountId = response.accountId || this.accountId;
        }
        
        // NOTE: We do NOT overwrite localStorage theme with backend theme
        // localStorage is the source of truth for the current device
        // Backend theme is only used for initial setup on new devices (when localStorage is empty)
        const backendTheme = response?.theme || response?.userTheme;
        if (backendTheme && backendTheme !== localTheme) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 Backend theme differs from local:', backendTheme, 'vs', localTheme, '- keeping local');
        }
      } catch (error) {
        console.error('Failed to load user theme:', error);
        // Fallback: ensure theme is applied even on error
        const fallbackTheme = localStorage.getItem('selectedTheme') || 'default';
        ThemeManager.applyTheme(fallbackTheme);
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
      try {
        // Skip if account settings are already loaded (e.g., by loadUserTheme())
        // This prevents duplicate API calls during initialization
        if (this.accountSettings && this.accountId) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('⚙️ Account settings already loaded, skipping API call');
          return;
        }
        
        const headerAccountId = this.accountId || this.accountSettings?.accountId || null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('⚙️ Loading account settings...', { headerAccountId });
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
        this.accountSettings = response;
        this.accountId = response?.accountId || null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('⚙️ Account settings loaded meta', {
          apiAccountId: this.accountSettings?.accountId,
          updatedAt: this.accountSettings?.updatedAt,
          prefKeys: Object.keys(this.accountSettings?.preferences || {}),
          membersChoresEnabled: this.accountSettings?.preferences?.membersChoresEnabled || {}
        });
        // Theme sync is now handled exclusively in loadUserTheme() to avoid duplicate applies
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Account settings loaded:', this.accountSettings);
      } catch (error) {
        console.error('Failed to load account settings:', error);
        this.accountSettings = null;
        this.accountId = null;
      }
    },
    

    
    // Chore selection methods
    handleChoreClick(chore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Chore clicked:', chore.name);
      
      // If the same chore is clicked again, deselect it
      if (this.selectedChoreId === chore.id) {
        this.selectedChoreId = null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Deselected chore');
      } else {
        this.selectedChoreId = chore.id;
        this.selectedQuicklistChore = null; // Clear quicklist selection
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Selected chore:', chore.name);
      }
    },
    
    handleQuicklistChoreClick(chore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Quicklist chore clicked:', chore.name);
      
      // If the same quicklist chore is clicked again, deselect it
      if (this.selectedQuicklistChore && this.selectedQuicklistChore.id === chore.id) {
        this.selectedQuicklistChore = null;
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Deselected quicklist chore');
      } else {
        this.selectedQuicklistChore = { ...chore, isNewFromQuicklist: true };
        this.selectedChoreId = null; // Clear regular chore selection
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('Selected quicklist chore:', chore.name);
      }
    },
    
    // Person management methods
    async addPerson() {
      alert('Manual people are no longer supported. Use "Add Child" or "Invite Parent".');
    },
    
    cancelAddPerson() {
      this.showAddPersonModal = false;
      this.newPerson = { name: '', displayName: '' };
    },

    openAddPersonModal() {
      alert('Manual people are no longer supported. Use "Add Child" or "Invite Parent".');
    },
    async updateFamilyMemberDisplayName(person) {
      try {
        // require user-linked member to update profile; disallow for legacy/manual rows
        if (!person?.userId) return;
        await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS, {
          method: 'POST',
          body: JSON.stringify({ userId: person.userId, displayName: person.displayName || person.name, name: person.displayName || person.name })
        });
        await this.loadFamilyMembers(false);
      } catch (e) {
        console.warn('failed to update display name', e);
      }
    },
    async updateMemberChoresEnabled(person) {
      try {
        // Ensure we know the account first
        if (!this.accountId && !this.accountSettings?.accountId) {
          try { await this.loadAccountSettings(); } catch { /* ignore - will use defaults */ }
        }

        // Optimistically update local state
        const prefs = this.accountSettings?.preferences || {};
        const current = { ...(prefs.membersChoresEnabled || {}) };
        const enabled = !!person.enabledForChores;
        // Write both userId and name keys for stability across backfills
        if (person.userId) current[person.userId] = enabled;
        if (person.name) current[person.name] = enabled;
        this.accountSettings = {
          ...(this.accountSettings || {}),
          preferences: { ...prefs, membersChoresEnabled: current }
        };

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
        // Sync local cache with server echo
        if (res && res.preferences) {
          this.accountSettings.preferences = res.preferences;
          this.accountSettings.updatedAt = res.updatedAt || this.accountSettings.updatedAt;
          if (CONFIG.ENV.IS_DEVELOPMENT) console.debug('[Visibility] persist done', { updatedAt: this.accountSettings.updatedAt, after: res.preferences?.membersChoresEnabled || {} });
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
    async removeMember(person) {
      try {
        if (!confirm(`Remove ${person.displayName || person.name} from this account?`)) return;
        // prefer membership removal by userId if available, else remove by family member name only
        if (person.userId) {
          await this.apiCall(`/family-members/memberships/${encodeURIComponent(person.userId)}`, { method: 'DELETE' });
        } else {
          await this.apiCall(`/family-members/by-name/${encodeURIComponent(person.name)}`, { method: 'DELETE' });
        }
        // refresh
        await this.loadFamilyMembers(false);
      } catch (e) {
        alert(e?.message || 'Failed to remove member');
      }
    },
    
    // Child management
    openCreateChildModal() {
      this.childForm = { username: '', password: '', displayName: '' };
      this.showCreateChildModal = true;
    },
    async createChild() {
      if (!this.childForm.username || !this.childForm.password) return;
      try {
        await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_CHILDREN, {
          method: 'POST',
          body: JSON.stringify({ username: this.childForm.username, password: this.childForm.password, displayName: this.childForm.displayName })
        });
        // refresh family members to reflect the new child immediately
        await this.loadFamilyMembers(false);
        this.showCreateChildModal = false;
        this.childForm = { username: '', password: '', displayName: '' };
        alert('Child account created. Share the username and password with your child.');
      } catch (e) {
        console.error('Failed to create child', e);
        alert('Failed to create child');
      }
    },
    
    // Parent invites
    async createParentInvite() {
      try {
        // lock scroll for iOS safari during modal
        document.body.classList.add('modal-open');
        const res = await this.apiCall(CONFIG.API.ENDPOINTS.PARENT_INVITE, { method: 'POST', body: JSON.stringify({}) });
        this.inviteData = res;
        this.showInviteModal = true;
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
        await this.apiCall(CONFIG.API.ENDPOINTS.PARENT_ACCEPT_INVITE, { method: 'POST', body: JSON.stringify({ token }) });
        await this.refreshCurrentUser();
        await this.loadAllData();
        alert('Invite accepted. You now have access to this account.');
      } catch (e) {
        console.error('Failed to accept invite', e);
        const message = e?.message || 'Failed to accept invite';
        alert(message);
      }
    },
    
    // Spending requests (parent approval)
    async loadSpendingRequests() {
      try {
        const res = await this.apiCall(CONFIG.API.ENDPOINTS.SPEND_REQUESTS);
        this.spendingRequests = res?.requests || [];
      } catch (e) {
        console.warn('Failed to load spending requests', e);
      }
    },
    async approveSpendingRequest(requestId) {
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.SPEND_REQUESTS}/${encodeURIComponent(requestId)}/approve`, { method: 'POST' });
        await this.loadEarnings();
        await this.loadSpendingRequests();
      } catch (e) {
        console.error('Failed to approve request', e);
      }
    },
    
    confirmDeletePerson(person) {
      this.personToDelete = person;
      this.showDeletePersonModal = true;
    },
    
    async performDeletePerson() {
      if (this.personToDelete) {
        try {
          const name = this.personToDelete.name;
          const userId = this.personToDelete.userId;
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`🗑️ Removing person via modal: name=${name}, userId=${userId || 'none'}`);

          // if we know the Cognito userId, remove the account membership first to prevent auto re-creation
          if (userId) {
            await this.apiCall(`/family-members/memberships/${encodeURIComponent(userId)}`, { method: 'DELETE' });
          } else {
            // fallback: delete the family member card by visible name
            await this.apiCall(`/family-members/by-name/${encodeURIComponent(name)}`, { method: 'DELETE' });
          }

          if (CONFIG.ENV.IS_DEVELOPMENT) console.log(`✅ Removal complete for: ${name}`);

          // Remove person from local array
          this.people = this.people.filter(p => p.id !== this.personToDelete.id);

          // Reload data to ensure both pages reflect removal
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
          this.showSuccessMessage(`❌ Failed to delete ${this.personToDelete.name}: ${error.message}`);
        }

        this.personToDelete = null;
        this.showDeletePersonModal = false;
      }
    },
    
    async executeDeletePerson() {
      // This method is deprecated - use performDeletePerson() instead
      if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('executeDeletePerson is deprecated, redirecting to performDeletePerson');
      await this.performDeletePerson();
    },
    
    cancelDeletePerson() {
      this.personToDelete = null;
      this.showDeletePersonModal = false;
    },
    
    showDeletePersonModalFor(person) {
      this.personToDelete = person;
      this.showDeletePersonModal = true;
    },
    
    // Chore management methods
    async addChore() {
      if (this.newChore.name.trim() && this.newChore.amount >= 0) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Adding new chore:', this.newChore.name);
        
        // Check if this is a detailed chore
        if (this.newChore.isDetailed) {
          // Open details modal instead of creating immediately
          this.openChoreDetailsModal({
            name: this.newChore.name.trim(),
            amount: this.newChore.amount,
            category: this.newChore.category
          }, 'unassigned', false);
          // Close the original add chore modal
          this.cancelAddChore();
          return;
        }
        
        // Store original state for potential rollback
        const originalChores = [...this.chores];
        const originalQuicklistChores = [...this.quicklistChores];
        const choreData = {
          name: this.newChore.name.trim(),
          amount: this.newChore.amount,
          category: this.newChore.category,
          assignedTo: 'unassigned',
          completed: false,
          isDetailed: false,
          details: ''
        };
        
        try {
          // OPTIMISTIC UPDATE: Add chore to UI immediately
          const tempChore = {
            id: `temp-chore-${Date.now()}`,
            ...choreData,
            isOptimistic: true
          };
          this.chores.push(tempChore);
          
          // Also add to quicklist optimistically if requested
          let tempQuicklistChore = null;
          if (this.newChore.addToQuicklist) {
            tempQuicklistChore = {
              id: `temp-quicklist-${Date.now()}`,
              name: choreData.name,
              amount: choreData.amount,
              category: choreData.category,
              isOptimistic: true
            };
            this.quicklistChores.push(tempQuicklistChore);
          }
          
          // Close modal immediately for instant feedback
          this.cancelAddChore();
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - chore added');
          
          // Make API call in background
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          // Update the temporary chore with real data from server
          const choreIndex = this.chores.findIndex(c => c.id === tempChore.id);
          if (choreIndex !== -1) {
            this.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          // Also add to quicklist if requested
          if (this.newChore.addToQuicklist && tempQuicklistChore) {
            const quicklistData = {
              name: choreData.name,
              amount: choreData.amount,
              category: choreData.category
            };
            
            const quicklistResponse = await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST, {
              method: 'POST',
              body: JSON.stringify(quicklistData)
            });
            
            // Update the temporary quicklist chore with real data
            const quicklistIndex = this.quicklistChores.findIndex(c => c.id === tempQuicklistChore.id);
            if (quicklistIndex !== -1) {
              this.quicklistChores[quicklistIndex] = {
                ...quicklistResponse.quicklistChore,
                isOptimistic: false
              };
            }
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed chore creation');
          
          // Refresh electronics status in background if this was an electronics chore
          if (choreData.category === 'game') {
            this.loadElectronicsStatus().catch(error => {
              console.warn('Failed to refresh electronics status:', error);
            });
          }
          
        } catch (error) {
          console.error('❌ Chore creation failed, rolling back optimistic update:', error);
          
          // ROLLBACK: Restore original state
          this.chores = originalChores;
          this.quicklistChores = originalQuicklistChores;
          
          // Reopen modal with original data
          this.showAddChoreModal = true;
          
          // Show error message
          this.showSuccessMessage(`❌ Failed to add "${choreData.name}". Please try again.`);
        }
      }
    },
    
    cancelAddChore() {
      this.showAddChoreModal = false;
      this.newChore = { name: '', amount: 0, category: 'regular', addToQuicklist: false, isDetailed: false };
    },
    
    async addToQuicklist() {
      if (this.newQuicklistChore.name.trim() && this.newQuicklistChore.amount >= 0) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically adding to quicklist:', this.newQuicklistChore.name);
        
        // Store original state for potential rollback
        const originalQuicklistChores = [...this.quicklistChores];
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
          this.quicklistChores.push(tempQuicklistChore);
          
          // Close modal immediately for instant feedback
          this.cancelAddToQuicklist();
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - quicklist item added');
          
          // Make API call in background
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST, {
            method: 'POST',
            body: JSON.stringify(quicklistData)
          });
          
          // Update the temporary quicklist chore with real data from server
          const quicklistIndex = this.quicklistChores.findIndex(c => c.id === tempQuicklistChore.id);
          if (quicklistIndex !== -1) {
            this.quicklistChores[quicklistIndex] = {
              ...response.quicklistChore,
              isOptimistic: false
            };
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed quicklist creation');
          
        } catch (error) {
          console.error('❌ Quicklist creation failed, rolling back optimistic update:', error);
          
          // ROLLBACK: Restore original state
          this.quicklistChores = originalQuicklistChores;
          
          // Reopen modal with original data
          this.showAddToQuicklistModal = true;
          
          // Show error message
          this.showSuccessMessage(`❌ Failed to add "${quicklistData.name}" to quicklist. Please try again.`);
        }
      }
    },
    
    cancelAddToQuicklist() {
      this.showAddToQuicklistModal = false;
      this.newQuicklistChore = { name: '', amount: 0, category: 'regular', categoryId: '', isDetailed: false, defaultDetails: '' };
    },

    // Multi-assignment modal methods for quicklist chores
    openMultiAssignModal(quicklistChore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) {
        console.log('🎯 Parent showMultiAssignModal called with:', quicklistChore?.name);
        console.log('📊 Current modal state before:', {
          showMultiAssignModal: this.showMultiAssignModal,
          selectedQuicklistChore: this.selectedQuicklistChore?.name || 'none'
        });
      }

      this.selectedQuicklistChore = quicklistChore;
      this.showMultiAssignModal = true;
      // Reset selected members when opening modal
      this.multiAssignSelectedMembers = [];

      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📊 Modal state after:', {
        showMultiAssignModal: this.showMultiAssignModal,
        selectedQuicklistChore: this.selectedQuicklistChore?.name || 'none',
        multiAssignSelectedMembers: this.multiAssignSelectedMembers
      });
    },

    cancelMultiAssignment() {
      this.showMultiAssignModal = false;
      this.selectedQuicklistChore = null;
      this.multiAssignSelectedMembers = [];
    },

    // Category management modal methods
    // _Requirements: 1.1_
    openCategoryManagementModal() {
      this.showCategoryManagementModal = true;
    },
    
    closeCategoryManagementModal() {
      this.showCategoryManagementModal = false;
    },
    
    // Update quicklist chore category (inline dropdown)
    async updateQuicklistCategory(chore, categoryId, categoryName) {
      if (!chore) return;
      
      try {
        // Update the quicklist chore with the new category
        await this.apiCall(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${chore.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            categoryId: categoryId || null,
            categoryName: categoryName
          })
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
      if (!this.selectedQuicklistChore || this.multiAssignSelectedMembers.length === 0) {
        return;
      }

      // Set loading state on the modal component if available
      if (this.$refs.appModalsComponent) {
        this.$refs.appModalsComponent.multiAssignLoading = true;
      }

      const selectedMembers = this.multiAssignSelectedMembers;
      const quicklistChore = this.selectedQuicklistChore;
      const results = [];

      try {
        // Create all assignments in parallel for better performance
        const assignmentPromises = selectedMembers.map(async (memberId) => {
          const member = this.people.find(p => p.id === memberId);
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
            this.showErrorMessage(`❌ Failed to assign "${quicklistChore.name}" to any family members`);
          } else {
            this.showErrorMessage(`⚠️ Assigned to ${successful.length} members, but ${failed.length} assignment${failed.length !== 1 ? 's' : ''} failed`);
          }
        }

        // Close modal and reset state
        this.cancelMultiAssignment();

      } catch (error) {
        console.error('Unexpected error in confirmMultiAssignment:', error);
        this.showErrorMessage('❌ An unexpected error occurred while assigning chores');
      } finally {
        // Reset loading state on the modal component if available
        if (this.$refs.appModalsComponent) {
          this.$refs.appModalsComponent.multiAssignLoading = false;
        }
      }
    },

    async assignQuicklistChoreToMember(quicklistChore, memberName) {
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

      // Add optimistic chore to UI immediately
      this.chores.push(newChore);
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - quicklist chore added for', memberName);

      // Update electronics status optimistically if needed
      if (newChore.category === 'game') {
        this.updateElectronicsStatusOptimistically(memberName);
      }

      try {
        // Make API call to create the chore
        const choreData = {
          name: newChore.name,
          amount: newChore.amount,
          category: newChore.category,
          assignedTo: memberName,
          completed: false
        };

        const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
          method: 'POST',
          body: JSON.stringify(choreData)
        });

        // Update the optimistic chore with real data from server
        const choreIndex = this.chores.findIndex(c => c.id === tempId);
        if (choreIndex !== -1) {
          this.chores[choreIndex] = {
            ...response.chore,
            isOptimistic: false
          };
        }
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed quicklist chore creation for', memberName);
      } catch (error) {
        // Rollback optimistic update on error
        const choreIndex = this.chores.findIndex(c => c.id === tempId);
        if (choreIndex !== -1) {
          this.chores.splice(choreIndex, 1);
        }
        console.error('Failed to create quicklist chore:', error);
        throw error;
      }
    },

    // Chore details modal methods
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
      this.showChoreDetailsModal = true;
    },

    async confirmChoreDetails() {
      if (!this.choreDetailsForm.details.trim()) {
        // Allow empty details, but at least ensure it's not just whitespace
        this.choreDetailsForm.details = '';
      }

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
          
          // Create the chore with details
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          // Add to local chores array
          this.chores.push(response.chore);
          
          // Clear selections
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          
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
          
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          // Add to local chores array
          this.chores.push(response.chore);
          
          // Also add to quicklist if requested
          if (this.newChore.addToQuicklist) {
            const quicklistData = {
              name: choreData.name,
              amount: choreData.amount,
              category: choreData.category,
              isDetailed: true
            };
            
            const quicklistResponse = await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST, {
              method: 'POST',
              body: JSON.stringify(quicklistData)
            });
            
            this.quicklistChores.push(quicklistResponse.quicklistChore);
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
      this.showChoreDetailsModal = false;
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
      try {
        this.newDayLoading = true;
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          console.log('🌅 Starting new day...');
          console.log('📊 Current state before new day:');
          console.log('  - Chores count:', this.chores.length);
          console.log('  - Chores:', this.chores.map(c => `${c.name} (${c.assignedTo})`));
          console.log('  - People completed chores:', this.people.map(p => `${p.name}: ${p.completedChores}`));
        }
        
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES_NEW_DAY, {
          method: 'POST',
          body: JSON.stringify({
            dailyChores: [] // Could be extended later to include predefined daily chores
          })
        });
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ New day API response:', response);
        
        // Reload all data to reflect changes
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔄 Reloading all data after new day...');
        await this.loadAllData();
        
        if (CONFIG.ENV.IS_DEVELOPMENT) {
          console.log('📊 State after reload:');
          console.log('  - Chores count:', this.chores.length);
          console.log('  - Chores:', this.chores.map(c => `${c.name} (${c.assignedTo})`));
          console.log('  - People completed chores:', this.people.map(p => `${p.name}: ${p.completedChores}`));
        }
        
        // Parse summary from enhanced response format
        const summary = response?.summary || {};
        const {
          choresRemoved = 0,
          completedChoresCleared = 0,
          dailyChoresCleared = 0,
          dailyChoresCreated = 0,
          duplicatesSkipped = 0,
          membersProcessed = 0
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
        
        this.showNewDayModal = false;
      } catch (error) {
        console.error('❌ Failed to start new day:', error);
        this.showSuccessMessage(`❌ Failed to start new day: ${error.message}`);
      } finally {
        this.newDayLoading = false;
      }
    },

    cancelNewDay() {
      this.showNewDayModal = false;
    },

    // Page navigation
    setCurrentPage(page) {
      this.currentPage = page;
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📄 Switched to page:', page);
    },


    // Authentication and user management
    async handleAuthenticationRequired() {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔒 Authentication required - clearing auth state');
      this.isAuthenticated = false;
      this.currentUser = null;
      
      // Clear all data since user is no longer authenticated
      this.chores = [];
      this.people = [];
      this.quicklistChores = [];
      
      // Clear any ongoing operations
      this.selectedChoreId = null;
      this.selectedQuicklistChore = null;
      
      // if an invite token is present, guide to signup instead of login
      try {
        const url = new URL(window.location.href);
        const inviteToken = this.pendingInviteToken || url.searchParams.get('invite');
        if (inviteToken) {
          this.pendingInviteToken = inviteToken;
          this.showSignupForm();
          return;
        }
      } catch (e) {
        // ignore url parsing errors
      }
      // default to login modal
      this.showLoginModal = true;
    },

    async handleLogin() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const username = this.authForm.mode === 'parent' ? this.authForm.email : this.authForm.username;
        const result = await authService.signIn(username, this.authForm.password);
        
        if (result.success) {
          this.isAuthenticated = true;
          this.currentUser = result.user;
          this.closeAuthModals();
          this.clearAuthForm();
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Login successful, loading user data...');
          
          // Refresh current user (to include role & accountId)
          await this.refreshCurrentUser();
          // Load user theme first to prevent flash of wrong theme
          await this.loadUserTheme();
          
          // Load all data for the newly authenticated user
          await this.loadAllData();

          // if invite token present, prompt to accept now that user is authenticated
          try {
            const url = new URL(window.location.href);
            const inviteToken = this.pendingInviteToken || url.searchParams.get('invite');
            if (inviteToken) {
              const accept = confirm('You have been invited to join a family account. Accept invitation?');
          if (accept) {
            // ensure valid auth before attempting accept to avoid immediate 401 popup
            if (!authService.getAuthHeader()) {
              this.pendingInviteToken = inviteToken;
              this.showSignupForm();
            } else {
              await this.acceptParentInvite(inviteToken);
              this.pendingInviteToken = null;
            }
            url.searchParams.delete('invite');
            window.history.replaceState({}, document.title, url.toString());
          }
            }
          } catch (e) {
            console.warn('failed to process invite token post-login', e);
          }
        } else {
          this.authError = 'Login failed. Please check your credentials.';
        }
      } catch (error) {
        console.error('Login error:', error);
        this.authError = error.message || 'Login failed. Please try again.';
      } finally {
        this.authLoading = false;
      }
    },

    async handleSignup() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const result = await authService.signUp(
          this.authForm.email, 
          this.authForm.password, 
          this.authForm.name
        );
        
        if (result.success) {
          // Close signup modal and show confirmation modal
          this.showSignupModal = false;
          this.showConfirmModal = true;
          this.authError = null;
          this.authForm.username = result.username;
          // preserve pending invite token across confirmation
          try {
            const url = new URL(window.location.href);
            const inviteToken = url.searchParams.get('invite');
            if (inviteToken) this.pendingInviteToken = inviteToken;
          } catch { /* ignore URL parse errors */ }
        } else {
          this.authError = 'Signup failed. Please try again.';
        }
      } catch (error) {
        console.error('Signup error:', error);
        this.authError = error.message || 'Signup failed. Please try again.';
      } finally {
        this.authLoading = false;
      }
    },

    async handleConfirmSignup() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const result = await authService.confirmSignUp(
          this.authForm.username || this.authForm.email, 
          this.authForm.confirmationCode
        );
        
        if (result.success) {
          // Account confirmed, now sign them in automatically
          const signInResult = await authService.signIn(this.authForm.email, this.authForm.password);
          
          if (signInResult.success) {
            this.isAuthenticated = true;
            this.currentUser = signInResult.user;
            this.closeAuthModals();
            this.clearAuthForm();
            
            if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Account confirmed and logged in, loading user data...');
            
            // Refresh current user (to include role & accountId)
            await this.refreshCurrentUser();
            // Load user theme first to prevent flash of wrong theme
            await this.loadUserTheme();
            
            // Load all data for the newly authenticated user
            await this.loadAllData();

            // if invite token present, prompt to accept now that user is authenticated
            try {
              const url = new URL(window.location.href);
              const inviteToken = this.pendingInviteToken || url.searchParams.get('invite');
              if (inviteToken) {
                const accept = confirm('You have been invited to join a family account. Accept invitation?');
                if (accept) {
                  await this.acceptParentInvite(inviteToken);
                  url.searchParams.delete('invite');
                  window.history.replaceState({}, document.title, url.toString());
                  this.pendingInviteToken = null;
                }
              }
            } catch (e) {
              console.warn('failed to process invite token post-signup', e);
            }
          } else {
            this.authError = 'Account confirmed but auto-login failed. Please log in manually.';
            this.showConfirmModal = false;
            this.showLoginModal = true;
          }
        } else {
          this.authError = 'Confirmation failed. Please check the code and try again.';
        }
      } catch (error) {
        console.error('Confirmation error:', error);
        this.authError = error.message || 'Confirmation failed. Please try again.';
      } finally {
        this.authLoading = false;
      }
    },

    async handleLogout() {
      try {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚪 Logging out user...');
        
        await authService.signOut();
        
        // Clear authentication state
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Clear cached API responses to prevent stale data on re-login
        this._authMeCache = null;
        this.accountSettings = null;
        this.accountId = null;
        
        // Clear all data since user is no longer authenticated
        this.chores = [];
        this.people = [];
        this.quicklistChores = [];
        
        // Clear any ongoing operations
        this.selectedChoreId = null;
        this.selectedQuicklistChore = null;
        
        // Reset to default theme on logout
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🎨 Resetting to default theme on logout');
        ThemeManager.applyTheme('default');
        localStorage.setItem('selectedTheme', 'default');
        
        // Reset to chores page
        this.currentPage = 'chores';
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Logout successful');
      } catch (error) {
        console.error('Logout error:', error);
        // Still clear local state even if server logout fails
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Still reset theme on error
        ThemeManager.applyTheme('default');
        localStorage.setItem('selectedTheme', 'default');
      }
    },

    showLoginForm() {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔐 showLoginForm() called');
      this.showSignupModal = false;
      this.showConfirmModal = false;
      this.showLoginModal = true;
      this.clearAuthForm();
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🔐 Login modal should now be visible:', this.showLoginModal);
    },

    showSignupForm() {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📝 showSignupForm() called');
      this.showLoginModal = false;
      this.showConfirmModal = false;
      this.showSignupModal = true;
      this.clearAuthForm();
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📝 Signup modal should now be visible:', this.showSignupModal);
    },

    closeAuthModals() {
      this.showLoginModal = false;
      this.showSignupModal = false;
      this.showConfirmModal = false;
      this.clearAuthForm();
    },

    clearAuthForm() {
      this.authForm = {
        mode: 'parent',
        email: '',
        password: '',
        name: '',
        confirmationCode: ''
      };
      this.authError = null;
    },
    
    async removeFromQuicklist(quicklistId) {
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
      }
    },
    

    
    // Instant delete with optimistic updates
    async deleteChore(chore) {
      if (!chore || !chore.id) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('Invalid chore for deletion');
        return;
      }
      
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically deleting chore:', chore.name);
      
      // Store original state for potential rollback
      const originalChores = [...this.chores];
      const originalEarnings = this.people.map(p => ({ name: p.name, earnings: p.earnings, completedChores: p.completedChores }));
      
      try {
        // OPTIMISTIC UPDATE: Remove chore immediately from UI
        const choreIndex = this.chores.findIndex(c => c.id === chore.id);
        if (choreIndex !== -1) {
          this.chores.splice(choreIndex, 1);
        }
        
        // If chore was completed and assigned, update earnings optimistically
        if (chore.completed && chore.assignedTo && chore.assignedTo !== 'unassigned') {
          const person = this.people.find(p => p.name === chore.assignedTo);
          if (person) {
            person.earnings = Math.max(0, person.earnings - (chore.amount || 0));
            person.completedChores = Math.max(0, (person.completedChores || 0) - 1);
          }
        }
        
        // Clear selection if deleted chore was selected
        if (this.selectedChoreId === chore.id) {
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
        }
        
        // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status if this was an electronics chore
        if (chore.category === 'game' && chore.assignedTo && chore.assignedTo !== 'unassigned') {
          this.updateElectronicsStatusOptimistically(chore.assignedTo);
        }
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - chore deleted');
        
        // Make API call in background
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}`, {
          method: 'DELETE'
        });
        
        if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed chore deletion');
        
        // Refresh data in background (non-blocking) to ensure consistency
        Promise.all([
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadFamilyMembers(true) // Preserve optimistic updates
        ]).catch(error => {
          console.warn('Background data refresh failed:', error);
        });
        
      } catch (error) {
        console.error('❌ Chore deletion failed, rolling back optimistic update:', error);
        
        // ROLLBACK: Restore original state
        this.chores = originalChores;
        
        // Restore original earnings
        originalEarnings.forEach(original => {
          const person = this.people.find(p => p.name === original.name);
          if (person) {
            person.earnings = original.earnings;
            person.completedChores = original.completedChores;
          }
        });
        
        // Show error message
        this.showSuccessMessage(`Failed to delete "${chore.name}". Please try again.`);
      }
    },
    
    async handleChoreCompletion(chore) {
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically handling chore completion for:', chore.name, 'Current state:', chore.completed);
      
      const requireApproval = !!this.accountSettings?.preferences?.requireApproval;
      
      // Store original state for potential rollback
      const originalCompleted = chore.completed;
      const originalSnapshots = this.people.map(p => ({ name: p.name, earnings: p.earnings, completedChores: p.completedChores }));
      
      try {
        // OPTIMISTIC UPDATE when assigned
        if (chore.assignedTo && chore.assignedTo !== 'unassigned') {
          const person = this.people.find(p => p.name === chore.assignedTo);
          if (person) {
            if (requireApproval) {
              // with approval required, only adjust completed count, do not change earnings
              if (chore.completed) {
                person.completedChores = (person.completedChores || 0) + 1;
              } else {
                person.completedChores = Math.max(0, (person.completedChores || 0) - 1);
              }
            } else {
              // immediate earnings change when approval not required
              if (chore.completed) {
                person.earnings += chore.amount || 0;
                person.completedChores = (person.completedChores || 0) + 1;
              } else {
                person.earnings = Math.max(0, person.earnings - (chore.amount || 0));
                person.completedChores = Math.max(0, (person.completedChores || 0) - 1);
              }
            }
            
            if (chore.category === 'game') {
              this.updateElectronicsStatusOptimistically(person.name);
            }
          }
        }
        
        if (chore.completed) {
          this.triggerConfetti();
          this.showSuccessMessage(requireApproval ? `"${chore.name}" marked complete. Pending parent approval.` : `Great job! "${chore.name}" completed!`);
        } else {
          this.showSuccessMessageFlag = false;
          this.completedChoreMessage = '';
        }
        
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        // refresh to ensure consistency
        Promise.all([
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadFamilyMembers(true)
        ]).catch(error => console.warn('Background data refresh failed:', error));
      } catch (error) {
        console.error('❌ Chore completion failed, rolling back optimistic update:', error);
        chore.completed = originalCompleted;
        originalSnapshots.forEach(original => {
          const person = this.people.find(p => p.name === original.name);
          if (person) {
            person.earnings = original.earnings;
            person.completedChores = original.completedChores;
          }
        });
        this.showSuccessMessageFlag = false;
        this.completedChoreMessage = '';
        this.showSuccessMessage(`Failed to update "${chore.name}". Please try again.`);
      }
    },

    async approveChore(chore) {
      if (!chore || !chore.id) return;
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/approve`, { method: 'PUT' });
        // update local chore instance if present
        chore.isPendingApproval = false;
        chore.approved = true;
        // reload earnings since approval transfers money
        await this.loadEarnings();
        await this.loadFamilyMembers(true);
        this.showSuccessMessage(`Approved "${chore.name}"`);
      } catch (error) {
        console.error('failed to approve chore', error);
        this.showSuccessMessage('Failed to approve chore');
      }
    },
    
    triggerConfetti() {
      // Use canvas-confetti for smooth, performant celebration effects
      if (typeof confetti !== 'function') {
        console.warn('canvas-confetti not loaded');
        return;
      }
      
      // Get theme colors for confetti
      const root = getComputedStyle(document.documentElement);
      const token = (v, fb) => (root.getPropertyValue(v) || '').trim() || fb;
      const colors = [
        token('--color-primary-500', '#4A90E2'),
        token('--color-secondary-500', '#7B68EE'),
        token('--color-success-600', '#22c55e'),
        token('--color-warning-600', '#ea580c')
      ];
      
      // Fire confetti from bottom center with a nice burst effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.9 },
        colors: colors
      });
      
      // Add a second burst slightly delayed for extra celebration
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });
      }, 150);
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
      window.addEventListener('blur', () => {
        if (this.isAuthenticated && authService.isAuthenticated()) {
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('📱 App going to background, refreshing tokens proactively...');
          // Proactively refresh tokens before app goes to background
          authService.refreshAccessToken().catch(error => {
            console.warn('Token refresh on blur failed:', error);
          });
        }
      });
    },

    // Add method for click-to-assign functionality with optimistic updates
    async assignSelectedChore(assignTo) {
      if (!this.selectedChore) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('No chore selected for assignment');
        return;
      }
      
      if (!assignTo) {
        if (CONFIG.ENV.IS_DEVELOPMENT) console.warn('No assignee specified');
        return;
      }
      
      if (CONFIG.ENV.IS_DEVELOPMENT) console.log('🚀 Optimistically assigning chore:', this.selectedChore.name, 'to:', assignTo);
      
      // Store original state for potential rollback
      const originalChores = [...this.chores];
      const selectedChore = { ...this.selectedChore };
      
      try {
        if (this.selectedChore.isNewFromQuicklist) {
          // Check if this quicklist chore requires details
          const quicklistChore = this.quicklistChores.find(qc => qc.name === this.selectedChore.name);
          if (quicklistChore && quicklistChore.isDetailed) {
            // Open details modal for detailed quicklist chore
            this.openChoreDetailsModal(this.selectedChore, assignTo, true);
            return;
          }
          
          // OPTIMISTIC UPDATE: Add new chore immediately to UI
          const newChore = {
            id: `temp-${Date.now()}`, // Temporary ID
            name: this.selectedChore.name,
            amount: this.selectedChore.amount || 0,
            category: this.selectedChore.category || 'regular',
            assignedTo: assignTo,
            completed: false,
            isDetailed: false,
            details: '',
            isOptimistic: true // Flag to identify optimistic updates
          };
          
          // Add to chores array immediately for instant UI update
          this.chores.push(newChore);
          
          // Clear selection immediately for instant feedback
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          
          // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status if this is an electronics chore
          if (newChore.category === 'game') {
            this.updateElectronicsStatusOptimistically(assignTo);
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - new chore added');
          
          // Now make API call in background
          const choreData = {
            name: newChore.name,
            amount: newChore.amount,
            category: newChore.category,
            assignedTo: assignTo,
            completed: false
          };
          
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          // Update the temporary chore with real data from server
          const choreIndex = this.chores.findIndex(c => c.id === newChore.id);
          if (choreIndex !== -1) {
            this.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed new chore creation');
          
        } else {
          // OPTIMISTIC UPDATE: Move existing chore immediately
          const choreIndex = this.chores.findIndex(c => c.id === this.selectedChore.id);
          const oldAssignedTo = this.chores[choreIndex]?.assignedTo;
          if (choreIndex !== -1) {
            // Update assignment immediately for instant UI feedback
            this.chores[choreIndex] = {
              ...this.chores[choreIndex],
              assignedTo: assignTo,
              isOptimistic: true
            };
            
            // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status for both old and new assignees if this is an electronics chore
            if (this.chores[choreIndex].category === 'game') {
              if (oldAssignedTo && oldAssignedTo !== 'unassigned') {
                this.updateElectronicsStatusOptimistically(oldAssignedTo);
              }
              if (assignTo && assignTo !== 'unassigned') {
                this.updateElectronicsStatusOptimistically(assignTo);
              }
            }
          }
          
          // Clear selection immediately for instant feedback
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✨ Optimistic UI updated - chore moved');
          
          // Now make API call in background
          const response = await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${selectedChore.id}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ assignedTo: assignTo })
          });
          
          // Update with server response
          if (choreIndex !== -1) {
            this.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          if (CONFIG.ENV.IS_DEVELOPMENT) console.log('✅ Server confirmed chore assignment');
        }
        
        // Reload earnings and electronics status in background (non-blocking)
        Promise.all([
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadFamilyMembers()
        ]).catch(error => {
          console.warn('Background data refresh failed:', error);
        });
        
      } catch (error) {
        console.error('❌ Assignment failed, rolling back optimistic update:', error);
        
        // ROLLBACK: Restore original state
        this.chores = originalChores;
        this.selectedChoreId = selectedChore.isNewFromQuicklist ? null : selectedChore.id;
        this.selectedQuicklistChore = selectedChore.isNewFromQuicklist ? selectedChore : null;
        
        // Show user-friendly error message
        this.showSuccessMessage(`❌ Failed to assign "${selectedChore.name}". Please try again.`);
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
    openSpendingModal(person) {
      // Capture scroll position for flyout-panel (may already be set by EarningsCard click)
      if (typeof window.__flyoutScrollY !== 'number' || window.__flyoutScrollY === 0) {
        window.__flyoutScrollY = window.scrollY;
        console.log('🎯 openSpendingModal - captured scroll:', window.__flyoutScrollY);
      }
      this.selectedPerson = person;
      this.spendAmount = 0;
      this.spendAmountString = '0';
      this.showSpendingModal = true;
    },

    closeSpendingModal() {
      this.showSpendingModal = false;
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
          // create spend request instead of immediate deduction
          await this.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodeURIComponent(personName)}/spend-requests`, {
            method: 'POST',
            body: JSON.stringify({ amount: Number(spentAmount) })
          });
          alert('Spend request submitted for approval.');
          this.closeSpendingModal();
          return;
        }

        // immediate deduction (parent or approval disabled)
        await this.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodeURIComponent(personName)}/earnings`, {
          method: 'PUT',
          body: JSON.stringify({ amount: Number(spentAmount), operation: 'subtract' })
        });

        await this.loadEarnings();
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
    // toggle body scroll lock whenever any modal opens/closes
    isAnyModalOpen(newVal) {
      if (newVal) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
    },
    selectedChoreId(newVal, oldVal) {
      // Verbose selection tracking removed - use browser DevTools if needed
    },
    
    showSuccessMessageFlag(newVal, oldVal) {
      // Verbose flag tracking removed - use browser DevTools if needed
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
        this.isAuthenticated = false;
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
      
      if (isAuthenticated) {
        this.isAuthenticated = true;
        this.currentUser = authService.currentUser;
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
      // if invite token present, show accept prompt after load (only if still authenticated)
      const url = new URL(window.location.href);
      const inviteToken = url.searchParams.get('invite');
      if (inviteToken) {
        // if auth was cleared during load due to 401s, pivot to signup flow instead of prompting accept
        if (!this.isAuthenticated || !authService.getAuthHeader()) {
          this.pendingInviteToken = inviteToken;
          this.showSignupForm();
        } else {
          const accept = confirm('You have been invited to join a family account. Accept invitation?');
          if (accept) {
            // prevent auth-required popup by deferring accept until after data loads and ensuring auth header exists
            if (!authService.getAuthHeader()) {
              this.pendingInviteToken = inviteToken;
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
        this.isAuthenticated = false;
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
            this.pendingInviteToken = inviteToken;
            // default to signup flow for invited users
            this.showSignupForm();
          }
        } catch (e) {
          console.warn('failed to detect pending invite while unauthenticated', e);
        }
      }
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      this.isAuthenticated = false;
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
        // First check if we have a selectedQuicklistChore (for quicklist assignments)
        if (this.selectedQuicklistChore) {
          return this.selectedQuicklistChore;
        }
        // Then check if we have a selectedChoreId (for regular chores)
        if (this.selectedChoreId) {
          return this.chores.find(c => c.id === this.selectedChoreId) || null;
        }
        return null;
      }),
      selectedChoreId: Vue.toRef(this, 'selectedChoreId'),
      selectedQuicklistChore: Vue.toRef(this, 'selectedQuicklistChore'),
      // lightweight selection store for centralized selection handling
      selectionStore: {
        state: {
          selectedChore: Vue.computed(() => {
        if (this.selectedChoreId) {
          return this.chores.find(c => c.id === this.selectedChoreId) || null;
        }
        return this.selectedQuicklistChore || null;
      }),
          selectedChoreId: Vue.toRef(this, 'selectedChoreId'),
          selectedQuicklistChore: Vue.toRef(this, 'selectedQuicklistChore')
        },
        selectChore: (chore) => this.handleChoreClick(chore),
        selectQuicklist: (quickChore) => this.handleQuicklistChoreClick(quickChore),
        clear: () => { this.selectedChoreId = null; this.selectedQuicklistChore = null; }
      },
      showSuccessMessageFlag: Vue.computed(() => this.showSuccessMessageFlag),
      completedChoreMessage: Vue.computed(() => this.completedChoreMessage),
      showConfetti: Vue.computed(() => this.showConfetti),
      confettiPieces: Vue.computed(() => this.confettiPieces),
      quicklistChores: Vue.computed(() => this.quicklistChores || []),
      categories: Vue.computed(() => {
        const categoriesStore = window.useCategoriesStore ? window.useCategoriesStore() : null;
        return categoriesStore ? categoriesStore.sortedCategories : [];
      }),
      choresByPerson: Vue.computed(() => this.choresByPerson || {}),
      // expose only members enabled for chores on chores page by default; family page iterates over same array but includes toggle to change flag
      // filtered list for boards (Chores page)
      people: Vue.computed(() => (this.people || []).filter(p => p.enabledForChores !== false)),
      // unfiltered list for Family page management
      allPeople: Vue.computed(() => this.people || []),
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
      spendingRequests: Vue.computed(() => this.spendingRequests || []),
      
      // Modal state computed values (readonly)
      showAddToQuicklistModal: Vue.computed(() => this.showAddToQuicklistModal),
      showAddChoreModal: Vue.computed(() => this.showAddChoreModal),
      showAddPersonModal: Vue.computed(() => this.showAddPersonModal),
      showDeletePersonModal: Vue.computed(() => this.showDeletePersonModal),
      showNewDayModal: Vue.computed(() => this.showNewDayModal),
      newDayLoading: Vue.computed(() => this.newDayLoading),
      showSpendingModal: Vue.computed(() => this.showSpendingModal),
      showChoreDetailsModal: Vue.computed(() => this.showChoreDetailsModal),
      showMultiAssignModal: Vue.computed(() => this.showMultiAssignModal),
      multiAssignSelectedMembers: Vue.toRef(this, 'multiAssignSelectedMembers'),
      showCategoryManagementModal: Vue.computed(() => this.showCategoryManagementModal),
      // add child / invite parent modal flags
      showCreateChildModal: Vue.computed(() => this.showCreateChildModal),
      showInviteModal: Vue.computed(() => this.showInviteModal),
      selectedPerson: Vue.computed(() => this.selectedPerson),
      spendAmount: Vue.computed(() => this.spendAmount),
      spendAmountString: Vue.computed(() => this.spendAmountString),
      currentPage: Vue.computed(() => this.currentPage),
      
      // Authentication modal state
      showLoginModal: Vue.computed(() => this.showLoginModal),
      showSignupModal: Vue.computed(() => this.showSignupModal),
      showConfirmModal: Vue.computed(() => this.showConfirmModal),
      authError: Vue.computed(() => this.authError),
      authLoading: Vue.computed(() => this.authLoading),
      
      // Form data as reactive refs
      newQuicklistChore: Vue.toRef(this, 'newQuicklistChore'),
      newPerson: Vue.toRef(this, 'newPerson'),
      newChore: Vue.toRef(this, 'newChore'),
      authForm: Vue.toRef(this, 'authForm'),
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
      updateQuicklistCategory: this.updateQuicklistCategory,
      deleteChore: this.deleteChore,
      deletePerson: this.performDeletePerson,
      executeDeletePerson: this.executeDeletePerson,
      cancelDeletePerson: this.cancelDeletePerson,
      triggerConfetti: this.triggerConfetti,
      loadEarnings: this.loadEarnings,
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
      
      // Authentication methods
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
      // shared api helper
      apiCall: this.apiCall,
      
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
