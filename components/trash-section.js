// Trash Section Component
const TrashSection = Vue.defineComponent({
  name: 'TrashSection',
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
        <div v-html="Helpers.IconLibrary.getIcon('trash', 'lucide', 32, 'text-red-600 sm:w-7 sm:h-7')"></div>
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