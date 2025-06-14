const { createApp } = Vue;

const app = createApp({
  data() {
    return {
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
      people: [
        { id: 'ben', name: 'Ben', earnings: 0, electronicsStatus: { status: 'allowed', message: 'Electronics allowed' } },
        { id: 'theo', name: 'Theo', earnings: 0, electronicsStatus: { status: 'allowed', message: 'Electronics allowed' } }
      ],
      showAddPersonModal: false,
      newPerson: { name: '' },
      showDeletePersonModal: false,
      personToDelete: null,
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
      showSuccessMessage: false,
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
      this.people.forEach(person => {
        grouped[person.name] = [];
      });
      
      this.chores.forEach(chore => {
        if (grouped[chore.assignedTo]) {
          grouped[chore.assignedTo].push(chore);
        }
      });
      
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
        const found = this.chores.find(chore => chore.id === this.selectedChoreId) || null;
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
        
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          ...options
        });
        
        console.log(`📡 Response status: ${response.status} for ${endpoint}`);
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText} for ${endpoint}`);
        }
        
        const data = await response.json();
        console.log(`✅ API call successful for ${endpoint}:`, data);
        return data;
      } catch (error) {
        console.error(`❌ API Error for ${endpoint}:`, error);
        // Don't set this.error here as it will be handled by individual methods
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
        
        await Promise.all([
          this.loadChores(),
          this.loadEarnings(),
          this.loadElectronicsStatus(),
          this.loadQuicklistChores()
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
            person.electronicsStatus = response.electronicsStatus || 
              { status: 'allowed', message: 'Electronics allowed' };
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
          
          await this.apiCall(CONFIG.API.ENDPOINTS.PEOPLE, {
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
    
    confirmDeletePerson(person) {
      this.personToDelete = person;
      this.showDeletePersonModal = true;
    },
    
    async deletePerson() {
      if (this.personToDelete) {
        try {
          await this.apiCall(`${CONFIG.API.ENDPOINTS.PEOPLE}/${this.personToDelete.id}`, {
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
    
    cancelDeletePerson() {
      this.personToDelete = null;
      this.showDeletePersonModal = false;
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
          this.showSuccessMessage = true;
          this.completedChoreMessage = `${chore.name} completed!`;
          
          setTimeout(() => {
            this.showSuccessMessage = false;
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
    }
  },
  
  async mounted() {
    await this.loadAllData();
  },

  // Add method for click-to-assign functionality
  async assignSelectedChore(assignTo) {
    if (!this.selectedChore) return;
    
    try {
      if (this.selectedChore.isNewFromQuicklist) {
        // This is a new chore from quicklist
        const choreData = {
          name: this.selectedChore.name,
          amount: this.selectedChore.amount,
          category: this.selectedChore.category,
          assignedTo: assignTo
        };
        await this.apiCall(CONFIG.API.ENDPOINTS.CHORES, {
          method: 'POST',
          body: JSON.stringify(choreData)
        });
      } else {
        // This is an existing chore being moved
        await this.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.selectedChore.id}/assign`, {
          method: 'PUT',
          body: JSON.stringify({ assignedTo: assignTo })
        });
      }
      
      // Reload data to get updated state
      await this.loadChores();
      await this.loadEarnings();
      await this.loadElectronicsStatus();
      
      // Clear selection
      this.selectedChoreId = null;
      this.selectedQuicklistChore = null;
    } catch (error) {
      console.error('Failed to assign chore:', error);
    }
  },

  provide() {
    return {
      // Provide reactive data to child components
      loading: Vue.computed(() => this.loading),
      error: Vue.computed(() => this.error),
      selectedChore: Vue.computed(() => this.selectedChore),
      showSuccessMessage: Vue.computed(() => this.showSuccessMessage),
      completedChoreMessage: Vue.computed(() => this.completedChoreMessage),
      showConfetti: Vue.computed(() => this.showConfetti),
      confettiPieces: Vue.computed(() => this.confettiPieces),
      quicklistChores: Vue.computed(() => this.quicklistChores),
      showAddToQuicklistModal: Vue.computed(() => this.showAddToQuicklistModal),
      choresByPerson: Vue.computed(() => this.choresByPerson),
      showAddChoreModal: Vue.computed(() => this.showAddChoreModal),
      people: Vue.computed(() => this.people),
      showAddPersonModal: Vue.computed(() => this.showAddPersonModal),
      isDragOverTrash: Vue.computed(() => this.isDragOverTrash),
      showDeleteModal: Vue.computed(() => this.showDeleteModal),
      choreToDelete: Vue.computed(() => this.choreToDelete),
      newQuicklistChore: Vue.computed(() => this.newQuicklistChore),
      newPerson: Vue.computed(() => this.newPerson),
      showDeletePersonModal: Vue.computed(() => this.showDeletePersonModal),
      personToDelete: Vue.computed(() => this.personToDelete),
      newChore: Vue.computed(() => this.newChore),
      loadAllData: this.loadAllData
    };
  }
});

// Register all components
if (window.UIComponents) {
  Object.entries(window.UIComponents).forEach(([name, component]) => {
    app.component(name, component);
  });
}

if (window.QuicklistSectionComponent) {
  app.component('QuicklistSection', window.QuicklistSectionComponent);
}

if (window.UnassignedSectionComponent) {
  app.component('UnassignedSection', window.UnassignedSectionComponent);
}

if (window.FamilyMembersSectionComponent) {
  app.component('FamilyMembersSection', window.FamilyMembersSectionComponent);
}

if (window.TrashSectionComponent) {
  app.component('TrashSection', window.TrashSectionComponent);
}

if (window.AppModalsComponent) {
  app.component('AppModals', window.AppModalsComponent);
}

// Mount the app
app.mount('#app'); 