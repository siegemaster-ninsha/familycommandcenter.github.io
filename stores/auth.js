// Authentication Store
// Manages user authentication state and operations

const useAuthStore = Pinia.defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    currentUser: null,
    loading: false,
    error: null,
    
    // Form states (could be moved to UI store, but keeping here for cohesion)
    authForm: {
      mode: 'parent',
      email: '',
      username: '',
      password: '',
      name: '',
      confirmationCode: ''
    }
  }),
  
  getters: {
    // check if user is a parent
    isParent: (state) => {
      return state.currentUser?.role === 'parent';
    },
    
    // check if user is a child
    isChild: (state) => {
      return state.currentUser?.role === 'child';
    },
    
    // get display name
    userDisplayName: (state) => {
      if (!state.currentUser) return '';
      return state.currentUser.displayName || state.currentUser.name || state.currentUser.email || '';
    },
    
    // get user role
    userRole: (state) => {
      return state.currentUser?.role || null;
    },
    
    // get account ID
    accountId: (state) => {
      return state.currentUser?.accountId || null;
    }
  },
  
  actions: {
    // initialize authentication from existing authService
    async initAuth() {
      this.loading = true;
      this.error = null;
      
      try {
        // use authService's initializeAuth method
        const initialized = await authService.initializeAuth();
        
        if (initialized && authService.currentUser) {
          this.isAuthenticated = true;
          this.currentUser = authService.currentUser;
          console.log('✅ Auth store initialized, user:', this.userDisplayName);
        } else {
          this.isAuthenticated = false;
          this.currentUser = null;
          console.log('ℹ️ No active session found');
        }
      } catch (error) {
        console.error('Auth store initialization error:', error);
        this.error = error.message;
        this.isAuthenticated = false;
        this.currentUser = null;
      } finally {
        this.loading = false;
      }
    },
    
    // login with email and password
    async login(email, password) {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await authService.signIn(email, password);
        
        // authService.signIn returns { success: true, user } or throws error
        this.isAuthenticated = true;
        this.currentUser = result.user || authService.currentUser;
        console.log('✅ Login successful:', this.userDisplayName);
        return { success: true };
      } catch (error) {
        this.error = error.message || 'Login failed';
        this.isAuthenticated = false;
        this.currentUser = null;
        console.error('Login error:', error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
    
    // sign up new user
    async signup(email, password, name) {
      this.loading = true;
      this.error = null;
      
      try {
        // authService.signUp returns { success, userSub, confirmationRequired, username } or throws
        const result = await authService.signUp(email, password, name);
        
        console.log('✅ Signup successful, confirmation required:', result.confirmationRequired);
        return { 
          success: true, 
          requiresConfirmation: result.confirmationRequired,
          username: result.username
        };
      } catch (error) {
        this.error = error.message || 'Signup failed';
        console.error('Signup error:', error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
    
    // confirm signup with code
    async confirmSignup(username, code) {
      this.loading = true;
      this.error = null;
      
      try {
        // authService.confirmSignUp throws on error, returns nothing on success
        await authService.confirmSignUp(username, code);
        console.log('✅ Signup confirmed');
        return { success: true };
      } catch (error) {
        this.error = error.message || 'Confirmation failed';
        console.error('Confirmation error:', error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
    
    // logout
    async logout() {
      this.loading = true;
      this.error = null;
      
      try {
        // authService.signOut() clears everything, doesn't return anything
        await authService.signOut();
        this.isAuthenticated = false;
        this.currentUser = null;
        this.resetForm();
        console.log('✅ Logout successful');
        return { success: true };
      } catch (error) {
        // logout shouldn't really fail, but handle it anyway
        this.error = error.message || 'Logout failed';
        console.error('Logout error:', error);
        // still clear local state even if API call failed
        this.isAuthenticated = false;
        this.currentUser = null;
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },
    
    // update current user info
    setCurrentUser(user) {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    },
    
    // reset auth form
    resetForm() {
      this.authForm = {
        mode: 'parent',
        email: '',
        username: '',
        password: '',
        name: '',
        confirmationCode: ''
      };
    },
    
    // clear error
    clearError() {
      this.error = null;
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useAuthStore = useAuthStore;
}

