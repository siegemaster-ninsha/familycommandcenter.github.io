// Decision Wheel Panel Component
// Interactive spinning wheel for settling disputes or making random decisions
// **Feature: decision-wheel**
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.4, 6.1, 6.5, 7.1, 7.2, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 12.1, 12.2, 12.4**

// Wheel segment colors (12 distinct colors for max options)
// **Validates: Requirements 8.5**
const WHEEL_COLORS = [
  '#FF6B6B',  // Coral Red
  '#4ECDC4',  // Teal
  '#45B7D1',  // Sky Blue
  '#96CEB4',  // Sage Green
  '#FFEAA7',  // Soft Yellow
  '#DDA0DD',  // Plum
  '#98D8C8',  // Mint
  '#F7DC6F',  // Gold
  '#BB8FCE',  // Lavender
  '#85C1E9',  // Light Blue
  '#F8B500',  // Amber
  '#58D68D'   // Emerald
];

/**
 * Convert polar coordinates to Cartesian
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Radius
 * @param {number} angleInDegrees - Angle in degrees
 * @returns {{ x: number, y: number }}
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

/**
 * Generate SVG path for a wheel segment (pie slice)
 * **Validates: Requirements 8.1, 8.2**
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Radius
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @returns {string} SVG path data
 */
function describeArc(centerX, centerY, radius, startAngle, endAngle) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', centerX, centerY,
    'L', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    'Z'
  ].join(' ');
}

/**
 * Calculate text position for a wheel segment
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Radius
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @returns {{ x: number, y: number, rotation: number }}
 */
function getTextPosition(centerX, centerY, radius, startAngle, endAngle) {
  const midAngle = (startAngle + endAngle) / 2;
  const textRadius = radius * 0.65; // Position text at 65% of radius
  const pos = polarToCartesian(centerX, centerY, textRadius, midAngle);
  
  // Calculate rotation so text follows the segment
  let rotation = midAngle;
  // Flip text if it would be upside down
  if (midAngle > 90 && midAngle < 270) {
    rotation += 180;
  }
  
  return { x: pos.x, y: pos.y, rotation };
}

// Spin physics configuration
// **Validates: Requirements 9.2, 9.3, 9.5**
const SPIN_CONFIG = {
  minDuration: 4000,      // 4 seconds minimum (longer for 10+ rotations)
  maxDuration: 7000,      // 7 seconds maximum
  minRotations: 10,       // Minimum 10 full rotations
  maxRotations: 15,       // Maximum full rotations
  easingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)'  // Deceleration curve
};

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Calculate spin parameters for the wheel
 * Always spins clockwise (positive direction) with minimum 10 rotations
 * **Validates: Requirements 9.2, 9.3, 9.5**
 * 
 * @param {number} numOptions - Number of options on the wheel
 * @returns {{ duration: number, finalAngle: number, winnerIndex: number }}
 */
function calculateSpin(numOptions) {
  // Randomized duration between 4-7 seconds (longer for more rotations)
  // **Validates: Requirements 9.5**
  const duration = randomBetween(SPIN_CONFIG.minDuration, SPIN_CONFIG.maxDuration);
  
  // Randomized number of full rotations (10-15) - always positive for clockwise spin
  const rotations = randomBetween(SPIN_CONFIG.minRotations, SPIN_CONFIG.maxRotations);
  
  // Randomly determine the winner
  // **Validates: Requirements 9.3**
  const winnerIndex = Math.floor(Math.random() * numOptions);
  
  // Calculate segment angle
  const segmentAngle = 360 / numOptions;
  
  // Calculate final angle to land on winner
  // The pointer is at the top (0 degrees), so we need to calculate
  // how much to rotate so the winner segment is under the pointer
  // Always use positive rotation for consistent clockwise direction
  const baseAngle = Math.abs(rotations) * 360;
  
  // Winner offset: position the middle of the winning segment at the top
  // Segments start at 0 degrees, so segment N starts at N * segmentAngle
  // We want the middle of segment N to be at the top (0 degrees)
  // So we rotate by: (N * segmentAngle) + (segmentAngle / 2)
  const winnerOffset = winnerIndex * segmentAngle + segmentAngle / 2;
  
  // Add some randomness within the segment to make it feel more natural
  // Keep variation small to ensure we stay within the winning segment
  const segmentVariation = randomBetween(-segmentAngle * 0.25, segmentAngle * 0.25);
  
  // Final angle: base rotations + offset to land on winner
  // Always positive to ensure clockwise rotation
  const finalAngle = baseAngle + winnerOffset + segmentVariation;
  
  return { 
    duration: Math.round(duration), 
    finalAngle: Math.round(finalAngle), 
    winnerIndex 
  };
}

// Export for testing
if (typeof window !== 'undefined') {
  window.DecisionWheelSpinConfig = SPIN_CONFIG;
  window.calculateSpin = calculateSpin;
}

const DecisionWheelPanel = Vue.defineComponent({
  name: 'DecisionWheelPanel',
  template: `
    <div class="decision-wheel-panel">
      <!-- Two-column layout: Options Panel + Wheel Area -->
      <!-- **Validates: Requirements 3.1, 12.1, 12.2** -->
      <div class="decision-wheel-layout">
        
        <!-- Options Panel (Left Side) -->
        <!-- **Validates: Requirements 3.1, 3.2, 3.3, 3.4** -->
        <div class="decision-wheel-options-panel">
          <div class="decision-wheel-options-header">
            <h3 class="decision-wheel-options-title">
              <div v-html="getIcon('list', 'lucide', 20, '')"></div>
              Options
            </h3>
            <!-- **Validates: Requirements 4.1** -->
            <button 
              @click="openNewOptionFlyout"
              class="btn-primary decision-wheel-add-btn"
              aria-label="Add new option"
            >
              <div v-html="getIcon('plus', 'lucide', 18, '')"></div>
              <span>New Option</span>
            </button>
          </div>
          
          <!-- Options List -->
          <div class="decision-wheel-options-list">
            <!-- Empty State -->
            <!-- **Validates: Requirements 3.3** -->
            <div v-if="store.savedOptions.length === 0" class="decision-wheel-empty-state">
              <div v-html="getIcon('lightbulb', 'lucide', 40, 'decision-wheel-empty-icon')"></div>
              <p class="decision-wheel-empty-text">No options yet!</p>
              <p class="decision-wheel-empty-hint">Create some options to add to the wheel.</p>
            </div>
            
            <!-- Options Items -->
            <!-- **Validates: Requirements 3.2, 3.4, 5.1, 6.5** -->
            <div 
              v-for="option in store.savedOptions" 
              :key="option.id"
              class="decision-wheel-option-item"
              :class="{ 'decision-wheel-option-item--on-wheel': store.isOnWheel(option.id) }"
              @click="handleOptionClick(option)"
              role="button"
              tabindex="0"
              @keydown.enter="handleOptionClick(option)"
              @keydown.space.prevent="handleOptionClick(option)"
              :aria-label="store.isOnWheel(option.id) ? option.text + ' (on wheel)' : option.text + ' (tap to add to wheel)'"
            >
              <div class="decision-wheel-option-content">
                <span class="decision-wheel-option-text">{{ option.text }}</span>
                <span v-if="store.isOnWheel(option.id)" class="decision-wheel-option-badge">
                  <div v-html="getIcon('check', 'lucide', 12, '')"></div>
                  On Wheel
                </span>
              </div>
              <!-- **Validates: Requirements 5.1, 5.2** -->
              <button 
                @click.stop="deleteOption(option.id)"
                class="decision-wheel-option-delete"
                :aria-label="'Delete ' + option.text"
              >
                <div v-html="getIcon('trash2', 'lucide', 16, '')"></div>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Wheel Area (Right Side) -->
        <div class="decision-wheel-main">
          <!-- Wheel Display -->
          <!-- **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5** -->
          <div class="decision-wheel-display">
            <!-- Placeholder when < 2 options -->
            <!-- **Validates: Requirements 8.4** -->
            <div v-if="store.wheelOptionCount < 2" class="decision-wheel-placeholder">
              <div v-html="getIcon('target', 'lucide', 64, 'decision-wheel-placeholder-icon')"></div>
              <p class="decision-wheel-placeholder-text">Add at least 2 options to spin!</p>
              <p class="decision-wheel-placeholder-hint">
                Tap options from the panel to add them to the wheel.
              </p>
            </div>
            
            <!-- SVG Wheel Display -->
            <!-- **Validates: Requirements 8.1, 8.2, 8.3, 8.5** -->
            <div v-else class="decision-wheel-canvas-container">
              <div class="decision-wheel-wrapper">
                <!-- Fixed Pointer Indicator -->
                <!-- **Validates: Requirements 8.3** -->
                <div class="decision-wheel-pointer">
                  <svg width="30" height="40" viewBox="0 0 30 40">
                    <polygon 
                      points="15,40 0,0 30,0" 
                      fill="var(--color-neutral-800)"
                      stroke="var(--color-neutral-900)"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                
                <!-- SVG Wheel -->
                <svg 
                  :viewBox="'0 0 ' + wheelSize + ' ' + wheelSize"
                  class="decision-wheel-svg"
                  :style="wheelStyle"
                  role="img"
                  aria-label="Decision wheel with options"
                >
                  <!-- Wheel Segments -->
                  <!-- **Validates: Requirements 8.1, 8.2** -->
                  <g v-for="(segment, index) in wheelSegments" :key="segment.id">
                    <path
                      :d="segment.path"
                      :fill="segment.color"
                      :stroke="'var(--color-neutral-800)'"
                      stroke-width="2"
                      class="decision-wheel-segment"
                      :class="{ 'decision-wheel-segment--clickable': canRemoveFromWheel }"
                      @click="handleSegmentClick(segment)"
                      role="button"
                      :tabindex="canRemoveFromWheel ? 0 : -1"
                      @keydown.enter="handleSegmentClick(segment)"
                      @keydown.space.prevent="handleSegmentClick(segment)"
                      :aria-label="'Remove ' + segment.text + ' from wheel'"
                    />
                    <!-- Segment Text -->
                    <!-- **Validates: Requirements 8.2** -->
                    <text
                      :x="segment.textX"
                      :y="segment.textY"
                      :transform="'rotate(' + segment.textRotation + ' ' + segment.textX + ' ' + segment.textY + ')'"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="decision-wheel-segment-text"
                      :fill="getContrastColor(segment.color)"
                      :font-size="segmentFontSize"
                    >
                      {{ truncateText(segment.text, maxTextLength) }}
                    </text>
                  </g>
                  
                  <!-- Center Circle -->
                  <circle
                    :cx="wheelCenter"
                    :cy="wheelCenter"
                    :r="wheelSize * 0.08"
                    fill="var(--color-neutral-800)"
                    stroke="var(--color-neutral-900)"
                    stroke-width="2"
                  />
                </svg>
              </div>
              
              <!-- Removal Error Message -->
              <!-- **Validates: Requirements 7.4** -->
              <p v-if="removalError" class="decision-wheel-removal-error" role="alert">
                {{ removalError }}
              </p>
            </div>
          </div>
          
          <!-- Spin Button -->
          <!-- **Validates: Requirements 9.1, 12.4** -->
          <button 
            :disabled="!store.canSpin"
            class="btn-primary decision-wheel-spin-btn"
            @click="spinWheel"
            :aria-label="store.canSpin ? 'Spin the wheel' : 'Add at least 2 options to spin'"
          >
            <div v-html="getIcon('play', 'lucide', 20, '')"></div>
            <span>Spin!</span>
          </button>
        </div>
      </div>
      
      <!-- Winner Announcement Overlay -->
      <!-- **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5** -->
      <div 
        v-if="store.showWinner" 
        class="decision-wheel-winner-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="winner-title"
        @click.self="dismissWinner"
        @keydown.escape="dismissWinner"
      >
        <div class="decision-wheel-winner-modal">
          <!-- Trophy Icon -->
          <div class="decision-wheel-winner-icon">
            <div v-html="getIcon('trophy', 'lucide', 64, 'decision-wheel-trophy')"></div>
          </div>
          
          <!-- Winner Title -->
          <!-- **Validates: Requirements 10.2** -->
          <h2 id="winner-title" class="decision-wheel-winner-title">
            🎉 Winner! 🎉
          </h2>
          
          <!-- Winning Option Text -->
          <!-- **Validates: Requirements 10.1, 10.2** -->
          <p class="decision-wheel-winner-text">
            {{ store.winner?.text || 'Unknown' }}
          </p>
          
          <!-- Dismiss Button -->
          <!-- **Validates: Requirements 10.4, 10.5** -->
          <button 
            @click="dismissWinner"
            class="btn-primary decision-wheel-winner-dismiss"
            ref="dismissButton"
            autofocus
          >
            <div v-html="getIcon('check', 'lucide', 20, '')"></div>
            <span>Got it!</span>
          </button>
        </div>
      </div>
      
      <!-- New Option Flyout -->
      <!-- **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6** -->
      <flyout-panel
        :open="store.showNewOptionFlyout"
        @close="closeNewOptionFlyout"
        title="New Option"
        :show-footer="true"
        width="400px"
      >
        <template #default>
          <div class="decision-wheel-flyout-content">
            <label class="decision-wheel-flyout-label" for="new-option-input">
              Option Text
            </label>
            <input
              id="new-option-input"
              ref="newOptionInput"
              v-model="newOptionText"
              @keydown.enter="createOption"
              type="text"
              class="decision-wheel-flyout-input"
              placeholder="Enter option text..."
              maxlength="50"
              aria-describedby="option-hint option-error"
            />
            <p id="option-hint" class="decision-wheel-flyout-hint">
              {{ newOptionText.length }}/50 characters
            </p>
            <!-- **Validates: Requirements 4.5** -->
            <p v-if="validationError" id="option-error" class="decision-wheel-flyout-error" role="alert">
              {{ validationError }}
            </p>
          </div>
        </template>
        <template #footer>
          <div class="decision-wheel-flyout-footer">
            <button 
              @click="closeNewOptionFlyout" 
              class="btn-secondary btn-compact"
            >
              Cancel
            </button>
            <button 
              @click="createOption"
              :disabled="!newOptionText.trim()"
              class="btn-primary btn-compact"
            >
              <div v-html="getIcon('plus', 'lucide', 16, '')"></div>
              Add Option
            </button>
          </div>
        </template>
      </flyout-panel>
    </div>
  `,
  
  setup() {
    const store = useDecisionWheelStore();
    return { store };
  },
  
  data() {
    return {
      newOptionText: '',
      validationError: '',
      wheelRotation: 0,  // Current wheel rotation in degrees
      wheelSize: 300,    // SVG viewBox size
      removalError: '',  // Error message for removal attempts
      spinDuration: 0,   // Current spin animation duration in ms
      isAnimating: false // Whether the wheel is currently animating
    };
  },
  
  computed: {
    /**
     * Center point of the wheel
     */
    wheelCenter() {
      return this.wheelSize / 2;
    },
    
    /**
     * Radius of the wheel
     */
    wheelRadius() {
      return (this.wheelSize / 2) - 10; // Leave some padding
    },
    
    /**
     * Calculate wheel segments with paths and colors
     * **Validates: Requirements 8.1, 8.2, 8.5**
     */
    wheelSegments() {
      const options = this.store.wheelOptionObjects;
      if (options.length < 2) return [];
      
      const segmentAngle = 360 / options.length;
      
      return options.map((option, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;
        const textPos = getTextPosition(
          this.wheelCenter, 
          this.wheelCenter, 
          this.wheelRadius, 
          startAngle, 
          endAngle
        );
        
        return {
          id: option.id,
          text: option.text,
          color: WHEEL_COLORS[index % WHEEL_COLORS.length],
          path: describeArc(
            this.wheelCenter,
            this.wheelCenter,
            this.wheelRadius,
            startAngle,
            endAngle
          ),
          startAngle,
          endAngle,
          textX: textPos.x,
          textY: textPos.y,
          textRotation: textPos.rotation
        };
      });
    },
    
    /**
     * Font size for segment text based on number of options
     */
    segmentFontSize() {
      const count = this.store.wheelOptionCount;
      if (count <= 4) return 14;
      if (count <= 6) return 12;
      if (count <= 8) return 11;
      return 10;
    },
    
    /**
     * Max text length based on number of options
     */
    maxTextLength() {
      const count = this.store.wheelOptionCount;
      if (count <= 4) return 15;
      if (count <= 6) return 12;
      if (count <= 8) return 10;
      return 8;
    },
    
    /**
     * Check if options can be removed from wheel
     * **Validates: Requirements 7.4**
     */
    canRemoveFromWheel() {
      return this.store.wheelOptionCount > 2 && !this.store.isSpinning;
    },
    
    /**
     * Computed style for the wheel SVG including rotation and transition
     * **Validates: Requirements 9.2, 9.4**
     */
    wheelStyle() {
      const style = {
        transform: `rotate(${this.wheelRotation}deg)`
      };
      
      // Add transition only when animating
      if (this.isAnimating) {
        style.transition = `transform ${this.spinDuration}ms ${SPIN_CONFIG.easingFunction}`;
      } else {
        style.transition = 'none';
      }
      
      return style;
    }
  },
  
  mounted() {
    // Load options from backend when authenticated, falls back to localStorage
    // **Validates: Requirements 3.1, 3.6, 11.1, 11.2**
    // **Feature: decision-wheel-persistence**
    this.store.loadFromBackend();
  },
  
  watch: {
    // Focus input when flyout opens
    'store.showNewOptionFlyout'(isOpen) {
      if (isOpen) {
        this.$nextTick(() => {
          if (this.$refs.newOptionInput) {
            this.$refs.newOptionInput.focus();
          }
        });
      }
    },
    // Focus dismiss button when winner modal opens and trigger confetti
    // **Validates: Requirements 10.3, 10.4**
    'store.showWinner'(isShowing) {
      if (isShowing) {
        // Trigger confetti celebration
        // **Validates: Requirements 10.3**
        if (typeof window.Confetti !== 'undefined') {
          window.Confetti.celebrate();
        }
        
        this.$nextTick(() => {
          if (this.$refs.dismissButton) {
            this.$refs.dismissButton.focus();
          }
        });
      }
    }
  },
  
  methods: {
    /**
     * Get icon HTML using the Helpers library
     */
    getIcon(iconName, library = 'lucide', size = 16, className = '') {
      if (typeof window.Helpers !== 'undefined' && window.Helpers.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(iconName, library, size, className);
      }
      return '';
    },
    
    /**
     * Open the new option flyout
     * **Validates: Requirements 4.2**
     */
    openNewOptionFlyout() {
      // Capture scroll position for flyout
      window.__flyoutScrollY = window.scrollY;
      this.newOptionText = '';
      this.validationError = '';
      this.store.openNewOptionFlyout();
    },
    
    /**
     * Close the new option flyout
     */
    closeNewOptionFlyout() {
      this.store.closeNewOptionFlyout();
      this.newOptionText = '';
      this.validationError = '';
    },
    
    /**
     * Create a new option
     * **Validates: Requirements 4.3, 4.4, 4.5, 4.6**
     */
    createOption() {
      this.validationError = '';
      
      const result = this.store.createOption(this.newOptionText);
      
      if (result.success) {
        // **Validates: Requirements 4.6** - Close flyout on success
        this.closeNewOptionFlyout();
      } else {
        // **Validates: Requirements 4.5** - Show validation error
        this.validationError = result.error;
      }
    },
    
    /**
     * Handle clicking on an option in the panel
     * **Validates: Requirements 5.4, 6.1**
     */
    handleOptionClick(option) {
      if (!this.store.isOnWheel(option.id)) {
        // Add to wheel if not already on it
        const result = this.store.addToWheel(option.id);
        if (!result.success && result.error) {
          // Could show a toast here if needed
          console.warn('[DecisionWheel] Could not add to wheel:', result.error);
        }
      }
      // If already on wheel, tapping has no effect (per Requirements 6.4)
    },
    
    /**
     * Delete an option
     * **Validates: Requirements 5.2, 5.3, 5.4**
     */
    deleteOption(optionId) {
      this.store.deleteOption(optionId);
    },
    
    /**
     * Spin the wheel with physics-based animation
     * **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6**
     */
    spinWheel() {
      if (!this.store.canSpin) {
        return;
      }
      
      // Start the spin in the store (disables button, sets isSpinning)
      this.store.startSpin();
      
      // Calculate spin parameters
      const numOptions = this.store.wheelOptionCount;
      const { duration, finalAngle, winnerIndex } = calculateSpin(numOptions);
      
      console.log('[DecisionWheel] Spin calculated:', { duration, finalAngle, winnerIndex });
      
      // Set up the animation
      this.spinDuration = duration;
      this.isAnimating = true;
      
      // Use requestAnimationFrame to ensure the transition is applied
      requestAnimationFrame(() => {
        // Apply the rotation
        this.wheelRotation = finalAngle;
        
        // Set up the completion handler
        // **Validates: Requirements 9.6**
        setTimeout(() => {
          this.isAnimating = false;
          
          // Complete the spin in the store (sets winner, shows announcement)
          this.store.completeSpin(winnerIndex);
          
          console.log('[DecisionWheel] Spin animation complete');
        }, duration);
      });
    },
    
    /**
     * Handle clicking on a wheel segment
     * **Validates: Requirements 7.1, 7.2, 7.4**
     */
    handleSegmentClick(segment) {
      if (this.store.isSpinning) {
        return; // Don't allow removal while spinning
      }
      
      const result = this.store.removeFromWheel(segment.id);
      
      if (!result.success && result.error) {
        // **Validates: Requirements 7.4** - Show message if removal prevented
        this.removalError = result.error;
        console.warn('[DecisionWheel] Could not remove from wheel:', result.error);
        
        // Clear error after 3 seconds
        setTimeout(() => {
          this.removalError = '';
        }, 3000);
      }
    },
    
    /**
     * Get contrasting text color for a background color
     * @param {string} hexColor - Hex color string
     * @returns {string} Either white or dark color for contrast
     */
    getContrastColor(hexColor) {
      // Remove # if present
      const hex = hexColor.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Calculate luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // Return dark text for light backgrounds, white for dark
      return luminance > 0.5 ? '#1a202c' : '#ffffff';
    },
    
    /**
     * Truncate text to fit in segment
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text with ellipsis if needed
     */
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 1) + '…';
    },
    
    /**
     * Dismiss the winner announcement
     * **Validates: Requirements 10.5**
     */
    dismissWinner() {
      this.store.dismissWinner();
    }
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.DecisionWheelPanel = DecisionWheelPanel;
}
