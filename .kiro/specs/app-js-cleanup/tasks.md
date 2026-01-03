# Implementation Plan: App.js Cleanup Migration

## Overview

This plan migrates remaining state and methods from app.js to Pinia stores, updates components to use stores directly, and removes the provide/inject bridge. The migration is done in phases to ensure each piece works before moving to the next.

## Tasks

- [x] 1. Migrate form state to choresStore
  - [x] 1.1 Add newChore, newQuicklistChore, choreDetailsForm state to choresStore
    - Add state properties with default values
    - Add resetNewChoreForm(), resetNewQuicklistChoreForm(), resetChoreDetailsForm() actions
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 1.2 Write property test for form reset actions
    - **Property: Form reset returns to default state**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 1.3 Remove form state from app.js data()
    - Remove newChore, newQuicklistChore, choreDetailsForm from app.js
    - _Requirements: 1.6_

- [x] 2. Migrate form state to familyStore
  - [x] 2.1 Add childForm, newPerson state to familyStore
    - Add state properties with default values
    - Add resetChildForm(), resetNewPersonForm() actions
    - _Requirements: 1.4, 1.5_
  - [x] 2.2 Remove form state from app.js data()
    - Remove childForm, newPerson from app.js
    - _Requirements: 1.6_

- [x] 3. Migrate habit flyout state to habitsStore
  - [x] 3.1 Add habit flyout state to habitsStore
    - Add habitFlyoutMemberId, editingHabit, habitForm, habitFormError, habitFormSubmitting state
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 3.2 Add habit flyout actions to habitsStore
    - Add openHabitFlyout(), closeHabitFlyout(), submitHabitForm() actions
    - _Requirements: 2.5_
  - [x] 3.3 Write property test for habit flyout state consistency
    - **Property 1: Habit Flyout State Consistency**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5**
  - [x] 3.4 Remove habit flyout state and methods from app.js
    - Remove habitFlyoutMemberId, editingHabit, habitForm, habitFormError, habitFormSubmitting
    - Remove openHabitFlyout(), closeHabitFlyout(), submitHabitForm() methods
    - _Requirements: 2.6_

- [x] 4. Migrate spending modal state to familyStore
  - [x] 4.1 Add spending modal state to familyStore
    - Add selectedPerson, spendAmount, spendAmountString state
    - _Requirements: 3.1, 3.2_
  - [x] 4.2 Add spending modal actions to familyStore
    - Add openSpendingModal(), closeSpendingModal(), addDigit(), addDecimal(), clearSpendAmount(), updateSpendAmount() actions
    - _Requirements: 3.3_
  - [x] 4.3 Write property test for spending digit accumulation
    - **Property 2: Spending Amount Digit Accumulation**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 4.4 Write property test for spending decimal handling
    - **Property 3: Spending Amount Decimal Handling**
    - **Validates: Requirements 3.2, 3.3**
  - [x] 4.5 Remove spending modal state and methods from app.js
    - Remove selectedPerson, spendAmount, spendAmountString
    - Remove openSpendingModal(), closeSpendingModal(), addDigit(), addDecimal(), clearSpendAmount(), confirmSpending()
    - _Requirements: 3.4_

- [x] 5. Migrate modal state to stores
  - [x] 5.1 Add scheduleModalChore, assignCategoryChore, assignCategorySelectedId to choresStore
    - Add state properties
    - Add openScheduleModal(), closeScheduleModal() actions
    - _Requirements: 4.1, 4.3_
  - [x] 5.2 Add defaultOrderMember, personToDelete to familyStore
    - Add state properties
    - Add openDefaultOrderModal(), closeDefaultOrderModal() actions
    - _Requirements: 4.2_
  - [x] 5.3 Remove modal state from app.js
    - Remove scheduleModalChore, defaultOrderMember, assignCategoryChore, assignCategorySelectedId, personToDelete
    - _Requirements: 4.4_

- [x] 6. Checkpoint - Verify state migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Migrate business logic methods to choresStore
  - [x] 7.1 Move assignSelectedChore to choresStore
    - Move full implementation including optimistic updates and rollback
    - _Requirements: 5.3_
  - [x] 7.2 Write property test for chore assignment optimistic update
    - **Property 4: Chore Assignment Optimistic Update**
    - **Validates: Requirements 5.3**
  - [x] 7.3 Move confirmMultiAssignment to choresStore
    - Move full implementation including parallel assignment
    - _Requirements: 5.5_
  - [x] 7.4 Write property test for multi-assignment count
    - **Property 5: Multi-Assignment Creates Correct Number of Chores**
    - **Validates: Requirements 5.5**
  - [x] 7.5 Move confirmChoreDetails to choresStore
    - Move full implementation for creating chores with details
    - _Requirements: 5.6_
  - [x] 7.6 Remove delegating methods from app.js
    - Remove assignSelectedChore, confirmMultiAssignment, confirmChoreDetails
    - _Requirements: 5.1_

- [x] 8. Migrate business logic methods to familyStore
  - [x] 8.1 Move confirmSpending to familyStore
    - Move full implementation including approval flow
    - _Requirements: 5.7_
  - [x] 8.2 Write property test for spending deduction
    - **Property 6: Spending Deduction Correctness**
    - **Validates: Requirements 5.7**
  - [x] 8.3 Move updateFamilyMemberDisplayName to familyStore
    - Move full implementation
    - _Requirements: 5.8_
  - [x] 8.4 Move updateMemberChoresEnabled to familyStore
    - Move full implementation including settings persistence
    - _Requirements: 5.9_
  - [x] 8.5 Remove delegating methods from app.js
    - Remove confirmSpending, updateFamilyMemberDisplayName, updateMemberChoresEnabled
    - _Requirements: 5.1_

- [x] 9. Checkpoint - Verify method migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Refactor modals to use stores directly
  - [x] 10.1 Update category-management-modal to use stores
    - Replace inject with useCategoriesStore(), useUIStore()
    - _Requirements: 6.1, 6.4_
  - [x] 10.2 Update schedule-modal to use stores
    - Replace inject with useChoresStore(), useUIStore()
    - _Requirements: 6.2, 6.4_
  - [x] 10.3 Update default-order-modal to use stores
    - Replace inject with useFamilyStore(), useUIStore()
    - _Requirements: 6.3, 6.4_
  - [x] 10.4 Update spending-modal to use stores
    - Replace inject with useFamilyStore(), useUIStore()
    - _Requirements: 6.4_
  - [x] 10.5 Update habit-modal to use stores
    - Replace inject with useHabitsStore(), useUIStore()
    - _Requirements: 6.4_

- [x] 11. Refactor remaining components to use stores
  - [x] 11.1 Update chore-page components to use stores
    - Replace inject with useChoresStore(), useFamilyStore()
    - _Requirements: 7.1, 7.2_
  - [x] 11.2 Update family-page components to use stores
    - Replace inject with useFamilyStore(), useAuthStore()
    - _Requirements: 7.2, 7.3_
  - [x] 11.3 Update shopping-page components to use stores
    - Replace inject with useShoppingStore()
    - _Requirements: 7.5_
  - [x] 11.4 Update auth-related components to use stores
    - Replace inject with useAuthStore(), useUIStore()
    - _Requirements: 7.3, 7.4_

- [x] 12. Checkpoint - Verify component migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Remove provide/inject bridge from app.js
  - [x] 13.1 Remove provide() function from app.js
    - Delete entire provide() block (~200 lines)
    - _Requirements: 7.6_
  - [x] 13.2 Remove computed property bridges from app.js
    - Remove computed properties that delegate to stores
    - _Requirements: 8.6_
  - [x] 13.3 Remove watch handlers for store sync from app.js
    - Remove bridge watchers
    - _Requirements: 8.8_

- [x] 14. Clean up app.js to minimal state
  - [x] 14.1 Remove remaining data() properties
    - Keep only: loading, error, currentPage, mobileNavOpen, navItems
    - Remove all form state, modal state, and store-related properties
    - _Requirements: 8.4_
  - [x] 14.2 Remove remaining delegating methods
    - Keep only: loadAllData (orchestrator), setCurrentPage, setupVisibilityChangeListener
    - Remove all methods that delegate to stores
    - _Requirements: 8.5_
  - [x] 14.3 Simplify loadAllData to pure orchestration
    - Call store.loadX() methods without duplicating logic
    - _Requirements: 5.2_
  - [x] 14.4 Verify app.js contains only initialization code
    - Vue app creation, Pinia setup, component registration, mounted() hook
    - _Requirements: 8.1, 8.2, 8.3, 8.7_

- [x] 15. Final checkpoint - Verify complete cleanup
  - Ensure all tests pass, ask the user if questions arise.
  - Verify app.js is ~150 lines (down from ~750+)
  - Verify no inject usage in components
  - Verify all state lives in stores

## Notes

- All tasks are required for comprehensive migration
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
