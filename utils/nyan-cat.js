/**
 * Nyan Cat Celebration Animation
 * Makes Nyan Cat fly across the screen with a rainbow trail!
 */

const NyanCat = {
  // Nyan Cat GIF with transparent background (from GitHub Gist)
  gifUrl: 'https://gist.githubusercontent.com/brudnak/aba00c9a1c92d226f68e8ad8ba1e0a40/raw/nyan-cat.gif',
  
  // Nyan Cat song - local asset (add nyan-cat.mp3 to assets/sounds/)
  // Falls back gracefully if file doesn't exist
  songUrl: './assets/sounds/nyan-cat.mp3',
  
  // Audio clip range (in seconds)
  songStartTime: 3,
  songEndTime: 10,
  
  // Play the Nyan Cat song (ignores duration param, uses fixed clip range)
  playMusic() {
    if (!this.songUrl) {
      return null;
    }
    
    try {
      const audio = new Audio(this.songUrl);
      audio.volume = 0.5;
      audio.currentTime = this.songStartTime;
      audio.play().catch(() => {});
      
      // Stop at end timestamp
      const clipDuration = (this.songEndTime - this.songStartTime) * 1000;
      setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, clipDuration);
      
      return audio;
    } catch {
      return null;
    }
  },
  
  /**
 * Make Nyan Cat fly across the screen!
 * @param {Object} options
 * @param {number} options.duration - Flight duration in ms (default: 2500)
 * @param {number} options.size - Cat size in px (default: 100)
 * @param {string} options.direction - 'left-to-right' or 'right-to-left' (default: 'left-to-right')
 * @param {boolean} options.withMusic - Play the Nyan Cat song (default: true)
 */
  fly(options = {}) {
    const {
      duration = 2500,
      size = 100,
      direction = 'left-to-right',
      withMusic = true
    } = options;
    
    // Play the music!
    if (withMusic) {
      this.playMusic(duration);
    }
    
    // Create container for the animation
    const container = document.createElement('div');
    container.className = 'nyan-cat-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    
    // Create Nyan Cat element
    const nyanCat = document.createElement('div');
    nyanCat.className = 'nyan-cat';
    
    const isRightToLeft = direction === 'right-to-left';
    const startX = isRightToLeft ? 'calc(100vw + 50px)' : `-${size + 500}px`;
    const endX = isRightToLeft ? `-${size + 500}px` : 'calc(100vw + 50px)';
    
    nyanCat.style.cssText = `
      position: absolute;
      top: ${30 + Math.random() * 40}%;
      left: ${startX};
      width: ${size}px;
      transform: ${isRightToLeft ? 'scaleX(-1)' : 'scaleX(1)'};
      animation: nyan-fly ${duration}ms linear forwards;
    `;
    
    // Add the GIF (already includes rainbow trail)
    const img = document.createElement('img');
    img.src = this.gifUrl;
    img.alt = 'Nyan Cat';
    img.style.cssText = `
      width: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    `;
    nyanCat.appendChild(img);
    
    // Add keyframe animation dynamically
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes nyan-fly {
        from { left: ${startX}; }
        to { left: ${endX}; }
      }
    `;
    document.head.appendChild(styleSheet);
    
    container.appendChild(nyanCat);
    document.body.appendChild(container);
    
    // Clean up after animation
    setTimeout(() => {
      container.remove();
      styleSheet.remove();
    }, duration + 100);
  },
  
  /**
   * Spawn a FLEET of Nyan Cats flying across the screen! 🐱🐱🐱
   * @param {number} count - Number of cats (default: 15)
   * @param {boolean} withMusic - Play the Nyan Cat song (default: true)
   */
  storm(count = 15, withMusic = true) {
    const totalDuration = 4500;
    
    // Play the music!
    if (withMusic) {
      this.playMusic(totalDuration);
    }
    
    const container = document.createElement('div');
    container.className = 'nyan-storm-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    
    // Add keyframes for horizontal flying animation
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes nyan-storm {
        0% { 
          transform: translateX(-100%); 
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% { 
          transform: translateX(100vw); 
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    // Spawn cats at random vertical positions, flying left to right
    for (let i = 0; i < count; i++) {
      const cat = document.createElement('img');
      cat.src = this.gifUrl;
      cat.alt = '';
      
      const size = 300 + Math.random() * 400;
      const delay = Math.random() * 1500;
      const duration = 2000 + Math.random() * 1500;
      const top = Math.random() * 80; // Random vertical position (0-80%)
      
      cat.style.cssText = `
        position: absolute;
        top: ${top}%;
        left: 0;
        width: ${size}px;
        object-fit: contain;
        image-rendering: pixelated;
        animation: nyan-storm ${duration}ms linear ${delay}ms forwards;
      `;
      
      container.appendChild(cat);
    }
    
    document.body.appendChild(container);
    
    // Clean up after all animations complete
    setTimeout(() => {
      container.remove();
      styleSheet.remove();
    }, totalDuration);
  },
  
  // Keep rain as alias for backwards compatibility, but now it's a storm!
  rain(count = 15) {
    this.storm(count, true);
  }
};

// Export for use in app
window.NyanCat = NyanCat;
