/**
 * Nyan Cat Celebration Animation
 * Makes Nyan Cat fly across the screen with a rainbow trail!
 */

const NyanCat = {
  // Nyan Cat GIF - using a small, optimized version
  // You can replace this with a local asset: '/icons/nyan-cat.gif'
  gifUrl: 'https://media.giphy.com/media/sIIhZliB2McAo/giphy.gif',
  
  /**
   * Make Nyan Cat fly across the screen!
   * @param {Object} options
   * @param {number} options.duration - Flight duration in ms (default: 2500)
   * @param {number} options.size - Cat size in px (default: 100)
   * @param {boolean} options.withRainbow - Show rainbow trail (default: true)
   * @param {string} options.direction - 'left-to-right' or 'right-to-left' (default: 'left-to-right')
   */
  fly(options = {}) {
    const {
      duration = 2500,
      size = 100,
      withRainbow = true,
      direction = 'left-to-right'
    } = options;
    
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
    const startX = isRightToLeft ? 'calc(100vw + 50px)' : '-150px';
    const endX = isRightToLeft ? '-150px' : 'calc(100vw + 50px)';
    
    nyanCat.style.cssText = `
      position: absolute;
      top: ${30 + Math.random() * 40}%;
      left: ${startX};
      width: ${size}px;
      height: ${size * 0.6}px;
      transform: ${isRightToLeft ? 'scaleX(-1)' : 'scaleX(1)'};
      animation: nyan-fly ${duration}ms linear forwards;
    `;
    
    // Add the GIF
    const img = document.createElement('img');
    img.src = this.gifUrl;
    img.alt = 'Nyan Cat';
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    `;
    nyanCat.appendChild(img);
    
    // Create rainbow trail if enabled
    if (withRainbow) {
      const rainbow = document.createElement('div');
      rainbow.className = 'nyan-rainbow';
      rainbow.style.cssText = `
        position: absolute;
        right: ${size - 10}px;
        top: 50%;
        transform: translateY(-50%);
        width: 200vw;
        height: ${size * 0.4}px;
        background: linear-gradient(
          to bottom,
          #ff0000 0%, #ff0000 16.66%,
          #ff9900 16.66%, #ff9900 33.33%,
          #ffff00 33.33%, #ffff00 50%,
          #33ff00 50%, #33ff00 66.66%,
          #0099ff 66.66%, #0099ff 83.33%,
          #6633ff 83.33%, #6633ff 100%
        );
        opacity: 0.8;
      `;
      nyanCat.appendChild(rainbow);
    }
    
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
   * Spawn multiple mini Nyan Cats falling like confetti
   * @param {number} count - Number of cats (default: 15)
   */
  rain(count = 15) {
    const container = document.createElement('div');
    container.className = 'nyan-rain-container';
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
    
    // Add keyframes for falling animation
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes nyan-fall {
        0% { 
          transform: translateY(-50px) rotate(0deg); 
          opacity: 1;
        }
        100% { 
          transform: translateY(100vh) rotate(360deg); 
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    // Spawn cats at random positions
    for (let i = 0; i < count; i++) {
      const cat = document.createElement('img');
      cat.src = this.gifUrl;
      cat.alt = '';
      
      const size = 30 + Math.random() * 40;
      const delay = Math.random() * 1000;
      const duration = 2000 + Math.random() * 1500;
      const left = Math.random() * 100;
      
      cat.style.cssText = `
        position: absolute;
        top: -50px;
        left: ${left}%;
        width: ${size}px;
        height: ${size * 0.6}px;
        object-fit: contain;
        image-rendering: pixelated;
        animation: nyan-fall ${duration}ms ease-in ${delay}ms forwards;
      `;
      
      container.appendChild(cat);
    }
    
    document.body.appendChild(container);
    
    // Clean up after all animations complete
    setTimeout(() => {
      container.remove();
      styleSheet.remove();
    }, 4500);
  }
};

// Export for use in app
window.NyanCat = NyanCat;
