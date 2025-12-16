// Flyout Panel Component
// A reusable slide-in panel from the right side of the screen
// 
// USAGE:
//   <flyout-panel 
//     :open="showFlyout" 
//     @close="showFlyout = false"
//     title="Panel Title"
//     :show-footer="true"
//   >
//     <template #default>
//       <!-- Main content goes here -->
//     </template>
//     <template #footer>
//       <!-- Optional footer content -->
//     </template>
//   </flyout-panel>
//
// EVENTS:
//   @close  - Emitted when user requests close (X button, backdrop, escape key)
//   @opened - Emitted after open animation completes
//   @closed - Emitted after close animation completes
//
// IMPORTANT - CLOSING BEHAVIOR:
// The flyout uses CSS transitions for smooth open/close animations. There are several
// key issues to be aware of when implementing close behavior:
//
// 1. EMPTY CONTENT FLASH: If you clear your data (e.g., currentItem = null) at the
//    same time as setting open = false, the flyout will show empty content during
//    the close animation. 
//    
//    FIX: Don't clear data on close. The data will be replaced when opening a new
//    item anyway. Example:
//    
//    // BAD - causes empty content flash
//    closeModal() {
//      this.showFlyout = false;
//      this.currentItem = null;  // Content disappears during animation!
//    }
//    
//    // GOOD - content stays visible during close animation
//    closeModal() {
//      this.showFlyout = false;
//      // Don't clear currentItem - it gets replaced on next open
//    }
//
// 2. TRANSITIONEND NOT FIRING: On mobile or with prefers-reduced-motion, the
//    CSS transitionend event may not fire reliably. This component includes a
//    350ms timeout fallback to ensure @closed is always emitted.
//
// 3. REQUIRED CSS: The flyout requires these CSS classes in styles.css:
//    - .flyout-panel (positioning, transform for slide animation)
//    - .flyout-panel.flyout-open (transform to show panel)
//    - .flyout-backdrop (overlay behind panel)
//    - .flyout-backdrop.flyout-open (visible state)
//
// 4. INJECTED METHODS ON MOBILE: Injected methods from Vue's provide/inject work
//    correctly when called directly in @click handlers. No wrapper methods needed.
//    
//    // CORRECT - call injected method directly
//    inject: ['cancelAddToQuicklist'],
//    template: `<button @click="cancelAddToQuicklist">Close</button>`
//    - body.flyout-open (prevents scroll when open)

const FlyoutPanel = Vue.defineComponent({
  name: 'FlyoutPanel',
  
  props: {
    // Whether the flyout is open
    open: {
      type: Boolean,
      default: false
    },
    // Title displayed in the header
    title: {
      type: String,
      default: ''
    },
    // Whether to show the footer slot
    showFooter: {
      type: Boolean,
      default: false
    },
    // Width on desktop (mobile is always full width)
    width: {
      type: String,
      default: '450px'
    },
    // Whether clicking backdrop closes the flyout
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },
    // Whether pressing Escape closes the flyout
    closeOnEscape: {
      type: Boolean,
      default: true
    },
    // Whether to show the X button in the header (hide if footer has close button)
    showHeaderClose: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['close', 'opened', 'closed'],
  
  template: `
    <Teleport to="body">
      <!-- Backdrop -->
      <div 
        class="flyout-backdrop"
        :class="{ 'flyout-open': open }"
        @click="handleBackdropClick"
      ></div>
      
      <!-- Panel -->
      <div 
        class="flyout-panel"
        :class="{ 'flyout-open': open }"
        :style="{ maxWidth: width }"
        @transitionend="handleTransitionEnd"
      >
        <!-- Header (fixed at top via flexbox) -->
        <div 
          class="flex-shrink-0 bg-white border-b px-4 py-3 flex items-center justify-between"
          style="border-color: var(--color-border-card);"
        >
          <div class="flex-1 min-w-0">
            <slot name="title">
              <h2 class="text-lg font-bold text-primary-custom truncate pr-2">{{ title }}</h2>
            </slot>
          </div>
          <button
            v-if="showHeaderClose"
            @click="close"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close panel"
          >
            <div v-html="closeIcon"></div>
          </button>
        </div>
        
        <!-- Content -->
        <div class="flyout-content p-4 sm:p-6">
          <slot></slot>
        </div>
        
        <!-- Footer (fixed at bottom via flexbox) -->
        <div 
          v-if="showFooter || $slots.footer"
          class="flex-shrink-0 bg-white border-t px-4 py-3"
          style="border-color: var(--color-border-card);"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </Teleport>
  `,
  
  data() {
    return {
      closeIcon: Helpers.IconLibrary.getIcon('x', 'lucide', 20, ''),
      wasOpen: false,
      closeTimeout: null,
      closedEmitted: false
    };
  },
  
  watch: {
    open: {
      immediate: true,
      handler(isOpen) {
        if (isOpen) {
          this.onOpen();
        } else if (this.wasOpen) {
          this.onClose();
        }
        this.wasOpen = isOpen;
      }
    }
  },
  
  mounted() {
    document.addEventListener('keydown', this.handleKeydown);
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown);
    // Clean up timeout
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
    // Clean up body class if component unmounts while open
    if (this.open) {
      document.body.classList.remove('flyout-open');
    }
  },
  
  methods: {
    close() {
      this.$emit('close');
    },
    
    handleBackdropClick() {
      if (this.closeOnBackdrop) {
        this.close();
      }
    },
    
    handleKeydown(e) {
      if (e.key === 'Escape' && this.open && this.closeOnEscape) {
        this.close();
      }
    },
    
    handleTransitionEnd(e) {
      // Only handle the transform transition on the panel itself
      if (e.propertyName === 'transform' && e.target === e.currentTarget) {
        if (this.open) {
          this.$emit('opened');
        } else {
          this.emitClosed();
        }
      }
    },
    
    emitClosed() {
      // Prevent duplicate emissions
      if (this.closedEmitted) return;
      this.closedEmitted = true;
      
      // Clear the fallback timeout
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
      
      this.$emit('closed');
    },
    
    onOpen() {
      // Reset closed state when opening
      this.closedEmitted = false;
      if (this.closeTimeout) {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
      // Prevent body scroll when flyout is open
      document.body.classList.add('flyout-open');
    },
    
    onClose() {
      document.body.classList.remove('flyout-open');
      
      // Fallback: emit closed after transition duration (300ms) + buffer
      // This handles cases where transitionend doesn't fire (reduced motion, mobile quirks)
      this.closeTimeout = setTimeout(() => {
        this.emitClosed();
      }, 350);
    }
  }
});

// Register globally
if (window.Vue) {
  window.FlyoutPanel = FlyoutPanel;
}
