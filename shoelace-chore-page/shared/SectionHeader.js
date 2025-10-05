// SectionHeader Component - Reusable header with icon, title, description, and action buttons
const SectionHeader = Vue.defineComponent({
  template: `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-75"></div>
          <div class="relative bg-white dark:bg-slate-800 p-2 rounded-lg">
            <div v-html="Helpers.IconLibrary.getIcon(icon, 'lucide', 20, iconColor)"></div>
          </div>
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ title }}</h2>
          <p v-if="description" class="text-sm text-slate-600 dark:text-slate-400">{{ description }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <sl-button
          v-if="secondaryButton"
          :variant="secondaryButton.variant || 'outline'"
          size="small"
          @click="secondaryButton.action"
          :disabled="secondaryButton.disabled"
        >
          <div v-if="secondaryButton.icon" v-html="Helpers.IconLibrary.getIcon(secondaryButton.icon, 'lucide', 16)"></div>
          {{ secondaryButton.text }}
        </sl-button>
        <sl-button
          v-if="primaryButton"
          :variant="primaryButton.variant || 'primary'"
          size="small"
          @click="primaryButton.action"
        >
          <div v-if="primaryButton.icon" v-html="Helpers.IconLibrary.getIcon(primaryButton.icon, 'lucide', 16)"></div>
          {{ primaryButton.text }}
        </sl-button>
      </div>
    </div>
  `,
  props: {
    icon: {
      type: String,
      required: true
    },
    iconColor: {
      type: String,
      default: 'text-yellow-600 dark:text-yellow-400'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    primaryButton: {
      type: Object,
      default: null
    },
    secondaryButton: {
      type: Object,
      default: null
    }
  },
  inject: ['Helpers']
});

// Export component for manual registration
window.SectionHeaderComponent = SectionHeader;
