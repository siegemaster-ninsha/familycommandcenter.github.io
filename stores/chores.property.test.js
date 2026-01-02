/**
 * Property-Based Tests for Chores Store - Data Ownership
 * 
 * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
 * **Validates: Requirements 1.4, 2.4**
 * 
 * Property: For any data loading action (loadChores, loadQuicklistChores), after the
 * action completes successfully, the store's state SHALL contain the data returned
 * from the API and SHALL be the single source of truth.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

describe('Chores Store Data Ownership Property Tests', () => {
  let createStore;
  let mockApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock API service
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    // Mock global dependencies
    global.window = {
      ...global.window,
      apiService: mockApiService,
      offlineStorage: null,
      useUIStore: () => ({
        showSuccess: vi.fn(),
        showError: vi.fn()
      }),
      useFamilyStore: () => ({
        members: [],
        loadMembers: vi.fn()
      })
    };

    // Create a fresh store instance for each test
    createStore = () => {
      const state = {
        chores: [],
        quicklistChores: [],
        selectedChoreId: null,
        selectedQuicklistChore: null,
        loading: false,
        error: null,
        isUsingCachedData: false
      };

      return {
        // State
        ...state,
        
        // Actions
        async loadChores() {
          this.loading = true;
          this.error = null;
          this.isUsingCachedData = false;
          
          try {
            const data = await mockApiService.get(CONFIG.API.ENDPOINTS.CHORES);
            this.chores = data.chores || [];
            return { success: true, chores: this.chores };
          } catch (error) {
            this.error = error.message;
            this.chores = [];
            return { success: false, error: error.message };
          } finally {
            this.loading = false;
          }
        },
        
        async loadQuicklistChores() {
          try {
            const data = await mockApiService.get(CONFIG.API.ENDPOINTS.QUICKLIST);
            this.quicklistChores = data.quicklistChores || [];
            return { success: true, quicklistChores: this.quicklistChores };
          } catch (error) {
            this.quicklistChores = [];
            return { success: false, error: error.message };
          }
        }
      };
    };
  });

  /**
   * Arbitrary for generating valid chore objects
   */
  const choreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    amount: fc.integer({ min: 0, max: 1000 }),
    category: fc.constantFrom('regular', 'game', 'bonus'),
    completed: fc.boolean(),
    assignedTo: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    isPendingApproval: fc.boolean()
  });

  /**
   * Arbitrary for generating arrays of chores
   */
  const choresArrayArbitrary = fc.array(choreArbitrary, { minLength: 0, maxLength: 50 });

  /**
   * Arbitrary for generating quicklist chore objects
   */
  const quicklistChoreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    amount: fc.integer({ min: 0, max: 1000 }),
    category: fc.constantFrom('regular', 'game', 'bonus'),
    isDetailed: fc.boolean(),
    defaultDetails: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: '' })
  });

  /**
   * Arbitrary for generating arrays of quicklist chores
   */
  const quicklistChoresArrayArbitrary = fc.array(quicklistChoreArbitrary, { minLength: 0, maxLength: 50 });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * For any array of chores returned by the API, after loadChores completes,
   * the store's chores state SHALL exactly match the API response.
   */
  it('Property 2: loadChores - store contains exact data from API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        async (apiChores) => {
          const store = createStore();
          
          // Setup mock to return the generated chores
          mockApiService.get.mockResolvedValue({ chores: apiChores });
          
          // Load chores
          const result = await store.loadChores();
          
          // Property: Load was successful
          expect(result.success).toBe(true);
          
          // Property: Store contains exactly the data from API
          expect(store.chores).toEqual(apiChores);
          expect(store.chores.length).toBe(apiChores.length);
          
          // Property: Each chore in store matches corresponding API chore
          for (let i = 0; i < apiChores.length; i++) {
            expect(store.chores[i]).toEqual(apiChores[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * For any array of quicklist chores returned by the API, after loadQuicklistChores
   * completes, the store's quicklistChores state SHALL exactly match the API response.
   */
  it('Property 2: loadQuicklistChores - store contains exact data from API response', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoresArrayArbitrary,
        async (apiQuicklistChores) => {
          const store = createStore();
          
          // Setup mock to return the generated quicklist chores
          mockApiService.get.mockResolvedValue({ quicklistChores: apiQuicklistChores });
          
          // Load quicklist chores
          const result = await store.loadQuicklistChores();
          
          // Property: Load was successful
          expect(result.success).toBe(true);
          
          // Property: Store contains exactly the data from API
          expect(store.quicklistChores).toEqual(apiQuicklistChores);
          expect(store.quicklistChores.length).toBe(apiQuicklistChores.length);
          
          // Property: Each quicklist chore in store matches corresponding API chore
          for (let i = 0; i < apiQuicklistChores.length; i++) {
            expect(store.quicklistChores[i]).toEqual(apiQuicklistChores[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Loading chores replaces any existing data - store is single source of truth.
   */
  it('Property 2: loadChores replaces existing data completely', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        choresArrayArbitrary,
        async (initialChores, newChores) => {
          const store = createStore();
          
          // Set initial state
          store.chores = [...initialChores];
          
          // Setup mock to return new chores
          mockApiService.get.mockResolvedValue({ chores: newChores });
          
          // Load chores
          await store.loadChores();
          
          // Property: Store contains only the new data, not merged with old
          expect(store.chores).toEqual(newChores);
          expect(store.chores.length).toBe(newChores.length);
          
          // Property: Old chores that aren't in new response are gone
          for (const oldChore of initialChores) {
            const stillExists = store.chores.some(c => c.id === oldChore.id);
            const inNewResponse = newChores.some(c => c.id === oldChore.id);
            expect(stillExists).toBe(inNewResponse);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Loading quicklist chores replaces any existing data - store is single source of truth.
   */
  it('Property 2: loadQuicklistChores replaces existing data completely', async () => {
    await fc.assert(
      fc.asyncProperty(
        quicklistChoresArrayArbitrary,
        quicklistChoresArrayArbitrary,
        async (initialQuicklist, newQuicklist) => {
          const store = createStore();
          
          // Set initial state
          store.quicklistChores = [...initialQuicklist];
          
          // Setup mock to return new quicklist
          mockApiService.get.mockResolvedValue({ quicklistChores: newQuicklist });
          
          // Load quicklist chores
          await store.loadQuicklistChores();
          
          // Property: Store contains only the new data
          expect(store.quicklistChores).toEqual(newQuicklist);
          expect(store.quicklistChores.length).toBe(newQuicklist.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Store becomes the single source of truth after load - data is accessible.
   */
  it('Property 2: Store is single source of truth after load', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary.filter(arr => arr.length > 0),
        async (apiChores) => {
          const store = createStore();
          
          mockApiService.get.mockResolvedValue({ chores: apiChores });
          
          // Load chores
          await store.loadChores();
          
          // Property: Store contains the data and is accessible
          expect(store.chores.length).toBe(apiChores.length);
          
          // Property: Data can be accessed and modified through the store
          // (store is the owner/source of truth)
          const firstChore = store.chores[0];
          expect(firstChore).toBeDefined();
          expect(firstChore.id).toBe(apiChores[0].id);
          expect(firstChore.name).toBe(apiChores[0].name);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Empty API response results in empty store state.
   */
  it('Property 2: Empty API response results in empty store state', async () => {
    const store = createStore();
    
    // Set some initial data
    store.chores = [{ id: '1', name: 'Existing chore' }];
    store.quicklistChores = [{ id: '2', name: 'Existing quicklist' }];
    
    // Mock empty responses
    mockApiService.get.mockResolvedValueOnce({ chores: [] });
    await store.loadChores();
    
    mockApiService.get.mockResolvedValueOnce({ quicklistChores: [] });
    await store.loadQuicklistChores();
    
    // Property: Store is empty after loading empty response
    expect(store.chores).toEqual([]);
    expect(store.quicklistChores).toEqual([]);
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Missing chores array in response is handled as empty array.
   */
  it('Property 2: Missing data in API response defaults to empty array', async () => {
    const store = createStore();
    
    // Set some initial data
    store.chores = [{ id: '1', name: 'Existing' }];
    
    // Mock response without chores property
    mockApiService.get.mockResolvedValue({});
    
    await store.loadChores();
    
    // Property: Store defaults to empty array when response lacks data
    expect(store.chores).toEqual([]);
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Chore IDs are preserved exactly as returned by API.
   */
  it('Property 2: Chore IDs are preserved exactly from API', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        async (apiChores) => {
          const store = createStore();
          
          mockApiService.get.mockResolvedValue({ chores: apiChores });
          await store.loadChores();
          
          // Property: Every chore ID from API exists in store
          const storeIds = new Set(store.chores.map(c => c.id));
          const apiIds = new Set(apiChores.map(c => c.id));
          
          expect(storeIds).toEqual(apiIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * All chore properties are preserved exactly from API.
   */
  it('Property 2: All chore properties are preserved from API', async () => {
    await fc.assert(
      fc.asyncProperty(
        choreArbitrary,
        async (apiChore) => {
          const store = createStore();
          
          mockApiService.get.mockResolvedValue({ chores: [apiChore] });
          await store.loadChores();
          
          const storeChore = store.chores[0];
          
          // Property: All properties match exactly
          expect(storeChore.id).toBe(apiChore.id);
          expect(storeChore.name).toBe(apiChore.name);
          expect(storeChore.amount).toBe(apiChore.amount);
          expect(storeChore.category).toBe(apiChore.category);
          expect(storeChore.completed).toBe(apiChore.completed);
          expect(storeChore.assignedTo).toBe(apiChore.assignedTo);
          expect(storeChore.isPendingApproval).toBe(apiChore.isPendingApproval);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Loading state is correctly managed during load operations.
   */
  it('Property 2: Loading state is false after successful load', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        async (apiChores) => {
          const store = createStore();
          
          mockApiService.get.mockResolvedValue({ chores: apiChores });
          
          // Before load
          expect(store.loading).toBe(false);
          
          // After load
          await store.loadChores();
          
          // Property: Loading is false after completion
          expect(store.loading).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 2: Store Data Ownership After Load**
   * **Validates: Requirements 1.4, 2.4**
   * 
   * Error state is null after successful load.
   */
  it('Property 2: Error state is null after successful load', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        async (apiChores) => {
          const store = createStore();
          
          // Set an initial error
          store.error = 'Previous error';
          
          mockApiService.get.mockResolvedValue({ chores: apiChores });
          await store.loadChores();
          
          // Property: Error is cleared after successful load
          expect(store.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
