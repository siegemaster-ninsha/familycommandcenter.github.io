# Pinia Stores Documentation

## Overview

This directory contains all Pinia stores for the Family Command Center application. Each store manages a specific domain of application state.

## Store Structure

```
stores/
├── README.md          # This file
├── auth.js            # Authentication state
├── chores.js          # Chores and quicklist
├── shopping.js        # Shopping lists and items
├── family.js          # Family members and settings
├── ui.js              # UI state (modals, toasts, loading)
└── dashboard.js       # Dashboard configuration
```

## Store Template

Every store should follow this structure:

```javascript
const useXStore = Pinia.defineStore('storeName', {
  // State: Reactive data
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  // Getters: Computed properties
  getters: {
    itemCount: (state) => state.items.length,
    
    itemById: (state) => {
      return (id) => state.items.find(item => item.id === id);
    }
  },
  
  // Actions: Methods that can mutate state
  actions: {
    async loadItems() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get('/items');
        this.items = data.items || [];
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    addItem(item) {
      this.items.push(item);
    },
    
    removeItem(id) {
      const index = this.items.findIndex(item => item.id === id);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useXStore = useXStore;
}
```

## Using Stores in Components

### In Vue Components (Options API)

```javascript
const MyComponent = Vue.defineComponent({
  setup() {
    // Access store in setup
    const xStore = useXStore();
    
    return {
      xStore
    };
  },
  
  computed: {
    items() {
      return this.xStore.items;
    },
    
    itemCount() {
      return this.xStore.itemCount;
    }
  },
  
  methods: {
    async loadData() {
      await this.xStore.loadItems();
    }
  }
});
```

### In app.js (Root Component)

```javascript
const app = Vue.createApp({
  setup() {
    // Initialize stores
    const authStore = useAuthStore();
    const choresStore = useChoresStore();
    
    return {
      authStore,
      choresStore
    };
  },
  
  // ... rest of component
});

// Important: Use Pinia before mounting
app.use(pinia);
app.mount('#app');
```

## Best Practices

### DO ✅

1. **Use actions for all state mutations**
   ```javascript
   // In component
   await this.xStore.addItem(newItem);
   ```

2. **Keep stores focused on their domain**
   - Auth store only handles authentication
   - Chores store only handles chores
   - Don't mix concerns

3. **Handle errors in actions**
   ```javascript
   actions: {
     async loadItems() {
       try {
         // API call
       } catch (error) {
         this.error = error.message;
         throw error; // Re-throw for component handling
       }
     }
   }
   ```

4. **Use getters for computed data**
   ```javascript
   getters: {
     completedItems: (state) => state.items.filter(i => i.completed)
   }
   ```

5. **Export stores on window object**
   ```javascript
   if (typeof window !== 'undefined') {
     window.useXStore = useXStore;
   }
   ```

### DON'T ❌

1. **Don't mutate state directly**
   ```javascript
   // ❌ Wrong
   store.items.push(newItem);
   
   // ✅ Right
   store.addItem(newItem);
   ```

2. **Don't access other stores' state directly**
   ```javascript
   // ❌ Wrong
   const authStore = useAuthStore();
   const user = authStore.$state.user;
   
   // ✅ Right
   const authStore = useAuthStore();
   const user = authStore.user;
   ```

3. **Don't make API calls in components**
   ```javascript
   // ❌ Wrong - in component
   const data = await fetch('/api/items');
   
   // ✅ Right - in store action
   await store.loadItems();
   ```

4. **Don't put UI state in domain stores**
   ```javascript
   // ❌ Wrong - in choresStore
   state: () => ({
     chores: [],
     showModal: false  // UI state doesn't belong here
   })
   
   // ✅ Right - in uiStore
   state: () => ({
     modals: {
       addChore: false
     }
   })
   ```

## Store Responsibilities

### useAuthStore
- User authentication state
- Login/logout actions
- Current user information
- Token management

### useChoresStore
- Chores list
- Quicklist chores
- Chore selection state
- CRUD operations for chores
- Chore assignment logic

### useShoppingStore
- Shopping items
- Quick shopping items
- Stores list
- Shopping list operations

### useFamilyStore
- Family members
- Member settings
- Earnings tracking
- Spending requests

### useUIStore
- Modal states
- Toast notifications
- Loading indicators
- Current page/navigation

### useDashboardStore
- Widget configurations
- Dashboard layouts
- Widget positions and sizes
- User customizations

## Testing Stores

```javascript
import { setActivePinia, createPinia } from 'pinia';
import { useXStore } from '@/stores/x';

describe('useXStore', () => {
  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia());
  });
  
  it('loads items', async () => {
    const store = useXStore();
    
    await store.loadItems();
    
    expect(store.items.length).toBeGreaterThan(0);
    expect(store.loading).toBe(false);
  });
  
  it('handles errors', async () => {
    const store = useXStore();
    
    // Mock API to fail
    apiService.get = jest.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(store.loadItems()).rejects.toThrow('API Error');
    expect(store.error).toBe('API Error');
  });
});
```

## Debugging

### Using Vue DevTools

1. Install Vue DevTools browser extension
2. Open DevTools and navigate to Vue tab
3. Click on "Pinia" in the left sidebar
4. View all stores and their current state
5. Track actions as they're dispatched
6. Time-travel debug by reverting state changes

### Console Debugging

```javascript
// Get store instance
const store = useXStore();

// View current state
console.log(store.$state);

// View specific property
console.log(store.items);

// Call actions
await store.loadItems();

// Check getters
console.log(store.itemCount);
```

## Migration from app.js

When migrating state from app.js to stores:

1. **Identify the domain**: Which store does this state belong to?
2. **Move state to store**: Copy state to store's `state()` function
3. **Create actions**: Convert methods to store actions
4. **Create getters**: Convert computed properties to store getters
5. **Update components**: Replace `$parent` calls with store calls
6. **Test thoroughly**: Ensure all functionality still works
7. **Remove old code**: Once verified, remove from app.js

See `MIGRATION_GUIDE.md` for detailed instructions.

## Resources

- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Migration Guide](../MIGRATION_GUIDE.md)
- [Refactoring Roadmap](../REFACTORING_ROADMAP.md)

