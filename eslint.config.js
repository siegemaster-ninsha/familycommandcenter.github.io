/* eslint-env node */
// ESLint Configuration for Family Command Center Frontend
// Enforces design system patterns for Vue.js vanilla application (no build step)

const js = require('@eslint/js');
const designTokensPlugin = require('./lint-rules/eslint-design-tokens.js');

module.exports = [
  js.configs.recommended,
  {
    plugins: {
      'design-tokens': designTokensPlugin
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Image: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        getComputedStyle: 'readonly',
        matchMedia: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        atob: 'readonly',
        btoa: 'readonly',
        WebSocket: 'readonly',
        indexedDB: 'readonly',
        
        // Vue.js globals (CDN)
        Vue: 'readonly',
        
        // Pinia globals (CDN)
        Pinia: 'readonly',
        
        // App-specific globals
        CONFIG: 'readonly',
        ThemeManager: 'readonly',
        authService: 'readonly',
        api: 'readonly',
        apiService: 'readonly',
        Helpers: 'readonly',
        
        // Widget system globals
        widgetRegistry: 'readonly',
        WidgetBase: 'readonly',
        lucide: 'readonly',
        
        // Third-party libraries (CDN)
        confetti: 'readonly',
        
        // Browser APIs
        caches: 'readonly',
        
        // Store functions (used across files, defined in stores/)
        useAuthStore: 'readonly',
        useChoresStore: 'readonly',
        useFamilyStore: 'readonly',
        useShoppingStore: 'readonly',
        useDashboardStore: 'readonly',
        useUIStore: 'readonly',
        useOfflineStore: 'readonly',
        useRecipesStore: 'readonly',
        
        // Component globals (used across files)
        OfflineIndicator: 'readonly',
        UpdatePrompt: 'readonly'
      }
    },
    rules: {
      // Unused variables are errors - remove them
      'no-unused-vars': 'error',
      'no-undef': 'error',
      // Allow redeclaring globals (pattern: define locally, export to window)
      'no-redeclare': ['error', { builtinGlobals: false }],
      
      // Design token rules - warn on hardcoded colors in inline styles
      // Requirements: 2.1, 2.2, 2.3
      'design-tokens/no-hardcoded-inline-colors': 'warn'
    }
  },
  // Vue component files - require name property
  // Requirements: 5.2
  {
    files: ['components/*.js'],
    rules: {
      'design-tokens/require-vue-component-name': 'error'
    }
  },
  // Pinia store files - require defineStore
  // Requirements: 5.3
  {
    files: ['stores/*.js'],
    ignores: ['stores/README.md'],
    rules: {
      'design-tokens/require-pinia-store': 'error'
    }
  },
  // Service worker file - has different globals
  {
    files: ['sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        MessageChannel: 'readonly',
        clients: 'readonly',
        module: 'readonly'
      }
    }
  },
  // Offline storage uses caches API
  {
    files: ['services/offline-storage.js'],
    languageOptions: {
      globals: {
        caches: 'readonly'
      }
    }
  },
  // Lint rules are CommonJS modules
  {
    files: ['lint-rules/*.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly'
      }
    }
  },
  // Utils that use ES modules
  {
    files: ['utils/fuzzyMatch.js'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  // Files with conditional module exports
  {
    files: ['config.js', 'utils/ingredientFormatter.js', 'widgets/dad-joke-widget.js'],
    languageOptions: {
      globals: {
        module: 'readonly'
      }
    }
  },
  // Ignore node_modules and build artifacts
  {
    ignores: ['node_modules/**', '*.min.js', 'shoelace-chore-page/**']
  }
];
