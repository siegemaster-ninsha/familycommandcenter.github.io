// UI Store
// Manages UI state: modals, toasts, loading, navigation

const useUIStore = Pinia.defineStore('ui', {
  state: () => ({
    // Navigation
    currentPage: 'chores',
    mobileNavOpen: false,
    
    // Modals
    modals: {
      login: false,
      signup: false,
      confirm: false,
      addChore: false,
      addToQuicklist: false,
      choreDetails: false,
      multiAssign: false,
      addPerson: false,
      deletePerson: false,
      createChild: false,
      invite: false,
      newDay: false,
      spending: false
    },
    
    // Modal data (context for modals)
    modalData: {
      personToDelete: null,
      selectedPerson: null,
      selectedQuicklistChore: null,
      inviteData: { token: '', expiresAt: null }
    },
    
    // Loading states
    loading: false,
    loadingMessage: '',
    
    // Error states
    error: null,
    
    // Success messages
    showSuccessMessage: false,
    successMessage: '',
    
    // Confetti
    showConfetti: false,
    confettiPieces: []
  }),
  
  getters: {
    // check if any modal is open
    hasAnyModalOpen: (state) => {
      return Object.values(state.modals).some(isOpen => isOpen === true);
    },
    
    // get specific modal state
    isModalOpen: (state) => {
      return (modalName) => state.modals[modalName] === true;
    },
    
    // get open modals list
    openModals: (state) => {
      return Object.keys(state.modals).filter(name => state.modals[name] === true);
    }
  },
  
  actions: {
    // navigation
    setCurrentPage(page) {
      this.currentPage = page;
      this.mobileNavOpen = false;
      console.log('[NAV] Page changed to:', page);
    },
    
    toggleMobileNav() {
      this.mobileNavOpen = !this.mobileNavOpen;
    },
    
    closeMobileNav() {
      this.mobileNavOpen = false;
    },
    
    // modal management
    openModal(modalName, data = null) {
      if (Object.prototype.hasOwnProperty.call(this.modals, modalName)) {
        this.modals[modalName] = true;
        
        // store modal-specific data if provided
        if (data) {
          this.modalData = { ...this.modalData, ...data };
        }
        
        console.log('[UI] Modal opened:', modalName);
      } else {
        console.warn(`Modal "${modalName}" not found in registry`);
      }
    },
    
    closeModal(modalName) {
      if (Object.prototype.hasOwnProperty.call(this.modals, modalName)) {
        this.modals[modalName] = false;
        console.log('[UI] Modal closed:', modalName);
      }
    },
    
    closeAllModals() {
      Object.keys(this.modals).forEach(key => {
        this.modals[key] = false;
      });
      this.modalData = {
        personToDelete: null,
        selectedPerson: null,
        selectedQuicklistChore: null,
        inviteData: { token: '', expiresAt: null }
      };
      console.log('[UI] All modals closed');
    },
    
    // specific modal helpers (for backwards compatibility)
    showLoginModal() {
      this.openModal('login');
    },
    
    showSignupModal() {
      this.openModal('signup');
    },
    
    showAddChoreModal() {
      this.openModal('addChore');
    },
    
    showSpendingModal(person) {
      this.openModal('spending', { selectedPerson: person });
    },
    
    showDeletePersonModal(person) {
      this.openModal('deletePerson', { personToDelete: person });
    },
    
    // loading state
    setLoading(isLoading, message = '') {
      this.loading = isLoading;
      this.loadingMessage = message;
    },
    
    startLoading(message = 'Loading...') {
      this.setLoading(true, message);
    },
    
    stopLoading() {
      this.setLoading(false, '');
    },
    
    // error handling
    setError(error) {
      this.error = error;
      console.error('[ERROR] Error:', error);
    },
    
    clearError() {
      this.error = null;
    },
    
    // success messages
    showSuccess(message, duration = 3000) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      
      // auto-hide after duration
      if (duration > 0) {
        setTimeout(() => {
          this.hideSuccess();
        }, duration);
      }
      
      console.log('[OK] Success:', message);
    },
    
    hideSuccess() {
      this.showSuccessMessage = false;
      setTimeout(() => {
        this.successMessage = '';
      }, 300);
    },
    
    // confetti
    triggerConfetti() {
      this.showConfetti = true;
      
      // generate confetti pieces
      const pieces = [];
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 2 + Math.random() * 2,
          delay: Math.random() * 0.5
        });
      }
      this.confettiPieces = pieces;
      
      // auto-hide after animation
      setTimeout(() => {
        this.hideConfetti();
      }, 4000);
      
      console.log('[SUCCESS] Confetti triggered');
    },
    
    hideConfetti() {
      this.showConfetti = false;
      this.confettiPieces = [];
    },
    
    // reset all UI state
    reset() {
      this.closeAllModals();
      this.clearError();
      this.hideSuccess();
      this.hideConfetti();
      this.stopLoading();
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useUIStore = useUIStore;
}

