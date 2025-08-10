// Trash Section Component
const TrashSection = Vue.defineComponent({
  template: `
    <!-- Delete Button -->
    <div 
      class="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40"
      v-if="selectedChore && !selectedChore.isNewFromQuicklist"
    >
      <div 
        @click="deleteSelectedChore"
        class="btn-error rounded-full p-4 sm:p-4 shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center size-20 sm:size-16 touch-target ring-4 ring-red-300 ring-opacity-75"
        title="Tap to delete selected chore"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" class="sm:w-7 sm:h-7">
          <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
        </svg>
      </div>
      
      <!-- Mobile help text -->
      <div class="absolute -top-12 right-0 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-100 transition-opacity duration-200 whitespace-nowrap sm:hidden"
           style="transform: translateX(50%); right: 50%;">
        Tap to delete
      </div>
    </div>
  `,
  inject: ['selectedChore'],
  methods: {
    async deleteSelectedChore() {
      if (!this.$parent.selectedChore || this.$parent.selectedChore.isNewFromQuicklist) {
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
        return;
      }
      
      // Use parent's optimized delete method
      await this.$parent.deleteChore(this.$parent.selectedChore);
    }
  }
});

// Export component for manual registration
window.TrashSectionComponent = TrashSection; 