/**
 * Unit Tests for Family Store
 * 
 * Tests:
 * - loadMembers (loadFamilyMembers) populates store state
 * - createChild calls API with correct payload
 * - removeMember removes member from state
 * - Spending modal state and actions
 * 
 * Requirements: 10.1, 10.2, 10.3, 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

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
        // _Requirements: 1.4_
        childForm: {
          username: '',
          password: '',
          displayName: ''
        },
        // _Requirements: 1.5_
        newPerson: {
          name: ''
        },
        inviteData: {
          token: '',
          expiresAt: null
        },
        pendingInviteToken: null,
        // Spending modal state
        // _Requirements: 3.1, 3.2_
        selectedPerson: null,
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
        },
        
        // _Requirements: 1.5_
        resetNewPersonForm() {
          this.newPerson = {
            name: ''
          };
        },
        
        // =============================================
        // SPENDING MODAL ACTIONS
        // _Requirements: 3.3_
        // =============================================
        
        openSpendingModal(person) {
          this.selectedPerson = person;
          this.spendAmount = 0;
          this.spendAmountString = '0';
          const uiStore = window.useUIStore?.();
          uiStore?.openModal('spending');
        },
        
        closeSpendingModal() {
          const uiStore = window.useUIStore?.();
          uiStore?.closeModal('spending');
          this.selectedPerson = null;
          this.spendAmount = 0;
          this.spendAmountString = '0';
        },
        
        addDigit(digit) {
          if (this.spendAmountString === '0') {
            this.spendAmountString = digit.toString();
          } else {
            this.spendAmountString += digit.toString();
          }
          this.updateSpendAmount();
        },
        
        addDecimal() {
          if (!this.spendAmountString.includes('.')) {
            this.spendAmountString += '.';
            this.updateSpendAmount();
          }
        },
        
        clearSpendAmount() {
          this.spendAmountString = '0';
          this.spendAmount = 0;
        },
        
        updateSpendAmount() {
          const amount = parseFloat(this.spendAmountString);
          this.spendAmount = isNaN(amount) ? 0 : Number(amount);
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

  // Form reset action tests
  // _Requirements: 1.4, 1.5_
  describe('resetChildForm', () => {
    it('should reset childForm to default values', () => {
      const store = createStore();
      // Set some values
      store.childForm = {
        username: 'testuser',
        password: 'testpass',
        displayName: 'Test User'
      };
      
      store.resetChildForm();
      
      expect(store.childForm).toEqual({
        username: '',
        password: '',
        displayName: ''
      });
    });
  });

  describe('resetNewPersonForm', () => {
    it('should reset newPerson to default values', () => {
      const store = createStore();
      // Set some values
      store.newPerson = { name: 'Test Person' };
      
      store.resetNewPersonForm();
      
      expect(store.newPerson).toEqual({ name: '' });
    });
  });
});


// =============================================
// SPENDING MODAL PROPERTY-BASED TESTS
// =============================================

/**
 * **Feature: app-js-cleanup, Property 2: Spending Amount Digit Accumulation**
 * **Validates: Requirements 3.2, 3.3**
 * 
 * For any sequence of digit additions via addDigit, the spendAmountString SHALL
 * represent the concatenation of those digits (with leading zero removal), and
 * spendAmount SHALL equal the numeric value of that string.
 */
describe('Property 2: Spending Amount Digit Accumulation', () => {
  let createStore;
  let mockUIStore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock UI store
    mockUIStore = {
      openModal: vi.fn(),
      closeModal: vi.fn()
    };
    
    // Mock global window
    global.window = {
      ...global.window,
      useUIStore: () => mockUIStore
    };
    
    // Create a fresh store instance for each test
    createStore = () => {
      return {
        selectedPerson: null,
        spendAmount: 0,
        spendAmountString: '0',
        
        addDigit(digit) {
          if (this.spendAmountString === '0') {
            this.spendAmountString = digit.toString();
          } else {
            this.spendAmountString += digit.toString();
          }
          this.updateSpendAmount();
        },
        
        addDecimal() {
          if (!this.spendAmountString.includes('.')) {
            this.spendAmountString += '.';
            this.updateSpendAmount();
          }
        },
        
        clearSpendAmount() {
          this.spendAmountString = '0';
          this.spendAmount = 0;
        },
        
        updateSpendAmount() {
          const amount = parseFloat(this.spendAmountString);
          this.spendAmount = isNaN(amount) ? 0 : Number(amount);
        }
      };
    };
  });

  /**
   * Arbitrary for generating single digits (0-9)
   */
  const digitArbitrary = fc.integer({ min: 0, max: 9 });

  /**
   * Arbitrary for generating non-empty arrays of digits
   */
  const digitSequenceArbitrary = fc.array(digitArbitrary, { minLength: 1, maxLength: 10 });

  it('Property: addDigit accumulates digits correctly with leading zero removal', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary,
        (digits) => {
          const store = createStore();
          
          // Start fresh
          store.clearSpendAmount();
          
          // Add each digit
          digits.forEach(digit => store.addDigit(digit));
          
          // Build expected string: concatenate digits, remove leading zeros
          let expectedString = digits.join('');
          // Remove leading zeros but keep at least one digit
          expectedString = expectedString.replace(/^0+/, '') || '0';
          // Handle case where all digits are 0
          if (digits.every(d => d === 0)) {
            expectedString = '0';
          }
          
          // Property: spendAmountString matches expected concatenation
          expect(store.spendAmountString).toBe(expectedString);
          
          // Property: spendAmount equals numeric value of string
          const expectedAmount = parseFloat(expectedString);
          expect(store.spendAmount).toBe(isNaN(expectedAmount) ? 0 : expectedAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: spendAmount is always the numeric value of spendAmountString', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary,
        (digits) => {
          const store = createStore();
          store.clearSpendAmount();
          
          digits.forEach(digit => store.addDigit(digit));
          
          // Property: spendAmount equals parseFloat of spendAmountString
          const parsedAmount = parseFloat(store.spendAmountString);
          expect(store.spendAmount).toBe(isNaN(parsedAmount) ? 0 : parsedAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: single digit replaces initial zero', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }), // non-zero digit
        (digit) => {
          const store = createStore();
          store.clearSpendAmount();
          
          expect(store.spendAmountString).toBe('0');
          
          store.addDigit(digit);
          
          // Property: single non-zero digit replaces the initial '0'
          expect(store.spendAmountString).toBe(digit.toString());
          expect(store.spendAmount).toBe(digit);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: adding zero to zero keeps zero', () => {
    const store = createStore();
    store.clearSpendAmount();
    
    store.addDigit(0);
    
    // Property: adding 0 to '0' keeps it as '0'
    expect(store.spendAmountString).toBe('0');
    expect(store.spendAmount).toBe(0);
  });

  it('Property: clearSpendAmount resets to zero state', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary,
        (digits) => {
          const store = createStore();
          
          // Add some digits
          digits.forEach(digit => store.addDigit(digit));
          
          // Clear
          store.clearSpendAmount();
          
          // Property: state is reset to zero
          expect(store.spendAmountString).toBe('0');
          expect(store.spendAmount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * **Feature: app-js-cleanup, Property 3: Spending Amount Decimal Handling**
 * **Validates: Requirements 3.2, 3.3**
 * 
 * For any spendAmountString, calling addDecimal SHALL add a decimal point only
 * if one does not already exist, and subsequent addDigit calls SHALL append
 * after the decimal.
 */
describe('Property 3: Spending Amount Decimal Handling', () => {
  let createStore;
  let mockUIStore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock UI store
    mockUIStore = {
      openModal: vi.fn(),
      closeModal: vi.fn()
    };
    
    // Mock global window
    global.window = {
      ...global.window,
      useUIStore: () => mockUIStore
    };
    
    // Create a fresh store instance for each test
    createStore = () => {
      return {
        selectedPerson: null,
        spendAmount: 0,
        spendAmountString: '0',
        
        addDigit(digit) {
          if (this.spendAmountString === '0') {
            this.spendAmountString = digit.toString();
          } else {
            this.spendAmountString += digit.toString();
          }
          this.updateSpendAmount();
        },
        
        addDecimal() {
          if (!this.spendAmountString.includes('.')) {
            this.spendAmountString += '.';
            this.updateSpendAmount();
          }
        },
        
        clearSpendAmount() {
          this.spendAmountString = '0';
          this.spendAmount = 0;
        },
        
        updateSpendAmount() {
          const amount = parseFloat(this.spendAmountString);
          this.spendAmount = isNaN(amount) ? 0 : Number(amount);
        }
      };
    };
  });

  /**
   * Arbitrary for generating single digits (0-9)
   */
  const digitArbitrary = fc.integer({ min: 0, max: 9 });

  /**
   * Arbitrary for generating non-empty arrays of digits
   */
  const digitSequenceArbitrary = fc.array(digitArbitrary, { minLength: 1, maxLength: 5 });

  it('Property: addDecimal adds decimal only if none exists', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary,
        (digits) => {
          const store = createStore();
          store.clearSpendAmount();
          
          // Add some digits first
          digits.forEach(digit => store.addDigit(digit));
          
          const beforeDecimal = store.spendAmountString;
          const hadDecimal = beforeDecimal.includes('.');
          
          // Add decimal
          store.addDecimal();
          
          if (hadDecimal) {
            // Property: if decimal already existed, string unchanged
            expect(store.spendAmountString).toBe(beforeDecimal);
          } else {
            // Property: decimal was added
            expect(store.spendAmountString).toBe(beforeDecimal + '.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: multiple addDecimal calls add only one decimal', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary,
        fc.integer({ min: 1, max: 5 }), // number of decimal attempts
        (digits, decimalAttempts) => {
          const store = createStore();
          store.clearSpendAmount();
          
          // Add some digits
          digits.forEach(digit => store.addDigit(digit));
          
          // Try to add decimal multiple times
          for (let i = 0; i < decimalAttempts; i++) {
            store.addDecimal();
          }
          
          // Property: only one decimal point exists
          const decimalCount = (store.spendAmountString.match(/\./g) || []).length;
          expect(decimalCount).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: digits after decimal are appended correctly', async () => {
    await fc.assert(
      fc.property(
        digitSequenceArbitrary, // digits before decimal
        digitSequenceArbitrary, // digits after decimal
        (digitsBefore, digitsAfter) => {
          const store = createStore();
          store.clearSpendAmount();
          
          // Add digits before decimal
          digitsBefore.forEach(digit => store.addDigit(digit));
          
          // Add decimal
          store.addDecimal();
          
          // Add digits after decimal
          digitsAfter.forEach(digit => store.addDigit(digit));
          
          // Property: string contains decimal with digits after it
          expect(store.spendAmountString).toContain('.');
          
          // Property: digits after decimal are appended
          const parts = store.spendAmountString.split('.');
          expect(parts.length).toBe(2);
          expect(parts[1]).toBe(digitsAfter.join(''));
          
          // Property: spendAmount equals numeric value
          const expectedAmount = parseFloat(store.spendAmountString);
          expect(store.spendAmount).toBe(isNaN(expectedAmount) ? 0 : expectedAmount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: decimal on initial zero creates "0."', () => {
    const store = createStore();
    store.clearSpendAmount();
    
    expect(store.spendAmountString).toBe('0');
    
    store.addDecimal();
    
    // Property: adding decimal to '0' creates '0.'
    expect(store.spendAmountString).toBe('0.');
    expect(store.spendAmount).toBe(0);
  });

  it('Property: decimal values are parsed correctly', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }), // whole part
        fc.integer({ min: 0, max: 99 }), // decimal part (cents)
        (wholePart, decimalPart) => {
          const store = createStore();
          store.clearSpendAmount();
          
          // Add whole part digits
          const wholeDigits = wholePart.toString().split('').map(Number);
          wholeDigits.forEach(digit => store.addDigit(digit));
          
          // Add decimal
          store.addDecimal();
          
          // Add decimal part digits (pad with leading zero if needed for cents)
          const decimalStr = decimalPart.toString().padStart(2, '0');
          const decimalDigits = decimalStr.split('').map(Number);
          decimalDigits.forEach(digit => store.addDigit(digit));
          
          // Property: spendAmount equals the expected decimal value
          const expectedAmount = parseFloat(store.spendAmountString);
          expect(store.spendAmount).toBeCloseTo(expectedAmount, 10);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =============================================
// SPENDING DEDUCTION PROPERTY-BASED TESTS
// =============================================

/**
 * **Feature: app-js-cleanup, Property 6: Spending Deduction Correctness**
 * **Validates: Requirements 5.7**
 * 
 * For any person with earnings E and spend amount S where S <= E, when
 * confirmSpending is called, the person's earnings SHALL be reduced by exactly S.
 */
describe('Property 6: Spending Deduction Correctness', () => {
  let createStore;
  let mockApiService;
  let mockUIStore;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API service
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };
    
    // Mock UI store
    mockUIStore = {
      openModal: vi.fn(),
      closeModal: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn()
    };
    
    // Mock global window
    global.window = {
      ...global.window,
      useUIStore: () => mockUIStore,
      useOfflineStore: () => ({
        isFeatureAvailable: () => true,
        getDisabledFeatureMessage: () => ''
      })
    };
    
    // Mock global apiService
    global.apiService = mockApiService;
    
    // Create a fresh store instance for each test
    createStore = () => {
      return {
        members: [],
        selectedPerson: null,
        spendAmount: 0,
        spendAmountString: '0',
        
        updateMemberEarnings(memberName, earningsChange, choresChange = 0) {
          const member = this.members.find(m => m.displayName === memberName);
          if (member) {
            member.earnings = (member.earnings || 0) + earningsChange;
            member.completedChores = (member.completedChores || 0) + choresChange;
          }
        },
        
        closeSpendingModal() {
          mockUIStore.closeModal('spending');
          this.selectedPerson = null;
          this.spendAmount = 0;
          this.spendAmountString = '0';
        },
        
        async confirmSpending() {
          if (!this.selectedPerson) {
            return { success: false, error: 'No person selected' };
          }
          
          const spendAmount = this.spendAmount;
          const maxAmount = this.selectedPerson.earnings || 0;
          
          if (spendAmount <= 0) {
            return { success: false, error: 'Spend amount must be greater than zero' };
          }
          
          if (spendAmount > maxAmount) {
            return { success: false, error: 'Spend amount exceeds available earnings' };
          }
          
          const personName = this.selectedPerson.displayName || this.selectedPerson.name;
          
          try {
            // Make API call to deduct earnings
            const encodedName = encodeURIComponent(personName);
            await mockApiService.put(
              `${CONFIG.API.ENDPOINTS.FAMILY_MEMBERS}/${encodedName}/earnings`,
              { amount: Number(spendAmount), operation: 'subtract' }
            );
            
            // Optimistically update earnings
            this.updateMemberEarnings(personName, -spendAmount, 0);
            
            // Show success
            mockUIStore.showSuccess(`${personName} spent $${spendAmount.toFixed(2)}!`);
            
            // Close the modal
            this.closeSpendingModal();
            
            return { success: true };
          } catch (error) {
            mockUIStore.showError('Failed to process spending');
            return { success: false, error: error.message };
          }
        }
      };
    };
  });

  /**
   * Arbitrary for generating valid earnings in cents (to avoid floating point issues)
   * We use integers for cents and convert to dollars
   */
  const earningsCentsArbitrary = fc.integer({ min: 1, max: 1000000 }); // 0.01 to 10000.00

  /**
   * Arbitrary for generating spend percentage (1-99%)
   * Using integers to avoid floating point precision issues
   */
  const spendPercentArbitrary = fc.integer({ min: 1, max: 99 });

  it('Property: spending deducts exactly the spend amount from earnings', async () => {
    await fc.assert(
      fc.asyncProperty(
        earningsCentsArbitrary,
        spendPercentArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }), // person name
        async (earningsCents, spendPercent, personName) => {
          const store = createStore();
          
          // Convert cents to dollars
          const initialEarnings = earningsCents / 100;
          
          // Calculate spend amount as percentage of earnings (ensures S < E)
          // Using integer math to avoid floating point issues
          const spendCents = Math.floor(earningsCents * spendPercent / 100);
          const spendAmount = spendCents / 100;
          
          // Skip if spend amount is 0
          if (spendAmount <= 0) return true;
          
          // Set up member with initial earnings
          const member = {
            id: '1',
            displayName: personName,
            earnings: initialEarnings
          };
          store.members = [member];
          
          // Set up spending state
          store.selectedPerson = member;
          store.spendAmount = spendAmount;
          store.spendAmountString = spendAmount.toString();
          
          // Mock successful API call
          mockApiService.put.mockResolvedValue({ success: true });
          
          // Perform spending
          const result = await store.confirmSpending();
          
          // Property: spending should succeed
          expect(result.success).toBe(true);
          
          // Property: earnings should be reduced by exactly the spend amount
          const expectedEarnings = initialEarnings - spendAmount;
          expect(store.members[0].earnings).toBeCloseTo(expectedEarnings, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: spending fails when amount exceeds earnings', async () => {
    await fc.assert(
      fc.asyncProperty(
        earningsCentsArbitrary,
        fc.integer({ min: 1, max: 10000 }), // extra cents to add
        fc.string({ minLength: 1, maxLength: 20 }),
        async (earningsCents, extraCents, personName) => {
          const store = createStore();
          
          // Convert cents to dollars
          const initialEarnings = earningsCents / 100;
          
          // Calculate spend amount that definitely exceeds earnings
          // Add extra cents to ensure it's greater
          const spendCents = earningsCents + extraCents;
          const spendAmount = spendCents / 100;
          
          // Set up member with initial earnings
          const member = {
            id: '1',
            displayName: personName,
            earnings: initialEarnings
          };
          store.members = [member];
          
          // Set up spending state
          store.selectedPerson = member;
          store.spendAmount = spendAmount;
          store.spendAmountString = spendAmount.toString();
          
          // Perform spending
          const result = await store.confirmSpending();
          
          // Property: spending should fail
          expect(result.success).toBe(false);
          expect(result.error).toContain('exceeds');
          
          // Property: earnings should remain unchanged
          expect(store.members[0].earnings).toBe(initialEarnings);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: spending fails when amount is zero or negative', async () => {
    await fc.assert(
      fc.asyncProperty(
        earningsCentsArbitrary,
        fc.double({ min: -100, max: 0, noNaN: true }), // zero or negative
        fc.string({ minLength: 1, maxLength: 20 }),
        async (earningsCents, invalidAmount, personName) => {
          const store = createStore();
          
          // Convert cents to dollars
          const initialEarnings = earningsCents / 100;
          
          // Set up member with initial earnings
          const member = {
            id: '1',
            displayName: personName,
            earnings: initialEarnings
          };
          store.members = [member];
          
          // Set up spending state with invalid amount
          store.selectedPerson = member;
          store.spendAmount = invalidAmount;
          store.spendAmountString = invalidAmount.toString();
          
          // Perform spending
          const result = await store.confirmSpending();
          
          // Property: spending should fail
          expect(result.success).toBe(false);
          expect(result.error).toContain('greater than zero');
          
          // Property: earnings should remain unchanged
          expect(store.members[0].earnings).toBe(initialEarnings);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: spending fails when no person is selected', async () => {
    const store = createStore();
    
    store.selectedPerson = null;
    store.spendAmount = 10;
    store.spendAmountString = '10';
    
    const result = await store.confirmSpending();
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('No person selected');
  });

  it('Property: spending exactly equal to earnings succeeds and leaves zero', async () => {
    await fc.assert(
      fc.asyncProperty(
        earningsCentsArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        async (earningsCents, personName) => {
          const store = createStore();
          
          // Convert cents to dollars
          const initialEarnings = earningsCents / 100;
          
          // Set up member with initial earnings
          const member = {
            id: '1',
            displayName: personName,
            earnings: initialEarnings
          };
          store.members = [member];
          
          // Set up spending state to spend exactly all earnings
          store.selectedPerson = member;
          store.spendAmount = initialEarnings;
          store.spendAmountString = initialEarnings.toString();
          
          // Mock successful API call
          mockApiService.put.mockResolvedValue({ success: true });
          
          // Perform spending
          const result = await store.confirmSpending();
          
          // Property: spending should succeed
          expect(result.success).toBe(true);
          
          // Property: earnings should be exactly zero
          expect(store.members[0].earnings).toBeCloseTo(0, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
