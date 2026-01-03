/**
 * App Modals Orchestrator - Composes all individual modal components
 * _Requirements: 14.1, 14.2, 14.3, 14.4_
 */
const AppModals = Vue.defineComponent({
  name: 'AppModals',
  setup() {
    const uiStore = window.useUIStore?.();
    const choresStore = window.useChoresStore?.();
    const familyStore = window.useFamilyStore?.();
    return { uiStore, choresStore, familyStore };
  },
  computed: {
    // Modal visibility - from uiStore
    showCategoryManagementModal() {
      return this.uiStore?.isModalOpen('categoryManagement') || false;
    },
    showScheduleModal() {
      return this.uiStore?.isModalOpen('schedule') || false;
    },
    showDefaultOrderModal() {
      return this.uiStore?.isModalOpen('defaultOrder') || false;
    },
    // Modal data - from stores
    scheduleModalChore() {
      return this.choresStore?.scheduleModalChore || null;
    },
    defaultOrderMember() {
      return this.familyStore?.defaultOrderMember || null;
    },
    quicklistChores() {
      return this.choresStore?.quicklistChores || [];
    },
    people() {
      return this.familyStore?.members || [];
    },
    effectiveScheduleModalChore() {
      const modalData = this.uiStore?.getModalData('schedule');
      return modalData?.quicklistChore || this.scheduleModalChore;
    }
  },
  methods: {
    closeCategoryManagementModal() {
      this.uiStore?.closeModal('categoryManagement');
    },
    closeScheduleModal() {
      this.choresStore?.closeScheduleModal();
    },
    closeDefaultOrderModal() {
      this.familyStore?.closeDefaultOrderModal();
    },
    async handleScheduleSave(data) {
      // Delegate to app.js method via vueApp
      const vueApp = window.vueApp;
      if (vueApp?.handleScheduleSave) {
        await vueApp.handleScheduleSave(data);
      }
    },
    async handleDefaultOrderSave(data) {
      // Delegate to app.js method via vueApp
      const vueApp = window.vueApp;
      if (vueApp?.handleDefaultOrderSave) {
        await vueApp.handleDefaultOrderSave(data);
      }
    }
  },

  template: `
    <!-- Auth Modals (store-based) -->
    <login-modal></login-modal>
    <signup-modal></signup-modal>
    <confirm-modal></confirm-modal>

    <!-- Chore Modals (inject-based) -->
    <add-chore-modal></add-chore-modal>
    <chore-details-modal></chore-details-modal>
    <add-to-quicklist-modal></add-to-quicklist-modal>
    <multi-assign-modal></multi-assign-modal>

    <!-- Family Modals (mixed pattern) -->
    <create-child-modal></create-child-modal>
    <invite-parent-modal></invite-parent-modal>
    <delete-person-modal></delete-person-modal>

    <!-- Other Modals -->
    <spending-modal></spending-modal>
    <habit-modal></habit-modal>
    <new-day-modal></new-day-modal>

    <!-- Already-extracted modals (use props) -->
    <category-management-modal
      :open="showCategoryManagementModal"
      @close="closeCategoryManagementModal"
    ></category-management-modal>
    <schedule-modal
      :open="showScheduleModal"
      :quicklist-chore="effectiveScheduleModalChore"
      :family-members="people"
      @save="handleScheduleSave"
      @close="closeScheduleModal"
    ></schedule-modal>
    <default-order-modal
      :open="showDefaultOrderModal"
      :member="defaultOrderMember"
      :quicklist-chores="quicklistChores"
      @save="handleDefaultOrderSave"
      @close="closeDefaultOrderModal"
    ></default-order-modal>
  `
});

window.AppModalsComponent = AppModals;
