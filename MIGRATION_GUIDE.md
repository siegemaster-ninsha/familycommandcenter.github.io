# Migration Guide: From Monolith to Dashboard

## Introduction

This guide provides step-by-step instructions for migrating components from the current monolithic architecture to the new widget-based dashboard system using Pinia for state management.

**Target Audience**: Developers working on the refactoring
**Prerequisites**: Familiarity with Vue 3, Pinia, and the current codebase
**Estimated Time per Component**: 2-4 hours for simple components, 8-12 hours for complex pages

## Quick Reference

| Old Pattern | New Pattern |
|-------------|-------------|
| `this.$parent.method()` | `store.method()` or `emit('event')` |
| `this.$parent.data` | `store.data` via `useStore()` |
| Direct state mutation | `store.action()` |
| `inject: ['data']` | `const store = useStore()` in setup |
| Modal flags in root | `uiStore.openModal('name')` |
| `app.js` methods | Store actions |
| Component state | Widget local state |

## Before You Start

### 1. Read the Documentation
- [ ] Read `CURRENT_ARCHITECTURE.md`
- [ ] Read `COMPONENT_DEPENDENCY_MAP.md`
- [ ] Read `REFACTORING_ROADMAP.md`
- [ ] Read `WIDGET_INTERFACE_SPEC.md`

### 2. Set Up Your Environment
- [ ] Pinia installed and configured
- [ ] Store directory structure created
- [ ] Base API service implemented
- [ ] Widget base mixin available
- [ ] Vue devtools with Pinia extension installed

### 3. Identify Dependencies
For the component you're migrating:
- [ ] List all `$parent` method calls
- [ ] List all `inject` dependencies
- [ ] Identify which stores are needed
- [ ] Note any direct state mutations

## Step-by-Step Migration Process

### Part 1: Migrating a Store (Foundational)

#### Step 1.1: Create Store File

1. **Create the store file**:
```bash
touch frontEnd/stores/chores.js  # Or your store name
```

2. **Define the store structure**:
```javascript
// frontEnd/stores/chores.js
const useChoresStore = Pinia.defineStore('chores', {
  // State
  state: () => ({
    chores: [],
    quicklistChores: [],
    selectedChoreId: null,
    loading: false,
    error: null
  }),
  
  // Getters (computed properties)
  getters: {
    choresByPerson: (state) => {
      const grouped = { unassigned: [] };
      // Grouping logic
      return grouped;
    },
    
    unassignedChores: (state) => {
      return state.chores.filter(c => !c.assignedTo || c.assignedTo === 'unassigned');
    },
    
    selectedChore: (state) => {
      return state.chores.find(c => c.id === state.selectedChoreId);
    }
  },
  
  // Actions (methods)
  actions: {
    async loadChores() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get('/chores');
        this.chores = data.chores || [];
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async createChore(choreData) {
      const data = await apiService.post('/chores', choreData);
      this.chores.push(data.chore);
      return data.chore;
    },
    
    selectChore(chore) {
      this.selectedChoreId = chore?.id || null;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useChoresStore = useChoresStore;
}
```

#### Step 1.2: Add to HTML

```html
<!-- In index.html, after pinia and before app.js -->
<script src="stores/chores.js"></script>
```

#### Step 1.3: Create Parallel Bridge in app.js

During migration, keep old system working:

```javascript
// In app.js
setup() {
  // Initialize store
  const choresStore = useChoresStore();
  
  return {
    choresStore
  };
},

// Bridge computed properties
computed: {
  chores() {
    // Temporary: Return store data
    return this.choresStore?.chores || this._oldChores || [];
  },
  
  choresByPerson() {
    return this.choresStore?.choresByPerson || this._oldChoresByPerson || {};
  }
},

// Bridge methods
methods: {
  async loadChores() {
    // New way
    if (this.choresStore) {
      await this.choresStore.loadChores();
    }
    
    // Old way (keep for now)
    // ... existing code ...
  }
}
```

#### Step 1.4: Test the Store

```javascript
// In browser console
const store = useChoresStore();

// Test loading
await store.loadChores();
console.log(store.chores);

// Test actions
store.selectChore(store.chores[0]);
console.log(store.selectedChore);

// Check Pinia devtools
```

### Part 2: Migrating a Component to Use Stores

#### Step 2.1: Identify Current Dependencies

Example component: `family-members-section.js`

**Current code**:
```javascript
inject: [
  'choresByPerson',              // From app.js
  'people',                      // From app.js
  'Helpers'                      // Global
],

methods: {
  handleComplete(chore) {
    this.$parent.handleChoreCompletion(chore);  // ❌ $parent
  },
  
  selectChore(chore) {
    this.$parent.handleChoreClick(chore);       // ❌ $parent
  }
}
```

**Dependencies to remove**:
- ❌ `inject: ['choresByPerson', 'people']` → Use stores
- ❌ `this.$parent.handleChoreCompletion` → Use store action
- ❌ `this.$parent.handleChoreClick` → Use store action

#### Step 2.2: Add Store Access

```javascript
// family-members-section.js

// Add setup function
setup() {
  // Access stores
  const choresStore = useChoresStore();
  const familyStore = useFamilyStore();
  
  return {
    choresStore,
    familyStore
  };
},

// Update computed properties
computed: {
  choresByPerson() {
    return this.choresStore.choresByPerson;  // ✅ From store
  },
  
  people() {
    return this.familyStore.enabledMembers;   // ✅ From store
  }
},

// Update methods
methods: {
  async handleComplete(chore) {
    await this.choresStore.toggleComplete(chore.id);  // ✅ Store action
  },
  
  selectChore(chore) {
    this.choresStore.selectChore(chore);              // ✅ Store action
  }
}
```

#### Step 2.3: Remove Inject Dependencies

```javascript
// Old
inject: ['choresByPerson', 'people', 'Helpers'],

// New - only keep what can't be in a store
inject: ['Helpers'],  // Keep utilities
// Everything else comes from stores
```

#### Step 2.4: Test Component

1. **Load page and verify component works**
2. **Check console for errors**
3. **Verify data loads correctly**
4. **Test all interactions**
5. **Check Pinia devtools for state changes**

### Part 3: Converting Component to Widget

#### Step 3.1: Extract Component Logic

Take existing component and restructure:

**Before** (family-members-section.js):
```javascript
const FamilyMembersSection = Vue.defineComponent({
  inject: ['choresByPerson', 'people'],
  
  template: `...`,
  
  methods: {
    // Component logic
  }
});
```

**After** (family-member-widget.js):
```javascript
const FamilyMemberWidget = {
  name: 'FamilyMemberWidget',
  
  // Add widget mixin
  mixins: [WidgetBase],
  
  // Add metadata
  metadata: {
    id: 'family-member-chores',
    name: 'Family Member Chores',
    description: 'Shows chores for a specific family member',
    icon: 'user',
    category: 'chores',
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxSize: { w: 4, h: 4 },
    configurable: true,
    refreshable: true,
    refreshInterval: 0,
    permissions: [],
    requiresAuth: true,
    requiredStores: ['chores', 'family']
  },
  
  // Add settings schema
  settings: {
    schema: {
      memberId: {
        type: 'select',
        label: 'Family Member',
        required: true,
        options: 'people',
        optionLabel: 'name',
        optionValue: 'id'
      }
    }
  },
  
  // Add store access
  setup() {
    const choresStore = useChoresStore();
    const familyStore = useFamilyStore();
    
    return {
      choresStore,
      familyStore
    };
  },
  
  // Computed for widget-specific data
  computed: {
    member() {
      return this.familyStore.memberById(this.settings.memberId);
    },
    
    memberChores() {
      return this.choresStore.choresForPerson(this.member?.name);
    }
  },
  
  // Implement required lifecycle
  methods: {
    async onRefresh() {
      await Promise.all([
        this.choresStore.loadChores(),
        this.familyStore.loadMembers()
      ]);
    }
  },
  
  // Update template for widget structure
  template: `
    <div class="widget-container">
      <div class="widget-header">
        <h3>{{ member?.name || 'Select Member' }}</h3>
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
        
        <div v-else class="member-chores">
          <div v-for="chore in memberChores" :key="chore.id">
            <!-- Chore display -->
          </div>
        </div>
      </div>
    </div>
  `
};

// Register widget
widgetRegistry.register(
  FamilyMemberWidget.metadata,
  FamilyMemberWidget
);
```

#### Step 3.2: Add Widget Styling

```css
/* In widget file or styles.css */
.widget-container {
  /* Standard widget container */
}

.member-chores {
  /* Widget-specific styles */
}
```

#### Step 3.3: Register Widget

```javascript
// At end of widget file
if (typeof window.widgetRegistry !== 'undefined') {
  window.widgetRegistry.register(
    FamilyMemberWidget.metadata,
    FamilyMemberWidget
  );
} else {
  console.error('Widget registry not initialized');
}
```

#### Step 3.4: Test Widget Independently

Create a test page or use dashboard:

```html
<!-- test-widget.html -->
<div id="app">
  <component
    :is="widget"
    :config="{
      widgetId: 'family-member-chores',
      instanceId: 'test-1',
      settings: { memberId: 'person-1' }
    }"
  />
</div>

<script>
const app = Vue.createApp({
  data() {
    return {
      widget: window.widgetRegistry.get('family-member-chores').component
    };
  }
});

app.use(pinia);
app.mount('#app');
</script>
```

### Part 4: Removing Old Code

#### Step 4.1: Verify New System Works

Before removing old code:
- [ ] New widget/component fully functional
- [ ] All features work through stores
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Tested by team

#### Step 4.2: Remove Old Component

```javascript
// 1. Comment out old component file
// frontend/components/old-component.js
// (Entire file commented)

// 2. Remove from index.html
// <script src="components/old-component.js"></script>  ❌ Remove

// 3. Remove from app.js if used
// <old-component></old-component>  ❌ Remove
```

#### Step 4.3: Remove Old State from app.js

```javascript
// app.js

// Remove from data()
data() {
  return {
    // chores: [],  ❌ Remove - now in store
    // people: [],  ❌ Remove - now in store
  }
},

// Remove from methods
methods: {
  // async loadChores() { ... }  ❌ Remove - now in store
  // selectChore(chore) { ... }  ❌ Remove - now in store
},

// Remove from computed
computed: {
  // choresByPerson() { ... }  ❌ Remove - now in store getter
},

// Remove from provide
provide: {
  // chores: this.chores,  ❌ Remove
  // people: this.people,  ❌ Remove
}
```

#### Step 4.4: Clean Up Imports

```html
<!-- index.html -->

<!-- Remove unused component scripts -->
<!-- <script src="components/removed-component.js"></script> -->

<!-- Remove unused inject dependencies -->
```

## Common Migration Patterns

### Pattern 1: Simple Data Access

**Before**:
```javascript
inject: ['chores'],

template: `
  <div v-for="chore in chores" :key="chore.id">
    {{ chore.name }}
  </div>
`
```

**After**:
```javascript
setup() {
  const choresStore = useChoresStore();
  return { choresStore };
},

template: `
  <div v-for="chore in choresStore.chores" :key="chore.id">
    {{ chore.name }}
  </div>
`
```

### Pattern 2: Parent Method Calls

**Before**:
```javascript
methods: {
  handleClick(item) {
    this.$parent.processItem(item);
    this.$parent.showSuccessMessage('Done!');
  }
}
```

**After**:
```javascript
setup() {
  const itemStore = useItemStore();
  const uiStore = useUIStore();
  return { itemStore, uiStore };
},

methods: {
  async handleClick(item) {
    await this.itemStore.processItem(item);
    this.uiStore.showSuccess('Done!');
  }
}
```

### Pattern 3: Modal Management

**Before**:
```javascript
methods: {
  openSettings() {
    this.$parent.showSettingsModal = true;
  }
}
```

**After**:
```javascript
setup() {
  const uiStore = useUIStore();
  return { uiStore };
},

methods: {
  openSettings() {
    this.uiStore.openModal('settings');
  }
}
```

### Pattern 4: Direct State Mutation

**Before**:
```javascript
methods: {
  toggleComplete(chore) {
    chore.completed = !chore.completed;  // ❌ Direct mutation
    this.$parent.saveChore(chore);
  }
}
```

**After**:
```javascript
setup() {
  const choresStore = useChoresStore();
  return { choresStore };
},

methods: {
  async toggleComplete(chore) {
    await this.choresStore.toggleComplete(chore.id);  // ✅ Store action
  }
}
```

### Pattern 5: Computed Dependencies

**Before**:
```javascript
inject: ['people', 'chores'],

computed: {
  choresByPerson() {
    const grouped = {};
    this.people.forEach(p => {
      grouped[p.name] = this.chores.filter(c => c.assignedTo === p.name);
    });
    return grouped;
  }
}
```

**After**:
```javascript
setup() {
  const choresStore = useChoresStore();
  return { choresStore };
},

computed: {
  choresByPerson() {
    return this.choresStore.choresByPerson;  // ✅ Store getter
  }
}
```

## Troubleshooting

### Issue: Store is undefined

**Symptoms**:
```
TypeError: Cannot read property 'chores' of undefined
```

**Solutions**:
1. Check store is imported in HTML:
```html
<script src="stores/chores.js"></script>
```

2. Verify Pinia is initialized:
```javascript
// In app.js
app.use(pinia);
```

3. Check store is created in setup:
```javascript
setup() {
  const store = useChoresStore();
  return { store };
}
```

### Issue: Reactive data not updating

**Symptoms**:
- Store data changes but UI doesn't update

**Solutions**:
1. Make sure you're using store actions:
```javascript
// ❌ Wrong
store.chores.push(newChore);

// ✅ Right
await store.addChore(newChore);
```

2. Check computed properties are used:
```javascript
// ❌ Wrong - won't react
data() {
  return {
    chores: this.choresStore.chores  // Copy, not reactive
  };
}

// ✅ Right - reactive
computed: {
  chores() {
    return this.choresStore.chores;
  }
}
```

### Issue: $parent still referenced

**Symptoms**:
```
Warning: $parent accessed in widget
```

**Solutions**:
1. Find all `$parent` calls:
```bash
grep -r '\$parent' frontEnd/widgets/
```

2. Replace with store calls:
```javascript
// Before
this.$parent.loadData();

// After
await this.dataStore.loadData();
```

### Issue: Inject not working with stores

**Symptoms**:
```
Property 'chores' was accessed during render but is not defined
```

**Solutions**:
Don't use inject for store data. Use stores directly:

```javascript
// ❌ Don't do this
inject: ['chores'],

// ✅ Do this instead
setup() {
  const choresStore = useChoresStore();
  return { choresStore };
},

computed: {
  chores() {
    return this.choresStore.chores;
  }
}
```

### Issue: Performance degradation

**Symptoms**:
- App feels slower after migration

**Solutions**:
1. Check for unnecessary API calls:
```javascript
// Use Pinia devtools to monitor actions
```

2. Add computed property caching:
```javascript
computed: {
  expensiveData() {
    // Cached automatically
    return this.processLargeDataset();
  }
}
```

3. Lazy load widgets:
```javascript
// Only load widget when needed
const widget = Vue.defineAsyncComponent(() =>
  import('./widgets/heavy-widget.js')
);
```

## Testing Checklist

### Unit Testing Store

```javascript
import { setActivePinia, createPinia } from 'pinia';
import { useChoresStore } from '@/stores/chores';

describe('useChoresStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  it('loads chores', async () => {
    const store = useChoresStore();
    
    await store.loadChores();
    
    expect(store.chores.length).toBeGreaterThan(0);
    expect(store.loading).toBe(false);
  });
  
  it('selects chore', () => {
    const store = useChoresStore();
    store.chores = [{ id: '1', name: 'Test' }];
    
    store.selectChore(store.chores[0]);
    
    expect(store.selectedChoreId).toBe('1');
    expect(store.selectedChore.name).toBe('Test');
  });
});
```

### Integration Testing Component

```javascript
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import MyWidget from '@/widgets/my-widget';

describe('MyWidget', () => {
  let wrapper;
  let pinia;
  
  beforeEach(() => {
    pinia = createPinia();
    wrapper = mount(MyWidget, {
      global: {
        plugins: [pinia]
      },
      props: {
        config: {
          widgetId: 'my-widget',
          instanceId: 'test-1',
          settings: {}
        }
      }
    });
  });
  
  it('displays data from store', async () => {
    const store = useChoresStore(pinia);
    store.$patch({
      chores: [{ id: '1', name: 'Test Chore' }]
    });
    
    await wrapper.vm.$nextTick();
    
    expect(wrapper.text()).toContain('Test Chore');
  });
});
```

## Migration Tracking

Use this checklist to track migration progress:

### Stores
- [ ] useAuthStore - Created and tested
- [ ] useUIStore - Created and tested
- [ ] useChoresStore - Created and tested
- [ ] useShoppingStore - Created and tested
- [ ] useFamilyStore - Created and tested
- [ ] useDashboardStore - Created and tested

### Components Migrated
- [ ] family-members-section → family-member-widget
- [ ] quicklist-section → quicklist-widget
- [ ] unassigned-section → unassigned-chores-widget
- [ ] earnings-widget → earnings-summary-widget (update)
- [ ] shopping-page → shopping-list-widget + quick-items-widget
- [ ] family-page → family-grid-widget + spending-requests-widget
- [ ] account-page → Keep as settings page (not widget)

### Old Code Removed
- [ ] Old component files deleted
- [ ] app.js state cleaned up
- [ ] Unused inject dependencies removed
- [ ] Unused methods removed
- [ ] Documentation updated

## Best Practices

### DO ✅

1. **Migrate incrementally**
   - One store at a time
   - One component at a time
   - Keep both systems working during transition

2. **Test thoroughly**
   - Unit test stores
   - Integration test components
   - Manual testing in browser
   - Check Pinia devtools

3. **Document changes**
   - Update comments
   - Add JSDoc
   - Update README if needed

4. **Use store actions**
   - Never mutate store state directly
   - Always use actions for changes
   - Keep actions atomic

5. **Handle errors**
   - Try/catch in actions
   - Set error state
   - Show user-friendly messages

### DON'T ❌

1. **Don't access $parent**
   - Use stores instead
   - Emit events if needed

2. **Don't mutate state directly**
   - Use store actions
   - Let Pinia handle reactivity

3. **Don't mix patterns**
   - Don't use both inject and stores for same data
   - Choose one pattern and stick to it

4. **Don't skip testing**
   - Always test after migration
   - Use Pinia devtools
   - Check for console errors

5. **Don't rush**
   - Take time to do it right
   - Ask for help if stuck
   - Review with team

## Getting Help

### Resources
- **Documentation**: See other .md files in this directory
- **Pinia Docs**: https://pinia.vuejs.org/
- **Vue 3 Docs**: https://vuejs.org/
- **Team**: Ask in #dashboard-refactor channel

### Code Review
- All migrations require code review
- Use PR template for migrations
- Include before/after examples
- Show test results

### Questions?
Common questions and answers:

**Q: Do I need to migrate everything at once?**
A: No! Migrate incrementally. Both systems can coexist.

**Q: What if I break something?**
A: The old system is still there. You can rollback easily.

**Q: How do I test stores?**
A: Use Pinia devtools in Vue devtools, or write unit tests.

**Q: Can widgets communicate with each other?**
A: Yes, via events or shared store state.

**Q: What about performance?**
A: Pinia is very performant. Profile if concerned.

## Summary

Migration process summary:

1. **Create store** with state, getters, actions
2. **Add store access** to component via `setup()`
3. **Replace $parent calls** with store actions
4. **Remove inject dependencies** for data now in stores
5. **Convert to widget** by adding metadata and base mixin
6. **Test thoroughly** - unit tests and manual testing
7. **Remove old code** once new system proven stable

Remember: **Take your time and test thoroughly!** It's better to migrate slowly and correctly than quickly and break things.

Good luck! 🚀

