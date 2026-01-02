/**
 * Mario Coin Rain Celebration Animation
 * Coins rain down, then Mario runs across to collect them!
 */

const CoinRain = {
  // Spinning gold coin GIF
  coinUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWhyeGxyY3R5YWFoYng3OHc4YzlqM2wwMHNiaWE2d3h5emg2dTF1NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/njON3jEmTYHEfRbfsk/giphy.gif',
  
  // Running Mario GIF
  marioUrl: 'https://media.tenor.com/2D-MaRio-Running-gif-5930085643515150510',
  
  // Mario coin sound effect - local asset preferred, CDN fallback
  coinSoundUrl: './assets/sounds/coin.mp3',
  coinSoundFallback: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',

  playCoinSound() {
    const tryPlay = (url) => {
      const audio = new Audio(url);
      audio.volume = 0.3;
      return audio.play();
    };
    
    tryPlay(this.coinSoundUrl).catch(() => {
      // Local file missing, try CDN fallback
      tryPlay(this.coinSoundFallback).catch(() => {});
    });
  },

  rain(options = {}) {
    const { count = 15, withSound = true } = options;
    
    const container = document.createElement('div');
    container.className = 'coin-rain-container';
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

    const styleSheet = document.createElement('style');
    const coinLandBottom = 30; // Same as Mario's bottom position
    styleSheet.textContent = `
      @keyframes coin-fall {
        0% { bottom: 100vh; opacity: 1; }
        100% { bottom: ${coinLandBottom}px; opacity: 1; }
      }
      @keyframes coin-collect {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5) translateY(-20px); opacity: 1; }
        100% { transform: scale(0) translateY(-40px); opacity: 0; }
      }
      .coin-collected {
        animation: coin-collect 300ms ease-out forwards !important;
      }
    `;
    document.head.appendChild(styleSheet);

    // Track coins for collision detection
    const coins = [];
    const coinSize = 65; // 30% larger than 50

    // Spawn coins
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div');
      coin.className = 'mario-coin';
      const left = 5 + Math.random() * 85;
      const delay = Math.random() * 800;
      const fallDuration = 1200 + Math.random() * 800;

      coin.style.cssText = `
        position: absolute;
        bottom: 100vh;
        left: ${left}%;
        width: ${coinSize}px;
        height: ${coinSize}px;
        animation: coin-fall ${fallDuration}ms ease-in ${delay}ms forwards;
      `;

      const img = document.createElement('img');
      img.src = this.coinUrl;
      img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
      coin.appendChild(img);
      container.appendChild(coin);

      coins.push({
        element: coin,
        leftPercent: left,
        landTime: Date.now() + delay + fallDuration,
        collected: false
      });
    }

    document.body.appendChild(container);

    // Wait for coins to land, then send Mario
    const maxLandTime = Math.max(...coins.map(c => c.landTime));
    const marioDelay = maxLandTime - Date.now() + 200;

    setTimeout(() => {
      this.sendMario(container, coins, coinSize, withSound, () => {
        setTimeout(() => {
          container.remove();
          styleSheet.remove();
        }, 500);
      });
    }, marioDelay);
  },

  sendMario(container, coins, coinSize, withSound, onComplete) {
    const mario = document.createElement('div');
    mario.className = 'mario-runner';
    const marioSize = 160; // 2x bigger

    mario.style.cssText = `
      position: absolute;
      left: -${marioSize}px;
      bottom: 30px;
      width: ${marioSize}px;
      height: ${marioSize}px;
      z-index: 10000;
    `;

    const img = document.createElement('img');
    img.src = 'https://media.tenor.com/UkvleU1dQK4AAAAj/2d-mario-running.gif';
    img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    mario.appendChild(img);
    container.appendChild(mario);

    // Sort coins left to right for collection order
    const sortedCoins = [...coins].sort((a, b) => a.leftPercent - b.leftPercent);
    
    const screenWidth = window.innerWidth;
    const duration = 4000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Mario position (left edge to right edge + mario width)
      const marioX = -marioSize + (screenWidth + marioSize * 2) * progress;
      mario.style.left = `${marioX}px`;

      // Check coin collisions
      const marioCenter = marioX + marioSize / 2;
      
      sortedCoins.forEach(coin => {
        if (coin.collected) return;
        
        const coinX = (coin.leftPercent / 100) * screenWidth;
        const distance = Math.abs(marioCenter - coinX);
        
        if (distance < (marioSize / 2 + coinSize / 2)) {
          coin.collected = true;
          coin.element.classList.add('coin-collected');
          if (withSound) this.playCoinSound();
        }
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  },

  burst(amount = 1) {
    const coinCount = Math.min(Math.max(Math.floor(amount * 5), 8), 30);
    this.rain({ count: coinCount, withSound: true });
  }
};

window.CoinRain = CoinRain;
