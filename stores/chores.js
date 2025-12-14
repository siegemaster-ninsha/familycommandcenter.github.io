// Chores Store
// Manages chores, quicklist chores, and chore operations

const useChoresStore = Pinia.defineStore('chores', {
  state: () => ({
    chores: [],
    quicklistChores: [],
    selectedChoreId: null,
    selectedQuicklistChore: null,
    multiAssignSelectedMembers: [],
    loading: false,
    error: null,
    
    // form states
    newChore: {
      name: '',
      amount: 0,
      category: 'regular',
      addToQuicklist: false,
      isDetailed: false
    },
    
    newQuicklistChore: {
      name: '',
      amount: 0,
      category: 'regular',
      isDetailed: false
    },
    
    choreDetailsForm: {
      name: '',
      details: '',
      amount: 0,
      category: 'regular',
      assignedTo: '',
      isNewFromQuicklist: false
    }
  }),
  
  getters: {
    // get selected chore object
    selectedChore: (state) => {
      if (state.selectedQuicklistChore) {
        return state.selectedQuicklistChore;
      }
      if (state.selectedChoreId) {
        return state.chores.find(c => c.id === state.selectedChoreId) || null;
      }
      return null;
    },
    
    // group chores by person (uses displayName field)
    choresByPerson: (state) => {
      const useFamilyStore = window.useFamilyStore;
      if (!useFamilyStore) {
        console.warn('useFamilyStore not available yet');
        return { unassigned: state.chores.filter(c => !c.assignedTo) };
      }
      
      const familyStore = useFamilyStore();
      const grouped = {
        unassigned: []
      };
      
      // add each person to the grouped object (keyed by displayName)
      if (Array.isArray(familyStore.members)) {
        familyStore.members.forEach(person => {
          if (person && person.displayName) {
            grouped[person.displayName] = [];
          }
        });
      }
      
      // assign chores to appropriate person or unassigned
      if (Array.isArray(state.chores)) {
        state.chores.forEach(chore => {
          if (chore.assignedTo && grouped[chore.assignedTo]) {
            grouped[chore.assignedTo].push(chore);
          } else if (!chore.assignedTo) {
            grouped.unassigned.push(chore);
          }
        });
      }
      
      return grouped;
    },
    
    // get unassigned chores
    unassignedChores: (state) => {
      return state.chores.filter(c => !c.assignedTo);
    },
    
    // get chores for a specific person
    choresForPerson: (state) => {
      return (personName) => state.chores.filter(c => c.assignedTo === personName);
    },
    
    // get completed chores
    completedChores: (state) => {
      return state.chores.filter(c => c.completed);
    },
    
    // get pending approval chores
    pendingApprovalChores: (state) => {
      return state.chores.filter(c => c.isPendingApproval);
    },
    
    // chore count
    choreCount: (state) => state.chores.length,
    
    // quicklist count
    quicklistCount: (state) => state.quicklistChores.length
  },
  
  actions: {
    // load chores from API
    async loadChores() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.CHORES);
        this.chores = data.chores || [];
        console.log('✅ Chores loaded:', this.chores.length);
      } catch (error) {
        this.error = error.message;
        console.error('Failed to load chores:', error);
        this.chores = [];
      } finally {
        this.loading = false;
      }
    },
    
    // load quicklist chores
    async loadQuicklistChores() {
      try {
        const data = await apiService.get(CONFIG.API.ENDPOINTS.QUICKLIST);
        this.quicklistChores = data.quicklistChores || [];
        console.log('✅ Quicklist chores loaded:', this.quicklistChores.length);
      } catch (error) {
        console.error('Failed to load quicklist chores:', error);
        this.quicklistChores = [];
      }
    },
    
    // create new chore
    async createChore(choreData) {
      try {
        const data = await apiService.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
        
        if (data.chore) {
          this.chores.push(data.chore);
          console.log('✅ Chore created:', data.chore.name);
          return { success: true, chore: data.chore };
        }
        
        return { success: false, error: 'Failed to create chore' };
      } catch (error) {
        console.error('Failed to create chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // update chore
    async updateChore(choreId, updates) {
      try {
        const data = await apiService.put(`${CONFIG.API.ENDPOINTS.CHORES}/${choreId}`, updates);
        
        if (data.chore) {
          const index = this.chores.findIndex(c => c.id === choreId);
          if (index !== -1) {
            this.chores[index] = { ...this.chores[index], ...data.chore };
          }
          console.log('✅ Chore updated:', choreId);
          return { success: true, chore: data.chore };
        }
        
        return { success: false, error: 'Failed to update chore' };
      } catch (error) {
        console.error('Failed to update chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // delete chore
    async deleteChore(chore) {
      if (!chore || !chore.id) {
        console.warn('Invalid chore for deletion');
        return { success: false };
      }
      
      console.log('🚀 Deleting chore:', chore.name);
      
      // optimistic update
      const originalChores = [...this.chores];
      this.chores = this.chores.filter(c => c.id !== chore.id);
      
      try {
        await apiService.delete(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}`);
        console.log('✅ Chore deleted:', chore.name);
        
        // reload family members to update earnings if chore was completed
        if (chore.completed && window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        return { success: true };
      } catch (error) {
        console.error('Failed to delete chore:', error);
        // rollback on error
        this.chores = originalChores;
        return { success: false, error: error.message };
      }
    },
    
    // assign chore to person
    async assignChore(choreId, personName) {
      const chore = this.chores.find(c => c.id === choreId);
      if (!chore) {
        console.warn('Chore not found for assignment');
        return { success: false };
      }
      
      // optimistic update
      const originalAssignedTo = chore.assignedTo;
      chore.assignedTo = personName;
      
      try {
        await this.updateChore(choreId, { assignedTo: personName });
        console.log('✅ Chore assigned to:', personName);
        return { success: true };
      } catch (error) {
        // rollback on error
        chore.assignedTo = originalAssignedTo;
        return { success: false, error: error.message };
      }
    },
    
    // toggle chore completion
    async toggleComplete(chore) {
      if (!chore || !chore.id) return { success: false };
      
      const useUIStore = window.useUIStore;
      const useFamilyStore = window.useFamilyStore;
      
      // optimistic update
      const originalCompleted = chore.completed;
      const originalPendingApproval = chore.isPendingApproval;
      chore.completed = !chore.completed;
      
      // check if approval is required
      const accountSettings = window.accountSettings || {};
      const requireApproval = accountSettings.preferences?.requireApproval;
      
      if (chore.completed && requireApproval) {
        chore.isPendingApproval = true;
      }
      
      try {
        const endpoint = chore.completed
          ? `${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`
          : `${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/uncomplete`;
        
        await apiService.put(endpoint);
        
        // reload earnings if completed
        if (chore.completed && useFamilyStore) {
          const familyStore = useFamilyStore();
          await familyStore.loadMembers();
        }
        
        // show success message
        if (useUIStore) {
          const uiStore = useUIStore();
          if (chore.completed) {
            uiStore.showSuccess(`Completed: ${chore.name}`);
            if (!requireApproval) {
              uiStore.triggerConfetti();
            }
          }
        }
        
        console.log('✅ Chore completion toggled:', chore.name);
        return { success: true };
      } catch (error) {
        // rollback on error
        chore.completed = originalCompleted;
        chore.isPendingApproval = originalPendingApproval;
        console.error('Failed to toggle completion:', error);
        return { success: false, error: error.message };
      }
    },
    
    // approve chore
    async approveChore(chore) {
      if (!chore || !chore.id) return { success: false };
      
      try {
        await apiService.put(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/approve`);
        
        // update local state
        chore.isPendingApproval = false;
        chore.approved = true;
        
        // reload earnings
        if (window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        // show success
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showSuccess(`Approved: ${chore.name}`);
        }
        
        console.log('✅ Chore approved:', chore.name);
        return { success: true };
      } catch (error) {
        console.error('Failed to approve chore:', error);
        return { success: false, error: error.message };
      }
    },
    
    // start new day
    async startNewDay() {
      try {
        console.log('🌅 Starting new day...');
        
        const data = await apiService.post(CONFIG.API.ENDPOINTS.NEW_DAY);
        
        // reload chores and family members
        await this.loadChores();
        
        if (window.useFamilyStore) {
          const familyStore = window.useFamilyStore();
          await familyStore.loadMembers();
        }
        
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          uiStore.showSuccess('New day started! All chores cleared.');
        }
        
        console.log('✅ New day started successfully');
        return { success: true };
      } catch (error) {
        console.error('Failed to start new day:', error);
        return { success: false, error: error.message };
      }
    },
    
    // selection management
    selectChore(chore) {
      if (chore && chore.id) {
        this.selectedChoreId = chore.id;
        this.selectedQuicklistChore = null;
        console.log('Selected chore:', chore.name);
      }
    },
    
    selectQuicklistChore(chore) {
      this.selectedQuicklistChore = chore;
      this.selectedChoreId = null;
      console.log('Selected quicklist chore:', chore?.name);
    },
    
    clearSelection() {
      this.selectedChoreId = null;
      this.selectedQuicklistChore = null;
      this.multiAssignSelectedMembers = [];
    },
    
    // multi-assign helpers
    toggleMemberSelection(memberName) {
      const index = this.multiAssignSelectedMembers.indexOf(memberName);
      if (index === -1) {
        this.multiAssignSelectedMembers.push(memberName);
      } else {
        this.multiAssignSelectedMembers.splice(index, 1);
      }
    },
    
    clearMemberSelection() {
      this.multiAssignSelectedMembers = [];
    },
    
    // form helpers
    resetNewChoreForm() {
      this.newChore = {
        name: '',
        amount: 0,
        category: 'regular',
        addToQuicklist: false,
        isDetailed: false
      };
    },
    
    resetQuicklistChoreForm() {
      this.newQuicklistChore = {
        name: '',
        amount: 0,
        category: 'regular',
        isDetailed: false
      };
    },
    
    resetChoreDetailsForm() {
      this.choreDetailsForm = {
        name: '',
        details: '',
        amount: 0,
        category: 'regular',
        assignedTo: '',
        isNewFromQuicklist: false
      };
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useChoresStore = useChoresStore;
}

