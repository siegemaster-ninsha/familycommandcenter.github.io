// LoadingSpinner Component - Reusable loading state with spinner and message
const LoadingSpinner = Vue.defineComponent({
  template: `
    <div class="flex flex-col items-center justify-center py-12">
      <sl-spinner :style="spinnerStyle"></sl-spinner>
      <p class="text-slate-600 dark:text-slate-400 mt-4 animate-pulse">{{ message }}</p>
    </div>
  `,
  props: {
    message: {
      type: String,
      default: 'Loading...'
    },
    size: {
      type: Number,
      default: 48
    },
    trackWidth: {
      type: Number,
      default: 4
    }
  },
  computed: {
    spinnerStyle() {
      return `--size: ${this.size}px; --track-width: ${this.trackWidth}px;`;
    }
  }
});

// Export component for manual registration
window.LoadingSpinnerComponent = LoadingSpinner;
