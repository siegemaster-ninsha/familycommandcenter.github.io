// Flyout Panel Component - Native Dialog Implementation
// A reusable slide-in panel from the right side of the screen
// Uses native <dialog> element for better iOS Safari/PWA support
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
// IMPLEMENTATION NOTES:
// This component uses the native HTML <dialog> element which provides:
// - Native focus trapping (no JS needed)
// - Native backdrop click handling via ::backdrop pseudo-element
// - Native Escape key handling (can be disabled)
// - Better iOS Safari PWA support
// - Proper accessibility out of the box

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
    <dialog
      ref="dialog"
      class="native-flyout-dialog"
      :style="dialogStyle"
      @close="handleNativeClose"
      @cancel="handleCancel"
      @click="handleDialogClick"
    >
      <div class="native-flyout-panel" :style="panelStyle" @click.stop>
        <!-- Header -->
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
            type="button"
            @click="requestClose"
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
        
        <!-- Footer -->
        <div 
          v-if="showFooter || $slots.footer"
          class="flex-shrink-0 bg-white border-t px-4 py-3"
          style="border-color: var(--color-border-card);"
        >
          <slot name="footer"></slot>
        </div>
      </div>
    </dialog>
  `,
  
  data() {
    return {
      closeIcon: Helpers.IconLibrary.getIcon('x', 'lucide', 20, ''),
      isAnimating: false
    };
  },
  
  computed: {
    dialogStyle() {
      return {
        '--flyout-width': this.width
      };
    },
    panelStyle() {
      return {
        maxWidth: this.width
      };
    }
  },
  
  watch: {
    open: {
      immediate: true,
      handler(isOpen, wasOpen) {
        // Wait for next tick to ensure dialog ref is available
        this.$nextTick(() => {
          if (isOpen && !wasOpen) {
            this.showDialog();
          } else if (!isOpen && wasOpen) {
            this.hideDialog();
          }
        });
      }
    }
  },
  
  methods: {
    showDialog() {
      const dialog = this.$refs.dialog;
      if (!dialog || dialog.open) return;
      
      console.log('🚪 Native dialog showModal()');
      
      // Use showModal() for proper modal behavior (backdrop, focus trap)
      dialog.showModal();
      
      // Prevent body scroll
      document.body.classList.add('flyout-open');
      
      // Trigger animation
      requestAnimationFrame(() => {
        dialog.classList.add('flyout-visible');
        // Emit opened after animation
        setTimeout(() => {
          this.$emit('opened');
        }, 300);
      });
    },
    
    hideDialog() {
      const dialog = this.$refs.dialog;
      if (!dialog || !dialog.open) return;
      
      console.log('🚪 Native dialog hiding');
      
      // Start close animation
      dialog.classList.remove('flyout-visible');
      
      // Wait for animation then close
      setTimeout(() => {
        if (dialog.open) {
          dialog.close();
        }
        document.body.classList.remove('flyout-open');
        this.$emit('closed');
      }, 300);
    },
    
    requestClose() {
      console.log('🚪 Native dialog requestClose()');
      this.$emit('close');
    },
    
    handleNativeClose() {
      // Native close event fired (e.g., from dialog.close())
      console.log('🚪 Native dialog close event');
      // The parent should already know via @close emit
    },
    
    handleCancel(e) {
      // Cancel event fires when user presses Escape
      console.log('🚪 Native dialog cancel (Escape pressed)');
      if (!this.closeOnEscape) {
        e.preventDefault();
        return;
      }
      // Prevent default to handle closing ourselves with animation
      e.preventDefault();
      this.requestClose();
    },
    
    handleDialogClick(e) {
      // Click on the dialog backdrop (outside the panel)
      // The dialog element itself is the backdrop when using showModal()
      if (e.target === this.$refs.dialog && this.closeOnBackdrop) {
        console.log('🚪 Native dialog backdrop click');
        this.requestClose();
      }
    }
  }
});

// Register globally
if (window.Vue) {
  window.FlyoutPanel = FlyoutPanel;
}
