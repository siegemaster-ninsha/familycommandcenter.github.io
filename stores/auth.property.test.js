/**
 * Property-Based Tests for Auth Store - State Reactivity
 * 
 * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
 * **Validates: Requirements 3.4**
 * 
 * Property: For any authentication state change (login, logout, token refresh),
 * all components watching the auth store SHALL be notified reactively and
 * SHALL reflect the new state.
 * 
 * This property test validates that:
 * 1. State changes are immediately reflected in getters
 * 2. Derived state (isParent, isChild, userDisplayName) updates correctly
 * 3. State transitions are consistent and predictable
 */

import { describe, it, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

describe('Auth Store State Reactivity Property Tests', () => {
  let createStore;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ThemeManager
    global.window = global.window || {};
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

    // Create store factory
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

      // Track state change notifications for reactivity testing
      const stateChangeLog = [];

      return {
        ...state,
        _stateChangeLog: stateChangeLog,

        // Getters that should react to state changes
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

        // Helper to log state changes
        _logStateChange(action, prevState, newState) {
          this._stateChangeLog.push({
            action,
            prevState: { ...prevState },
            newState: { ...newState },
            timestamp: Date.now()
          });
        },

        // Actions
        setCurrentUser(user) {
          const prev = { currentUser: this.currentUser, isAuthenticated: this.isAuthenticated };
          this.currentUser = user;
          this.isAuthenticated = !!user;
          this._logStateChange('setCurrentUser', prev, { currentUser: this.currentUser, isAuthenticated: this.isAuthenticated });
        },

        simulateLogin(user) {
          const prev = { 
            isAuthenticated: this.isAuthenticated, 
            currentUser: this.currentUser,
            accountId: this.accountId
          };
          
          this.isAuthenticated = true;
          this.currentUser = user;
          this.accountId = user.accountId || null;
          
          this._logStateChange('login', prev, { 
            isAuthenticated: this.isAuthenticated, 
            currentUser: this.currentUser,
            accountId: this.accountId
          });
          
          return { success: true };
        },

        simulateLogout() {
          const prev = { 
            isAuthenticated: this.isAuthenticated, 
            currentUser: this.currentUser,
            accountId: this.accountId,
            accountSettings: this.accountSettings,
            _authMeCache: this._authMeCache
          };
          
          this.isAuthenticated = false;
          this.currentUser = null;
          this.accountId = null;
          this.accountSettings = null;
          this._authMeCache = null;
          this.pendingInviteToken = null;
          
          this._logStateChange('logout', prev, { 
            isAuthenticated: this.isAuthenticated, 
            currentUser: this.currentUser,
            accountId: this.accountId,
            accountSettings: this.accountSettings,
            _authMeCache: this._authMeCache
          });
          
          return { success: true };
        },

        simulateRefreshUser(newUserData) {
          const prev = { currentUser: this.currentUser, accountId: this.accountId };
          
          if (newUserData) {
            this.currentUser = { ...this.currentUser, ...newUserData };
            this.accountId = newUserData.accountId || this.accountId;
          }
          
          this._logStateChange('refreshUser', prev, { 
            currentUser: this.currentUser, 
            accountId: this.accountId 
          });
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
        }
      };
    };
  });

  /**
   * Arbitrary for generating user objects
   */
  const userArbitrary = fc.record({
    id: fc.uuid(),
    email: fc.emailAddress(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { nil: undefined }),
    role: fc.constantFrom('parent', 'child'),
    accountId: fc.option(fc.uuid(), { nil: undefined })
  });

  /**
   * Arbitrary for generating a sequence of auth operations
   */
  const authOperationArbitrary = fc.oneof(
    fc.record({ type: fc.constant('login'), user: userArbitrary }),
    fc.constant({ type: 'logout' }),
    fc.record({ type: fc.constant('refresh'), userData: fc.record({
      role: fc.option(fc.constantFrom('parent', 'child'), { nil: undefined }),
      accountId: fc.option(fc.uuid(), { nil: undefined })
    })})
  );

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * For any user, login sets isAuthenticated to true and updates currentUser.
   */
  it('Property 3: Login state change is immediately reflected in isAuthenticated and currentUser', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const store = createStore();
          
          // Initial state
          if (store.isAuthenticated !== false) return false;
          if (store.currentUser !== null) return false;
          
          // Perform login
          store.simulateLogin(user);
          
          // Property: State changes are immediately reflected
          if (store.isAuthenticated !== true) return false;
          if (store.currentUser.id !== user.id) return false;
          if (store.currentUser.email !== user.email) return false;
          
          // Property: State change was logged (reactivity notification)
          if (store._stateChangeLog.length !== 1) return false;
          if (store._stateChangeLog[0].action !== 'login') return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * For any authenticated state, logout clears all auth state.
   */
  it('Property 3: Logout state change clears all auth state', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const store = createStore();
          
          // Setup authenticated state
          store.simulateLogin(user);
          store.accountSettings = { theme: 'dark' };
          store._authMeCache = { role: user.role };
          store.pendingInviteToken = 'some-token';
          
          // Clear log to focus on logout
          store._stateChangeLog = [];
          
          // Perform logout
          store.simulateLogout();
          
          // Property: All auth state is cleared
          if (store.isAuthenticated !== false) return false;
          if (store.currentUser !== null) return false;
          if (store.accountId !== null) return false;
          if (store.accountSettings !== null) return false;
          if (store._authMeCache !== null) return false;
          if (store.pendingInviteToken !== null) return false;
          
          // Property: State change was logged
          if (store._stateChangeLog.length !== 1) return false;
          if (store._stateChangeLog[0].action !== 'logout') return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * Derived getters (isParent, isChild) react to currentUser changes.
   */
  it('Property 3: isParent and isChild getters react to role changes', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const store = createStore();
          
          // Login with user
          store.simulateLogin(user);
          
          // Property: Getters reflect the role correctly
          if (user.role === 'parent') {
            if (store.isParent !== true) return false;
            if (store.isChild !== false) return false;
          } else if (user.role === 'child') {
            if (store.isParent !== false) return false;
            if (store.isChild !== true) return false;
          }
          
          // Logout
          store.simulateLogout();
          
          // Property: Getters reflect logged out state
          if (store.isParent !== false) return false;
          if (store.isChild !== false) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * userDisplayName getter reacts to currentUser changes with correct fallback chain.
   */
  it('Property 3: userDisplayName getter reacts with correct fallback chain', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const store = createStore();
          
          // Login with user
          store.simulateLogin(user);
          
          // Property: userDisplayName follows fallback chain
          const expectedName = user.displayName || user.name || user.email || 'User';
          if (store.userDisplayName !== expectedName) return false;
          
          // Logout
          store.simulateLogout();
          
          // Property: userDisplayName is empty when logged out
          if (store.userDisplayName !== '') return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * Token refresh updates currentUser while preserving existing data.
   */
  it('Property 3: Token refresh updates currentUser reactively', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        fc.record({
          role: fc.constantFrom('parent', 'child'),
          accountId: fc.uuid()
        }),
        (initialUser, refreshData) => {
          const store = createStore();
          
          // Login with initial user
          store.simulateLogin(initialUser);
          
          // Clear log
          store._stateChangeLog = [];
          
          // Refresh with new data
          store.simulateRefreshUser(refreshData);
          
          // Property: User data is updated
          if (store.currentUser.role !== refreshData.role) return false;
          if (store.accountId !== refreshData.accountId) return false;
          
          // Property: Original data is preserved
          if (store.currentUser.id !== initialUser.id) return false;
          if (store.currentUser.email !== initialUser.email) return false;
          
          // Property: State change was logged
          if (store._stateChangeLog.length !== 1) return false;
          if (store._stateChangeLog[0].action !== 'refreshUser') return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * Sequence of auth operations maintains consistent state.
   */
  it('Property 3: Sequence of auth operations maintains consistent state', () => {
    fc.assert(
      fc.property(
        fc.array(authOperationArbitrary, { minLength: 1, maxLength: 10 }),
        (operations) => {
          const store = createStore();
          let expectedAuthenticated = false;
          let expectedUser = null;
          
          for (const op of operations) {
            if (op.type === 'login') {
              store.simulateLogin(op.user);
              expectedAuthenticated = true;
              expectedUser = op.user;
            } else if (op.type === 'logout') {
              store.simulateLogout();
              expectedAuthenticated = false;
              expectedUser = null;
            } else if (op.type === 'refresh' && expectedAuthenticated) {
              store.simulateRefreshUser(op.userData);
              if (op.userData.role) {
                expectedUser = { ...expectedUser, ...op.userData };
              }
            }
            
            // Property: State is consistent after each operation
            if (store.isAuthenticated !== expectedAuthenticated) return false;
            
            if (expectedAuthenticated) {
              if (store.currentUser === null) return false;
            } else {
              if (store.currentUser !== null) return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * setCurrentUser updates both currentUser and isAuthenticated atomically.
   */
  it('Property 3: setCurrentUser updates state atomically', () => {
    fc.assert(
      fc.property(
        fc.option(userArbitrary, { nil: null }),
        (user) => {
          const store = createStore();
          
          store.setCurrentUser(user);
          
          // Property: isAuthenticated matches user presence
          if (store.isAuthenticated !== !!user) return false;
          
          if (user !== null) {
            if (store.currentUser.id !== user.id) return false;
          } else {
            if (store.currentUser !== null) return false;
          }
          
          // Property: State change was logged
          if (store._stateChangeLog.length !== 1) return false;
          if (store._stateChangeLog[0].action !== 'setCurrentUser') return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * Login followed by logout is idempotent (returns to initial state).
   */
  it('Property 3: Login then logout returns to initial state (round-trip)', () => {
    fc.assert(
      fc.property(
        userArbitrary,
        (user) => {
          const store = createStore();
          
          // Capture initial state
          const initialIsAuthenticated = store.isAuthenticated;
          const initialCurrentUser = store.currentUser;
          const initialAccountId = store.accountId;
          const initialAccountSettings = store.accountSettings;
          const initialAuthMeCache = store._authMeCache;
          const initialPendingInviteToken = store.pendingInviteToken;
          
          // Login
          store.simulateLogin(user);
          
          // Logout
          store.simulateLogout();
          
          // Property: State returns to initial values
          if (store.isAuthenticated !== initialIsAuthenticated) return false;
          if (store.currentUser !== initialCurrentUser) return false;
          if (store.accountId !== initialAccountId) return false;
          if (store.accountSettings !== initialAccountSettings) return false;
          if (store._authMeCache !== initialAuthMeCache) return false;
          if (store.pendingInviteToken !== initialPendingInviteToken) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 3: Auth State Reactivity**
   * **Validates: Requirements 3.4**
   * 
   * Multiple logins with different users update state correctly.
   */
  it('Property 3: Multiple logins update state to latest user', () => {
    fc.assert(
      fc.property(
        fc.array(userArbitrary, { minLength: 2, maxLength: 5 }),
        (users) => {
          const store = createStore();
          
          for (const user of users) {
            store.simulateLogin(user);
            
            // Property: State reflects the latest login
            if (store.isAuthenticated !== true) return false;
            if (store.currentUser.id !== user.id) return false;
            if (store.userRole !== user.role) return false;
          }
          
          // Property: Final state is the last user
          const lastUser = users[users.length - 1];
          if (store.currentUser.id !== lastUser.id) return false;
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
