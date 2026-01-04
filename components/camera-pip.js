/**
 * Camera Picture-in-Picture Component
 * 
 * A floating, draggable camera view that can be minimized/expanded.
 * Uses go2rtc stream via HTTPS proxy.
 */

const CameraPip = {
  name: 'CameraPip',
  
  template: `
    <div 
      v-if="isVisible"
      class="camera-pip"
      :class="{ 
        'camera-pip--minimized': isMinimized,
        'camera-pip--dragging': isDragging 
      }"
      :style="positionStyle"
      ref="pip"
    >
      <!-- Header bar -->
      <div 
        class="camera-pip-header"
        @mousedown="startDrag"
        @touchstart.passive="startDrag"
      >
        <span class="camera-pip-title">
          <span v-html="getIcon('video', 14)"></span>
          Camera
        </span>
        <div class="camera-pip-controls">
          <button 
            @click.stop="toggleMinimize" 
            class="camera-pip-btn"
            :title="isMinimized ? 'Expand' : 'Minimize'"
          >
            <span v-html="getIcon(isMinimized ? 'maximize-2' : 'minimize-2', 14)"></span>
          </button>
          <button 
            @click.stop="close" 
            class="camera-pip-btn"
            title="Close"
          >
            <span v-html="getIcon('x', 14)"></span>
          </button>
        </div>
      </div>
      
      <!-- Camera iframe (hidden when minimized) -->
      <div v-show="!isMinimized" class="camera-pip-body">
        <iframe
          :src="streamUrl"
          class="camera-pip-iframe"
          frameborder="0"
          scrolling="no"
          allow="autoplay"
        ></iframe>
      </div>
    </div>
  `,
  
  props: {
    serverUrl: {
      type: String,
      default: 'https://192.168.0.75:8443'
    },
    streamName: {
      type: String,
      default: 'camera1'
    },
    defaultPosition: {
      type: Object,
      default: () => ({ bottom: 20, right: 20 })
    }
  },
  
  data() {
    return {
      isVisible: true,
      isMinimized: false,
      isDragging: false,
      position: { ...this.defaultPosition },
      dragOffset: { x: 0, y: 0 }
    };
  },
  
  computed: {
    streamUrl() {
      const base = this.serverUrl.replace(/\/$/, '');
      return `${base}/stream.html?src=${this.streamName}`;
    },
    
    positionStyle() {
      return {
        bottom: `${this.position.bottom}px`,
        right: `${this.position.right}px`
      };
    }
  },
  
  methods: {
    getIcon(name, size = 16) {
      if (window.Helpers?.IconLibrary?.getIcon) {
        return window.Helpers.IconLibrary.getIcon(name, 'lucide', size);
      }
      return '';
    },
    
    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
    },
    
    close() {
      this.isVisible = false;
      this.$emit('close');
    },
    
    show() {
      this.isVisible = true;
    },
    
    startDrag(e) {
      if (e.target.closest('.camera-pip-btn')) return;
      
      this.isDragging = true;
      const pip = this.$refs.pip;
      const rect = pip.getBoundingClientRect();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      this.dragOffset = {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
      
      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
      document.addEventListener('touchmove', this.onDrag, { passive: false });
      document.addEventListener('touchend', this.stopDrag);
    },
    
    onDrag(e) {
      if (!this.isDragging) return;
      
      e.preventDefault();
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const pip = this.$refs.pip;
      const pipWidth = pip.offsetWidth;
      const pipHeight = pip.offsetHeight;
      
      // Calculate new position (from bottom-right)
      const newRight = window.innerWidth - clientX - (pipWidth - this.dragOffset.x);
      const newBottom = window.innerHeight - clientY - (pipHeight - this.dragOffset.y);
      
      // Constrain to viewport
      this.position.right = Math.max(10, Math.min(newRight, window.innerWidth - pipWidth - 10));
      this.position.bottom = Math.max(10, Math.min(newBottom, window.innerHeight - pipHeight - 10));
    },
    
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
      document.removeEventListener('touchmove', this.onDrag);
      document.removeEventListener('touchend', this.stopDrag);
    }
  },
  
  beforeUnmount() {
    this.stopDrag();
  }
};

// Register globally
if (typeof window !== 'undefined') {
  window.CameraPip = CameraPip;
}
