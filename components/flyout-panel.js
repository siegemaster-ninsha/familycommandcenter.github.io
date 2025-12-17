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
            // Save scroll position and lock body BEFORE showing drawer to prevent jump
            this._savedScrollY = window.scrollY;
            document.body.classList.add('flyout-open');
            document.body.style.top = `-${this._savedScrollY}px`;
            drawer.show();
            // Aggressively restore scroll in case Shoelace resets it
            requestAnimationFrame(() => {
              if (this._savedScrollY !== undefined) {
                window.scrollTo(0, this._savedScrollY);
              }
            });
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
      // Restore scroll position in case Shoelace reset it
      if (this._savedScrollY !== undefined && window.scrollY !== this._savedScrollY) {
        console.log('🚪 Restoring scroll position from', window.scrollY, 'to', this._savedScrollY);
        window.scrollTo(0, this._savedScrollY);
      }
    },
    
    handleAfterShow() {
      console.log('🚪 Shoelace drawer opened');
      // Body lock already applied in watcher before show()
      this.$emit('opened');
    },
    
    handleAfterHide() {
      console.log('🚪 Shoelace drawer closed');
      document.body.classList.remove('flyout-open');
      document.body.style.top = '';
      // Restore scroll position after unlocking body
      if (this._savedScrollY !== undefined) {
        window.scrollTo(0, this._savedScrollY);
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
