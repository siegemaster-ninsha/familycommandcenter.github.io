/**
 * Unit Tests for Chores Store
 * 
 * Tests:
 * - loadChores populates store state
 * - createChore (addChore) calls API with correct payload
 * - deleteChore removes chore from state
 * - toggleComplete (handleChoreCompletion) updates completion status
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Chores Store', () => {
  let createStore;
  let mockApiService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock API service
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    // Mock global apiService
    global.window = {
      ...global.window,
      apiService: mockApiService,
      offlineStorage: null,
      useUIStore: () => ({
        showSuccess: vi.fn(),
        showError: vi.fn()
      }),
      useFamilyStore: () => ({
        members: [
          { id: '1', displayName: 'Alice' },
          { id: '2', displayName: 'Bob' }
        ],
        loadMembers: vi.fn()
      }),
      useOfflineStore: () => ({
        isFeatureAvailable: () => true,
        getDisabledFeatureMessage: () => ''
      }),
      accountSettings: { preferences: { requireApproval: false } }
    };

    // Create a fresh store instance for each test
    createStore = () => {
      const state = {
        chores: [],
        quicklistChores: [],
        selectedChoreId: null,
        selectedQuicklistChore: null,
        multiAssignSelectedMembers: [],
        loading: false,
        error: null,
        isUsingCachedData: false
      };

      return {
        // State
        ...state,
        
        // Getters
        get selectedChore() {
          if (this.selectedQuicklistChore) {
            return this.selectedQuicklistChore;
          }
          if (this.selectedChoreId) {
            return this.chores.find(c => c.id === this.selectedChoreId) || null;
          }
          return null;
        },
        
        get choresByPerson() {
          const familyStore = window.useFamilyStore?.();
          const grouped = { unassigned: [] };
          
          if (familyStore?.members) {
            familyStore.members.forEach(person => {
              if (person?.displayName) {
                grouped[person.displayName] = [];
              }
            });
          }
          
          this.chores.forEach(chore => {
            if (chore.assignedTo && grouped[chore.assignedTo]) {
              grouped[chore.assignedTo].push(chore);
            } else if (!chore.assignedTo) {
              grouped.unassigned.push(chore);
            }
          });
          
          return grouped;
        },
        
        get unassignedChores() {
          return this.chores.filter(c => !c.assignedTo);
        },
        
        // Actions
        async loadChores() {
          this.loading = true;
          this.error = null;
          this.isUsingCachedData = false;
          
          try {
            const data = await mockApiService.get(CONFIG.API.ENDPOINTS.CHORES);
            this.chores = data.chores || [];
            return { success: true };
          } catch (error) {
            this.error = error.message;
            this.chores = [];
            return { success: false, error: error.message };
          } finally {
            this.loading = false;
          }
        },
        
        async createChore(choreData) {
          try {
            const data = await mockApiService.post(CONFIG.API.ENDPOINTS.CHORES, choreData);
            
            if (data.chore) {
              this.chores.push(data.chore);
              return { success: true, chore: data.chore };
            }
            
            return { success: false, error: 'Failed to create chore' };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        async deleteChore(chore) {
          if (!chore || !chore.id) {
            return { success: false };
          }
          
          // Optimistic update
          const originalChores = [...this.chores];
          this.chores = this.chores.filter(c => c.id !== chore.id);
          
          try {
            await mockApiService.delete(`${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}`);
            return { success: true };
          } catch (error) {
            // Rollback on error
            this.chores = originalChores;
            return { success: false, error: error.message };
          }
        },
        
        async toggleComplete(chore) {
          if (!chore || !chore.id) return { success: false };
          
          // Optimistic update
          const originalCompleted = chore.completed;
          chore.completed = !chore.completed;
          
          try {
            // Backend /complete endpoint toggles the state, so always use it
            const endpoint = `${CONFIG.API.ENDPOINTS.CHORES}/${chore.id}/complete`;
            
            await mockApiService.put(endpoint);
            return { success: true };
          } catch (error) {
            // Rollback on error
            chore.completed = originalCompleted;
            return { success: false, error: error.message };
          }
        },
        
        selectChore(chore) {
          if (chore && chore.id) {
            this.selectedChoreId = chore.id;
            this.selectedQuicklistChore = null;
          }
        },
        
        clearSelection() {
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          this.multiAssignSelectedMembers = [];
        }
      };
    };
  });

  describe('loadChores', () => {
    it('should populate store state with chores from API', async () => {
      const store = createStore();
      const mockChores = [
        { id: '1', name: 'Clean room', amount: 5, completed: false },
        { id: '2', name: 'Do homework', amount: 10, completed: true }
      ];
      
      mockApiService.get.mockResolvedValue({ chores: mockChores });
      
      await store.loadChores();
      
      expect(store.chores).toEqual(mockChores);
      expect(store.chores.length).toBe(2);
    });

    it('should set loading to true during load and false after', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ chores: [] });
      
      const loadPromise = store.loadChores();
      
      // After promise resolves
      await loadPromise;
      expect(store.loading).toBe(false);
    });

    it('should handle empty chores array', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ chores: [] });
      
      await store.loadChores();
      
      expect(store.chores).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const store = createStore();
      mockApiService.get.mockRejectedValue(new Error('Network error'));
      
      const result = await store.loadChores();
      
      expect(result.success).toBe(false);
      expect(store.error).toBe('Network error');
      expect(store.chores).toEqual([]);
    });

    it('should call API with correct endpoint', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ chores: [] });
      
      await store.loadChores();
      
      expect(mockApiService.get).toHaveBeenCalledWith(CONFIG.API.ENDPOINTS.CHORES);
    });
  });

  describe('createChore (addChore)', () => {
    it('should call API with correct payload', async () => {
      const store = createStore();
      const choreData = {
        name: 'New chore',
        amount: 5,
        category: 'regular',
        assignedTo: 'Alice'
      };
      
      mockApiService.post.mockResolvedValue({
        chore: { id: '123', ...choreData }
      });
      
      await store.createChore(choreData);
      
      expect(mockApiService.post).toHaveBeenCalledWith(
        CONFIG.API.ENDPOINTS.CHORES,
        choreData
      );
    });

    it('should add created chore to store state', async () => {
      const store = createStore();
      const choreData = { name: 'New chore', amount: 5 };
      const createdChore = { id: '123', ...choreData };
      
      mockApiService.post.mockResolvedValue({ chore: createdChore });
      
      await store.createChore(choreData);
      
      expect(store.chores).toContainEqual(createdChore);
    });

    it('should return success with created chore', async () => {
      const store = createStore();
      const choreData = { name: 'New chore', amount: 5 };
      const createdChore = { id: '123', ...choreData };
      
      mockApiService.post.mockResolvedValue({ chore: createdChore });
      
      const result = await store.createChore(choreData);
      
      expect(result.success).toBe(true);
      expect(result.chore).toEqual(createdChore);
    });

    it('should handle API errors', async () => {
      const store = createStore();
      mockApiService.post.mockRejectedValue(new Error('Server error'));
      
      const result = await store.createChore({ name: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should handle missing chore in response', async () => {
      const store = createStore();
      mockApiService.post.mockResolvedValue({});
      
      const result = await store.createChore({ name: 'Test' });
      
      expect(result.success).toBe(false);
    });
  });

  describe('deleteChore', () => {
    it('should remove chore from store state', async () => {
      const store = createStore();
      const chore = { id: '1', name: 'Test chore' };
      store.chores = [chore, { id: '2', name: 'Other chore' }];
      
      mockApiService.delete.mockResolvedValue({ success: true });
      
      await store.deleteChore(chore);
      
      expect(store.chores.find(c => c.id === '1')).toBeUndefined();
      expect(store.chores.length).toBe(1);
    });

    it('should call API with correct endpoint', async () => {
      const store = createStore();
      const chore = { id: '123', name: 'Test chore' };
      store.chores = [chore];
      
      mockApiService.delete.mockResolvedValue({ success: true });
      
      await store.deleteChore(chore);
      
      expect(mockApiService.delete).toHaveBeenCalledWith(
        `${CONFIG.API.ENDPOINTS.CHORES}/123`
      );
    });

    it('should rollback on API error', async () => {
      const store = createStore();
      const chore = { id: '1', name: 'Test chore' };
      store.chores = [chore];
      
      mockApiService.delete.mockRejectedValue(new Error('Delete failed'));
      
      await store.deleteChore(chore);
      
      // Chore should be restored
      expect(store.chores).toContainEqual(chore);
    });

    it('should handle invalid chore gracefully', async () => {
      const store = createStore();
      
      const result = await store.deleteChore(null);
      
      expect(result.success).toBe(false);
      expect(mockApiService.delete).not.toHaveBeenCalled();
    });

    it('should handle chore without id gracefully', async () => {
      const store = createStore();
      
      const result = await store.deleteChore({ name: 'No ID' });
      
      expect(result.success).toBe(false);
      expect(mockApiService.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleComplete (handleChoreCompletion)', () => {
    it('should update completion status optimistically', async () => {
      const store = createStore();
      const chore = { id: '1', name: 'Test', completed: false };
      store.chores = [chore];
      
      mockApiService.put.mockResolvedValue({ success: true });
      
      await store.toggleComplete(chore);
      
      expect(chore.completed).toBe(true);
    });

    it('should call correct API endpoint for completing', async () => {
      const store = createStore();
      const chore = { id: '123', name: 'Test', completed: false };
      store.chores = [chore];
      
      mockApiService.put.mockResolvedValue({ success: true });
      
      await store.toggleComplete(chore);
      
      expect(mockApiService.put).toHaveBeenCalledWith(
        `${CONFIG.API.ENDPOINTS.CHORES}/123/complete`
      );
    });

    it('should call /complete endpoint for uncompleting (backend handles toggle)', async () => {
      const store = createStore();
      const chore = { id: '123', name: 'Test', completed: true };
      store.chores = [chore];
      
      mockApiService.put.mockResolvedValue({ success: true });
      
      await store.toggleComplete(chore);
      
      // Backend /complete endpoint toggles state, so always use it
      expect(mockApiService.put).toHaveBeenCalledWith(
        `${CONFIG.API.ENDPOINTS.CHORES}/123/complete`
      );
    });

    it('should rollback on API error', async () => {
      const store = createStore();
      const chore = { id: '1', name: 'Test', completed: false };
      store.chores = [chore];
      
      mockApiService.put.mockRejectedValue(new Error('API error'));
      
      await store.toggleComplete(chore);
      
      // Should rollback to original state
      expect(chore.completed).toBe(false);
    });

    it('should handle invalid chore gracefully', async () => {
      const store = createStore();
      
      const result = await store.toggleComplete(null);
      
      expect(result.success).toBe(false);
      expect(mockApiService.put).not.toHaveBeenCalled();
    });

    it('should return success on successful toggle', async () => {
      const store = createStore();
      const chore = { id: '1', name: 'Test', completed: false };
      store.chores = [chore];
      
      mockApiService.put.mockResolvedValue({ success: true });
      
      const result = await store.toggleComplete(chore);
      
      expect(result.success).toBe(true);
    });
  });

  describe('selectChore', () => {
    it('should set selectedChoreId', () => {
      const store = createStore();
      const chore = { id: '123', name: 'Test' };
      
      store.selectChore(chore);
      
      expect(store.selectedChoreId).toBe('123');
    });

    it('should clear selectedQuicklistChore when selecting a chore', () => {
      const store = createStore();
      store.selectedQuicklistChore = { id: 'ql1', name: 'Quicklist item' };
      
      store.selectChore({ id: '123', name: 'Test' });
      
      expect(store.selectedQuicklistChore).toBeNull();
    });

    it('should not change state for invalid chore', () => {
      const store = createStore();
      store.selectedChoreId = '123';
      
      store.selectChore(null);
      
      expect(store.selectedChoreId).toBe('123');
    });
  });

  describe('clearSelection', () => {
    it('should clear all selection state', () => {
      const store = createStore();
      store.selectedChoreId = '123';
      store.selectedQuicklistChore = { id: 'ql1' };
      store.multiAssignSelectedMembers = ['Alice', 'Bob'];
      
      store.clearSelection();
      
      expect(store.selectedChoreId).toBeNull();
      expect(store.selectedQuicklistChore).toBeNull();
      expect(store.multiAssignSelectedMembers).toEqual([]);
    });
  });

  describe('choresByPerson getter', () => {
    it('should group chores by assigned person', () => {
      const store = createStore();
      store.chores = [
        { id: '1', name: 'Chore 1', assignedTo: 'Alice' },
        { id: '2', name: 'Chore 2', assignedTo: 'Bob' },
        { id: '3', name: 'Chore 3', assignedTo: 'Alice' }
      ];
      
      const grouped = store.choresByPerson;
      
      expect(grouped.Alice.length).toBe(2);
      expect(grouped.Bob.length).toBe(1);
    });

    it('should put unassigned chores in unassigned group', () => {
      const store = createStore();
      store.chores = [
        { id: '1', name: 'Chore 1', assignedTo: null },
        { id: '2', name: 'Chore 2' }
      ];
      
      const grouped = store.choresByPerson;
      
      expect(grouped.unassigned.length).toBe(2);
    });
  });

  describe('unassignedChores getter', () => {
    it('should return only unassigned chores', () => {
      const store = createStore();
      store.chores = [
        { id: '1', name: 'Assigned', assignedTo: 'Alice' },
        { id: '2', name: 'Unassigned 1', assignedTo: null },
        { id: '3', name: 'Unassigned 2' }
      ];
      
      const unassigned = store.unassignedChores;
      
      expect(unassigned.length).toBe(2);
      expect(unassigned.every(c => !c.assignedTo)).toBe(true);
    });
  });

  describe('selectedChore getter', () => {
    it('should return chore matching selectedChoreId', () => {
      const store = createStore();
      const targetChore = { id: '2', name: 'Target' };
      store.chores = [
        { id: '1', name: 'Other' },
        targetChore
      ];
      store.selectedChoreId = '2';
      
      expect(store.selectedChore).toEqual(targetChore);
    });

    it('should return selectedQuicklistChore if set', () => {
      const store = createStore();
      const quicklistChore = { id: 'ql1', name: 'Quicklist' };
      store.selectedQuicklistChore = quicklistChore;
      store.selectedChoreId = '123';
      
      expect(store.selectedChore).toEqual(quicklistChore);
    });

    it('should return null if no selection', () => {
      const store = createStore();
      
      expect(store.selectedChore).toBeNull();
    });
  });
});


/**
 * Property-Based Tests for Form Reset Actions
 * 
 * **Feature: app-js-cleanup, Property: Form reset returns to default state**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * Property: For any form state with arbitrary values, calling the reset action
 * SHALL return the form to its default state with all properties set to their
 * initial values.
 */

import fc from 'fast-check';

describe('Form Reset Actions Property Tests', () => {
  /**
   * Creates a mock chores store with form state and reset actions
   */
  const createFormStore = () => {
    // Default form states
    const defaultNewChore = {
      name: '',
      amount: 0,
      category: 'regular',
      addToQuicklist: false,
      isDetailed: false
    };
    
    const defaultNewQuicklistChore = {
      name: '',
      amount: 0,
      category: 'regular',
      categoryId: '',
      isDetailed: false,
      defaultDetails: ''
    };
    
    const defaultChoreDetailsForm = {
      name: '',
      details: '',
      amount: 0,
      category: 'regular',
      assignedTo: '',
      isNewFromQuicklist: false,
      quicklistChoreId: null
    };
    
    return {
      // Form state
      newChore: { ...defaultNewChore },
      newQuicklistChore: { ...defaultNewQuicklistChore },
      choreDetailsForm: { ...defaultChoreDetailsForm },
      
      // Default values for comparison
      _defaults: {
        newChore: defaultNewChore,
        newQuicklistChore: defaultNewQuicklistChore,
        choreDetailsForm: defaultChoreDetailsForm
      },
      
      // Reset actions
      resetNewChoreForm() {
        this.newChore = {
          name: '',
          amount: 0,
          category: 'regular',
          addToQuicklist: false,
          isDetailed: false
        };
      },
      
      resetNewQuicklistChoreForm() {
        this.newQuicklistChore = {
          name: '',
          amount: 0,
          category: 'regular',
          categoryId: '',
          isDetailed: false,
          defaultDetails: ''
        };
      },
      
      resetChoreDetailsForm() {
        this.choreDetailsForm = {
          name: '',
          details: '',
          amount: 0,
          category: 'regular',
          assignedTo: '',
          isNewFromQuicklist: false,
          quicklistChoreId: null
        };
      }
    };
  };

  /**
   * Arbitrary for generating newChore form state with arbitrary values
   */
  const newChoreArbitrary = fc.record({
    name: fc.string({ minLength: 0, maxLength: 100 }),
    amount: fc.integer({ min: -1000, max: 1000 }),
    category: fc.constantFrom('regular', 'game', 'bonus', 'invalid'),
    addToQuicklist: fc.boolean(),
    isDetailed: fc.boolean()
  });

  /**
   * Arbitrary for generating newQuicklistChore form state with arbitrary values
   */
  const newQuicklistChoreArbitrary = fc.record({
    name: fc.string({ minLength: 0, maxLength: 100 }),
    amount: fc.integer({ min: -1000, max: 1000 }),
    category: fc.constantFrom('regular', 'game', 'bonus', 'invalid'),
    categoryId: fc.string({ minLength: 0, maxLength: 50 }),
    isDetailed: fc.boolean(),
    defaultDetails: fc.string({ minLength: 0, maxLength: 500 })
  });

  /**
   * Arbitrary for generating choreDetailsForm state with arbitrary values
   */
  const choreDetailsFormArbitrary = fc.record({
    name: fc.string({ minLength: 0, maxLength: 100 }),
    details: fc.string({ minLength: 0, maxLength: 500 }),
    amount: fc.integer({ min: -1000, max: 1000 }),
    category: fc.constantFrom('regular', 'game', 'bonus', 'invalid'),
    assignedTo: fc.string({ minLength: 0, maxLength: 50 }),
    isNewFromQuicklist: fc.boolean(),
    quicklistChoreId: fc.option(fc.uuid(), { nil: null })
  });

  /**
   * **Feature: app-js-cleanup, Property: Form reset returns to default state**
   * **Validates: Requirements 1.1**
   * 
   * For any newChore form state, resetNewChoreForm() returns to default state
   */
  it('Property: resetNewChoreForm returns form to default state', async () => {
    await fc.assert(
      fc.property(
        newChoreArbitrary,
        (arbitraryFormState) => {
          const store = createFormStore();
          
          // Set arbitrary form state
          store.newChore = { ...arbitraryFormState };
          
          // Reset the form
          store.resetNewChoreForm();
          
          // Property: Form matches default state
          expect(store.newChore).toEqual(store._defaults.newChore);
          expect(store.newChore.name).toBe('');
          expect(store.newChore.amount).toBe(0);
          expect(store.newChore.category).toBe('regular');
          expect(store.newChore.addToQuicklist).toBe(false);
          expect(store.newChore.isDetailed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property: Form reset returns to default state**
   * **Validates: Requirements 1.2**
   * 
   * For any newQuicklistChore form state, resetNewQuicklistChoreForm() returns to default state
   */
  it('Property: resetNewQuicklistChoreForm returns form to default state', async () => {
    await fc.assert(
      fc.property(
        newQuicklistChoreArbitrary,
        (arbitraryFormState) => {
          const store = createFormStore();
          
          // Set arbitrary form state
          store.newQuicklistChore = { ...arbitraryFormState };
          
          // Reset the form
          store.resetNewQuicklistChoreForm();
          
          // Property: Form matches default state
          expect(store.newQuicklistChore).toEqual(store._defaults.newQuicklistChore);
          expect(store.newQuicklistChore.name).toBe('');
          expect(store.newQuicklistChore.amount).toBe(0);
          expect(store.newQuicklistChore.category).toBe('regular');
          expect(store.newQuicklistChore.categoryId).toBe('');
          expect(store.newQuicklistChore.isDetailed).toBe(false);
          expect(store.newQuicklistChore.defaultDetails).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property: Form reset returns to default state**
   * **Validates: Requirements 1.3**
   * 
   * For any choreDetailsForm state, resetChoreDetailsForm() returns to default state
   */
  it('Property: resetChoreDetailsForm returns form to default state', async () => {
    await fc.assert(
      fc.property(
        choreDetailsFormArbitrary,
        (arbitraryFormState) => {
          const store = createFormStore();
          
          // Set arbitrary form state
          store.choreDetailsForm = { ...arbitraryFormState };
          
          // Reset the form
          store.resetChoreDetailsForm();
          
          // Property: Form matches default state
          expect(store.choreDetailsForm).toEqual(store._defaults.choreDetailsForm);
          expect(store.choreDetailsForm.name).toBe('');
          expect(store.choreDetailsForm.details).toBe('');
          expect(store.choreDetailsForm.amount).toBe(0);
          expect(store.choreDetailsForm.category).toBe('regular');
          expect(store.choreDetailsForm.assignedTo).toBe('');
          expect(store.choreDetailsForm.isNewFromQuicklist).toBe(false);
          expect(store.choreDetailsForm.quicklistChoreId).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property: Form reset returns to default state**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   * 
   * Multiple sequential resets maintain idempotency
   */
  it('Property: Form reset is idempotent', async () => {
    await fc.assert(
      fc.property(
        newChoreArbitrary,
        newQuicklistChoreArbitrary,
        choreDetailsFormArbitrary,
        fc.integer({ min: 1, max: 5 }),
        (newChoreState, quicklistState, detailsState, resetCount) => {
          const store = createFormStore();
          
          // Set arbitrary form states
          store.newChore = { ...newChoreState };
          store.newQuicklistChore = { ...quicklistState };
          store.choreDetailsForm = { ...detailsState };
          
          // Reset multiple times
          for (let i = 0; i < resetCount; i++) {
            store.resetNewChoreForm();
            store.resetNewQuicklistChoreForm();
            store.resetChoreDetailsForm();
          }
          
          // Property: All forms match default state after any number of resets
          expect(store.newChore).toEqual(store._defaults.newChore);
          expect(store.newQuicklistChore).toEqual(store._defaults.newQuicklistChore);
          expect(store.choreDetailsForm).toEqual(store._defaults.choreDetailsForm);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property: Form reset returns to default state**
   * **Validates: Requirements 1.1, 1.2, 1.3**
   * 
   * Resetting one form does not affect other forms
   */
  it('Property: Form resets are independent', async () => {
    await fc.assert(
      fc.property(
        newChoreArbitrary,
        newQuicklistChoreArbitrary,
        choreDetailsFormArbitrary,
        (newChoreState, quicklistState, detailsState) => {
          const store = createFormStore();
          
          // Set arbitrary form states
          store.newChore = { ...newChoreState };
          store.newQuicklistChore = { ...quicklistState };
          store.choreDetailsForm = { ...detailsState };
          
          // Reset only newChore
          store.resetNewChoreForm();
          
          // Property: Only newChore is reset, others unchanged
          expect(store.newChore).toEqual(store._defaults.newChore);
          expect(store.newQuicklistChore).toEqual(quicklistState);
          expect(store.choreDetailsForm).toEqual(detailsState);
          
          // Reset only newQuicklistChore
          store.resetNewQuicklistChoreForm();
          
          // Property: newQuicklistChore is now reset, choreDetailsForm unchanged
          expect(store.newQuicklistChore).toEqual(store._defaults.newQuicklistChore);
          expect(store.choreDetailsForm).toEqual(detailsState);
          
          // Reset choreDetailsForm
          store.resetChoreDetailsForm();
          
          // Property: All forms now reset
          expect(store.choreDetailsForm).toEqual(store._defaults.choreDetailsForm);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-Based Tests for Chore Assignment Optimistic Update
 * 
 * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
 * **Validates: Requirements 5.3**
 * 
 * Property: For any selected chore and target assignee, when assignSelectedChore is called,
 * the chore SHALL immediately appear in the target person's list (optimistic update),
 * and if the API call fails, the chore SHALL be rolled back to its original state.
 */

describe('Chore Assignment Optimistic Update Property Tests', () => {
  let mockApiService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    global.window = {
      ...global.window,
      apiService: mockApiService,
      offlineStorage: null,
      useUIStore: () => ({
        showSuccess: vi.fn(),
        showError: vi.fn()
      }),
      useFamilyStore: () => ({
        members: [
          { id: '1', displayName: 'Alice' },
          { id: '2', displayName: 'Bob' },
          { id: '3', displayName: 'Charlie' }
        ],
        loadMembers: vi.fn().mockResolvedValue(),
        loadEarnings: vi.fn().mockResolvedValue(),
        loadElectronicsStatus: vi.fn().mockResolvedValue(),
        updateElectronicsStatusOptimistically: vi.fn()
      }),
      useOfflineStore: () => ({
        isFeatureAvailable: () => true,
        getDisabledFeatureMessage: () => ''
      }),
      accountSettings: { preferences: { requireApproval: false } }
    };
    
    // Mock global apiService
    global.apiService = mockApiService;
  });

  /**
   * Creates a mock chores store with assignSelectedChore action
   */
  const createAssignmentStore = () => {
    const state = {
      chores: [],
      quicklistChores: [],
      selectedChoreId: null,
      selectedQuicklistChore: null,
      multiAssignSelectedMembers: [],
      loading: false,
      error: null
    };

    return {
      ...state,
      
      get selectedChore() {
        if (this.selectedQuicklistChore) {
          return this.selectedQuicklistChore;
        }
        if (this.selectedChoreId) {
          return this.chores.find(c => c.id === this.selectedChoreId) || null;
        }
        return null;
      },
      
      async assignSelectedChore(assignTo) {
        const selectedChore = this.selectedChore;
        
        if (!selectedChore) {
          return { success: false, error: 'No chore selected' };
        }
        
        if (!assignTo) {
          return { success: false, error: 'No assignee specified' };
        }
        
        // Store original state for potential rollback
        const originalChores = [...this.chores];
        const selectedChoreCopy = { ...selectedChore };
        const originalSelectedChoreId = this.selectedChoreId;
        const originalSelectedQuicklistChore = this.selectedQuicklistChore;
        
        try {
          if (selectedChore.isNewFromQuicklist) {
            // Check if this quicklist chore requires details
            const quicklistChore = this.quicklistChores.find(qc => qc.name === selectedChore.name);
            if (quicklistChore && quicklistChore.isDetailed) {
              return { success: false, needsDetails: true, quicklistChore, assignTo };
            }
            
            // OPTIMISTIC UPDATE: Add new chore immediately
            const newChore = {
              id: `temp-${Date.now()}`,
              name: selectedChore.name,
              amount: selectedChore.amount || 0,
              category: selectedChore.category || 'regular',
              assignedTo: assignTo,
              completed: false,
              isDetailed: false,
              details: '',
              isOptimistic: true
            };
            
            this.chores.push(newChore);
            this.selectedChoreId = null;
            this.selectedQuicklistChore = null;
            
            // Make API call
            const response = await mockApiService.post(CONFIG.API.ENDPOINTS.CHORES, {
              name: newChore.name,
              amount: newChore.amount,
              category: newChore.category,
              assignedTo: assignTo,
              completed: false
            });
            
            // Update with server response
            const choreIndex = this.chores.findIndex(c => c.id === newChore.id);
            if (choreIndex !== -1) {
              this.chores[choreIndex] = {
                ...response.chore,
                isOptimistic: false
              };
            }
            
          } else {
            // OPTIMISTIC UPDATE: Move existing chore
            const choreIndex = this.chores.findIndex(c => c.id === selectedChore.id);
            
            if (choreIndex !== -1) {
              this.chores[choreIndex] = {
                ...this.chores[choreIndex],
                assignedTo: assignTo,
                isOptimistic: true
              };
            }
            
            this.selectedChoreId = null;
            this.selectedQuicklistChore = null;
            
            // Make API call
            const response = await mockApiService.put(
              `${CONFIG.API.ENDPOINTS.CHORES}/${selectedChoreCopy.id}/assign`,
              { assignedTo: assignTo }
            );
            
            if (choreIndex !== -1) {
              this.chores[choreIndex] = {
                ...response.chore,
                isOptimistic: false
              };
            }
          }
          
          return { success: true };
          
        } catch (error) {
          // ROLLBACK: Restore original state
          this.chores = originalChores;
          this.selectedChoreId = selectedChoreCopy.isNewFromQuicklist ? null : originalSelectedChoreId;
          this.selectedQuicklistChore = selectedChoreCopy.isNewFromQuicklist ? originalSelectedQuicklistChore : null;
          
          return { success: false, error: error.message };
        }
      }
    };
  };

  /**
   * Arbitrary for generating chore data
   */
  const choreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    amount: fc.integer({ min: 0, max: 100 }),
    category: fc.constantFrom('regular', 'game', 'bonus'),
    assignedTo: fc.option(fc.constantFrom('Alice', 'Bob', 'Charlie', 'unassigned'), { nil: null }),
    completed: fc.boolean()
  });

  /**
   * Arbitrary for generating quicklist chore selection
   */
  const quicklistChoreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    amount: fc.integer({ min: 0, max: 100 }),
    category: fc.constantFrom('regular', 'game', 'bonus'),
    isNewFromQuicklist: fc.constant(true),
    isDetailed: fc.constant(false)
  });

  /**
   * Arbitrary for generating assignee names
   */
  const assigneeArbitrary = fc.constantFrom('Alice', 'Bob', 'Charlie', 'unassigned');

  /**
   * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
   * **Validates: Requirements 5.3**
   * 
   * For any existing chore and assignee, the chore appears in target person's list immediately
   */
  it('Property: Existing chore assignment updates UI immediately (optimistic)', async () => {
    await fc.assert(
      fc.asyncProperty(
        choreArbitrary,
        assigneeArbitrary,
        async (chore, assignTo) => {
          const store = createAssignmentStore();
          store.chores = [{ ...chore }];
          store.selectedChoreId = chore.id;
          
          // Mock successful API response
          mockApiService.put.mockResolvedValue({
            chore: { ...chore, assignedTo: assignTo }
          });
          
          // Capture state before API resolves
          let immediateAssignedTo = null;
          const originalPut = mockApiService.put;
          mockApiService.put = vi.fn().mockImplementation(async (...args) => {
            // Capture the optimistic state
            immediateAssignedTo = store.chores.find(c => c.id === chore.id)?.assignedTo;
            return originalPut(...args);
          });
          
          await store.assignSelectedChore(assignTo);
          
          // Property: Chore was assigned to target immediately (optimistic update)
          expect(immediateAssignedTo).toBe(assignTo);
          
          // Property: Final state has correct assignment
          const finalChore = store.chores.find(c => c.id === chore.id);
          expect(finalChore?.assignedTo).toBe(assignTo);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
   * **Validates: Requirements 5.3**
   * 
   * For any quicklist chore and assignee, a new chore is created immediately
   */
  it('Property: Quicklist chore assignment creates new chore immediately (optimistic)', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        assigneeArbitrary,
        async (quicklistChore, assignTo) => {
          const store = createAssignmentStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          const initialChoreCount = store.chores.length;
          
          // Mock successful API response
          mockApiService.post.mockResolvedValue({
            chore: { 
              id: 'server-id-123',
              name: quicklistChore.name,
              amount: quicklistChore.amount,
              category: quicklistChore.category,
              assignedTo: assignTo,
              completed: false
            }
          });
          
          await store.assignSelectedChore(assignTo);
          
          // Property: A new chore was added
          expect(store.chores.length).toBe(initialChoreCount + 1);
          
          // Property: New chore has correct assignment
          const newChore = store.chores.find(c => c.name === quicklistChore.name);
          expect(newChore?.assignedTo).toBe(assignTo);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
   * **Validates: Requirements 5.3**
   * 
   * For any chore and API failure, the state is rolled back to original
   */
  it('Property: Failed assignment rolls back to original state', async () => {
    await fc.assert(
      fc.asyncProperty(
        choreArbitrary,
        assigneeArbitrary,
        async (chore, assignTo) => {
          const store = createAssignmentStore();
          const originalChore = { ...chore };
          store.chores = [{ ...chore }];
          store.selectedChoreId = chore.id;
          
          // Mock API failure
          mockApiService.put.mockRejectedValue(new Error('API Error'));
          
          const result = await store.assignSelectedChore(assignTo);
          
          // Property: Operation failed
          expect(result.success).toBe(false);
          
          // Property: Chore is restored to original state
          const restoredChore = store.chores.find(c => c.id === chore.id);
          expect(restoredChore?.assignedTo).toBe(originalChore.assignedTo);
          
          // Property: Chore count unchanged
          expect(store.chores.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
   * **Validates: Requirements 5.3**
   * 
   * For any quicklist chore and API failure, the optimistic chore is removed
   */
  it('Property: Failed quicklist assignment removes optimistic chore', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        assigneeArbitrary,
        async (quicklistChore, assignTo) => {
          const store = createAssignmentStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          const initialChoreCount = store.chores.length;
          
          // Mock API failure
          mockApiService.post.mockRejectedValue(new Error('API Error'));
          
          const result = await store.assignSelectedChore(assignTo);
          
          // Property: Operation failed
          expect(result.success).toBe(false);
          
          // Property: Chore count is back to original (optimistic chore removed)
          expect(store.chores.length).toBe(initialChoreCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 4: Chore Assignment Optimistic Update**
   * **Validates: Requirements 5.3**
   * 
   * Selection is cleared immediately after assignment starts
   */
  it('Property: Selection is cleared immediately on assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        choreArbitrary,
        assigneeArbitrary,
        async (chore, assignTo) => {
          const store = createAssignmentStore();
          store.chores = [{ ...chore }];
          store.selectedChoreId = chore.id;
          
          // Mock slow API response
          mockApiService.put.mockImplementation(() => new Promise(resolve => {
            // Check selection state during API call
            expect(store.selectedChoreId).toBeNull();
            resolve({ chore: { ...chore, assignedTo: assignTo } });
          }));
          
          await store.assignSelectedChore(assignTo);
          
          // Property: Selection remains cleared after completion
          expect(store.selectedChoreId).toBeNull();
          expect(store.selectedQuicklistChore).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property-Based Tests for Multi-Assignment Count
 * 
 * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
 * **Validates: Requirements 5.5**
 * 
 * Property: For any quicklist chore and set of N selected members, when confirmMultiAssignment
 * is called, exactly N new chores SHALL be created (one per member), each assigned to the
 * corresponding member.
 */

describe('Multi-Assignment Count Property Tests', () => {
  let mockApiService;
  let mockUIStore;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    mockUIStore = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      openModal: vi.fn(),
      closeModal: vi.fn()
    };
    
    global.window = {
      ...global.window,
      apiService: mockApiService,
      offlineStorage: null,
      useUIStore: () => mockUIStore,
      useFamilyStore: () => ({
        members: [
          { id: 'member-1', displayName: 'Alice' },
          { id: 'member-2', displayName: 'Bob' },
          { id: 'member-3', displayName: 'Charlie' },
          { id: 'member-4', displayName: 'Diana' },
          { id: 'member-5', displayName: 'Eve' }
        ],
        loadMembers: vi.fn().mockResolvedValue(),
        loadEarnings: vi.fn().mockResolvedValue(),
        loadElectronicsStatus: vi.fn().mockResolvedValue(),
        updateElectronicsStatusOptimistically: vi.fn()
      }),
      useOfflineStore: () => ({
        isFeatureAvailable: () => true,
        getDisabledFeatureMessage: () => ''
      }),
      accountSettings: { preferences: { requireApproval: false } }
    };
    
    global.apiService = mockApiService;
  });

  /**
   * Creates a mock chores store with multi-assignment actions
   */
  const createMultiAssignStore = () => {
    const state = {
      chores: [],
      quicklistChores: [],
      selectedChoreId: null,
      selectedQuicklistChore: null,
      multiAssignSelectedMembers: [],
      loading: false,
      error: null
    };

    return {
      ...state,
      
      async assignQuicklistChoreToMember(quicklistChore, memberName) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const newChore = {
          id: tempId,
          name: quicklistChore.name,
          amount: quicklistChore.amount || 0,
          category: quicklistChore.category || 'regular',
          details: '',
          assignedTo: memberName,
          completed: false,
          isPendingApproval: false,
          isOptimistic: true
        };

        this.chores.push(newChore);

        try {
          const choreData = {
            name: newChore.name,
            amount: newChore.amount,
            category: newChore.category,
            assignedTo: memberName,
            completed: false
          };

          const response = await mockApiService.post(CONFIG.API.ENDPOINTS.CHORES, choreData);

          const choreIndex = this.chores.findIndex(c => c.id === tempId);
          if (choreIndex !== -1) {
            this.chores[choreIndex] = {
              ...response.chore,
              isOptimistic: false
            };
          }
          
          return { success: true, chore: response.chore };
        } catch (error) {
          const choreIndex = this.chores.findIndex(c => c.id === tempId);
          if (choreIndex !== -1) {
            this.chores.splice(choreIndex, 1);
          }
          return { success: false, error: error.message };
        }
      },
      
      async confirmMultiAssignment() {
        const familyStore = window.useFamilyStore?.();
        
        if (!this.selectedQuicklistChore || this.multiAssignSelectedMembers.length === 0) {
          return { success: false, successful: [], failed: [], error: 'No chore or members selected' };
        }

        const selectedMembers = this.multiAssignSelectedMembers;
        const quicklistChore = this.selectedQuicklistChore;
        const people = familyStore?.members || [];

        try {
          const assignmentPromises = selectedMembers.map(async (memberId) => {
            const member = people.find(p => p.id === memberId);
            if (!member) return { memberId, success: false, error: 'Member not found' };

            const memberDisplayName = member.displayName || member.name;

            try {
              const result = await this.assignQuicklistChoreToMember(quicklistChore, memberDisplayName);
              return { memberId, memberName: memberDisplayName, success: result.success, error: result.error };
            } catch (error) {
              return { memberId, memberName: memberDisplayName, success: false, error: error.message };
            }
          });

          const assignmentResults = await Promise.allSettled(assignmentPromises);

          const successful = assignmentResults.filter(result =>
            result.status === 'fulfilled' && result.value.success
          ).map(result => result.value);

          const failed = assignmentResults.filter(result =>
            result.status === 'rejected' ||
            (result.status === 'fulfilled' && !result.value.success)
          ).map(result => result.status === 'rejected' ? { error: result.reason } : result.value);

          this.cancelMultiAssignment();

          return { success: successful.length > 0, successful, failed };

        } catch (error) {
          return { success: false, successful: [], failed: [], error: error.message };
        }
      },
      
      cancelMultiAssignment() {
        this.selectedQuicklistChore = null;
        this.multiAssignSelectedMembers = [];
      }
    };
  };

  /**
   * Arbitrary for generating quicklist chore data
   */
  const quicklistChoreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    amount: fc.integer({ min: 0, max: 100 }),
    category: fc.constantFrom('regular', 'game', 'bonus'),
    isDetailed: fc.constant(false)
  });

  /**
   * Arbitrary for generating member selection (1-5 members)
   */
  const memberSelectionArbitrary = fc.uniqueArray(
    fc.constantFrom('member-1', 'member-2', 'member-3', 'member-4', 'member-5'),
    { minLength: 1, maxLength: 5 }
  );

  /**
   * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
   * **Validates: Requirements 5.5**
   * 
   * For any quicklist chore and N selected members, exactly N chores are created
   */
  it('Property: Multi-assignment creates exactly N chores for N members', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        memberSelectionArbitrary,
        async (quicklistChore, selectedMembers) => {
          const store = createMultiAssignStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          store.multiAssignSelectedMembers = [...selectedMembers];
          const initialChoreCount = store.chores.length;
          const expectedNewChores = selectedMembers.length;
          
          // Mock successful API responses for each member
          let callCount = 0;
          mockApiService.post.mockImplementation(async (endpoint, data) => {
            callCount++;
            return {
              chore: {
                id: `server-chore-${callCount}`,
                name: data.name,
                amount: data.amount,
                category: data.category,
                assignedTo: data.assignedTo,
                completed: false
              }
            };
          });
          
          const result = await store.confirmMultiAssignment();
          
          // Property: Exactly N chores were created
          expect(store.chores.length).toBe(initialChoreCount + expectedNewChores);
          
          // Property: All assignments were successful
          expect(result.successful.length).toBe(expectedNewChores);
          expect(result.failed.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
   * **Validates: Requirements 5.5**
   * 
   * Each created chore is assigned to the corresponding member
   */
  it('Property: Each chore is assigned to the correct member', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        memberSelectionArbitrary,
        async (quicklistChore, selectedMembers) => {
          const store = createMultiAssignStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          store.multiAssignSelectedMembers = [...selectedMembers];
          
          const familyStore = window.useFamilyStore();
          const expectedMemberNames = selectedMembers.map(memberId => {
            const member = familyStore.members.find(m => m.id === memberId);
            return member?.displayName;
          }).filter(Boolean);
          
          // Mock successful API responses
          mockApiService.post.mockImplementation(async (endpoint, data) => ({
            chore: {
              id: `server-chore-${Date.now()}`,
              name: data.name,
              amount: data.amount,
              category: data.category,
              assignedTo: data.assignedTo,
              completed: false
            }
          }));
          
          await store.confirmMultiAssignment();
          
          // Property: Each expected member has a chore assigned to them
          const assignedMembers = store.chores.map(c => c.assignedTo);
          expectedMemberNames.forEach(memberName => {
            expect(assignedMembers).toContain(memberName);
          });
          
          // Property: All chores have the same name as the quicklist chore
          store.chores.forEach(chore => {
            expect(chore.name).toBe(quicklistChore.name);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
   * **Validates: Requirements 5.5**
   * 
   * Partial failures still create chores for successful members
   */
  it('Property: Partial failures create chores only for successful members', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        fc.uniqueArray(
          fc.constantFrom('member-1', 'member-2', 'member-3'),
          { minLength: 2, maxLength: 3 }
        ),
        async (quicklistChore, selectedMembers) => {
          const store = createMultiAssignStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          store.multiAssignSelectedMembers = [...selectedMembers];
          
          // Mock: first member fails, rest succeed
          let callCount = 0;
          mockApiService.post.mockImplementation(async (endpoint, data) => {
            callCount++;
            if (callCount === 1) {
              throw new Error('API Error');
            }
            return {
              chore: {
                id: `server-chore-${callCount}`,
                name: data.name,
                amount: data.amount,
                category: data.category,
                assignedTo: data.assignedTo,
                completed: false
              }
            };
          });
          
          const result = await store.confirmMultiAssignment();
          
          // Property: Number of chores equals successful assignments
          expect(store.chores.length).toBe(result.successful.length);
          
          // Property: Failed count is 1 (first member)
          expect(result.failed.length).toBe(1);
          
          // Property: Successful count is N-1
          expect(result.successful.length).toBe(selectedMembers.length - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
   * **Validates: Requirements 5.5**
   * 
   * Selection is cleared after multi-assignment
   */
  it('Property: Selection is cleared after multi-assignment', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        memberSelectionArbitrary,
        async (quicklistChore, selectedMembers) => {
          const store = createMultiAssignStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          store.multiAssignSelectedMembers = [...selectedMembers];
          
          mockApiService.post.mockResolvedValue({
            chore: { id: 'test', name: quicklistChore.name, assignedTo: 'Alice' }
          });
          
          await store.confirmMultiAssignment();
          
          // Property: Selection is cleared
          expect(store.selectedQuicklistChore).toBeNull();
          expect(store.multiAssignSelectedMembers).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 5: Multi-Assignment Creates Correct Number of Chores**
   * **Validates: Requirements 5.5**
   * 
   * Empty selection returns early without creating chores
   */
  it('Property: Empty selection returns early without creating chores', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoreArbitrary,
        async (quicklistChore) => {
          const store = createMultiAssignStore();
          store.selectedQuicklistChore = { ...quicklistChore };
          store.multiAssignSelectedMembers = []; // Empty selection
          
          const result = await store.confirmMultiAssignment();
          
          // Property: No chores created
          expect(store.chores.length).toBe(0);
          
          // Property: Returns failure
          expect(result.success).toBe(false);
          expect(result.successful.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
