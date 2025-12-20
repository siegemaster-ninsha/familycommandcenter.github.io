// Virtual Keyboard Component
// Provides an on-screen keyboard toggle for text inputs
// Uses simple-keyboard library

// Global keyboard manager - ensures only one keyboard is visible at a time
window.VirtualKeyboardManager = window.VirtualKeyboardManager || {
  activeKeyboard: null,
  keyboardInstance: null,
  containerEl: null,
  
  // Initialize the shared keyboard container
  init() {
    if (this.containerEl) return;
    
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'virtual-keyboard-container';
    this.containerEl.className = 'virtual-keyboard-container';
    this.containerEl.innerHTML = `
      <div class="virtual-keyboard-header">
        <span class="virtual-keyboard-title">Keyboard</span>
        <button class="virtual-keyboard-close" aria-label="Close keyboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="simple-keyboard"></div>
    `;
    this.containerEl.style.display = 'none';
    document.body.appendChild(this.containerEl);
    
    // Close button handler
    this.containerEl.querySelector('.virtual-keyboard-close').addEventListener('click', () => {
      this.hide();
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.activeKeyboard && 
          !this.containerEl.contains(e.target) && 
          !e.target.closest('.keyboard-input-wrapper') &&
          !e.target.closest('.keyboard-auto-enhanced')) {
        this.hide();
      }
    });
    
    // Initialize simple-keyboard
    this.keyboardInstance = new window.SimpleKeyboard.default({
      onChange: (input) => this.onChange(input),
      onKeyPress: (button) => this.onKeyPress(button),
      theme: "hg-theme-default hg-layout-default virtual-keyboard-theme",
      layout: {
        default: [
          "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
          "{tab} q w e r t y u i o p [ ] \\",
          "{lock} a s d f g h j k l ; ' {enter}",
          "{shift} z x c v b n m , . / {shift}",
          "{space}"
        ],
        shift: [
          "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
          "{tab} Q W E R T Y U I O P { } |",
          "{lock} A S D F G H J K L : \" {enter}",
          "{shift} Z X C V B N M < > ? {shift}",
          "{space}"
        ],
        numeric: [
          "1 2 3",
          "4 5 6",
          "7 8 9",
          ". 0 {bksp}",
          "{enter}"
        ]
      },
      display: {
        "{bksp}": "⌫",
        "{enter}": "↵",
        "{shift}": "⇧",
        "{tab}": "⇥",
        "{lock}": "⇪",
        "{space}": " "
      }
    });
  },
  
  // Show keyboard for a specific input
  show(inputEl, inputType = 'text') {
    this.init();
    this.activeKeyboard = inputEl;
    
    // Set layout based on input type
    const layout = inputType === 'number' ? 'numeric' : 'default';
    this.keyboardInstance.setOptions({ layoutName: layout });
    
    // Sync current input value
    this.keyboardInstance.setInput(inputEl.value || '');
    
    // Position keyboard
    this.containerEl.style.display = 'block';
    
    // Add active class for animation
    requestAnimationFrame(() => {
      this.containerEl.classList.add('visible');
    });
  },
  
  // Hide keyboard
  hide() {
    if (this.containerEl) {
      this.containerEl.classList.remove('visible');
      setTimeout(() => {
        if (this.containerEl) {
          this.containerEl.style.display = 'none';
        }
      }, 200);
    }
    this.activeKeyboard = null;
  },
  
  // Handle input change
  onChange(input) {
    if (this.activeKeyboard) {
      this.activeKeyboard.value = input;
      // Dispatch input event for Vue v-model
      this.activeKeyboard.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },
  
  // Handle special keys
  onKeyPress(button) {
    if (button === '{shift}' || button === '{lock}') {
      const currentLayout = this.keyboardInstance.options.layoutName;
      const shiftToggle = currentLayout === 'default' ? 'shift' : 'default';
      this.keyboardInstance.setOptions({ layoutName: shiftToggle });
    }
    
    if (button === '{enter}' && this.activeKeyboard) {
      // Dispatch enter key event
      this.activeKeyboard.dispatchEvent(new KeyboardEvent('keyup', { 
        key: 'Enter', 
        code: 'Enter',
        bubbles: true 
      }));
    }
  },
  
  // Update keyboard when input changes externally
  syncInput(value) {
    if (this.keyboardInstance) {
      this.keyboardInstance.setInput(value || '');
    }
  },
  
  // Check if keyboard is visible
  isVisible() {
    return this.containerEl && this.containerEl.classList.contains('visible');
  }
};

// Vue component for input with keyboard toggle
const KeyboardInput = Vue.defineComponent({
  name: 'KeyboardInput',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    },
    inputClass: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    showKeyboard: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'keyup', 'focus', 'blur'],
  template: `
    <div class="keyboard-input-wrapper">
      <input
        ref="inputEl"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="['keyboard-input', inputClass]"
        @input="onInput"
        @keyup="$emit('keyup', $event)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      <button
        v-if="showKeyboard && !disabled"
        type="button"
        class="keyboard-toggle-btn"
        @click.stop="toggleKeyboard"
        :class="{ active: isKeyboardActive }"
        aria-label="Toggle on-screen keyboard"
        title="Toggle on-screen keyboard"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
          <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/>
        </svg>
      </button>
    </div>
  `,
  data() {
    return {
      isKeyboardActive: false
    };
  },
  methods: {
    onInput(e) {
      this.$emit('update:modelValue', e.target.value);
      // Sync with virtual keyboard if it's showing this input
      if (window.VirtualKeyboardManager.activeKeyboard === this.$refs.inputEl) {
        window.VirtualKeyboardManager.syncInput(e.target.value);
      }
    },
    toggleKeyboard() {
      const manager = window.VirtualKeyboardManager;
      
      if (manager.activeKeyboard === this.$refs.inputEl && manager.isVisible()) {
        manager.hide();
        this.isKeyboardActive = false;
      } else {
        manager.show(this.$refs.inputEl, this.type);
        this.isKeyboardActive = true;
        this.$refs.inputEl.focus();
      }
    },
    focus() {
      this.$refs.inputEl?.focus();
    }
  },
  watch: {
    modelValue(newVal) {
      // Sync external changes to keyboard
      if (window.VirtualKeyboardManager.activeKeyboard === this.$refs.inputEl) {
        window.VirtualKeyboardManager.syncInput(newVal);
      }
    }
  },
  mounted() {
    // Watch for keyboard hide to update button state
    const checkKeyboardState = () => {
      const manager = window.VirtualKeyboardManager;
      this.isKeyboardActive = manager.activeKeyboard === this.$refs.inputEl && manager.isVisible();
    };
    
    // Check periodically (simple approach)
    this._keyboardCheck = setInterval(checkKeyboardState, 200);
  },
  beforeUnmount() {
    if (this._keyboardCheck) {
      clearInterval(this._keyboardCheck);
    }
    // Hide keyboard if this input was active
    if (window.VirtualKeyboardManager.activeKeyboard === this.$refs.inputEl) {
      window.VirtualKeyboardManager.hide();
    }
  }
});

// Export for registration
window.KeyboardInput = KeyboardInput;

// ===========================================
// AUTO-ENHANCEMENT: Add keyboard toggle to all text inputs
// This runs after DOM is ready and uses MutationObserver
// to catch dynamically added inputs
// ===========================================

window.VirtualKeyboardEnhancer = {
  // SVG icon for the keyboard toggle button
  keyboardIcon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
    <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10"/>
  </svg>`,
  
  // Input types that should get keyboard toggle
  validTypes: ['text', 'search', 'email', 'url', 'tel', 'number', 'password'],
  
  // Check if input should be enhanced
  shouldEnhance(input) {
    // Skip if already enhanced
    if (input.dataset.keyboardEnhanced) return false;
    
    // Skip if inside keyboard-input-wrapper (Vue component)
    if (input.closest('.keyboard-input-wrapper')) return false;
    
    // Skip if explicitly disabled
    if (input.dataset.noKeyboard === 'true') return false;
    
    // Skip hidden inputs
    if (input.type === 'hidden') return false;
    
    // Skip file inputs
    if (input.type === 'file') return false;
    
    // Skip checkboxes and radios
    if (input.type === 'checkbox' || input.type === 'radio') return false;
    
    // Skip color pickers
    if (input.type === 'color') return false;
    
    // Skip date/time inputs (they have native pickers)
    if (['date', 'datetime-local', 'month', 'week', 'time'].includes(input.type)) return false;
    
    // Skip range sliders
    if (input.type === 'range') return false;
    
    // Check if it's a valid type or has no type (defaults to text)
    const type = input.type || 'text';
    return this.validTypes.includes(type);
  },
  
  // Enhance a single input
  enhance(input) {
    if (!this.shouldEnhance(input)) return;
    
    // Mark as enhanced
    input.dataset.keyboardEnhanced = 'true';
    
    // Create wrapper - use CSS classes instead of inline styles for proper containment
    const wrapper = document.createElement('div');
    wrapper.className = 'keyboard-input-wrapper keyboard-auto-enhanced';
    
    // Insert wrapper before input
    input.parentNode.insertBefore(wrapper, input);
    
    // Move input into wrapper
    wrapper.appendChild(input);
    
    // Add padding to input for the button (use CSS variable for consistency)
    input.style.paddingRight = '44px';
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'keyboard-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle on-screen keyboard');
    toggleBtn.setAttribute('title', 'Toggle on-screen keyboard');
    toggleBtn.innerHTML = this.keyboardIcon;
    
    // Handle click
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const manager = window.VirtualKeyboardManager;
      
      if (manager.activeKeyboard === input && manager.isVisible()) {
        manager.hide();
        toggleBtn.classList.remove('active');
      } else {
        manager.show(input, input.type || 'text');
        toggleBtn.classList.add('active');
        input.focus();
      }
    });
    
    // Update button state when keyboard hides
    const updateButtonState = () => {
      const manager = window.VirtualKeyboardManager;
      const isActive = manager.activeKeyboard === input && manager.isVisible();
      toggleBtn.classList.toggle('active', isActive);
    };
    
    // Listen for input changes to sync with keyboard
    input.addEventListener('input', () => {
      if (window.VirtualKeyboardManager.activeKeyboard === input) {
        window.VirtualKeyboardManager.syncInput(input.value);
      }
    });
    
    // Check button state periodically
    setInterval(updateButtonState, 300);
    
    wrapper.appendChild(toggleBtn);
  },
  
  // Enhance all inputs in a container
  enhanceAll(container = document) {
    const inputs = container.querySelectorAll('input');
    inputs.forEach(input => this.enhance(input));
    
    // Also enhance textareas (optional - uncomment if needed)
    // const textareas = container.querySelectorAll('textarea');
    // textareas.forEach(textarea => this.enhance(textarea));
  },
  
  // Initialize with MutationObserver for dynamic content
  init() {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._setup());
    } else {
      this._setup();
    }
  },
  
  _setup() {
    // Initial enhancement
    this.enhanceAll();
    
    // Watch for new inputs added to DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the node itself is an input
            if (node.tagName === 'INPUT') {
              this.enhance(node);
            }
            // Check for inputs inside the added node
            if (node.querySelectorAll) {
              const inputs = node.querySelectorAll('input');
              inputs.forEach(input => this.enhance(input));
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[OK] Virtual Keyboard auto-enhancement initialized');
  }
};

// Auto-initialize when script loads
window.VirtualKeyboardEnhancer.init();
