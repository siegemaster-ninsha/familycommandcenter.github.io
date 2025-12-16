// Update Prompt Component
// Shows a banner when a new version of the app is available

const UpdatePrompt = Vue.defineComponent({
  name: 'UpdatePrompt',
  
  template: `
    <transition name="update-banner">
      <div 
        v-if="showPrompt" 
        class="update-prompt fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium">Update Available</p>
            <p class="text-sm text-blue-100 mt-1">A new version of Family Hub is ready.</p>
          </div>
          <button 
            @click="dismiss"
            class="flex-shrink-0 text-blue-200 hover:text-white"
            aria-label="Dismiss"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="flex gap-2 mt-3">
          <button 
            @click="updateNow"
            class="flex-1 bg-white text-blue-600 font-medium py-2 px-4 rounded hover:bg-blue-50 transition-colors"
          >
            Update Now
          </button>
          <button 
            @click="dismiss"
            class="px-4 py-2 text-blue-200 hover:text-white transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </transition>
  `,
  
  data() {
    return {
      showPrompt: false,
      registration: null
    };
  },
  
  mounted() {
    // Listen for service worker update available event
    window.addEventListener('sw-update-available', this.onUpdateAvailable);
    
    // Also check on page visibility change (user returns to tab)
    document.addEventListener('visibilitychange', this.checkForUpdates);
  },
  
  beforeUnmount() {
    window.removeEventListener('sw-update-available', this.onUpdateAvailable);
    document.removeEventListener('visibilitychange', this.checkForUpdates);
  },
  
  methods: {
    onUpdateAvailable(event) {
      console.log('🔔 Update available event received');
      this.registration = event.detail?.registration;
      this.showPrompt = true;
    },
    
    checkForUpdates() {
      if (document.visibilityState === 'visible' && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update();
          }
        });
      }
    },
    
    async updateNow() {
      console.log('🔄 User requested update - clearing caches and activating new SW');
      this.showPrompt = false;
      
      // Clear all caches first to ensure fresh content
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('🗑️ All caches cleared');
        } catch (e) {
          console.warn('Failed to clear caches:', e);
        }
      }
      
      // Tell the waiting service worker to skip waiting
      if (this.registration?.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // The page will reload automatically when the new SW takes control
      // (handled by controllerchange event in index.html)
      // But if it doesn't happen within 2 seconds, force a hard refresh
      setTimeout(() => {
        console.log('⏱️ Timeout reached, forcing hard refresh');
        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
      }, 2000);
    },
    
    dismiss() {
      this.showPrompt = false;
    }
  }
});

// Export component
if (typeof window !== 'undefined') {
  window.UpdatePrompt = UpdatePrompt;
}
