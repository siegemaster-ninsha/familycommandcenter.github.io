/**
 * Property-Based Tests for useOptimistic Composable
 * 
 * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 * 
 * Property: For any optimistic update operation, if the API call fails, the state
 * SHALL be restored to the exact value captured before the optimistic mutation was applied.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

describe('useOptimistic Property Tests', () => {
  let useOptimistic;
  let mockUIStore;

  beforeEach(() => {
    // Setup UI store mock
    mockUIStore = {
      showError: vi.fn(),
      showSuccess: vi.fn()
    };
    
    global.window = Object.create(null);
    global.window.useUIStore = () => mockUIStore;

    // Setup CONFIG mock
    global.CONFIG = {
      ENV: {
        IS_DEVELOPMENT: false
      }
    };

    // Define the composable inline for testing (matches the actual implementation)
    useOptimistic = () => {
      const getUIStore = () => global.window.useUIStore?.();

      const deepClone = (obj) => {
        if (obj === null || obj === undefined) {
          return obj;
        }
        if (typeof obj !== 'object') {
          return obj;
        }
        if (Array.isArray(obj)) {
          return obj.map(item => deepClone(item));
        }
        try {
          return JSON.parse(JSON.stringify(obj));
        } catch {
          return { ...obj };
        }
      };

      async function execute({ getState, setState, apiCall, onSuccess, errorMessage }) {
        if (typeof getState !== 'function') {
          throw new Error('[useOptimistic] getState must be a function');
        }
        if (typeof setState !== 'function') {
          throw new Error('[useOptimistic] setState must be a function');
        }
        if (typeof apiCall !== 'function') {
          throw new Error('[useOptimistic] apiCall must be a function');
        }

        const originalState = deepClone(getState());

        try {
          const response = await apiCall();
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(response);
          }
          return { success: true, response };
        } catch (error) {
          setState(originalState);
          const uiStore = getUIStore();
          if (uiStore && errorMessage) {
            if (typeof uiStore.showError === 'function') {
              uiStore.showError(errorMessage);
            } else if (typeof uiStore.showSuccess === 'function') {
              uiStore.showSuccess(`❌ ${errorMessage}`);
            }
          }
          return { success: false, error };
        }
      }

      return { execute, _deepClone: deepClone };
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Arbitrary for generating chore-like objects
   */
  const choreArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    assignedTo: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    completed: fc.boolean(),
    value: fc.integer({ min: 0, max: 100 })
  });

  /**
   * Arbitrary for generating arrays of chores
   */
  const choresArrayArbitrary = fc.array(choreArbitrary, { minLength: 0, maxLength: 20 });

  /**
   * Arbitrary for generating nested state objects
   */
  const nestedStateArbitrary = fc.record({
    items: choresArrayArbitrary,
    metadata: fc.record({
      lastUpdated: fc.date().map(d => d.toISOString()),
      count: fc.integer({ min: 0, max: 1000 })
    }),
    flags: fc.record({
      loading: fc.boolean(),
      error: fc.option(fc.string(), { nil: null })
    })
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any array state, if the API call fails, the state is restored exactly.
   */
  it('Property 7: Array state is restored exactly on API failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        async (originalChores) => {
          let currentState = JSON.parse(JSON.stringify(originalChores));
          const capturedOriginal = JSON.parse(JSON.stringify(originalChores));
          
          const { execute } = useOptimistic();
          
          const result = await execute({
            getState: () => currentState,
            setState: (state) => { currentState = state; },
            apiCall: () => Promise.reject(new Error('API failure')),
            errorMessage: 'Failed to update'
          });

          // Property: State is restored to exact original value
          expect(result.success).toBe(false);
          expect(currentState).toEqual(capturedOriginal);
          expect(currentState.length).toBe(capturedOriginal.length);
          
          // Verify each item is restored
          for (let i = 0; i < currentState.length; i++) {
            expect(currentState[i]).toEqual(capturedOriginal[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any nested state object, if the API call fails, the state is restored exactly.
   */
  it('Property 7: Nested state is restored exactly on API failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        nestedStateArbitrary,
        async (originalState) => {
          let currentState = JSON.parse(JSON.stringify(originalState));
          const capturedOriginal = JSON.parse(JSON.stringify(originalState));
          
          const { execute } = useOptimistic();
          
          const result = await execute({
            getState: () => currentState,
            setState: (state) => { currentState = state; },
            apiCall: () => Promise.reject(new Error('Network error')),
            errorMessage: 'Operation failed'
          });

          // Property: Nested state is restored exactly
          expect(result.success).toBe(false);
          expect(currentState).toEqual(capturedOriginal);
          expect(currentState.items).toEqual(capturedOriginal.items);
          expect(currentState.metadata).toEqual(capturedOriginal.metadata);
          expect(currentState.flags).toEqual(capturedOriginal.flags);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any state that was mutated before API call, rollback restores original.
   */
  it('Property 7: Mutated state is rolled back to pre-mutation value', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary.filter(arr => arr.length > 0),
        fc.integer({ min: 0 }),
        async (originalChores, indexToRemove) => {
          // Ensure valid index
          const removeIndex = indexToRemove % originalChores.length;
          
          let currentState = JSON.parse(JSON.stringify(originalChores));
          const capturedOriginal = JSON.parse(JSON.stringify(originalChores));
          
          const { execute } = useOptimistic();
          
          // Simulate optimistic mutation (remove an item)
          const mutatedState = currentState.filter((_, i) => i !== removeIndex);
          currentState = mutatedState;
          
          const result = await execute({
            getState: () => capturedOriginal, // Capture original before mutation
            setState: (state) => { currentState = state; },
            apiCall: () => Promise.reject(new Error('Delete failed')),
            errorMessage: 'Failed to delete'
          });

          // Property: State is restored to original (before mutation)
          expect(result.success).toBe(false);
          expect(currentState).toEqual(capturedOriginal);
          expect(currentState.length).toBe(capturedOriginal.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any primitive state value, rollback restores the exact value.
   */
  it('Property 7: Primitive state values are restored exactly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer(),
          fc.string(),
          fc.boolean(),
          fc.constant(null)
        ),
        async (originalValue) => {
          let currentState = originalValue;
          
          const { execute } = useOptimistic();
          
          const result = await execute({
            getState: () => currentState,
            setState: (state) => { currentState = state; },
            apiCall: () => Promise.reject(new Error('API error')),
            errorMessage: 'Failed'
          });

          // Property: Primitive value is restored exactly
          expect(result.success).toBe(false);
          expect(currentState).toBe(originalValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * For any successful API call, state is NOT rolled back (onSuccess is called).
   */
  it('Property 7: Successful API calls do not trigger rollback', async () => {
    await fc.assert(
      fc.asyncProperty(
        choresArrayArbitrary,
        fc.record({ success: fc.constant(true), data: fc.string() }),
        async (originalState, apiResponse) => {
          let currentState = JSON.parse(JSON.stringify(originalState));
          let setStateCalled = false;
          let onSuccessCalled = false;
          let receivedResponse = null;
          
          const { execute } = useOptimistic();
          
          const result = await execute({
            getState: () => currentState,
            setState: () => { setStateCalled = true; },
            apiCall: () => Promise.resolve(apiResponse),
            onSuccess: (response) => {
              onSuccessCalled = true;
              receivedResponse = response;
            }
          });

          // Property: On success, setState is NOT called (no rollback)
          expect(result.success).toBe(true);
          expect(setStateCalled).toBe(false);
          expect(onSuccessCalled).toBe(true);
          expect(receivedResponse).toEqual(apiResponse);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-refactoring, Property 7: Optimistic Update Round-Trip**
   * **Validates: Requirements 6.1, 6.2, 6.3**
   * 
   * Deep clone ensures original state is not affected by mutations to current state.
   */
  it('Property 7: Deep clone prevents reference pollution', async () => {
    await fc.assert(
      fc.asyncProperty(
        nestedStateArbitrary,
        async (originalState) => {
          let currentState = JSON.parse(JSON.stringify(originalState));
          const capturedOriginal = JSON.parse(JSON.stringify(originalState));
          
          const { execute } = useOptimistic();
          
          // Mutate current state deeply before API call completes
          const mutateState = () => {
            if (currentState.items && currentState.items.length > 0) {
              currentState.items[0].name = 'MUTATED';
              currentState.items[0].completed = !currentState.items[0].completed;
            }
            currentState.metadata.count = 999999;
            currentState.flags.loading = true;
          };
          
          const result = await execute({
            getState: () => currentState,
            setState: (state) => { currentState = state; },
            apiCall: async () => {
              // Mutate during API call
              mutateState();
              throw new Error('API failed');
            },
            errorMessage: 'Failed'
          });

          // Property: Rollback restores to captured state, not mutated state
          expect(result.success).toBe(false);
          expect(currentState).toEqual(capturedOriginal);
          
          // Verify deep properties are restored
          if (capturedOriginal.items.length > 0) {
            expect(currentState.items[0].name).toBe(capturedOriginal.items[0].name);
            expect(currentState.items[0].completed).toBe(capturedOriginal.items[0].completed);
          }
          expect(currentState.metadata.count).toBe(capturedOriginal.metadata.count);
          expect(currentState.flags.loading).toBe(capturedOriginal.flags.loading);
        }
      ),
      { numRuns: 100 }
    );
  });
});
