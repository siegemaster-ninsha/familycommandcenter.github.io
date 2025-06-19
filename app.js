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
        addToQuicklist: false,
        isDetailed: false
      },
      showAddToQuicklistModal: false,
      newQuicklistChore: {
        name: '',
        amount: 0,
        category: 'regular',
        isDetailed: false
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
        quicklistChoreId: null
      },
      // Person management
      people: [],
      showAddPersonModal: false,
      newPerson: { name: '' },
      showDeletePersonModal: false,
      personToDelete: null,
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
      // Existing data
      chores: [],
      selectedChoreId: null, // Changed from selectedChore to selectedChoreId
      selectedQuicklistChore: null, // For quicklist selections
      showConfetti: false,
      confettiPieces: [],
      showSuccessMessageFlag: false,
      completedChoreMessage: '',
      quicklistChores: [],
      
      // Shopping page data (preloaded for instant page switching)
      shoppingItems: [],
      shoppingQuickItems: [],
      stores: [],
      
      // Account page data (preloaded for instant page switching)
      accountSettings: null,
      accountId: null,
      
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
        console.log('🔄 Starting to load all application data...');
        console.log('🌐 API Base URL:', CONFIG.API.BASE_URL);
        
        // check authentication first
        if (!this.isAuthenticated) {
          console.log('🔒 User not authenticated, skipping data load');
          this.loading = false;
          return;
        }
        
        // Load all data for all pages in parallel for instant page switching
        await Promise.all([
          // Core chore page data
          this.loadChores(),
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadQuicklistChores(),
          this.loadFamilyMembers(),
          
          // Shopping page data
          this.loadShoppingItems(),
          this.loadShoppingQuickItems(),
          this.loadStores(),
          
          // Account page data
          this.loadAccountSettings()
        ]);
        console.log('✅ All application data loaded successfully');
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
    
    async loadFamilyMembers(preserveOptimisticUpdates = false) {
      try {
        console.log('👥 Loading family members, preserveOptimisticUpdates:', preserveOptimisticUpdates);
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
        console.log('👥 Family members API response:', response);
        
        if (response.familyMembers && response.familyMembers.length > 0) {
          if (preserveOptimisticUpdates) {
            console.log('👥 Merging with optimistic updates...');
            // Merge server data with existing optimistic updates
            response.familyMembers.forEach(serverMember => {
              const existingPerson = this.people.find(p => p.name === serverMember.name);
              if (existingPerson) {
                console.log(`👥 Merging ${serverMember.name}: existing completedChores=${existingPerson.completedChores}, server completedChores=${serverMember.completedChores}`);
                // Preserve optimistic completedChores count, but update other fields
                existingPerson.earnings = serverMember.earnings || 0;
                // Keep the existing completedChores if it's higher (optimistic update)
                existingPerson.completedChores = Math.max(existingPerson.completedChores || 0, serverMember.completedChores || 0);
                console.log(`👥 Result for ${serverMember.name}: completedChores=${existingPerson.completedChores}`);
              } else {
                console.log(`👥 Adding new person from server: ${serverMember.name}`);
                // New person from server
                this.people.push({
                  id: serverMember.name.toLowerCase(),
                  name: serverMember.name,
                  earnings: serverMember.earnings || 0,
                  completedChores: serverMember.completedChores || 0,
                  electronicsStatus: { status: 'allowed', message: 'Electronics allowed' }
                });
              }
            });
          } else {
            console.log('👥 Full refresh - replacing all family member data');
            console.log('👥 Server data:', response.familyMembers.map(m => `${m.name}: completedChores=${m.completedChores}`));
            // Normal full refresh - replace all data
            this.people = response.familyMembers.map(member => ({
              id: member.name.toLowerCase(),
              name: member.name,
              earnings: member.earnings || 0,
              completedChores: member.completedChores || 0,
              electronicsStatus: { status: 'allowed', message: 'Electronics allowed' }
            }));
            console.log('👥 Final people data:', this.people.map(p => `${p.name}: completedChores=${p.completedChores}`));
          }
        } else {
          // No family members in backend - start with empty array
          this.people = [];
          console.log('👥 No family members found in backend, starting with empty family');
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

    // Shopping page data loading methods
    async loadShoppingItems() {
      try {
        console.log('🛒 Loading shopping items...');
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_ITEMS);
        this.shoppingItems = response.items || [];
        console.log('✅ Shopping items loaded:', this.shoppingItems.length);
      } catch (error) {
        console.error('Failed to load shopping items:', error);
        this.shoppingItems = [];
      }
    },

    async loadShoppingQuickItems() {
      try {
        console.log('🛒 Loading shopping quick items...');
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.SHOPPING_QUICK_ITEMS);
        this.shoppingQuickItems = response.items || [];
        console.log('✅ Shopping quick items loaded:', this.shoppingQuickItems.length);
      } catch (error) {
        console.error('Failed to load shopping quick items:', error);
        this.shoppingQuickItems = [];
      }
    },

    async loadStores() {
      try {
        console.log('🏪 Loading stores...');
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.STORES);
        this.stores = response.stores || [];
        console.log('✅ Stores loaded:', this.stores.length);
      } catch (error) {
        console.error('Failed to load stores:', error);
        this.stores = [];
      }
    },

    // Account page data loading methods
    async loadAccountSettings() {
      try {
        console.log('⚙️ Loading account settings...');
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.ACCOUNT_SETTINGS);
        this.accountSettings = response;
        this.accountId = response?.accountId || null;
        console.log('✅ Account settings loaded:', this.accountSettings);
      } catch (error) {
        console.error('Failed to load account settings:', error);
        this.accountSettings = null;
        this.accountId = null;
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
    
    async performDeletePerson() {
      if (this.personToDelete) {
        try {
          console.log(`🗑️ Deleting family member: ${this.personToDelete.name}`);
          
          await this.apiCall(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${this.personToDelete.name}`, {
            method: 'DELETE'
          });
          
          console.log(`✅ Successfully deleted family member: ${this.personToDelete.name}`);
          
          // Remove person from local array
          this.people = this.people.filter(p => p.id !== this.personToDelete.id);
          
          // Reload data to update any affected chores
          await this.loadAllData();
        } catch (error) {
          console.error('Failed to delete person:', error);
          // Show error message to user
          this.showSuccessMessage(`❌ Failed to delete ${this.personToDelete.name}: ${error.message}`);
        }
        
        this.personToDelete = null;
        this.showDeletePersonModal = false;
      }
    },
    
    async executeDeletePerson() {
      // This method is deprecated - use performDeletePerson() instead
      console.warn('executeDeletePerson is deprecated, redirecting to performDeletePerson');
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
        console.log('🚀 Adding new chore:', this.newChore.name);
        
        // Check if this is a detailed chore
        if (this.newChore.isDetailed) {
          // Open details modal instead of creating immediately
          this.openChoreDetailsModal({
            name: this.newChore.name.trim(),
            amount: this.newChore.amount,
            category: this.newChore.category
          }, 'unassigned', false);
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
          
          console.log('✨ Optimistic UI updated - chore added');
          
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
          
          console.log('✅ Server confirmed chore creation');
          
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
        console.log('🚀 Optimistically adding to quicklist:', this.newQuicklistChore.name);
        
        // Store original state for potential rollback
        const originalQuicklistChores = [...this.quicklistChores];
        const quicklistData = {
          name: this.newQuicklistChore.name.trim(),
          amount: this.newQuicklistChore.amount,
          category: this.newQuicklistChore.category,
          isDetailed: this.newQuicklistChore.isDetailed || false
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
          
          console.log('✨ Optimistic UI updated - quicklist item added');
          
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
          
          console.log('✅ Server confirmed quicklist creation');
          
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
      this.newQuicklistChore = { name: '', amount: 0, category: 'regular', isDetailed: false };
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
        console.log('✅ Chore with details created successfully');
        
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
    async startNewDay() {
      try {
        this.newDayLoading = true;
        console.log('🌅 Starting new day...');
        console.log('📊 Current state before new day:');
        console.log('  - Chores count:', this.chores.length);
        console.log('  - Chores:', this.chores.map(c => `${c.name} (${c.assignedTo})`));
        console.log('  - People completed chores:', this.people.map(p => `${p.name}: ${p.completedChores}`));
        
        const response = await this.apiCall(CONFIG.API.ENDPOINTS.CHORES_NEW_DAY, {
          method: 'POST',
          body: JSON.stringify({
            dailyChores: [] // Could be extended later to include predefined daily chores
          })
        });
        
        console.log('✅ New day API response:', response);
        
        // Reload all data to reflect changes
        console.log('🔄 Reloading all data after new day...');
        await this.loadAllData();
        
        console.log('📊 State after reload:');
        console.log('  - Chores count:', this.chores.length);
        console.log('  - Chores:', this.chores.map(c => `${c.name} (${c.assignedTo})`));
        console.log('  - People completed chores:', this.people.map(p => `${p.name}: ${p.completedChores}`));
        
        // Show success message with more detail
        const deletedCount = response.deletedChores || 0;
        const createdCount = response.createdChores || 0;
        this.showSuccessMessage(`🌅 New day started! ${deletedCount} old chores cleared, ${createdCount} new chores created, earnings preserved.`);
        
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
    

    
    // Instant delete with optimistic updates
    async deleteChore(chore) {
      if (!chore || !chore.id) {
        console.warn('Invalid chore for deletion');
        return;
      }
      
      console.log('🚀 Optimistically deleting chore:', chore.name);
      
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
        
        console.log('✨ Optimistic UI updated - chore deleted');
        
        // Make API call in background
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}`, {
          method: 'DELETE'
        });
        
        console.log('✅ Server confirmed chore deletion');
        
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
        this.showSuccessMessage(`❌ Failed to delete "${chore.name}". Please try again.`);
      }
    },
    
    async handleChoreCompletion(chore) {
      console.log('🚀 Optimistically handling chore completion for:', chore.name, 'Current state:', chore.completed);
      
      // Store original state for potential rollback
      const originalCompleted = chore.completed;
      const originalEarnings = this.people.map(p => ({ name: p.name, earnings: p.earnings, completedChores: p.completedChores }));
      
      try {
        // OPTIMISTIC UPDATE: Update earnings and completed chores count immediately if assigned
        if (chore.assignedTo && chore.assignedTo !== 'unassigned') {
          const person = this.people.find(p => p.name === chore.assignedTo);
          if (person) {
            if (chore.completed) {
              // Chore was completed - add earnings and increment count
              person.earnings += chore.amount || 0;
              person.completedChores = (person.completedChores || 0) + 1;
            } else {
              // Chore was uncompleted - subtract earnings and decrement count
              person.earnings = Math.max(0, person.earnings - (chore.amount || 0));
              person.completedChores = Math.max(0, (person.completedChores || 0) - 1);
            }
            
            // OPTIMISTIC ELECTRONICS STATUS UPDATE: Update electronics status if this is an electronics chore
            if (chore.category === 'game') {
              this.updateElectronicsStatusOptimistically(person.name);
            }
          }
        }
        
        console.log('✨ Optimistic UI updated - earnings and completed count');
        
        // Show success message and trigger confetti immediately for completed chores
        if (chore.completed) {
          this.triggerConfetti();
          this.showSuccessMessage(`🎉 Great job! "${chore.name}" completed!`);
        } else {
          // Clear any success message for uncompleted chores
          this.showSuccessMessageFlag = false;
          this.completedChoreMessage = '';
        }
        
        // Make API call in background
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`, {
          method: 'PUT',
          body: JSON.stringify({ completed: chore.completed })
        });
        
        console.log('✅ Server confirmed chore completion');
        
        // Refresh data in background (non-blocking) to ensure consistency
        Promise.all([
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadFamilyMembers(true) // Preserve optimistic updates
        ]).catch(error => {
          console.warn('Background data refresh failed:', error);
        });
        
      } catch (error) {
        console.error('❌ Chore completion failed, rolling back optimistic update:', error);
        
        // ROLLBACK: Restore original state
        chore.completed = originalCompleted;
        
        // Restore original earnings
        originalEarnings.forEach(original => {
          const person = this.people.find(p => p.name === original.name);
          if (person) {
            person.earnings = original.earnings;
            person.completedChores = original.completedChores;
          }
        });
        
        // Clear any success messages
        this.showSuccessMessageFlag = false;
        this.completedChoreMessage = '';
        
        // Show error message
        this.showSuccessMessage(`❌ Failed to update "${chore.name}". Please try again.`);
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

    // Add method for click-to-assign functionality with optimistic updates
    async assignSelectedChore(assignTo) {
      if (!this.selectedChore) {
        console.warn('No chore selected for assignment');
        return;
      }
      
      if (!assignTo) {
        console.warn('No assignee specified');
        return;
      }
      
      console.log('🚀 Optimistically assigning chore:', this.selectedChore.name, 'to:', assignTo);
      
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
          
          console.log('✨ Optimistic UI updated - new chore added');
          
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
          
          console.log('✅ Server confirmed new chore creation');
          
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
          
          console.log('✨ Optimistic UI updated - chore moved');
          
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
          
          console.log('✅ Server confirmed chore assignment');
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
      personToDelete: Vue.computed(() => this.personToDelete),
      
      // Preloaded shopping page data
      shoppingItems: Vue.computed(() => this.shoppingItems || []),
      shoppingQuickItems: Vue.computed(() => this.shoppingQuickItems || []),
      stores: Vue.computed(() => this.stores || []),
      
      // Preloaded account page data
      accountSettings: Vue.computed(() => this.accountSettings),
      accountId: Vue.computed(() => this.accountId),
      
      // Modal state computed values (readonly)
      showAddToQuicklistModal: Vue.computed(() => this.showAddToQuicklistModal),
      showAddChoreModal: Vue.computed(() => this.showAddChoreModal),
      showAddPersonModal: Vue.computed(() => this.showAddPersonModal),
      showDeletePersonModal: Vue.computed(() => this.showDeletePersonModal),
      showNewDayModal: Vue.computed(() => this.showNewDayModal),
      newDayLoading: Vue.computed(() => this.newDayLoading),
      showSpendingModal: Vue.computed(() => this.showSpendingModal),
      showChoreDetailsModal: Vue.computed(() => this.showChoreDetailsModal),
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
      confirmChoreDetails: this.confirmChoreDetails,
      cancelChoreDetails: this.cancelChoreDetails,
      startNewDay: this.startNewDay,
      cancelNewDay: this.cancelNewDay,
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