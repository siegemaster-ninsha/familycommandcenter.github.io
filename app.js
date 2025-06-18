const { createApp } = Vue;

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
        email: '',
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
        addToQuicklist: false
      },
      showAddToQuicklistModal: false,
      newQuicklistChore: {
        name: '',
        amount: 0,
        category: 'regular'
      },
      // Person management
      people: [],
      showAddPersonModal: false,
      newPerson: { name: '' },
      showDeletePersonModal: false,
      personToDelete: null,
      // New Day functionality
      showNewDayModal: false,
      // Spending modal
      showSpendingModal: false,
      selectedPerson: null,
      spendAmount: 0,
      spendAmountString: '0',
      // Page navigation
      currentPage: 'chores', // Default to chores page
      // Existing data
      chores: [],
      draggedChore: null,
      selectedChoreId: null, // Changed from selectedChore to selectedChoreId
      selectedQuicklistChore: null, // For quicklist selections
      isDragOverTrash: false,
      choreToDelete: null,
      showDeleteModal: false,
      showConfetti: false,
      confettiPieces: [],
      showSuccessMessageFlag: false,
      completedChoreMessage: '',
      quicklistChores: [],
      loading: true,
      error: null
    }
  },
  computed: {
    choresByPerson() {
      console.log('choresByPerson computed property recalculating...');
      console.log('Current selectedChoreId:', this.selectedChoreId);
      
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
      console.log('selectedChore computed property recalculating...');
      console.log('selectedChoreId:', this.selectedChoreId);
      console.log('selectedQuicklistChore:', this.selectedQuicklistChore);
      
      if (this.selectedQuicklistChore) {
        return this.selectedQuicklistChore;
      }
      
      if (this.selectedChoreId) {
        if (!Array.isArray(this.chores)) {
          console.warn('Chores is not an array:', this.chores);
          return null;
        }
        
        const found = this.chores.find(chore => chore && chore.id === this.selectedChoreId) || null;
        console.log('Found chore for selection:', found?.name || 'null');
        return found;
      }
      
      return null;
    }
  },
  methods: {
    // API helper methods
    async apiCall(endpoint, options = {}) {
      try {
        const url = CONFIG.getApiUrl(endpoint);
        console.log(`🌐 Making API call to: ${url}`);
        
        // add authentication header if user is logged in
        const authHeader = authService.getAuthHeader();
        const headers = {
          'Content-Type': 'application/json',
          ...options.headers
        };
        
        if (authHeader) {
          headers.Authorization = authHeader;
        }
        
        const response = await fetch(url, {
          headers,
          ...options
        });
        
        console.log(`📡 Response status: ${response.status} for ${endpoint}`);
        
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
        console.log(`✅ API call successful for ${endpoint}:`, data);
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
    
    // Data loading methods
    async loadAllData() {
      try {
        this.loading = true;
        this.error = null;
        console.log('🔄 Starting to load data...');
        console.log('🌐 API Base URL:', CONFIG.API.BASE_URL);
        
        // check authentication first
        if (!this.isAuthenticated) {
          console.log('🔒 User not authenticated, skipping data load');
          this.loading = false;
          return;
        }
        
        await Promise.all([
          this.loadChores(),
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadQuicklistChores(),
          this.loadFamilyMembers() // Add this to load family members from backend
        ]);
        console.log('✅ All data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load data:', error);
        this.error = `Failed to load data: ${error.message}. Please check your connection and API configuration.`;
      } finally {
        this.loading = false;
        console.log('🏁 Loading complete. Loading state:', this.loading);
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
    
    async loadFamilyMembers() {
      try {
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
        if (response.familyMembers && response.familyMembers.length > 0) {
          // Update the people array with family members from backend
          this.people = response.familyMembers.map(member => ({
            id: member.name.toLowerCase(),
            name: member.name,
            earnings: member.earnings || 0,
            electronicsStatus: { status: 'allowed', message: 'Electronics allowed' }
          }));
        } else {
          // No family members in backend - start with empty array
          this.people = [];
          console.log('No family members found in backend, starting with empty family');
        }
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
    
    async loadQuicklistChores() {
      try {
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST);
        this.quicklistChores = response.quicklistChores || [];
      } catch (error) {
        console.error('Failed to load quicklist chores:', error);
        this.quicklistChores = [];
      }
    },

    async loadUserTheme() {
      try {
        console.log('🎨 Loading user theme from account settings...');
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
        
        console.log('🎨 Account settings response:', response);
        
        if (response && response.theme) {
          console.log('🎨 Found user theme:', response.theme);
          // Apply the user's saved theme
          ThemeManager.applyTheme(response.theme);
          // Also save to localStorage for offline access
          localStorage.setItem('selectedTheme', response.theme);
        } else {
          console.log('🎨 No theme found in account settings, using current theme');
          // If no theme in backend, keep the current localStorage theme
          const localTheme = localStorage.getItem('selectedTheme') || 'default';
          console.log('🎨 Using existing localStorage theme:', localTheme);
          ThemeManager.applyTheme(localTheme);
        }
      } catch (error) {
        console.error('Failed to load user theme:', error);
        // Fallback to localStorage theme if backend fails
        const localTheme = localStorage.getItem('selectedTheme') || 'default';
        console.log('🎨 Using fallback theme from localStorage:', localTheme);
        ThemeManager.applyTheme(localTheme);
      }
    },
    
    // Drag and drop methods
    handleDragStart(chore) {
      console.log('Starting drag for chore:', chore.name);
      this.draggedChore = chore;
      this.selectedChoreId = chore.id;
    },
    
    handleDragEnd() {
      console.log('Drag ended');
      this.draggedChore = null;
      this.isDragOverTrash = false;
    },
    
    handleDragOver(event) {
      event.preventDefault();
    },
    
    handleDragEnter(event) {
      event.preventDefault();
    },
    
    handleDragLeave() {
      // Keep drag state for visual feedback
    },
    
    handleTrashDragOver(event) {
      event.preventDefault();
      this.isDragOverTrash = true;
    },
    
    handleTrashDragLeave() {
      this.isDragOverTrash = false;
    },
    
    async handleDrop(event, targetPerson) {
      event.preventDefault();
      
      if (this.draggedChore) {
        try {
          // Check if it's a quicklist chore being dropped
          if (this.draggedChore.isNewFromQuicklist) {
            // Create new chore from quicklist
            const newChoreData = {
              name: this.draggedChore.name,
              amount: this.draggedChore.amount,
              category: this.draggedChore.category,
              assignedTo: targetPerson,
              completed: false
            };
            
            await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
              method: 'POST',
              body: JSON.stringify(newChoreData)
            });
            
            console.log('Created new chore from quicklist');
          } else {
            // Update existing chore assignment
            const updatedChore = {
              ...this.draggedChore,
              assignedTo: targetPerson
            };
            
            await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.draggedChore.id}`, {
              method: 'PUT',
              body: JSON.stringify(updatedChore)
            });
            
            console.log('Updated chore assignment');
          }
          
          await this.loadChores();
          await this.loadEarnings();
          await this.loadElectronicsStatus();
        } catch (error) {
          console.error('Failed to update chore:', error);
        }
        
        this.draggedChore = null;
        this.selectedChoreId = null;
      }
    },
    
    // Chore selection methods
    handleChoreClick(chore) {
      console.log('Chore clicked:', chore.name);
      
      // If the same chore is clicked again, deselect it
      if (this.selectedChoreId === chore.id) {
        this.selectedChoreId = null;
        console.log('Deselected chore');
      } else {
        this.selectedChoreId = chore.id;
        this.selectedQuicklistChore = null; // Clear quicklist selection
        console.log('Selected chore:', chore.name);
      }
    },
    
    handleQuicklistChoreClick(chore) {
      console.log('Quicklist chore clicked:', chore.name);
      
      // If the same quicklist chore is clicked again, deselect it
      if (this.selectedQuicklistChore && this.selectedQuicklistChore.id === chore.id) {
        this.selectedQuicklistChore = null;
        console.log('Deselected quicklist chore');
      } else {
        this.selectedQuicklistChore = { ...chore, isNewFromQuicklist: true };
        this.selectedChoreId = null; // Clear regular chore selection
        console.log('Selected quicklist chore:', chore.name);
      }
    },
    
    // Person management methods
    async addPerson() {
      if (this.newPerson.name.trim()) {
        try {
          const personData = {
            name: this.newPerson.name.trim()
          };
          
          await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS, {
            method: 'POST',
            body: JSON.stringify(personData)
          });
          
          // Add person to local array
          this.people.push({
            id: this.newPerson.name.trim().toLowerCase(),
            name: this.newPerson.name.trim(),
            earnings: 0,
            electronicsStatus: { status: 'allowed', message: 'Electronics allowed' }
          });
          
          this.cancelAddPerson();
        } catch (error) {
          console.error('Failed to add person:', error);
        }
      }
    },
    
    cancelAddPerson() {
      this.showAddPersonModal = false;
      this.newPerson = { name: '' };
    },

    openAddPersonModal() {
      this.showAddPersonModal = true;
    },
    
    confirmDeletePerson(person) {
      this.personToDelete = person;
      this.showDeletePersonModal = true;
    },
    
    async deletePerson() {
      if (this.personToDelete) {
        try {
          await this.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${this.personToDelete.id}`, {
            method: 'DELETE'
          });
          
          // Remove person from local array
          this.people = this.people.filter(p => p.id !== this.personToDelete.id);
          
          // Reload data to update any affected chores
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
        }
        
        this.personToDelete = null;
        this.showDeletePersonModal = false;
      }
    },
    
    async executeDeletePerson() {
      if (this.personToDelete) {
        try {
          // First, unassign all chores from this person
          this.chores.forEach(chore => {
            if (chore.assignedTo === this.personToDelete.name) {
              chore.assignedTo = 'unassigned';
              // Update the chore in the backend
              this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/assign`, {
                method: 'PUT',
                body: JSON.stringify({ assignedTo: 'unassigned' })
              }).catch(error => console.error('Failed to unassign chore:', error));
            }
          });
          
          // Remove the person from the array
          const index = this.people.findIndex(p => p.id === this.personToDelete.id);
          if (index > -1) {
            this.people.splice(index, 1);
          }
          
          // Reload data to ensure consistency
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
        }
        
        this.cancelDeletePerson();
      }
    },
    
    cancelDeletePerson() {
      this.personToDelete = null;
      this.showDeletePersonModal = false;
    },
    
    deletePerson(person) {
      this.personToDelete = person;
      this.showDeletePersonModal = true;
    },
    
    // Chore management methods
    async addChore() {
      if (this.newChore.name.trim() && this.newChore.amount >= 0) {
        try {
          const choreData = {
            name: this.newChore.name.trim(),
            amount: this.newChore.amount,
            category: this.newChore.category,
            assignedTo: 'unassigned',
            completed: false
          };
          
          await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          // Also add to quicklist if requested
          if (this.newChore.addToQuicklist) {
            const quicklistData = {
              name: this.newChore.name.trim(),
              amount: this.newChore.amount,
              category: this.newChore.category
            };
            
            await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST, {
              method: 'POST',
              body: JSON.stringify(quicklistData)
            });
            
            await this.loadQuicklistChores();
          }
          
          await this.loadChores();
          this.cancelAddChore();
        } catch (error) {
          console.error('Failed to add chore:', error);
        }
      }
    },
    
    cancelAddChore() {
      this.showAddChoreModal = false;
      this.newChore = { name: '', amount: 0, category: 'regular', addToQuicklist: false };
    },
    
    async addToQuicklist() {
      if (this.newQuicklistChore.name.trim() && this.newQuicklistChore.amount >= 0) {
        try {
          const quicklistData = {
            name: this.newQuicklistChore.name.trim(),
            amount: this.newQuicklistChore.amount,
            category: this.newQuicklistChore.category
          };
          
          await this.apiCall(CONFIG.API.ENDPOINTS.QUICKLIST, {
            method: 'POST',
            body: JSON.stringify(quicklistData)
          });
          
          await this.loadQuicklistChores();
          this.cancelAddToQuicklist();
        } catch (error) {
          console.error('Failed to add to quicklist:', error);
        }
      }
    },
    
    cancelAddToQuicklist() {
      this.showAddToQuicklistModal = false;
      this.newQuicklistChore = { name: '', amount: 0, category: 'regular' };
    },

    // New Day functionality
    async startNewDay() {
      try {
        this.loading = true;
        console.log('🌅 Starting new day...');
        
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES_NEW_DAY, {
          method: 'POST',
          body: JSON.stringify({
            dailyChores: [] // Could be extended later to include predefined daily chores
          })
        });
        
        console.log('✅ New day started:', response);
        
        // Reload all data to reflect changes
        await this.loadAllData();
        
        // Show success message
        this.showSuccessMessageFlag = true;
        this.completedChoreMessage = `🌅 New day started! ${response.choresCleared} chores cleared, earnings preserved.`;
        
        // Hide success message after delay
        setTimeout(() => {
          this.showSuccessMessageFlag = false;
        }, CONFIG.APP.SUCCESS_MESSAGE_DURATION);
        
        this.showNewDayModal = false;
      } catch (error) {
        console.error('❌ Failed to start new day:', error);
        this.error = `Failed to start new day: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },

    cancelNewDay() {
      this.showNewDayModal = false;
    },

    // Page navigation
    setCurrentPage(page) {
      this.currentPage = page;
      console.log('📄 Switched to page:', page);
    },

    // Authentication and user management
    async handleAuthenticationRequired() {
      console.log('🔒 Authentication required - clearing auth state');
      this.isAuthenticated = false;
      this.currentUser = null;
      
      // Clear all data since user is no longer authenticated
      this.chores = [];
      this.people = [];
      this.quicklistChores = [];
      
      // Clear any ongoing operations
      this.selectedChoreId = null;
      this.selectedQuicklistChore = null;
      
      // Show login modal
      this.showLoginModal = true;
    },

    async handleLogin() {
      try {
        this.authLoading = true;
        this.authError = null;
        
        const result = await authService.signIn(this.authForm.email, this.authForm.password);
        
        if (result.success) {
          this.isAuthenticated = true;
          this.currentUser = result.user;
          this.closeAuthModals();
          this.clearAuthForm();
          
          console.log('✅ Login successful, loading user data...');
          
          // Load user theme first to prevent flash of wrong theme
          await this.loadUserTheme();
          
          // Load all data for the newly authenticated user
          await this.loadAllData();
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
          this.authForm.email, 
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
            
            console.log('✅ Account confirmed and logged in, loading user data...');
            
            // Load user theme first to prevent flash of wrong theme
            await this.loadUserTheme();
            
            // Load all data for the newly authenticated user
            await this.loadAllData();
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
        console.log('🚪 Logging out user...');
        
        await authService.signOut();
        
        // Clear authentication state
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Clear all data since user is no longer authenticated
        this.chores = [];
        this.people = [];
        this.quicklistChores = [];
        
        // Clear any ongoing operations
        this.selectedChoreId = null;
        this.selectedQuicklistChore = null;
        
        // Reset to default theme on logout
        console.log('🎨 Resetting to default theme on logout');
        ThemeManager.applyTheme('default');
        localStorage.setItem('selectedTheme', 'default');
        
        // Reset to chores page
        this.currentPage = 'chores';
        
        console.log('✅ Logout successful');
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
      console.log('🔐 showLoginForm() called');
      this.showSignupModal = false;
      this.showConfirmModal = false;
      this.showLoginModal = true;
      this.clearAuthForm();
      console.log('🔐 Login modal should now be visible:', this.showLoginModal);
    },

    showSignupForm() {
      console.log('📝 showSignupForm() called');
      this.showLoginModal = false;
      this.showConfirmModal = false;
      this.showSignupModal = true;
      this.clearAuthForm();
      console.log('📝 Signup modal should now be visible:', this.showSignupModal);
    },

    closeAuthModals() {
      this.showLoginModal = false;
      this.showSignupModal = false;
      this.showConfirmModal = false;
      this.clearAuthForm();
    },

    clearAuthForm() {
      this.authForm = {
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
    
    async handleTrashDrop(event) {
      event.preventDefault();
      this.isDragOverTrash = false;
      if (this.draggedChore) {
        // Only delete if it's an existing chore (not a new one from quicklist)
        if (!this.draggedChore.isNewFromQuicklist && this.draggedChore.id) {
          try {
            await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.draggedChore.id}`, {
              method: 'DELETE'
            });
            await this.loadChores();
            await this.loadEarnings();
            await this.loadElectronicsStatus();
          } catch (error) {
            console.error('Failed to delete chore:', error);
          }
        }
        this.draggedChore = null;
      }
    },
    
    async confirmDelete() {
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.choreToDelete.id}`, {
          method: 'DELETE'
        });
        await this.loadChores();
        await this.loadEarnings();
        await this.loadElectronicsStatus();
      } catch (error) {
        console.error('Failed to delete chore:', error);
      }
      
      this.choreToDelete = null;
      this.showDeleteModal = false;
    },
    
    cancelDelete() {
      this.choreToDelete = null;
      this.showDeleteModal = false;
    },
    
    async handleChoreCompletion(chore) {
      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        if (chore.completed) {
          this.triggerConfetti();
          this.showSuccessMessageFlag = true;
          this.completedChoreMessage = `${chore.name} completed!`;
          
          setTimeout(() => {
            this.showSuccessMessageFlag = false;
          }, 3000);
        }
        
        await this.loadEarnings();
        await this.loadElectronicsStatus();
      } catch (error) {
        console.error('Failed to update chore completion:', error);
        // Revert the checkbox if API call failed
        chore.completed = !chore.completed;
      }
    },
    
    triggerConfetti() {
      this.confettiPieces = [];
      this.showConfetti = true;
      
      // Confetti colors for variety
      const colors = [
        '#607afb', '#34d399', '#fbbf24', '#f87171', '#a78bfa', 
        '#fb7185', '#60a5fa', '#4ade80', '#facc15', '#f472b6',
        '#06b6d4', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b'
      ];
      
      // Create explosive confetti pieces - 10x the celebration! 🎉
      for (let i = 0; i < 300; i++) {
        // Create explosion from bottom center, spreading outward
        const centerX = window.innerWidth / 2;
        const spreadRange = window.innerWidth * 0.3; // 30% of screen width
        const startX = centerX + (Math.random() - 0.5) * spreadRange;
        
        // Determine direction based on position relative to center
        let direction;
        const randomFactor = Math.random();
        if (randomFactor < 0.33) {
          direction = 'left';
        } else if (randomFactor < 0.66) {
          direction = 'right';
        } else {
          direction = 'center';
        }
        
        this.confettiPieces.push({
          id: i,
          left: startX,
          delay: Math.random() * 1.5, // Spread the explosion over 1.5 seconds
          direction: direction,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      
      // Hide confetti after animation (longer duration for the new animation)
      setTimeout(() => {
        this.showConfetti = false;
        this.confettiPieces = [];
      }, 4500);
    },

    // Add method for click-to-assign functionality
    async assignSelectedChore(assignTo) {
      if (!this.selectedChore) {
        console.warn('No chore selected for assignment');
        return;
      }
      
      if (!assignTo) {
        console.warn('No assignee specified');
        return;
      }
      
      try {
        console.log('Assigning chore:', this.selectedChore.name, 'to:', assignTo);
        
        if (this.selectedChore.isNewFromQuicklist) {
          // This is a new chore from quicklist
          const choreData = {
            name: this.selectedChore.name,
            amount: this.selectedChore.amount || 0,
            category: this.selectedChore.category || 'regular',
            assignedTo: assignTo,
            completed: false
          };
          
          const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
            method: 'POST',
            body: JSON.stringify(choreData)
          });
          
          console.log('Created new chore from quicklist:', response);
        } else {
          // This is an existing chore being moved
          if (!this.selectedChore.id) {
            console.error('Selected chore missing ID:', this.selectedChore);
            return;
          }
          
          const response = await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.selectedChore.id}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ assignedTo: assignTo })
          });
          
          console.log('Updated chore assignment:', response);
        }
        
        // Reload data to get updated state
        await this.loadChores();
        await this.loadEarnings();
        await this.loadElectronicsStatus();
        
        // Clear selection
        this.selectedChoreId = null;
        this.selectedQuicklistChore = null;
        
        console.log('Chore assignment completed successfully');
      } catch (error) {
        console.error('Failed to assign chore:', error);
        // Show user-friendly error message
        alert('Failed to assign chore. Please try again.');
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
      console.log('🎉 showSuccessMessage called with:', message);
      console.trace('showSuccessMessage call stack:');
      this.completedChoreMessage = message;
      this.showSuccessMessageFlag = true;
      setTimeout(() => {
        this.showSuccessMessageFlag = false;
        this.completedChoreMessage = '';
      }, 3000);
    },
    
    clearSuccessMessage() {
      console.log('🧹 Manually clearing success message');
      this.showSuccessMessageFlag = false;
      this.completedChoreMessage = '';
    },

    // Spending modal methods
    openSpendingModal(person) {
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
      if (this.spendAmount <= 0 || this.spendAmount > this.selectedPerson.earnings) {
        return;
      }

      try {
        await this.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${this.selectedPerson.name}/earnings`, {
          method: 'PUT',
          body: JSON.stringify({ 
            amount: Number(this.spendAmount),
            operation: 'subtract'
          })
        });

        // Store values before closing modal
        const personName = this.selectedPerson.name;
        const spentAmount = this.spendAmount;

        // Reload earnings data
        await this.loadEarnings();

        // Show success message
        this.triggerConfetti();
        this.showSuccessMessageFlag = true;
        this.completedChoreMessage = `${personName} spent $${spentAmount.toFixed(2)}!`;

        setTimeout(() => {
          this.showSuccessMessageFlag = false;
        }, 3000);

        // Close modal
        this.closeSpendingModal();
      } catch (error) {
        console.error('Error spending money:', error);
        alert('Failed to spend money. Please try again.');
      }
    }
  },
  
  watch: {
    selectedChoreId(newVal, oldVal) {
      if (oldVal && !newVal) {
        console.log('Selection cleared! Previous chore:', oldVal);
        console.trace('Selection cleared from:');
      } else if (newVal) {
        console.log('Chore selected:', newVal);
      }
    },
    
    showSuccessMessageFlag(newVal, oldVal) {
      console.log('🎉 showSuccessMessageFlag changed:', oldVal, '->', newVal);
      if (newVal) {
        console.log('📝 Success message content:', this.completedChoreMessage);
        console.trace('showSuccessMessageFlag set to true from:');
      }
    }
  },
  
  async mounted() {
    try {
      // Debug initial success message state
      console.log('🔍 Initial success message state:', {
        showSuccessMessageFlag: this.showSuccessMessageFlag,
        completedChoreMessage: this.completedChoreMessage
      });
      
      // Clear any stray success messages on app start
      if (this.showSuccessMessageFlag && !this.completedChoreMessage) {
        console.log('🧹 Clearing stray success message on app start');
        this.clearSuccessMessage();
      }
      
      // check authentication first
      console.log('🚀 App starting - checking authentication...');
      
      // check if authService exists
      if (typeof authService === 'undefined') {
        console.error('❌ authService not found! Check if auth.js loaded properly.');
        this.isAuthenticated = false;
        this.loading = false;
        return;
      }
      
      // wait a moment for authService to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isAuthenticated = await authService.initializeAuth();
      
      if (isAuthenticated) {
        this.isAuthenticated = true;
        this.currentUser = authService.currentUser;
        console.log('✅ User is authenticated:', this.currentUser);
        
        // Load user theme first to prevent flash of wrong theme
        await this.loadUserTheme();
        
        // Then load all other data
        await this.loadAllData();
      } else {
        console.log('❌ User not authenticated - ready for login');
        this.isAuthenticated = false;
        this.loading = false;
      }
    } catch (error) {
      console.error('❌ Error during app initialization:', error);
      this.isAuthenticated = false;
      this.loading = false;
    }
  },

  provide() {
    return {
      // Provide reactive data to child components
      // Readonly computed values for display data
      loading: Vue.computed(() => this.loading),
      error: Vue.computed(() => this.error),
      selectedChore: Vue.computed(() => this.selectedChore),
      showSuccessMessage: Vue.computed(() => this.showSuccessMessageFlag),
      completedChoreMessage: Vue.computed(() => this.completedChoreMessage),
      showConfetti: Vue.computed(() => this.showConfetti),
      confettiPieces: Vue.computed(() => this.confettiPieces),
      quicklistChores: Vue.computed(() => this.quicklistChores || []),
      choresByPerson: Vue.computed(() => this.choresByPerson || {}),
      people: Vue.computed(() => this.people || []),
      isDragOverTrash: Vue.computed(() => this.isDragOverTrash),
      choreToDelete: Vue.computed(() => this.choreToDelete),
      personToDelete: Vue.computed(() => this.personToDelete),
      
      // Modal state computed values (readonly)
      showAddToQuicklistModal: Vue.computed(() => this.showAddToQuicklistModal),
      showAddChoreModal: Vue.computed(() => this.showAddChoreModal),
      showAddPersonModal: Vue.computed(() => this.showAddPersonModal),
      showDeleteModal: Vue.computed(() => this.showDeleteModal),
      showDeletePersonModal: Vue.computed(() => this.showDeletePersonModal),
      showNewDayModal: Vue.computed(() => this.showNewDayModal),
      showSpendingModal: Vue.computed(() => this.showSpendingModal),
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
      
      // Provide methods that child components need
      loadAllData: this.loadAllData,
      assignSelectedChore: this.assignSelectedChore,
      setCurrentPage: this.setCurrentPage,
      confirmDeletePerson: this.confirmDeletePerson,
      addChore: this.addChore,
      cancelAddChore: this.cancelAddChore,
      addPerson: this.addPerson,
      cancelAddPerson: this.cancelAddPerson,
      openAddPersonModal: this.openAddPersonModal,
      addToQuicklist: this.addToQuicklist,
      cancelAddToQuicklist: this.cancelAddToQuicklist,
      startNewDay: this.startNewDay,
      cancelNewDay: this.cancelNewDay,
      confirmDelete: this.confirmDelete,
      cancelDelete: this.cancelDelete,
      deletePerson: this.deletePerson,
      executeDeletePerson: this.executeDeletePerson,
      cancelDeletePerson: this.cancelDeletePerson,
      triggerConfetti: this.triggerConfetti,
      loadEarnings: this.loadEarnings,
      showSuccessMessage: this.showSuccessMessage,
      
      // Spending modal methods
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
      closeAuthModals: this.closeAuthModals
    };
  }
});

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
    'ChorePageComponent',
    'AccountPageComponent'
  ];
  
  const missingComponents = requiredComponents.filter(comp => !window[comp]);
  
  if (missingComponents.length > 0) {
    console.log('⏳ Waiting for components:', missingComponents);
    setTimeout(checkAndRegisterComponents, 100); // Check again in 100ms
    return;
  }
  
  console.log('🔧 All components available, registering...');
  
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
  
  console.log('📦 Registering family-page');
  app.component('family-page', window.FamilyPageComponent);
  
  console.log('📦 Registering shopping-page');
  app.component('shopping-page', window.ShoppingPageComponent);
  
  console.log('📦 Registering chore-page');
  app.component('chore-page', window.ChorePageComponent);
  
  console.log('📦 Registering account-page');
  app.component('account-page', window.AccountPageComponent);

  console.log('✅ All components registered, mounting app...');
  
  // Mount the app
  app.mount('#app');
}

// Wait for DOM to be ready, then start checking for components
document.addEventListener('DOMContentLoaded', function() {
  checkAndRegisterComponents();
}); 