// Navigation Menu Component (Hamburger)
const NavMenu = Vue.defineComponent({
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
  data() {
    return { open: false };
  },
  mounted() {
    document.addEventListener('click', this.onOutsideClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onOutsideClick);
  },
  methods: {
    toggle() { this.open = !this.open; },
    go(page) {
      try { this.$parent.setCurrentPage(page); } catch {}
      this.open = false;
    },
    onOutsideClick(e) {
      if (!this.$el.contains(e.target)) this.open = false;
    }
  },
  template: `
    <div class="relative" @keydown.esc="open=false">
      <button type="button" class="nav-trigger" @click="toggle" :aria-expanded="open" aria-haspopup="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>
      </button>
      <div v-if="open" class="nav-menu absolute right-0 w-44 z-50" style="top: calc(100% + 8px);">
        <button v-for="item in items" :key="item.key" class="nav-item flex items-center gap-2" @click="go(item.key)">
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  `
});

window.NavMenuComponent = NavMenu;

