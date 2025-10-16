// Widget Registry
// Manages registration and discovery of available widgets

class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
    console.log('Widget Registry initialized');
  }
  
  /**
   * Register a new widget type
   * @param {Object} metadata - Widget metadata (see widget-types.js)
   * @param {Object} component - Vue component definition
   */
  register(metadata, component) {
    // Validate metadata
    if (typeof window.WidgetTypes !== 'undefined') {
      const errors = window.WidgetTypes.validateWidgetMetadata(metadata);
      if (errors.length > 0) {
        console.error(`Widget registration failed for ${metadata.id}:`, errors);
        return false;
      }
    }
    
    // Check for duplicate ID
    if (this.widgets.has(metadata.id)) {
      console.warn(`Widget ${metadata.id} already registered. Overwriting...`);
    }
    
    // Register widget
    this.widgets.set(metadata.id, {
      metadata,
      component
    });
    
    console.log(`✅ Widget registered: ${metadata.id} (${metadata.name})`);
    return true;
  }
  
  /**
   * Unregister a widget type
   * @param {String} widgetId - Widget ID to remove
   */
  unregister(widgetId) {
    if (this.widgets.has(widgetId)) {
      this.widgets.delete(widgetId);
      console.log(`Widget unregistered: ${widgetId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Get a specific widget by ID
   * @param {String} widgetId - Widget ID
   * @returns {Object} Widget registration object { metadata, component }
   */
  get(widgetId) {
    return this.widgets.get(widgetId);
  }
  
  /**
   * Get all registered widgets
   * @returns {Array} Array of widget registration objects
   */
  getAll() {
    return Array.from(this.widgets.values());
  }
  
  /**
   * Get widgets by category
   * @param {String} category - Category name
   * @returns {Array} Filtered widgets
   */
  getByCategory(category) {
    return this.getAll().filter(w => w.metadata.category === category);
  }
  
  /**
   * Get all widget categories with counts
   * @returns {Array} Array of { category, name, count, widgets }
   */
  getCategories() {
    const categories = {};
    
    this.getAll().forEach(widget => {
      const category = widget.metadata.category || 'other';
      if (!categories[category]) {
        categories[category] = {
          id: category,
          name: window.WidgetTypes?.WidgetCategories[category.toUpperCase()]?.name || category,
          widgets: []
        };
      }
      categories[category].widgets.push(widget);
    });
    
    return Object.values(categories).map(cat => ({
      ...cat,
      count: cat.widgets.length
    }));
  }
  
  /**
   * Check if user can access a widget
   * @param {String} widgetId - Widget ID
   * @param {String} userRole - User role ('parent' or 'child')
   * @returns {Boolean} Can user access widget?
   */
  canUserAccess(widgetId, userRole) {
    const widget = this.get(widgetId);
    if (!widget) {
      console.warn(`Widget ${widgetId} not found`);
      return false;
    }
    
    const permissions = widget.metadata.permissions;
    
    // If no permissions specified, everyone can access
    if (!permissions || permissions.length === 0) {
      return true;
    }
    
    // Check if user's role is in the permissions list
    return permissions.includes(userRole);
  }
  
  /**
   * Get widgets accessible to a specific user role
   * @param {String} userRole - User role ('parent' or 'child')
   * @returns {Array} Accessible widgets
   */
  getAccessibleWidgets(userRole) {
    return this.getAll().filter(widget => {
      const permissions = widget.metadata.permissions;
      return !permissions || permissions.length === 0 || permissions.includes(userRole);
    });
  }
  
  /**
   * Check if widget exists
   * @param {String} widgetId - Widget ID
   * @returns {Boolean} Does widget exist?
   */
  has(widgetId) {
    return this.widgets.has(widgetId);
  }
  
  /**
   * Get widget count
   * @returns {Number} Number of registered widgets
   */
  count() {
    return this.widgets.size;
  }
  
  /**
   * Search widgets by name or description
   * @param {String} query - Search query
   * @returns {Array} Matching widgets
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(widget => {
      const name = widget.metadata.name.toLowerCase();
      const desc = widget.metadata.description.toLowerCase();
      return name.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  }
  
  /**
   * Get widgets that require specific stores
   * @param {Array} storeNames - Array of store names
   * @returns {Array} Widgets requiring those stores
   */
  getByRequiredStores(storeNames) {
    return this.getAll().filter(widget => {
      const required = widget.metadata.requiredStores || [];
      return required.some(store => storeNames.includes(store));
    });
  }
  
  /**
   * Validate widget configuration
   * @param {Object} config - Widget instance configuration
   * @returns {Array} Array of errors, empty if valid
   */
  validateConfig(config) {
    const errors = [];
    
    if (!config.widgetId) {
      errors.push('widgetId is required');
      return errors;
    }
    
    const widget = this.get(config.widgetId);
    if (!widget) {
      errors.push(`Widget ${config.widgetId} not found`);
      return errors;
    }
    
    // Validate size constraints
    const metadata = widget.metadata;
    if (config.size) {
      if (config.size.w < metadata.minSize.w || config.size.w > metadata.maxSize.w) {
        errors.push(`Width must be between ${metadata.minSize.w} and ${metadata.maxSize.w}`);
      }
      if (config.size.h < metadata.minSize.h || config.size.h > metadata.maxSize.h) {
        errors.push(`Height must be between ${metadata.minSize.h} and ${metadata.maxSize.h}`);
      }
    }
    
    // Validate settings if schema is defined
    if (widget.metadata.settings && widget.metadata.settings.schema) {
      const schema = widget.metadata.settings.schema;
      Object.keys(schema).forEach(key => {
        const field = schema[key];
        const value = config.settings?.[key];
        
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push(`Setting '${key}' is required`);
        }
        
        // Type validation
        if (value !== undefined && value !== null) {
          if (field.type === 'number' && typeof value !== 'number') {
            errors.push(`Setting '${key}' must be a number`);
          }
          if (field.type === 'boolean' && typeof value !== 'boolean') {
            errors.push(`Setting '${key}' must be a boolean`);
          }
        }
      });
    }
    
    return errors;
  }
  
  /**
   * Create a new widget instance configuration
   * @param {String} widgetId - Widget ID
   * @param {Object} options - Instance options
   * @returns {Object} Widget instance configuration
   */
  createInstance(widgetId, options = {}) {
    const widget = this.get(widgetId);
    if (!widget) {
      throw new Error(`Widget ${widgetId} not found`);
    }
    
    const metadata = widget.metadata;
    
    return {
      widgetId,
      instanceId: options.instanceId || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: options.position || { x: 0, y: 0 },
      size: options.size || metadata.defaultSize,
      settings: options.settings || {},
      enabled: options.enabled !== false
    };
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      totalWidgets: this.count(),
      categories: this.getCategories().map(cat => ({
        id: cat.id,
        name: cat.name,
        count: cat.count
      })),
      widgets: this.getAll().map(w => ({
        id: w.metadata.id,
        name: w.metadata.name,
        category: w.metadata.category,
        version: w.metadata.version,
        permissions: w.metadata.permissions
      }))
    };
  }
}

// Create singleton instance
const widgetRegistry = new WidgetRegistry();

// Export for use in other files
if (typeof window !== 'undefined') {
  window.widgetRegistry = widgetRegistry;
  
  // Add debug helper
  window.debugWidgets = function() {
    console.log('=== Widget Registry Debug Info ===');
    console.log(widgetRegistry.getDebugInfo());
  };
}

