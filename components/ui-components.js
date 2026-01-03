// UI Components for the Family Command Center
// These are reusable components that handle common UI patterns

// Registry for pages that handle their own skeleton loading
// Pages register themselves here so AppLoadingState knows not to show the spinner
window.SkeletonRegistry = window.SkeletonRegistry || {
  _pages: new Set(),
  
  // Register a page as having its own skeleton loading
  register(pageName) {
    this._pages.add(pageName);
  },
  
  // Check if a page has custom skeleton loading
  hasCustomSkeleton(pageName) {
    return this._pages.has(pageName);
  }
};

// Loading State Component
// Shows spinner only for pages that don't have their own skeleton loading
// _Requirements: 8.4_ - Uses app.js data directly via $parent since loading/currentPage remain in app.js
const AppLoadingState = Vue.defineComponent({
  name: 'AppLoadingState',
  template: `
    <div v-if="shouldShowSpinner" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--color-primary-500);"></div>
        <p class="mt-2 text-secondary-custom">Loading Family Command Center...</p>
      </div>
    </div>
  `,
  computed: {
    loading() {
      // Access loading from $parent (app.js) - this is one of the few properties that remains in app.js
      return this.$parent?.loading ?? false;
    },
    currentPage() {
      // Access currentPage from $parent (app.js) - this is one of the few properties that remains in app.js
      return this.$parent?.currentPage ?? 'chores';
    },
    shouldShowSpinner() {
      // Don't show spinner if not loading
      if (!this.loading) return false;
      // Don't show spinner if current page has its own skeleton
      if (window.SkeletonRegistry?.hasCustomSkeleton(this.currentPage)) return false;
      return true;
    }
  }
});

// Error State Component
// _Requirements: 8.4_ - Uses app.js data directly via $parent since error/loadAllData remain in app.js
const AppErrorState = Vue.defineComponent({
  name: 'AppErrorState',
  template: `
      <div v-if="error" class="mx-4 mb-8 rounded-lg p-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
      <div class="flex items-center gap-2">
        <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 20, '')" style="color: var(--color-error-700);"></div>
        <p class="font-medium" style="color: var(--color-error-700);">Failed to load data</p>
      </div>
      <p class="text-sm mt-1" style="color: var(--color-error-700);">{{ error }}</p>
        <button 
          @click="retryLoad" 
          class="mt-3 btn-error text-sm"
      >
        Retry
      </button>
    </div>
  `,
  computed: {
    error() {
      // Access error from $parent (app.js) - this is one of the few properties that remains in app.js
      return this.$parent?.error ?? null;
    }
  },
  methods: {
    retryLoad() {
      // Call loadAllData on $parent (app.js) - this is the orchestrator method that remains in app.js
      this.$parent?.loadAllData?.();
    }
  }
});

// Selection Info Component (disabled per UX request)
// _Requirements: 7.1, 7.2_ - Uses choresStore instead of $parent
const AppSelectionInfo = Vue.defineComponent({
  name: 'AppSelectionInfo',
  template: `<div></div>`,
  setup() {
    // Access chores store directly instead of using $parent
    const choresStore = window.useChoresStore?.();
    return { choresStore };
  },
  computed: {
    loading() {
      return this.$parent?.loading ?? false;
    },
    error() {
      return this.$parent?.error ?? null;
    },
    selectedChore() {
      return this.choresStore?.selectedChore ?? null;
    }
  },
  methods: {
    clearSelection() {
      // Use chores store instead of $parent
      if (this.choresStore) {
        this.choresStore.clearSelection();
      }
    }
  }
});

// Toast notification system using Shoelace alerts
// Provides a standardized way to show success, error, warning, and info messages
// Position is controlled via CSS override of .sl-toast-stack (see styles.css)
window.ToastService = window.ToastService || {
  // Show a toast notification
  // variant: 'success' | 'danger' | 'warning' | 'primary' (info)
  show(message, variant = 'success', duration = 3000) {
    // Determine icon based on variant
    const icons = {
      success: 'check-circle',
      danger: 'exclamation-octagon',
      warning: 'exclamation-triangle',
      primary: 'info-circle'
    };
    
    // Create the alert element
    const alert = document.createElement('sl-alert');
    alert.variant = variant;
    alert.closable = true;
    alert.duration = duration;
    alert.innerHTML = `
      <sl-icon name="${icons[variant] || 'info-circle'}" slot="icon"></sl-icon>
      ${message}
    `;
    
    // Append to body temporarily (required for toast())
    document.body.appendChild(alert);
    
    // Small delay to ensure element is in DOM before showing
    requestAnimationFrame(() => {
      alert.toast();
    });
    
    return alert;
  },
  
  // Convenience methods
  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  },
  
  error(message, duration = 4000) {
    return this.show(message, 'danger', duration);
  },
  
  warning(message, duration = 3500) {
    return this.show(message, 'warning', duration);
  },
  
  info(message, duration = 3000) {
    return this.show(message, 'primary', duration);
  }
};

// Success Message Component - now uses uiStore and Shoelace toast
// _Requirements: 8.4_ - Uses uiStore instead of inject from app.js
const AppSuccessMessage = Vue.defineComponent({
  name: 'AppSuccessMessage',
  template: `<div></div>`,
  setup() {
    const uiStore = window.useUIStore?.();
    return { uiStore };
  },
  computed: {
    showSuccessMessage() {
      return this.uiStore?.showSuccessMessage ?? false;
    },
    successMessage() {
      return this.uiStore?.successMessage ?? '';
    }
  },
  watch: {
    showSuccessMessage(newVal) {
      if (newVal && this.successMessage) {
        // Determine variant based on message content
        const message = this.successMessage;
        let variant = 'success';
        let cleanMessage = message;
        
        // Check for emoji prefixes and set variant accordingly
        if (message.startsWith('❌') || message.toLowerCase().includes('failed')) {
          variant = 'danger';
          cleanMessage = message.replace(/^❌\s*/, '');
        } else if (message.startsWith('⚠️') || message.toLowerCase().includes('warning')) {
          variant = 'warning';
          cleanMessage = message.replace(/^⚠️\s*/, '');
        } else if (message.startsWith('✅')) {
          variant = 'success';
          cleanMessage = message.replace(/^✅\s*/, '');
        } else if (message.startsWith('🌅')) {
          variant = 'success';
          cleanMessage = message.replace(/^🌅\s*/, '');
        }
        
        window.ToastService?.show(cleanMessage, variant);
      }
    }
  }
});

// Confetti Component - now just a placeholder since canvas-confetti handles rendering
// Kept for backward compatibility with existing component registration
const AppConfetti = Vue.defineComponent({
  name: 'AppConfetti',
  template: `<div></div>`
});

// Export components for manual registration
window.UIComponents = {
  AppLoadingState,
  AppErrorState,
  AppSelectionInfo,
  AppSuccessMessage,
  AppConfetti
}; 
