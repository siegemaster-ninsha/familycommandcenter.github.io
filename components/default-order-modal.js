// Default Order Modal Component
// Modal for managing the default chore order for a family member
// This order is used when New Day creates chores from scheduled quicklist items

const DefaultOrderModal = Vue.defineComponent({
  name: 'DefaultOrderModal',
  template: `
    <flyout-panel
      :open="open"
      @close="handleClose"
      :title="modalTitle"
      :show-footer="true"
      :show-header-close="true"
      width="480px"
    >
      <template #default>
        <div class="default-order-modal-content">
          <!-- Instructions -->
          <p class="text-sm text-secondary-custom mb-4">
            Drag chores to set the default order when New Day creates them.
            Chores at the top will appear first on the chore board.
          </p>
          
          <!-- Scheduled Chores List (Draggable) -->
          <div 
            v-if="orderedChores.length > 0"
            class="default-order-list space-y-2"
          >
            <div
              v-for="(chore, index) in orderedChores"
              :key="chore.id"
              class="default-order-item"
              :class="{ 
                'default-order-item--dragging': draggedIndex === index,
                'default-order-item--drag-over': dragOverIndex === index && dragOverIndex !== draggedIndex
              }"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragend="handleDragEnd"
              @dragover.prevent="handleDragOver($event, index)"
              @dragleave="handleDragLeave"
              @drop.prevent="handleDrop($event, index)"
            >
              <!-- Drag Handle -->
              <div class="default-order-handle" v-html="getIcon('grip-vertical', 16)"></div>
              
              <!-- Order Number -->
              <div class="default-order-number">{{ index + 1 }}</div>
              
              <!-- Chore Info -->
              <div class="default-order-info">
                <div class="default-order-name">{{ chore.name }}</div>
                <div class="default-order-meta">
                  <span v-if="chore.amount > 0" class="default-order-amount">\${{ chore.amount.toFixed(2) }}</span>
                  <span class="default-order-category">{{ chore.categoryName || 'Uncategorized' }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty state if no scheduled chores -->
          <div v-else class="default-order-empty-state">
            <div v-html="getIcon('calendar-x', 32)" style="color: var(--color-neutral-400);"></div>
            <p class="text-sm text-secondary-custom mt-2">No scheduled chores for this member</p>
            <p class="text-xs text-secondary-custom mt-1">Use the schedule button on quicklist chores to set up weekly schedules first.</p>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button
            @click="handleSave"
            @touchend.prevent="handleSave"
            :disabled="saving || orderedChores.length === 0"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm flex items-center justify-center gap-2"
          >
            <div v-if="saving" class="animate-spin" v-html="getIcon('loader', 16)"></div>
            {{ saving ? 'Saving...' : 'Save Order' }}
          </button>
          <button
            @click="handleClose"
            @touchend.prevent="handleClose"
            :disabled="saving"
            class="btn-secondary btn-compact px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  props: {
    open: {
      type: Boolean,
      default: false
    },
    member: {
      type: Object,
      default: null
    },
    quicklistChores: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['save', 'close'],
  
  data() {
    return {
      orderedChores: [],
      saving: false,
      draggedIndex: null,
      dragOverIndex: null
    };
  },
  
  computed: {
    modalTitle() {
      const memberName = this.member?.displayName || this.member?.name || 'Member';
      return `Default Chore Order: ${memberName}`;
    },
    
    /**
     * Get all quicklist chores scheduled for this member
     */
    scheduledChoresForMember() {
      if (!this.member || !this.quicklistChores) return [];
      
      const memberId = this.member.id;
      return this.quicklistChores.filter(chore => {
        const schedule = chore.schedule || {};
        const memberDays = schedule[memberId];
        return memberDays && Array.isArray(memberDays) && memberDays.length > 0;
      });
    }
  },
  
  watch: {
    open: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          this.initializeOrder();
        }
      }
    },
    member: {
      deep: true,
      handler() {
        if (this.open) {
          this.initializeOrder();
        }
      }
    }
  },
  
  methods: {
    getIcon(name, size) {
      const Helpers = window.Helpers;
      if (Helpers?.IconLibrary?.getIcon) {
        return Helpers.IconLibrary.getIcon(name, 'lucide', size, 'currentColor');
      }
      return '';
    },
    
    /**
     * Initialize the ordered chores list from member's defaultChoreOrder
     */
    initializeOrder() {
      const scheduled = this.scheduledChoresForMember;
      const defaultOrder = this.member?.defaultChoreOrder || {};
      
      // Sort by existing default order, then by name for unordered items
      this.orderedChores = [...scheduled].sort((a, b) => {
        const orderA = defaultOrder[a.id] !== undefined ? defaultOrder[a.id] : Infinity;
        const orderB = defaultOrder[b.id] !== undefined ? defaultOrder[b.id] : Infinity;
        
        if (orderA !== orderB) return orderA - orderB;
        return (a.name || '').localeCompare(b.name || '');
      });
    },
    
    // Drag and drop handlers
    handleDragStart(event, index) {
      this.draggedIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    },
    
    handleDragEnd() {
      this.draggedIndex = null;
      this.dragOverIndex = null;
    },
    
    handleDragOver(event, index) {
      event.dataTransfer.dropEffect = 'move';
      this.dragOverIndex = index;
    },
    
    handleDragLeave() {
      this.dragOverIndex = null;
    },
    
    handleDrop(event, dropIndex) {
      const dragIndex = this.draggedIndex;
      
      if (dragIndex === null || dragIndex === dropIndex) {
        this.draggedIndex = null;
        this.dragOverIndex = null;
        return;
      }
      
      // Reorder the array
      const item = this.orderedChores.splice(dragIndex, 1)[0];
      this.orderedChores.splice(dropIndex, 0, item);
      
      this.draggedIndex = null;
      this.dragOverIndex = null;
    },
    
    /**
     * Handle save button click
     */
    handleSave() {
      // Guard against saving without a member
      if (!this.member?.id) {
        console.warn('[DefaultOrderModal] No member ID, skipping save');
        return;
      }
      
      // Build the defaultOrderMap from current order
      const defaultOrderMap = {};
      this.orderedChores.forEach((chore, index) => {
        defaultOrderMap[chore.id] = index;
      });
      
      this.$emit('save', {
        memberId: this.member.id,
        defaultOrderMap
      });
    },
    
    handleClose() {
      this.$emit('close');
    },
    
    setSaving(value) {
      this.saving = value;
    }
  }
});

// Export component for manual registration
window.DefaultOrderModalComponent = DefaultOrderModal;
