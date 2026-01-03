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

// Animation duration in ms - adjust this to control drawer speed
const DRAWER_ANIMATION_DURATION = 800;

// Register custom drawer animations when Shoelace is ready
// Shoelace uses Web Animations API, not CSS - must use setDefaultAnimation()
function registerDrawerAnimations() {
  // Import animation registry from Shoelace CDN
  import('https://esm.sh/@shoelace-style/shoelace@2.15.0/dist/utilities/animation-registry.js')
    .then(({ setDefaultAnimation }) => {
      console.log('🎬 Registering custom drawer animations');
      
      // Drawer slide in from end (right side) - pure slide, no fade
      setDefaultAnimation('drawer.showEnd', {
        keyframes: [
          { transform: 'translateX(100%)' },
          { transform: 'translateX(0)' }
        ],
        options: { duration: DRAWER_ANIMATION_DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      });
      
      // Drawer slide out to end - pure slide, no fade
      setDefaultAnimation('drawer.hideEnd', {
        keyframes: [
          { transform: 'translateX(0)' },
          { transform: 'translateX(100%)' }
        ],
        options: { duration: DRAWER_ANIMATION_DURATION, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
      });
      
      // Overlay fade in
      setDefaultAnimation('drawer.overlay.show', {
        keyframes: [
          { opacity: '0' },
          { opacity: '1' }
        ],
        options: { duration: DRAWER_ANIMATION_DURATION, easing: 'ease-out' }
      });
      
      // Overlay fade out
      setDefaultAnimation('drawer.overlay.hide', {
        keyframes: [
          { opacity: '1' },
          { opacity: '0' }
        ],
        options: { duration: DRAWER_ANIMATION_DURATION, easing: 'ease-out' }
      });
      
      console.log('✅ Drawer animations registered with duration:', DRAWER_ANIMATION_DURATION, 'ms');
    })
    .catch(err => {
      console.warn('⚠️ Could not register drawer animations:', err);
    });
}

// Register animations when Shoelace is ready
if (window.customElements?.get('sl-drawer')) {
  registerDrawerAnimations();
} else {
  window.addEventListener('shoelace-ready', registerDrawerAnimations, { once: true });
}

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
      @sl-show="handleShow"
      @sl-after-show="handleAfterShow"
      @sl-after-hide="handleAfterHide"
      @sl-initial-focus="handleInitialFocus"
    >
      <!-- Custom title slot - replaces default label -->
      <div slot="label" v-if="$slots.title">
        <slot name="title"></slot>
      </div>
      
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
  
  data() {
    return {
      // Store scroll position as reactive data to ensure it persists
      savedScrollY: 0
    };
  },
  
  watch: {
    // Watch the open prop and control the drawer imperatively
    open: {
      immediate: true,
      handler(isOpen, wasOpen) {
        // CRITICAL: Use pre-captured scroll position from click handler if available
        // The click handler captures scroll BEFORE any Vue reactivity processing
        // Fall back to current scrollY if not available (shouldn't happen)
        if (isOpen && !wasOpen) {
          // Check for pre-captured scroll position from click handler
          if (typeof window.__flyoutScrollY === 'number' && window.__flyoutScrollY > 0) {
            this.savedScrollY = window.__flyoutScrollY;
            console.log('🚪 Using pre-captured scroll position:', this.savedScrollY);
          } else {
            this.savedScrollY = window.scrollY;
            console.log('🚪 Using current scroll position:', this.savedScrollY);
          }
          // Clear the global after using it
          window.__flyoutScrollY = undefined;
          
          // Apply body lock IMMEDIATELY to prevent any scroll changes
          document.body.classList.add('flyout-open');
          document.body.style.top = `-${this.savedScrollY}px`;
        }
        
        this.$nextTick(() => {
          const drawer = this.$refs.drawer;
          if (!drawer) return;
          
          console.log('🚪 Shoelace drawer open changed:', isOpen, 'savedScrollY:', this.savedScrollY);
          
          if (isOpen && !drawer.open) {
            // Body lock already applied synchronously above
            // Just show the drawer
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
    
    handleShow() {
      // sl-show fires when drawer starts opening (before animation)
      // Ensure body lock is still in place with correct scroll offset
      if (this.savedScrollY > 0) {
        document.body.style.top = `-${this.savedScrollY}px`;
        console.log('🚪 handleShow: Ensuring body.top is set to', `-${this.savedScrollY}px`);
      }
    },
    
    handleAfterShow() {
      console.log('🚪 Shoelace drawer opened, savedScrollY:', this.savedScrollY);
      this.$emit('opened');
    },
    
    handleAfterHide() {
      console.log('🚪 Shoelace drawer closed, restoring scroll to:', this.savedScrollY);
      
      // Remove body lock
      document.body.classList.remove('flyout-open');
      document.body.style.top = '';
      
      // Restore scroll position after unlocking body
      if (this.savedScrollY > 0) {
        window.scrollTo(0, this.savedScrollY);
      }
      
      this.$emit('closed');
    },
    
    handleInitialFocus(event) {
      // Prevent drawer from auto-focusing its panel, which can scroll page to top
      event.preventDefault();
    }
  }
});

// Register globally
if (window.Vue) {
  window.FlyoutPanel = FlyoutPanel;
}
