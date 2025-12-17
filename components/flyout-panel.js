// Flyout Panel Component - Shoelace Drawer Implementation
// A reusable slide-in panel from the right side of the screen
// Uses Shoelace's <sl-drawer> for better iOS Safari/PWA support
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

const FlyoutPanel = Vue.defineComponent({
  name: 'FlyoutPanel',
  
  props: {
    open: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    showFooter: {
      type: Boolean,
      default: false
    },
    width: {
      type: String,
      default: '450px'
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },
    closeOnEscape: {
      type: Boolean,
      default: true
    },
    showHeaderClose: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['close', 'opened', 'closed'],
  
  template: `
    <sl-drawer
      ref="drawer"
      :label="title"
      placement="end"
      :style="drawerStyle"
      class="flyout-sl-drawer"
      @sl-request-close="handleRequestClose"
      @sl-after-show="handleAfterShow"
      @sl-after-hide="handleAfterHide"
    >
      <!-- Custom header with close button -->
      <div slot="header-actions" v-if="showHeaderClose">
        <sl-icon-button
          name="x-lg"
          label="Close"
          @click="requestClose"
        ></sl-icon-button>
      </div>
      
      <!-- Main content -->
      <div class="flyout-sl-content">
        <slot></slot>
      </div>
      
      <!-- Footer -->
      <div slot="footer" v-if="showFooter || $slots.footer" class="flyout-sl-footer">
        <slot name="footer"></slot>
      </div>
    </sl-drawer>
  `,
  
  computed: {
    drawerStyle() {
      return {
        '--size': this.width
      };
    }
  },
  
  watch: {
    // Watch the open prop and control the drawer imperatively
    open: {
      immediate: true,
      handler(isOpen) {
        this.$nextTick(() => {
          const drawer = this.$refs.drawer;
          if (!drawer) return;
          
          console.log('🚪 Shoelace drawer open changed:', isOpen);
          
          if (isOpen && !drawer.open) {
            drawer.show();
          } else if (!isOpen && drawer.open) {
            drawer.hide();
          }
        });
      }
    }
  },
  
  methods: {
    requestClose() {
      console.log('🚪 Shoelace drawer requestClose()');
      this.$emit('close');
    },
    
    handleRequestClose(event) {
      // sl-request-close fires when user tries to close via backdrop, escape, or X
      const source = event.detail.source;
      console.log('🚪 Shoelace drawer sl-request-close, source:', source);
      
      // Check if we should allow this close method
      if (source === 'overlay' && !this.closeOnBackdrop) {
        event.preventDefault();
        return;
      }
      if (source === 'keyboard' && !this.closeOnEscape) {
        event.preventDefault();
        return;
      }
      
      // Emit close - parent will set open=false
      this.$emit('close');
    },
    
    handleAfterShow() {
      console.log('🚪 Shoelace drawer opened');
      document.body.classList.add('flyout-open');
      this.$emit('opened');
    },
    
    handleAfterHide() {
      console.log('🚪 Shoelace drawer closed');
      document.body.classList.remove('flyout-open');
      this.$emit('closed');
    }
  }
});

// Register globally
if (window.Vue) {
  window.FlyoutPanel = FlyoutPanel;
}
