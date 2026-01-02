// Trash Section Component
// _Requirements: 7.1, 7.2_ - Uses choresStore instead of $parent
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
  setup() {
    // Access chores store directly instead of using $parent
    const choresStore = window.useChoresStore?.();
    return { choresStore };
  },
  computed: {
    // Get selected chore from store
    storeSelectedChore() {
      return this.choresStore?.selectedChore || null;
    }
  },
  methods: {
    async deleteSelectedChore() {
      const chore = this.storeSelectedChore || this.selectedChore;
      if (!chore || chore.isNewFromQuicklist) {
        // Clear selection using store
        if (this.choresStore) {
          this.choresStore.clearSelection();
        }
        return;
      }
      
      // Use chores store's delete method
      if (this.choresStore) {
        await this.choresStore.deleteChore(chore);
      }
    }
  }
});

// Export component for manual registration
window.TrashSectionComponent = TrashSection; 