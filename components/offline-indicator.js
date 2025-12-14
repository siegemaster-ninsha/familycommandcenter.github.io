// Offline Indicator Component
// Displays a banner when the app is offline with pending sync count
// Also shows sync progress when coming back online

const OfflineIndicator = Vue.defineComponent({
  name: 'OfflineIndicator',
  
  template: `
    <transition name="offline-banner">
      <div 
        v-if="showBanner" 
        class="offline-banner fixed top-14 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
        :class="bannerClass"
        role="alert"
        aria-live="polite"
      >
        <div v-html="statusIcon"></div>
        <span>{{ statusMessage }}</span>
        <button 
          v-if="isOnline && hasPendingChanges && !syncInProgress"
          @click="triggerSync"
          class="ml-2 px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity"
          :class="buttonClass"
        >
          Sync Now
        </button>
        <div v-if="syncInProgress" class="ml-2 flex items-center gap-1">
          <div class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
          <span class="text-xs">Syncing...</span>
        </div>
      </div>
    </transition>
  `,
  
  setup() {
    const offlineStore = useOfflineStore();
    
    const isOnline = Vue.computed(() => offlineStore.isOnline);
    const hasPendingChanges = Vue.computed(() => offlineStore.hasPendingChanges);
    const pendingSyncCount = Vue.computed(() => offlineStore.pendingSyncCount);
    const syncInProgress = Vue.computed(() => offlineStore.syncInProgress);
    
    // Show banner when offline OR when syncing pending changes
    const showBanner = Vue.computed(() => {
      return !offlineStore.isOnline || offlineStore.syncInProgress || offlineStore.hasPendingChanges;
    });
    
    const statusMessage = Vue.computed(() => {
      // Syncing state
      if (offlineStore.syncInProgress) {
        return `Syncing ${offlineStore.pendingSyncCount} change${offlineStore.pendingSyncCount > 1 ? 's' : ''}...`;
      }
      
      // Offline state
      if (!offlineStore.isOnline) {
        if (offlineStore.pendingSyncCount > 0) {
          return `You're offline. ${offlineStore.pendingSyncCount} change${offlineStore.pendingSyncCount > 1 ? 's' : ''} will sync when connected.`;
        }
        return "You're offline. Changes will sync when connected.";
      }
      
      // Online with pending changes
      if (offlineStore.hasPendingChanges) {
        return `${offlineStore.pendingSyncCount} change${offlineStore.pendingSyncCount > 1 ? 's' : ''} pending sync`;
      }
      
      return '';
    });
    
    const bannerClass = Vue.computed(() => {
      if (offlineStore.syncInProgress) {
        return 'bg-blue-500 text-white shadow-md';
      }
      if (!offlineStore.isOnline) {
        return 'bg-amber-500 text-white shadow-md';
      }
      // Online with pending changes
      return 'bg-yellow-500 text-white shadow-md';
    });
    
    const buttonClass = Vue.computed(() => {
      return 'bg-white/20 text-white';
    });
    
    const statusIcon = Vue.computed(() => {
      // Syncing icon
      if (offlineStore.syncInProgress) {
        if (typeof Helpers !== 'undefined' && Helpers.IconLibrary) {
          return Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 16, 'text-white animate-spin');
        }
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>';
      }
      
      // Offline icon
      if (!offlineStore.isOnline) {
        if (typeof Helpers !== 'undefined' && Helpers.IconLibrary) {
          return Helpers.IconLibrary.getIcon('wifiOff', 'lucide', 16, 'text-white');
        }
        return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>';
      }
      
      // Pending changes icon (cloud with arrow)
      if (typeof Helpers !== 'undefined' && Helpers.IconLibrary) {
        return Helpers.IconLibrary.getIcon('cloudUpload', 'lucide', 16, 'text-white');
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path></svg>';
    });
    
    const triggerSync = () => {
      offlineStore.triggerSync();
    };
    
    return {
      isOnline,
      hasPendingChanges,
      pendingSyncCount,
      syncInProgress,
      showBanner,
      statusMessage,
      bannerClass,
      buttonClass,
      statusIcon,
      triggerSync
    };
  }
});

// Export component
if (typeof window !== 'undefined') {
  window.OfflineIndicator = OfflineIndicator;
}
