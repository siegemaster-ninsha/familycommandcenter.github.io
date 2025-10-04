// UI Components for the Family Command Center
// These are reusable components that handle common UI patterns

// Loading State Component
const AppLoadingState = Vue.defineComponent({
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
  template: `
      <div v-if="error" class="mx-4 mb-8 rounded-lg p-4" style="background: var(--color-error-50); border: 1px solid var(--color-error-600);">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" style="color: var(--color-error-700);">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM128,184a12,12,0,1,1,12-12A12,12,0,0,1,128,184Zm12-32a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Z"></path>
        </svg>
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
  template: `
      <div v-if="showSuccessMessage && completedChoreMessage" class="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
      <div class="success-message btn-success px-8 py-4 rounded-lg shadow-lg text-center">
        <div class="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
            <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"></path>
          </svg>
          <span class="text-lg font-medium">{{ completedChoreMessage }}</span>
        </div>
      </div>
    </div>
  `,
  inject: ['showSuccessMessage', 'completedChoreMessage']
});

// Confetti Component
const AppConfetti = Vue.defineComponent({
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
