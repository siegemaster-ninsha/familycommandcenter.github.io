# CLAUDE.md - AI Assistant Guide

This document provides essential context for AI assistants working on the Family Command Center codebase.

## Project Overview

**Family Command Center** is a Vue 3 single-page application (SPA) for family task management. It includes chore tracking, shopping lists, family member management, earnings/spending tracking, recipes, habits, and a customizable dashboard with widgets.

- **Repository**: familycommandcenter.github.io
- **Deployment**: GitHub Pages (static hosting)
- **Backend**: AWS serverless (API Gateway + Lambda) - separate repository

## Technology Stack

| Technology | Version/Details |
|------------|-----------------|
| Framework | Vue 3 (Global build from CDN) |
| State Management | Pinia (CDN) |
| Styling | Tailwind CSS (CDN) + Custom CSS variables |
| Icons | Lucide Icons (custom SVG implementation) |
| Testing | Vitest + jsdom + fast-check (property testing) |
| Linting | ESLint + Stylelint with custom design-token rules |
| Build Process | None (direct browser execution) |

## Quick Commands

```bash
# Development server
npm run dev          # Start dev server at localhost:3000

# Linting
npm run lint         # Run all linters
npm run lint:fix     # Auto-fix lint issues
npm run lint:js      # ESLint only
npm run lint:style   # Stylelint only

# Testing
npm test             # Run tests once
npm run test:watch   # Watch mode
npm run test:coverage # With coverage report

# Deployment
npm run deploy       # Commit and push to master
```

## Project Structure

```
familycommandcenter.github.io/
├── index.html           # Main HTML entry point
├── app.js               # Root Vue application (~2600 lines)
├── auth.js              # Authentication service (Cognito)
├── config.js            # API config, themes, endpoints
├── styles.css           # All CSS with custom properties
├── sw.js                # Service worker for PWA
│
├── components/          # Vue components
│   ├── modals/          # Modal dialogs by feature
│   │   ├── auth/        # Login, signup, confirm
│   │   ├── chores/      # Chore-related modals
│   │   ├── family/      # Family member modals
│   │   ├── habits/      # Habit modals
│   │   ├── operations/  # Operation modals
│   │   └── spending/    # Spending request modals
│   ├── *-page.js        # Page components
│   └── *.js             # Shared components
│
├── stores/              # Pinia stores
│   ├── auth.js          # Authentication state
│   ├── chores.js        # Chores and quicklist
│   ├── family.js        # Family members, earnings
│   ├── shopping.js      # Shopping lists
│   ├── ui.js            # UI state (modals, toasts)
│   ├── dashboard.js     # Dashboard configuration
│   ├── habits.js        # Habit tracking
│   ├── recipes.js       # Recipe management
│   ├── categories.js    # Category management
│   └── *.test.js        # Store tests
│
├── services/            # Service layer
│   ├── api.js           # API service with offline support
│   ├── offline-storage.js # IndexedDB caching
│   ├── sync-queue.js    # Offline sync queue
│   └── network-status.js # Network detection
│
├── composables/         # Vue composables
│   ├── use-api.js       # API composable
│   ├── use-websocket.js # WebSocket connection
│   ├── use-optimistic.js # Optimistic updates
│   └── use-celebrations.js # Confetti/animations
│
├── widgets/             # Dashboard widgets
│   ├── base/            # Widget base class & registry
│   ├── *-widget.js      # Individual widgets
│   └── README.md        # Widget documentation
│
├── utils/               # Utility functions
│   ├── helpers.js       # Icon library, categories
│   ├── settings.js      # User preferences
│   ├── confetti.js      # Celebration animations
│   └── *.js             # Other utilities
│
├── lint-rules/          # Custom lint rules
│   ├── eslint-design-tokens.js
│   └── stylelint-design-tokens.js
│
├── test/                # Test configuration
│   └── setup.js         # Vitest setup
│
└── config/              # Additional configuration
    └── weather-config.js
```

## Architecture Patterns

### State Management with Pinia

All application state is managed through Pinia stores. **Never access state via `$parent`**.

```javascript
// Store definition pattern
const useExampleStore = Pinia.defineStore('example', {
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    itemCount: (state) => state.items.length,
    itemById: (state) => (id) => state.items.find(i => i.id === id)
  },

  actions: {
    async loadItems() {
      this.loading = true;
      try {
        const data = await apiService.get('/items');
        this.items = data.items || [];
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});

// Export to window for global access
if (typeof window !== 'undefined') {
  window.useExampleStore = useExampleStore;
}
```

### Component Pattern

Components use Vue 3 Options API with setup() for store access:

```javascript
const MyComponent = Vue.defineComponent({
  name: 'MyComponent',  // Required by lint rule

  setup() {
    const store = useExampleStore();
    return { store };
  },

  computed: {
    items() { return this.store.items; }
  },

  methods: {
    async handleAction() {
      await this.store.loadItems();
    }
  },

  template: `<div>...</div>`
});
```

### API Service

Use `apiService` for all API calls. It handles auth headers and offline queuing:

```javascript
// In store actions
async loadData() {
  const data = await apiService.get('/endpoint');
  // ...
}

async createItem(item) {
  const result = await apiService.post('/endpoint', item);
  // Handles offline queuing automatically
}
```

### Theme System

Themes are defined in `config.js` and applied via CSS custom properties. **Never use hardcoded colors**.

```javascript
// Correct - use CSS variables
style: 'background: var(--color-primary-500)'

// Wrong - hardcoded color
style: 'background: #4A90E2'
```

## Key Coding Standards

### 1. Store Rules
- All API calls go through store actions, not components
- Use getters for computed/derived state
- Keep stores focused on their domain (don't mix concerns)
- Export stores to `window` object for global access

### 2. Component Rules
- Every component must have a `name` property (enforced by lint)
- Access stores via `setup()`, not `$parent`
- Emit events for parent communication, don't call parent methods directly
- Use CSS classes with design tokens, not inline hardcoded colors

### 3. Style Rules
- Use CSS custom properties: `var(--color-primary-500)`
- Use design tokens: `var(--space-4)`, `var(--radius-lg)`
- Follow the shade scale (50-900) for color variations
- Test all themes when modifying styles

### 4. Testing Rules
- Tests use ES modules (not script globals)
- Set up fresh Pinia instance in `beforeEach`
- Mock `apiService` for API tests
- Include property-based tests for complex logic (`*.property.test.js`)

## ESLint Custom Rules

| Rule | Scope | Description |
|------|-------|-------------|
| `design-tokens/no-hardcoded-inline-colors` | All JS | Warns on hex/rgb colors in inline styles |
| `design-tokens/require-vue-component-name` | components/*.js | Requires `name` in Vue.defineComponent |
| `design-tokens/require-pinia-store` | stores/*.js | Requires Pinia.defineStore pattern |

## Widget Development

Widgets extend `WidgetBase` and register with `widgetRegistry`. See `WIDGET_INTERFACE_SPEC.md` for full details.

```javascript
const MyWidget = Vue.defineComponent({
  name: 'MyWidget',
  mixins: [WidgetBase],

  metadata: {
    id: 'my-widget',
    name: 'My Widget',
    icon: 'iconName',
    category: 'info',
    defaultSize: { w: 2, h: 2 },
    // ... see spec for full metadata
  },

  methods: {
    async onRefresh() {
      // Load widget data
    }
  },

  template: `<div class="widget-container">...</div>`
});

widgetRegistry.register(MyWidget.metadata, MyWidget);
```

## Common Gotchas

1. **No build step** - This app runs directly in the browser. Don't use Node.js-only features.

2. **CDN dependencies** - Vue, Pinia, Tailwind are loaded from CDN. Check `index.html` for versions.

3. **Global exports** - Stores and services are exported to `window` object for cross-file access.

4. **Test isolation** - Tests use ES modules but the app uses script globals. Mock globals in `test/setup.js`.

5. **Offline support** - API service queues changes when offline. Handle `_pending` flag in responses.

6. **Theme sensitivity** - Many UI elements depend on CSS variables. Test visual changes across themes.

## File Naming Conventions

| Pattern | Location | Example |
|---------|----------|---------|
| `*-page.js` | components/ | `shopping-page.js` |
| `*-widget.js` | widgets/ | `weather-widget.js` |
| `*.test.js` | same as source | `auth.test.js` |
| `*.property.test.js` | same as source | `chores.property.test.js` |
| `use-*.js` | composables/ | `use-websocket.js` |

## Related Documentation

- `CURRENT_ARCHITECTURE.md` - Detailed architecture overview
- `STYLE_GUIDE.md` - Design system and theming
- `WIDGET_INTERFACE_SPEC.md` - Widget development specification
- `stores/README.md` - Pinia store patterns
- `REFACTORING_ROADMAP.md` - Ongoing refactoring plans
- `MIGRATION_GUIDE.md` - Migration from monolithic app.js

## Git Workflow

- Main branch: `master`
- Deployment: Push to master triggers GitHub Pages deploy
- Commits: Use descriptive messages, reference issues when applicable

## API Endpoints Reference

The backend API is configured in `config.js`. Key endpoint patterns:

```javascript
CONFIG.API.ENDPOINTS = {
  AUTH_ME: '/auth/me',
  CHORES: '/chores',
  QUICKLIST: '/quicklist',
  FAMILY_MEMBERS: '/family-members',
  SPENDING_REQUESTS: '/spending-requests',
  SHOPPING: '/shopping',
  RECIPES: '/recipes',
  HABITS: '/habits',
  // ... see config.js for full list
}
```

## Environment Detection

```javascript
CONFIG.ENV = {
  IS_DEVELOPMENT: window.location.hostname === 'localhost',
  IS_GITHUB_PAGES: window.location.hostname.includes('github.io')
}
```

---

*Last updated: January 2026*
