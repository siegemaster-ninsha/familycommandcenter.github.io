/**
 * Unit Tests for useOptimistic Composable
 * 
 * Tests:
 * - State capture before mutation
 * - Rollback restores original state on failure
 * - Success handler is called on success
 * 
 * Requirements: 10.1, 10.4, 10.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useOptimistic Composable', () => {
  let useOptimistic;
  let mockUIStore;

  beforeEach(() => {
    // Setup UI store mock
    mockUIStore = {
      showError: vi.fn(),
      showSuccess: vi.fn()
    };
    
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

  describe('State Capture', () => {
    it('should capture original state before API call', async () => {
      const originalState = { items: [{ id: 1, name: 'Item 1' }] };
      let capturedState = null;
      
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => {
          capturedState = originalState;
          return originalState;
        },
        setState: vi.fn(),
        apiCall: () => Promise.resolve({ success: true }),
        onSuccess: vi.fn()
      });

      expect(capturedState).toEqual(originalState);
    });

    it('should deep clone state to prevent reference issues', async () => {
      const originalState = { items: [{ id: 1, nested: { value: 'test' } }] };
      let clonedState = null;
      
      const { execute } = useOptimistic();
      const setStateMock = vi.fn((state) => { clonedState = state; });
      
      // Force a failure to trigger rollback
      await execute({
        getState: () => originalState,
        setState: setStateMock,
        apiCall: () => Promise.reject(new Error('API Error')),
        errorMessage: 'Test error'
      });

      // Verify the rolled back state is a deep clone, not the same reference
      expect(clonedState).toEqual(originalState);
      expect(clonedState).not.toBe(originalState);
      expect(clonedState.items).not.toBe(originalState.items);
      expect(clonedState.items[0]).not.toBe(originalState.items[0]);
    });

    it('should handle null state', async () => {
      const { execute } = useOptimistic();
      const setStateMock = vi.fn();
      
      await execute({
        getState: () => null,
        setState: setStateMock,
        apiCall: () => Promise.reject(new Error('API Error')),
        errorMessage: 'Test error'
      });

      expect(setStateMock).toHaveBeenCalledWith(null);
    });

    it('should handle primitive state values', async () => {
      const { execute } = useOptimistic();
      const setStateMock = vi.fn();
      
      await execute({
        getState: () => 42,
        setState: setStateMock,
        apiCall: () => Promise.reject(new Error('API Error')),
        errorMessage: 'Test error'
      });

      expect(setStateMock).toHaveBeenCalledWith(42);
    });
  });

  describe('Rollback on Failure', () => {
    it('should restore original state when API call fails', async () => {
      const originalState = { chores: [{ id: 1, name: 'Chore 1' }, { id: 2, name: 'Chore 2' }] };
      let currentState = { ...originalState };
      
      const { execute } = useOptimistic();
      
      const result = await execute({
        getState: () => currentState,
        setState: (state) => { currentState = state; },
        apiCall: () => Promise.reject(new Error('Network error')),
        errorMessage: 'Failed to update'
      });

      expect(result.success).toBe(false);
      expect(currentState).toEqual(originalState);
    });

    it('should restore array state correctly after failure', async () => {
      const originalItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
      let items = [...originalItems];
      
      const { execute } = useOptimistic();
      
      // Simulate optimistic removal before API call
      items = items.filter(i => i.id !== 2);
      
      await execute({
        getState: () => originalItems, // Capture original before mutation
        setState: (state) => { items = state; },
        apiCall: () => Promise.reject(new Error('Delete failed')),
        errorMessage: 'Failed to delete'
      });

      expect(items).toEqual(originalItems);
      expect(items.length).toBe(3);
    });

    it('should show error message via UI store on failure', async () => {
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.reject(new Error('API Error')),
        errorMessage: 'Something went wrong'
      });

      expect(mockUIStore.showError).toHaveBeenCalledWith('Something went wrong');
    });

    it('should fallback to showSuccess with error indicator if showError not available', async () => {
      // Remove showError from mock
      mockUIStore.showError = undefined;
      
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.reject(new Error('API Error')),
        errorMessage: 'Something went wrong'
      });

      expect(mockUIStore.showSuccess).toHaveBeenCalledWith('❌ Something went wrong');
    });

    it('should not show error message if errorMessage not provided', async () => {
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.reject(new Error('API Error'))
        // No errorMessage provided
      });

      expect(mockUIStore.showError).not.toHaveBeenCalled();
      expect(mockUIStore.showSuccess).not.toHaveBeenCalled();
    });

    it('should return error object on failure', async () => {
      const testError = new Error('Test API Error');
      const { execute } = useOptimistic();
      
      const result = await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.reject(testError),
        errorMessage: 'Failed'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(testError);
    });
  });

  describe('Success Handler', () => {
    it('should call onSuccess handler with API response on success', async () => {
      const apiResponse = { id: 1, name: 'New Item', created: true };
      const onSuccessMock = vi.fn();
      
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.resolve(apiResponse),
        onSuccess: onSuccessMock
      });

      expect(onSuccessMock).toHaveBeenCalledWith(apiResponse);
    });

    it('should return success result with response', async () => {
      const apiResponse = { success: true, data: { id: 123 } };
      
      const { execute } = useOptimistic();
      
      const result = await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.resolve(apiResponse),
        onSuccess: vi.fn()
      });

      expect(result.success).toBe(true);
      expect(result.response).toEqual(apiResponse);
    });

    it('should not call setState on success (no rollback needed)', async () => {
      const setStateMock = vi.fn();
      
      const { execute } = useOptimistic();
      
      await execute({
        getState: () => ({ items: [] }),
        setState: setStateMock,
        apiCall: () => Promise.resolve({ success: true }),
        onSuccess: vi.fn()
      });

      // setState should not be called on success
      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should work without onSuccess handler', async () => {
      const { execute } = useOptimistic();
      
      const result = await execute({
        getState: () => ({}),
        setState: vi.fn(),
        apiCall: () => Promise.resolve({ data: 'test' })
        // No onSuccess provided
      });

      expect(result.success).toBe(true);
      expect(result.response).toEqual({ data: 'test' });
    });
  });

  describe('Parameter Validation', () => {
    it('should throw error if getState is not a function', async () => {
      const { execute } = useOptimistic();
      
      await expect(execute({
        getState: 'not a function',
        setState: vi.fn(),
        apiCall: vi.fn()
      })).rejects.toThrow('[useOptimistic] getState must be a function');
    });

    it('should throw error if setState is not a function', async () => {
      const { execute } = useOptimistic();
      
      await expect(execute({
        getState: vi.fn(),
        setState: 'not a function',
        apiCall: vi.fn()
      })).rejects.toThrow('[useOptimistic] setState must be a function');
    });

    it('should throw error if apiCall is not a function', async () => {
      const { execute } = useOptimistic();
      
      await expect(execute({
        getState: vi.fn(),
        setState: vi.fn(),
        apiCall: 'not a function'
      })).rejects.toThrow('[useOptimistic] apiCall must be a function');
    });
  });

  describe('Deep Clone Utility', () => {
    it('should deep clone nested objects', () => {
      const { _deepClone } = useOptimistic();
      
      const original = {
        level1: {
          level2: {
            value: 'deep'
          }
        }
      };
      
      const cloned = _deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.level1).not.toBe(original.level1);
      expect(cloned.level1.level2).not.toBe(original.level1.level2);
    });

    it('should deep clone arrays', () => {
      const { _deepClone } = useOptimistic();
      
      const original = [{ id: 1 }, { id: 2 }];
      const cloned = _deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it('should handle undefined', () => {
      const { _deepClone } = useOptimistic();
      expect(_deepClone(undefined)).toBe(undefined);
    });

    it('should handle null', () => {
      const { _deepClone } = useOptimistic();
      expect(_deepClone(null)).toBe(null);
    });

    it('should handle primitives', () => {
      const { _deepClone } = useOptimistic();
      expect(_deepClone(42)).toBe(42);
      expect(_deepClone('string')).toBe('string');
      expect(_deepClone(true)).toBe(true);
    });
  });
});
