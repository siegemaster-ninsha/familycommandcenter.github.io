// Invite Parent Modal Component
// _Requirements: 8.1, 8.2, 8.3, 8.4_
// Encapsulated modal for inviting parents to join the family
const InviteParentModal = Vue.defineComponent({
  name: 'InviteParentModal',
  
  // Access stores in setup()
  setup() {
    const familyStore = window.useFamilyStore?.();
    const authStore = window.useAuthStore?.();
    const uiStore = window.useUIStore?.();
    return { familyStore, authStore, uiStore };
  },
  
  // Inject props from parent (preserves existing contracts)
  // Note: showInviteModal/closeInviteModal are kept for backward compatibility
  // but we also check uiStore directly for 'parentInvite' modal
  inject: {
    showInviteModal: { default: () => false },
    closeInviteModal: { default: () => () => {} }
  },
  
  computed: {
    // Check if modal is open - supports both 'invite' and 'parentInvite' modal names
    // _Requirements: 8.2_
    isOpen() {
      // Check uiStore for 'parentInvite' (used by family-page.js)
      // or fall back to injected showInviteModal (used by app.js legacy)
      return this.uiStore?.isModalOpen?.('parentInvite') || this.showInviteModal;
    },
    
    // Access invite data from familyStore or uiStore modal data
    // _Requirements: 8.3_
    inviteData() {
      // First check uiStore modal data (passed by family-page.js)
      const modalData = this.uiStore?.getModalData?.('parentInvite');
      if (modalData?.token) {
        return modalData;
      }
      // Fall back to familyStore
      return this.familyStore?.inviteData;
    },
    
    inviteToken() {
      return this.inviteData?.token || '';
    },
    
    inviteExpiresAt() {
      const expiresAt = this.inviteData?.expiresAt || this.familyStore?.inviteData?.expiresAt;
      return expiresAt ? new Date(expiresAt).toLocaleString() : '';
    },
    
    currentUser() {
      return this.authStore?.currentUser;
    },
    
    accountSettings() {
      return this.authStore?.accountSettings;
    }
  },
  
  methods: {
    /**
     * Generate the invite link
     * _Requirements: 8.4_
     */
    getInviteLink() {
      const token = this.inviteToken || '';
      const url = new URL(window.location.href);
      // build a link that preserves the repo/site path (important for GitHub Pages project sites)
      url.search = '';
      url.hash = '';
      // optional: drop trailing index.html for cleaner URL
      const cleanPath = url.pathname.replace(/index\.html$/i, '');
      return `${url.origin}${cleanPath}?invite=${encodeURIComponent(token)}`;
    },
    
    /**
     * Get the full invite text for sharing
     */
    getInviteText() {
      const familyName = this.accountSettings?.profile?.familyName || this.currentUser?.name || 'a family';
      const link = this.getInviteLink();
      return `You've been invited to join ${familyName}'s family on Family Command Center!\n\nAccept your invite: ${link}`;
    },
    
    /**
     * Copy invite link to clipboard
     * _Requirements: 8.4_
     */
    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.getInviteText());
        this.uiStore?.showSuccess('Invite link copied to clipboard');
      } catch (e) {
        console.warn('failed to copy invite link', e);
        this.uiStore?.showError('Failed to copy invite link');
      }
    },
    
    /**
     * Share invite via native share API or clipboard fallback
     * _Requirements: 8.4_
     */
    async shareInvite() {
      const text = this.getInviteText();
      const link = this.getInviteLink();
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Family Command Center Invite', text, url: link });
        } else {
          await navigator.clipboard.writeText(text);
          alert('Invite text copied. Paste it into your message.');
        }
      } catch (e) {
        console.warn('share failed', e);
        try {
          await navigator.clipboard.writeText(text);
          alert('Invite text copied. Paste it into your message.');
        } catch { /* clipboard fallback failed */ }
      }
    },
    
    /**
     * Handle close - closes the modal via uiStore or injected method
     */
    handleClose() {
      // Close via uiStore (for 'parentInvite' modal)
      this.uiStore?.closeModal?.('parentInvite');
      // Also call injected method for backward compatibility
      this.closeInviteModal?.();
    }
  },
  
  template: `
    <!-- Invite Parent Modal -->
    <!-- _Requirements: 8.1, 8.2, 8.3, 8.4_ -->
    <div v-if="isOpen" class="fixed inset-0 flex items-center justify-center z-50 modal-overlay" :style="{ backgroundColor: 'rgba(0,0,0,0.5)' }">
      <div class="bg-white rounded-lg p-6 w-96 max-w-[90vw] modal-panel">
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-indigo-100 p-2 rounded-full">
            <div v-html="Helpers.IconLibrary.getIcon('shield', 'lucide', 24, 'text-indigo-600')"></div>
          </div>
          <h3 class="text-lg font-bold text-primary-custom">Invite Parent</h3>
        </div>
        <p class="text-sm text-secondary-custom mb-3">Share this link with the parent you want to invite. It will be valid for 7 days.</p>
        <div class="bg-gray-50 rounded p-3 text-xs break-all mb-3">{{ getInviteLink() }}</div>
        <div class="text-xs text-secondary-custom mb-4">Expires: {{ inviteExpiresAt }}</div>
        <div class="flex gap-3">
          <button @click="shareInvite()" class="flex-1 btn-secondary">Share</button>
          <button @click="copyInviteLink()" class="flex-1 btn-secondary">Copy Link</button>
          <button @click="handleClose" class="flex-1 bg-gray-100 text-primary-custom py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  `
});

// Export component for CDN-based registration
window.InviteParentModalComponent = InviteParentModal;
