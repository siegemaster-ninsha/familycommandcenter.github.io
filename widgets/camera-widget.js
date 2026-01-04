/**
 * Camera Widget
 * 
 * Displays a live camera stream via go2rtc's built-in web player.
 * Uses an iframe to embed go2rtc's stream.html page, which handles
 * WebRTC/MSE negotiation internally and avoids CORS/mixed-content issues.
 * 
 * Note: This widget only works when accessed from the same network as
 * the go2rtc server, or when the browser allows mixed content.
 */

// Widget Metadata
const CameraWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'camera',
  name: 'Camera',
  description: 'Live camera stream via go2rtc',
  icon: 'video',
  category: 'information',
  
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 12, h: 8 },
  
  configurable: true,
  refreshable: true,
  refreshInterval: 0,
  
  permissions: [],
  requiresAuth: false,
  requiredStores: [],
  
  features: {
    exportData: false,
    print: false,
    fullscreen: true,
    notifications: false
  }
});

// Widget Settings Schema
CameraWidgetMetadata.settings = {
  schema: {
    serverUrl: {
      type: 'text',
      label: 'go2rtc Server URL',
      description: 'Base URL of your go2rtc server (e.g., http://192.168.0.75:1984)',
      required: true,
      default: 'http://192.168.0.75:1984',
      placeholder: 'http://192.168.0.75:1984'
    },
    streamName: {
      type: 'text',
      label: 'Stream Name',
      description: 'Name of the stream configured in go2rtc',
      required: true,
      default: 'camera1',
      placeholder: 'camera1'
    }
  }
};

// Camera Widget Component
const CameraWidget = {
  name: 'CameraWidget',
  
  mixins: [window.WidgetBase],
  
  data() {
    return {
      metadata: CameraWidgetMetadata,
      isFullscreen: false,
      iframeLoaded: false,
      loadError: false
    };
  },
  
  computed: {
    serverUrl() {
      return this.config?.settings?.serverUrl || CameraWidgetMetadata.settings.schema.serverUrl.default;
    },
    
    streamName() {
      return this.config?.settings?.streamName || CameraWidgetMetadata.settings.schema.streamName.default;
    },
    
    // go2rtc's built-in player page
    iframeUrl() {
      const base = this.serverUrl.replace(/\/$/, '');
      return `${base}/stream.html?src=${this.streamName}`;
    }
  },
  
  methods: {
    async onRefresh() {
      // Reload the iframe
      this.iframeLoaded = false;
      this.loadError = false;
      
      const iframe = this.$refs.iframe;
      if (iframe) {
        iframe.src = this.iframeUrl;
      }
    },
    
    onIframeLoad() {
      this.iframeLoaded = true;
      this.loadError = false;
    },
    
    onIframeError() {
      this.loadError = true;
      this.iframeLoaded = false;
    },
    
    toggleFullscreen() {
      const container = this.$refs.container;
      if (!container) return;
      
      if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
          this.isFullscreen = true;
        }).catch(err => {
          console.error('Fullscreen failed:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        });
      }
    },
    
    openInNewTab() {
      window.open(this.iframeUrl, '_blank');
    },
    
    onMount() {
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    },
    
    onUnmount() {
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    },
    
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    }
  },
  
  template: `
    <div class="widget-container camera-widget" ref="container">
      <!-- Widget Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(metadata.icon, 'lucide', 20, 'mr-2') : ''"></span>
          {{ metadata.name }}
          <span v-if="iframeLoaded" class="camera-status camera-status--connected">
            <span class="status-dot"></span>
            Live
          </span>
          <span v-else-if="loading" class="camera-status camera-status--connecting">
            Connecting...
          </span>
        </h3>
        <div class="widget-actions">
          <button
            @click="openInNewTab"
            class="widget-action-btn"
            title="Open in new tab"
          >
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('external-link', 'lucide', 16, '') : ''"></span>
          </button>
          <button
            @click="toggleFullscreen"
            class="widget-action-btn"
            title="Fullscreen"
          >
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(isFullscreen ? 'minimize' : 'maximize', 'lucide', 16, '') : ''"></span>
          </button>
          <button
            v-if="editable"
            @click="configure"
            class="widget-action-btn"
            title="Configure"
          >
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16, '') : ''"></span>
          </button>
          <button
            @click="refresh"
            class="widget-action-btn"
            title="Reconnect"
            :disabled="loading"
          >
            <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('refresh-cw', 'lucide', 16, '') : ''"></span>
          </button>
        </div>
      </div>
      
      <!-- Widget Body -->
      <div class="widget-body camera-body">
        <!-- Loading State -->
        <div v-if="loading && !iframeLoaded" class="camera-loading">
          <div class="loading-spinner"></div>
          <p>Connecting to camera...</p>
        </div>
        
        <!-- Error/Help Message -->
        <div v-if="loadError" class="camera-error">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('video-off', 'lucide', 48, 'camera-error-icon') : ''"></span>
          <p class="camera-error-text">Unable to load camera stream</p>
          <p class="camera-error-hint">
            Due to browser security, this widget works best when:<br>
            • Accessed from the same network as the camera<br>
            • Or opened directly in a new tab
          </p>
          <button @click="openInNewTab" class="btn btn-sm btn-primary">
            Open in New Tab
          </button>
        </div>
        
        <!-- Iframe for go2rtc player -->
        <iframe
          ref="iframe"
          :src="iframeUrl"
          class="camera-iframe"
          :class="{ 'camera-iframe--hidden': loadError }"
          frameborder="0"
          allow="autoplay; fullscreen"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(CameraWidgetMetadata, CameraWidget);
  console.log('✅ Camera Widget registered');
}

// Export for use
window.CameraWidget = CameraWidget;
window.CameraWidgetMetadata = CameraWidgetMetadata;
