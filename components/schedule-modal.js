// Schedule Modal Component
// Modal for managing day-of-week schedules for quicklist chores
// **Feature: weekly-chore-scheduling, app-js-cleanup**
// **Validates: Requirements 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 8.1, 8.2, 8.3, 8.4**
// _Requirements: 6.2, 6.4_

const ScheduleModal = Vue.defineComponent({
  name: 'ScheduleModal',
  
  setup() {
    // Use stores directly instead of inject
    // **Feature: app-js-cleanup**
    // _Requirements: 6.2, 6.4_
    const choresStore = window.useChoresStore?.();
    const familyStore = window.useFamilyStore?.();
    const uiStore = window.useUIStore?.();
    
    return {
      choresStore,
      familyStore,
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
      width="620px"
    >
      <template #default>
        <div class="schedule-modal-content">
          <!-- Instructions -->
          <p class="text-sm text-secondary-custom mb-4">
            Select which days each family member should do this chore.
          </p>
          
          <!-- Day Labels Header (M T W T F S S) - Requirements 1.4 -->
          <div class="schedule-day-header">
            <div class="schedule-member-label"></div>
            <div class="schedule-days-row">
              <span 
                v-for="day in dayLabels" 
                :key="day.code" 
                class="schedule-day-label"
                :title="day.full"
              >
                {{ day.short }}
              </span>
            </div>
          </div>
          
          <!-- Family Members with Day Toggles - Requirements 1.2 -->
          <div class="schedule-members-list">
            <div 
              v-for="member in members" 
              :key="member.id"
              class="schedule-member-row"
            >
              <!-- Member Name -->
              <div class="schedule-member-label">
                <span class="schedule-member-name">{{ member.displayName || member.name }}</span>
              </div>
              
              <!-- Days and Shortcuts Container -->
              <div class="schedule-days-container">
                <!-- Day Toggle Pills -->
                <div class="schedule-days-row">
                  <button
                    v-for="day in dayLabels"
                    :key="day.code"
                    type="button"
                    class="schedule-day-toggle"
                    :class="{ 'schedule-day-toggle--selected': isDaySelected(member.id, day.code) }"
                    :aria-pressed="isDaySelected(member.id, day.code)"
                    :aria-label="day.full + ' for ' + (member.displayName || member.name)"
                    @click="toggleDay(member.id, day.code)"
                  >
                    {{ day.short }}
                  </button>
                </div>
                
                <!-- Shortcut Buttons Row - positioned under their respective days -->
                <div class="schedule-shortcuts-row">
                  <button
                    type="button"
                    class="schedule-shortcut-btn schedule-shortcut-btn--weekday"
                    title="Select Monday through Friday"
                    @click="setWeekdays(member.id)"
                  >
                    Weekday
                  </button>
                  <button
                    type="button"
                    class="schedule-shortcut-btn schedule-shortcut-btn--weekend"
                    title="Select Saturday and Sunday"
                    @click="setWeekends(member.id)"
                  >
                    Weekend
                  </button>
                </div>
                
                <!-- Daily button - full width -->
                <button
                  type="button"
                  class="schedule-shortcut-btn schedule-shortcut-btn--daily"
                  title="Select all seven days"
                  @click="setDaily(member.id)"
                >
                  Daily
                </button>
              </div>
            </div>
          </div>
          
          <!-- Empty state if no family members -->
          <div v-if="!members || members.length === 0" class="schedule-empty-state">
            <div v-html="getIcon('users', 32)" style="color: var(--color-neutral-400);"></div>
            <p class="text-sm text-secondary-custom mt-2">No family members found</p>
          </div>
        </div>
      </template>
      
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button
            @click="handleSave"
            @touchend.prevent="handleSave"
            :disabled="saving"
            class="flex-1 btn-primary btn-compact px-3 py-1.5 text-sm flex items-center justify-center gap-2"
          >
            <div v-if="saving" class="animate-spin" v-html="getIcon('loader', 16)"></div>
            {{ saving ? 'Saving...' : 'Save Schedule' }}
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
    quicklistChore: {
      type: Object,
      default: null
    },
    familyMembers: {
      type: Array,
      default: () => []
    }
  },
  
  emits: ['save', 'close'],
  
  data() {
    return {
      // Local copy of schedule for editing
      localSchedule: {},
      saving: false,
      // Day configuration - starting Monday per Requirements 1.4
      dayLabels: [
        { code: 'mon', short: 'M', full: 'Monday' },
        { code: 'tue', short: 'T', full: 'Tuesday' },
        { code: 'wed', short: 'W', full: 'Wednesday' },
        { code: 'thu', short: 'T', full: 'Thursday' },
        { code: 'fri', short: 'F', full: 'Friday' },
        { code: 'sat', short: 'S', full: 'Saturday' },
        { code: 'sun', short: 'S', full: 'Sunday' }
      ],
      // Shortcut day sets
      weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      weekends: ['sat', 'sun'],
      allDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    };
  },
  
  computed: {
    // Get open state from uiStore if not provided via prop
    // _Requirements: 6.2, 6.4_
    isOpen() {
      // Prefer prop if explicitly set, otherwise use store
      if (this.open !== undefined && this.open !== false) {
        return this.open;
      }
      return this.uiStore?.isModalOpen?.('schedule') || false;
    },
    // Get quicklist chore from choresStore if not provided via prop
    // _Requirements: 6.2_
    scheduleChore() {
      return this.quicklistChore || this.choresStore?.scheduleModalChore || null;
    },
    // Get family members from familyStore if not provided via prop
    // Filter out any undefined/null members to prevent template errors
    // _Requirements: 6.2_
    members() {
      let memberList = [];
      if (this.familyMembers && this.familyMembers.length > 0) {
        memberList = this.familyMembers;
      } else {
        memberList = this.familyStore?.enabledMembers || [];
      }
      // Filter out undefined/null members
      return memberList.filter(m => m && m.id);
    },
    modalTitle() {
      const choreName = this.scheduleChore?.name || 'Chore';
      return `Schedule: ${choreName}`;
    }
  },
  
  watch: {
    // Reset local schedule when modal opens or chore changes
    // _Requirements: 6.2, 6.4_
    isOpen: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          this.initializeSchedule();
        }
      }
    },
    scheduleChore: {
      deep: true,
      handler() {
        if (this.isOpen) {
          this.initializeSchedule();
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
     * Initialize local schedule from scheduleChore
     * _Requirements: 6.2_
     */
    initializeSchedule() {
      const schedule = this.scheduleChore?.schedule || {};
      // Deep copy to avoid mutating store data
      this.localSchedule = {};
      
      // Initialize schedule for each family member
      (this.members || []).forEach(member => {
        const memberId = member.id;
        const memberDays = schedule[memberId] || [];
        this.localSchedule[memberId] = [...memberDays];
      });
    },
    
    /**
     * Check if a day is selected for a member
     */
    isDaySelected(memberId, dayCode) {
      const days = this.localSchedule[memberId] || [];
      return days.includes(dayCode);
    },
    
    /**
     * Toggle a day for a member - Requirements 1.3
     */
    toggleDay(memberId, dayCode) {
      if (!this.localSchedule[memberId]) {
        this.localSchedule[memberId] = [];
      }
      
      const days = this.localSchedule[memberId];
      const index = days.indexOf(dayCode);
      
      if (index === -1) {
        days.push(dayCode);
      } else {
        days.splice(index, 1);
      }
    },
    
    /**
     * Set weekdays (Mon-Fri) for a member - Requirements 2.1
     */
    setWeekdays(memberId) {
      this.localSchedule[memberId] = [...this.weekdays];
    },
    
    /**
     * Set weekends (Sat-Sun) for a member - Requirements 2.2
     */
    setWeekends(memberId) {
      this.localSchedule[memberId] = [...this.weekends];
    },
    
    /**
     * Set all days for a member - Requirements 2.3
     */
    setDaily(memberId) {
      this.localSchedule[memberId] = [...this.allDays];
    },
    
    /**
     * Clear all days for a member - Requirements 2.4
     */
    clearDays(memberId) {
      this.localSchedule[memberId] = [];
    },
    
    /**
     * Handle save button click - Requirements 1.5
     * _Requirements: 6.2_
     */
    async handleSave() {
      // Build the schedule object
      const schedule = {};
      
      Object.entries(this.localSchedule).forEach(([memberId, days]) => {
        // Only include members with at least one day selected
        if (days && days.length > 0) {
          schedule[memberId] = [...days];
        }
      });
      
      // If using stores directly, save via choresStore
      if (this.choresStore && this.scheduleChore?.id) {
        this.saving = true;
        try {
          const result = await this.choresStore.updateQuicklistFullSchedule(
            this.scheduleChore.id,
            schedule
          );
          
          if (result.success) {
            this.uiStore?.showSuccess('Schedule saved');
            this.handleClose();
          } else {
            this.uiStore?.showError(result.error || 'Failed to save schedule');
          }
        } catch (error) {
          console.error('Failed to save schedule:', error);
          this.uiStore?.showError('Failed to save schedule');
        } finally {
          this.saving = false;
        }
      } else {
        // Fallback to emit for backward compatibility
        this.$emit('save', {
          quicklistId: this.scheduleChore?.id,
          schedule
        });
      }
    },
    
    /**
     * Handle close/cancel
     * _Requirements: 6.2, 6.4_
     */
    handleClose() {
      // Close via store if available
      if (this.choresStore?.closeScheduleModal) {
        this.choresStore.closeScheduleModal();
      } else {
        this.$emit('close');
      }
    },
    
    /**
     * Set saving state (called by parent)
     */
    setSaving(value) {
      this.saving = value;
    }
  }
});

// Export component for manual registration
window.ScheduleModalComponent = ScheduleModal;
