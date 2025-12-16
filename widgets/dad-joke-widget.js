/**
 * Dad Joke Widget
 *
 * Displays dad jokes from icanhazdadjoke.com API
 * Features: random jokes, search functionality, simple format
 *
 * API: https://icanhazdadjoke.com/api
 * - Completely free, no API key required
 * - Simple joke format with id and joke text
 * - Search functionality available
 */

console.log('🤖 Dad Joke Widget script loaded');

// Widget Metadata
const DadJokeWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'dad-joke',
  name: 'Dad Joke Generator',
  description: 'Get your daily dose of dad jokes',
  icon: 'smile',
  category: 'entertainment',

  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  maxSize: { w: 8, h: 4 },

  configurable: true,
  refreshable: true,
  refreshInterval: 600000, // 10 minutes

  permissions: [],
  requiresAuth: false,
  requiredStores: [],

  features: {
    exportData: false,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
DadJokeWidgetMetadata.settings = {
  schema: {
    searchTerm: {
      type: 'text',
      label: 'Search Term',
      description: 'Search for jokes containing specific words (leave empty for random)',
      required: false,
      default: '',
      placeholder: 'e.g., "cat", "programming", "food"'
    },
    jokeFormat: {
      type: 'select',
      label: 'Joke Format',
      description: 'How to display the joke',
      required: false,
      default: 'single',
      options: [
        { value: 'single', label: 'Single Line' },
        { value: 'wrapped', label: 'Wrapped Text' }
      ]
    },
    autoRefreshInterval: {
      type: 'number',
      label: 'Auto-refresh Interval (minutes)',
      description: 'How often to fetch new jokes (0 to disable)',
      required: false,
      default: 10,
      min: 0,
      max: 60
    }
  }
};

// Dad Joke Widget Component
const DadJokeWidget = {
  name: 'DadJokeWidget',
  mixins: [WidgetBase],

  metadata: DadJokeWidgetMetadata,

  data() {
    return {
      currentJoke: null,
      jokeHistory: []
    };
  },

  template: `
    <div class="dad-joke-widget" :class="{ 'compact': isCompact, 'loading': loading }">
      <!-- Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          <i class="icon" :class="metadata.icon"></i>
          {{ metadata.name }}
        </h3>
        <div class="widget-actions">
          <button
            @click="refresh"
            class="action-btn refresh-btn"
            :disabled="loading"
            title="Get new joke"
          >
            <i class="icon-refresh" :class="{ 'spinning': loading }"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Finding the perfect dad joke...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="icon-alert-circle"></i>
        <p>{{ error }}</p>
        <button @click="refresh" class="retry-btn">Try Again</button>
      </div>

      <!-- Joke Content -->
      <div v-else-if="currentJoke" class="joke-content" :class="{ 'compact': isCompact }">
        <!-- Search Term Badge -->
        <div v-if="!isCompact && settings.searchTerm" class="search-badge">
          Search: "{{ settings.searchTerm }}"
        </div>

        <!-- Joke Text -->
        <div class="joke-text" :class="{ 'compact': isCompact, 'wrapped': settings.jokeFormat === 'wrapped' }">
          <p>{{ currentJoke.joke }}</p>
        </div>

        <!-- Joke Info -->
        <div v-if="!isCompact && currentJoke.id" class="joke-info">
          <small class="joke-id">ID: {{ currentJoke.id }}</small>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="icon-help-circle"></i>
        <p>No joke loaded yet</p>
        <button @click="refresh" class="primary-btn">Get First Joke</button>
      </div>

      <!-- Footer -->
      <div v-if="!isCompact && lastRefresh" class="widget-footer">
        <small class="last-updated">
          Updated {{ formatTime(lastRefresh) }}
        </small>
      </div>
    </div>
  `,

  computed: {
    searchTerm() {
      return this.settings.searchTerm || '';
    },

    jokeFormat() {
      return this.settings.jokeFormat || 'single';
    }
  },

  methods: {
    /**
     * Fetch a new dad joke from the API
     */
    async onRefresh() {
      try {
        const joke = await this.fetchDadJoke();
        this.currentJoke = joke;

        // Add to history (keep last 10)
        this.jokeHistory.unshift(joke);
        if (this.jokeHistory.length > 10) {
          this.jokeHistory = this.jokeHistory.slice(0, 10);
        }

        this.$emit('data-changed', {
          instanceId: this.instanceId,
          data: joke
        });

      } catch (error) {
        console.error('Failed to fetch dad joke:', error);
        throw error;
      }
    },

    /**
     * Fetch dad joke from icanhazdadjoke.com API
     */
    async fetchDadJoke() {
      const baseUrl = 'https://icanhazdadjoke.com';
      let endpoint = '/';

      // If search term is provided, use search endpoint
      if (this.searchTerm && this.searchTerm.trim() !== '') {
        endpoint = `/search?term=${encodeURIComponent(this.searchTerm.trim())}&limit=1`;
      }

      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DadJokeWidget (https://github.com/your-repo/dad-joke-widget)'
          }
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        let jokeData;

        if (this.searchTerm && this.searchTerm.trim() !== '') {
          // Handle search response
          if (!data.results || data.results.length === 0) {
            throw new Error(`No jokes found for search term: "${this.searchTerm}"`);
          }
          jokeData = data.results[0];
        } else {
          // Handle random joke response
          jokeData = data;
        }

        return {
          id: jokeData.id,
          joke: jokeData.joke,
          searchTerm: this.searchTerm || null,
          fetchedAt: new Date().toISOString()
        };

      } catch (error) {
        console.error('icanhazdadjoke.com API error:', error);

        // For demo purposes, return a fallback joke if API fails
        if (error.message.includes('API Error') || error.message.includes('fetch')) {
          return this.getFallbackJoke();
        }

        throw error;
      }
    },

    /**
     * Get a fallback joke when API is unavailable
     */
    getFallbackJoke() {
      const fallbackJokes = [
        {
          id: 'fallback-1',
          joke: 'Why don\'t scientists trust atoms? Because they make up everything!'
        },
        {
          id: 'fallback-2',
          joke: 'What do you call fake spaghetti? An impasta!'
        },
        {
          id: 'fallback-3',
          joke: 'Why did the scarecrow win an award? Because he was outstanding in his field!'
        },
        {
          id: 'fallback-4',
          joke: 'Why do programmers prefer dark mode? Because light attracts bugs!'
        },
        {
          id: 'fallback-5',
          joke: 'What\'s the best thing about Switzerland? I don\'t know, but the flag is a big plus!'
        },
        {
          id: 'fallback-6',
          joke: 'Why don\'t eggs tell jokes? They\'d crack each other up!'
        },
        {
          id: 'fallback-7',
          joke: 'What do you call cheese that isn\'t yours? Nacho cheese!'
        },
        {
          id: 'fallback-8',
          joke: 'How does a penguin build its house? Igloos it together!'
        }
      ];

      return fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
    },

    /**
     * Handle settings changes
     */
    onConfigure(newSettings) {
      // Update refresh interval if changed
      if (newSettings.autoRefreshInterval !== this.settings.autoRefreshInterval) {
        // The base widget will handle the refresh interval update
        console.log('Auto-refresh interval updated:', newSettings.autoRefreshInterval);
      }
    }
  },

  watch: {
    // Update refresh interval when settings change
    'settings.autoRefreshInterval'(newInterval) {
      if (newInterval && newInterval > 0) {
        // Update metadata refresh interval
        this.metadata.refreshInterval = newInterval * 60000; // Convert minutes to milliseconds
        this.setupAutoRefresh();
      }
    }
  }
};

// Register widget
const registerDadJokeWidget = () => {
  if (window.WidgetRegistry && window.WidgetTypes && window.WidgetBase) {
    try {
      const success = window.WidgetRegistry.register(DadJokeWidgetMetadata, DadJokeWidget);
      if (success) {
        console.log('✅ Dad Joke Widget registered successfully');
      } else {
        console.error('❌ Failed to register Dad Joke Widget');
      }
    } catch (error) {
      console.error('❌ Error registering Dad Joke Widget:', error);
    }
  } else {
    // Try again in next tick
    setTimeout(registerDadJokeWidget, 50);
  }
};

if (typeof window !== 'undefined') {
  // Start registration process
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerDadJokeWidget);
  } else {
    registerDadJokeWidget();
  }
}

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DadJokeWidget, DadJokeWidgetMetadata };
}
