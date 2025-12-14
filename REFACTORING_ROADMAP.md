# Refactoring Roadmap: Dashboard Architecture

## Executive Summary

This document outlines the phased approach to refactor the Family Command Center frontend from a monolithic Vue application into a modular, widget-based dashboard system using Pinia for state management.

**Timeline**: 8-12 weeks (depending on testing rigor)
**Strategy**: Gradual migration with both systems running in parallel
**Risk**: Low (incremental changes with rollback capability)

## Goals

### Primary Goals
1. Enable user-configurable dashboard with add/remove widgets
2. Make components independently deployable and testable
3. Eliminate tight coupling (`$parent` access)
4. Improve performance through code splitting
5. Enable easier feature development

### Secondary Goals
6. Improve developer experience
7. Add proper state management
8. Enable widget marketplace (future)
9. Support mobile-specific widget layouts
10. Better error handling and recovery

## Architecture Principles

### Widget System Principles
1. **Self-Contained**: Each widget manages its own UI state
2. **Store-Connected**: Widgets read from and dispatch to stores
3. **Event-Driven**: Inter-widget communication via events only
4. **Configurable**: User can add/remove/arrange widgets
5. **Lazy-Loaded**: Widgets load on-demand
6. **Testable**: Each widget can be tested in isolation

### State Management Principles
1. **Single Source of Truth**: Stores own their domain data
2. **Immutable Updates**: No direct state mutations
3. **Async Actions**: All API calls in store actions
4. **Computed Getters**: Derived data via getters
5. **DevTools**: Full Pinia devtools support

## Phase Overview

| Phase | Duration | Focus                    | Risk | Complexity |
|-------|----------|--------------------------|------|------------|
| 0     | 1 week   | Setup & Infrastructure   | Low  | Medium     |
| 1     | 2 weeks  | Core Stores              | Low  | High       |
| 2     | 1 week   | Widget Base System       | Med  | Medium     |
| 3     | 3 weeks  | Widget Migration         | Med  | Medium     |
| 4     | 2 weeks  | Dashboard Page           | Med  | High       |
| 5     | 1 week   | Polish & Optimization    | Low  | Low        |

---

## Phase 0: Setup & Infrastructure (Week 1)

### Goals
- Add Pinia to the project
- Set up module structure
- Create developer documentation
- Establish patterns

### Tasks

#### 1. Add Pinia (Day 1)
```html
<!-- In index.html, after Vue -->
<script src="https://unpkg.com/pinia@2.1.7/dist/pinia.iife.js"></script>

<script>
  // Initialize Pinia
  const pinia = Pinia.createPinia();
</script>
```

```javascript
// In app.js, update app initialization
const app = createApp({
  // ... existing
});

app.use(pinia); // Add Pinia
```

**Validation**: Pinia devtools appear in Vue devtools

#### 2. Create Store Directory Structure (Day 1)
```
frontEnd/
├── stores/
│   ├── README.md              # Store documentation
│   ├── auth.js                # useAuthStore
│   ├── chores.js              # useChoresStore
│   ├── shopping.js            # useShoppingStore
│   ├── family.js              # useFamilyStore
│   ├── ui.js                  # useUIStore
│   └── dashboard.js           # useDashboardStore
│
├── services/
│   ├── api.js                 # Base API service
│   ├── choreService.js        # Chore API calls
│   ├── shoppingService.js     # Shopping API calls
│   └── familyService.js       # Family API calls
│
├── widgets/
│   ├── README.md              # Widget development guide
│   ├── base/
│   │   ├── WidgetBase.js      # Base widget mixin/class
│   │   └── widget-types.js    # Widget type definitions
│   └── [widgets to be added in Phase 3]
│
└── composables/
    ├── useWidget.js           # Widget composable
    └── useResponsive.js       # Responsive utilities
```

#### 3. Create Base API Service (Day 2)
**File**: `frontEnd/services/api.js`

```javascript
// Base API service - centralizes all API logic
class ApiService {
  constructor(config, authService) {
    this.config = config;
    this.authService = authService;
  }

  async call(endpoint, options = {}) {
    const url = this.config.getApiUrl(endpoint);
    const authHeader = this.authService.getAuthHeader();
    
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      throw new Error('AUTH_REQUIRED');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API_ERROR');
    }

    return await response.json();
  }

  get(endpoint, options) {
    return this.call(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, data, options) {
    return this.call(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  put(endpoint, data, options) {
    return this.call(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  delete(endpoint, options) {
    return this.call(endpoint, { method: 'DELETE', ...options });
  }
}

// Export singleton
window.apiService = new ApiService(CONFIG, authService);
```

**Validation**: Test API calls work through new service

#### 4. Create Store Documentation (Day 2-3)
Document patterns and best practices for team

#### 5. Update index.html Script Loading (Day 3)
```html
<!-- New structure -->
<script src="services/api.js"></script>
<script src="stores/auth.js"></script>
<!-- ... other stores as created -->
```

### Deliverables
- ✅ Pinia integrated and working
- ✅ Directory structure created
- ✅ Base API service implemented
- ✅ Documentation written
- ✅ Team aligned on approach

### Risks & Mitigation
- **Risk**: Pinia CDN version issues
  - **Mitigation**: Test thoroughly, have fallback version

---

## Phase 1: Core Stores (Weeks 2-3)

### Goals
- Create all domain stores
- Migrate existing state incrementally
- Run parallel with old system
- Validate data flow

### Store Implementation Order

#### Week 2: Foundation Stores

##### 1.1 useAuthStore (Day 1-2)
**File**: `frontEnd/stores/auth.js`

**Responsibilities**:
- User authentication state
- Login/logout actions
- Token management
- Current user info

**State**:
```javascript
{
  isAuthenticated: false,
  currentUser: null,
  loading: false,
  error: null
}
```

**Actions**:
- `login(email, password)`
- `signup(userData)`
- `logout()`
- `confirmSignup(code)`
- `loadCurrentUser()`

**Getters**:
- `isParent()` - User role check
- `isChild()` - User role check
- `userDisplayName()` - Formatted name

**Migration Strategy**:
1. Create store
2. Gradually replace `app.js` auth state references
3. Keep both working during transition
4. Test thoroughly
5. Remove old auth state

**Validation**:
- Login/logout works through store
- Components can access via `useAuthStore()`

##### 1.2 useUIStore (Day 2-3)
**File**: `frontEnd/stores/ui.js`

**Responsibilities**:
- Modal states
- Loading states
- Toast notifications
- Navigation state

**State**:
```javascript
{
  modals: {
    addChore: false,
    addToQuicklist: false,
    spending: false,
    // ... all modals
  },
  currentPage: 'chores',
  loading: false,
  error: null,
  successMessage: '',
  showConfetti: false
}
```

**Actions**:
- `openModal(modalName, data?)`
- `closeModal(modalName)`
- `closeAllModals()`
- `showSuccess(message)`
- `showError(message)`
- `triggerConfetti()`
- `setCurrentPage(page)`

**Getters**:
- `isModalOpen(modalName)`
- `hasAnyModalOpen()`

**Migration Strategy**:
1. Create modal registry
2. Replace individual `showXModal` flags
3. Update components to use store methods
4. Simplify modal code

**Validation**:
- All modals open/close through store
- No `$parent.showXModal = true` calls remain

#### Week 3: Domain Stores

##### 1.3 useChoresStore (Day 1-3)
**File**: `frontEnd/stores/chores.js`

**Responsibilities**:
- Chores data
- Quicklist chores
- Selection state
- Chore CRUD operations

**State**:
```javascript
{
  chores: [],
  quicklistChores: [],
  selectedChoreId: null,
  selectedQuicklistChore: null,
  loading: false,
  error: null
}
```

**Actions**:
- `loadChores()`
- `loadQuicklistChores()`
- `createChore(choreData)`
- `updateChore(id, updates)`
- `deleteChore(id)`
- `assignChore(choreId, personName)`
- `toggleComplete(choreId)`
- `approveChore(choreId)`
- `selectChore(chore)`
- `clearSelection()`
- `startNewDay()`

**Getters**:
- `choresByPerson()` - Grouped chores
- `unassignedChores()` - Unassigned list
- `selectedChore()` - Current selection
- `choresForPerson(personName)` - Person's chores

**Integration with Existing**:
```javascript
// In app.js - temporary bridge
computed: {
  chores() {
    const store = useChoresStore();
    return store.chores;
  },
  choresByPerson() {
    const store = useChoresStore();
    return store.choresByPerson;
  }
}
```

**Migration Strategy**:
1. Create store with all chore logic
2. Keep app.js state but populate from store
3. Update components one at a time
4. Remove app.js state when all migrated

**Validation**:
- All chore operations work through store
- WebSocket updates still work
- Real-time sync maintained

##### 1.4 useShoppingStore (Day 3-4)
**File**: `frontEnd/stores/shopping.js`

**Responsibilities**:
- Shopping items
- Quick items
- Stores
- Shopping operations

**State**:
```javascript
{
  items: [],
  quickItems: [],
  stores: [],
  loading: false,
  error: null
}
```

**Actions**:
- `loadItems()`
- `loadQuickItems()`
- `loadStores()`
- `addItem(itemData)`
- `updateItem(id, updates)`
- `deleteItem(id)`
- `toggleItemComplete(id)`
- `clearCompleted()`
- `markAllComplete()`
- `clearAll()`

**Getters**:
- `itemsByCategory()` - Grouped items
- `completedItems()` - Completed list
- `pendingItems()` - Pending list
- `completionPercentage()`

**Validation**:
- Shopping list fully functional through store
- Quick items work
- Store management works

##### 1.5 useFamilyStore (Day 4-5)
**File**: `frontEnd/stores/family.js`

**Responsibilities**:
- Family members
- Member settings
- Spending requests
- Earnings tracking

**State**:
```javascript
{
  members: [],
  spendingRequests: [],
  loading: false,
  error: null
}
```

**Actions**:
- `loadMembers()`
- `createChild(childData)`
- `updateMember(id, updates)`
- `removeMember(id)`
- `loadSpendingRequests()`
- `approveSpendingRequest(id)`
- `createParentInvite()`

**Getters**:
- `enabledMembers()` - Visible on chore board
- `allMembers()` - Including hidden
- `pendingRequests()` - Unapproved requests
- `memberById(id)`

**Validation**:
- Family management works
- Earnings sync properly
- Spending requests flow correctly

### Parallel System Strategy

During Phase 1, both systems run side-by-side:

```javascript
// app.js maintains existing state
data() {
  return {
    chores: [],        // Old way
    people: [],        // Old way
    // etc...
  }
},

// But also syncs with stores
watch: {
  // Watch store changes and sync to old state
  '$choresStore.chores': {
    handler(newChores) {
      this.chores = newChores;  // Temporary bridge
    }
  }
},

// Components can use either during transition
mounted() {
  // Old way still works
  this.$parent.loadChores();
  
  // New way also works
  const store = useChoresStore();
  store.loadChores();
}
```

### Deliverables
- ✅ 5 core stores implemented
- ✅ All domain logic migrated to stores
- ✅ Both systems working in parallel
- ✅ Comprehensive store tests written

### Risks & Mitigation
- **Risk**: Data sync issues between old/new systems
  - **Mitigation**: Careful watchers, validation checks
- **Risk**: Performance degradation
  - **Mitigation**: Profile and optimize, remove old system ASAP

---

## Phase 2: Widget Base System (Week 4)

### Goals
- Define widget interface/contract
- Create base widget class/mixin
- Implement widget registration system
- Build widget configuration schema

### Tasks

#### 2.1 Widget Interface Definition (Day 1)
**File**: `frontEnd/widgets/base/widget-types.js`

```javascript
// Widget metadata interface
const WidgetMetadata = {
  id: String,              // unique-widget-id
  name: String,            // Display name
  description: String,     // Short description
  icon: String,            // Icon identifier
  category: String,        // Category for organization
  defaultSize: {           // Default grid size
    w: Number,             // Width in grid units
    h: Number              // Height in grid units
  },
  minSize: {
    w: Number,
    h: Number
  },
  maxSize: {
    w: Number,
    h: Number
  },
  configurable: Boolean,   // Has settings?
  refreshInterval: Number, // Auto-refresh (ms, 0 = manual)
  permissions: Array       // Required permissions ['parent', 'child']
};

// Widget configuration interface
const WidgetConfig = {
  widgetId: String,        // Widget type ID
  instanceId: String,      // Unique instance ID
  position: { x, y },      // Grid position
  size: { w, h },          // Current size
  settings: Object,        // Widget-specific settings
  enabled: Boolean         // Active/inactive
};

// Widget lifecycle hooks
const WidgetLifecycle = {
  onMount: Function,       // Called when widget added
  onUnmount: Function,     // Called when widget removed
  onResize: Function,      // Called when widget resized
  onConfigure: Function,   // Called when settings changed
  onRefresh: Function      // Called on manual/auto refresh
};
```

#### 2.2 Base Widget Mixin (Day 2-3)
**File**: `frontEnd/widgets/base/WidgetBase.js`

```javascript
const WidgetBase = {
  props: {
    config: {
      type: Object,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  
  emits: [
    'configure',     // Open settings
    'remove',        // Remove widget
    'refresh',       // Manual refresh
    'error',         // Widget error
    'resize'         // Size changed
  ],
  
  data() {
    return {
      loading: false,
      error: null,
      lastRefresh: null
    };
  },
  
  computed: {
    widgetId() {
      return this.config.widgetId;
    },
    instanceId() {
      return this.config.instanceId;
    },
    settings() {
      return this.config.settings || {};
    }
  },
  
  methods: {
    async refresh() {
      this.loading = true;
      this.error = null;
      try {
        await this.onRefresh();
        this.lastRefresh = new Date();
      } catch (err) {
        this.error = err.message;
        this.$emit('error', err);
      } finally {
        this.loading = false;
      }
    },
    
    configure() {
      this.$emit('configure', this.config);
    },
    
    remove() {
      if (confirm(`Remove ${this.metadata.name}?`)) {
        this.$emit('remove', this.instanceId);
      }
    },
    
    // Override in widget implementations
    onRefresh() {
      // Widget-specific refresh logic
    },
    
    onConfigure() {
      // Widget-specific config logic
    }
  },
  
  mounted() {
    // Auto-refresh setup
    if (this.metadata.refreshInterval > 0) {
      this._refreshTimer = setInterval(
        () => this.refresh(),
        this.metadata.refreshInterval
      );
    }
    
    // Initial load
    this.refresh();
  },
  
  beforeUnmount() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
    }
  }
};

window.WidgetBase = WidgetBase;
```

#### 2.3 Widget Registry (Day 3-4)
**File**: `frontEnd/widgets/base/widget-registry.js`

```javascript
class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
  }
  
  register(metadata, component) {
    if (this.widgets.has(metadata.id)) {
      console.warn(`Widget ${metadata.id} already registered`);
      return;
    }
    
    this.widgets.set(metadata.id, {
      metadata,
      component
    });
  }
  
  get(widgetId) {
    return this.widgets.get(widgetId);
  }
  
  getAll() {
    return Array.from(this.widgets.values());
  }
  
  getByCategory(category) {
    return this.getAll().filter(
      w => w.metadata.category === category
    );
  }
  
  canUserAccess(widgetId, userRole) {
    const widget = this.get(widgetId);
    if (!widget) return false;
    
    const permissions = widget.metadata.permissions;
    if (!permissions || permissions.length === 0) return true;
    
    return permissions.includes(userRole);
  }
}

window.widgetRegistry = new WidgetRegistry();
```

#### 2.4 Widget Configuration Component (Day 4-5)
**File**: `frontEnd/components/widget-configurator.js`

Modal for configuring widget settings.

### Deliverables
- ✅ Widget base mixin created
- ✅ Widget registry implemented
- ✅ Configuration system built
- ✅ Widget development guide written

---

## Phase 3: Widget Migration (Weeks 5-7)

### Goals
- Convert existing components to widgets
- Create new widget variants
- Test widget independence
- Build widget library

### Widget Migration Order

#### 3.1 Simple Widgets First (Week 5)

##### Widget: Family Member Chores Card
**File**: `frontEnd/widgets/family-member-chores.js`

**Metadata**:
```javascript
{
  id: 'family-member-chores',
  name: 'Family Member Chores',
  description: 'Shows chores for a specific family member',
  icon: 'user',
  category: 'chores',
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 1, h: 2 },
  maxSize: { w: 4, h: 4 },
  configurable: true,
  refreshInterval: 0,
  permissions: []
}
```

**Settings**:
```javascript
{
  memberId: String,  // Which family member
  showEarnings: Boolean,
  showCompleted: Boolean
}
```

**Implementation**:
Extract from `family-members-section.js`, make standalone

##### Widget: Earnings Summary
**File**: `frontEnd/widgets/earnings-summary.js`

Already mostly isolated! Simple conversion.

##### Widget: Quicklist
**File**: `frontEnd/widgets/quicklist.js`

**Settings**:
```javascript
{
  columns: Number,  // How many columns
  showAmount: Boolean,
  categories: Array  // Filter by category
}
```

#### 3.2 Medium Complexity Widgets (Week 6)

##### Widget: Shopping List
**File**: `frontEnd/widgets/shopping-list.js`

**Settings**:
```javascript
{
  groupBy: 'category' | 'store' | 'none',
  showCompleted: Boolean,
  categories: Array  // Filter
}
```

##### Widget: Family Members Grid
**File**: `frontEnd/widgets/family-members-grid.js`

##### Widget: Unassigned Chores
**File**: `frontEnd/widgets/unassigned-chores.js`

#### 3.3 Advanced Widgets (Week 7)

##### Widget: Chore Progress Chart
**File**: `frontEnd/widgets/chore-progress-chart.js`

New widget showing completion trends!

##### Widget: Spending Requests
**File**: `frontEnd/widgets/spending-requests.js`

(Parents only)

##### Widget: Quick Actions Panel
**File**: `frontEnd/widgets/quick-actions.js`

Customizable action buttons

### Widget Testing Checklist

For each widget:
- [ ] Can be added to dashboard
- [ ] Can be removed from dashboard
- [ ] Can be resized
- [ ] Can be configured
- [ ] Works with stores (no $parent)
- [ ] Error handling works
- [ ] Loading states work
- [ ] Manual refresh works
- [ ] Auto-refresh works (if applicable)
- [ ] Mobile responsive
- [ ] Accessible (ARIA labels)

### Deliverables
- ✅ 10+ widgets created
- ✅ All existing features as widgets
- ✅ New widget variants
- ✅ Widget tests passing

---

## Phase 4: Dashboard Page (Weeks 8-9)

### Goals
- Build dashboard shell
- Implement widget grid system
- Add widget picker/customization
- Persist layouts to backend

### Tasks

#### 4.1 Dashboard Store (Day 1-2)
**File**: `frontEnd/stores/dashboard.js`

**State**:
```javascript
{
  layouts: {
    default: [],       // Default layout
    mobile: [],        // Mobile-specific layout
    custom: []         // User customization
  },
  activeLayout: 'default',
  widgets: [],         // User's widget instances
  loading: false,
  error: null
}
```

**Actions**:
- `loadLayout()` - Load from backend
- `saveLayout()` - Persist to backend
- `addWidget(widgetId, config?)` - Add widget instance
- `removeWidget(instanceId)` - Remove widget
- `updateWidgetConfig(instanceId, config)` - Update settings
- `moveWidget(instanceId, position)` - Change position
- `resizeWidget(instanceId, size)` - Change size
- `resetLayout()` - Reset to default

#### 4.2 Dashboard Page Component (Day 3-5)
**File**: `frontEnd/components/dashboard-page.js`

**Features**:
- Grid layout system (CSS Grid)
- Drag and drop reordering
- Widget picker modal
- Edit mode toggle
- Responsive breakpoints

**Template Structure**:
```vue
<div class="dashboard-page">
  <div class="dashboard-header">
    <h1>Dashboard</h1>
    <button @click="toggleEditMode">
      {{ editMode ? 'Done' : 'Customize' }}
    </button>
  </div>
  
  <div class="widget-grid" :class="{ 'edit-mode': editMode }">
    <component
      v-for="widget in widgets"
      :key="widget.instanceId"
      :is="getWidgetComponent(widget.widgetId)"
      :config="widget"
      :editable="editMode"
      :style="getGridStyle(widget)"
      @configure="configureWidget"
      @remove="removeWidget"
      @resize="resizeWidget"
    />
  </div>
  
  <div v-if="editMode" class="widget-picker">
    <button @click="showWidgetPicker = true">
      + Add Widget
    </button>
  </div>
  
  <!-- Widget picker modal -->
  <widget-picker-modal
    v-if="showWidgetPicker"
    @select="addWidget"
    @close="showWidgetPicker = false"
  />
</div>
```

#### 4.3 Widget Grid System (Day 5-7)
CSS Grid-based responsive layout with:
- 12 column grid (desktop)
- 6 column grid (tablet)
- 2 column grid (mobile)
- Auto-flow dense packing
- Drag handles in edit mode

#### 4.4 Widget Picker Modal (Day 7-8)
**Component**: `widget-picker-modal.js`

**Features**:
- Browse available widgets
- Filter by category
- See widget previews
- Check permissions
- Add to dashboard

#### 4.5 Backend Integration (Day 8-10)
Update Account Settings API to store dashboard layouts:

```javascript
// Account settings schema addition
{
  dashboardLayout: {
    widgets: [
      {
        widgetId: 'family-member-chores',
        instanceId: 'widget-uuid-1',
        position: { x: 0, y: 0 },
        size: { w: 2, h: 2 },
        settings: { memberId: 'person-1' }
      },
      // ... more widgets
    ],
    version: 1  // For future migrations
  }
}
```

**Actions**:
- Save layout on every change (debounced)
- Load layout on app init
- Merge with defaults if empty

### Deliverables
- ✅ Dashboard page functional
- ✅ Widget grid working
- ✅ Add/remove widgets works
- ✅ Layouts persist to backend
- ✅ Mobile responsive

---

## Phase 5: Polish & Optimization (Week 10)

### Goals
- Remove old page system
- Optimize performance
- Fix bugs
- User testing
- Documentation

### Tasks

#### 5.1 Remove Old System (Day 1-2)
Once dashboard is working:
- Remove old page components
- Remove app.js monolithic state
- Clean up $parent references
- Remove old navigation

#### 5.2 Performance Optimization (Day 3-4)
- Lazy load widget components
- Memoize expensive computations
- Optimize re-renders
- Bundle size analysis

#### 5.3 Widget Marketplace Prep (Day 4-5)
- Widget documentation templates
- Widget submission process
- Widget approval workflow
- Third-party widget support

#### 5.4 User Testing (Day 5-7)
- Beta test with real users
- Gather feedback
- Fix critical issues
- Iterate on UX

### Deliverables
- ✅ Old system removed
- ✅ Performance optimized
- ✅ Bugs fixed
- ✅ User tested
- ✅ Documentation complete

---

## Migration Checklist

### Before Starting
- [ ] Team alignment on approach
- [ ] Design mockups approved
- [ ] API changes identified
- [ ] Testing strategy defined

### Phase 0
- [ ] Pinia integrated
- [ ] Directory structure created
- [ ] Base API service working
- [ ] Documentation written

### Phase 1
- [ ] useAuthStore complete
- [ ] useUIStore complete
- [ ] useChoresStore complete
- [ ] useShoppingStore complete
- [ ] useFamilyStore complete
- [ ] All stores tested
- [ ] Parallel system working

### Phase 2
- [ ] Widget base mixin created
- [ ] Widget registry working
- [ ] Configuration system built
- [ ] First test widget created

### Phase 3
- [ ] 10+ widgets migrated
- [ ] All widgets tested
- [ ] Widget library complete

### Phase 4
- [ ] Dashboard page built
- [ ] Widget grid working
- [ ] Backend integration done
- [ ] Mobile responsive

### Phase 5
- [ ] Old system removed
- [ ] Performance optimized
- [ ] User testing complete
- [ ] Launch ready

---

## Rollback Plan

At any phase, if critical issues arise:

1. **Identify Problem**: What's broken?
2. **Isolate**: Is it store, widget, or dashboard?
3. **Quick Fix**: Can it be fixed in < 2 hours?
4. **If No**: Disable new system, revert to old
5. **Communicate**: Update team and users
6. **Fix**: Resolve issue in dev environment
7. **Re-deploy**: When ready

**Safety**: Old system remains in code until Phase 5, allowing instant rollback.

---

## Success Metrics

### Technical Metrics
- Zero `$parent` calls in widgets
- All state in stores
- 100% widget test coverage
- Load time < 3s
- Bundle size < current + 50KB

### User Metrics
- Dashboard customization used by 50%+ users
- Average 5+ widgets per dashboard
- Positive user feedback
- No increase in bug reports

### Developer Metrics
- New widget in < 2 hours
- Components 80% smaller
- State changes trackable in devtools
- Faster feature development

---

## Future Enhancements (Post-Phase 5)

### Widget Marketplace
- Third-party widget support
- Widget approval process
- Widget versioning

### Advanced Features
- Widget animations
- Widget communication (via events)
- Shared widget state
- Widget templates

### Mobile Improvements
- Swipeable widgets
- Mobile-specific widgets
- Gesture controls

### Analytics & Insights
- Widget usage tracking
- Performance monitoring
- A/B testing widgets

---

## Resources

### Documentation
- `CURRENT_ARCHITECTURE.md` - Current state
- `COMPONENT_DEPENDENCY_MAP.md` - Dependencies
- `WIDGET_INTERFACE_SPEC.md` - Widget contract
- `MIGRATION_GUIDE.md` - Step-by-step guide

### External Resources
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

### Team Communication
- Weekly sync meetings
- Daily standups during migration
- Slack channel: #dashboard-refactor
- Code review required for all changes

