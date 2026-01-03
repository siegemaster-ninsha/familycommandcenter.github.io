# Requirements Document

## Introduction

This specification covers the final cleanup phase of migrating the monolithic `app.js` into individual Pinia stores and composables. The goal is to eliminate duplicated code, remove the provide/inject bridge, and ensure all state management flows through the appropriate stores. This completes the refactoring effort that has already migrated ~80% of state and ~60% of methods.

## Glossary

- **App_JS**: The main Vue application file (`app.js`) that historically contained all application state and methods
- **Pinia_Store**: A state management store using the Pinia library (e.g., `choresStore`, `familyStore`, `authStore`)
- **Provide_Inject_Bridge**: The Vue provide/inject mechanism used to expose app.js state and methods to child components
- **Composable**: A reusable function that encapsulates reactive state and logic (e.g., `useApi`, `useCelebrations`)
- **Form_State**: Reactive data objects used for form inputs (e.g., `newChore`, `childForm`, `habitForm`)
- **Modal_State**: Data associated with modal dialogs (e.g., `selectedPerson`, `scheduleModalChore`)
- **Delegating_Method**: A method in app.js that simply calls the equivalent store method

## Requirements

### Requirement 1: Migrate Form State to Stores

**User Story:** As a developer, I want form state to live in the appropriate stores, so that components can access form data without relying on app.js.

#### Acceptance Criteria

1. WHEN the Chores_Store is accessed, THE Chores_Store SHALL contain `newChore` form state with properties: name, amount, category, addToQuicklist, isDetailed
2. WHEN the Chores_Store is accessed, THE Chores_Store SHALL contain `newQuicklistChore` form state with properties: name, amount, category, categoryId, isDetailed, defaultDetails
3. WHEN the Chores_Store is accessed, THE Chores_Store SHALL contain `choreDetailsForm` state with properties: name, details, amount, category, assignedTo, isNewFromQuicklist
4. WHEN the Family_Store is accessed, THE Family_Store SHALL contain `childForm` state with properties: username, password, displayName
5. WHEN the Family_Store is accessed, THE Family_Store SHALL contain `newPerson` form state with property: name
6. WHEN form state is migrated, THE App_JS SHALL remove the corresponding data properties
7. WHEN a component needs form state, THE Component SHALL access it via the appropriate store instead of inject

### Requirement 2: Migrate Habit Flyout State to Habits Store

**User Story:** As a developer, I want habit flyout state to live in the habits store, so that habit management is fully encapsulated.

#### Acceptance Criteria

1. WHEN the Habits_Store is accessed, THE Habits_Store SHALL contain `habitFlyoutMemberId` state
2. WHEN the Habits_Store is accessed, THE Habits_Store SHALL contain `editingHabit` state for the habit being edited
3. WHEN the Habits_Store is accessed, THE Habits_Store SHALL contain `habitForm` state with property: name
4. WHEN the Habits_Store is accessed, THE Habits_Store SHALL contain `habitFormError` and `habitFormSubmitting` states
5. WHEN habit flyout methods are called, THE Habits_Store SHALL provide `openHabitFlyout`, `closeHabitFlyout`, and `submitHabitForm` actions
6. WHEN habit state is migrated, THE App_JS SHALL remove the corresponding data properties and methods

### Requirement 3: Migrate Spending Modal State to Family Store

**User Story:** As a developer, I want spending modal state to live in the family store, so that spending operations are fully encapsulated.

#### Acceptance Criteria

1. WHEN the Family_Store is accessed, THE Family_Store SHALL contain `selectedPerson` state for the spending modal
2. WHEN the Family_Store is accessed, THE Family_Store SHALL contain `spendAmount` and `spendAmountString` states
3. WHEN the Family_Store is accessed, THE Family_Store SHALL provide `openSpendingModal`, `closeSpendingModal`, `addDigit`, `addDecimal`, `clearSpendAmount`, and `confirmSpending` actions
4. WHEN spending state is migrated, THE App_JS SHALL remove the corresponding data properties and methods

### Requirement 4: Migrate Schedule/Order Modal State to Stores

**User Story:** As a developer, I want schedule and order modal state to live in the appropriate stores, so that modal data is properly encapsulated.

#### Acceptance Criteria

1. WHEN the Chores_Store is accessed, THE Chores_Store SHALL contain `scheduleModalChore` state
2. WHEN the Family_Store is accessed, THE Family_Store SHALL contain `defaultOrderMember` state
3. WHEN the Chores_Store is accessed, THE Chores_Store SHALL contain `assignCategoryChore` and `assignCategorySelectedId` states
4. WHEN modal state is migrated, THE App_JS SHALL remove the corresponding data properties

### Requirement 5: Remove Duplicate Methods from App.js

**User Story:** As a developer, I want to remove methods from app.js that simply delegate to stores, so that there is a single source of truth for each operation.

#### Acceptance Criteria

1. WHEN a method in App_JS only delegates to a store method, THE App_JS SHALL remove that delegating method
2. WHEN `loadAllData` is called, THE App_JS SHALL orchestrate store loading without duplicating store logic
3. WHEN `assignSelectedChore` is called, THE Chores_Store SHALL handle the assignment logic directly
4. WHEN `addToQuicklist` is called, THE Chores_Store SHALL handle quicklist creation directly
5. WHEN `confirmMultiAssignment` is called, THE Chores_Store SHALL handle multi-assignment logic directly
6. WHEN `confirmChoreDetails` is called, THE Chores_Store SHALL handle chore creation with details directly
7. WHEN `confirmSpending` is called, THE Family_Store SHALL handle spending logic directly
8. WHEN `updateFamilyMemberDisplayName` is called, THE Family_Store SHALL handle the update directly
9. WHEN `updateMemberChoresEnabled` is called, THE Family_Store SHALL handle visibility persistence directly

### Requirement 6: Refactor Remaining Inject-Based Modals

**User Story:** As a developer, I want modals to use stores directly instead of inject, so that the provide/inject bridge can be eliminated.

#### Acceptance Criteria

1. WHEN category-management-modal needs data, THE Modal SHALL use `useCategoriesStore()` directly instead of inject
2. WHEN schedule-modal needs data, THE Modal SHALL use `useChoresStore()` directly instead of inject
3. WHEN default-order-modal needs data, THE Modal SHALL use `useFamilyStore()` directly instead of inject
4. WHEN a modal needs to open/close, THE Modal SHALL use `useUIStore()` directly instead of inject
5. WHEN modals are refactored, THE App_JS SHALL remove the corresponding provide entries

### Requirement 7: Eliminate Provide/Inject Bridge

**User Story:** As a developer, I want to remove the provide/inject bridge entirely, so that all components access state through stores.

#### Acceptance Criteria

1. WHEN a component needs chore data, THE Component SHALL use `useChoresStore()` instead of inject
2. WHEN a component needs family data, THE Component SHALL use `useFamilyStore()` instead of inject
3. WHEN a component needs auth data, THE Component SHALL use `useAuthStore()` instead of inject
4. WHEN a component needs UI state, THE Component SHALL use `useUIStore()` instead of inject
5. WHEN a component needs shopping data, THE Component SHALL use `useShoppingStore()` instead of inject
6. WHEN all components are migrated, THE App_JS SHALL remove the entire `provide()` function
7. WHEN the bridge is removed, THE App_JS SHALL contain only initialization logic and page-level orchestration

### Requirement 8: Complete Cleanup of App.js

**User Story:** As a developer, I want app.js to be minimal and clean after migration, so that there is no legacy cruft remaining.

#### Acceptance Criteria

1. WHEN migration is complete, THE App_JS SHALL contain only Vue app initialization and Pinia setup
2. WHEN migration is complete, THE App_JS SHALL contain only component registration logic
3. WHEN migration is complete, THE App_JS SHALL contain only the mounted() lifecycle hook for app startup
4. WHEN migration is complete, THE App_JS SHALL NOT contain any data() properties that belong in stores
5. WHEN migration is complete, THE App_JS SHALL NOT contain any methods that delegate to stores
6. WHEN migration is complete, THE App_JS SHALL NOT contain any computed properties that bridge to stores
7. WHEN migration is complete, THE App_JS SHALL NOT contain any provide() function
8. WHEN migration is complete, THE App_JS SHALL NOT contain any watch() handlers for store synchronization
