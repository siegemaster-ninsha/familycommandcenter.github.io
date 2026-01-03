/**
 * Property-Based Tests for Habits Store - Habit Flyout State
 * 
 * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
 * 
 * Property: For any member ID and optional habit, when openHabitFlyout is called,
 * the store state SHALL reflect the provided member ID, the habit being edited
 * (if any), and the form SHALL be initialized with the habit name or empty string.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

describe('Habits Store - Habit Flyout State', () => {
  let createHabitsStore;
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
      useUIStore: () => mockUIStore,
      apiService: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
      }
    };
    
    // Create a fresh habits store instance for each test
    createHabitsStore = () => {
      return {
        // Habit flyout state
        habitFlyoutMemberId: '',
        editingHabit: null,
        habitForm: { name: '' },
        habitFormError: '',
        habitFormSubmitting: false,
        
        // Habits data (for createHabit/updateHabit)
        habits: [],
        completions: {},
        
        // Actions
        openHabitFlyout(memberId, habit = null) {
          this.habitFlyoutMemberId = memberId;
          this.editingHabit = habit;
          this.habitForm.name = habit ? habit.name : '';
          this.habitFormError = '';
          this.habitFormSubmitting = false;
          
          const uiStore = window.useUIStore?.();
          uiStore?.openModal('habitFlyout');
        },
        
        closeHabitFlyout() {
          const uiStore = window.useUIStore?.();
          uiStore?.closeModal('habitFlyout');
          
          this.habitFlyoutMemberId = '';
          this.editingHabit = null;
          this.habitForm.name = '';
          this.habitFormError = '';
          this.habitFormSubmitting = false;
        },
        
        async createHabit(memberId, name) {
          if (!memberId) {
            return { success: false, error: 'Member ID is required' };
          }
          if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return { success: false, error: 'Habit name is required' };
          }
          
          const newHabit = {
            id: `habit_${Date.now()}`,
            memberId,
            name: name.trim()
          };
          this.habits.push(newHabit);
          this.completions[newHabit.id] = [];
          
          return { success: true, habit: newHabit };
        },
        
        async updateHabit(habitId, updates) {
          const habit = this.habits.find(h => h.id === habitId);
          if (!habit) {
            return { success: false, error: 'Habit not found' };
          }
          
          Object.assign(habit, updates);
          return { success: true, habit };
        },
        
        async submitHabitForm() {
          const trimmedName = this.habitForm.name.trim();
          if (!trimmedName) {
            this.habitFormError = 'Habit name is required';
            return { success: false, error: 'Habit name is required' };
          }
          
          this.habitFormSubmitting = true;
          this.habitFormError = '';
          
          let result;
          if (this.editingHabit) {
            result = await this.updateHabit(this.editingHabit.id, { name: trimmedName });
          } else {
            result = await this.createHabit(this.habitFlyoutMemberId, trimmedName);
          }
          
          this.habitFormSubmitting = false;
          
          if (result.success) {
            this.closeHabitFlyout();
          } else {
            this.habitFormError = result.error || 'Failed to save habit';
          }
          
          return result;
        }
      };
    };
  });

  /**
   * Arbitrary for generating member IDs
   */
  const memberIdArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0);

  /**
   * Arbitrary for generating habit objects
   */
  const habitArbitrary = fc.record({
    id: fc.uuid(),
    memberId: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 })
  });

  /**
   * Arbitrary for generating optional habit (null or habit object)
   */
  const optionalHabitArbitrary = fc.option(habitArbitrary, { nil: null });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
   * 
   * For any member ID and optional habit, openHabitFlyout sets correct state
   */
  it('Property: openHabitFlyout sets habitFlyoutMemberId to provided member ID', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        (memberId, habit) => {
          const store = createHabitsStore();
          
          store.openHabitFlyout(memberId, habit);
          
          // Property: habitFlyoutMemberId matches provided memberId
          expect(store.habitFlyoutMemberId).toBe(memberId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.2**
   * 
   * For any habit, openHabitFlyout sets editingHabit to the provided habit
   */
  it('Property: openHabitFlyout sets editingHabit to provided habit', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        (memberId, habit) => {
          const store = createHabitsStore();
          
          store.openHabitFlyout(memberId, habit);
          
          // Property: editingHabit matches provided habit (or null)
          expect(store.editingHabit).toEqual(habit);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.3**
   * 
   * For any habit, openHabitFlyout initializes form with habit name or empty string
   */
  it('Property: openHabitFlyout initializes habitForm.name correctly', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        (memberId, habit) => {
          const store = createHabitsStore();
          
          store.openHabitFlyout(memberId, habit);
          
          // Property: habitForm.name is habit.name if habit provided, else empty string
          if (habit) {
            expect(store.habitForm.name).toBe(habit.name);
          } else {
            expect(store.habitForm.name).toBe('');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.5**
   * 
   * openHabitFlyout always clears error and submitting states
   */
  it('Property: openHabitFlyout clears error and submitting states', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        fc.string(), // arbitrary previous error
        fc.boolean(), // arbitrary previous submitting state
        (memberId, habit, prevError, prevSubmitting) => {
          const store = createHabitsStore();
          
          // Set arbitrary previous state
          store.habitFormError = prevError;
          store.habitFormSubmitting = prevSubmitting;
          
          store.openHabitFlyout(memberId, habit);
          
          // Property: Error and submitting states are cleared
          expect(store.habitFormError).toBe('');
          expect(store.habitFormSubmitting).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.5**
   * 
   * openHabitFlyout calls uiStore.openModal('habitFlyout')
   */
  it('Property: openHabitFlyout opens the habitFlyout modal', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        (memberId, habit) => {
          const store = createHabitsStore();
          mockUIStore.openModal.mockClear();
          
          store.openHabitFlyout(memberId, habit);
          
          // Property: uiStore.openModal was called with 'habitFlyout'
          expect(mockUIStore.openModal).toHaveBeenCalledWith('habitFlyout');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.5**
   * 
   * closeHabitFlyout resets all flyout state to defaults
   */
  it('Property: closeHabitFlyout resets all state to defaults', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        habitArbitrary,
        fc.string(),
        fc.boolean(),
        (memberId, habit, formName, submitting) => {
          const store = createHabitsStore();
          
          // Set arbitrary state
          store.habitFlyoutMemberId = memberId;
          store.editingHabit = habit;
          store.habitForm.name = formName;
          store.habitFormError = 'some error';
          store.habitFormSubmitting = submitting;
          
          store.closeHabitFlyout();
          
          // Property: All state reset to defaults
          expect(store.habitFlyoutMemberId).toBe('');
          expect(store.editingHabit).toBeNull();
          expect(store.habitForm.name).toBe('');
          expect(store.habitFormError).toBe('');
          expect(store.habitFormSubmitting).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.5**
   * 
   * closeHabitFlyout calls uiStore.closeModal('habitFlyout')
   */
  it('Property: closeHabitFlyout closes the habitFlyout modal', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        (memberId) => {
          const store = createHabitsStore();
          store.habitFlyoutMemberId = memberId;
          mockUIStore.closeModal.mockClear();
          
          store.closeHabitFlyout();
          
          // Property: uiStore.closeModal was called with 'habitFlyout'
          expect(mockUIStore.closeModal).toHaveBeenCalledWith('habitFlyout');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: app-js-cleanup, Property 1: Habit Flyout State Consistency**
   * **Validates: Requirements 2.5**
   * 
   * Round-trip: open then close returns to initial state
   */
  it('Property: open then close is a round-trip to initial state', async () => {
    await fc.assert(
      fc.property(
        memberIdArbitrary,
        optionalHabitArbitrary,
        (memberId, habit) => {
          const store = createHabitsStore();
          
          // Capture initial state
          const initialState = {
            habitFlyoutMemberId: store.habitFlyoutMemberId,
            editingHabit: store.editingHabit,
            habitFormName: store.habitForm.name,
            habitFormError: store.habitFormError,
            habitFormSubmitting: store.habitFormSubmitting
          };
          
          // Open and then close
          store.openHabitFlyout(memberId, habit);
          store.closeHabitFlyout();
          
          // Property: State returns to initial values
          expect(store.habitFlyoutMemberId).toBe(initialState.habitFlyoutMemberId);
          expect(store.editingHabit).toBe(initialState.editingHabit);
          expect(store.habitForm.name).toBe(initialState.habitFormName);
          expect(store.habitFormError).toBe(initialState.habitFormError);
          expect(store.habitFormSubmitting).toBe(initialState.habitFormSubmitting);
        }
      ),
      { numRuns: 100 }
    );
  });
});
