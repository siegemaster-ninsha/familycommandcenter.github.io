/**
 * Advice Widget
 *
 * Displays random advice from the Advice Slip API
 * Features: random advice, search, favorites, categories
 *
 * API: https://api.adviceslip.com/
 * - Free, no API key needed
 * - Random advice endpoint
 * - Search by keyword
 * - RSS feed available
 */

// Widget Metadata
const AdviceWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'advice',
  name: 'Daily Advice',
  description: 'Random advice and wisdom for daily inspiration',
  icon: 'lightbulb',
  category: 'lifestyle',

  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 12, h: 4 },

  configurable: true,
  refreshable: true,
  refreshInterval: 3600000, // 1 hour

  permissions: [],
  requiresAuth: false,
  requiredStores: [],

  features: {
    exportData: true,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
AdviceWidgetMetadata.settings = {
  schema: {
    autoRefresh: {
      type: 'boolean',
      label: 'Auto-Refresh',
      description: 'Automatically get new advice every hour',
      required: false,
      default: false,
      toggleLabel: 'Auto-refresh'
    },
    adviceType: {
      type: 'select',
      label: 'Advice Type',
      description: 'Filter advice by category',
      required: false,
      default: 'random',
      options: [
        { value: 'random', label: 'Random' },
        { value: 'inspirational', label: 'Inspirational' },
        { value: 'motivational', label: 'Motivational' },
        { value: 'funny', label: 'Funny' },
        { value: 'practical', label: 'Practical' }
      ]
    }
  }
};

// Advice Widget Component
const AdviceWidget = {
  name: 'AdviceWidget',

  mixins: [WidgetBase],

  data() {
    return {
      metadata: AdviceWidgetMetadata,

      // Current advice
      currentAdvice: null,


      // Categories for filtering
      categories: [
        'inspirational', 'motivational', 'funny', 'practical',
        'life', 'work', 'relationships', 'health', 'money'
      ],

      // Mock advice for demo/offline
      mockAdvice: [
        { slip_id: 1, advice: "Accept that you have no control over everything." },
        { slip_id: 2, advice: "Smile and the world smiles with you. Frown and you're on your own." },
        { slip_id: 3, advice: "Remember that spiders are more afraid of you, than you are of them." },
        { slip_id: 4, advice: "When in doubt, just take the next small step." },
        { slip_id: 5, advice: "Life is short. Smile while you still have teeth." }
      ]
    };
  },

  computed: {
    // Has advice to display
    hasAdvice() {
      return this.currentAdvice !== null;
    }
  },

  mounted() {
    // Get initial advice
    this.loadRandomAdvice();
  },

  methods: {
    // Required: Implement onRefresh
    async onRefresh() {
      await this.loadRandomAdvice();
    },

    // Load random advice from API
    async loadRandomAdvice() {
      try {
        const response = await fetch('https://api.adviceslip.com/advice');

        if (!response.ok) {
          throw new Error('Failed to fetch advice');
        }

        const data = await response.json();
        this.currentAdvice = data.slip;

        console.log('✅ New advice loaded:', this.currentAdvice.advice.substring(0, 50) + '...');
      } catch (error) {
        console.error('Advice API failed, using mock data:', error);
        // Use mock data as fallback
        const randomIndex = Math.floor(Math.random() * this.mockAdvice.length);
        this.currentAdvice = this.mockAdvice[randomIndex];
      }
    },



    // Format advice text for display
    formatAdvice(advice) {
      return advice.advice.charAt(0).toUpperCase() + advice.advice.slice(1);
    },

    // Get advice by ID (for favorites)
    async getAdviceById(id) {
      try {
        const response = await fetch(`https://api.adviceslip.com/advice/${id}`);
        if (response.ok) {
          const data = await response.json();
          return data.slip;
        }
      } catch (error) {
        console.error('Failed to fetch advice by ID:', error);
      }
      return null;
    }
  },

  template: `
    <div class="widget-container advice-widget">
      <!-- Widget Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(metadata.icon, 'lucide', 20, 'mr-2') : ''"></div>
          {{ metadata.name }}
        </h3>
        <div class="widget-actions">
          <button
            v-if="editable"
            @click="configure"
            class="widget-action-btn"
            title="Configure"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16, '') : ''"></div>
          </button>
          <button
            v-if="refreshable"
            @click="refresh"
            class="widget-action-btn"
            title="New Advice"
            :disabled="loading"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('shuffle', 'lucide', 16, '') : ''"></div>
          </button>
        </div>
      </div>

      <!-- Widget Body -->
      <div class="widget-body advice-body">
        <!-- Main Advice Display -->
        <div v-if="hasAdvice" class="advice-content">
          <!-- Current Advice -->
          <div class="advice-main">
            <blockquote class="advice-text">
              "{{ formatAdvice(currentAdvice) }}"
            </blockquote>

          </div>


        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="text-center py-8">
          <div class="loading-spinner"></div>
          <p class="text-sm text-gray-600 mt-2">Getting wisdom...</p>
        </div>

        <!-- Error/No Data State -->
        <div v-else class="text-center py-8">
          <div class="text-4xl mb-2">💭</div>
          <p class="text-sm text-gray-600 mb-4">No advice available</p>
          <button @click="loadRandomAdvice" class="btn btn-sm btn-primary">
            Get Advice
          </button>
        </div>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(AdviceWidgetMetadata, AdviceWidget);
  console.log('✅ Advice Widget registered');
}

// Export for use
window.AdviceWidget = AdviceWidget;
window.AdviceWidgetMetadata = AdviceWidgetMetadata;

