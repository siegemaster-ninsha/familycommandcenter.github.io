// UI Components for the Family Command Center
// These are reusable components that handle common UI patterns

// Loading State Component
const AppLoadingState = Vue.defineComponent({
  name: 'AppLoadingState',
  template: `
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--color-primary-500);"></div>
        <p class="mt-2 text-secondary-custom">Loading Family Command Center...</p>
      </div>
    </div>
  `,
  inject: ['loading']
});

// Error State Component
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
          @click="loadAllData" 
          class="mt-3 btn-error text-sm"
      >
        Retry
      </button>
    </div>
  `,
  inject: ['error', 'loadAllData']
});

// Selection Info Component (disabled per UX request)
const AppSelectionInfo = Vue.defineComponent({
  name: 'AppSelectionInfo',
  template: `<div></div>`,
  inject: ['loading', 'error', 'selectedChore'],
  methods: {
    clearSelection() {
      this.$parent.selectedChoreId = null;
      this.$parent.selectedQuicklistChore = null;
    }
  }
});

// Success Message Component
const AppSuccessMessage = Vue.defineComponent({
  name: 'AppSuccessMessage',
  template: `
      <div v-if="showSuccessMessage && completedChoreMessage" class="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
      <div class="success-message btn-success px-8 py-4 rounded-lg shadow-lg text-center">
        <div class="flex items-center gap-3">
          <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 24, 'text-white')"></div>
          <span class="text-lg font-medium">{{ completedChoreMessage }}</span>
        </div>
      </div>
    </div>
  `,
  inject: ['showSuccessMessage', 'completedChoreMessage']
});

// Confetti Component
const AppConfetti = Vue.defineComponent({
  name: 'AppConfetti',
  template: `
    <div v-if="showConfetti" class="confetti-container">
      <div 
        v-for="piece in confettiPieces" 
        :key="piece.id"
        class="confetti-piece"
        :class="piece.direction"
        :style="{ 
          left: piece.left + 'px', 
          animationDelay: piece.delay + 's',
          backgroundColor: piece.color 
        }"
      ></div>
    </div>
  `,
  inject: ['showConfetti', 'confettiPieces']
});

// Export components for manual registration
window.UIComponents = {
  AppLoadingState,
  AppErrorState,
  AppSelectionInfo,
  AppSuccessMessage,
  AppConfetti
}; 
