# Widgets Documentation

## Overview

This directory contains all dashboard widgets for the Family Command Center. Widgets are self-contained, reusable UI components that users can add to their dashboard.

## Directory Structure

```
widgets/
├── README.md                    # This file
├── base/
│   ├── WidgetBase.js           # Base widget mixin
│   ├── widget-types.js         # Widget type definitions
│   └── widget-registry.js      # Widget registration system
│
└── [Widget implementations will be added here in Phase 3]
    ├── family-member-chores.js
    ├── earnings-summary.js
    ├── quicklist.js
    ├── shopping-list.js
    └── ... more widgets
```

## Creating a New Widget

### 1. Define Widget Metadata

Every widget needs metadata that describes it:

```javascript
const MyWidgetMetadata = {
  id: 'my-widget',                    // Unique ID (kebab-case)
  name: 'My Widget',                  // Display name
  description: 'What this widget does',
  icon: 'iconName',                   // Lucide icon
  category: 'chores',                 // Widget category
  defaultSize: { w: 2, h: 2 },       // Default grid size
  minSize: { w: 1, h: 1 },           // Minimum size
  maxSize: { w: 4, h: 4 },           // Maximum size
  configurable: true,                 // Has settings?
  refreshable: true,                  // Can refresh?
  refreshInterval: 30000,             // Auto-refresh (30s)
  permissions: [],                    // Access control
  requiresAuth: true,                 // Requires login?
  requiredStores: ['chores']          // Required stores
};
```

### 2. Create Widget Component

```javascript
const MyWidget = {
  name: 'MyWidget',
  
  // Include base mixin
  mixins: [WidgetBase],
  
  // Add metadata
  metadata: MyWidgetMetadata,
  
  // Add settings schema if configurable
  settings: {
    schema: {
      setting1: {
        type: 'text',
        label: 'Setting Label',
        required: true,
        default: ''
      }
    }
  },
  
  // Access stores in setup
  setup() {
    const choresStore = useChoresStore();
    return { choresStore };
  },
  
  // Computed properties
  computed: {
    data() {
      return this.choresStore.chores;
    }
  },
  
  // Required: Implement onRefresh
  methods: {
    async onRefresh() {
      await this.choresStore.loadChores();
    }
  },
  
  // Widget template
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <h3>{{ metadata.name }}</h3>
        <div class="widget-actions">
          <button v-if="editable" @click="configure">⚙️</button>
        </div>
      </div>
      
      <div class="widget-body">
        <div v-if="loading" class="widget-loading">
          Loading...
        </div>
        
        <div v-else-if="error" class="widget-error">
          {{ error }}
        </div>
        
        <div v-else class="widget-content">
          <!-- Your widget content here -->
        </div>
      </div>
    </div>
  `
};

// Register widget
widgetRegistry.register(MyWidgetMetadata, MyWidget);
```

### 3. Add to index.html

```html
<script src="widgets/my-widget.js"></script>
```

## Widget Base Mixin

All widgets extend `WidgetBase` which provides:

### Props
- `config` - Widget instance configuration
- `editable` - Is dashboard in edit mode?

### Data
- `loading` - Is widget loading?
- `error` - Error message if any
- `lastRefresh` - Last refresh timestamp

### Computed
- `widgetId` - Widget type ID
- `instanceId` - Unique instance ID
- `settings` - User settings
- `position` - Grid position
- `size` - Current size
- `isCompact` - Is widget small?
- `isTall` - Is widget tall?

### Methods
- `refresh()` - Refresh widget data
- `configure()` - Open settings
- `remove()` - Remove widget
- `notify(message, type)` - Show notification

### Lifecycle Hooks (Override in Your Widget)
- `onRefresh()` - **Required** - Load widget data
- `onConfigure(settings)` - Optional - Settings changed
- `onResize(size)` - Optional - Widget resized
- `onMount()` - Optional - Widget mounted
- `onUnmount()` - Optional - Widget unmounting

## Widget Categories

Available categories:

- **chores**: Chore management and tracking
- **shopping**: Shopping lists and items
- **family**: Family members and settings
- **info**: Informational widgets
- **other**: Miscellaneous widgets

## Widget Settings

If your widget is configurable, define a settings schema:

```javascript
settings: {
  schema: {
    // Text input
    customTitle: {
      type: 'text',
      label: 'Custom Title',
      description: 'Override default title',
      required: false,
      default: '',
      maxLength: 50
    },
    
    // Number input
    maxItems: {
      type: 'number',
      label: 'Maximum Items',
      required: false,
      default: 10,
      min: 1,
      max: 50
    },
    
    // Boolean toggle
    showCompleted: {
      type: 'boolean',
      label: 'Show Completed',
      required: false,
      default: true
    },
    
    // Select dropdown
    memberId: {
      type: 'select',
      label: 'Family Member',
      required: true,
      options: 'people',        // Reference to store getter
      optionLabel: 'name',      // Display property
      optionValue: 'id'         // Value property
    },
    
    // Multi-select
    categories: {
      type: 'multiselect',
      label: 'Categories',
      required: false,
      default: ['regular'],
      options: [
        { label: 'Regular', value: 'regular' },
        { label: 'School', value: 'school' }
      ]
    },
    
    // Color picker
    accentColor: {
      type: 'color',
      label: 'Accent Color',
      required: false,
      default: '#4A90E2'
    }
  },
  
  // Optional validation
  validate(settings) {
    if (settings.maxItems < 1) {
      return 'Max items must be at least 1';
    }
    return true;
  }
}
```

## Widget Styling

Widgets should use standard CSS classes:

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

/* Edit mode */
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
  justify-center;
  height: 100%;
}

/* Error state */
.widget-error {
  display: flex;
  align-items: center;
  justify-center;
  height: 100%;
  color: var(--color-error-600);
  padding: 1rem;
  text-align: center;
}
```

## Responsive Design

Widgets adapt to their size:

```javascript
computed: {
  isCompact() {
    return this.size.w < 2;  // Less than 2 grid units wide
  },
  
  isTall() {
    return this.size.h >= 3;  // 3 or more grid units tall
  }
},

template: `
  <div :class="{ 'compact': isCompact, 'tall': isTall }">
    <!-- Adapt layout based on size -->
  </div>
`
```

## Data Access

### DO ✅

```javascript
// Use stores for data
setup() {
  const choresStore = useChoresStore();
  return { choresStore };
},

methods: {
  async onRefresh() {
    await this.choresStore.loadChores();
  },
  
  handleClick(item) {
    await this.choresStore.updateItem(item);
  }
}
```

### DON'T ❌

```javascript
// Don't access $parent
this.$parent.loadChores();  // ❌

// Don't mutate store state directly
this.choresStore.chores.push(item);  // ❌

// Don't make API calls directly
await fetch('/api/chores');  // ❌
```

## Widget Events

Widgets can emit events:

```javascript
methods: {
  handleClick(item) {
    // Emit event for dashboard to handle
    this.$emit('notification', {
      message: 'Item clicked',
      type: 'info'
    });
  }
}
```

Standard events from WidgetBase:
- `refreshed` - After data refresh
- `error` - When error occurs
- `configure` - User wants settings
- `remove` - User wants to remove
- `resize` - Size changed
- `notification` - Show toast
- `data-changed` - Data updated

## Testing Widgets

```javascript
// Test widget in isolation
const config = {
  widgetId: 'my-widget',
  instanceId: 'test-1',
  position: { x: 0, y: 0 },
  size: { w: 2, h: 2 },
  settings: {
    setting1: 'value'
  },
  enabled: true
};

// Mount widget
const wrapper = mount(MyWidget, {
  props: { config },
  global: {
    plugins: [pinia]
  }
});

// Test functionality
await wrapper.vm.refresh();
expect(wrapper.vm.error).toBeNull();
```

## Widget Registry

Check available widgets:

```javascript
// Get all widgets
const widgets = widgetRegistry.getAll();

// Get by category
const choreWidgets = widgetRegistry.getByCategory('chores');

// Get by ID
const widget = widgetRegistry.get('my-widget');

// Check if user can access
const canAccess = widgetRegistry.canUserAccess('my-widget', 'parent');

// Debug info
console.log(widgetRegistry.getDebugInfo());
```

## Best Practices

1. **Keep widgets focused** - One responsibility per widget
2. **Handle errors gracefully** - Show user-friendly messages
3. **Loading states** - Always show loading indicators
4. **Responsive** - Adapt to different sizes
5. **Accessible** - ARIA labels, keyboard navigation
6. **Performance** - Lazy load data, memoize computations
7. **Testing** - Write tests for widget logic

## Example Widgets

See `WIDGET_INTERFACE_SPEC.md` for complete examples of:
- Simple display widget
- Interactive widget
- Configurable widget

## Resources

- [Widget Interface Spec](../WIDGET_INTERFACE_SPEC.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [Refactoring Roadmap](../REFACTORING_ROADMAP.md)

