// Learning Hub Page Component
// Main page with sidebar navigation for learning features
// **Feature: learning-hub-ai-chat**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
// **Feature: homework-grading**
// **Validates: Requirements 1.1, 1.2, 1.3**

const LearningHubPage = Vue.defineComponent({
  name: 'LearningHubPage',
  template: `
    <div class="learning-hub-layout">
      <!-- Mobile Header (visible on mobile only) -->
      <div class="learning-hub-mobile-header">
        <button 
          @click="toggleMobileSidebar"
          class="btn-secondary learning-hub-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <div v-html="getIcon(mobileMenuOpen ? 'x' : 'menu', 'lucide', 20, '')"></div>
        </button>
        <h1 class="learning-hub-mobile-title">{{ activeTabLabel }}</h1>
      </div>
      
      <!-- Sidebar Navigation -->
      <!-- **Validates: Requirements 1.1, 1.2** -->
      <aside 
        class="learning-hub-sidebar"
        :class="{ 'learning-hub-sidebar--open': mobileMenuOpen }"
        role="navigation"
        aria-label="Learning Hub navigation"
      >
        <div class="learning-hub-sidebar-header">
          <h2 class="learning-hub-sidebar-title">
            <div v-html="getIcon('graduationCap', 'lucide', 24, 'text-primary-custom')"></div>
            Learning Hub
          </h2>
        </div>
        
        <nav class="learning-hub-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="selectTab(tab.key)"
            class="learning-hub-nav-item"
            :class="{ 'learning-hub-nav-item--active': activeTab === tab.key }"
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
        class="learning-hub-overlay"
        @click="closeMobileSidebar"
      ></div>
      
      <!-- Content Panel -->
      <!-- **Validates: Requirements 1.3** -->
      <main class="learning-hub-content" role="main">
        <!-- AI Chat Panel -->
        <ai-chat-panel v-if="activeTab === 'ai-chat'"></ai-chat-panel>
        
        <!-- Homework Grading Panel -->
        <!-- **Feature: homework-grading, Validates: Requirements 1.2, 1.3** -->
        <homework-grading-panel v-else-if="activeTab === 'homework-grading'"></homework-grading-panel>
        
        <!-- Placeholder for future tabs -->
        <div v-else class="learning-hub-placeholder">
          <div v-html="getIcon('construction', 'lucide', 48, 'text-secondary-custom')"></div>
          <p class="text-secondary-custom">Coming soon...</p>
        </div>
      </main>
    </div>
  `,
  
  data() {
    return {
      // Default to AI Chat tab
      // **Validates: Requirements 1.2**
      activeTab: 'ai-chat',
      
      // Mobile menu state
      mobileMenuOpen: false,
      
      // Available tabs (extensible for future features)
      tabs: [
        { key: 'ai-chat', label: 'AI Chat', icon: 'messageCircle' },
        // **Feature: homework-grading, Validates: Requirements 1.1**
        { key: 'homework-grading', label: 'Homework Grading', icon: 'clipboardCheck' }
      ]
    };
  },
  
  computed: {
    /**
     * Get the label of the currently active tab
     */
    activeTabLabel() {
      const tab = this.tabs.find(t => t.key === this.activeTab);
      return tab ? tab.label : 'Learning Hub';
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
     * **Validates: Requirements 1.3**
     * @param {string} tabKey - The key of the tab to select
     */
    selectTab(tabKey) {
      this.activeTab = tabKey;
      this.closeMobileSidebar();
    },
    
    /**
     * Toggle mobile sidebar visibility
     * **Validates: Requirements 1.4**
     */
    toggleMobileSidebar() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      // Prevent body scroll when menu is open
      if (this.mobileMenuOpen) {
        document.body.classList.add('learning-hub-menu-open');
      } else {
        document.body.classList.remove('learning-hub-menu-open');
      }
    },
    
    /**
     * Close mobile sidebar
     */
    closeMobileSidebar() {
      this.mobileMenuOpen = false;
      document.body.classList.remove('learning-hub-menu-open');
    }
  },
  
  beforeUnmount() {
    // Clean up body class on unmount
    document.body.classList.remove('learning-hub-menu-open');
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.LearningHubPage = LearningHubPage;
}
