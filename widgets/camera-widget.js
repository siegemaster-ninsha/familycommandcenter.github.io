/**
 * Camera Widget
 * 
 * Displays a live camera stream via go2rtc WebRTC/MSE.
 * Requires go2rtc running on a local server.
 * 
 * Features:
 * - WebRTC streaming (lowest latency)
 * - MSE fallback for broader compatibility
 * - Fullscreen toggle
 * - Connection status indicator
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
  refreshInterval: 0, // No auto-refresh needed for live stream
  
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
    },
    streamMode: {
      type: 'select',
      label: 'Stream Mode',
      description: 'WebRTC has lowest latency, MSE is more compatible',
      required: false,
      default: 'webrtc',
      options: [
        { value: 'webrtc', label: 'WebRTC (Low Latency)' },
        { value: 'mse', label: 'MSE (Compatible)' }
      ]
    },
    showControls: {
      type: 'boolean',
      label: 'Show Video Controls',
      description: 'Display play/pause and volume controls',
      required: false,
      default: false,
      toggleLabel: 'Show controls'
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
      
      // Connection state
      connected: false,
      connectionError: null,
      
      // WebRTC
      pc: null, // RTCPeerConnection
      
      // Fullscreen
      isFullscreen: false
    };
  },
  
  computed: {
    serverUrl() {
      return this.config?.settings?.serverUrl || CameraWidgetMetadata.settings.schema.serverUrl.default;
    },
    
    streamName() {
      return this.config?.settings?.streamName || CameraWidgetMetadata.settings.schema.streamName.default;
    },
    
    streamMode() {
      return this.config?.settings?.streamMode || CameraWidgetMetadata.settings.schema.streamMode.default;
    },
    
    showControls() {
      return this.config?.settings?.showControls || false;
    },
    
    // Build stream URL based on mode
    streamUrl() {
      const base = this.serverUrl.replace(/\/$/, '');
      if (this.streamMode === 'mse') {
        return `${base}/api/stream.mp4?src=${this.streamName}`;
      }
      // WebRTC uses API endpoint
      return `${base}/api/webrtc?src=${this.streamName}`;
    }
  },
  
  methods: {
    async onRefresh() {
      await this.connectStream();
    },
    
    async connectStream() {
      this.connectionError = null;
      
      try {
        if (this.streamMode === 'webrtc') {
          await this.connectWebRTC();
        } else {
          await this.connectMSE();
        }
      } catch (error) {
        console.error('Camera connection failed:', error);
        this.connectionError = error.message || 'Failed to connect to camera';
        this.connected = false;
      }
    },
    
    async connectWebRTC() {
      // Clean up existing connection
      this.disconnectStream();
      
      const video = this.$refs.video;
      if (!video) return;
      
      // Create peer connection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Handle incoming tracks
      this.pc.ontrack = (event) => {
        video.srcObject = event.streams[0];
        this.connected = true;
      };
      
      // Handle connection state
      this.pc.onconnectionstatechange = () => {
        if (this.pc.connectionState === 'failed') {
          this.connectionError = 'WebRTC connection failed';
          this.connected = false;
        }
      };
      
      // Add transceivers for receiving
      this.pc.addTransceiver('video', { direction: 'recvonly' });
      this.pc.addTransceiver('audio', { direction: 'recvonly' });
      
      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      
      // Wait for ICE gathering
      await new Promise((resolve) => {
        if (this.pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          this.pc.onicegatheringstatechange = () => {
            if (this.pc.iceGatheringState === 'complete') resolve();
          };
        }
      });
      
      // Send offer to go2rtc
      const base = this.serverUrl.replace(/\/$/, '');
      const response = await fetch(`${base}/api/webrtc?src=${this.streamName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: this.pc.localDescription.sdp
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      // Set remote description
      const answer = await response.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answer
      });
    },
    
    async connectMSE() {
      const video = this.$refs.video;
      if (!video) return;
      
      // For MSE, just set the source directly
      // go2rtc handles the streaming
      video.src = this.streamUrl;
      
      video.onloadeddata = () => {
        this.connected = true;
      };
      
      video.onerror = () => {
        this.connectionError = 'Failed to load video stream';
        this.connected = false;
      };
      
      try {
        await video.play();
      } catch (e) {
        // Autoplay might be blocked, that's ok
        console.log('Autoplay blocked, user interaction required');
      }
    },
    
    disconnectStream() {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      
      const video = this.$refs.video;
      if (video) {
        video.srcObject = null;
        video.src = '';
      }
      
      this.connected = false;
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
    
    onMount() {
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    },
    
    onUnmount() {
      this.disconnectStream();
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
          <span v-if="connected" class="camera-status camera-status--connected">
            <span class="status-dot"></span>
            Live
          </span>
          <span v-else-if="loading" class="camera-status camera-status--connecting">
            Connecting...
          </span>
          <span v-else class="camera-status camera-status--disconnected">
            Offline
          </span>
        </h3>
        <div class="widget-actions">
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
        <!-- Error State -->
        <div v-if="connectionError && !loading" class="camera-error">
          <span v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('video-off', 'lucide', 48, 'camera-error-icon') : ''"></span>
          <p class="camera-error-text">{{ connectionError }}</p>
          <button @click="refresh" class="btn btn-sm btn-primary">
            Retry Connection
          </button>
        </div>
        
        <!-- Video Element -->
        <video
          ref="video"
          class="camera-video"
          :class="{ 'camera-video--hidden': connectionError && !loading }"
          autoplay
          muted
          playsinline
          :controls="showControls"
        ></video>
        
        <!-- Loading Overlay -->
        <div v-if="loading && !connected" class="camera-loading">
          <div class="loading-spinner"></div>
          <p>Connecting to camera...</p>
        </div>
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
