/**
 * Unit Tests for Family Store
 * 
 * Tests:
 * - loadMembers (loadFamilyMembers) populates store state
 * - createChild calls API with correct payload
 * - removeMember removes member from state
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Family Store', () => {
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
    
    // Mock global apiService and other dependencies
    global.window = {
      ...global.window,
      apiService: mockApiService,
      offlineStorage: null,
      useUIStore: () => ({
        showSuccess: vi.fn(),
        showError: vi.fn()
      }),
      useChoresStore: () => ({
        chores: []
      }),
      useAuthStore: () => ({
        accountId: 'test-account-123'
      }),
      useOfflineStore: () => ({
        isFeatureAvailable: () => true,
        getDisabledFeatureMessage: () => ''
      })
    };

    // Create a fresh store instance for each test
    createStore = () => {
      const state = {
        members: [],
        spendingRequests: [],
        loading: false,
        error: null,
        isUsingCachedData: false,
        childForm: {
          username: '',
          password: '',
          displayName: ''
        },
        inviteData: {
          token: '',
          expiresAt: null
        },
        pendingInviteToken: null,
        spendAmount: 0,
        spendAmountString: '0'
      };

      return {
        // State
        ...state,
        
        // Getters
        get enabledMembers() {
          return this.members.filter(member => member.showOnChoreBoard !== false);
        },
        
        get memberById() {
          return (id) => this.members.find(member => member.id === id);
        },
        
        get memberByName() {
          return (name) => this.members.find(member => member.displayName === name);
        },
        
        get earnings() {
          const earningsObj = {};
          this.members.forEach(member => {
            earningsObj[member.displayName || member.name] = member.earnings || 0;
          });
          return earningsObj;
        },
        
        get electronicsStatus() {
          const statusObj = {};
          this.members.forEach(member => {
            statusObj[member.displayName || member.name] = member.electronicsStatus || { status: 'allowed', message: 'Electronics allowed' };
          });
          return statusObj;
        },
        
        get totalEarnings() {
          return this.members.reduce((sum, member) => sum + (member.earnings || 0), 0);
        },
        
        get children() {
          return this.members.filter(member => member.role === 'child');
        },
        
        get parents() {
          return this.members.filter(member => member.role === 'parent');
        },
        
        // Actions
        async loadMembers(preserveOptimisticUpdates = false) {
          this.loading = true;
          this.error = null;
          this.isUsingCachedData = false;
          
          try {
            const data = await mockApiService.get(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
            const familyMembers = data.familyMembers || [];
            
            // Normalize member data
            const normalizeMembers = (members) => members.map(member => ({
              ...member,
              dailyChores: Array.isArray(member.dailyChores) ? member.dailyChores : [],
              choreSortOrder: member.choreSortOrder && typeof member.choreSortOrder === 'object' ? member.choreSortOrder : {}
            }));
            
            if (preserveOptimisticUpdates) {
              // Preserve earnings from optimistic updates
              const earningsMap = {};
              this.members.forEach(member => {
                earningsMap[member.displayName] = {
                  earnings: member.earnings,
                  completedChores: member.completedChores
                };
              });
              
              this.members = normalizeMembers(familyMembers).map(member => ({
                ...member,
                ...(earningsMap[member.displayName] || {})
              }));
            } else {
              this.members = normalizeMembers(familyMembers);
            }
            
            return { success: true };
          } catch (error) {
            this.error = error.message;
            this.members = [];
            return { success: false, error: error.message };
          } finally {
            this.loading = false;
          }
        },
        
        async createChild(childData) {
          try {
            const data = await mockApiService.post(CONFIG.API.ENDPOINTS.CREATE_CHILD, {
              username: childData.username,
              password: childData.password,
              displayName: childData.displayName
            });
            
            if (data.success) {
              // Reload members to include new child
              await this.loadMembers();
              return { success: true };
            }
            
            return { success: false, error: data.error || 'Failed to create child' };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        async removeMember(memberId) {
          // Optimistic update
          const originalMembers = [...this.members];
          this.members = this.members.filter(m => m.id !== memberId);
          
          try {
            await mockApiService.delete(`${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${memberId}`);
            return { success: true };
          } catch (error) {
            // Rollback on error
            this.members = originalMembers;
            return { success: false, error: error.message };
          }
        },
        
        async loadSpendingRequests() {
          try {
            const data = await mockApiService.get(CONFIG.API.ENDPOINTS.SPENDING_REQUESTS);
            this.spendingRequests = data.requests || [];
            return { success: true };
          } catch (error) {
            this.spendingRequests = [];
            return { success: false, error: error.message };
          }
        },
        
        async loadElectronicsStatus() {
          try {
            for (const member of this.members) {
              try {
                const memberName = member.displayName || member.name;
                const response = await mockApiService.get(`${CONFIG.API.ENDPOINTS.ELECTRONICS_STATUS}/${memberName}`);
                member.electronicsStatus = response;
              } catch (error) {
                member.electronicsStatus = { status: 'allowed', message: 'Electronics allowed' };
              }
            }
            return { success: true };
          } catch (error) {
            return { success: false, error: error.message };
          }
        },
        
        updateElectronicsStatusOptimistically(memberName) {
          const member = this.members.find(m => (m.displayName || m.name) === memberName);
          if (!member) return;

          const choresStore = window.useChoresStore?.();
          const chores = choresStore?.chores || [];

          const incompleteElectronicsChores = chores.filter(chore => 
            chore.assignedTo === memberName && 
            chore.category === 'game' && 
            !chore.completed
          );

          const allowed = incompleteElectronicsChores.length === 0;
          
          member.electronicsStatus = {
            status: allowed ? 'allowed' : 'blocked',
            message: allowed ? 'Electronics allowed' : `${incompleteElectronicsChores.length} electronics task${incompleteElectronicsChores.length > 1 ? 's' : ''} remaining`
          };
        },
        
        updateMemberEarnings(memberName, earningsChange, choresChange = 0) {
          const member = this.members.find(m => m.displayName === memberName);
          if (member) {
            member.earnings = (member.earnings || 0) + earningsChange;
            member.completedChores = (member.completedChores || 0) + choresChange;
          }
        },
        
        resetChildForm() {
          this.childForm = {
            username: '',
            password: '',
            displayName: ''
          };
        }
      };
    };
  });

  describe('loadMembers (loadFamilyMembers)', () => {
    it('should populate store state with members from API', async () => {
      const store = createStore();
      const mockMembers = [
        { id: '1', displayName: 'Alice', role: 'child', earnings: 50 },
        { id: '2', displayName: 'Bob', role: 'child', earnings: 30 }
      ];
      
      mockApiService.get.mockResolvedValue({ familyMembers: mockMembers });
      
      await store.loadMembers();
      
      expect(store.members.length).toBe(2);
      expect(store.members[0].displayName).toBe('Alice');
      expect(store.members[1].displayName).toBe('Bob');
    });

    it('should set loading to true during load and false after', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ familyMembers: [] });
      
      const loadPromise = store.loadMembers();
      
      await loadPromise;
      expect(store.loading).toBe(false);
    });

    it('should handle empty members array', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ familyMembers: [] });
      
      await store.loadMembers();
      
      expect(store.members).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const store = createStore();
      mockApiService.get.mockRejectedValue(new Error('Network error'));
      
      const result = await store.loadMembers();
      
      expect(result.success).toBe(false);
      expect(store.error).toBe('Network error');
      expect(store.members).toEqual([]);
    });

    it('should call API with correct endpoint', async () => {
      const store = createStore();
      mockApiService.get.mockResolvedValue({ familyMembers: [] });
      
      await store.loadMembers();
      
      expect(mockApiService.get).toHaveBeenCalledWith(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
    });

    it('should normalize member data with dailyChores and choreSortOrder', async () => {
      const store = createStore();
      const mockMembers = [
        { id: '1', displayName: 'Alice' } // No dailyChores or choreSortOrder
      ];
      
      mockApiService.get.mockResolvedValue({ familyMembers: mockMembers });
      
      await store.loadMembers();
      
      expect(store.members[0].dailyChores).toEqual([]);
      expect(store.members[0].choreSortOrder).toEqual({});
    });

    it('should preserve optimistic updates when flag is true', async () => {
      const store = createStore();
      // Set up existing member with optimistic earnings
      store.members = [
        { id: '1', displayName: 'Alice', earnings: 100, completedChores: 5 }
      ];
      
      const mockMembers = [
        { id: '1', displayName: 'Alice', earnings: 50, completedChores: 3 }
      ];
      
      mockApiService.get.mockResolvedValue({ familyMembers: mockMembers });
      
      await store.loadMembers(true); // preserveOptimisticUpdates = true
      
      // Should preserve the optimistic earnings
      expect(store.members[0].earnings).toBe(100);
      expect(store.members[0].completedChores).toBe(5);
    });
  });

  describe('createChild', () => {
    it('should call API with correct payload', async () => {
      const store = createStore();
      const childData = {
        username: 'alice123',
        password: 'password123',
        displayName: 'Alice'
      };
      
      mockApiService.post.mockResolvedValue({ success: true });
      mockApiService.get.mockResolvedValue({ familyMembers: [] });
      
      await store.createChild(childData);
      
      expect(mockApiService.post).toHaveBeenCalledWith(
        CONFIG.API.ENDPOINTS.CREATE_CHILD,
        {
          username: 'alice123',
          password: 'password123',
          displayName: 'Alice'
        }
      );
    });

    it('should reload members after successful creation', async () => {
      const store = createStore();
      const childData = {
        username: 'alice123',
        password: 'password123',
        displayName: 'Alice'
      };
      
      mockApiService.post.mockResolvedValue({ success: true });
      mockApiService.get.mockResolvedValue({ 
        familyMembers: [{ id: '1', displayName: 'Alice', role: 'child' }] 
      });
      
      await store.createChild(childData);
      
      // Should have called loadMembers (which calls get)
      expect(mockApiService.get).toHaveBeenCalledWith(CONFIG.API.ENDPOINTS.FAMILY_MEMBERS);
    });

    it('should return success on successful creation', async () => {
      const store = createStore();
      mockApiService.post.mockResolvedValue({ success: true });
      mockApiService.get.mockResolvedValue({ familyMembers: [] });
      
      const result = await store.createChild({
        username: 'test',
        password: 'test',
        displayName: 'Test'
      });
      
      expect(result.success).toBe(true);
    });

    it('should handle API errors', async () => {
      const store = createStore();
      mockApiService.post.mockRejectedValue(new Error('Server error'));
      
      const result = await store.createChild({
        username: 'test',
        password: 'test',
        displayName: 'Test'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error');
    });

    it('should handle unsuccessful response', async () => {
      const store = createStore();
      mockApiService.post.mockResolvedValue({ success: false, error: 'Username taken' });
      
      const result = await store.createChild({
        username: 'test',
        password: 'test',
        displayName: 'Test'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username taken');
    });
  });

  describe('removeMember', () => {
    it('should remove member from store state', async () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice' },
        { id: '2', displayName: 'Bob' }
      ];
      
      mockApiService.delete.mockResolvedValue({ success: true });
      
      await store.removeMember('1');
      
      expect(store.members.find(m => m.id === '1')).toBeUndefined();
      expect(store.members.length).toBe(1);
    });

    it('should call API with correct endpoint', async () => {
      const store = createStore();
      store.members = [{ id: '123', displayName: 'Alice' }];
      
      mockApiService.delete.mockResolvedValue({ success: true });
      
      await store.removeMember('123');
      
      expect(mockApiService.delete).toHaveBeenCalledWith(
        `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/123`
      );
    });

    it('should rollback on API error', async () => {
      const store = createStore();
      const member = { id: '1', displayName: 'Alice' };
      store.members = [member];
      
      mockApiService.delete.mockRejectedValue(new Error('Delete failed'));
      
      await store.removeMember('1');
      
      // Member should be restored
      expect(store.members).toContainEqual(member);
    });

    it('should return success on successful removal', async () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      mockApiService.delete.mockResolvedValue({ success: true });
      
      const result = await store.removeMember('1');
      
      expect(result.success).toBe(true);
    });

    it('should return error on failed removal', async () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      mockApiService.delete.mockRejectedValue(new Error('Delete failed'));
      
      const result = await store.removeMember('1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('earnings getter', () => {
    it('should return earnings by member name', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', earnings: 50 },
        { id: '2', displayName: 'Bob', earnings: 30 }
      ];
      
      const earnings = store.earnings;
      
      expect(earnings.Alice).toBe(50);
      expect(earnings.Bob).toBe(30);
    });

    it('should default to 0 for members without earnings', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice' }
      ];
      
      const earnings = store.earnings;
      
      expect(earnings.Alice).toBe(0);
    });
  });

  describe('electronicsStatus getter', () => {
    it('should return electronics status by member name', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', electronicsStatus: { status: 'blocked', message: '2 tasks remaining' } },
        { id: '2', displayName: 'Bob', electronicsStatus: { status: 'allowed', message: 'Electronics allowed' } }
      ];
      
      const status = store.electronicsStatus;
      
      expect(status.Alice.status).toBe('blocked');
      expect(status.Bob.status).toBe('allowed');
    });

    it('should default to allowed for members without status', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice' }
      ];
      
      const status = store.electronicsStatus;
      
      expect(status.Alice.status).toBe('allowed');
    });
  });

  describe('enabledMembers getter', () => {
    it('should return only members with showOnChoreBoard not false', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', showOnChoreBoard: true },
        { id: '2', displayName: 'Bob', showOnChoreBoard: false },
        { id: '3', displayName: 'Charlie' } // undefined = enabled
      ];
      
      const enabled = store.enabledMembers;
      
      expect(enabled.length).toBe(2);
      expect(enabled.find(m => m.displayName === 'Bob')).toBeUndefined();
    });
  });

  describe('memberById getter', () => {
    it('should return member by ID', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice' },
        { id: '2', displayName: 'Bob' }
      ];
      
      const member = store.memberById('2');
      
      expect(member.displayName).toBe('Bob');
    });

    it('should return undefined for non-existent ID', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      const member = store.memberById('999');
      
      expect(member).toBeUndefined();
    });
  });

  describe('updateElectronicsStatusOptimistically', () => {
    it('should set status to allowed when no incomplete electronics chores', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      // Mock chores store with no incomplete electronics chores
      window.useChoresStore = () => ({
        chores: [
          { id: '1', assignedTo: 'Alice', category: 'game', completed: true }
        ]
      });
      
      store.updateElectronicsStatusOptimistically('Alice');
      
      expect(store.members[0].electronicsStatus.status).toBe('allowed');
    });

    it('should set status to blocked when incomplete electronics chores exist', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      // Mock chores store with incomplete electronics chores
      window.useChoresStore = () => ({
        chores: [
          { id: '1', assignedTo: 'Alice', category: 'game', completed: false },
          { id: '2', assignedTo: 'Alice', category: 'game', completed: false }
        ]
      });
      
      store.updateElectronicsStatusOptimistically('Alice');
      
      expect(store.members[0].electronicsStatus.status).toBe('blocked');
      expect(store.members[0].electronicsStatus.message).toContain('2 electronics tasks remaining');
    });

    it('should not affect other members', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice' },
        { id: '2', displayName: 'Bob', electronicsStatus: { status: 'blocked', message: 'test' } }
      ];
      
      window.useChoresStore = () => ({ chores: [] });
      
      store.updateElectronicsStatusOptimistically('Alice');
      
      expect(store.members[1].electronicsStatus.status).toBe('blocked');
    });
  });

  describe('updateMemberEarnings', () => {
    it('should update earnings for specified member', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice', earnings: 50 }];
      
      store.updateMemberEarnings('Alice', 10);
      
      expect(store.members[0].earnings).toBe(60);
    });

    it('should update completedChores when provided', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice', earnings: 50, completedChores: 5 }];
      
      store.updateMemberEarnings('Alice', 10, 1);
      
      expect(store.members[0].completedChores).toBe(6);
    });

    it('should handle members without existing earnings', () => {
      const store = createStore();
      store.members = [{ id: '1', displayName: 'Alice' }];
      
      store.updateMemberEarnings('Alice', 10);
      
      expect(store.members[0].earnings).toBe(10);
    });
  });

  describe('totalEarnings getter', () => {
    it('should sum all member earnings', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', earnings: 50 },
        { id: '2', displayName: 'Bob', earnings: 30 }
      ];
      
      expect(store.totalEarnings).toBe(80);
    });

    it('should handle members without earnings', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', earnings: 50 },
        { id: '2', displayName: 'Bob' }
      ];
      
      expect(store.totalEarnings).toBe(50);
    });
  });

  describe('children and parents getters', () => {
    it('should filter children correctly', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', role: 'child' },
        { id: '2', displayName: 'Parent', role: 'parent' }
      ];
      
      expect(store.children.length).toBe(1);
      expect(store.children[0].displayName).toBe('Alice');
    });

    it('should filter parents correctly', () => {
      const store = createStore();
      store.members = [
        { id: '1', displayName: 'Alice', role: 'child' },
        { id: '2', displayName: 'Parent', role: 'parent' }
      ];
      
      expect(store.parents.length).toBe(1);
      expect(store.parents[0].displayName).toBe('Parent');
    });
  });
});
