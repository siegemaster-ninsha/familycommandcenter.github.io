// Widget Type Definitions and Interfaces
// This file defines the structure and contracts for all widgets

/**
 * Widget Metadata Interface
 * Every widget must export a metadata object with these properties
 */
const WidgetMetadataSchema = {
  // Identification
  id: String,              // unique-widget-id (kebab-case, globally unique)
  name: String,            // Display name for UI
  description: String,     // Short description (1-2 sentences)
  version: String,         // Semantic versioning (e.g., '1.0.0')
  author: String,          // Optional: Widget creator
  
  // Visual
  icon: String,            // Lucide icon name
  category: String,        // Widget category: 'chores'|'shopping'|'family'|'info'|'other'
  preview: String,         // Optional: Screenshot URL
  
  // Layout
  defaultSize: {
    w: Number,             // Width in grid units (1-12)
    h: Number              // Height in grid units (1-12)
  },
  minSize: {
    w: Number,             // Minimum width
    h: Number              // Minimum height
  },
  maxSize: {
    w: Number,             // Maximum width
    h: Number              // Maximum height
  },
  aspectRatio: String,     // Optional: 'square'|'16:9'|null
  
  // Behavior
  configurable: Boolean,   // Has user settings?
  refreshable: Boolean,    // Can be manually refreshed?
  refreshInterval: Number, // Auto-refresh interval (ms, 0 = manual only)
  
  // Access Control
  permissions: Array,      // Who can use it? ['parent', 'child'], empty = all
  
  // Dependencies
  requiresAuth: Boolean,   // Requires user to be logged in?
  requiredStores: Array,   // Which stores must be available? ['chores', 'family']
  
  // Features
  features: {
    exportData: Boolean,   // Can export data?
    print: Boolean,        // Can be printed?
    fullscreen: Boolean,   // Supports fullscreen mode?
    notifications: Boolean // Can send notifications?
  }
};

/**
 * Widget Configuration Interface
 * Represents an instance of a widget on the dashboard
 */
const WidgetConfigSchema = {
  widgetId: String,        // Widget type ID (matches metadata.id)
  instanceId: String,      // Unique instance ID (UUID)
  position: {              // Grid position
    x: Number,
    y: Number
  },
  size: {                  // Current size
    w: Number,
    h: Number
  },
  settings: Object,        // Widget-specific settings
  enabled: Boolean         // Is widget active?
};

/**
 * Widget Settings Schema
 * Defines configurable options for a widget
 */
const WidgetSettingsFieldTypes = {
  // Field type definitions
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  COLOR: 'color',
  DATE: 'date',
  TIME: 'time'
};

/**
 * Widget Lifecycle Hooks
 * Methods that widgets can implement
 */
const WidgetLifecycleHooks = {
  onMount: 'Called when widget is added to dashboard',
  onUnmount: 'Called when widget is removed',
  onRefresh: 'Called when widget needs to refresh data',
  onConfigure: 'Called when settings are changed',
  onResize: 'Called when widget is resized',
  onFocus: 'Called when widget gains focus',
  onBlur: 'Called when widget loses focus'
};

/**
 * Widget Events
 * Standard events that widgets can emit
 */
const WidgetEvents = {
  REFRESHED: 'refreshed',           // After successful data refresh
  ERROR: 'error',                   // When an error occurs
  CONFIGURE: 'configure',           // User wants to open settings
  REMOVE: 'remove',                 // User wants to remove widget
  RESIZE: 'resize',                 // Widget size changed
  NOTIFICATION: 'notification',     // Widget wants to notify user
  DATA_CHANGED: 'data-changed',     // Widget data has changed
  FOCUS_REQUESTED: 'focus-requested' // Widget requests focus
};

/**
 * Widget Categories
 * Standard categories for organizing widgets
 */
const WidgetCategories = {
  CHORES: {
    id: 'chores',
    name: 'Chores & Tasks',
    description: 'Chore management and tracking',
    icon: 'clipboardList'
  },
  SHOPPING: {
    id: 'shopping',
    name: 'Shopping',
    description: 'Shopping lists and items',
    icon: 'shoppingCart'
  },
  FAMILY: {
    id: 'family',
    name: 'Family',
    description: 'Family members and settings',
    icon: 'users'
  },
  INFO: {
    id: 'info',
    name: 'Information',
    description: 'Informational widgets',
    icon: 'info'
  },
  ENTERTAINMENT: {
    id: 'entertainment',
    name: 'Entertainment',
    description: 'Fun and entertainment widgets',
    icon: 'gamepad2'
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    description: 'Miscellaneous widgets',
    icon: 'moreHorizontal'
  }
};

/**
 * Helper function to create widget metadata
 * Provides defaults and validation
 */
function createWidgetMetadata(metadata) {
  const defaults = {
    version: '1.0.0',
    author: '',
    preview: '',
    aspectRatio: null,
    permissions: [],
    requiresAuth: true,
    requiredStores: [],
    features: {
      exportData: false,
      print: false,
      fullscreen: false,
      notifications: false
    }
  };
  
  return {
    ...defaults,
    ...metadata,
    features: {
      ...defaults.features,
      ...(metadata.features || {})
    }
  };
}

/**
 * Helper function to validate widget metadata
 * Returns array of errors, empty if valid
 */
function validateWidgetMetadata(metadata) {
  const errors = [];
  
  // Required fields
  if (!metadata.id) errors.push('id is required');
  if (!metadata.name) errors.push('name is required');
  if (!metadata.description) errors.push('description is required');
  if (!metadata.icon) errors.push('icon is required');
  if (!metadata.category) errors.push('category is required');
  
  // Size validation
  if (!metadata.defaultSize || !metadata.defaultSize.w || !metadata.defaultSize.h) {
    errors.push('defaultSize is required with w and h');
  }
  
  if (!metadata.minSize || !metadata.minSize.w || !metadata.minSize.h) {
    errors.push('minSize is required with w and h');
  }
  
  if (!metadata.maxSize || !metadata.maxSize.w || !metadata.maxSize.h) {
    errors.push('maxSize is required with w and h');
  }
  
  // Behavior validation
  if (typeof metadata.configurable !== 'boolean') {
    errors.push('configurable must be a boolean');
  }
  
  if (typeof metadata.refreshable !== 'boolean') {
    errors.push('refreshable must be a boolean');
  }
  
  if (typeof metadata.refreshInterval !== 'number') {
    errors.push('refreshInterval must be a number');
  }
  
  // Array validation
  if (!Array.isArray(metadata.permissions)) {
    errors.push('permissions must be an array');
  }
  
  if (!Array.isArray(metadata.requiredStores)) {
    errors.push('requiredStores must be an array');
  }
  
  return errors;
}

/**
 * Helper function to create widget instance configuration
 */
function createWidgetConfig(widgetId, options = {}) {
  const instanceId = options.instanceId || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    widgetId,
    instanceId,
    position: options.position || { x: 0, y: 0 },
    size: options.size || { w: 2, h: 2 },
    settings: options.settings || {},
    enabled: options.enabled !== false
  };
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.WidgetTypes = {
    WidgetMetadataSchema,
    WidgetConfigSchema,
    WidgetSettingsFieldTypes,
    WidgetLifecycleHooks,
    WidgetEvents,
    WidgetCategories,
    createWidgetMetadata,
    validateWidgetMetadata,
    createWidgetConfig
  };
}

