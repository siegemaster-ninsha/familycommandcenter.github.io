// Trash Section Component
const TrashSection = Vue.defineComponent({
  template: `
    <!-- Trash Can -->
    <div 
      class="fixed bottom-8 right-8 z-40"
      :class="{ 'scale-110 animate-pulse': isDragOverTrash }"
    >
      <div 
        @drop="handleTrashDrop($event)"
        @dragover.prevent="isDragOverTrash = true"
        @dragenter.prevent="isDragOverTrash = true"
        @dragleave.prevent="isDragOverTrash = false"
        @click="deleteSelectedChore"
        class="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center size-16"
        :class="{ 
          'bg-red-600 scale-110': isDragOverTrash,
          'ring-4 ring-red-300 ring-opacity-75': selectedChore && !selectedChore.isNewFromQuicklist
        }"
        :title="selectedChore && !selectedChore.isNewFromQuicklist ? 'Click to delete selected chore' : 'Drag chores here to delete them'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
          <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
        </svg>
      </div>
    </div>
  `,
  inject: ['isDragOverTrash', 'selectedChore'],
  methods: {
    async handleTrashDrop(event) {
      event.preventDefault();
      this.$parent.isDragOverTrash = false;
      if (this.$parent.draggedChore) {
        // Only delete if it's an existing chore (not a new one from quicklist)
        if (!this.$parent.draggedChore.isNewFromQuicklist && this.$parent.draggedChore.id) {
          try {
            await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.$parent.draggedChore.id}`, {
              method: 'DELETE'
            });
            await this.$parent.loadChores();
            await this.$parent.loadEarnings();
            await this.$parent.loadElectronicsStatus();
          } catch (error) {
            console.error('Failed to delete chore:', error);
          }
        }
        this.$parent.draggedChore = null;
      }
    },

    async deleteSelectedChore() {
      if (!this.$parent.selectedChore || this.$parent.selectedChore.isNewFromQuicklist) {
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
        return;
      }
      
      try {
        await this.$parent.apiCall(`${CONFIG.API.ENDPOINTS.CHORES}/${this.$parent.selectedChore.id}`, {
          method: 'DELETE'
        });
        await this.$parent.loadChores();
        await this.$parent.loadEarnings();
        await this.$parent.loadElectronicsStatus();
        
        // Clear selection
        this.$parent.selectedChoreId = null;
        this.$parent.selectedQuicklistChore = null;
      } catch (error) {
        console.error('Failed to delete chore:', error);
      }
    }
  }
});

// Export component for manual registration
window.TrashSectionComponent = TrashSection; 