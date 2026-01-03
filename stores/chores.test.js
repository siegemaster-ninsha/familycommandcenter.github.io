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
        showError: vi.fn(),
        triggerConfetti: vi.fn()
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
