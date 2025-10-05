// IconContainer Component - Reusable gradient background container for icons
const IconContainer = Vue.defineComponent({
  template: `
    <div class="relative">
      <div :class="getGradientClasses()"></div>
      <div class="relative bg-white dark:bg-slate-800 rounded-lg" :class="getPaddingClasses()">
        <div v-html="Helpers.IconLibrary.getIcon(icon, 'lucide', size, color)"></div>
      </div>
    </div>
  `,
  props: {
    icon: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 20
    },
    color: {
      type: String,
      default: 'text-blue-600 dark:text-blue-400'
    },
    gradient: {
      type: String,
      default: 'blue-purple' // blue-purple, yellow-orange, red-pink, slate
    },
    shape: {
      type: String,
      default: 'rounded-lg' // rounded-lg, rounded-full
    },
    hoverEffect: {
      type: Boolean,
      default: false
    }
  },
  inject: ['Helpers'],
  computed: {
    gradientClasses() {
      const gradients = {
        'blue-purple': 'absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg blur opacity-75',
        'yellow-orange': 'absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-75',
        'red-pink': 'absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full blur opacity-75',
        'slate': 'absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur opacity-75'
      };

      const baseClasses = gradients[this.gradient] || gradients['blue-purple'];
      return this.hoverEffect ? `${baseClasses} group-hover:opacity-100` : baseClasses;
    }
  },
  methods: {
    getPaddingClasses() {
      const paddingMap = {
        16: 'p-1',
        20: 'p-2',
        24: 'p-3',
        32: 'p-4',
        48: 'p-6'
      };
      return paddingMap[this.size] || 'p-2';
    }
  }
});

// Export component for manual registration
window.IconContainerComponent = IconContainer;
