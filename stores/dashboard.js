// Dashboard Store
// Manages dashboard configuration, widget instances, and layouts

const useDashboardStore = Pinia.defineStore('dashboard', {
  state: () => ({
    // dashboard configuration
    layouts: {
      default: [],  // default layout for all users
      mobile: []    // mobile-specific layout
    },
    
    // current layout being used
    currentLayout: 'default',
    
    // widget instances
    widgets: [],
    
    // dashboard settings
    settings: {
      gridColumns: 12,
      gridRows: 'auto',
      gap: 16,
      cardPadding: 16,
      editMode: false
    },
    
    // loading state
    loading: false,
    error: null
  }),
  
  getters: {
    // get active widgets
    activeWidgets: (state) => {
      return state.widgets.filter(w => w.enabled !== false);
    },
    
    // get widgets by category
    widgetsByCategory: (state) => {
      const grouped = {};
      
      state.widgets.forEach(widget => {
        const category = widget.category || 'other';
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(widget);
      });
      
      return grouped;
    },
    
    // get widget by instance ID
    widgetByInstanceId: (state) => {
      return (instanceId) => state.widgets.find(w => w.instanceId === instanceId);
    },
    
    // get current layout
    layout: (state) => {
      return state.layouts[state.currentLayout] || [];
    },
    
    // check if in edit mode
    isEditMode: (state) => {
      return state.settings.editMode;
    },
    
    // widget count
    widgetCount: (state) => state.widgets.length,
    activeWidgetCount: (state) => state.widgets.filter(w => w.enabled).length
  },
  
  actions: {
    // load dashboard configuration from backend API
    async loadDashboard() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await window.apiService.get('/dashboard');
        
        if (response && response.dashboard) {
          const data = response.dashboard;
          this.layouts = data.layouts || this.layouts;
          this.widgets = data.widgets || [];
          this.settings = { ...this.settings, ...(data.settings || {}) };
          console.log('[OK] Dashboard loaded from API:', this.widgets.length, 'widgets');
        } else {
          console.log('[INFO] No dashboard configuration found, using defaults');
        }
      } catch (error) {
        console.error('Failed to load dashboard from API:', error);
        
        // fallback to localStorage if API fails
        try {
          const stored = localStorage.getItem('dashboard-config');
          if (stored) {
            const data = JSON.parse(stored);
            this.layouts = data.layouts || this.layouts;
            this.widgets = data.widgets || [];
            this.settings = { ...this.settings, ...(data.settings || {}) };
            console.log('[OK] Dashboard loaded from localStorage fallback:', this.widgets.length, 'widgets');
          }
        } catch (localError) {
          console.error('Failed to load from localStorage:', localError);
        }
        
        this.error = null; // don't show error for missing dashboard
      } finally {
        this.loading = false;
      }
    },
    
    // save dashboard configuration to backend API
    async saveDashboard() {
      try {
        const dashboardData = {
          layouts: this.layouts,
          widgets: this.widgets,
          settings: this.settings
        };
        
        // save to API
        await window.apiService.put('/dashboard', dashboardData);
        
        // also save to localStorage as backup
        localStorage.setItem('dashboard-config', JSON.stringify(dashboardData));
        
        console.log('[OK] Dashboard saved to API and localStorage');
        return { success: true };
      } catch (error) {
        console.error('Failed to save dashboard:', error);
        
        // at least save to localStorage if API fails
        try {
          const dashboardData = {
            layouts: this.layouts,
            widgets: this.widgets,
            settings: this.settings
          };
          localStorage.setItem('dashboard-config', JSON.stringify(dashboardData));
          console.log('[WARN] Dashboard saved to localStorage only (API failed)');
        } catch (localError) {
          console.error('Failed to save to localStorage:', localError);
        }
        
        return { success: false, error: error.message };
      }
    },
    
    // add widget to dashboard
    addWidget(widgetConfig) {
      // validate widget config
      if (!widgetConfig.widgetId || !widgetConfig.instanceId) {
        console.error('Invalid widget config');
        return { success: false, error: 'Invalid widget config' };
      }
      
      // check if instance already exists
      const existing = this.widgets.find(w => w.instanceId === widgetConfig.instanceId);
      if (existing) {
        console.warn('Widget instance already exists:', widgetConfig.instanceId);
        return { success: false, error: 'Widget already exists' };
      }
      
      // add widget
      this.widgets.push({
        ...widgetConfig,
        enabled: widgetConfig.enabled !== false
      });
      
      console.log('[OK] Widget added:', widgetConfig.widgetId);
      
      // auto-save
      this.saveDashboard();
      
      return { success: true };
    },
    
    // remove widget from dashboard
    removeWidget(instanceId) {
      const index = this.widgets.findIndex(w => w.instanceId === instanceId);
      
      if (index === -1) {
        console.warn('Widget not found:', instanceId);
        return { success: false };
      }
      
      this.widgets.splice(index, 1);
      console.log('[OK] Widget removed:', instanceId);
      
      // auto-save
      this.saveDashboard();
      
      return { success: true };
    },
    
    // update widget configuration
    updateWidget(instanceId, updates) {
      const widget = this.widgets.find(w => w.instanceId === instanceId);
      
      if (!widget) {
        console.warn('Widget not found:', instanceId);
        return { success: false };
      }
      
      Object.assign(widget, updates);
      console.log('[OK] Widget updated:', instanceId);
      
      // auto-save
      this.saveDashboard();
      
      return { success: true };
    },
    
    // update widget position
    updateWidgetPosition(instanceId, position) {
      return this.updateWidget(instanceId, { position });
    },
    
    // update widget size
    updateWidgetSize(instanceId, size) {
      return this.updateWidget(instanceId, { size });
    },
    
    // update widget settings
    updateWidgetSettings(instanceId, settings) {
      return this.updateWidget(instanceId, { settings });
    },
    
    // toggle widget enabled state
    toggleWidget(instanceId) {
      const widget = this.widgets.find(w => w.instanceId === instanceId);
      
      if (widget) {
        widget.enabled = !widget.enabled;
        console.log('[OK] Widget toggled:', instanceId, widget.enabled);
        this.saveDashboard();
        return { success: true };
      }
      
      return { success: false };
    },
    
    // layout management
    setLayout(layoutName) {
      if (this.layouts[layoutName]) {
        this.currentLayout = layoutName;
        console.log('[OK] Layout changed to:', layoutName);
      } else {
        console.warn('Layout not found:', layoutName);
      }
    },
    
    updateLayout(layoutName, layout) {
      this.layouts[layoutName] = layout;
      this.saveDashboard();
    },
    
    // edit mode
    enterEditMode() {
      this.settings.editMode = true;
      console.log('[CONFIG] Edit mode enabled');
    },
    
    exitEditMode() {
      this.settings.editMode = false;
      this.saveDashboard();
      console.log('[CONFIG] Edit mode disabled');
    },
    
    toggleEditMode() {
      this.settings.editMode = !this.settings.editMode;
      if (!this.settings.editMode) {
        this.saveDashboard();
      }
    },
    
    // dashboard settings
    updateSettings(settings) {
      this.settings = { ...this.settings, ...settings };
      this.saveDashboard();
    },
    
    // reset to default dashboard
    async resetToDefault() {
      this.widgets = [];
      this.layouts = {
        default: [],
        mobile: []
      };
      this.settings = {
        gridColumns: 12,
        gridRows: 'auto',
        gap: 16,
        cardPadding: 16,
        editMode: false
      };
      
      await this.saveDashboard();
      console.log('[OK] Dashboard reset to default');
    },
    
    // widget arrangement helpers
    moveWidget(instanceId, newPosition) {
      return this.updateWidgetPosition(instanceId, newPosition);
    },
    
    resizeWidget(instanceId, newSize) {
      return this.updateWidgetSize(instanceId, newSize);
    },
    
    // bulk operations
    disableAllWidgets() {
      this.widgets.forEach(widget => {
        widget.enabled = false;
      });
      this.saveDashboard();
    },
    
    enableAllWidgets() {
      this.widgets.forEach(widget => {
        widget.enabled = true;
      });
      this.saveDashboard();
    },
    
    // import/export
    exportDashboard() {
      return {
        version: '1.0',
        layouts: this.layouts,
        widgets: this.widgets,
        settings: this.settings,
        exportedAt: new Date().toISOString()
      };
    },
    
    importDashboard(dashboardData) {
      if (!dashboardData || !dashboardData.version) {
        console.error('Invalid dashboard data');
        return { success: false, error: 'Invalid dashboard data' };
      }
      
      try {
        this.layouts = dashboardData.layouts || this.layouts;
        this.widgets = dashboardData.widgets || [];
        this.settings = { ...this.settings, ...(dashboardData.settings || {}) };
        
        this.saveDashboard();
        console.log('[OK] Dashboard imported');
        return { success: true };
      } catch (error) {
        console.error('Failed to import dashboard:', error);
        return { success: false, error: error.message };
      }
    }
  }
});

// export for use in components
if (typeof window !== 'undefined') {
  window.useDashboardStore = useDashboardStore;
}

