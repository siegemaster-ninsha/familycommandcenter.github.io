// Base Widget Mixin
// Provides common functionality to all widgets

const WidgetBase = {
  props: {
    // Widget instance configuration
    config: {
      type: Object,
      required: true,
      default: () => ({
        widgetId: '',
        instanceId: '',
        position: { x: 0, y: 0 },
        size: { w: 2, h: 2 },
        settings: {},
        enabled: true
      })
    },
    
    // Is dashboard in edit mode?
    editable: {
      type: Boolean,
      default: false
    }
  },
  
  emits: [
    'refreshed',      // After successful refresh
    'error',          // When error occurs
    'configure',      // Open settings
    'remove',         // Remove widget
    'resize',         // Size changed
    'notification',   // Notify user
    'data-changed',   // Widget data changed
    'focus-requested' // Widget needs focus
  ],
  
  data() {
    return {
      loading: false,
      error: null,
      lastRefresh: null,
      _refreshTimer: null
    };
  },
  
  computed: {
    widgetId() {
      return this.config.widgetId;
    },
    
    instanceId() {
      return this.config.instanceId;
    },
    
    settings() {
      return this.config.settings || {};
    },
    
    position() {
      return this.config.position || { x: 0, y: 0 };
    },
    
    size() {
      return this.config.size || { w: 2, h: 2 };
    },
    
    isCompact() {
      return this.size.w < 2;
    },
    
    isTall() {
      return this.size.h >= 3;
    },
    
    // Check if widget can be refreshed
    refreshable() {
      // Check if widget has metadata defined
      if (this.metadata && typeof this.metadata.refreshable === 'boolean') {
        return this.metadata.refreshable;
      }
      // Default to true if not specified
      return true;
    }
  },
  
  methods: {
    /**
     * Refresh widget data
     * Can be called manually or automatically
     */
    async refresh() {
      if (!this.refreshable) {
        console.warn(`Widget ${this.widgetId} is not refreshable`);
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        // Call widget-specific refresh logic
        if (typeof this.onRefresh === 'function') {
          await this.onRefresh();
        } else {
          console.warn(`Widget ${this.widgetId} does not implement onRefresh`);
        }
        
        this.lastRefresh = new Date();
        this.$emit('refreshed', {
          instanceId: this.instanceId,
          timestamp: this.lastRefresh
        });
      } catch (err) {
        this.error = this.getUserFriendlyError(err);
        this.$emit('error', {
          instanceId: this.instanceId,
          error: err.message || 'Unknown error',
          timestamp: new Date()
        });
        console.error(`Widget ${this.widgetId} refresh error:`, err);
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * Open widget configuration
     */
    configure() {
      if (!this.metadata?.configurable) {
        console.warn(`Widget ${this.widgetId} is not configurable`);
        return;
      }
      
      this.$emit('configure', {
        instanceId: this.instanceId,
        widgetId: this.widgetId,
        currentSettings: this.settings,
        schema: this.metadata.settings?.schema
      });
    },
    
    /**
     * Remove widget from dashboard
     */
    remove() {
      const confirmed = confirm(`Remove ${this.metadata?.name || 'this widget'}?`);
      if (confirmed) {
        this.$emit('remove', {
          instanceId: this.instanceId,
          widgetId: this.widgetId
        });
      }
    },
    
    /**
     * Handle widget resize
     */
    handleResize(newSize) {
      this.$emit('resize', {
        instanceId: this.instanceId,
        size: newSize
      });
      
      // Call widget-specific resize handler
      if (typeof this.onResize === 'function') {
        this.onResize(newSize);
      }
    },
    
    /**
     * Show notification to user
     */
    notify(message, type = 'info') {
      this.$emit('notification', {
        instanceId: this.instanceId,
        message,
        type, // 'info'|'success'|'warning'|'error'
        timestamp: new Date()
      });
    },
    
    /**
     * Convert error to user-friendly message
     */
    getUserFriendlyError(error) {
      if (!error) return 'An unknown error occurred';
      
      const message = error.message || error.toString();
      
      // Map common errors to friendly messages
      const errorMap = {
        'AUTH_REQUIRED': 'Please log in to view this widget',
        'NETWORK_ERROR': 'Unable to load data. Check your connection.',
        'PERMISSION_DENIED': 'You don\'t have permission to view this',
        'NOT_FOUND': 'Data not found',
        'SERVER_ERROR': 'Server error. Please try again later.'
      };
      
      return errorMap[message] || message || 'Something went wrong. Please try again.';
    },
    
    /**
     * Format timestamp for display
     */
    formatTime(date) {
      if (!date) return '';
      
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      
      if (seconds < 60) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      
      return date.toLocaleDateString();
    },
    
    /**
     * Set up auto-refresh timer
     */
    setupAutoRefresh() {
      // Clear existing timer
      if (this._refreshTimer) {
        clearInterval(this._refreshTimer);
        this._refreshTimer = null;
      }
      
      // Set up new timer if interval is configured
      const interval = this.metadata?.refreshInterval;
      if (interval && interval > 0) {
        this._refreshTimer = setInterval(() => {
          this.refresh();
        }, interval);
        
        console.log(`Auto-refresh enabled for ${this.widgetId} every ${interval}ms`);
      }
    },
    
    /**
     * Clean up auto-refresh timer
     */
    cleanupAutoRefresh() {
      if (this._refreshTimer) {
        clearInterval(this._refreshTimer);
        this._refreshTimer = null;
      }
    },
    
    /**
     * Widget-specific lifecycle hooks
     * Override these in your widget implementation
     */
    async onRefresh() {
      // Override in widget
      console.warn(`Widget ${this.widgetId} should implement onRefresh()`);
    },
    
    onConfigure(settings) {
      // Override in widget if needed
    },
    
    onResize(size) {
      // Override in widget if needed
    },
    
    onMount() {
      // Override in widget if needed
    },
    
    onUnmount() {
      // Override in widget if needed
    }
  },
  
  mounted() {
    console.log(`Widget ${this.widgetId} (${this.instanceId}) mounted`);
    
    // Call widget-specific mount logic
    if (typeof this.onMount === 'function') {
      this.onMount();
    }
    
    // Set up auto-refresh
    this.setupAutoRefresh();
    
    // Initial data load
    if (this.refreshable) {
      this.refresh();
    }
  },
  
  beforeUnmount() {
    console.log(`Widget ${this.widgetId} (${this.instanceId}) unmounting`);
    
    // Clean up auto-refresh timer
    this.cleanupAutoRefresh();
    
    // Call widget-specific unmount logic
    if (typeof this.onUnmount === 'function') {
      this.onUnmount();
    }
  },
  
  watch: {
    // Re-initialize auto-refresh if interval changes
    'metadata.refreshInterval'() {
      this.setupAutoRefresh();
    },
    
    // Refresh when settings change
    settings: {
      handler(newSettings, oldSettings) {
        if (oldSettings && JSON.stringify(newSettings) !== JSON.stringify(oldSettings)) {
          if (typeof this.onConfigure === 'function') {
            this.onConfigure(newSettings);
          }
          
          // Auto-refresh after settings change
          if (this.refreshable) {
            this.refresh();
          }
        }
      },
      deep: true
    }
  }
};

// Export for use in widgets
if (typeof window !== 'undefined') {
  window.WidgetBase = WidgetBase;
}

