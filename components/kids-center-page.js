// Kid's Center Page Component
// Main page with sidebar navigation for kid-focused features
// **Feature: decision-wheel**
// **Validates: Requirements 1.1, 1.2, 1.3**

const KidsCenterPage = Vue.defineComponent({
  name: 'KidsCenterPage',
  template: `
    <div class="kids-center-layout">
      <!-- Mobile Header (visible on mobile only) -->
      <div class="kids-center-mobile-header">
        <button 
          @click="toggleMobileSidebar"
          class="btn-secondary kids-center-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <div v-html="getIcon(mobileMenuOpen ? 'x' : 'menu', 'lucide', 20, '')"></div>
        </button>
        <h1 class="kids-center-mobile-title">{{ activeTabLabel }}</h1>
      </div>
      
      <!-- Sidebar Navigation -->
      <!-- **Validates: Requirements 1.1, 1.2** -->
      <aside 
        class="kids-center-sidebar"
        :class="{ 'kids-center-sidebar--open': mobileMenuOpen }"
        role="navigation"
        aria-label="Kid's Center navigation"
      >
        <div class="kids-center-sidebar-header">
          <h2 class="kids-center-sidebar-title">
            <div v-html="getIcon('graduationCap', 'lucide', 24, 'text-primary-custom')"></div>
            Kid's Center
          </h2>
        </div>
        
        <nav class="kids-center-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="selectTab(tab.key)"
            class="kids-center-nav-item"
            :class="{ 'kids-center-nav-item--active': activeTab === tab.key }"
            :aria-current="activeTab === tab.key ? 'page' : undefined"
          >
            <div v-html="getIcon(tab.icon, 'lucide', 20, '')"></div>
            <span>{{ tab.label }}</span>
          </button>
        </nav>
      </aside>
      
      <!-- Mobile Overlay -->
      <div 
        v-if="mobileMenuOpen"
        class="kids-center-overlay"
        @click="closeMobileSidebar"
      ></div>
      
      <!-- Content Panel -->
      <!-- **Validates: Requirements 2.2** -->
      <main class="kids-center-content" role="main">
        <!-- AI Chat Panel -->
        <ai-chat-panel v-if="activeTab === 'ai-chat'"></ai-chat-panel>
        
        <!-- Decision Wheel Panel -->
        <decision-wheel-panel v-else-if="activeTab === 'decision-wheel'"></decision-wheel-panel>

        <!-- Scoundrel Game Panel -->
        <scoundrel-game-panel v-else-if="activeTab === 'scoundrel-game'"></scoundrel-game-panel>

        <!-- Placeholder for future tabs -->
        <div v-else class="kids-center-placeholder">
          <div v-html="getIcon('construction', 'lucide', 48, 'text-secondary-custom')"></div>
          <p class="text-secondary-custom">Coming soon...</p>
        </div>
      </main>
    </div>
  `,
  
  data() {
    return {
      // Default to AI Chat tab
      activeTab: 'ai-chat',
      
      // Mobile menu state
      mobileMenuOpen: false,
      
      // Available tabs
      // **Validates: Requirements 2.1, 2.3**
      tabs: [
        { key: 'ai-chat', label: 'AI Chat', icon: 'messageCircle' },
        { key: 'decision-wheel', label: 'Decision Wheel', icon: 'target' },
        { key: 'scoundrel-game', label: 'Scoundrel', icon: 'swords' }
      ]
    };
  },
  
  computed: {
    /**
     * Get the label of the currently active tab
     */
    activeTabLabel() {
      const tab = this.tabs.find(t => t.key === this.activeTab);
      return tab ? tab.label : "Kid's Center";
    }
  },
  
  methods: {
    /**
     * Get icon HTML using the Helpers library
     */
    getIcon(iconName, library = 'lucide', size = 16, className = '') {
      if (typeof window.Helpers !== 'undefined' && window.Helpers.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(iconName, library, size, className);
      }
      return '';
    },
    
    /**
     * Select a tab and show its content
     * **Validates: Requirements 2.2, 2.4**
     * @param {string} tabKey - The key of the tab to select
     */
    selectTab(tabKey) {
      this.activeTab = tabKey;
      this.closeMobileSidebar();
    },
    
    /**
     * Toggle mobile sidebar visibility
     */
    toggleMobileSidebar() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      // Prevent body scroll when menu is open
      if (this.mobileMenuOpen) {
        document.body.classList.add('kids-center-menu-open');
      } else {
        document.body.classList.remove('kids-center-menu-open');
      }
    },
    
    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
      this.mobileMenuOpen = false;
      document.body.classList.remove('kids-center-menu-open');
    }
  },
  
  beforeUnmount() {
    // Clean up body class on unmount
    document.body.classList.remove('kids-center-menu-open');
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.KidsCenterPage = KidsCenterPage;
}
