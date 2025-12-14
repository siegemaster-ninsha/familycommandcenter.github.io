// Widget Configurator Component
// Modal for configuring widget settings

const WidgetConfiguratorComponent = {
  name: 'WidgetConfigurator',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    widgetId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    },
    currentSettings: {
      type: Object,
      default: () => ({})
    },
    schema: {
      type: Object,
      default: () => ({})
    }
  },
  
  emits: ['close', 'save'],
  
  data() {
    return {
      settings: {},
      errors: {},
      saving: false
    };
  },
  
  computed: {
    widget() {
      return widgetRegistry.get(this.widgetId);
    },
    
    widgetName() {
      return this.widget?.metadata?.name || 'Widget';
    },
    
    settingsSchema() {
      return this.schema || this.widget?.metadata?.settings?.schema || {};
    },
    
    hasSettings() {
      return Object.keys(this.settingsSchema).length > 0;
    },
    
    isValid() {
      return Object.keys(this.errors).length === 0;
    }
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        // reset settings when modal opens
        this.settings = JSON.parse(JSON.stringify(this.currentSettings));
        this.errors = {};
      }
    }
  },
  
  methods: {
    handleClose() {
      this.$emit('close');
    },
    
    handleSave() {
      // validate all settings
      this.validateAll();
      
      if (this.isValid) {
        this.saving = true;
        this.$emit('save', {
          instanceId: this.instanceId,
          settings: this.settings
        });
        
        // close after short delay to show feedback
        setTimeout(() => {
          this.saving = false;
          this.handleClose();
        }, 300);
      }
    },
    
    validateAll() {
      this.errors = {};
      
      Object.keys(this.settingsSchema).forEach(key => {
        const field = this.settingsSchema[key];
        const value = this.settings[key];
        
        // required validation
        if (field.required && (value === undefined || value === null || value === '')) {
          this.errors[key] = `${field.label} is required`;
          return;
        }
        
        // type validation
        if (value !== undefined && value !== null && value !== '') {
          if (field.type === 'number' && typeof value !== 'number') {
            this.errors[key] = `${field.label} must be a number`;
            return;
          }
          
          // range validation for numbers
          if (field.type === 'number' && typeof value === 'number') {
            if (field.min !== undefined && value < field.min) {
              this.errors[key] = `${field.label} must be at least ${field.min}`;
              return;
            }
            if (field.max !== undefined && value > field.max) {
              this.errors[key] = `${field.label} must be at most ${field.max}`;
              return;
            }
          }
          
          // string length validation
          if (field.type === 'text' && typeof value === 'string') {
            if (field.maxLength && value.length > field.maxLength) {
              this.errors[key] = `${field.label} must be at most ${field.maxLength} characters`;
              return;
            }
          }
        }
      });
    },
    
    validateField(key) {
      const field = this.settingsSchema[key];
      const value = this.settings[key];
      
      // clear previous error
      delete this.errors[key];
      
      // run validation
      if (field.required && (value === undefined || value === null || value === '')) {
        this.errors[key] = `${field.label} is required`;
      }
      
      // trigger reactivity
      this.errors = { ...this.errors };
    },
    
    getFieldType(field) {
      switch (field.type) {
        case 'text':
          return 'text';
        case 'number':
          return 'number';
        case 'color':
          return 'color';
        case 'date':
          return 'date';
        case 'time':
          return 'time';
        default:
          return 'text';
      }
    },
    
    getDefaultValue(field) {
      if (field.default !== undefined) {
        return field.default;
      }
      
      switch (field.type) {
        case 'boolean':
          return false;
        case 'number':
          return 0;
        case 'text':
          return '';
        case 'select':
          return '';
        case 'multiselect':
          return [];
        default:
          return null;
      }
    }
  },
  
  template: `
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container max-w-2xl">
        <!-- Header -->
        <div class="modal-header">
          <h3 class="modal-title">Configure {{ widgetName }}</h3>
          <button @click="handleClose" class="modal-close">
            <span class="sr-only">Close</span>
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Body -->
        <div class="modal-body">
          <div v-if="!hasSettings" class="text-center py-8 text-gray-500">
            This widget has no configurable settings.
          </div>
          
          <div v-else class="space-y-4">
            <!-- Render fields dynamically based on schema -->
            <div v-for="(field, key) in settingsSchema" :key="key" class="form-group">
              <label :for="'field-' + key" class="form-label">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500">*</span>
              </label>
              
              <p v-if="field.description" class="text-sm text-gray-600 mb-1">
                {{ field.description }}
              </p>
              
              <!-- Text Input -->
              <input
                v-if="field.type === 'text' || field.type === 'number' || field.type === 'color' || field.type === 'date' || field.type === 'time'"
                :id="'field-' + key"
                v-model="settings[key]"
                :type="getFieldType(field)"
                :placeholder="field.placeholder"
                :min="field.min"
                :max="field.max"
                :maxlength="field.maxLength"
                @blur="validateField(key)"
                class="form-input"
                :class="{ 'border-red-500': errors[key] }"
              />
              
              <!-- Boolean Toggle -->
              <label v-else-if="field.type === 'boolean'" class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="settings[key]"
                  class="form-checkbox"
                />
                <span class="text-sm">{{ field.toggleLabel || 'Enable' }}</span>
              </label>
              
              <!-- Select Dropdown -->
              <select
                v-else-if="field.type === 'select'"
                :id="'field-' + key"
                v-model="settings[key]"
                @blur="validateField(key)"
                class="form-select"
                :class="{ 'border-red-500': errors[key] }"
              >
                <option value="">{{ field.placeholder || 'Select...' }}</option>
                <option
                  v-for="option in field.options"
                  :key="option.value || option"
                  :value="option.value || option"
                >
                  {{ option.label || option }}
                </option>
              </select>
              
              <!-- Multi-select (simplified as checkboxes) -->
              <div v-else-if="field.type === 'multiselect'" class="space-y-2">
                <label
                  v-for="option in field.options"
                  :key="option.value || option"
                  class="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :value="option.value || option"
                    v-model="settings[key]"
                    class="form-checkbox"
                  />
                  <span class="text-sm">{{ option.label || option }}</span>
                </label>
              </div>
              
              <!-- Error Message -->
              <p v-if="errors[key]" class="text-sm text-red-600 mt-1">
                {{ errors[key] }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="modal-footer">
          <button @click="handleClose" class="btn-secondary">
            Cancel
          </button>
          <button
            @click="handleSave"
            :disabled="!isValid || saving"
            class="btn-primary"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  `
};

// Export for use in app
if (typeof window !== 'undefined') {
  window.WidgetConfiguratorComponent = WidgetConfiguratorComponent;
}

