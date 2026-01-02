/**
 * Authentication Store
 * Manages user authentication state and operations
 * 
 * Requirements: 3.1, 3.3, 3.4
 * - 3.1: Own all authentication state
 * - 3.3: Contain all auth business logic
 * - 3.4: Notify all subscribers reactively on state changes
 */

const useAuthStore = Pinia.defineStore('auth', {
  state: () => ({
    // Core authentication state (from app.js)
    isAuthenticated: false,
    currentUser: null,
    accountId: null,
    accountSettings: null,
    
    // Auth form state
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
    
    // Invite handling
    pendingInviteToken: null,
    
    // Cache for /auth/me response to avoid duplicate API calls
    _authMeCache: null
  }),
  
  getters: {
    /**
     * Check if user is a parent
     * @returns {boolean}
     */
    isParent: (state) => {
      return state.currentUser?.role === 'parent';
    },
    
    /**
     * Check if user is a child
     * @returns {boolean}
     */
    isChild: (state) => {
      return state.currentUser?.role === 'child';
    },
    
    /**
     * Get display name for current user
     * @returns {string}
     */
    userDisplayName: (state) => {
      if (!state.currentUser) return '';
      return state.currentUser.displayName || 
             state.currentUser.name || 
             state.currentUser.email || 
             'User';
    },
    
    /**
     * Get user role
     * @returns {string|null}
     */
    userRole: (state) => {
      return state.currentUser?.role || null;
    }
  },
  
  actions: {
    /**
     * Get the API composable (lazy loaded)
     * @returns {Object} API composable instance
     */
    _getApi() {
      return window.useApi?.() || null;
    },
    
    /**
     * Get the UI store for modal management
     * @returns {Object} UI store instance
     */
    _getUIStore() {
      return window.useUIStore?.() || null;
    },

    /**
     * Handle login with email/username and password
     * Includes invite token handling for family invitations
     * 
     * Requirements: 3.3
     */
    async handleLogin() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const username = this.authForm.mode === 'parent' 
          ? this.authForm.email 
          : this.authForm.username;
        
        const result = await window.authService.signIn(username, this.authForm.password);
        
        if (result.success) {
          this.isAuthenticated = true;
          this.currentUser = result.user;
          this.closeAuthModals();
          this.clearAuthForm();
          
          if (CONFIG?.ENV?.IS_DEVELOPMENT) {
            console.log('✅ [AuthStore] Login successful, loading user data...');
          }
          
          // Refresh current user (to include role & accountId)
          await this.refreshCurrentUser();
          // Load user theme first to prevent flash of wrong theme
          await this.loadUserTheme();
          
          // Notify app.js to load all data (bridge pattern)
          const vueApp = window.vueApp;
          if (vueApp?.loadAllData) {
            await vueApp.loadAllData();
          }

          // Handle pending invite token
          await this._handlePendingInvite();
          
          return { success: true };
        } else {
          this.authError = 'Login failed. Please check your credentials.';
          return { success: false, error: this.authError };
        }
      } catch (error) {
        console.error('[AuthStore] Login error:', error);
        this.authError = error.message || 'Login failed. Please try again.';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    /**
     * Handle signup with email, password, and name
     * 
     * Requirements: 3.3
     */
    async handleSignup() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const result = await window.authService.signUp(
          this.authForm.email, 
          this.authForm.password, 
          this.authForm.name
        );
        
        if (result.success) {
          // Close signup modal and show confirmation modal
          const uiStore = this._getUIStore();
          if (uiStore) {
            uiStore.closeModal('signup');
            uiStore.openModal('confirm');
          }
          
          this.authError = null;
          this.authForm.username = result.username;
          
          // Preserve pending invite token from URL
          this._captureInviteTokenFromUrl();
          
          return { success: true, requiresConfirmation: true };
        } else {
          this.authError = 'Signup failed. Please try again.';
          return { success: false, error: this.authError };
        }
      } catch (error) {
        console.error('[AuthStore] Signup error:', error);
        this.authError = error.message || 'Signup failed. Please try again.';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    /**
     * Handle signup confirmation with verification code
     * Auto-signs in user after successful confirmation
     * 
     * Requirements: 3.3
     */
    async handleConfirmSignup() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const result = await window.authService.confirmSignUp(
          this.authForm.username || this.authForm.email, 
          this.authForm.confirmationCode
        );
        
        if (result.success) {
          // Account confirmed, now sign them in automatically
          const signInResult = await window.authService.signIn(
            this.authForm.email, 
            this.authForm.password
          );
          
          if (signInResult.success) {
            this.isAuthenticated = true;
            this.currentUser = signInResult.user;
            this.closeAuthModals();
            this.clearAuthForm();
            
            if (CONFIG?.ENV?.IS_DEVELOPMENT) {
              console.log('✅ [AuthStore] Account confirmed and logged in');
            }
            
            // Refresh current user (to include role & accountId)
            await this.refreshCurrentUser();
            // Load user theme first to prevent flash of wrong theme
            await this.loadUserTheme();
            
            // Notify app.js to load all data (bridge pattern)
            const vueApp = window.vueApp;
            if (vueApp?.loadAllData) {
              await vueApp.loadAllData();
            }

            // Handle pending invite token
            await this._handlePendingInvite();
            
            return { success: true };
          } else {
            this.authError = 'Account confirmed but auto-login failed. Please log in manually.';
            const uiStore = this._getUIStore();
            if (uiStore) {
              uiStore.closeModal('confirm');
              uiStore.openModal('login');
            }
            return { success: false, error: this.authError };
          }
        } else {
          this.authError = 'Confirmation failed. Please check the code and try again.';
          return { success: false, error: this.authError };
        }
      } catch (error) {
        console.error('[AuthStore] Confirmation error:', error);
        this.authError = error.message || 'Confirmation failed. Please try again.';
        return { success: false, error: this.authError };
      } finally {
        this.authLoading = false;
      }
    },

    /**
     * Handle logout with complete state cleanup
     * 
     * Requirements: 3.3
     */
    async handleLogout() {
      try {
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('🚪 [AuthStore] Logging out user...');
        }
        
        // Stop midnight scheduler if available
        if (window.MidnightScheduler) {
          window.MidnightScheduler.stop();
        }
        
        await window.authService.signOut();
        
        // Clear all authentication state
        this.isAuthenticated = false;
        this.currentUser = null;
        this._authMeCache = null;
        this.accountSettings = null;
        this.accountId = null;
        this.pendingInviteToken = null;
        
        // Reset auth form
        this.clearAuthForm();
        
        // Reset to default theme on logout
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('🎨 [AuthStore] Resetting to default theme on logout');
        }
        if (window.ThemeManager) {
          window.ThemeManager.applyTheme('default');
        }
        localStorage.setItem('selectedTheme', 'default');
        
        // Notify app.js to clear data (bridge pattern)
        const vueApp = window.vueApp;
        if (vueApp) {
          vueApp.chores = [];
          vueApp.people = [];
          vueApp.quicklistChores = [];
          vueApp.selectedChoreId = null;
          vueApp.selectedQuicklistChore = null;
          vueApp.currentPage = 'chores';
        }
        
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('✅ [AuthStore] Logout successful');
        }
        
        return { success: true };
      } catch (error) {
        console.error('[AuthStore] Logout error:', error);
        
        // Still clear local state even if server logout fails
        this.isAuthenticated = false;
        this.currentUser = null;
        this._authMeCache = null;
        this.accountSettings = null;
        this.accountId = null;
        
        // Still reset theme on error
        if (window.ThemeManager) {
          window.ThemeManager.applyTheme('default');
        }
        localStorage.setItem('selectedTheme', 'default');
        
        return { success: false, error: error.message };
      }
    },

    /**
     * Refresh current user data from authService and backend
     * Enriches user with server-side account and role info
     * 
     * Requirements: 3.3
     */
    async refreshCurrentUser() {
      try {
        const me = await window.authService.getCurrentUser();
        if (me) {
          this.currentUser = me;
        }
        
        // Enrich with server-side account and role when missing
        if (!this.currentUser?.role || !this.currentUser?.accountId) {
          try {
            // Use cached response if available (prevents duplicate /auth/me calls)
            let res = this._authMeCache;
            if (!res) {
              const api = this._getApi();
              if (api) {
                res = await api.get(CONFIG.API.ENDPOINTS.AUTH_ME);
                this._authMeCache = res;
              }
            } else if (CONFIG?.ENV?.IS_DEVELOPMENT) {
              console.log('👤 [AuthStore] Using cached /auth/me response');
            }
            
            if (res && (res.accountId || res.role)) {
              this.currentUser = { 
                ...this.currentUser, 
                role: res.role || this.currentUser?.role, 
                memberships: res.memberships 
              };
              this.accountId = res.accountId || this.accountId;
            }
          } catch (e) {
            // Ignore if /auth/me unavailable
            console.warn('[AuthStore] Failed to fetch /auth/me:', e.message);
          }
        } else {
          this.accountId = this.currentUser.accountId || this.accountId;
        }
      } catch (e) {
        console.warn('[AuthStore] Failed to refresh current user:', e);
      }
    },

    /**
     * Load account settings from backend
     * 
     * Requirements: 3.3
     */
    async loadAccountSettings() {
      try {
        // Skip if account settings are already loaded
        if (this.accountSettings && this.accountId) {
          if (CONFIG?.ENV?.IS_DEVELOPMENT) {
            console.log('⚙️ [AuthStore] Account settings already loaded, skipping');
          }
          return;
        }
        
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('⚙️ [AuthStore] Loading account settings...');
        }
        
        const api = this._getApi();
        if (api) {
          const response = await api.get(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
          this.accountSettings = response;
          this.accountId = response?.accountId || null;
          
          if (CONFIG?.ENV?.IS_DEVELOPMENT) {
            console.log('✅ [AuthStore] Account settings loaded:', this.accountSettings);
          }
        }
      } catch (error) {
        console.error('[AuthStore] Failed to load account settings:', error);
        this.accountSettings = null;
        this.accountId = null;
      }
    },

    /**
     * Load user theme from localStorage (source of truth) and cache backend settings
     * 
     * Requirements: 3.3
     */
    async loadUserTheme() {
      try {
        // PWA optimization: localStorage is source of truth for current device
        const localTheme = localStorage.getItem('selectedTheme') || 'default';
        if (CONFIG?.ENV?.IS_DEVELOPMENT) {
          console.log('🎨 [AuthStore] Applying localStorage theme:', localTheme);
        }
        
        if (window.ThemeManager) {
          window.ThemeManager.applyTheme(localTheme);
        }
        
        // Load account settings for caching (not theme override)
        const headerAccountId = this.accountId || this.accountSettings?.accountId || null;
        let response;
        
        try {
          if (window.SettingsClient) {
            response = await window.SettingsClient.get(headerAccountId, { 
              ifNoneMatch: this.accountSettings?.updatedAt 
            });
          } else {
            const api = this._getApi();
            if (api) {
              response = await api.get(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
            }
          }
        } catch (e) {
          console.warn('[AuthStore] SettingsClient.get failed, falling back to apiCall', e?.message);
          const api = this._getApi();
          if (api) {
            response = await api.get(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
          }
        }
        
        // Cache the account settings
        if (response) {
          this.accountSettings = response;
          this.accountId = response.accountId || this.accountId;
        }
        
        // NOTE: We do NOT overwrite localStorage theme with backend theme
        // localStorage is the source of truth for the current device
      } catch (error) {
        console.error('[AuthStore] Failed to load user theme:', error);
        // Fallback: ensure theme is applied even on error
        const fallbackTheme = localStorage.getItem('selectedTheme') || 'default';
        if (window.ThemeManager) {
          window.ThemeManager.applyTheme(fallbackTheme);
        }
      }
    },

    /**
     * Show login form modal
     * 
     * Requirements: 3.3
     */
    showLoginForm() {
      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log('🔐 [AuthStore] showLoginForm() called');
      }
      
      const uiStore = this._getUIStore();
      if (uiStore) {
        uiStore.closeModal('signup');
        uiStore.closeModal('confirm');
        uiStore.openModal('login');
      }
      
      this.clearAuthForm();
    },

    /**
     * Show signup form modal
     * 
     * Requirements: 3.3
     */
    showSignupForm() {
      if (CONFIG?.ENV?.IS_DEVELOPMENT) {
        console.log('📝 [AuthStore] showSignupForm() called');
      }
      
      const uiStore = this._getUIStore();
      if (uiStore) {
        uiStore.closeModal('login');
        uiStore.closeModal('confirm');
        uiStore.openModal('signup');
      }
      
      this.clearAuthForm();
    },

    /**
     * Close all auth-related modals
     * 
     * Requirements: 3.3
     */
    closeAuthModals() {
      const uiStore = this._getUIStore();
      if (uiStore) {
        uiStore.closeModal('login');
        uiStore.closeModal('signup');
        uiStore.closeModal('confirm');
      }
      this.clearAuthForm();
    },

    /**
     * Clear auth form to initial state
     * 
     * Requirements: 3.3
     */
    clearAuthForm() {
      this.authForm = {
        mode: 'parent',
        email: '',
        username: '',
        password: '',
        name: '',
        confirmationCode: ''
      };
      this.authError = null;
    },

    /**
     * Set current user (for external updates)
     */
    setCurrentUser(user) {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    },

    /**
     * Clear error state
     */
    clearError() {
      this.authError = null;
    },

    /**
     * Initialize authentication from existing authService
     */
    async initAuth() {
      this.authLoading = true;
      this.authError = null;
      
      try {
        const initialized = await window.authService.initializeAuth();
        
        if (initialized && window.authService.currentUser) {
          this.isAuthenticated = true;
          this.currentUser = window.authService.currentUser;
          if (CONFIG?.ENV?.IS_DEVELOPMENT) {
            console.log('[OK] Auth store initialized, user:', this.userDisplayName);
          }
        } else {
          this.isAuthenticated = false;
          this.currentUser = null;
          if (CONFIG?.ENV?.IS_DEVELOPMENT) {
            console.log('[INFO] No active session found');
          }
        }
      } catch (error) {
        console.error('[AuthStore] Initialization error:', error);
        this.authError = error.message;
        this.isAuthenticated = false;
        this.currentUser = null;
      } finally {
        this.authLoading = false;
      }
    },

    // ============ Private Helper Methods ============

    /**
     * Capture invite token from URL if present
     * @private
     */
    _captureInviteTokenFromUrl() {
      try {
        const url = new URL(window.location.href);
        const inviteToken = url.searchParams.get('invite');
        if (inviteToken) {
          this.pendingInviteToken = inviteToken;
        }
      } catch {
        // Ignore URL parse errors
      }
    },

    /**
     * Handle pending invite token after successful auth
     * @private
     */
    async _handlePendingInvite() {
      try {
        const url = new URL(window.location.href);
        const inviteToken = this.pendingInviteToken || url.searchParams.get('invite');
        
        if (inviteToken) {
          const accept = confirm('You have been invited to join a family account. Accept invitation?');
          if (accept) {
            // Ensure valid auth before attempting accept
            if (!window.authService.getAuthHeader()) {
              this.pendingInviteToken = inviteToken;
              this.showSignupForm();
            } else {
              // Delegate to app.js for invite acceptance (bridge pattern)
              const vueApp = window.vueApp;
              if (vueApp?.acceptParentInvite) {
                await vueApp.acceptParentInvite(inviteToken);
              }
              this.pendingInviteToken = null;
            }
            
            // Clean up URL
            url.searchParams.delete('invite');
            window.history.replaceState({}, document.title, url.toString());
          }
        }
      } catch (e) {
        console.warn('[AuthStore] Failed to process invite token:', e);
      }
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useAuthStore = useAuthStore;
}
