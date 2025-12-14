# Widget Interface Specification

## Overview

This document defines the technical contract for dashboard widgets in the Family Command Center. All widgets must adhere to this specification to ensure consistency, interoperability, and a smooth user experience.

## Widget Definition

A **widget** is a self-contained, reusable UI component that:
- Displays specific information or functionality
- Can be added/removed from the dashboard by users
- Manages its own UI state
- Communicates with stores for data
- Emits events for inter-widget communication
- Can be configured by users

## Widget Anatomy

### 1. Metadata Object

Every widget must export a metadata object describing itself:

```javascript
const WidgetMetadata = {
  // Identification
  id: 'unique-widget-id',           // Required: kebab-case, globally unique
  name: 'Widget Display Name',      // Required: Human-readable name
  description: 'Short description', // Required: 1-2 sentences
  version: '1.0.0',                 // Required: Semantic versioning
  author: 'Developer Name',         // Optional: Widget creator
  
  // Visual
  icon: 'iconName',                 // Required: Lucide icon name
  category: 'chores',               // Required: chores|shopping|family|info|other
  preview: '/path/to/preview.png',  // Optional: Screenshot URL
  
  // Layout
  defaultSize: {                    // Required: Default grid size
    w: 2,                           // Width in grid units (1-12)
    h: 2                            // Height in grid units (1-12)
  },
  minSize: {                        // Required: Minimum size
    w: 1,
    h: 1
  },
  maxSize: {                        // Required: Maximum size
    w: 6,
    h: 6
  },
  aspectRatio: null,                // Optional: 'square'|'16:9'|null
  
  // Behavior
  configurable: true,               // Required: Has settings?
  refreshable: true,                // Required: Can be manually refreshed?
  refreshInterval: 0,               // Required: Auto-refresh interval (ms, 0 = manual only)
  
  // Access Control
  permissions: ['parent', 'child'], // Required: Who can use it? Empty = all
  
  // Dependencies
  requiresAuth: true,               // Required: Requires authentication?
  requiredStores: ['chores'],       // Required: Which stores must be available?
  
  // Features
  features: {
    exportData: false,              // Can export data?
    print: false,                   // Can be printed?
    fullscreen: false,              // Supports fullscreen?
    notifications: false            // Can send notifications?
  }
};
```

### 2. Component Definition

Widgets are Vue 3 components that extend the `WidgetBase` mixin:

```javascript
const MyWidget = Vue.defineComponent({
  name: 'MyWidget',
  
  // Required: Extend base widget
  mixins: [WidgetBase],
  
  // Required: Metadata
  metadata: WidgetMetadata,
  
  // Props are provided by WidgetBase
  // props: {
  //   config: Object,    // Widget instance configuration
  //   editable: Boolean  // Is dashboard in edit mode?
  // }
  
  // Component-specific setup
  setup(props) {
    // Access stores
    const choresStore = useChoresStore();
    const uiStore = useUIStore();
    
    // Widget-specific reactive state
    const localData = ref([]);
    
    return {
      choresStore,
      uiStore,
      localData
    };
  },
  
  // Component-specific computed properties
  computed: {
    filteredData() {
      // Widget logic
    }
  },
  
  // Required: Implement lifecycle hooks
  methods: {
    // Called when widget needs to refresh its data
    async onRefresh() {
      const store = useChoresStore();
      await store.loadChores();
      // Transform data as needed
      this.localData = this.transformData(store.chores);
    },
    
    // Called when user opens widget settings
    onConfigure(settings) {
      // Handle configuration changes
      // Settings are already saved, just update display
    },
    
    // Optional: Custom methods
    transformData(data) {
      // Widget-specific transformations
    }
  },
  
  // Required: Template
  template: `
    <div class="widget-container" :class="{ 'widget-editable': editable }">
      <!-- Widget header (optional) -->
      <div class="widget-header">
        <h3>{{ metadata.name }}</h3>
        <div class="widget-actions">
          <button v-if="refreshable" @click="refresh">
            <i-refresh />
          </button>
          <button v-if="editable" @click="configure">
            <i-settings />
          </button>
          <button v-if="editable" @click="remove">
            <i-x />
          </button>
        </div>
      </div>
      
      <!-- Widget body -->
      <div class="widget-body">
        <!-- Loading state -->
        <div v-if="loading" class="widget-loading">
          <i-loader class="animate-spin" />
        </div>
        
        <!-- Error state -->
        <div v-else-if="error" class="widget-error">
          {{ error }}
        </div>
        
        <!-- Content -->
        <div v-else class="widget-content">
          <!-- Your widget content here -->
        </div>
      </div>
      
      <!-- Widget footer (optional) -->
      <div v-if="lastRefresh" class="widget-footer">
        Last updated: {{ formatTime(lastRefresh) }}
      </div>
    </div>
  `
});
```

### 3. Configuration Schema

If `configurable: true`, define a settings schema:

```javascript
const WidgetSettings = {
  // Define all configurable options
  schema: {
    // Example: Select family member
    memberId: {
      type: 'select',
      label: 'Family Member',
      description: 'Which family member to display',
      required: true,
      default: null,
      options: 'people',        // Reference to store getter
      optionLabel: 'name',      // Property to display
      optionValue: 'id'         // Property for value
    },
    
    // Example: Boolean toggle
    showCompleted: {
      type: 'boolean',
      label: 'Show Completed Chores',
      description: 'Include completed chores in the list',
      required: false,
      default: true
    },
    
    // Example: Number input
    maxItems: {
      type: 'number',
      label: 'Maximum Items',
      description: 'How many items to display',
      required: false,
      default: 10,
      min: 1,
      max: 50
    },
    
    // Example: Text input
    customTitle: {
      type: 'text',
      label: 'Custom Title',
      description: 'Override widget title',
      required: false,
      default: '',
      maxLength: 50
    },
    
    // Example: Multi-select
    categories: {
      type: 'multiselect',
      label: 'Categories',
      description: 'Which categories to display',
      required: false,
      default: ['regular', 'school', 'game'],
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'School', value: 'school' },
        { label: 'Electronics', value: 'game' }
      ]
    },
    
    // Example: Color picker
    accentColor: {
      type: 'color',
      label: 'Accent Color',
      description: 'Custom accent color',
      required: false,
      default: '#4A90E2'
    }
  },
  
  // Optional: Validation function
  validate(settings) {
    // Return true if valid, or error message if invalid
    if (settings.maxItems < 1) {
      return 'Maximum items must be at least 1';
    }
    return true;
  },
  
  // Optional: Transform settings before save
  transform(settings) {
    // Modify settings if needed
    return {
      ...settings,
      _transformed: true
    };
  }
};
```

### 4. Registration

Register the widget with the global registry:

```javascript
// At the end of widget file
if (typeof window.widgetRegistry !== 'undefined') {
  window.widgetRegistry.register(WidgetMetadata, MyWidget);
} else {
  console.error('Widget registry not available');
}
```

## Widget Base Mixin

The `WidgetBase` mixin provides common functionality to all widgets:

### Props Provided

```javascript
props: {
  // Widget instance configuration
  config: {
    type: Object,
    required: true,
    default: () => ({
      widgetId: '',      // Widget type ID
      instanceId: '',    // Unique instance ID
      position: { x: 0, y: 0 },
      size: { w: 2, h: 2 },
      settings: {},      // User settings
      enabled: true
    })
  },
  
  // Is dashboard in edit mode?
  editable: {
    type: Boolean,
    default: false
  }
}
```

### Data Provided

```javascript
data() {
  return {
    loading: false,       // Is widget loading?
    error: null,          // Error message if any
    lastRefresh: null     // Timestamp of last refresh
  }
}
```

### Computed Properties

```javascript
computed: {
  widgetId() {
    return this.config.widgetId;
  },
  
  instanceId() {
    return this.config.instanceId;
  },
  
  settings() {
    return this.config.settings || {};
  },
  
  position() {
    return this.config.position;
  },
  
  size() {
    return this.config.size;
  }
}
```

### Methods Provided

```javascript
methods: {
  // Refresh widget data
  async refresh() {
    this.loading = true;
    this.error = null;
    try {
      await this.onRefresh();
      this.lastRefresh = new Date();
      this.$emit('refreshed');
    } catch (err) {
      this.error = err.message;
      this.$emit('error', err);
    } finally {
      this.loading = false;
    }
  },
  
  // Open widget configuration
  configure() {
    this.$emit('configure', {
      instanceId: this.instanceId,
      currentSettings: this.settings,
      schema: this.metadata.settings?.schema
    });
  },
  
  // Remove widget from dashboard
  remove() {
    this.$emit('remove', this.instanceId);
  },
  
  // Handle resize
  handleResize(newSize) {
    this.$emit('resize', {
      instanceId: this.instanceId,
      size: newSize
    });
    
    if (typeof this.onResize === 'function') {
      this.onResize(newSize);
    }
  },
  
  // Override these in your widget
  async onRefresh() {
    throw new Error('onRefresh not implemented');
  },
  
  onConfigure(settings) {
    // Optional override
  },
  
  onResize(size) {
    // Optional override
  }
}
```

### Events Emitted

```javascript
emits: [
  'refreshed',    // After successful refresh
  'error',        // When error occurs
  'configure',    // When user clicks settings
  'remove',       // When user removes widget
  'resize',       // When widget is resized
  'notification'  // When widget wants to notify user
]
```

### Lifecycle Hooks

```javascript
mounted() {
  // Set up auto-refresh if configured
  if (this.metadata.refreshInterval > 0) {
    this._refreshTimer = setInterval(
      () => this.refresh(),
      this.metadata.refreshInterval
    );
  }
  
  // Initial data load
  this.refresh();
},

beforeUnmount() {
  // Clean up timers
  if (this._refreshTimer) {
    clearInterval(this._refreshTimer);
  }
}
```

## Widget Styling

### CSS Classes

Widgets should use these standard classes:

```css
/* Widget container */
.widget-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-card);
  border-radius: 0.5rem;
  overflow: hidden;
}

/* Edit mode styling */
.widget-container.widget-editable {
  cursor: move;
  border: 2px dashed var(--color-primary-500);
}

/* Widget header */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border-card);
}

.widget-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.widget-actions {
  display: flex;
  gap: 0.5rem;
}

/* Widget body */
.widget-body {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

/* Loading state */
.widget-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

/* Error state */
.widget-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-error-600);
  padding: 1rem;
  text-align: center;
}

/* Widget footer */
.widget-footer {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-border-card);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: right;
}
```

### Responsive Sizing

Widgets should adapt to their grid size:

```javascript
computed: {
  isCompact() {
    // Small widgets (< 2 width units) are compact
    return this.size.w < 2;
  },
  
  isTall() {
    // Tall widgets (>= 3 height units)
    return this.size.h >= 3;
  }
},

template: `
  <div class="widget-content" :class="{
    'compact': isCompact,
    'tall': isTall
  }">
    <!-- Adapt layout based on size -->
  </div>
`
```

### Size-Specific Styling

```css
/* Compact mode (1 column width) */
.widget-content.compact .details {
  display: none;
}

.widget-content.compact .icon {
  font-size: 1rem;
}

/* Standard mode (2+ columns) */
.widget-content .details {
  display: block;
}

.widget-content .icon {
  font-size: 1.5rem;
}

/* Tall mode (3+ rows) */
.widget-content.tall {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
```

## Data Access Patterns

### Accessing Stores

Widgets should ONLY access data through Pinia stores:

```javascript
setup() {
  // Import stores
  const choresStore = useChoresStore();
  const familyStore = useFamilyStore();
  const authStore = useAuthStore();
  
  return {
    choresStore,
    familyStore,
    authStore
  };
},

computed: {
  chores() {
    // Read from store
    return this.choresStore.chores;
  },
  
  filteredChores() {
    // Use store getters
    return this.choresStore.choresForPerson(this.settings.memberId);
  }
},

methods: {
  async onRefresh() {
    // Call store actions
    await this.choresStore.loadChores();
  },
  
  async markComplete(choreId) {
    // Dispatch to store
    await this.choresStore.toggleComplete(choreId);
  }
}
```

### NO Direct Parent Access

```javascript
// ❌ WRONG
this.$parent.loadChores();
this.$parent.showSuccessMessage('Done!');

// ✅ CORRECT
const store = useChoresStore();
await store.loadChores();

const uiStore = useUIStore();
uiStore.showSuccess('Done!');
```

### NO Direct State Mutations

```javascript
// ❌ WRONG
this.chores[0].completed = true;

// ✅ CORRECT
await this.choresStore.toggleComplete(choreId);
```

## Event Communication

Widgets communicate via events, not direct calls:

### Emitting Events

```javascript
methods: {
  handleItemClick(item) {
    // Emit event for other widgets to listen to
    this.$emit('item-selected', {
      widgetId: this.widgetId,
      instanceId: this.instanceId,
      item: item
    });
  },
  
  notifyUser(message) {
    // Request notification
    this.$emit('notification', {
      message,
      type: 'success'
    });
  }
}
```

### Listening to Events

```javascript
mounted() {
  // Listen to events from other widgets
  this.$root.$on('item-selected', this.handleExternalSelection);
},

beforeUnmount() {
  // Clean up listeners
  this.$root.$off('item-selected', this.handleExternalSelection);
},

methods: {
  handleExternalSelection(event) {
    if (event.widgetId !== this.widgetId) {
      // React to event from another widget
      this.highlightItem(event.item);
    }
  }
}
```

## Error Handling

Widgets must handle errors gracefully:

```javascript
methods: {
  async onRefresh() {
    try {
      await this.choresStore.loadChores();
    } catch (error) {
      // Set error state
      this.error = this.getUserFriendlyError(error);
      
      // Emit error event
      this.$emit('error', {
        widget: this.metadata.name,
        error: error.message
      });
      
      // Don't throw - let widget display error state
    }
  },
  
  getUserFriendlyError(error) {
    if (error.message === 'AUTH_REQUIRED') {
      return 'Please log in to view this widget';
    }
    
    if (error.message === 'NETWORK_ERROR') {
      return 'Unable to load data. Check your connection.';
    }
    
    return 'Something went wrong. Please try again.';
  }
}
```

## Performance Guidelines

### Lazy Loading

Widgets should load data only when needed:

```javascript
mounted() {
  // Don't load data on mount if widget is not visible
  if (this.isVisible()) {
    this.refresh();
  }
},

watch: {
  // Refresh when widget becomes visible
  'config.enabled'(enabled) {
    if (enabled && !this.lastRefresh) {
      this.refresh();
    }
  }
}
```

### Debouncing

Debounce expensive operations:

```javascript
methods: {
  async onConfigure(settings) {
    // Debounce refresh on settings change
    clearTimeout(this._configDebounce);
    this._configDebounce = setTimeout(() => {
      this.refresh();
    }, 300);
  }
}
```

### Memoization

Cache expensive computations:

```javascript
computed: {
  expensiveData() {
    // Computed properties are automatically cached
    return this.processData(this.chores);
  }
}
```

## Accessibility Requirements

All widgets must be accessible:

### ARIA Labels

```html
<div 
  class="widget-container"
  role="region"
  :aria-label="metadata.name"
  :aria-describedby="`${instanceId}-desc`"
>
  <div class="widget-header">
    <h3 :id="`${instanceId}-title`">{{ metadata.name }}</h3>
  </div>
  
  <div class="widget-body">
    <p :id="`${instanceId}-desc`" class="sr-only">
      {{ metadata.description }}
    </p>
    <!-- Content -->
  </div>
</div>
```

### Keyboard Navigation

```html
<!-- Focusable actions -->
<button 
  @click="refresh"
  @keydown.enter="refresh"
  aria-label="Refresh widget"
>
  <i-refresh />
</button>

<!-- Tab order -->
<div tabindex="0" @keydown="handleKeyNav">
  <!-- Interactive content -->
</div>
```

### Screen Reader Support

```html
<!-- Loading announcements -->
<div 
  role="status"
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  {{ loading ? 'Loading...' : 'Content loaded' }}
</div>

<!-- Error announcements -->
<div 
  v-if="error"
  role="alert"
  aria-live="assertive"
>
  {{ error }}
</div>
```

## Example Widgets

### Example 1: Simple Display Widget

```javascript
// family-member-earnings.js
const FamilyMemberEarningsWidget = {
  name: 'FamilyMemberEarnings',
  mixins: [WidgetBase],
  
  metadata: {
    id: 'family-member-earnings',
    name: 'Member Earnings',
    description: 'Display earnings for a family member',
    icon: 'dollarSign',
    category: 'family',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 3 },
    configurable: true,
    refreshable: true,
    refreshInterval: 30000, // 30 seconds
    permissions: [],
    requiresAuth: true,
    requiredStores: ['family']
  },
  
  settings: {
    schema: {
      memberId: {
        type: 'select',
        label: 'Family Member',
        required: true,
        options: 'people',
        optionLabel: 'name',
        optionValue: 'id'
      },
      showGoal: {
        type: 'boolean',
        label: 'Show Earnings Goal',
        default: true
      }
    }
  },
  
  setup() {
    const familyStore = useFamilyStore();
    return { familyStore };
  },
  
  computed: {
    member() {
      return this.familyStore.memberById(this.settings.memberId);
    },
    
    earnings() {
      return this.member?.earnings || 0;
    }
  },
  
  methods: {
    async onRefresh() {
      await this.familyStore.loadMembers();
    }
  },
  
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <h3>{{ member?.name || 'Select Member' }}</h3>
        <div class="widget-actions">
          <button v-if="editable" @click="configure">
            ⚙️
          </button>
        </div>
      </div>
      
      <div class="widget-body">
        <div v-if="loading" class="widget-loading">
          Loading...
        </div>
        
        <div v-else-if="error" class="widget-error">
          {{ error }}
        </div>
        
        <div v-else-if="!member" class="widget-empty">
          Please select a family member in settings
        </div>
        
        <div v-else class="earnings-display">
          <div class="earnings-amount">
            ${{ earnings.toFixed(2) }}
          </div>
          
          <div v-if="settings.showGoal && member.goal" class="earnings-goal">
            Goal: ${{ member.goal.toFixed(2) }}
          </div>
        </div>
      </div>
    </div>
  `
};

widgetRegistry.register(
  FamilyMemberEarningsWidget.metadata,
  FamilyMemberEarningsWidget
);
```

### Example 2: Interactive Widget

```javascript
// quick-chore-assign.js
const QuickChoreAssignWidget = {
  name: 'QuickChoreAssign',
  mixins: [WidgetBase],
  
  metadata: {
    id: 'quick-chore-assign',
    name: 'Quick Assign',
    description: 'Quickly assign chores to family members',
    icon: 'zap',
    category: 'chores',
    defaultSize: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 6, h: 4 },
    configurable: false,
    refreshable: true,
    refreshInterval: 0,
    permissions: ['parent'],
    requiresAuth: true,
    requiredStores: ['chores', 'family']
  },
  
  setup() {
    const choresStore = useChoresStore();
    const familyStore = useFamilyStore();
    const uiStore = useUIStore();
    
    return {
      choresStore,
      familyStore,
      uiStore
    };
  },
  
  computed: {
    unassignedChores() {
      return this.choresStore.unassignedChores;
    },
    
    members() {
      return this.familyStore.enabledMembers;
    }
  },
  
  methods: {
    async onRefresh() {
      await Promise.all([
        this.choresStore.loadChores(),
        this.familyStore.loadMembers()
      ]);
    },
    
    async assignChore(chore, member) {
      try {
        await this.choresStore.assignChore(chore.id, member.name);
        this.uiStore.showSuccess(`Assigned ${chore.name} to ${member.name}`);
      } catch (error) {
        this.uiStore.showError('Failed to assign chore');
      }
    }
  },
  
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <h3>Quick Assign Chores</h3>
      </div>
      
      <div class="widget-body">
        <div v-if="loading" class="widget-loading">
          Loading...
        </div>
        
        <div v-else class="quick-assign-grid">
          <div class="chores-column">
            <h4>Unassigned</h4>
            <div 
              v-for="chore in unassignedChores"
              :key="chore.id"
              class="chore-item"
              draggable="true"
              @dragstart="dragStart($event, chore)"
            >
              {{ chore.name }}
            </div>
          </div>
          
          <div class="members-column">
            <div 
              v-for="member in members"
              :key="member.id"
              class="member-dropzone"
              @dragover.prevent
              @drop="handleDrop($event, member)"
            >
              <div class="member-name">{{ member.name }}</div>
              <div class="drop-hint">Drop chore here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

widgetRegistry.register(
  QuickChoreAssignWidget.metadata,
  QuickChoreAssignWidget
);
```

## Testing Widgets

### Unit Testing

```javascript
// Example widget test
describe('FamilyMemberEarningsWidget', () => {
  let widget;
  let familyStore;
  
  beforeEach(() => {
    // Set up test environment
    const pinia = createPinia();
    familyStore = useFamilyStore(pinia);
    
    widget = mount(FamilyMemberEarningsWidget, {
      global: {
        plugins: [pinia]
      },
      props: {
        config: {
          widgetId: 'family-member-earnings',
          instanceId: 'test-1',
          settings: {
            memberId: 'member-1'
          }
        }
      }
    });
  });
  
  it('should display member earnings', async () => {
    // Mock store data
    familyStore.$patch({
      members: [
        { id: 'member-1', name: 'John', earnings: 25.50 }
      ]
    });
    
    await widget.vm.$nextTick();
    
    expect(widget.text()).toContain('John');
    expect(widget.text()).toContain('$25.50');
  });
  
  it('should refresh on mount', () => {
    expect(familyStore.loadMembers).toHaveBeenCalled();
  });
  
  it('should emit error on load failure', async () => {
    familyStore.loadMembers.mockRejectedValue(new Error('API Error'));
    
    await widget.vm.refresh();
    
    expect(widget.emitted('error')).toBeTruthy();
  });
});
```

### Integration Testing

```javascript
describe('Widget in Dashboard', () => {
  it('should add widget to dashboard', async () => {
    const dashboard = mount(DashboardPage);
    const store = useDashboardStore();
    
    await store.addWidget('family-member-earnings', {
      memberId: 'member-1'
    });
    
    await dashboard.vm.$nextTick();
    
    expect(dashboard.findComponent(FamilyMemberEarningsWidget).exists()).toBe(true);
  });
});
```

## Widget Publishing Checklist

Before publishing a widget:

- [ ] Metadata complete and accurate
- [ ] Implements all required lifecycle hooks
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Responsive to different sizes
- [ ] Accessible (ARIA labels, keyboard nav)
- [ ] No `$parent` access
- [ ] Uses stores for all data
- [ ] Documentation written
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code reviewed
- [ ] Visual design reviewed
- [ ] Performance tested
- [ ] Mobile tested

## Future Enhancements

### Widget Communication Protocol
- Standardized event names
- Event bus for widget-to-widget communication
- Shared state between related widgets

### Widget Marketplace
- Third-party widget support
- Widget version management
- Automatic updates
- Rating and reviews

### Advanced Features
- Widget animations
- Widget templates
- Widget bundles
- Widget presets

