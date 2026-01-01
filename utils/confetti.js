/**
 * Simple Confetti Celebration Animation
 * Colorful confetti particles burst and fall from the top of the screen
 * **Feature: decision-wheel**
 * **Validates: Requirements 10.3**
 */

const Confetti = {
  // Confetti colors - bright and celebratory
  colors: [
    '#FF6B6B',  // Coral Red
    '#4ECDC4',  // Teal
    '#45B7D1',  // Sky Blue
    '#96CEB4',  // Sage Green
    '#FFEAA7',  // Soft Yellow
    '#DDA0DD',  // Plum
    '#F7DC6F',  // Gold
    '#BB8FCE',  // Lavender
    '#58D68D',  // Emerald
    '#FF85A2',  // Pink
  ],

  // Confetti shapes
  shapes: ['square', 'circle', 'triangle'],

  /**
   * Create a single confetti particle element
   * @param {number} index - Particle index for staggered animation
   * @returns {HTMLElement} The confetti particle element
   */
  createParticle(index) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Random properties
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];
    const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
    const size = 8 + Math.random() * 8; // 8-16px
    const left = Math.random() * 100; // 0-100%
    const delay = Math.random() * 0.5; // 0-0.5s delay
    const duration = 2 + Math.random() * 2; // 2-4s fall duration
    const rotation = Math.random() * 360; // Initial rotation
    const rotationSpeed = (Math.random() - 0.5) * 720; // -360 to 360 degrees
    const horizontalDrift = (Math.random() - 0.5) * 100; // -50 to 50px drift

    // Base styles
    particle.style.cssText = `
      position: absolute;
      top: -20px;
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      opacity: 1;
      pointer-events: none;
      animation: confetti-fall ${duration}s ease-out ${delay}s forwards;
      transform: rotate(${rotation}deg);
      --rotation-speed: ${rotationSpeed}deg;
      --horizontal-drift: ${horizontalDrift}px;
    `;

    // Apply shape
    if (shape === 'circle') {
      particle.style.borderRadius = '50%';
    } else if (shape === 'triangle') {
      particle.style.width = '0';
      particle.style.height = '0';
      particle.style.backgroundColor = 'transparent';
      particle.style.borderLeft = `${size / 2}px solid transparent`;
      particle.style.borderRight = `${size / 2}px solid transparent`;
      particle.style.borderBottom = `${size}px solid ${color}`;
    }

    return particle;
  },

  /**
   * Inject confetti animation keyframes into the document
   */
  injectStyles() {
    if (document.getElementById('confetti-styles')) return;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'confetti-styles';
    styleSheet.textContent = `
      @keyframes confetti-fall {
        0% {
          top: -20px;
          opacity: 1;
          transform: rotate(0deg) translateX(0);
        }
        25% {
          opacity: 1;
        }
        100% {
          top: 100vh;
          opacity: 0;
          transform: rotate(var(--rotation-speed, 360deg)) translateX(var(--horizontal-drift, 0px));
        }
      }
      
      .confetti-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
      }
    `;
    document.head.appendChild(styleSheet);
  },

  /**
   * Trigger a confetti burst
   * @param {Object} options - Configuration options
   * @param {number} options.count - Number of confetti particles (default: 50)
   * @param {number} options.duration - How long to show confetti in ms (default: 4000)
   */
  burst(options = {}) {
    const { count = 50, duration = 4000 } = options;

    // Inject styles if not already present
    this.injectStyles();

    // Create container
    const container = document.createElement('div');
    container.className = 'confetti-container';

    // Create particles
    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(i);
      container.appendChild(particle);
    }

    // Add to DOM
    document.body.appendChild(container);

    // Clean up after animation completes
    setTimeout(() => {
      container.remove();
    }, duration);

    console.log('[Confetti] Burst triggered with', count, 'particles');
  },

  /**
   * Trigger a celebration burst (more particles, longer duration)
   */
  celebrate() {
    this.burst({ count: 80, duration: 5000 });
  }
};

// Export for use in components
if (typeof window !== 'undefined') {
  window.Confetti = Confetti;
}
