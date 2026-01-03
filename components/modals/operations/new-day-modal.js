// New Day Modal Component
// _Requirements: 13.1, 13.2, 13.3, 13.4_
const NewDayModal = Vue.defineComponent({
  name: 'NewDayModal',
  
  setup() {
    const uiStore = window.useUIStore?.();
    const choresStore = window.useChoresStore?.();
    return { uiStore, choresStore };
  },
  
  data() {
    return {
      loading: false
    };
  },
  
  computed: {
    // Modal visibility from uiStore
    isOpen() {
      return this.uiStore?.isModalOpen?.('newDay') || false;
    }
  },
  
  template: `
    <!-- New Day Confirmation Flyout -->
    <!-- _Requirements: 13.1, 13.2, 13.3, 13.4_ -->
    <flyout-panel
      :open="isOpen"
      @close="handleCancelNewDay"
      title="Start New Day"
      :show-footer="true"
      :show-header-close="false"
      width="400px"
    >
      <template #default>
        <div class="new-day-flyout-content">
          <!-- What will be cleared -->
          <div class="new-day-info-card new-day-info-card--error">
            <h4 class="new-day-info-title new-day-info-title--error">
              <span v-html="Helpers.IconLibrary.getIcon('trash2', 'lucide', 18, '')"></span> What will be cleared:
            </h4>
            <ul class="new-day-info-list new-day-info-list--error">
              <li>• All <strong>completed</strong> chores will be removed</li>
              <li>• All <strong>daily chores</strong> (configured per member) will be removed</li>
            </ul>
          </div>
          <!-- What will be created -->
          <div class="new-day-info-card new-day-info-card--success">
            <h4 class="new-day-info-title new-day-info-title--success">
              <span v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 18, '')"></span> What will be created:
            </h4>
            <ul class="new-day-info-list new-day-info-list--success">
              <li>• Fresh daily chores from each member's configured list</li>
              <li>• Duplicates will be automatically skipped</li>
            </ul>
          </div>
          <!-- What will be preserved -->
          <div class="new-day-info-card new-day-info-card--primary">
            <h4 class="new-day-info-title new-day-info-title--primary">
              <span v-html="Helpers.IconLibrary.getIcon('shield', 'lucide', 18, '')"></span> What will be preserved:
            </h4>
            <ul class="new-day-info-list new-day-info-list--primary">
              <li>• All family members' <strong>earnings</strong></li>
              <li>• Non-daily incomplete chores remain on the board</li>
            </ul>
          </div>
          <p class="new-day-warning-text">
            This action cannot be undone. Are you sure you want to start a new day?
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flyout-footer-buttons flex items-center gap-2">
          <button 
            @click="handleStartNewDay"
            @touchend.prevent="handleStartNewDay"
            :disabled="loading"
            class="flex-1 btn-warning btn-compact flex items-center justify-center gap-2"
          >
            <div v-if="loading" class="new-day-spinner" v-html="Helpers.IconLibrary.getIcon('loader', 'lucide', 16, 'text-white')"></div>
            {{ loading ? 'Starting...' : 'Start New Day' }}
          </button>
          <button 
            @click="handleCancelNewDay"
            @touchend.prevent="handleCancelNewDay"
            :disabled="loading"
            class="btn-secondary btn-compact"
          >
            Cancel
          </button>
        </div>
      </template>
    </flyout-panel>
  `,
  
  methods: {
    // Start new day using choresStore action
    // _Requirements: 13.4_
    async handleStartNewDay() {
      if (!this.choresStore) {
        console.error('[NewDayModal] Chores store not available');
        return;
      }
      
      this.loading = true;
      try {
        const result = await this.choresStore.startNewDay();
        
        if (result.success) {
          this.uiStore?.closeModal('newDay');
        }
        // Error handling is done inside choresStore.startNewDay()
      } finally {
        this.loading = false;
      }
    },
    
    handleCancelNewDay() {
      this.uiStore?.closeModal('newDay');
    }
  }
});

// Export for CDN-based registration
// _Requirements: 16.3_
window.NewDayModalComponent = NewDayModal;
