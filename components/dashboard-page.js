// Dashboard Page Component
// User-configurable dashboard with widget system

const DashboardPageComponent = {
  name: 'DashboardPage',
  
  setup() {
    const dashboardStore = useDashboardStore();
    const authStore = useAuthStore();
    
    return {
      dashboardStore,
      authStore,
      widgetRegistry // Make widgetRegistry available to template
    };
  },
  
  data() {
    return {
      showWidgetPicker: false,
      showConfigurator: false,
      currentWidget: null,
      loading: true,
      
      // Resize state
      resizingWidget: null,
      resizeStartX: 0,
      resizeStartY: 0,
      resizeStartWidth: 0,
      resizeStartHeight: 0,
      resizeGridCellWidth: 0,
      resizeGridCellHeight: 0
    };
  },
  
  computed: {
    isEditMode() {
      return this.dashboardStore.isEditMode;
    },
    
    widgets() {
      return this.dashboardStore.activeWidgets;
    },
    
    hasWidgets() {
      return this.widgets.length > 0;
    },
    
    gridColumns() {
      return this.dashboardStore.settings.gridColumns;
    },

    // Get actual grid columns from CSS (for resize calculations)
    actualGridColumns() {
      // This will be calculated in the resize logic from CSS grid-template-columns
      return 24; // Default fallback
    }
  },
  
  async mounted() {
    try {
      // load dashboard configuration
      await this.dashboardStore.loadDashboard();
      
      // if no widgets, add default widgets
      if (this.widgets.length === 0) {
        this.addDefaultWidgets();
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      this.loading = false;
    }
  },
  
  methods: {
    toggleEditMode() {
      this.dashboardStore.toggleEditMode();
    },
    
    openWidgetPicker() {
      this.showWidgetPicker = true;
    },
    
    handleAddWidget(widgetId) {
      // create new widget instance
      const config = widgetRegistry.createInstance(widgetId, {
        position: this.findNextPosition(),
        size: null, // will use default size from metadata
        settings: {}
      });
      
      this.dashboardStore.addWidget(config);
      this.showWidgetPicker = false;
    },
    
    handleConfigureWidget(widget) {
      const widgetDef = widgetRegistry.get(widget.widgetId);
      
      this.currentWidget = {
        widgetId: widget.widgetId,
        instanceId: widget.instanceId,
        settings: widget.settings,
        schema: widgetDef?.metadata?.settings?.schema
      };
      
      this.showConfigurator = true;
    },
    
    handleSaveConfig({ instanceId, settings }) {
      this.dashboardStore.updateWidgetSettings(instanceId, settings);
      this.showConfigurator = false;
      this.currentWidget = null;
    },
    
    handleRemoveWidget(instanceId) {
      if (confirm('Remove this widget from your dashboard?')) {
        this.dashboardStore.removeWidget(instanceId);
      }
    },
    
    findNextPosition() {
      // simple algorithm: find first available spot
      const occupied = new Set();
      this.widgets.forEach(w => {
        const key = `${w.position.x},${w.position.y}`;
        occupied.add(key);
      });
      
      // find first unoccupied position
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < this.gridColumns; x++) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) {
            return { x, y };
          }
        }
      }
      
      // fallback: bottom of current widgets
      return { x: 0, y: this.widgets.length };
    },
    
    addDefaultWidgets() {
      // add earnings summary widget by default
      if (widgetRegistry.has('earnings-summary')) {
        const config = widgetRegistry.createInstance('earnings-summary', {
          position: { x: 0, y: 0 },
          settings: {
            showDetails: true,
            compactView: false,
            individualsOnly: false
          }
        });
        
        this.dashboardStore.addWidget(config);
      }
    },
    
    getWidgetComponent(widgetId) {
      const widget = widgetRegistry.get(widgetId);
      if (!widget) {
        console.warn(`Widget ${widgetId} not found in registry`);
        return null;
      }
      return widget.component;
    },
    
    // Resize Methods
    startResize(event, widget) {
      event.preventDefault();
      event.stopPropagation();
      
      // Get widget metadata for size constraints
      const widgetDef = widgetRegistry.get(widget.widgetId);
      if (!widgetDef) return;
      
      this.resizingWidget = widget.instanceId;
      
      // Get mouse/touch position
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
      
      this.resizeStartX = clientX;
      this.resizeStartY = clientY;
      this.resizeStartWidth = widget.size?.w || 1;
      this.resizeStartHeight = widget.size?.h || 1;
      
      // Calculate grid cell dimensions
      const gridElement = event.target.closest('.dashboard-grid');
      if (gridElement) {
        const gridStyles = window.getComputedStyle(gridElement);
        const gap = parseFloat(gridStyles.gap) || 16;
        const gridWidth = gridElement.offsetWidth;

        // Parse grid-template-columns to get actual column count
        // Handle both 'repeat(24, 1fr)' and individual column definitions
        const templateColumns = gridStyles.gridTemplateColumns;
        let columns = 24; // fallback

        if (templateColumns.includes('repeat(')) {
          // Parse repeat function: repeat(24, 1fr)
          const repeatMatch = templateColumns.match(/repeat\((\d+),\s*[^)]+\)/);
          if (repeatMatch) {
            columns = parseInt(repeatMatch[1]);
          }
        } else {
          // Count individual column definitions
          columns = templateColumns.split(' ').length;
        }

        this.resizeGridCellWidth = (gridWidth - (gap * (columns - 1))) / columns;

        // Estimate row height from auto-rows minmax
        this.resizeGridCellHeight = 80; // matches auto-rows minmax(160px, auto)
      }
      
      // Add event listeners
      document.addEventListener('mousemove', this.handleResize);
      document.addEventListener('mouseup', this.stopResize);
      document.addEventListener('touchmove', this.handleResize);
      document.addEventListener('touchend', this.stopResize);
      
      // Add class to body to prevent text selection
      document.body.classList.add('resizing-widget');
    },
    
    handleResize(event) {
      if (!this.resizingWidget) return;
      
      const widget = this.widgets.find(w => w.instanceId === this.resizingWidget);
      if (!widget) return;
      
      const widgetDef = widgetRegistry.get(widget.widgetId);
      if (!widgetDef) return;
      
      // Get current mouse/touch position
      const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
      const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
      
      // Calculate delta
      const deltaX = clientX - this.resizeStartX;
      const deltaY = clientY - this.resizeStartY;
      
      // Calculate new size in grid units (more granular for better control)
      const widthIncrement = Math.round(deltaX / (this.resizeGridCellWidth / 2)); // Half-cell increments
      const heightIncrement = Math.round(deltaY / (this.resizeGridCellHeight / 2)); // Half-cell increments

      const newWidth = Math.max(
        widgetDef.metadata.minSize.w,
        Math.min(
          widgetDef.metadata.maxSize.w,
          this.resizeStartWidth + widthIncrement
        )
      );

      const newHeight = Math.max(
        widgetDef.metadata.minSize.h,
        Math.min(
          widgetDef.metadata.maxSize.h,
          this.resizeStartHeight + heightIncrement
        )
      );
      
      // Update widget size
      if (!widget.size) {
        widget.size = { w: 2, h: 2 };
      }
      widget.size.w = newWidth;
      widget.size.h = newHeight;
    },
    
    stopResize() {
      if (!this.resizingWidget) return;
      
      // Save the new layout
      this.dashboardStore.saveDashboard();
      
      // Clean up
      this.resizingWidget = null;
      document.removeEventListener('mousemove', this.handleResize);
      document.removeEventListener('mouseup', this.stopResize);
      document.removeEventListener('touchmove', this.handleResize);
      document.removeEventListener('touchend', this.stopResize);
      document.body.classList.remove('resizing-widget');
    }
  },
  
  template: `
    <div class="dashboard-page">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex-1">
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
              <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('layout-dashboard', 'lucide', 24, 'text-primary-600') : ''"></div>
              Dashboard
            </h1>
            <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Customize your workspace with widgets
            </p>
          </div>
          
          <div class="flex gap-3 flex-shrink-0">
            <button
              @click="openWidgetPicker"
              class="btn-primary flex items-center gap-2 px-4 py-2.5"
            >
              <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('plus', 'lucide', 20, 'text-white') : ''"></div>
              <span class="font-medium">Add Widget</span>
            </button>

            <button
              @click="toggleEditMode"
              :class="isEditMode ? 'btn-primary' : 'btn-secondary'"
              class="flex items-center gap-2 px-4 py-2.5"
            >
              <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(isEditMode ? 'check' : 'settings', 'lucide', 20, '') : ''"></div>
              <span class="font-medium">{{ isEditMode ? 'Done' : 'Customize' }}</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p class="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="!hasWidgets" class="empty-dashboard">
        <div class="text-center py-16 px-4">
          <div class="text-7xl mb-6">📊</div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Your Dashboard is Empty
          </h2>
          <p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Add widgets to customize your dashboard and create your perfect workspace
          </p>
          <button
            @click="openWidgetPicker"
            class="btn-primary px-6 py-3 text-lg font-medium"
          >
            Add Your First Widget
          </button>
        </div>
      </div>
      
      <!-- Widget Grid -->
      <div v-else class="dashboard-grid">
        <div
          v-for="widget in widgets"
          :key="widget.instanceId"
          class="dashboard-widget-wrapper"
          :class="{ 'edit-mode': isEditMode, 'resizing': resizingWidget === widget.instanceId }"
          :style="{
            gridColumn: 'span ' + (widget.size?.w || 2),
            gridRow: 'span ' + (widget.size?.h || 2)
          }"
        >
          <!-- Render Widget Component Dynamically -->
          <component
            v-if="getWidgetComponent(widget.widgetId)"
            :is="getWidgetComponent(widget.widgetId)"
            :config="widget"
            :editable="isEditMode"
            @configure="handleConfigureWidget(widget)"
            @remove="handleRemoveWidget(widget.instanceId)"
          />
          
          <!-- Widget Not Found Error -->
          <div v-else class="widget-container">
            <div class="widget-body widget-error">
              <p>Widget "{{ widget.widgetId }}" not found</p>
              <button @click="handleRemoveWidget(widget.instanceId)" class="btn-sm btn-secondary mt-2">
                Remove
              </button>
            </div>
          </div>

          <!-- Remove Button (Top-Right Corner) -->
          <button
            v-if="isEditMode"
            @click.stop="handleRemoveWidget(widget.instanceId)"
            class="widget-remove-btn"
            title="Remove widget"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM5.5 4L8 6.5 10.5 4 12 5.5 9.5 8 12 10.5 10.5 12 8 9.5 5.5 12 4 10.5 6.5 8 4 5.5z"/>
            </svg>
          </button>

          <!-- Resize Handle (Bottom-Right Corner) -->
          <div
            v-if="isEditMode"
            class="widget-resize-handle"
            @mousedown.stop="startResize($event, widget)"
            @touchstart.stop="startResize($event, widget)"
            title="Drag to resize"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 0v16h-16l16-16zm-2 14v-2h-2v2h2zm-4 0v-4h-4v4h4z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Widget Picker Modal -->
      <div v-if="showWidgetPicker" class="modal-overlay" @click.self="showWidgetPicker = false">
        <div class="modal-container max-w-5xl">
          <div class="modal-header">
            <h3 class="modal-title text-xl font-bold">Add Widget to Dashboard</h3>
            <button @click="showWidgetPicker = false" class="modal-close">
              <span class="sr-only">Close</span>
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="modal-body p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="widget in widgetRegistry.getAll()"
                :key="widget.metadata.id"
                @click="handleAddWidget(widget.metadata.id)"
                class="widget-card p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 cursor-pointer transition-all hover:shadow-xl active:scale-95"
              >
                <div class="flex flex-col gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                      <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(widget.metadata.icon, 'lucide', 48, 'text-primary-600') : ''"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">
                        {{ widget.metadata.name }}
                      </h4>
                      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {{ widget.metadata.description }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span class="text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                      {{ widget.metadata.category }}
                    </span>
                    <span v-if="widget.metadata.configurable" class="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-medium">
                      <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16, 'mr-1') : ''"></div>Config
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="widgetRegistry.count() === 0" class="text-center py-12 text-gray-500">
              <div class="text-5xl mb-4">🔌</div>
              <p class="text-lg">No widgets available yet.</p>
              <p class="text-sm mt-2">Create your first widget!</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Widget Configurator -->
      <widget-configurator
        v-if="currentWidget"
        :show="showConfigurator"
        :widgetId="currentWidget.widgetId"
        :instanceId="currentWidget.instanceId"
        :currentSettings="currentWidget.settings"
        :schema="currentWidget.schema"
        @close="showConfigurator = false; currentWidget = null"
        @save="handleSaveConfig"
      />
    </div>
  `
};

// Export for use in app
if (typeof window !== 'undefined') {
  window.DashboardPageComponent = DashboardPageComponent;
}

