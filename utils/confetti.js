/**
 * Confetti Celebration Animation using canvas-confetti library
 * Uses the canvas-confetti library loaded via CDN for high-performance confetti effects
 * **Feature: decision-wheel**
 * **Validates: Requirements 10.3**
 */

const Confetti = {
  /**
   * Check if canvas-confetti library is available
   * @returns {boolean}
   */
  isAvailable() {
    return typeof window.confetti === 'function';
  },

  /**
   * Trigger a confetti burst using canvas-confetti
   * @param {Object} options - Configuration options
   * @param {number} options.particleCount - Number of confetti particles (default: 100)
   * @param {number} options.spread - Spread angle in degrees (default: 70)
   * @param {number} options.origin - Origin point { x, y } (default: center top)
   */
  burst(options = {}) {
    if (!this.isAvailable()) {
      console.warn('[Confetti] canvas-confetti library not loaded');
      return;
    }

    const defaults = {
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.3 }
    };

    window.confetti({
      ...defaults,
      ...options
    });

    console.log('[Confetti] Burst triggered');
  },

  /**
   * Trigger a celebration burst - multiple bursts from different angles
   * Creates a more dramatic celebration effect
   */
  celebrate() {
    if (!this.isAvailable()) {
      console.warn('[Confetti] canvas-confetti library not loaded');
      return;
    }

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 10000 
    };

    // Random confetti burst function
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    // Fire confetti at intervals
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from two sides
      window.confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      window.confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Also fire a big center burst immediately
    window.confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      zIndex: 10000
    });

    console.log('[Confetti] Celebration triggered');
  },

  /**
   * Fire confetti cannons from both sides of the screen
   */
  cannons() {
    if (!this.isAvailable()) {
      console.warn('[Confetti] canvas-confetti library not loaded');
      return;
    }

    // Left cannon
    window.confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      zIndex: 10000
    });

    // Right cannon
    window.confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      zIndex: 10000
    });

    console.log('[Confetti] Cannons fired');
  }
};

// Export for use in components
if (typeof window !== 'undefined') {
  window.Confetti = Confetti;
}
