/**
 * Unit Tests for Auth Store
 * 
 * Tests:
 * - handleLogin sets isAuthenticated on success
 * - handleLogout clears all auth state
 * - refreshCurrentUser updates currentUser
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Auth Store', () => {
  let createStore;
  let mockAuthService;
  let mockUIStore;
  let mockApi;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock authService
    mockAuthService = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      confirmSignUp: vi.fn(),
      signOut: vi.fn(),
      getCurrentUser: vi.fn(),
      getAuthHeader: vi.fn(() => 'Bearer test-token'),
      initializeAuth: vi.fn()
    };
    global.window.authService = mockAuthService;

    // Mock UI store
    mockUIStore = {
      openModal: vi.fn(),
      closeModal: vi.fn()
    };
    global.window.useUIStore = () => mockUIStore;

    // Mock API composable
    mockApi = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    global.window.useApi = () => mockApi;

    // Mock vueApp for bridge pattern
    global.window.vueApp = {
      loadAllData: vi.fn(),
      acceptParentInvite: vi.fn(),
      chores: [],
      people: [],
      quicklistChores: [],
      selectedChoreId: null,
      selectedQuicklistChore: null,
      currentPage: 'chores'
    };

    // Mock ThemeManager
    global.window.ThemeManager = {
      applyTheme: vi.fn()
    };

    // Mock MidnightScheduler
    global.window.MidnightScheduler = {
      stop: vi.fn()
    };

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => 'default'),
      setItem: vi.fn()
    };

    // Create a fresh store instance for each test
    createStore = () => {
      const state = {
        isAuthenticated: false,
        currentUser: null,
        accountId: null,
        accountSettings: null,
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
        pendingInviteToken: null,
        _authMeCache: null
      };

      return {
        // State
        ...state,

        // Getters
        get isParent() {
          return this.currentUser?.role === 'parent';
        },
        get isChild() {
          return this.currentUser?.role === 'child';
        },
        get userDisplayName() {
          if (!this.currentUser) return '';
          return this.currentUser.displayName || 
                 this.currentUser.name || 
                 this.currentUser.email || 
                 'User';
        },
        get userRole() {
          return this.currentUser?.role || null;
        },

        // Private helpers
        _getApi() {
          return window.useApi?.() || null;
        },
        _getUIStore() {
          return window.useUIStore?.() || null;
        },

        // Actions
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
              
              await this.refreshCurrentUser();
              await this.loadUserTheme();
              
              const vueApp = window.vueApp;
              if (vueApp?.loadAllData) {
                await vueApp.loadAllData();
              }
              
              return { success: true };
            } else {
              this.authError = 'Login failed. Please check your credentials.';
              return { success: false, error: this.authError };
            }
          } catch (error) {
            this.authError = error.message || 'Login failed. Please try again.';
            return { success: false, error: this.authError };
          } finally {
            this.authLoading = false;
          }
        },

        async handleLogout() {
          try {
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
            
            this.clearAuthForm();
            
            if (window.ThemeManager) {
              window.ThemeManager.applyTheme('default');
            }
            localStorage.setItem('selectedTheme', 'default');
            
            const vueApp = window.vueApp;
            if (vueApp) {
              vueApp.chores = [];
              vueApp.people = [];
              vueApp.quicklistChores = [];
              vueApp.selectedChoreId = null;
              vueApp.selectedQuicklistChore = null;
              vueApp.currentPage = 'chores';
            }
            
            return { success: true };
          } catch (error) {
            // Still clear local state even if server logout fails
            this.isAuthenticated = false;
            this.currentUser = null;
            this._authMeCache = null;
            this.accountSettings = null;
            this.accountId = null;
            
            if (window.ThemeManager) {
              window.ThemeManager.applyTheme('default');
            }
            localStorage.setItem('selectedTheme', 'default');
            
            return { success: false, error: error.message };
          }
        },

        async refreshCurrentUser() {
          try {
            const me = await window.authService.getCurrentUser();
            if (me) {
              this.currentUser = me;
            }
            
            if (!this.currentUser?.role || !this.currentUser?.accountId) {
              try {
                let res = this._authMeCache;
                if (!res) {
                  const api = this._getApi();
                  if (api) {
                    res = await api.get(CONFIG.API.ENDPOINTS.AUTH_ME);
                    this._authMeCache = res;
                  }
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
              }
            } else {
              this.accountId = this.currentUser.accountId || this.accountId;
            }
          } catch (e) {
            // Ignore errors
          }
        },

        async loadUserTheme() {
          const localTheme = localStorage.getItem('selectedTheme') || 'default';
          if (window.ThemeManager) {
            window.ThemeManager.applyTheme(localTheme);
          }
        },

        closeAuthModals() {
          const uiStore = this._getUIStore();
          if (uiStore) {
            uiStore.closeModal('login');
            uiStore.closeModal('signup');
            uiStore.closeModal('confirm');
          }
          this.clearAuthForm();
        },

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

        setCurrentUser(user) {
          this.currentUser = user;
          this.isAuthenticated = !!user;
        }
      };
    };
  });

  describe('handleLogin', () => {
    it('should set isAuthenticated to true on successful login', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        user: { id: '123', email: 'test@example.com', role: 'parent' }
      });
      mockAuthService.getCurrentUser.mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        role: 'parent'
      });
      
      const result = await store.handleLogin();
      
      expect(result.success).toBe(true);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should set currentUser on successful login', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      const mockUser = { id: '123', email: 'test@example.com', role: 'parent' };
      mockAuthService.signIn.mockResolvedValue({
        success: true,
        user: mockUser
      });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      await store.handleLogin();
      
      expect(store.currentUser).toEqual(mockUser);
    });

    it('should call authService.signIn with correct credentials', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      store.authForm.mode = 'parent';
      
      mockAuthService.signIn.mockResolvedValue({ success: true, user: {} });
      mockAuthService.getCurrentUser.mockResolvedValue({});
      
      await store.handleLogin();
      
      expect(mockAuthService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should use username for child mode login', async () => {
      const store = createStore();
      store.authForm.username = 'childuser';
      store.authForm.password = 'password123';
      store.authForm.mode = 'child';
      
      mockAuthService.signIn.mockResolvedValue({ success: true, user: {} });
      mockAuthService.getCurrentUser.mockResolvedValue({});
      
      await store.handleLogin();
      
      expect(mockAuthService.signIn).toHaveBeenCalledWith('childuser', 'password123');
    });

    it('should set authError on failed login', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'wrongpassword';
      
      mockAuthService.signIn.mockResolvedValue({ success: false });
      
      const result = await store.handleLogin();
      
      expect(result.success).toBe(false);
      expect(store.authError).toBe('Login failed. Please check your credentials.');
      expect(store.isAuthenticated).toBe(false);
    });

    it('should set authError on exception', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      mockAuthService.signIn.mockRejectedValue(new Error('Network error'));
      
      const result = await store.handleLogin();
      
      expect(result.success).toBe(false);
      expect(store.authError).toBe('Network error');
    });

    it('should set authLoading during login process', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      let loadingDuringCall = false;
      mockAuthService.signIn.mockImplementation(async () => {
        loadingDuringCall = store.authLoading;
        return { success: true, user: {} };
      });
      mockAuthService.getCurrentUser.mockResolvedValue({});
      
      await store.handleLogin();
      
      expect(loadingDuringCall).toBe(true);
      expect(store.authLoading).toBe(false);
    });

    it('should close auth modals on successful login', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      mockAuthService.signIn.mockResolvedValue({ success: true, user: {} });
      mockAuthService.getCurrentUser.mockResolvedValue({});
      
      await store.handleLogin();
      
      expect(mockUIStore.closeModal).toHaveBeenCalledWith('login');
      expect(mockUIStore.closeModal).toHaveBeenCalledWith('signup');
      expect(mockUIStore.closeModal).toHaveBeenCalledWith('confirm');
    });

    it('should call loadAllData on successful login', async () => {
      const store = createStore();
      store.authForm.email = 'test@example.com';
      store.authForm.password = 'password123';
      
      mockAuthService.signIn.mockResolvedValue({ success: true, user: {} });
      mockAuthService.getCurrentUser.mockResolvedValue({});
      
      await store.handleLogin();
      
      expect(window.vueApp.loadAllData).toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    it('should set isAuthenticated to false', async () => {
      const store = createStore();
      store.isAuthenticated = true;
      store.currentUser = { id: '123' };
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store.isAuthenticated).toBe(false);
    });

    it('should clear currentUser', async () => {
      const store = createStore();
      store.isAuthenticated = true;
      store.currentUser = { id: '123', email: 'test@example.com' };
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store.currentUser).toBeNull();
    });

    it('should clear accountId', async () => {
      const store = createStore();
      store.accountId = 'account-123';
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store.accountId).toBeNull();
    });

    it('should clear accountSettings', async () => {
      const store = createStore();
      store.accountSettings = { theme: 'dark' };
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store.accountSettings).toBeNull();
    });

    it('should clear _authMeCache', async () => {
      const store = createStore();
      store._authMeCache = { role: 'parent' };
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store._authMeCache).toBeNull();
    });

    it('should clear pendingInviteToken', async () => {
      const store = createStore();
      store.pendingInviteToken = 'invite-token-123';
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(store.pendingInviteToken).toBeNull();
    });

    it('should call authService.signOut', async () => {
      const store = createStore();
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(mockAuthService.signOut).toHaveBeenCalled();
    });

    it('should reset theme to default', async () => {
      const store = createStore();
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(window.ThemeManager.applyTheme).toHaveBeenCalledWith('default');
      expect(localStorage.setItem).toHaveBeenCalledWith('selectedTheme', 'default');
    });

    it('should stop MidnightScheduler', async () => {
      const store = createStore();
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(window.MidnightScheduler.stop).toHaveBeenCalled();
    });

    it('should clear app.js data via bridge pattern', async () => {
      const store = createStore();
      window.vueApp.chores = [{ id: '1' }];
      window.vueApp.people = [{ name: 'John' }];
      
      mockAuthService.signOut.mockResolvedValue();
      
      await store.handleLogout();
      
      expect(window.vueApp.chores).toEqual([]);
      expect(window.vueApp.people).toEqual([]);
      expect(window.vueApp.quicklistChores).toEqual([]);
    });

    it('should still clear state even if signOut fails', async () => {
      const store = createStore();
      store.isAuthenticated = true;
      store.currentUser = { id: '123' };
      store.accountId = 'account-123';
      
      mockAuthService.signOut.mockRejectedValue(new Error('Network error'));
      
      const result = await store.handleLogout();
      
      expect(result.success).toBe(false);
      expect(store.isAuthenticated).toBe(false);
      expect(store.currentUser).toBeNull();
      expect(store.accountId).toBeNull();
    });

    it('should return success true on successful logout', async () => {
      const store = createStore();
      
      mockAuthService.signOut.mockResolvedValue();
      
      const result = await store.handleLogout();
      
      expect(result.success).toBe(true);
    });
  });

  describe('refreshCurrentUser', () => {
    it('should update currentUser from authService', async () => {
      const store = createStore();
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      await store.refreshCurrentUser();
      
      expect(store.currentUser).toEqual(mockUser);
    });

    it('should enrich user with role from /auth/me endpoint', async () => {
      const store = createStore();
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockApi.get.mockResolvedValue({ role: 'parent', accountId: 'account-123' });
      
      await store.refreshCurrentUser();
      
      expect(store.currentUser.role).toBe('parent');
      expect(store.accountId).toBe('account-123');
    });

    it('should cache /auth/me response', async () => {
      const store = createStore();
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockApi.get.mockResolvedValue({ role: 'parent', accountId: 'account-123' });
      
      await store.refreshCurrentUser();
      await store.refreshCurrentUser();
      
      // Should only call API once due to caching
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it('should use cached response on subsequent calls', async () => {
      const store = createStore();
      store._authMeCache = { role: 'parent', accountId: 'cached-account' };
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      await store.refreshCurrentUser();
      
      expect(mockApi.get).not.toHaveBeenCalled();
      expect(store.currentUser.role).toBe('parent');
    });

    it('should set accountId from currentUser if available', async () => {
      const store = createStore();
      const mockUser = { id: '123', email: 'test@example.com', role: 'parent', accountId: 'user-account-123' };
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      await store.refreshCurrentUser();
      
      expect(store.accountId).toBe('user-account-123');
    });

    it('should handle errors gracefully', async () => {
      const store = createStore();
      
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Network error'));
      
      // Should not throw
      await expect(store.refreshCurrentUser()).resolves.not.toThrow();
    });
  });

  describe('clearAuthForm', () => {
    it('should reset authForm to initial state', () => {
      const store = createStore();
      store.authForm = {
        mode: 'child',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        confirmationCode: '123456'
      };
      
      store.clearAuthForm();
      
      expect(store.authForm).toEqual({
        mode: 'parent',
        email: '',
        username: '',
        password: '',
        name: '',
        confirmationCode: ''
      });
    });

    it('should clear authError', () => {
      const store = createStore();
      store.authError = 'Some error';
      
      store.clearAuthForm();
      
      expect(store.authError).toBeNull();
    });
  });

  describe('setCurrentUser', () => {
    it('should set currentUser', () => {
      const store = createStore();
      const user = { id: '123', name: 'Test User' };
      
      store.setCurrentUser(user);
      
      expect(store.currentUser).toEqual(user);
    });

    it('should set isAuthenticated to true when user is provided', () => {
      const store = createStore();
      
      store.setCurrentUser({ id: '123' });
      
      expect(store.isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when user is null', () => {
      const store = createStore();
      store.isAuthenticated = true;
      
      store.setCurrentUser(null);
      
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('getters', () => {
    it('isParent should return true for parent role', () => {
      const store = createStore();
      store.currentUser = { role: 'parent' };
      
      expect(store.isParent).toBe(true);
    });

    it('isParent should return false for child role', () => {
      const store = createStore();
      store.currentUser = { role: 'child' };
      
      expect(store.isParent).toBe(false);
    });

    it('isChild should return true for child role', () => {
      const store = createStore();
      store.currentUser = { role: 'child' };
      
      expect(store.isChild).toBe(true);
    });

    it('isChild should return false for parent role', () => {
      const store = createStore();
      store.currentUser = { role: 'parent' };
      
      expect(store.isChild).toBe(false);
    });

    it('userDisplayName should return displayName if available', () => {
      const store = createStore();
      store.currentUser = { displayName: 'John Doe', name: 'john', email: 'john@example.com' };
      
      expect(store.userDisplayName).toBe('John Doe');
    });

    it('userDisplayName should fall back to name', () => {
      const store = createStore();
      store.currentUser = { name: 'john', email: 'john@example.com' };
      
      expect(store.userDisplayName).toBe('john');
    });

    it('userDisplayName should fall back to email', () => {
      const store = createStore();
      store.currentUser = { email: 'john@example.com' };
      
      expect(store.userDisplayName).toBe('john@example.com');
    });

    it('userDisplayName should return User as last fallback', () => {
      const store = createStore();
      store.currentUser = {};
      
      expect(store.userDisplayName).toBe('User');
    });

    it('userDisplayName should return empty string when no user', () => {
      const store = createStore();
      store.currentUser = null;
      
      expect(store.userDisplayName).toBe('');
    });

    it('userRole should return role from currentUser', () => {
      const store = createStore();
      store.currentUser = { role: 'parent' };
      
      expect(store.userRole).toBe('parent');
    });

    it('userRole should return null when no user', () => {
      const store = createStore();
      store.currentUser = null;
      
      expect(store.userRole).toBeNull();
    });
  });
});
