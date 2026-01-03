// Default Order Modal Component
// Modal for managing the default chore order for a family member
// This order is used when New Day creates chores from scheduled quicklist items
// **Feature: app-js-cleanup**
// _Requirements: 6.3, 6.4_

const DefaultOrderModal = Vue.defineComponent({
  name: 'DefaultOrderModal',
  
  setup() {
    // Use stores directly instead of inject
    // **Feature: app-js-cleanup**
    // _Requirements: 6.3, 6.4_
    const familyStore = window.useFamilyStore?.();
    const choresStore = window.useChoresStore?.();
    const uiStore = window.useUIStore?.();
    
    return {
      familyStore,
      choresStore,
      uiStore
    };
  },
  
  template: `
    <flyout-panel
      :open="isOpen"
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
    // Props kept for backward compatibility but stores are preferred
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
    // Get open state from uiStore if not provided via prop
    // _Requirements: 6.3, 6.4_
    isOpen() {
      // Prefer prop if explicitly set, otherwise use store
      if (this.open !== undefined && this.open !== false) {
        return this.open;
      }
      return this.uiStore?.isModalOpen?.('defaultOrder') || false;
    },
    // Get member from familyStore if not provided via prop
    // _Requirements: 6.3_
    orderMember() {
      return this.member || this.familyStore?.defaultOrderMember || null;
    },
    // Get quicklist chores from choresStore if not provided via prop
    // _Requirements: 6.3_
    allQuicklistChores() {
      if (this.quicklistChores && this.quicklistChores.length > 0) {
        return this.quicklistChores;
      }
      return this.choresStore?.quicklistChores || [];
    },
    modalTitle() {
      const memberName = this.orderMember?.displayName || this.orderMember?.name || 'Member';
      return `Default Chore Order: ${memberName}`;
    },
    
    /**
     * Get all quicklist chores scheduled for this member
     * _Requirements: 6.3_
     */
    scheduledChoresForMember() {
      if (!this.orderMember || !this.allQuicklistChores) return [];
      
      const memberId = this.orderMember.id;
      return this.allQuicklistChores.filter(chore => {
        // Filter out undefined/null chores
        if (!chore || !chore.id) return false;
        const schedule = chore.schedule || {};
        const memberDays = schedule[memberId];
        return memberDays && Array.isArray(memberDays) && memberDays.length > 0;
      });
    }
  },
  
  watch: {
    // _Requirements: 6.3, 6.4_
    isOpen: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          this.initializeOrder();
        }
      }
    },
    orderMember: {
      deep: true,
      handler() {
        if (this.isOpen) {
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
     * _Requirements: 6.3_
     */
    initializeOrder() {
      const scheduled = this.scheduledChoresForMember;
      const defaultOrder = this.orderMember?.defaultChoreOrder || {};
      
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
      
      // Hide the browser's default drag feedback (Copy/X cursor)
      const emptyImg = new Image();
      emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      event.dataTransfer.setDragImage(emptyImg, 0, 0);
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
     * _Requirements: 6.3_
     */
    async handleSave() {
      // Guard against saving without a member
      if (!this.orderMember?.id) {
        console.warn('[DefaultOrderModal] No member ID, skipping save');
        return;
      }
      
      // Build the defaultOrderMap from current order
      const defaultOrderMap = {};
      this.orderedChores.forEach((chore, index) => {
        defaultOrderMap[chore.id] = index;
      });
      
      // If using stores directly, save via familyStore
      if (this.familyStore?.updateDefaultOrder) {
        this.saving = true;
        try {
          const result = await this.familyStore.updateDefaultOrder(
            this.orderMember.id,
            defaultOrderMap
          );
          
          if (result.success) {
            this.uiStore?.showSuccess('Default order saved');
            this.handleClose();
          } else {
            this.uiStore?.showError(result.error || 'Failed to save default order');
          }
        } catch (error) {
          console.error('Failed to save default order:', error);
          this.uiStore?.showError('Failed to save default order');
        } finally {
          this.saving = false;
        }
      } else {
        // Fallback to emit for backward compatibility
        this.$emit('save', {
          memberId: this.orderMember.id,
          defaultOrderMap
        });
      }
    },
    
    /**
     * Handle close/cancel
     * _Requirements: 6.3, 6.4_
     */
    handleClose() {
      // Close via store if available
      if (this.familyStore?.closeDefaultOrderModal) {
        this.familyStore.closeDefaultOrderModal();
      } else {
        this.$emit('close');
      }
    },
    
    setSaving(value) {
      this.saving = value;
    }
  }
});

// Export component for manual registration
window.DefaultOrderModalComponent = DefaultOrderModal;
