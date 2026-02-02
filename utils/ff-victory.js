/**
 * Final Fantasy Victory Fanfare
 * Plays the iconic FF battle victory music when a chore is completed
 * 
 * The classic "dun dun dun DUN DUN DUN dun dun dunnnnn" 🎺
 */

const FFVictory = {
  // Local asset preferred, CDN fallback
  soundUrl: './assets/sounds/ff-fanfare.m4a',
  soundFallback: './assets/sounds/ff-victory.mp3',
  
  audio: null,
  
  /**
   * Initialize the audio element
   */
  init() {
    if (this.audio) return;
    
    this.audio = new Audio(this.soundUrl);
    this.audio.volume = 0.4;
    this.audio.preload = 'auto';
    
    // Try to load, fallback on error
    this.audio.onerror = () => {
      console.log('[FFVictory] Local file not found, using CDN fallback');
      this.audio.src = this.soundFallback;
    };
  },
  
  /**
   * Play the victory fanfare
   * @param {Object} options - Optional configuration
   * @param {number} options.volume - Volume level (0-1), default 0.4
   */
  play(options = {}) {
    this.init();
    
    const { volume = 0.4 } = options;
    this.audio.volume = Math.min(Math.max(volume, 0), 1);
    this.audio.currentTime = 0;
    
    this.audio.play().catch(err => {
      console.warn('[FFVictory] Could not play sound:', err.message);
    });
  },
  
  /**
   * Stop the fanfare if playing
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
};

// Make available globally
window.FFVictory = FFVictory;
