/**
 * Confetti Celebration Animation using canvas-confetti library
 * Uses the canvas-confetti library loaded via CDN for high-performance confetti effects
 * **Feature: decision-wheel**
 * **Validates: Requirements 10.3**
 */

const Confetti = {
  // Pop sound for firework bursts
  popSoundUrl: './assets/sounds/pop.mp3',
  popSoundFallback: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5e4c1c1b5e.mp3',
  
  // Audio pool for overlapping pops
  audioPool: [],
  audioPoolSize: 5,
  audioPoolIndex: 0,
  
  /**
   * Initialize audio pool for pop sounds
   */
  initAudioPool() {
    if (this.audioPool.length > 0) return;
    
    for (let i = 0; i < this.audioPoolSize; i++) {
      const audio = new Audio(this.popSoundUrl);
      audio.volume = 0.2;
      audio.preload = 'auto';
      // Try to load, fallback on error
      audio.onerror = () => {
        audio.src = this.popSoundFallback;
      };
      this.audioPool.push(audio);
    }
  },
  
  /**
   * Play a pop sound using the audio pool
   */
  playPop() {
    this.initAudioPool();
    
    const audio = this.audioPool[this.audioPoolIndex];
    this.audioPoolIndex = (this.audioPoolIndex + 1) % this.audioPoolSize;
    
    audio.currentTime = 0;
    audio.play().catch(() => {});
  },
  
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

    this.playPop();
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
      this.playPop();
      
      window.confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
      this.playPop();
    }, 250);

    // Also fire a big center burst immediately
    window.confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      zIndex: 10000
    });
    this.playPop();

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
    this.playPop();

    // Right cannon
    window.confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      zIndex: 10000
    });
    this.playPop();

    console.log('[Confetti] Cannons fired');
  }
};

// Export for use in components
if (typeof window !== 'undefined') {
  window.Confetti = Confetti;
}
