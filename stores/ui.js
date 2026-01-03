// UI Store
// Manages UI state: modals, toasts, loading, navigation

const useUIStore = Pinia.defineStore('ui', {
  state: () => ({
    // Navigation
    currentPage: 'chores',
    mobileNavOpen: false,
    
    // Modal registry - each modal: { isOpen: false, data: null }
    // This pattern allows dynamic modal registration and per-modal data storage
    modals: {},
    
    // Loading states
    loading: false,
    loadingMessage: '',
    
    // Error states
    error: null,
    
    // Success messages
    showSuccessMessage: false,
    successMessage: ''
  }),
  
  getters: {
    // Check if a specific modal is open
    isModalOpen: (state) => {
      return (modalName) => state.modals[modalName]?.isOpen || false;
    },
    
    // Get data associated with a specific modal
    getModalData: (state) => {
      return (modalName) => state.modals[modalName]?.data || null;
    },
    
    // Check if any modal is open (for body scroll locking)
    hasAnyModalOpen: (state) => {
      return Object.values(state.modals).some(modal => modal?.isOpen === true);
    },
    
    // Get list of currently open modals
    openModals: (state) => {
      return Object.keys(state.modals).filter(name => state.modals[name]?.isOpen === true);
    }
  },
  
  actions: {
    // Navigation
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
    
    // Modal management with registry pattern
    openModal(modalName, data = null) {
      // Capture scroll position for flyout panels
      if (typeof window !== 'undefined') {
        window.__flyoutScrollY = window.scrollY;
      }
      
      // Initialize modal entry if it doesn't exist (dynamic registration)
      if (!this.modals[modalName]) {
        this.modals[modalName] = { isOpen: false, data: null };
      }
      
      this.modals[modalName].isOpen = true;
      this.modals[modalName].data = data;
      
      // Add body scroll lock when any modal opens
      if (typeof document !== 'undefined') {
        document.body.classList.add('modal-open');
      }
      
      console.log('[UI] Modal opened:', modalName, data ? 'with data' : '');
    },
    
    closeModal(modalName) {
      if (this.modals[modalName]) {
        this.modals[modalName].isOpen = false;
        this.modals[modalName].data = null;
        console.log('[UI] Modal closed:', modalName);
        
        // Remove body scroll lock if no modals are open
        if (typeof document !== 'undefined' && !this.hasAnyModalOpen) {
          document.body.classList.remove('modal-open');
        }
      }
    },
    
    closeAllModals() {
      Object.keys(this.modals).forEach(name => {
        this.modals[name].isOpen = false;
        this.modals[name].data = null;
      });
      
      // Remove body scroll lock
      if (typeof document !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
      
      console.log('[UI] All modals closed');
    },
    
    // Specific modal helpers (for backwards compatibility)
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
    
    // Loading state
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
    
    // Error handling
    setError(error) {
      this.error = error;
      console.error('[ERROR] Error:', error);
    },
    
    clearError() {
      this.error = null;
    },
    
    // Show error message (toast-style, auto-dismisses)
    showError(message, duration = 5000) {
      this.error = message;
      console.error('[ERROR]', message);
      
      // Auto-clear after duration
      if (duration > 0) {
        setTimeout(() => {
          this.clearError();
        }, duration);
      }
    },
    
    // Success messages
    showSuccess(message, duration = 3000) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      
      // Auto-hide after duration
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
    
    // Reset all UI state
    reset() {
      this.closeAllModals();
      this.clearError();
      this.hideSuccess();
      this.stopLoading();
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useUIStore = useUIStore;
}
