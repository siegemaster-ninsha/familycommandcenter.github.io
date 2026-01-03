# Design Document: App.js Cleanup Migration

## Overview

This design specifies the complete migration of remaining state and methods from the monolithic `app.js` into appropriate Pinia stores. The goal is a clean, minimal `app.js` that contains only Vue app initialization, component registration, and startup orchestration.

The migration follows a systematic approach:
1. Move form state to domain-specific stores
2. Move modal-related state to appropriate stores
3. Move business logic methods to stores
4. Update components to use stores directly
5. Remove the provide/inject bridge
6. Clean up app.js to minimal initialization code

## Architecture

### Current State (Before Migration)

```
┌─────────────────────────────────────────────────────────────┐
│                         app.js                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Form State  │  │ Modal State │  │ Delegating Methods  │  │
│  │ ~100 lines  │  │ ~50 lines   │  │ ~400 lines          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Provide/Inject Bridge (~200 lines)         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Child Components                          │
│         (use inject to access app.js state/methods)         │
└─────────────────────────────────────────────────────────────┘
```

### Target State (After Migration)

```
┌──────────────────────────────────────────────────────────────┐
│                         app.js (~150 lines)                   │
│  ┌────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Vue/Pinia Init │  │ Component Reg.  │  │ mounted() hook│  │
│  └────────────────┘  └─────────────────┘  └───────────────┘  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      Pinia Stores                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────┐  │
│  │choresStore │ │familyStore │ │habitsStore │ │ uiStore   │  │
│  │ +formState │ │ +formState │ │ +formState │ │ +modals   │  │
│  │ +actions   │ │ +spending  │ │ +actions   │ │           │  │
│  └────────────┘ └────────────┘ └────────────┘ └───────────┘  │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Child Components                           │
│         (use stores directly via useXxxStore())              │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Chores Store Extensions

```javascript
// stores/chores.js - Additional state and actions

state: () => ({
  // Existing state...
  
  // Form state (migrated from app.js)
  newChore: {
    name: '',
    amount: 0,
    category: 'regular',
    addToQuicklist: false,
    isDetailed: false
  },
  newQuicklistChore: {
    name: '',
    amount: 0,
    category: 'regular',
    categoryId: '',
    isDetailed: false,
    defaultDetails: ''
  },
  choreDetailsForm: {
    name: '',
    details: '',
    amount: 0,
    category: 'regular',
    assignedTo: '',
    isNewFromQuicklist: false,
    quicklistChoreId: null
  },
  
  // Modal state (migrated from app.js)
  scheduleModalChore: null,
  assignCategoryChore: null,
  assignCategorySelectedId: ''
}),

actions: {
  // Form reset actions
  resetNewChoreForm() {
    this.newChore = { name: '', amount: 0, category: 'regular', addToQuicklist: false, isDetailed: false };
  },
  
  resetNewQuicklistChoreForm() {
    this.newQuicklistChore = { name: '', amount: 0, category: 'regular', categoryId: '', isDetailed: false, defaultDetails: '' };
  },
  
  resetChoreDetailsForm() {
    this.choreDetailsForm = { name: '', details: '', amount: 0, category: 'regular', assignedTo: '', isNewFromQuicklist: false, quicklistChoreId: null };
  },
  
  // Modal actions
  openScheduleModal(quicklistChore) {
    this.scheduleModalChore = quicklistChore;
    const uiStore = window.useUIStore?.();
    uiStore?.openModal('schedule');
  },
  
  closeScheduleModal() {
    const uiStore = window.useUIStore?.();
    uiStore?.closeModal('schedule');
    this.scheduleModalChore = null;
  },
  
  // Business logic (migrated from app.js)
  async assignSelectedChore(assignTo) {
    // Full implementation moved from app.js
  },
  
  async confirmMultiAssignment(selectedMembers) {
    // Full implementation moved from app.js
  },
  
  async confirmChoreDetails(formData) {
    // Full implementation moved from app.js
  }
}
```

### Family Store Extensions

```javascript
// stores/family.js - Additional state and actions

state: () => ({
  // Existing state...
  
  // Form state (migrated from app.js)
  childForm: {
    username: '',
    password: '',
    displayName: ''
  },
  newPerson: { name: '' },
  
  // Spending modal state (migrated from app.js)
  selectedPerson: null,
  spendAmount: 0,
  spendAmountString: '0',
  
  // Modal state (migrated from app.js)
  defaultOrderMember: null,
  personToDelete: null
}),

actions: {
  // Form reset actions
  resetChildForm() {
    this.childForm = { username: '', password: '', displayName: '' };
  },
  
  // Spending modal actions
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
  },
  
  async confirmSpending() {
    // Full implementation moved from app.js
  },
  
  // Default order modal actions
  openDefaultOrderModal(member) {
    this.defaultOrderMember = member;
    const uiStore = window.useUIStore?.();
    uiStore?.openModal('defaultOrder');
  },
  
  closeDefaultOrderModal() {
    const uiStore = window.useUIStore?.();
    uiStore?.closeModal('defaultOrder');
    this.defaultOrderMember = null;
  },
  
  // Business logic (migrated from app.js)
  async updateFamilyMemberDisplayName(person) {
    // Full implementation moved from app.js
  },
  
  async updateMemberChoresEnabled(person) {
    // Full implementation moved from app.js
  }
}
```

### Habits Store Extensions

```javascript
// stores/habits.js - Additional state and actions

state: () => ({
  // Existing state...
  
  // Flyout state (migrated from app.js)
  habitFlyoutMemberId: '',
  editingHabit: null,
  habitForm: { name: '' },
  habitFormError: '',
  habitFormSubmitting: false
}),

actions: {
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
  
  async submitHabitForm() {
    const trimmedName = this.habitForm.name.trim();
    if (!trimmedName) {
      this.habitFormError = 'Habit name is required';
      return { success: false };
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
}
```

## Data Models

### Form State Models

```javascript
// Chore form state
interface NewChoreForm {
  name: string;
  amount: number;
  category: 'regular' | 'game' | 'bonus';
  addToQuicklist: boolean;
  isDetailed: boolean;
}

// Quicklist chore form state
interface NewQuicklistChoreForm {
  name: string;
  amount: number;
  category: 'regular' | 'game' | 'bonus';
  categoryId: string;
  isDetailed: boolean;
  defaultDetails: string;
}

// Chore details form state
interface ChoreDetailsForm {
  name: string;
  details: string;
  amount: number;
  category: 'regular' | 'game' | 'bonus';
  assignedTo: string;
  isNewFromQuicklist: boolean;
  quicklistChoreId: string | null;
}

// Child form state
interface ChildForm {
  username: string;
  password: string;
  displayName: string;
}

// Habit form state
interface HabitForm {
  name: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Habit Flyout State Consistency

*For any* member ID and optional habit, when `openHabitFlyout` is called, the store state SHALL reflect the provided member ID, the habit being edited (if any), and the form SHALL be initialized with the habit name or empty string.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

### Property 2: Spending Amount Digit Accumulation

*For any* sequence of digit additions via `addDigit`, the `spendAmountString` SHALL represent the concatenation of those digits (with leading zero removal), and `spendAmount` SHALL equal the numeric value of that string.

**Validates: Requirements 3.2, 3.3**

### Property 3: Spending Amount Decimal Handling

*For any* `spendAmountString`, calling `addDecimal` SHALL add a decimal point only if one does not already exist, and subsequent `addDigit` calls SHALL append after the decimal.

**Validates: Requirements 3.2, 3.3**

### Property 4: Chore Assignment Optimistic Update

*For any* selected chore and target assignee, when `assignSelectedChore` is called, the chore SHALL immediately appear in the target person's list (optimistic update), and if the API call fails, the chore SHALL be rolled back to its original state.

**Validates: Requirements 5.3**

### Property 5: Multi-Assignment Creates Correct Number of Chores

*For any* quicklist chore and set of N selected members, when `confirmMultiAssignment` is called, exactly N new chores SHALL be created (one per member), each assigned to the corresponding member.

**Validates: Requirements 5.5**

### Property 6: Spending Deduction Correctness

*For any* person with earnings E and spend amount S where S <= E, when `confirmSpending` is called, the person's earnings SHALL be reduced by exactly S.

**Validates: Requirements 5.7**

## Error Handling

### Store Action Errors

All store actions that make API calls follow this pattern:

1. **Optimistic Update**: Update local state immediately for instant UI feedback
2. **API Call**: Make the backend request
3. **Success**: Confirm the optimistic update with server response
4. **Failure**: Roll back the optimistic update and show error via `uiStore.showError()`

### Form Validation Errors

Form validation errors are stored in the respective store state:
- `habitsStore.habitFormError` for habit form errors
- Chore forms use inline validation before submission

### Network Errors

Network errors during store actions:
1. Log the error to console
2. Show user-friendly message via `uiStore.showError()`
3. Return `{ success: false, error: message }` from the action

## Testing Strategy

### Unit Tests

Unit tests verify specific examples and edge cases:

1. **Store State Structure**: Verify stores have required state properties after migration
2. **Form Reset Actions**: Verify reset actions clear form state to defaults
3. **Modal Open/Close**: Verify modal actions update uiStore correctly
4. **Edge Cases**: Empty strings, zero amounts, null values

### Property-Based Tests

Property-based tests verify universal properties across all inputs using fast-check:

1. **Digit Accumulation**: Generate random digit sequences, verify string/number consistency
2. **Decimal Handling**: Generate random digit/decimal sequences, verify single decimal rule
3. **Optimistic Update Rollback**: Generate random chore/member combinations, simulate failures
4. **Multi-Assignment Count**: Generate random member selections, verify chore count

### Integration Tests

Integration tests verify component-store interactions:

1. **Modal Components**: Verify modals use stores directly (no inject)
2. **Form Components**: Verify form data flows through stores
3. **App.js Cleanup**: Verify app.js contains only initialization code

### Test Configuration

- **Framework**: Vitest 2.x
- **Property Testing**: fast-check 3.x
- **Minimum Iterations**: 100 per property test
- **Test Location**: `stores/*.test.js` alongside source files
