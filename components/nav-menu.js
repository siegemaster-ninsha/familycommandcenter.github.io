// Navigation Menu Component (Hamburger)
// _Requirements: 7.1, 7.2_ - Uses uiStore instead of $parent
const NavMenu = Vue.defineComponent({
  name: 'NavMenu',
  props: {
    items: {
      type: Array,
      default: () => ([
        { key: 'chores', label: 'Chores' },
        { key: 'family', label: 'Family' },
        { key: 'shopping', label: 'Shopping' },
        { key: 'account', label: 'Account' },
      ])
    }
  },
  setup() {
    // Access UI store directly instead of using $parent
    const uiStore = window.useUIStore?.();
    return { uiStore };
  },
  data() {
    return {
      open: false,
      deployVersion: null
    };
  },
  mounted() {
    document.addEventListener('click', this.onOutsideClick);
    this.loadVersionInfo();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onOutsideClick);
  },
  methods: {
    toggle() { this.open = !this.open; },
    go(page) {
      // Use UI store to set current page instead of $parent
      try {
        if (this.uiStore) {
          this.uiStore.setCurrentPage(page);
        }
      } catch { /* ignore navigation errors */ }
      this.open = false;
    },
    onOutsideClick(e) {
      if (!this.$el.contains(e.target)) this.open = false;
    },
    async loadVersionInfo() {
      try {
        const response = await fetch('./version.json');
        if (response.ok) {
          this.deployVersion = await response.json();
        } else {
          this.deployVersion = {
            version: 'unknown',
            deployedAt: 'unknown',
            timestamp: new Date().toISOString()
          };
        }
      } catch (error) {
        this.deployVersion = {
          version: 'error',
          deployedAt: 'error loading',
          timestamp: new Date().toISOString()
        };
      }
    },
    formatDeployTime(deployTime) {
      if (!deployTime || deployTime === 'unknown' || deployTime === 'error loading') {
        return deployTime;
      }

      try {
        const date = new Date(deployTime);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
      } catch (error) {
        return deployTime;
      }
    }
  },
  template: `
    <div class="relative" @keydown.esc="open=false">
      <div class="flex items-center gap-3">
        <!-- Version indicator (visible on desktop, hidden on mobile) -->
        <div v-if="deployVersion" class="hidden sm:block text-xs text-secondary-custom bg-secondary-50 px-2 py-1 rounded-md border">
          <span class="font-mono">{{ deployVersion.version }}</span>
          <span class="mx-1">•</span>
          <span class="font-medium">{{ deployVersion.animal }}</span>
          <span class="mx-1">•</span>
          <span class="text-xs">{{ formatDeployTime(deployVersion.deployedAt) }}</span>
        </div>

        <button type="button" class="nav-trigger" @click="toggle" :aria-expanded="open" aria-haspopup="true">
          <div v-html="Helpers.IconLibrary.getIcon('menu', 'lucide', 20, '')"></div>
        </button>
      </div>

      <div v-if="open" class="nav-menu absolute right-0 w-44 z-50" style="top: calc(100% + 8px);">
        <!-- Version info in mobile menu -->
        <div v-if="deployVersion" class="nav-item-version px-3 py-2 text-xs text-secondary-custom bg-secondary-50 border-b">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1">
              <span class="font-mono">{{ deployVersion.version }}</span>
              <span>•</span>
              <span class="font-medium">{{ deployVersion.animal }}</span>
            </div>
            <div class="text-xs opacity-75">
              {{ formatDeployTime(deployVersion.deployedAt) }}
            </div>
          </div>
        </div>

        <button v-for="item in items" :key="item.key" class="nav-item flex items-center gap-2" @click="go(item.key)">
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  `
});

window.NavMenuComponent = NavMenu;

