# Component Dependency Map

## Visual Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                          app.js (ROOT)                          │
│  State: all data, methods, modals, navigation, auth            │
│  Size: 2,652 lines                                              │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┬──────────────┐
        │           │           │              │              │
        ▼           ▼           ▼              ▼              ▼
  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐  ┌───────────┐
  │  Chore  │ │Shopping │ │  Family  │ │ Account │  │ Nav Menu  │
  │  Page   │ │  Page   │ │   Page   │ │  Page   │  │           │
  └────┬────┘ └────┬────┘ └────┬─────┘ └────┬────┘  └─────┬─────┘
       │           │           │            │             │
       │           │           │            │             │
    [Uses]      [Uses]      [Uses]       [Uses]       [Uses]
       │           │           │            │             │
       ├→ $parent.selectedChoreId          │          $parent
       ├→ $parent.handleChoreClick()       │         .setCurrentPage()
       ├→ $parent.loadChores()             │
       ├→ $parent.showSuccessMessage()     │
       ├→ inject: people, chores           │
       │                                   │
       ▼                                   ▼
  ┌────────────────┐              ┌──────────────┐
  │  Child Sections│              │ Theme Manager│
  │                │              │  (window)    │
  └────────────────┘              └──────────────┘
       │
       ├→ quicklist-section
       ├→ unassigned-section
       ├→ family-members-section
       └→ earnings-widget
            │
            └→ [All use $parent for methods]
```

## Detailed Component Dependencies

### app.js (Root Component)

**Depends On**:
- `window.CONFIG` (Global configuration)
- `window.Helpers` (Icon library, utilities)
- `window.ThemeManager` (Theme application)
- `window.authService` (Authentication)
- `window.SettingsClient` (Settings API, optional)
- All child component definitions

**Provides To Children** (via provide/inject):
```javascript
{
  // State (reactive)
  people,
  chores,
  choresByPerson,
  selectedChore,
  selectedChoreId,
  selectedQuicklistChore,
  quicklistChores,
  shoppingItems,
  shoppingQuickItems,
  stores,
  accountSettings,
  accountId,
  currentUser,
  
  // Methods
  apiCall,
  loadChores,
  loadFamilyMembers,
  loadQuicklistChores,
  loadShoppingItems,
  loadShoppingQuickItems,
  loadStores,
  loadAccountSettings,
  
  // Utilities
  Helpers: window.Helpers,
  CONFIG: CONFIG,
  
  // UI Methods
  triggerConfetti,
  showSuccessMessage,
  openSpendingModal,
  
  // Event Handlers
  handleChoreClick,
  handleQuicklistChoreClick,
  assignSelectedChore,
  
  // State Management
  selectionStore (custom object),
  
  // Flags
  loading,
  error,
  isAuthenticated,
  completedChoreMessage
}
```

**Direct Dependencies**: 48+ child methods accessed via `$parent`

---

### tailwind-chore-page.js

**Depends On** (Inject):
```javascript
inject: [
  'people',                      // Read-only
  'choresByPerson',              // Read-only
  'selectedChore',               // Read-only
  'selectedChoreId',             // Read-only
  'selectedQuicklistChore',      // Read-only
  'quicklistChores',             // Read-only
  'loading',                     // Read-only
  'error',                       // Read-only
  'Helpers',                     // Read-only
  'CONFIG',                      // Read-only
  'currentUser',                 // Read-only
  'showAddChoreModal',           // ❌ Mutates parent state
  'showAddToQuicklistModal',     // ❌ Mutates parent state
  'handleChoreClick',            // Method reference
  'handleQuicklistChoreClick',   // Method reference
  'selectionStore'               // Custom object
]
```

**Depends On** ($parent access):
```javascript
// Direct parent method calls (20+)
this.$parent.openAddToQuicklistModal()
this.$parent.openAddChoreModal()
this.$parent.openMultiAssignModal(quicklistChore)
this.$parent.loadQuicklistChores()
this.$parent.apiCall(endpoint, options)
this.$parent.deleteChore(chore)
this.$parent.assignSelectedChore(assignTo)
this.$parent.handleChoreCompletion(chore)
this.$parent.approveChore(chore)
this.$parent.openSpendingModal(person)
this.$parent.handleChoreClick(chore)

// Direct parent state access (10+)
this.$parent.selectedChoreId
this.$parent.selectedQuicklistChore
this.$parent.currentUser
this.$parent.CONFIG
this.$parent.accountSettings
```

**Child Components**:
- `ChoreCard` (inline definition)
- `PersonCard` (inline definition)
- `EarningsCard` (inline definition)

**Used By**: app.js main content area

---

### shopping-page.js

**Depends On** (Inject):
```javascript
inject: [
  'shoppingItems',        // Provided array (mutates in place)
  'shoppingQuickItems',   // Provided array (mutates in place)
  'stores',               // Provided array (mutates in place)
  'apiCall',              // Method reference
  'loading',              // Read-only
  'Helpers'               // Utilities
]
```

**Depends On** ($parent access):
```javascript
// Parent method calls
this.$parent.loadShoppingItems()
this.$parent.loadShoppingQuickItems()
this.$parent.loadStores()
this.$parent.loadAccountSettings()
this.$parent.showSuccessMessage(message)

// Parent state access
this.$parent.accountSettings
```

**Direct Mutations**:
- Mutates `this.shoppingItems` array in place (optimistic updates)
- Mutates individual item properties (e.g., `item.completed`, `item.isToggling`)

**Used By**: app.js main content area

---

### family-page.js

**Depends On** (Inject):
```javascript
inject: [
  'allPeople',          // Different from 'people' (includes all members)
  'confirmDeletePerson',
  'currentUser'
]
```

**Depends On** ($parent access):
```javascript
// Parent method calls (15+)
this.$parent.openCreateChildModal()
this.$parent.createParentInvite()
this.$parent.updateFamilyMemberDisplayName(person)
this.$parent.updateMemberChoresEnabled(person)
this.$parent.openSpendingModal(person)
this.$parent.removeMember(person)
this.$parent.loadSpendingRequests()
this.$parent.approveSpendingRequest(id)
this.$parent.canRemoveMember(person)

// Parent state access
this.$parent.currentUser?.role
this.$parent.spendingRequests
```

**Direct Mutations**:
- Mutates `person.displayName` directly
- Mutates `person.enabledForChores` directly

**Used By**: app.js main content area

---

### account-page.js

**Depends On** (Inject):
```javascript
inject: [
  'accountSettings',   // Read/mutate
  'accountId',         // Read-only
  'currentUser'        // Read-only
]
```

**Depends On** ($parent access):
```javascript
// Parent method calls
this.$parent.loadAccountSettings()
this.$parent.handleLogout()
this.$parent.showSuccessMessage(message)

// Parent state access
this.$parent.authLoading
this.$parent.accountSettings?.updatedAt
```

**Depends On** (Globals):
```javascript
window.SettingsClient.updateProfile()
window.SettingsClient.updatePreferences()
window.ThemeManager.applyTheme(themeId)
window.authService.getAuthHeader()
window.CONFIG
```

**Used By**: app.js main content area

---

### family-members-section.js

**Depends On** (Inject):
```javascript
inject: [
  'choresByPerson',      // Read-only
  'people',              // Read-only
  'assignSelectedChore', // Method reference
  'handleChoreClick',    // Method reference
  'selectionStore',      // Custom object
  'Helpers'              // Utilities
]
```

**Depends On** ($parent access):
```javascript
// Parent method calls
this.$parent.handleChoreCompletion(chore)
this.$parent.approveChore(chore)
this.$parent.handleChoreClick(chore)

// Parent state access
this.$parent.selectedChore
this.$parent.selectedChoreId
this.$parent.selectedQuicklistChore
this.$parent.currentUser?.role
```

**Direct Mutations**:
- Mutates `chore.completed` directly

**Used By**: tailwind-chore-page.js

---

### quicklist-section.js

**Depends On** (Inject):
```javascript
inject: [
  'quicklistChores',            // Read-only
  'showAddToQuicklistModal',    // ❌ Boolean flag (shouldn't be injected)
  'handleQuicklistChoreClick',  // Method reference
  'openAddToQuicklistModal',    // Method reference
  'Helpers'                     // Utilities
]
```

**Depends On** ($parent access):
```javascript
// Parent method calls
this.$parent.apiCall(endpoint, options)
this.$parent.loadQuicklistChores()
this.$parent.showSuccessMessage(message)

// Parent state access
this.$parent.selectedChoreId
this.$parent.selectedQuicklistChore
this.$parent.showAddToQuicklistModal  // Also injected!
```

**Used By**: tailwind-chore-page.js (not currently used, replaced by inline)

---

### unassigned-section.js

**Depends On** (Inject):
```javascript
inject: [
  'choresByPerson',       // Read-only
  'showAddChoreModal',    // ❌ Boolean flag
  'assignSelectedChore',  // Method reference
  'selectedChore',        // Read-only
  'handleChoreClick',     // Method reference
  'openAddChoreModal',    // Method reference
  'selectionStore',       // Custom object
  'Helpers'               // Utilities
]
```

**Depends On** ($parent access):
```javascript
// Parent state access
this.$parent.selectedChore
this.$parent.selectedChoreId
this.$parent.selectedQuicklistChore
```

**Used By**: tailwind-chore-page.js (not currently used, replaced by inline)

---

### earnings-widget.js

**Depends On** (Inject):
```javascript
inject: [
  'people',                  // Read-only
  'triggerConfetti',         // Method reference
  'loadEarnings',            // Method reference
  'showSuccessMessage',      // Method reference
  'completedChoreMessage',   // Read-only
  'openSpendingModal'        // Method reference
]
```

**Props**:
```javascript
props: {
  compact: Boolean,         // Layout variant
  detailsToggle: Boolean,   // Show/hide details
  individualsOnly: Boolean  // Only show individual earnings
}
```

**No $parent access** ✅ (Good example of proper component design!)

**Used By**: 
- tailwind-chore-page.js (in earnings summary section)
- Could be reused elsewhere

---

### nav-menu.js

**Props**:
```javascript
props: {
  items: Array  // Navigation items [{ key, label }]
}
```

**Depends On** ($parent access):
```javascript
// Parent method calls
this.$parent.setCurrentPage(page)
```

**Depends On** (Globals):
```javascript
window.Helpers.IconLibrary.getIcon()
```

**Used By**: index.html header

---

### app-modals.js

**Depends On** (Inject):
```javascript
inject: [
  'showAddToQuicklistModal',
  'showAddChoreModal',
  'showDeletePersonModal',
  'showNewDayModal',
  'showSpendingModal',
  'newChore',
  'newQuicklistChore',
  'personToDelete',
  'selectedPerson',
  'spendAmount',
  'people',
  'currentUser',
  'choresByPerson',
  'Helpers',
  // ... many more
]
```

**Depends On** ($parent access):
- Extensive use of parent methods for all modal actions
- 50+ parent method calls

**Used By**: app.js (rendered at root level)

---

### ui-components.js

Various shared UI components with minimal dependencies.

**Typical Pattern**:
```javascript
inject: ['loading', 'error', 'showSuccessMessageFlag']
// No $parent access (good design)
```

---

## Dependency Anti-patterns

### 1. Circular State References
```
app.js provides 'selectedChoreId'
  ↓
child component injects 'selectedChoreId'
  ↓
child calls $parent method to change it
  ↓
app.js mutates 'selectedChoreId'
  ↓
Vue reactivity updates child
```

**Problem**: Unclear ownership, hard to debug

### 2. Inject + $parent for Same Data
```javascript
// Component does BOTH:
inject: ['selectedChoreId']
// AND
computed: {
  isSelected() {
    return this.$parent.selectedChoreId === this.id;
  }
}
```

**Problem**: Redundant dependencies, unclear which to use

### 3. Method References vs Direct Calls
```javascript
// Sometimes injected:
inject: ['handleChoreClick']
this.handleChoreClick(chore);

// Sometimes $parent:
this.$parent.handleChoreClick(chore);
```

**Problem**: Inconsistent access patterns

### 4. State Flags as Inject Dependencies
```javascript
inject: ['showAddChoreModal']  // ❌ Boolean flag shouldn't be injected
// Should be internal component state or event-driven
```

**Problem**: Tight coupling to parent's modal state

## $parent Method Call Inventory

### app.js Methods Called by Children (70+ total)

**Data Loading** (15):
- `loadChores()`
- `loadFamilyMembers()`
- `loadQuicklistChores()`
- `loadShoppingItems()`
- `loadShoppingQuickItems()`
- `loadStores()`
- `loadAccountSettings()`
- `loadSpendingRequests()`
- `loadEarnings()`
- ... and more

**Chore Management** (12):
- `handleChoreClick(chore)`
- `handleQuicklistChoreClick(quickChore)`
- `handleChoreCompletion(chore)`
- `assignSelectedChore(target)`
- `deleteChore(chore)`
- `approveChore(chore)`
- `addChore()`
- `addToQuicklist()`
- ... and more

**Modal Control** (11):
- `openAddChoreModal()`
- `openAddToQuicklistModal()`
- `openMultiAssignModal(quickChore)`
- `openSpendingModal(person)`
- `openCreateChildModal()`
- `showNewDayModal = true`
- ... and more

**Family Member Management** (8):
- `updateFamilyMemberDisplayName(person)`
- `updateMemberChoresEnabled(person)`
- `removeMember(person)`
- `canRemoveMember(person)`
- `createParentInvite()`
- `approveSpendingRequest(id)`
- ... and more

**UI Feedback** (5):
- `showSuccessMessage(message)`
- `triggerConfetti()`
- `handleAuthenticationRequired()`
- ... and more

**Navigation** (2):
- `setCurrentPage(page)`
- `showLoginForm()`
- `showSignupForm()`

**API** (1):
- `apiCall(endpoint, options)`

**Authentication** (3):
- `handleLogout()`
- `handleLogin()`
- `handleSignup()`

## Provide/Inject Usage Matrix

| Injected Property         | Type     | Read-Only? | Used By (# components) |
|---------------------------|----------|------------|------------------------|
| `people`                  | Array    | ✅         | 8 components           |
| `chores`                  | Array    | ✅         | 5 components           |
| `choresByPerson`          | Object   | ✅         | 6 components           |
| `selectedChoreId`         | String   | ✅         | 4 components           |
| `selectedChore`           | Object   | ✅         | 3 components           |
| `selectedQuicklistChore`  | Object   | ✅         | 3 components           |
| `quicklistChores`         | Array    | ✅         | 2 components           |
| `shoppingItems`           | Array    | ❌         | 1 component (mutated)  |
| `shoppingQuickItems`      | Array    | ❌         | 1 component (mutated)  |
| `stores`                  | Array    | ❌         | 1 component (mutated)  |
| `accountSettings`         | Object   | ❌         | 2 components (mutated) |
| `currentUser`             | Object   | ✅         | 5 components           |
| `loading`                 | Boolean  | ✅         | 4 components           |
| `error`                   | String   | ✅         | 3 components           |
| `apiCall`                 | Function | ✅         | 3 components           |
| `Helpers`                 | Object   | ✅         | 12 components          |
| `CONFIG`                  | Object   | ✅         | 6 components           |
| `showXXXModal`            | Boolean  | ❌         | 3 components (❌ bad)  |

## Global Window Dependencies

| Global Object              | Used By (# components) | Purpose                      |
|----------------------------|------------------------|------------------------------|
| `window.Helpers`           | 12 components          | Icon library, utilities      |
| `window.CONFIG`            | 8 components           | Configuration, API endpoints |
| `window.ThemeManager`      | 1 component            | Theme application            |
| `window.authService`       | 2 components           | Authentication               |
| `window.SettingsClient`    | 1 component            | Settings API (optional)      |
| `window.Vue`               | All components         | Vue framework                |
| Component exports on window| All components        | Manual registration          |

## Coupling Score (0-10, 10 = most coupled)

| Component                  | Coupling Score | Primary Issues                              |
|----------------------------|----------------|---------------------------------------------|
| **app.js**                 | 10             | Everything depends on it                    |
| **app-modals.js**          | 9              | Extensive $parent access, 50+ methods       |
| **tailwind-chore-page.js** | 9              | 20+ $parent calls, multiple injections      |
| **family-members-section** | 8              | Direct state mutations, $parent access      |
| **quicklist-section.js**   | 7              | $parent API calls, state access             |
| **unassigned-section.js**  | 7              | Similar to quicklist                        |
| **shopping-page.js**       | 7              | Direct array mutations, $parent calls       |
| **family-page.js**         | 7              | Direct object mutations, many $parent calls |
| **account-page.js**        | 6              | Multiple global dependencies                |
| **nav-menu.js**            | 4              | Only 1 $parent call                         |
| **earnings-widget.js**     | 3              | ✅ Good: props and inject only, no $parent  |
| **ui-components.js**       | 2              | ✅ Good: minimal dependencies               |

## Refactoring Priority

### High Priority (Break Coupling First)
1. **app.js** - Extract into stores and services
2. **app-modals.js** - Convert to event-driven system
3. **tailwind-chore-page.js** - Remove $parent, use store

### Medium Priority
4. **family-members-section.js** - Isolate as widget
5. **shopping-page.js** - Use dedicated store
6. **family-page.js** - Use dedicated store

### Low Priority (Already Decent)
7. **earnings-widget.js** - Already well-structured
8. **nav-menu.js** - Minor cleanup needed
9. **ui-components.js** - Mostly fine

## Ideal Future Dependency Graph

```
Pinia Stores (State Management)
├── useChoresStore
├── useShoppingStore
├── useFamilyStore
├── useAuthStore
├── useUIStore
└── useDashboardStore

Event Bus (Communication)
├── choreEvents
├── modalEvents
└── navigationEvents

Services (Business Logic)
├── choreService (API calls)
├── shoppingService (API calls)
├── familyService (API calls)
└── authService (existing)

Components (UI Only)
├── Widget Base Class
│   ├── Chore Widgets
│   ├── Shopping Widgets
│   ├── Family Widgets
│   └── Info Widgets
└── Dashboard Shell
    └── Widget Grid System

Utilities (Pure Functions)
├── helpers
├── theme
└── icons
```

**Key Changes**:
- No $parent access anywhere
- Components only interact with stores
- Stores handle API calls via services
- Events for cross-widget communication
- Each widget is self-contained

