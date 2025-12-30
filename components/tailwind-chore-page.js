// Tailwind Chore Page Component with Reusable Cards
// Using standard Tailwind components instead of custom components

// Register this page as having its own skeleton loading
// This tells AppLoadingState not to show the spinner when on this page
if (window.SkeletonRegistry) {
  window.SkeletonRegistry.register('chores');
}

// Unified Chore Card Component - Shoelace Implementation with Bottom Flyout Actions
// Tap card to show flyout action bar below the card
// Uses slide-panel for reassign member picker
// **Feature: chore-priority** - Supports drag-and-drop reordering for assigned chores
const ChoreCard = {
  template: `
    <div 
      class="chore-card-wrapper min-w-0" 
      :class="{ 
        'chore-card-wrapper--expanded': isElevated,
        'chore-card-wrapper--dragging': isDragging,
        'chore-card-wrapper--drag-over': isDragOver
      }"
      :draggable="isDraggable"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <sl-card
        class="chore-card"
        :class="[
          isElevated ? 'chore-card--expanded' : '',
          chore.completed && type !== 'quicklist' ? 'chore-card--completed' : '',
          isPriority && !chore.completed && type === 'assigned' ? 'chore-card--priority' : '',
          isDragging ? 'chore-card--dragging' : ''
        ]"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @click.stop="handleCardClick"
      >
        <div class="chore-card-content chore-card-split" :class="{ 'has-amount': chore.amount > 0 }">
          <!-- Left section: Drag handle + Priority indicator + Completed indicator + Name -->
          <div class="chore-card-left-section">
            <!-- Drag handle - only for assigned chores with reordering enabled -->
            <div 
              v-if="type === 'assigned' && enableReorder"
              class="chore-drag-handle"
              title="Drag to reorder"
              @mousedown.stop
              @touchstart.stop
            >
              <div v-html="getIcon('gripVertical', 16)"></div>
            </div>
            <!-- Priority indicator (star icon) - only for priority chore -->
            <div 
              v-if="isPriority && !chore.completed && type === 'assigned'" 
              class="chore-priority-indicator"
              title="Priority Chore"
            >
              <div v-html="getIcon('star', 16)"></div>
            </div>

            <!-- Completed checkmark indicator (not interactive) -->
            <div 
              v-if="type !== 'quicklist' && chore.completed" 
              class="chore-completed-indicator"
            >
              <div v-html="getIcon('check', 16)"></div>
            </div>

            <!-- Chore name - grows to fill space -->
            <span
              :class="chore.completed && type !== 'quicklist' ? 'chore-name--completed' : ''"
              class="chore-name"
            >
              {{ chore.name }}
            </span>
          </div>

          <!-- Right section: Money + expand indicator -->
          <div class="chore-card-right-section">
            <!-- Money badge (only if has amount) -->
            <div v-if="chore.amount > 0" class="chore-card-money-row">
              <sl-badge variant="primary" pill class="chore-amount">
                \${{ chore.amount.toFixed(2) }}
              </sl-badge>
            </div>

            <!-- Expand indicator (chevron) - hidden for assigned chores -->
            <div 
              v-if="type === 'quicklist'"
              class="chore-expand-indicator" 
              :class="{ 'chore-expand-indicator--expanded': isExpanded }"
            >
              <div v-html="getIcon('chevronDown', 16)"></div>
            </div>
          </div>
        </div>
      </sl-card>

      <!-- Bottom Flyout Action Bar - positioned below the card -->
      <div 
        class="chore-action-flyout" 
        :class="{ 'chore-action-flyout--expanded': isExpanded }"
        @click.stop
      >
        <slide-panel :active-page="actionPage" @page-change="onPageChange">
          <!-- Main actions page -->
          <template #default>
            <sl-button-group class="chore-action-button-group">
              <!-- Complete/Uncomplete button -->
              <!-- iOS Safari PWA: @touchend.prevent ensures touch events fire reliably -->
              <sl-button 
                v-if="type !== 'quicklist'"
                @click="handleComplete"
                @touchend.prevent="handleComplete"
                variant="primary"
                :title="chore.completed ? 'Undo' : 'Done'"
              >
                <span v-html="getIcon(chore.completed ? 'rotateCcw' : 'check', 20)"></span>
              </sl-button>

              <!-- Approve button (for parents, when pending) -->
              <sl-button 
                v-if="type === 'assigned' && showApprovalButton && chore.isPendingApproval"
                @click="handleApprove"
                @touchend.prevent="handleApprove"
                variant="primary"
                title="Approve"
              >
                <span v-html="getIcon('checkCircle', 20)"></span>
              </sl-button>

              <!-- Reassign button (for assigned chores) -->
              <!-- iOS Safari PWA: @touchend.prevent ensures touch events fire reliably -->
              <sl-button 
                v-if="type === 'assigned' || type === 'unassigned'"
                @click="showReassignPicker($event)"
                @touchend.prevent="showReassignPicker($event)"
                variant="primary"
                title="Reassign"
              >
                <span v-html="getIcon('userPlus', 20)"></span>
              </sl-button>

              <!-- Delete button -->
              <sl-button 
                @click="handleDelete"
                @touchend.prevent="handleDelete"
                variant="primary"
                title="Delete"
              >
                <span v-html="getIcon('trash', 20)"></span>
              </sl-button>
            </sl-button-group>
          </template>

          <!-- Reassign picker page -->
          <template #reassign>
            <div class="chore-reassign-picker">
              <!-- Back button -->
              <!-- iOS Safari PWA: @touchend.prevent ensures touch events fire reliably -->
              <button @click="actionPage = 'default'" @touchend.prevent="actionPage = 'default'" class="chore-action-btn chore-action-btn--back">
                <div v-html="getIcon('arrowLeft', 16)"></div>
              </button>

              <!-- Family member chips -->
              <button 
                v-for="member in familyMembers" 
                :key="member.id"
                @click="handleReassign(member)"
                @touchend.prevent="handleReassign(member)"
                class="avatar-chip"
                :class="{ 'avatar-chip--current': isCurrentAssignee(member) }"
                :disabled="isCurrentAssignee(member)"
              >
                <div class="avatar-chip-circle">{{ getInitial(member) }}</div>
                <span class="avatar-chip-name">{{ member.displayName }}</span>
              </button>

              <!-- Unassigned option -->
              <button 
                v-if="type === 'assigned'"
                @click="handleReassign(null)"
                @touchend.prevent="handleReassign(null)"
                class="avatar-chip avatar-chip--unassigned"
              >
                <div class="avatar-chip-circle">
                  <div v-html="getIcon('inbox', 16)"></div>
                </div>
                <span class="avatar-chip-name">None</span>
              </button>
            </div>
          </template>
        </slide-panel>
      </div>
    </div>
  `,
  components: {
    'slide-panel': window.SlidePanelComponent
  },
  props: {
    chore: { type: Object, required: true },
    type: { type: String, required: true, validator: (value) => ['quicklist', 'unassigned', 'assigned'].includes(value) },
    isExpanded: { type: Boolean, default: false },
    isPriority: { type: Boolean, default: false },  // **Feature: chore-priority** - Highlights this chore as the priority chore
    showApprovalButton: { type: Boolean, default: false },
    familyMembers: { type: Array, default: () => [] },
    Helpers: { type: Object, required: true },
    // **Feature: chore-priority** - Drag-and-drop reordering props
    enableReorder: { type: Boolean, default: false },  // Enable drag-and-drop reordering
    // Event handlers
    onExpand: { type: Function },
    onCollapse: { type: Function },
    onToggleComplete: { type: Function },
    onApprove: { type: Function },
    onDelete: { type: Function },
    onReassign: { type: Function },
    // **Feature: chore-priority** - Drag-and-drop event handlers
    onDragStart: { type: Function },
    onDragEnd: { type: Function },
    onDragOver: { type: Function },
    onDrop: { type: Function }
  },
  data() {
    return {
      touchStartX: null,
      touchStartY: null,
      didScroll: false,
      actionPage: 'default',
      isElevated: false,  // Controls z-index, delayed on collapse
      elevationTimer: null,
      // **Feature: chore-priority** - Drag state
      isDragging: false,
      isDragOver: false
    };
  },
  computed: {
    // **Feature: chore-priority** - Only assigned chores with reorder enabled are draggable
    isDraggable() {
      return this.type === 'assigned' && this.enableReorder;
    }
  },
  watch: {
    // Handle z-index elevation with delay on collapse
    isExpanded(newVal) {
      if (newVal) {
        // Expanding: immediately elevate
        clearTimeout(this.elevationTimer);
        this.isElevated = true;
      } else {
        // Collapsing: delay z-index reset until animation completes (200ms)
        this.elevationTimer = setTimeout(() => {
          this.isElevated = false;
        }, 220);  // Slightly longer than 200ms animation
        this.actionPage = 'default';
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this.elevationTimer);
  },
  methods: {
    getIcon(name, size) {
      return this.Helpers?.IconLibrary?.getIcon?.(name, 'lucide', size, 'currentColor') || '';
    },
    handleTouchStart(event) {
      if (event.touches && event.touches.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.didScroll = false;
      }
    },
    handleTouchMove(event) {
      if (this.touchStartX === null || this.touchStartY === null) return;
      if (event.touches && event.touches.length > 0) {
        const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
        if (deltaX > 10 || deltaY > 10) {
          this.didScroll = true;
        }
      }
    },
    handleCardClick() {
      // Ignore scroll gestures
      if (this.didScroll) {
        this.didScroll = false;
        this.touchStartX = null;
        this.touchStartY = null;
        return;
      }
      this.touchStartX = null;
      this.touchStartY = null;
      
      // Toggle expansion
      if (this.isExpanded) {
        this.onCollapse?.(this.chore);
      } else {
        this.onExpand?.(this.chore);
      }
    },
    handleComplete() {
      const newState = !this.chore.completed;
      this.onToggleComplete?.(this.chore, { target: { checked: newState } });
      this.onCollapse?.(this.chore);
    },
    handleApprove() {
      this.onApprove?.(this.chore);
      this.onCollapse?.(this.chore);
    },
    handleDelete() {
      this.onDelete?.(this.chore);
      this.onCollapse?.(this.chore);
    },
    showReassignPicker(event) {
      // Prevent double-firing from both click and touchend
      if (this._reassignDebounce) return;
      this._reassignDebounce = true;
      setTimeout(() => { this._reassignDebounce = false; }, 300);
      
      console.log('[REASSIGN] showReassignPicker called, event type:', event?.type);
      this.actionPage = 'reassign';
    },
    handleReassign(member) {
      this.onReassign?.(this.chore, member);
      this.actionPage = 'default';
      this.onCollapse?.(this.chore);
    },
    onPageChange() {
      // Could add analytics or other side effects here
    },
    isCurrentAssignee(member) {
      return this.chore.assignedTo === member.displayName;
    },
    getInitial(member) {
      return (member.displayName || member.name || '?').charAt(0).toUpperCase();
    },
    // **Feature: chore-priority** - Drag-and-drop handlers
    // **Validates: Requirements 4.1**
    handleDragStart(event) {
      if (!this.isDraggable) return;
      
      this.isDragging = true;
      
      // Set drag data with chore ID
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', this.chore.id);
      event.dataTransfer.setData('application/json', JSON.stringify({
        choreId: this.chore.id,
        choreName: this.chore.name
      }));
      
      // Hide the browser's default drag feedback (Copy/X cursor)
      // by setting a transparent 1x1 pixel drag image
      const emptyImg = new Image();
      emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      event.dataTransfer.setDragImage(emptyImg, 0, 0);
      
      // Notify parent
      this.onDragStart?.(this.chore, event);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      this.isDragOver = false;
      
      // Notify parent
      this.onDragEnd?.(this.chore, event);
    },
    handleDragOver(event) {
      if (!this.isDraggable) return;
      
      // Only show drag-over state if this isn't the dragged item
      const draggedChoreId = event.dataTransfer.getData('text/plain');
      if (draggedChoreId !== this.chore.id) {
        this.isDragOver = true;
      }
      
      // Notify parent
      this.onDragOver?.(this.chore, event);
    },
    handleDragLeave(_event) {
      this.isDragOver = false;
    },
    handleDrop(event) {
      this.isDragOver = false;
      
      // Get the dragged chore ID
      const draggedChoreId = event.dataTransfer.getData('text/plain');
      
      // Don't drop on self
      if (draggedChoreId === this.chore.id) return;
      
      // Notify parent with both chore IDs
      this.onDrop?.(draggedChoreId, this.chore.id, event);
    }
  }
};

// Legacy ChoreCard for quicklist (simpler, no expand)
// eslint-disable-next-line no-unused-vars
const QuicklistChoreCard = {
  template: `
    <sl-card
      class="chore-card"
      :class="[isSelected ? 'chore-card--selected' : '']"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @click.stop="handleClick"
    >
      <div class="chore-card-content chore-card-split" :class="{ 'has-amount': chore.amount > 0 }">
        <div class="chore-card-left-section">
          <span class="chore-name">{{ chore.name }}</span>
        </div>
        <div class="chore-card-right-section">
          <div v-if="chore.amount > 0" class="chore-card-money-row">
            <sl-badge variant="primary" pill class="chore-amount">
              \${{ chore.amount.toFixed(2) }}
            </sl-badge>
          </div>
          <div class="chore-card-actions-row">
            <button @click.stop="handleDelete" class="chore-delete-btn" title="Remove from quicklist">
              <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('trash', 'lucide', 18, 'text-white') : ''"></div>
            </button>
          </div>
        </div>
      </div>
    </sl-card>
  `,
  props: {
    chore: { type: Object, required: true },
    isSelected: { type: Boolean, default: false },
    Helpers: { type: Object, required: true },
    onClick: { type: Function, required: true },
    onDelete: { type: Function }
  },
  data() {
    return { touchStartX: null, touchStartY: null, didScroll: false };
  },
  methods: {
    handleTouchStart(event) {
      if (event.touches?.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.didScroll = false;
      }
    },
    handleTouchMove(event) {
      if (this.touchStartX === null) return;
      if (event.touches?.length > 0) {
        const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
        if (deltaX > 10 || deltaY > 10) this.didScroll = true;
      }
    },
    handleClick(event) {
      if (this.didScroll) {
        this.didScroll = false;
        return;
      }
      this.onClick(this.chore, event);
    },
    handleDelete() {
      this.onDelete?.(this.chore);
    }
  }
};

// Legacy component aliases for backward compatibility (not used in current implementation)

const PersonCard = {
  template: `
    <div
      class="person-card border-2 rounded-xl p-6 transition-all duration-200 shadow-lg hover:shadow-xl min-w-0"
      :class="[canAssign ? 'cursor-pointer hover:scale-102' : '']"
      :style="{ 
        borderColor: 'var(--color-border-card)', 
        backgroundColor: canAssign ? 'var(--color-surface-2)' : 'var(--color-surface-1)'
      }"
      @click="handleCardClick"
    >
      <!-- Person header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style="background: linear-gradient(to bottom right, var(--color-primary-500), var(--color-primary-600));">
            {{ personDisplayName.charAt(0) }}
          </div>
          <div>
            <h3 class="font-bold text-xl" style="color: var(--color-text-primary);">{{ personDisplayName }}</h3>
          </div>
        </div>

        <!-- Electronics status -->
        <div class="flex items-center gap-2">
          <div :style="getElectronicsStatusStyle(person.electronicsStatus.status)" class="px-2 py-1 rounded-full text-xs font-medium">
            {{ getElectronicsStatusText(person.electronicsStatus.status) }}
          </div>
        </div>
      </div>

      <!-- Person's chores (sorted by priority) with drag-and-drop reordering -->
      <!-- **Feature: chore-priority** - Drag-and-drop reordering -->
      <!-- **Validates: Requirements 4.1** -->
      <div 
        class="chore-list-container space-y-2 min-h-[60px]" 
        :class="{ 'chore-list-container--reordering': isReordering }"
        @click.stop
      >
        <div v-if="!personChores || personChores.length === 0" class="text-center py-6" style="color: var(--color-text-secondary);">
          <p class="text-sm">No chores assigned</p>
          <p class="text-xs mt-1">Select a chore and tap here to assign it</p>
        </div>

        <chore-card
          v-for="chore in sortedChores"
          :key="chore.id"
          :chore="chore"
          type="assigned"
          :is-expanded="expandedChoreId === chore.id"
          :is-priority="chore.id === priorityChoreId"
          :show-approval-button="showApprovalButton"
          :family-members="familyMembers"
          :Helpers="Helpers"
          :enable-reorder="enableReorder"
          :on-expand="handleChoreExpand"
          :on-collapse="handleChoreCollapse"
          :on-toggle-complete="(c, event) => onChoreToggle(c, event)"
          :on-approve="(c) => onChoreApprove(c)"
          :on-delete="(c) => onChoreDelete(c)"
          :on-reassign="handleChoreReassign"
          :on-drag-start="handleChoreDragStart"
          :on-drag-end="handleChoreDragEnd"
          :on-drag-over="handleChoreDragOver"
          :on-drop="handleChoreDrop"
        />
      </div>
    </div>
  `,
  props: {
    person: { type: Object, required: true },
    personChores: { type: Array, default: () => [] },
    familyMembers: { type: Array, default: () => [] },
    canAssign: { type: Boolean, default: false },
    showApprovalButton: { type: Boolean, default: false },
    expandedChoreId: { type: String, default: null },
    Helpers: { type: Object, required: true },
    // **Feature: chore-priority** - Enable drag-and-drop reordering
    enableReorder: { type: Boolean, default: true },
    onAssign: { type: Function, required: true },
    onChoreExpand: { type: Function },
    onChoreCollapse: { type: Function },
    onChoreToggle: { type: Function, required: true },
    onChoreApprove: { type: Function, required: true },
    onChoreDelete: { type: Function, required: true },
    onChoreReassign: { type: Function },
    // **Feature: chore-priority** - Reorder callback
    onChoreReorder: { type: Function }
  },
  components: {
    ChoreCard
  },
  data() {
    return {
      // **Feature: chore-priority** - Track reordering state
      isReordering: false,
      draggedChoreId: null
    };
  },
  computed: {
    personDisplayName() {
      return this.person.displayName || this.person.name || '';
    },
    /**
     * Get the chore sort order map for this person
     * **Feature: chore-priority**
     * **Validates: Requirements 3.2**
     */
    choreSortOrder() {
      return this.person.choreSortOrder || {};
    },
    /**
     * Sort chores by priority (sort order)
     * Chores with lower sort order appear first
     * Chores without sort order go to the end
     * **Feature: chore-priority**
     * **Validates: Requirements 3.2**
     */
    sortedChores() {
      if (!this.personChores || this.personChores.length === 0) {
        return [];
      }
      
      const sortOrder = this.choreSortOrder;
      
      // Sort by sort order (chores without order go to end with Infinity)
      return [...this.personChores].sort((a, b) => {
        const orderA = sortOrder[a.id] ?? Infinity;
        const orderB = sortOrder[b.id] ?? Infinity;
        return orderA - orderB;
      });
    },
    /**
     * Compute the priority chore ID (lowest sort order among incomplete chores)
     * **Feature: chore-priority**
     * **Validates: Requirements 2.1, 3.1**
     */
    priorityChoreId() {
      // Use the global computePriorityChore function if available
      if (typeof window.computePriorityChore === 'function') {
        const priorityChore = window.computePriorityChore(this.personChores, this.choreSortOrder);
        return priorityChore ? priorityChore.id : null;
      }
      
      // Fallback: compute locally
      const incompleteChores = (this.personChores || []).filter(c => !c.completed);
      if (incompleteChores.length === 0) return null;
      
      const sortOrder = this.choreSortOrder;
      const sorted = [...incompleteChores].sort((a, b) => {
        const orderA = sortOrder[a.id] ?? Infinity;
        const orderB = sortOrder[b.id] ?? Infinity;
        return orderA - orderB;
      });
      
      return sorted[0]?.id || null;
    }
  },
  methods: {
    handleCardClick() {
      // Only trigger assign if canAssign and not clicking on a chore
      if (this.canAssign) {
        this.onAssign();
      }
    },
    handleChoreExpand(chore) {
      this.onChoreExpand?.(chore);
    },
    handleChoreCollapse(chore) {
      this.onChoreCollapse?.(chore);
    },
    handleChoreReassign(chore, member) {
      this.onChoreReassign?.(chore, member);
    },
    getElectronicsStatusStyle(status) {
      // Use CSS variables for theme-aware status colors
      switch(status) {
        case 'allowed': return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
        case 'restricted': return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' };
        case 'blocked': return { backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error-text)' };
        default: return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
      }
    },
    getElectronicsStatusText(status) {
      switch(status) {
        case 'allowed': return 'Allowed';
        case 'restricted': return 'Limited';
        case 'blocked': return 'Blocked';
        default: return 'Allowed';
      }
    },
    // **Feature: chore-priority** - Drag-and-drop handlers
    // **Validates: Requirements 4.1, 4.2**
    handleChoreDragStart(chore, _event) {
      this.isReordering = true;
      this.draggedChoreId = chore.id;
      console.log('[DRAG] Started dragging chore:', chore.name);
    },
    handleChoreDragEnd(chore, _event) {
      this.isReordering = false;
      this.draggedChoreId = null;
      console.log('[DRAG] Ended dragging chore:', chore.name);
    },
    handleChoreDragOver(_chore, _event) {
      // Visual feedback is handled by ChoreCard component
    },
    /**
     * Handle dropping a chore onto another chore to reorder
     * Builds new sort order and calls parent callback
     * 
     * @param {string} draggedChoreId - ID of the chore being dragged
     * @param {string} targetChoreId - ID of the chore being dropped onto
     * @param {DragEvent} event - The drop event
     * 
     * **Feature: chore-priority**
     * **Validates: Requirements 4.1, 4.2**
     */
    handleChoreDrop(draggedChoreId, targetChoreId, _event) {
      console.log('[DROP] Dropping chore', draggedChoreId, 'onto', targetChoreId);
      
      // Get current sorted order
      const currentOrder = this.sortedChores.map(c => c.id);
      
      // Find indices
      const draggedIndex = currentOrder.indexOf(draggedChoreId);
      const targetIndex = currentOrder.indexOf(targetChoreId);
      
      if (draggedIndex === -1 || targetIndex === -1) {
        console.warn('[DROP] Could not find chore indices');
        return;
      }
      
      // Remove dragged item and insert at target position
      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedChoreId);
      
      console.log('[DROP] New order:', newOrder);
      
      // Notify parent with new order
      this.onChoreReorder?.(this.person.id, newOrder);
      
      // Reset drag state
      this.isReordering = false;
      this.draggedChoreId = null;
    }
  }
};

const EarningsCard = {
  template: `
    <div
      class="border-2 rounded-xl p-6 cursor-pointer hover:shadow-xl hover:scale-102 transition-all duration-200 shadow-lg select-none"
      style="background-color: var(--color-primary-500); border-color: var(--color-primary-600); -webkit-tap-highlight-color: transparent;"
      @touchstart.passive="handleTouchStart"
      @touchmove.passive="handleTouchMove"
      @click.stop="handleClick"
    >
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <h3 class="font-bold text-white text-xl">{{ person.displayName || person.name }}</h3>
          <p class="text-sm text-white text-opacity-90">Total Earnings</p>
          <p class="text-xs text-white text-opacity-80 mt-1">
            {{ completedChoresCount }} chores completed
          </p>
        </div>
        <div class="text-right">
          <p class="text-4xl font-bold text-white">\${{ person.earnings.toFixed(2) }}</p>
        </div>
      </div>
    </div>
  `,
  props: {
    person: { type: Object, required: true },
    onClick: { type: Function, required: true }
  },
  data() {
    return {
      touchStartX: null,
      touchStartY: null,
      didScroll: false
    };
  },
  computed: {
    completedChoresCount() {
      return this.person.completedChores || 0;
    }
  },
  methods: {
    handleTouchStart(event) {
      if (event.touches && event.touches.length > 0) {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
        this.didScroll = false;
      }
    },
    handleTouchMove(event) {
      if (this.touchStartX === null || this.touchStartY === null) return;
      if (event.touches && event.touches.length > 0) {
        const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
        const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);
        if (deltaX > 10 || deltaY > 10) {
          this.didScroll = true;
        }
      }
    },
    handleClick() {
      if (this.didScroll) {
        this.didScroll = false;
        this.touchStartX = null;
        this.touchStartY = null;
        return;
      }
      this.touchStartX = null;
      this.touchStartY = null;
      // Capture scroll position IMMEDIATELY at click time, before any async processing
      // Store it globally so flyout-panel can access it
      window.__flyoutScrollY = window.scrollY;
      console.log('🎯 EarningsCard click - captured scroll:', window.__flyoutScrollY);
      this.onClick();
    }
  }
};

// Main Component
const TailwindChorePage = Vue.defineComponent({
  name: 'TailwindChorePage',
  template: `
    <div class="chore-page-layout">
      <!-- Main Content Column -->
      <div class="chore-page-main space-y-6 pb-24 sm:pb-0">
        <!-- Loading Skeleton State -->
        <div v-if="loading" class="space-y-6">
          <!-- Quicklist Skeleton -->
          <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-border-card);">
            <sl-skeleton effect="pulse" class="skeleton-header mb-6"></sl-skeleton>
            <sl-skeleton effect="pulse" class="skeleton-subtext mb-6"></sl-skeleton>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <sl-skeleton v-for="n in 4" :key="'ql-'+n" effect="pulse" class="skeleton-card"></sl-skeleton>
            </div>
          </div>
          
          <!-- Unassigned Skeleton -->
          <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-border-card);">
            <sl-skeleton effect="pulse" class="skeleton-header mb-6"></sl-skeleton>
            <div class="space-y-4">
              <sl-skeleton v-for="n in 2" :key="'ua-'+n" effect="pulse" class="skeleton-card"></sl-skeleton>
            </div>
          </div>
          
          <!-- Family Members Skeleton -->
          <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-border-card);">
            <sl-skeleton effect="pulse" class="skeleton-header mb-6"></sl-skeleton>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="n in 2" :key="'fm-'+n" class="border-2 rounded-xl p-6" style="border-color: var(--color-border-card);">
                <div class="flex items-center gap-3 mb-4">
                  <sl-skeleton effect="pulse" class="skeleton-avatar"></sl-skeleton>
                  <sl-skeleton effect="pulse" class="skeleton-name"></sl-skeleton>
                </div>
                <div class="space-y-3">
                  <sl-skeleton v-for="m in 2" :key="'fc-'+n+'-'+m" effect="pulse" class="skeleton-card"></sl-skeleton>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Earnings Skeleton -->
          <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-border-card);">
            <sl-skeleton effect="pulse" class="skeleton-header mb-6"></sl-skeleton>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <sl-skeleton v-for="n in 2" :key="'ea-'+n" effect="pulse" class="skeleton-earnings"></sl-skeleton>
            </div>
          </div>
        </div>

        <!-- Actual Content (when not loading) -->
        <template v-else>
        <!-- Quicklist Section with Category Accordions -->
        <quicklist-section
          :quicklist-chores="quicklistChores"
          :categories="categories"
          :loading="quicklistLoading"
          :error="quicklistError"
          :selected-chore-id="selectedChoreId"
          @chore-click="onQuicklistClick"
          @delete-chore="removeFromQuicklist"
          @add-chore="openAddToQuicklistModal"
          @retry="loadQuicklistChores"
          @manage-categories="openCategoryManagementModal"
          @category-changed="onQuicklistCategoryChanged"
          @open-schedule="openScheduleModal"
        />

        <!-- Unassigned Chores -->
        <div class="w-full">
        <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-primary-200);">
          <h2 class="text-2xl font-bold leading-tight mb-6 flex items-center gap-2" style="color: var(--color-text-primary);">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('clipboardList', 'lucide', 20, 'text-primary-500') : ''" style="color: var(--color-text-primary);"></div>
            Unassigned Chores
          </h2>

          <!-- Inner container for chores -->
          <div
            class="min-h-[120px] rounded-lg p-6 transition-all duration-200"
            style="background: var(--color-surface-2);"
            :class="[selectedChore ? 'cursor-pointer hover:shadow-lg hover:scale-102' : '']"
            @click="selectedChore ? assignSelectedChore('unassigned') : null"
          >
            <!-- Empty state when no chores -->
            <div v-if="choresByPerson.unassigned.length === 0" class="text-center py-6 flex flex-col items-center justify-center" style="color: var(--color-text-secondary);">
              <p class="text-sm px-2">No unassigned chores</p>
              <p class="text-xs mt-2 px-2">Create new chores here - they'll be available for any family member to pick up</p>
            </div>

            <!-- Container for chores -->
            <div v-else class="space-y-2 mb-6" @click.stop>
              <chore-card
                v-for="chore in choresByPerson.unassigned"
                :key="chore.id"
                :chore="chore"
                type="unassigned"
                :is-expanded="expandedChoreId === chore.id"
                :family-members="people"
                :Helpers="Helpers"
                :on-expand="handleChoreExpand"
                :on-collapse="handleChoreCollapse"
                :on-delete="() => deleteChore(chore)"
                :on-reassign="handleChoreReassign"
              />
            </div>

            <!-- Add new chore button -->
            <div class="flex items-center justify-center">
              <button
                @click.stop="openAddChoreModal()"
                class="btn-primary flex items-center gap-2 px-6 py-4 rounded-xl min-h-[48px] w-full sm:w-auto justify-center"
                title="Add new chore to unassigned"
              >
                <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-white') : ''"></div>
                <span>Add New Chore</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Family Members & Assigned Chores -->
      <div class="w-full">
        <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-primary-200);">
          <h2 class="text-2xl font-bold leading-tight mb-6 flex items-center gap-2" style="color: var(--color-text-primary);">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('users', 'lucide', 20, 'text-primary-500') : ''" style="color: var(--color-text-primary);"></div>
            Family Members
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <person-card
              v-for="person in people"
              :key="person.id"
              :person="person"
              :person-chores="choresByPerson[person.displayName] || []"
              :family-members="people"
              :can-assign="!!selectedChore"
              :show-approval-button="currentUser?.role === 'parent'"
              :expanded-chore-id="expandedChoreId"
              :Helpers="Helpers"
              :enable-reorder="currentUser?.role === 'parent'"
              :on-assign="() => assignSelectedChore(person.displayName)"
              :on-chore-expand="handleChoreExpand"
              :on-chore-collapse="handleChoreCollapse"
              :on-chore-toggle="handleChoreCompletionToggle"
              :on-chore-approve="approveChore"
              :on-chore-delete="deleteChore"
              :on-chore-reassign="handleChoreReassign"
              :on-chore-reorder="handleChoreReorder"
            />
          </div>
        </div>
      </div>

      <!-- Earnings Summary -->
      <div class="w-full">
        <div class="rounded-xl shadow-lg border p-6" style="background: var(--color-surface-1); border-color: var(--color-primary-200);">
          <h2 class="text-2xl font-bold leading-tight mb-6 flex items-center gap-2" style="color: var(--color-text-primary);">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('dollar-sign', 'lucide', 20, 'text-primary-500') : ''" style="color: var(--color-text-primary);"></div>
            Earnings Summary
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <earnings-card
              v-for="person in people"
              :key="person.id"
              :person="person"
              :on-click="() => openSpendModal(person)"
            />
          </div>
        </div>
      </div>
      </template>
      </div>
      
      <!-- Calendar Sidebar (desktop only) -->
      <aside class="chore-page-sidebar">
        <week-calendar-panel />
      </aside>
    </div>
  `,
  inject: [
    'people', 'choresByPerson', 'selectedChore', 'selectedChoreId', 'selectedQuicklistChore',
    'quicklistChores', 'categories', 'loading', 'error', 'Helpers', 'CONFIG', 'currentUser',
    'showAddChoreModal', 'showAddToQuicklistModal',
    'handleChoreClick', 'handleQuicklistChoreClick', 'selectionStore'
  ],
  mixins: [window.TouchAwareMixin || {}],
  components: {
    ChoreCard,
    PersonCard,
    EarningsCard,
    'week-calendar-panel': window.WeekCalendarPanel
  },
  data() {
    return {
      quicklistLoading: false,
      quicklistError: null,
      expandedChoreId: null  // Track which chore's action panel is expanded
    }
  },
  // NOTE: Data is preloaded by parent app.js in loadAllData() - no need to load on mount
  // This prevents the double-load issue where data appears, then loading bar shows again
  mounted() {
    console.log('🎯 Chores page mounted with preloaded data');
  },
  methods: {
    openAddToQuicklistModal() {
      const fn = this.$parent?.openAddToQuicklistModal || this.openAddToQuicklistModal;
      if (typeof fn === 'function') fn();
    },
    openAddChoreModal() {
      const fn = this.$parent?.openAddChoreModal || this.openAddChoreModal;
      if (typeof fn === 'function') fn();
    },
    showMultiAssignModal(quicklistChore) {
      console.log('🚀 showMultiAssignModal called with:', quicklistChore?.name);
      console.log('🔍 Checking if $parent.openMultiAssignModal exists:', !!this.$parent?.openMultiAssignModal);

      if (this.$parent?.openMultiAssignModal) {
        console.log('✅ Calling $parent.openMultiAssignModal');
        this.$parent.openMultiAssignModal(quicklistChore);
        console.log('✅ $parent.openMultiAssignModal executed');
      } else {
        console.warn('❌ $parent.openMultiAssignModal method not found');
      }
    },
    // Open category management modal - Requirements 1.1
    openCategoryManagementModal() {
      if (this.$parent?.openCategoryManagementModal) {
        this.$parent.openCategoryManagementModal();
      } else {
        console.warn('❌ $parent.openCategoryManagementModal method not found');
      }
    },
    
    // Handle category change for a quicklist chore
    async onQuicklistCategoryChanged({ chore, categoryId, categoryName }) {
      if (this.$parent?.updateQuicklistCategory) {
        await this.$parent.updateQuicklistCategory(chore, categoryId, categoryName);
      } else {
        console.warn('❌ $parent.updateQuicklistCategory method not found');
      }
    },
    
    // Open schedule modal for a quicklist chore
    // **Feature: weekly-chore-scheduling**
    // **Validates: Requirements 1.2, 1.3, 1.5**
    openScheduleModal(quicklistChore) {
      if (this.$parent?.openScheduleModal) {
        this.$parent.openScheduleModal(quicklistChore);
      } else {
        console.warn('❌ $parent.openScheduleModal method not found');
      }
    },

    // Quicklist methods
    async loadQuicklistChores() {
      this.quicklistLoading = true;
      this.quicklistError = null;
      try {
        await this.$parent.loadQuicklistChores();
      } catch (error) {
        this.quicklistError = error.message;
      } finally {
        this.quicklistLoading = false;
      }
    },

    async removeFromQuicklist(quicklistId) {
      try {
        await this.$parent.apiCall(`${this.CONFIG.API.ENDPOINTS.QUICKLIST}/${quicklistId}`, {
          method: 'DELETE'
        });
        await this.loadQuicklistChores();
      } catch (error) {
        console.error('Failed to remove from quicklist:', error);
      }
    },

    // Regular chore methods
    isChoreSelected(chore) {
      return this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, chore) || false;
    },

    isQuicklistChoreSelected(quickChore) {
      return this.Helpers?.isChoreSelected?.(this.selectedChoreId, this.selectedQuicklistChore, quickChore) || false;
    },

    selectChore(chore) {
      // Touch scroll detection is now handled by ChoreCard component
      if (chore.isSelecting) return;
      chore.isSelecting = true;

      try {
        if (this.selectedChore &&
            this.selectedChoreId !== chore.id &&
            chore.assignedTo &&
            chore.assignedTo !== 'unassigned') {
          this.assignSelectedChore(chore.assignedTo);
          this.selectedChoreId = null;
          this.selectedQuicklistChore = null;
          return;
        }

        const handler = this.selectionStore?.selectChore || this.handleChoreClick || this.$parent?.handleChoreClick;
        if (typeof handler === 'function') {
          handler(chore);
        } else {
          console.warn('handleChoreClick not available');
        }
      } finally {
        setTimeout(() => {
          chore.isSelecting = false;
        }, 100);
      }
    },

    onQuicklistClick(quickChore) {
      console.log('🎯 Quicklist chore clicked:', quickChore.name);
      // Touch scroll detection is now handled by ChoreCard component
      if (quickChore.isSelecting) {
        console.log('⚠️ Chore is already being selected, skipping');
        return;
      }
      quickChore.isSelecting = true;

      try {
        console.log('🔄 Calling showMultiAssignModal for:', quickChore.name);
        // Show multi-assignment modal instead of selecting the chore
        this.showMultiAssignModal(quickChore);
        console.log('✅ showMultiAssignModal called successfully');
      } finally {
        setTimeout(() => {
          quickChore.isSelecting = false;
        }, 100);
      }
    },

    async deleteChore(chore) {
      if (chore) {
        await this.$parent.deleteChore(chore);
      }
    },

    async assignSelectedChore(assignTo) {
      await this.$parent.assignSelectedChore(assignTo);
    },

    async handleChoreCompletionToggle(chore, event) {
      // Safely handle event object
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
        event.stopPropagation();
      }

      // Get the checked state safely
      const newCompletedState = event && event.target ? event.target.checked : !chore.completed;
      chore.completed = newCompletedState;

      await this.$parent.handleChoreCompletion(chore);
    },

    async approveChore(chore) {
      await this.$parent.approveChore(chore);
    },

    openSpendModal(person) {
      if (this.$parent.openSpendingModal) {
        this.$parent.openSpendingModal(person);
      }
    },

    // Chore expansion handlers for tap-to-expand action panel
    handleChoreExpand(chore) {
      // Collapse any other expanded chore and expand this one
      this.expandedChoreId = chore.id;
    },

    handleChoreCollapse(chore) {
      // Only collapse if this is the currently expanded chore
      if (this.expandedChoreId === chore.id) {
        this.expandedChoreId = null;
      }
    },

    // Handle reassigning a chore to a different family member
    async handleChoreReassign(chore, member) {
      // Use 'unassigned' string for the "None" option (backend expects this, not null)
      const newAssignee = member ? member.displayName : 'unassigned';
      
      // Don't reassign to same person
      if (chore.assignedTo === newAssignee) {
        return;
      }

      try {
        // Use the parent app's reassignChore method (not the Pinia store)
        if (this.$parent?.reassignChore) {
          await this.$parent.reassignChore(chore, newAssignee);
        } else {
          console.warn('reassignChore method not found on parent');
        }
        
        // Collapse the action panel after successful reassign
        this.expandedChoreId = null;
      } catch (error) {
        console.error('Failed to reassign chore:', error);
      }
    },

    /**
     * Handle chore reordering via drag-and-drop
     * Calls the family store to update sort order
     * 
     * @param {string} memberId - Family member ID
     * @param {string[]} orderedChoreIds - Array of chore IDs in new order
     * 
     * **Feature: chore-priority**
     * **Validates: Requirements 4.1, 4.2**
     */
    async handleChoreReorder(memberId, orderedChoreIds) {
      console.log('[REORDER] Reordering chores for member:', memberId, 'New order:', orderedChoreIds);
      
      const useFamilyStore = window.useFamilyStore;
      if (!useFamilyStore) {
        console.error('[REORDER] Family store not available');
        return;
      }
      
      const familyStore = useFamilyStore();
      const useUIStore = window.useUIStore;
      const uiStore = useUIStore ? useUIStore() : null;
      
      try {
        const result = await familyStore.reorderChores(memberId, orderedChoreIds);
        
        if (result.success) {
          console.log('[REORDER] Successfully reordered chores');
          if (uiStore) {
            uiStore.showSuccess('Chore order updated');
          }
        } else {
          console.error('[REORDER] Failed to reorder chores:', result.error);
          if (uiStore) {
            uiStore.showError(result.error || 'Failed to update chore order');
          }
        }
      } catch (error) {
        console.error('[REORDER] Error reordering chores:', error);
        if (uiStore) {
          uiStore.showError('Failed to update chore order');
        }
      }
    }
  }
});

// Export component for manual registration
window.TailwindChorePageComponent = TailwindChorePage;
