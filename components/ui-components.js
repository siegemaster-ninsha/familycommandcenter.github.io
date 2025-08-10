// UI Components for the Family Command Center
// These are reusable components that handle common UI patterns

// Loading State Component
const AppLoadingState = Vue.defineComponent({
  template: `
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#607afb]"></div>
        <p class="text-[#47569e] mt-2">Loading Family Command Center...</p>
      </div>
    </div>
  `,
  inject: ['loading']
});

// Error State Component
const AppErrorState = Vue.defineComponent({
  template: `
      <div v-if="error" class="mx-4 mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="text-red-600" viewBox="0 0 256 256">
          <path d="M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM128,184a12,12,0,1,1,12-12A12,12,0,0,1,128,184Zm12-32a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Z"></path>
        </svg>
        <p class="text-red-800 font-medium">Failed to load data</p>
      </div>
      <p class="text-red-600 text-sm mt-1">{{ error }}</p>
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

// Selection Info Component
const AppSelectionInfo = Vue.defineComponent({
  template: `
    <div v-if="!loading && !error && selectedChore" class="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
          </svg>
          <span class="text-sm font-medium">
            Selected: <strong>{{ selectedChore.name }}</strong> - 
            <span v-if="selectedChore.isNewFromQuicklist">Click on a family member to assign.</span>
            <span v-else>Click on a family member or the trash can to move/delete.</span>
          </span>
        </div>
        <button 
          @click="clearSelection"
          class="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors"
          title="Clear selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
          </svg>
        </button>
      </div>
    </div>
  `,
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
      <div v-if="showSuccessMessage && completedChoreMessage" class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
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