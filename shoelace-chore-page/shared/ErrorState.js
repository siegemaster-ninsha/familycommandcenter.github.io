// ErrorState Component - Reusable error state with icon, title, message, and retry button
const ErrorState = Vue.defineComponent({
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="relative mb-4">
        <div class="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full blur opacity-75"></div>
        <div class="relative bg-white dark:bg-slate-800 p-4 rounded-full">
          <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 24, 'text-red-600 dark:text-red-400')"></div>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">{{ title }}</h3>
      <p class="text-slate-600 dark:text-slate-400 mb-4 max-w-md">{{ message }}</p>
      <sl-button variant="outline" @click="onRetry" v-if="showRetry">
        <div v-html="Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 16)"></div>
        {{ retryText }}
      </sl-button>
    </div>
  `,
  props: {
    title: {
      type: String,
      default: 'Failed to Load'
    },
    message: {
      type: String,
      required: true
    },
    showRetry: {
      type: Boolean,
      default: true
    },
    retryText: {
      type: String,
      default: 'Try Again'
    },
    onRetry: {
      type: Function,
      required: true
    }
  },
  inject: ['Helpers']
});

// Export component for manual registration
window.ErrorStateComponent = ErrorState;
