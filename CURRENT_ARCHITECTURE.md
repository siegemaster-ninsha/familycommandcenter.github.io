# Current Frontend Architecture

## Overview

The Family Command Center frontend is a Vue 3 single-page application (SPA) with a page-based architecture. The application is deployed as static files to GitHub Pages and communicates with a serverless AWS backend via REST APIs and WebSockets.

## Technology Stack

- **Framework**: Vue 3 (Global build from CDN)
- **Styling**: Tailwind CSS (CDN), Custom CSS variables for theming
- **UI Components**: Shoelace Web Components (partial)
- **Icons**: Lucide Icons (custom SVG implementation)
- **State Management**: None (monolithic root state)
- **Build Process**: None (direct browser execution)
- **Deployment**: GitHub Pages (static hosting)

## Application Structure

### Root Application (`app.js`)

**Size**: 2,652 lines (monolithic)

**Responsibilities**:
- All application state management
- API communication layer
- WebSocket connection management
- Authentication state
- Navigation between pages
- Business logic for all features
- Event handling for child components

**Key State Properties**:
```javascript
{
  // Authentication
  isAuthenticated, currentUser, authForm, authError,
  
  // Navigation
  currentPage, navItems,
  
  // Chores
  chores, selectedChoreId, selectedQuicklistChore, quicklistChores,
  choresByPerson (computed),
  
  // Family Members
  people,
  
  // Shopping
  shoppingItems, shoppingQuickItems, stores,
  
  // Account
  accountSettings, accountId,
  
  // Modals (10+ modal states)
  showAddChoreModal, showAddToQuicklistModal, showNewDayModal, etc.,
  
  // UI State
  loading, error, showConfetti, mobileNavOpen,
  
  // WebSocket
  socket, socketConnected
}
```

### Component Hierarchy

```
app.js (Root Vue Instance)
├── index.html (Template)
│   ├── Header
│   │   └── nav-menu.js (Navigation)
│   │
│   ├── Main Content (Conditional per currentPage)
│   │   ├── tailwind-chore-page.js
│   │   │   ├── quicklist-section.js
│   │   │   ├── unassigned-section.js
│   │   │   ├── family-members-section.js
│   │   │   └── earnings-widget.js (Summary)
│   │   │
│   │   ├── shopping-page.js
│   │   │   ├── Shopping List (inline)
│   │   │   ├── Quick List (inline)
│   │   │   └── Store Management (inline)
│   │   │
│   │   ├── family-page.js
│   │   │   ├── Family Members Grid (inline)
│   │   │   └── Spending Requests (inline)
│   │   │
│   │   └── account-page.js
│   │       ├── Profile Settings (inline)
│   │       ├── Theme Selection (inline)
│   │       ├── Preferences (inline)
│   │       └── Data Management (inline)
│   │
│   └── app-modals.js (All modal dialogs)
│       ├── Add Chore Modal
│       ├── Add to Quicklist Modal
│       ├── Delete Person Modal
│       ├── New Day Modal
│       ├── Spending Modal
│       ├── Auth Modals (Login/Signup/Confirm)
│       ├── Child Creation Modal
│       └── Parent Invite Modal
│
└── ui-components.js (Shared UI elements)
    ├── Loading States
    ├── Error States
    ├── Success Messages
    └── Confetti Animation
```

## State Management Patterns

### Current Approach: No Formal State Management

**1. Root-Level Reactive Data**
- All state lives in the root Vue instance (`app.js`)
- Direct mutation from any component via `$parent`
- No encapsulation or boundaries

**2. Data Sharing Methods**:

#### a. Provide/Inject Pattern
```javascript
// In app.js
provide: {
  // Shared data
  people: this.people,
  chores: this.chores,
  choresByPerson: this.choresByPerson,
  
  // Shared methods
  apiCall: this.apiCall,
  loadChores: this.loadChores,
  
  // Utilities
  Helpers: window.Helpers,
  CONFIG: CONFIG
}

// In child components
inject: ['people', 'chores', 'apiCall', 'Helpers']
```

**Pros**: Simple dependency injection
**Cons**: No reactivity guarantees, hard to track data flow

#### b. $parent Access (Anti-pattern)
```javascript
// Extremely common throughout codebase
this.$parent.selectedChoreId
this.$parent.handleChoreClick(chore)
this.$parent.openModal()
this.$parent.showSuccessMessage('Done!')
```

**Cons**: 
- Tight coupling
- Breaks component reusability
- Hard to test
- Fragile (breaks if hierarchy changes)

#### c. Global Window Objects
```javascript
window.Helpers.IconLibrary.getIcon(...)
window.CONFIG.THEMES
window.ThemeManager.applyTheme(...)
window.authService
```

**Pros**: Accessible anywhere
**Cons**: Global state pollution, hard to track dependencies

## Data Flow

### Request Flow (API Calls)

```
User Action
  ↓
Component Event Handler ($parent method call)
  ↓
app.js method
  ↓
apiCall() helper (adds auth headers)
  ↓
fetch() to AWS API Gateway
  ↓
Backend Handler
  ↓
Response
  ↓
Direct state mutation in app.js
  ↓
Vue reactivity updates all components
```

### Real-time Updates (WebSocket)

```
WebSocket Message from Backend
  ↓
app.js handleRealtimeMessage()
  ↓
Direct array/object mutation
  ↓
Vue reactivity updates components
```

## Page Navigation System

**Current Implementation**:
- Simple string-based routing via `currentPage` property
- No Vue Router
- Conditional rendering with `v-if`
- No URL synchronization (no browser history)

```javascript
// Navigation
methods: {
  setCurrentPage(page) {
    this.currentPage = page;
    // No history management
    // No lazy loading
    // No route guards
  }
}

// In template
<div v-if="currentPage === 'chores'">
  <chore-page></chore-page>
</div>
<div v-else-if="currentPage === 'shopping'">
  <shopping-page></shopping-page>
</div>
```

## Component Communication Patterns

### 1. Props Down (Minimal Use)
```javascript
// earnings-widget.js
props: {
  compact: Boolean,
  individualsOnly: Boolean
}
```

### 2. Events Up (Rarely Used)
Most communication bypasses events and goes directly through `$parent`

### 3. Direct Parent Method Calls (Primary Pattern)
```javascript
// In child component
@click="$parent.openAddChoreModal()"
await this.$parent.handleChoreCompletion(chore)
this.$parent.showSuccessMessage('Success!')
```

### 4. Inject + Computed (Read-Only Data)
```javascript
inject: ['people', 'choresByPerson'],
// Components read but don't mutate (usually)
```

## API Integration

### Authentication
- Custom `authService` (window global)
- Cognito JWT tokens
- Tokens included in API call headers

### API Helper Method
```javascript
async apiCall(endpoint, options = {}) {
  const url = CONFIG.getApiUrl(endpoint);
  const authHeader = authService.getAuthHeader();
  const headers = {
    'Content-Type': 'application/json',
    'X-Account-Id': this.accountId,
    ...authHeader,
    ...options.headers
  };
  
  const response = await fetch(url, { headers, ...options });
  
  if (response.status === 401) {
    await this.handleAuthenticationRequired();
    throw new Error('Authentication required');
  }
  
  return await response.json();
}
```

### Data Loading Pattern
```javascript
async mounted() {
  await this.loadData();  // Multiple sequential API calls
}

async loadData() {
  await this.loadChores();
  await this.loadFamilyMembers();
  await this.loadQuicklistChores();
  await this.loadShoppingItems();
  // etc... (waterfall loading)
}
```

**Issues**:
- Sequential loading (slow)
- No caching strategy
- No error recovery
- Full page reloads on some errors

## Theme System

### Current Implementation
- Theme definitions in `config.js` (50+ themes)
- CSS custom properties
- ThemeManager utility for applying themes
- Stored in localStorage + backend

```javascript
// Theme application
ThemeManager.applyTheme(themeId) {
  const theme = CONFIG.THEMES[themeId];
  root.style.setProperty('--color-primary-500', theme.colors.primary);
  root.style.setProperty('--color-primary-600', darken(theme.colors.primary, 10));
  // ... many more properties
}
```

**Pros**: Flexible, many themes
**Cons**: Manual property management, no type safety

## Modal Management

### Current Pattern
Each modal has its own boolean flag in root state:

```javascript
data() {
  return {
    showAddChoreModal: false,
    showAddToQuicklistModal: false,
    showNewDayModal: false,
    showSpendingModal: false,
    showLoginModal: false,
    showSignupModal: false,
    showConfirmModal: false,
    showDeletePersonModal: false,
    showCreateChildModal: false,
    showInviteModal: false,
    showMultiAssignModal: false,
    // ... potential for more
  }
}
```

**Issues**:
- State explosion
- No modal queue/stack
- Body scroll locking manually managed
- Hard to add new modals without modifying root

## Build and Deployment

### No Build Step
- All JavaScript loaded directly in browser
- No bundling
- No tree-shaking
- No code splitting
- No TypeScript compilation

### GitHub Pages Deployment
```bash
# deploy-to-github-pages.ps1
# Simply copies files to gh-pages branch
```

**Pros**: Simple deployment
**Cons**: No optimization, large initial load

## Configuration Management

### Environment Detection
```javascript
CONFIG.ENV = {
  IS_DEVELOPMENT: window.location.hostname === 'localhost',
  IS_GITHUB_PAGES: window.location.hostname.includes('github.io')
}
```

### API Configuration
```javascript
CONFIG.API = {
  BASE_URL: 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com',
  WS_BASE: 'wss://kxpcn8baw8.execute-api.us-east-1.amazonaws.com',
  STAGE: 'dev',
  ENDPOINTS: { /* 20+ endpoints */ }
}
```

## Utility Modules

### helpers.js
- Icon library (SVG strings)
- Category helpers
- Selection state helpers

### settings.js
- User preferences
- LocalStorage management
- Settings sync

## Key Pain Points

### 1. Tight Coupling
- Components can't exist independently
- Everything depends on root instance
- No component reusability

### 2. Scalability Issues
- Root component is 2,600+ lines
- Adding features requires modifying core
- No clear module boundaries

### 3. Testing Challenges
- Components can't be unit tested in isolation
- Heavy mocking required
- No separation of concerns

### 4. State Management Chaos
- No single source of truth (despite single file)
- Mutations happen anywhere
- Hard to debug state changes
- No dev tools support

### 5. Performance Concerns
- No lazy loading
- All pages loaded upfront
- No memoization
- Waterfall API loading

### 6. Developer Experience
- No TypeScript
- No build-time checks
- No hot module replacement
- Manual script tag management

## Strengths to Preserve

1. **Simple Deployment**: GitHub Pages works well
2. **Theme System**: Flexible and powerful
3. **Real-time Updates**: WebSocket integration works
4. **Authentication**: Cognito integration is solid
5. **Responsive Design**: Mobile-first approach is good
6. **Icon System**: Custom implementation works well

## Next Steps for Refactoring

See `REFACTORING_ROADMAP.md` for detailed migration plan.

