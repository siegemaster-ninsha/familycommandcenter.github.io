// EmptyState Component - Reusable empty state with icon, title, description, and action button
const EmptyState = Vue.defineComponent({
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="relative mb-6">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur opacity-75"></div>
        <div class="relative bg-white dark:bg-slate-800 p-6 rounded-full">
          <div v-html="Helpers.IconLibrary.getIcon(icon, 'lucide', 32, 'text-slate-600 dark:text-slate-400')"></div>
        </div>
      </div>
      <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">{{ title }}</h3>
      <p class="text-slate-600 dark:text-slate-400 mb-6 max-w-md">{{ description }}</p>
      <sl-button :variant="buttonVariant" @click="onAction" v-if="showAction">
        <div v-if="buttonIcon" v-html="Helpers.IconLibrary.getIcon(buttonIcon, 'lucide', 16)"></div>
        {{ buttonText }}
      </sl-button>
    </div>
  `,
  props: {
    icon: {
      type: String,
      default: 'sparkles'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    buttonText: {
      type: String,
      default: ''
    },
    buttonIcon: {
      type: String,
      default: ''
    },
    buttonVariant: {
      type: String,
      default: 'primary'
    },
    showAction: {
      type: Boolean,
      default: true
    },
    onAction: {
      type: Function,
      default: () => {}
    }
  },
  inject: ['Helpers']
});

// Export component for manual registration
window.EmptyStateComponent = EmptyState;
