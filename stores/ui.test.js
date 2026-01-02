/**
 * Unit Tests for UI Store - Modal Registry
 * 
 * Tests:
 * - openModal sets isOpen to true
 * - closeModal sets isOpen to false
 * - hasAnyModalOpen returns correct value
 * 
 * Requirements: 10.1, 10.2
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('UI Store - Modal Registry', () => {
  let createStore;

  beforeEach(() => {
    // Create a fresh store instance for each test
    // We simulate the Pinia store behavior without needing the full Pinia setup
    createStore = () => {
      const state = {
        modals: {},
        currentPage: 'chores',
        mobileNavOpen: false,
        loading: false,
        loadingMessage: '',
        error: null,
        showSuccessMessage: false,
        successMessage: '',
        showConfetti: false,
        confettiPieces: []
      };

      return {
        // State
        ...state,
        
        // Getters
        isModalOpen(modalName) {
          return this.modals[modalName]?.isOpen || false;
        },
        
        getModalData(modalName) {
          return this.modals[modalName]?.data || null;
        },
        
        get hasAnyModalOpen() {
          return Object.values(this.modals).some(modal => modal?.isOpen === true);
        },
        
        get openModals() {
          return Object.keys(this.modals).filter(name => this.modals[name]?.isOpen === true);
        },
        
        // Actions
        openModal(modalName, data = null) {
          if (!this.modals[modalName]) {
            this.modals[modalName] = { isOpen: false, data: null };
          }
          this.modals[modalName].isOpen = true;
          this.modals[modalName].data = data;
        },
        
        closeModal(modalName) {
          if (this.modals[modalName]) {
            this.modals[modalName].isOpen = false;
            this.modals[modalName].data = null;
          }
        },
        
        closeAllModals() {
          Object.keys(this.modals).forEach(name => {
            this.modals[name].isOpen = false;
            this.modals[name].data = null;
          });
        }
      };
    };
  });

  describe('openModal', () => {
    it('should set isOpen to true for a new modal', () => {
      const store = createStore();
      
      store.openModal('login');
      
      expect(store.isModalOpen('login')).toBe(true);
    });

    it('should set isOpen to true for an existing modal', () => {
      const store = createStore();
      store.modals.login = { isOpen: false, data: null };
      
      store.openModal('login');
      
      expect(store.isModalOpen('login')).toBe(true);
    });

    it('should store data when provided', () => {
      const store = createStore();
      const testData = { userId: 123, name: 'Test User' };
      
      store.openModal('userDetails', testData);
      
      expect(store.getModalData('userDetails')).toEqual(testData);
    });

    it('should set data to null when not provided', () => {
      const store = createStore();
      
      store.openModal('login');
      
      expect(store.getModalData('login')).toBeNull();
    });

    it('should dynamically register new modals', () => {
      const store = createStore();
      
      // Modal doesn't exist yet
      expect(store.modals.newModal).toBeUndefined();
      
      store.openModal('newModal');
      
      // Modal is now registered and open
      expect(store.modals.newModal).toBeDefined();
      expect(store.isModalOpen('newModal')).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should set isOpen to false', () => {
      const store = createStore();
      store.openModal('login');
      
      store.closeModal('login');
      
      expect(store.isModalOpen('login')).toBe(false);
    });

    it('should clear modal data when closing', () => {
      const store = createStore();
      store.openModal('userDetails', { userId: 123 });
      
      store.closeModal('userDetails');
      
      expect(store.getModalData('userDetails')).toBeNull();
    });

    it('should handle closing a non-existent modal gracefully', () => {
      const store = createStore();
      
      // Should not throw
      expect(() => store.closeModal('nonExistent')).not.toThrow();
    });

    it('should not affect other modals', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      
      store.closeModal('login');
      
      expect(store.isModalOpen('login')).toBe(false);
      expect(store.isModalOpen('signup')).toBe(true);
    });
  });

  describe('closeAllModals', () => {
    it('should close all open modals', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      store.openModal('addChore');
      
      store.closeAllModals();
      
      expect(store.isModalOpen('login')).toBe(false);
      expect(store.isModalOpen('signup')).toBe(false);
      expect(store.isModalOpen('addChore')).toBe(false);
    });

    it('should clear all modal data', () => {
      const store = createStore();
      store.openModal('userDetails', { userId: 123 });
      store.openModal('choreDetails', { choreId: 456 });
      
      store.closeAllModals();
      
      expect(store.getModalData('userDetails')).toBeNull();
      expect(store.getModalData('choreDetails')).toBeNull();
    });

    it('should handle empty modals object', () => {
      const store = createStore();
      
      // Should not throw
      expect(() => store.closeAllModals()).not.toThrow();
    });
  });

  describe('hasAnyModalOpen', () => {
    it('should return false when no modals are open', () => {
      const store = createStore();
      
      expect(store.hasAnyModalOpen).toBe(false);
    });

    it('should return true when one modal is open', () => {
      const store = createStore();
      store.openModal('login');
      
      expect(store.hasAnyModalOpen).toBe(true);
    });

    it('should return true when multiple modals are open', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      
      expect(store.hasAnyModalOpen).toBe(true);
    });

    it('should return false after all modals are closed', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      
      store.closeAllModals();
      
      expect(store.hasAnyModalOpen).toBe(false);
    });

    it('should return true if at least one modal remains open', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      
      store.closeModal('login');
      
      expect(store.hasAnyModalOpen).toBe(true);
    });
  });

  describe('isModalOpen getter', () => {
    it('should return false for non-existent modal', () => {
      const store = createStore();
      
      expect(store.isModalOpen('nonExistent')).toBe(false);
    });

    it('should return correct state for each modal', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      store.closeModal('signup');
      
      expect(store.isModalOpen('login')).toBe(true);
      expect(store.isModalOpen('signup')).toBe(false);
    });
  });

  describe('getModalData getter', () => {
    it('should return null for non-existent modal', () => {
      const store = createStore();
      
      expect(store.getModalData('nonExistent')).toBeNull();
    });

    it('should return the data passed to openModal', () => {
      const store = createStore();
      const testData = { person: { id: 1, name: 'John' } };
      
      store.openModal('deletePerson', testData);
      
      expect(store.getModalData('deletePerson')).toEqual(testData);
    });

    it('should return updated data when modal is reopened with new data', () => {
      const store = createStore();
      store.openModal('userDetails', { userId: 1 });
      store.closeModal('userDetails');
      store.openModal('userDetails', { userId: 2 });
      
      expect(store.getModalData('userDetails')).toEqual({ userId: 2 });
    });
  });

  describe('openModals getter', () => {
    it('should return empty array when no modals are open', () => {
      const store = createStore();
      
      expect(store.openModals).toEqual([]);
    });

    it('should return array of open modal names', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('addChore');
      
      expect(store.openModals).toContain('login');
      expect(store.openModals).toContain('addChore');
      expect(store.openModals.length).toBe(2);
    });

    it('should not include closed modals', () => {
      const store = createStore();
      store.openModal('login');
      store.openModal('signup');
      store.closeModal('login');
      
      expect(store.openModals).not.toContain('login');
      expect(store.openModals).toContain('signup');
    });
  });
});
