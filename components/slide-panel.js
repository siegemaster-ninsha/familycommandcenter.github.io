// Slide Panel Component
// A reusable horizontal sliding container for multi-page inline navigation
// 
// USAGE:
// <slide-panel :active-page="currentPage" @page-change="onPageChange">
//   <template #default>
//     <!-- Default/first page content -->
//     <button @click="currentPage = 'details'">View Details →</button>
//   </template>
//   <template #details>
//     <!-- Second page content -->
//     <button @click="currentPage = 'default'">← Back</button>
//     <p>Details here...</p>
//   </template>
// </slide-panel>
//
// PROPS:
// - activePage: String - name of the slot to display (default: 'default')
// - duration: Number - animation duration in ms (default: 200)
// - easing: String - CSS easing function (default: 'ease-out')
//
// EVENTS:
// - page-change: { from: string, to: string } - fired after transition completes
//
// SLOTS:
// - default: The initial/main page content
// - [named]: Any named slot becomes a navigable page

const SlidePanel = Vue.defineComponent({
  name: 'SlidePanel',
  
  template: `
    <div 
      class="slide-panel" 
      ref="container"
    >
      <div 
        class="slide-panel-track" 
        :style="trackStyle"
        @transitionend="onTransitionEnd"
      >
        <div 
          v-for="(pageName, index) in pageNames" 
          :key="pageName"
          class="slide-panel-page"
          :class="{ 'slide-panel-page--active': pageName === activePage }"
          :data-page="pageName"
        >
          <slot :name="pageName"></slot>
        </div>
      </div>
    </div>
  `,
  
  props: {
    // Which page slot to display
    activePage: {
      type: String,
      default: 'default'
    },
    // Animation duration in milliseconds
    duration: {
      type: Number,
      default: 300
    },
    // CSS easing function
    easing: {
      type: String,
      default: 'ease-out'
    }
  },
  
  emits: ['page-change'],
  
  data() {
    return {
      previousPage: 'default',
      isTransitioning: false
    };
  },
  
  computed: {
    // Discover all slot names to create pages
    pageNames() {
      const slots = this.$slots;
      const names = Object.keys(slots);
      
      // Ensure 'default' is always first if it exists
      if (names.includes('default')) {
        const filtered = names.filter(n => n !== 'default');
        return ['default', ...filtered];
      }
      return names;
    },
    
    // Get the index of the current active page
    activePageIndex() {
      const index = this.pageNames.indexOf(this.activePage);
      return index >= 0 ? index : 0;
    },
    
    // Track styles - handles the sliding animation
    // Track is 200% wide (2 pages), so each page is 50% of track
    // To move 1 page, we translate by 50% of track width
    trackStyle() {
      const translateX = -(this.activePageIndex * 50);
      return {
        // iOS Safari PWA: Use both prefixed and standard transform
        '-webkit-transform': `translate3d(${translateX}%, 0, 0)`,
        transform: `translate3d(${translateX}%, 0, 0)`,
        '-webkit-transition': `transform ${this.duration}ms ${this.easing}, -webkit-transform ${this.duration}ms ${this.easing}`,
        transition: `transform ${this.duration}ms ${this.easing}`
      };
    }
  },
  
  watch: {
    activePage(newPage, oldPage) {
      console.log('[SLIDE-PANEL] activePage changed:', oldPage, '->', newPage);
      if (newPage !== oldPage) {
        this.previousPage = oldPage;
        this.isTransitioning = true;
        console.log('[SLIDE-PANEL] activePageIndex:', this.activePageIndex, 'trackStyle:', JSON.stringify(this.trackStyle));
      }
    }
  },
  
  methods: {
    onTransitionEnd(event) {
      // Only handle our own transition events
      if (event.propertyName === 'transform' && this.isTransitioning) {
        this.isTransitioning = false;
        this.$emit('page-change', {
          from: this.previousPage,
          to: this.activePage
        });
      }
    },
    
    // Programmatic navigation (can be called via ref)
    goToPage(pageName) {
      if (this.pageNames.includes(pageName)) {
        this.previousPage = this.activePage;
        // Parent should update activePage prop, but this allows imperative use
        this.$emit('update:activePage', pageName);
      }
    }
  }
});

// Export for global registration
window.SlidePanelComponent = SlidePanel;
