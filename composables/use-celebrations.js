/**
 * Celebrations Composable
 * Provides celebration effects (confetti, coins, nyan cat, fireworks, cannons)
 * based on user preferences from account settings.
 * 
 * Extracts celebration logic from app.js into a reusable composable.
 */

const useCelebrations = () => {
  /**
   * Get theme colors for confetti effects
   * @returns {string[]} Array of CSS color values
   */
  const getThemeColors = () => {
    const root = getComputedStyle(document.documentElement);
    const token = (v, fallback) => (root.getPropertyValue(v) || '').trim() || fallback;
    
    return [
      token('--color-primary-500', '#4A90E2'),
      token('--color-secondary-500', '#7B68EE'),
      token('--color-success-600', '#22c55e'),
      token('--color-warning-600', '#ea580c'),
      '#FFD700',
      '#FF69B4'
    ];
  };

  /**
   * Trigger a confetti burst from bottom center
   */
  const triggerConfettiBurst = () => {
    if (typeof confetti !== 'function') {
      console.warn('[Celebrations] canvas-confetti not loaded');
      return;
    }

    const colors = getThemeColors();

    // Main burst from bottom center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.9 },
      colors
    });

    // Secondary bursts from sides
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });
    }, 150);
  };

  /**
   * Trigger side cannon confetti effect
   */
  const triggerSideCannons = () => {
    if (typeof confetti !== 'function') {
      console.warn('[Celebrations] canvas-confetti not loaded');
      return;
    }

    const colors = getThemeColors();

    const fireCannonBurst = (angle, originX) => {
      confetti({
        particleCount: 100,
        angle,
        spread: 70,
        startVelocity: 90,
        decay: 0.92,
        origin: { x: originX, y: 0.8 },
        colors,
        gravity: 0.8,
        ticks: 300
      });
    };

    // Fire both cannons simultaneously
    fireCannonBurst(55, 0);   // Left cannon
    fireCannonBurst(125, 1);  // Right cannon

    // Second wave
    setTimeout(() => {
      fireCannonBurst(50, 0);
      fireCannonBurst(130, 1);
    }, 150);

    // Third wave - higher arc
    setTimeout(() => {
      fireCannonBurst(65, 0);
      fireCannonBurst(115, 1);
    }, 300);
  };

  /**
   * Trigger fireworks effect
   */
  const triggerFireworks = () => {
    if (typeof confetti !== 'function') {
      console.warn('[Celebrations] canvas-confetti not loaded');
      return;
    }

    const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#FFD700'];

    const firework = (x, y) => {
      confetti({
        particleCount: 80,
        spread: 360,
        startVelocity: 30,
        decay: 0.95,
        gravity: 0.8,
        origin: { x, y },
        colors,
        ticks: 200
      });
    };

    // Launch sequence - multiple fireworks at different positions
    firework(0.2, 0.3);
    setTimeout(() => firework(0.8, 0.25), 200);
    setTimeout(() => firework(0.5, 0.2), 400);
    setTimeout(() => firework(0.3, 0.35), 600);
    setTimeout(() => firework(0.7, 0.3), 800);
    setTimeout(() => firework(0.5, 0.15), 1000);
  };

  /**
   * Trigger coin rain effect (for chores with earnings)
   * @param {Object} chore - Chore object with amount property
   */
  const triggerCoinRain = (chore) => {
    if (!window.CoinRain) {
      console.warn('[Celebrations] CoinRain not loaded');
      return;
    }

    const coinCount = Math.min(Math.max(Math.floor((chore?.amount || 1) * 10), 15), 40);
    window.CoinRain.rain({ count: coinCount, withSound: true });
  };

  /**
   * Trigger Nyan Cat fly animation
   */
  const triggerNyanCat = () => {
    if (!window.NyanCat) {
      console.warn('[Celebrations] NyanCat not loaded');
      return;
    }

    window.NyanCat.fly({ duration: 2500, size: 1500 });
  };

  /**
   * Trigger FF Victory fanfare with confetti burst
   * The classic Final Fantasy battle victory music! 🎺
   */
  const triggerFFVictory = () => {
    // Play the victory fanfare
    if (window.FFVictory) {
      window.FFVictory.play();
    } else {
      console.warn('[Celebrations] FFVictory not loaded');
    }

    // Accompany with a celebratory confetti burst
    if (typeof confetti === 'function') {
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#32CD32'];
      
      // Victory burst from center
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors
      });

      // Delayed side bursts for dramatic effect
      setTimeout(() => {
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.7 },
          colors
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.7 },
          colors
        });
      }, 300);
    }
  };

  /**
   * Trigger a random celebration effect
   * @param {Object} chore - Optional chore object (for coin rain eligibility)
   */
  const triggerRandomCelebration = (chore = null) => {
    const celebrations = ['confetti', 'nyancat', 'cannons', 'fireworks', 'ffvictory'];

    // Only include coin rain if chore has money
    if (chore?.amount > 0 && window.CoinRain) {
      celebrations.push('coins');
    }

    const randomIndex = Math.floor(Math.random() * celebrations.length);
    const selected = celebrations[randomIndex];

    if (CONFIG?.ENV?.IS_DEVELOPMENT) {
      console.log('[Celebrations] Random selection:', selected, 'from', celebrations);
    }

    switch (selected) {
      case 'coins':
        triggerCoinRain(chore);
        break;
      case 'nyancat':
        triggerNyanCat();
        break;
      case 'cannons':
        triggerSideCannons();
        break;
      case 'fireworks':
        triggerFireworks();
        break;
      case 'ffvictory':
        triggerFFVictory();
        break;
      default:
        triggerConfettiBurst();
    }
  };

  /**
   * Trigger celebration based on user preferences
   * @param {Object} options
   * @param {Object} options.chore - Chore object (optional, for coin rain)
   * @param {Object} options.accountSettings - Account settings with preferences
   */
  const celebrate = (options = {}) => {
    const { chore = null, accountSettings = null } = options;
    
    // Get celebration style from account settings, default to 'random'
    const celebrationStyle = accountSettings?.preferences?.celebrationStyle || 'random';

    if (CONFIG?.ENV?.IS_DEVELOPMENT) {
      console.log('[Celebrations] celebrate() called');
      console.log('  - chore:', chore?.name, 'amount:', chore?.amount);
      console.log('  - celebrationStyle:', celebrationStyle);
    }

    // Random selection
    if (celebrationStyle === 'random') {
      triggerRandomCelebration(chore);
      return;
    }

    // Specific style selection
    switch (celebrationStyle) {
      case 'coins':
        if (chore?.amount > 0 && window.CoinRain) {
          triggerCoinRain(chore);
        } else {
          triggerConfettiBurst(); // Fallback if no amount
        }
        break;
      case 'nyancat':
        triggerNyanCat();
        break;
      case 'cannons':
        triggerSideCannons();
        break;
      case 'fireworks':
        triggerFireworks();
        break;
      case 'ffvictory':
        triggerFFVictory();
        break;
      default:
        triggerConfettiBurst();
    }
  };

  // Return public API
  return {
    celebrate,
    triggerConfettiBurst,
    triggerSideCannons,
    triggerFireworks,
    triggerCoinRain,
    triggerNyanCat,
    triggerFFVictory,
    triggerRandomCelebration,
    getThemeColors
  };
};

// Make available globally for non-module usage
window.useCelebrations = useCelebrations;
