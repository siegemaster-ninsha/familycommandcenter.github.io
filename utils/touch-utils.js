// Touch Utilities for Mobile Scroll vs Tap Detection
// Provides a Vue directive and helper functions to distinguish between
// scroll gestures and intentional taps on mobile devices.

const SCROLL_THRESHOLD = 10; // pixels of movement to consider a scroll

/**
 * TouchTracker - Tracks touch state for scroll vs tap detection
 * Can be used as a standalone class or via the Vue directive
 */
class TouchTracker {
  constructor(options = {}) {
    this.threshold = options.threshold || SCROLL_THRESHOLD;
    this.reset();
  }

  reset() {
    this.startX = null;
    this.startY = null;
    this.moved = false;
    this.startTime = null;
  }

  handleTouchStart(event) {
    if (event.touches && event.touches.length > 0) {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
      this.startTime = Date.now();
      this.moved = false;
    }
  }

  handleTouchMove(event) {
    if (this.startX === null || this.startY === null) return;

    if (event.touches && event.touches.length > 0) {
      const deltaX = Math.abs(event.touches[0].clientX - this.startX);
      const deltaY = Math.abs(event.touches[0].clientY - this.startY);

      if (deltaX > this.threshold || deltaY > this.threshold) {
        this.moved = true;
      }
    }
  }

  /**
   * Check if the interaction was a tap (not a scroll)
   * Call this in your click handler
   * @returns {boolean} true if it was a genuine tap, false if it was a scroll
   */
  wasTap() {
    const result = !this.moved;
    this.reset();
    return result;
  }

  /**
   * Check if the interaction was a scroll
   * @returns {boolean} true if user scrolled, false if it was a tap
   */
  wasScroll() {
    return this.moved;
  }
}

/**
 * Vue directive for scroll-aware tap detection
 * Usage: v-tap-not-scroll="handleTap"
 * 
 * This directive will only call the handler if the user tapped
 * without scrolling. Scrolling will not trigger the handler.
 */
const vTapNotScroll = {
  mounted(el, binding) {
    const tracker = new TouchTracker();
    
    const onTouchStart = (e) => tracker.handleTouchStart(e);
    const onTouchMove = (e) => tracker.handleTouchMove(e);
    const onClick = (e) => {
      if (tracker.wasTap()) {
        // It was a genuine tap, call the handler
        if (typeof binding.value === 'function') {
          binding.value(e);
        }
      }
      // If it was a scroll, do nothing
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('click', onClick);

    // Store references for cleanup
    el._tapNotScroll = { onTouchStart, onTouchMove, onClick };
  },

  unmounted(el) {
    if (el._tapNotScroll) {
      el.removeEventListener('touchstart', el._tapNotScroll.onTouchStart);
      el.removeEventListener('touchmove', el._tapNotScroll.onTouchMove);
      el.removeEventListener('click', el._tapNotScroll.onClick);
      delete el._tapNotScroll;
    }
  }
};

/**
 * Vue mixin for components that need scroll-aware tap detection
 * Provides touchTracker instance and helper methods
 * 
 * Usage in component:
 *   mixins: [TouchAwareMixin],
 *   methods: {
 *     handleClick(item, event) {
 *       if (!this.isTapNotScroll()) return;
 *       // Handle the tap
 *     }
 *   }
 *   
 * In template:
 *   @touchstart="onTouchStart"
 *   @touchmove="onTouchMove"
 *   @click="handleClick(item, $event)"
 */
const TouchAwareMixin = {
  data() {
    return {
      _touchTracker: null
    };
  },
  created() {
    this._touchTracker = new TouchTracker();
  },
  methods: {
    onTouchStart(event) {
      this._touchTracker.handleTouchStart(event);
    },
    onTouchMove(event) {
      this._touchTracker.handleTouchMove(event);
    },
    /**
     * Call this at the start of your click handler
     * Returns true if it was a tap, false if it was a scroll
     */
    isTapNotScroll() {
      return this._touchTracker.wasTap();
    },
    /**
     * Reset touch tracking state
     */
    resetTouchTracking() {
      this._touchTracker.reset();
    }
  }
};

/**
 * Create a scroll-aware click handler wrapper
 * Use this to wrap any click handler to make it scroll-aware
 * 
 * Usage:
 *   const handler = createScrollAwareHandler((event, ...args) => {
 *     // This only runs if it was a tap, not a scroll
 *   });
 *   
 *   element.addEventListener('touchstart', handler.onTouchStart);
 *   element.addEventListener('touchmove', handler.onTouchMove);
 *   element.addEventListener('click', handler.onClick);
 */
function createScrollAwareHandler(callback, options = {}) {
  const tracker = new TouchTracker(options);
  
  return {
    tracker,
    onTouchStart: (e) => tracker.handleTouchStart(e),
    onTouchMove: (e) => tracker.handleTouchMove(e),
    onClick: (e, ...args) => {
      if (tracker.wasTap()) {
        callback(e, ...args);
      }
    }
  };
}

// Export for use in the app
if (typeof window !== 'undefined') {
  window.TouchTracker = TouchTracker;
  window.vTapNotScroll = vTapNotScroll;
  window.TouchAwareMixin = TouchAwareMixin;
  window.createScrollAwareHandler = createScrollAwareHandler;
}
