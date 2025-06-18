// Family Command Center - Frontend Configuration
// This file is safe to be public as it only contains client-side configuration

const CONFIG = {
  // API Configuration
  // Replace these URLs with your actual API Gateway endpoints after deployment
  API: {
    BASE_URL: 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com',
    
    // API Endpoints
    ENDPOINTS: {
      // Auth
      AUTH_ME: '/auth/me',
      
      // Chores
      CHORES: '/chores',
      CHORES_BY_PERSON: '/chores/person',
      CHORES_NEW_DAY: '/chores/new-day',
      EARNINGS: '/earnings',
      ELECTRONICS_STATUS: '/electronics-status',
      
      // Family Members
      FAMILY_MEMBERS: '/family-members',
      
      // Quicklist  
      QUICKLIST: '/quicklist',
      QUICKLIST_INITIALIZE: '/quicklist/initialize',
      
      // Shopping Items
      SHOPPING_ITEMS: '/shopping-items',
      SHOPPING_ITEMS_CLEAR_COMPLETED: '/shopping-items/clear-completed',
      SHOPPING_ITEMS_MARK_ALL_COMPLETE: '/shopping-items/mark-all-complete',
      SHOPPING_ITEMS_CLEAR_ALL: '/shopping-items/clear-all',
      
      // Shopping Quick Items
      SHOPPING_QUICK_ITEMS: '/shopping-quick-items',
      SHOPPING_QUICK_ITEMS_INITIALIZE: '/shopping-quick-items/initialize',
      
      // Stores
      STORES: '/stores',
      
      // Account Settings
      ACCOUNT_SETTINGS: '/account-settings'
    }
  },

  // AWS Cognito Configuration
  // Updated with actual deployed Cognito values
  AUTH: {
    REGION: 'us-east-1',
    USER_POOL_ID: 'us-east-1_gufFo8nak',
    CLIENT_ID: '4qas7585dis9bg7i1ihampav99',
    IDENTITY_POOL_ID: 'us-east-1:5e1cfec5-10da-46c5-a015-5f328f0b7748'
  },

  // Application Settings
  APP: {
    NAME: 'Family Command Center',
    VERSION: '1.0.0',
    
    // Chore Categories (safe to be public)
    CATEGORIES: {
      REGULAR: 'regular',
      SCHOOL: 'school', 
      ELECTRONICS: 'game'
    },

    // UI Settings
    CONFETTI_PIECES: 300,
    CONFETTI_DURATION: 4000,
    SUCCESS_MESSAGE_DURATION: 3000
  },

  // Development vs Production Detection
  ENV: {
    IS_DEVELOPMENT: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    IS_GITHUB_PAGES: window.location.hostname.includes('github.io')
  },

  // ===========================================
  // THEME SYSTEM - SINGLE SOURCE OF TRUTH
  // ===========================================
  THEMES: {
    default: {
      id: 'default',
      name: 'Ocean Blue',
      description: 'Friendly blue with purple accents',
      colors: {
        primary: '#4A90E2',
        secondary: '#7B68EE',
        success: '#50C878',
        textPrimary: '#2D3748',
        textSecondary: '#718096'
      }
    },
    forest: {
      id: 'forest',
      name: 'Forest Green',
      description: 'Natural greens with earth tones',
      colors: {
        primary: '#22C55E',
        secondary: '#16A34A',
        success: '#15803D',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    sunset: {
      id: 'sunset',
      name: 'Sunset Orange',
      description: 'Warm oranges and reds',
      colors: {
        primary: '#F97316',
        secondary: '#EA580C',
        success: '#22C55E',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    lavender: {
      id: 'lavender',
      name: 'Lavender Purple',
      description: 'Soft purples with pink accents',
      colors: {
        primary: '#8B5CF6',
        secondary: '#A855F7',
        success: '#22C55E',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    rose: {
      id: 'rose',
      name: 'Rose Pink',
      description: 'Elegant pinks with warm tones',
      colors: {
        primary: '#EC4899',
        secondary: '#F43F5E',
        success: '#22C55E',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    midnight: {
      id: 'midnight',
      name: 'Midnight Blue',
      description: 'Deep blues with silver accents',
      colors: {
        primary: '#1E40AF',
        secondary: '#3730A3',
        success: '#22C55E',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    darknight: {
      id: 'darknight',
      name: 'Dark Night',
      description: 'Sophisticated dark theme with purple accents',
      colors: {
        primary: '#3C3C50',
        secondary: '#28283C',
        success: '#22C55E',
        textPrimary: '#E5E7EB',
        textSecondary: '#9CA3AF'
      }
    },
    cyberpunk: {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      description: 'Futuristic dark theme with neon accents',
      colors: {
        primary: '#8B5CF6',
        secondary: '#A855F7',
        success: '#10B981',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    obsidian: {
      id: 'obsidian',
      name: 'Obsidian',
      description: 'Pure dark elegance with subtle highlights',
      colors: {
        primary: '#374151',
        secondary: '#4B5563',
        success: '#059669',
        textPrimary: '#F9FAFB',
        textSecondary: '#E5E7EB'
      }
    },
    deepforest: {
      id: 'deepforest',
      name: 'Deep Forest',
      description: 'Dark forest greens with earthy tones',
      colors: {
        primary: '#064E3B',
        secondary: '#065F46',
        success: '#10B981',
        textPrimary: '#ECFDF5',
        textSecondary: '#A7F3D0'
      }
    },
    darkcrimson: {
      id: 'darkcrimson',
      name: 'Dark Crimson',
      description: 'Rich dark reds with warm undertones',
      colors: {
        primary: '#7F1D1D',
        secondary: '#991B1B',
        success: '#16A34A',
        textPrimary: '#FEF2F2',
        textSecondary: '#FECACA'
      }
    },
    vintageCharm: {
      id: 'vintageCharm',
      name: 'Vintage Charm',
      description: 'Sophisticated palette with burgundy and coral tones',
      colors: {
        primary: '#7B3947',     // Deep burgundy/wine red
        secondary: '#EB615F',   // Coral/salmon pink 
        success: '#A59A7E',     // Olive/tan for success states
        textPrimary: '#24222D', // Dark charcoal for primary text
        textSecondary: '#9C7379' // Dusty rose/mauve for secondary text
      }
    }
  }
};

// ===========================================
// THEME UTILITY FUNCTIONS
// ===========================================

const ThemeManager = {
  // color manipulation helper functions
  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  },

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
      null;
  },

  // detect if theme is dark based on text color brightness
  isDarkTheme(theme) {
    // Dark themes have light text colors
    const darkThemes = ['darknight', 'cyberpunk', 'obsidian', 'deepforest', 'darkcrimson'];
    return darkThemes.includes(theme.id);
  },

  // apply a theme to CSS custom properties
  applyTheme(themeId) {
    const theme = CONFIG.THEMES[themeId];
    if (!theme) {
      console.warn(`Theme '${themeId}' not found, falling back to default`);
      return this.applyTheme('default');
    }

    const root = document.documentElement;
    const isDark = this.isDarkTheme(theme);

    // Primary colors
    root.style.setProperty('--color-primary-500', theme.colors.primary);
    root.style.setProperty('--color-primary-600', this.darkenColor(theme.colors.primary, 10));
    root.style.setProperty('--color-primary-100', this.lightenColor(theme.colors.primary, 40));
    root.style.setProperty('--color-primary-50', this.lightenColor(theme.colors.primary, 45));

    // Secondary colors
    root.style.setProperty('--color-secondary-500', theme.colors.secondary);
    root.style.setProperty('--color-secondary-600', this.darkenColor(theme.colors.secondary, 10));
    root.style.setProperty('--color-secondary-50', this.lightenColor(theme.colors.secondary, 45));

    // Success colors
    root.style.setProperty('--color-success-500', theme.colors.success);
    root.style.setProperty('--color-success-600', this.darkenColor(theme.colors.success, 10));

    // Warning colors (use secondary color for warning states)
    root.style.setProperty('--color-warning-500', theme.colors.secondary);
    root.style.setProperty('--color-warning-600', this.darkenColor(theme.colors.secondary, 10));

    // Error colors (use darkened primary color for error states)
    root.style.setProperty('--color-error-500', this.darkenColor(theme.colors.primary, 15));
    root.style.setProperty('--color-error-600', this.darkenColor(theme.colors.primary, 25));

    // Text colors
    root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);

    // Background colors - handle dark themes differently
    let bgPrimary, bgSecondary, cardBg, borderColor;
    
    if (isDark) {
      // For dark themes: use much darker colors for backgrounds to contrast with light text
      bgPrimary = this.darkenColor(theme.colors.primary, 60);
      bgSecondary = this.darkenColor(theme.colors.secondary, 60);
      cardBg = this.darkenColor(theme.colors.primary, 50);
      borderColor = this.darkenColor(theme.colors.primary, 40);
    } else {
      // For light themes: use lightened colors for backgrounds
      bgPrimary = this.lightenColor(theme.colors.primary, 48);
      bgSecondary = this.lightenColor(theme.colors.secondary, 48);
      cardBg = this.lightenColor(theme.colors.primary, 50);
      borderColor = this.lightenColor(theme.colors.primary, 42);
    }

    root.style.setProperty('--color-bg-primary', bgPrimary);
    root.style.setProperty('--color-bg-secondary', bgSecondary);
    root.style.setProperty('--color-bg-card', cardBg);
    root.style.setProperty('--color-border-card', borderColor);

    // Update neutral colors for dark themes
    if (isDark) {
      root.style.setProperty('--color-neutral-50', this.darkenColor(theme.colors.primary, 70));
      root.style.setProperty('--color-neutral-100', this.darkenColor(theme.colors.primary, 65));
      root.style.setProperty('--color-neutral-200', this.darkenColor(theme.colors.primary, 55));
      root.style.setProperty('--color-neutral-300', this.darkenColor(theme.colors.primary, 45));
      root.style.setProperty('--color-neutral-400', this.darkenColor(theme.colors.primary, 35));
      root.style.setProperty('--color-neutral-500', this.darkenColor(theme.colors.primary, 25));
      root.style.setProperty('--color-neutral-600', this.darkenColor(theme.colors.primary, 15));
      root.style.setProperty('--color-neutral-700', this.darkenColor(theme.colors.primary, 5));
      root.style.setProperty('--color-neutral-800', theme.colors.primary);
      root.style.setProperty('--color-neutral-900', this.lightenColor(theme.colors.primary, 10));
    } else {
      // Reset to default neutral colors for light themes
      root.style.setProperty('--color-neutral-50', '#F8FAFC');
      root.style.setProperty('--color-neutral-100', '#f1f5f9');
      root.style.setProperty('--color-neutral-200', '#e2e8f0');
      root.style.setProperty('--color-neutral-300', '#cbd5e1');
      root.style.setProperty('--color-neutral-400', '#94a3b8');
      root.style.setProperty('--color-neutral-500', '#718096');
      root.style.setProperty('--color-neutral-600', '#475569');
      root.style.setProperty('--color-neutral-700', '#334155');
      root.style.setProperty('--color-neutral-800', '#2D3748');
      root.style.setProperty('--color-neutral-900', '#1a202c');
    }

    // Update component colors to match theme
    root.style.setProperty('--color-quicklist-border', borderColor);
    root.style.setProperty('--color-quicklist-bg', cardBg);
    root.style.setProperty('--color-family-card-bg', cardBg);
    root.style.setProperty('--color-family-card-border', borderColor);
    root.style.setProperty('--color-unassigned-bg', cardBg);
    root.style.setProperty('--color-unassigned-border', borderColor);

    // Update gradients to use the new theme colors
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${theme.colors.primary}, ${this.darkenColor(theme.colors.primary, 10)})`);
    root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${theme.colors.secondary}, ${this.darkenColor(theme.colors.secondary, 10)})`);
    root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${theme.colors.success}, ${this.darkenColor(theme.colors.success, 10)})`);
    root.style.setProperty('--gradient-warning', `linear-gradient(135deg, ${theme.colors.secondary}, ${this.darkenColor(theme.colors.secondary, 10)})`);
    root.style.setProperty('--gradient-error', `linear-gradient(135deg, ${this.darkenColor(theme.colors.primary, 15)}, ${this.darkenColor(theme.colors.primary, 25)})`);

    // RGB versions for Tailwind opacity support
    root.style.setProperty('--color-primary-50', this.hexToRgb(this.lightenColor(theme.colors.primary, 45)));
    root.style.setProperty('--color-primary-100', this.hexToRgb(this.lightenColor(theme.colors.primary, 40)));
    root.style.setProperty('--color-primary-200', this.hexToRgb(this.lightenColor(theme.colors.primary, 30)));
    root.style.setProperty('--color-primary-300', this.hexToRgb(this.lightenColor(theme.colors.primary, 20)));
    root.style.setProperty('--color-primary-400', this.hexToRgb(this.lightenColor(theme.colors.primary, 10)));
    root.style.setProperty('--color-primary-700', this.hexToRgb(this.darkenColor(theme.colors.primary, 20)));
    root.style.setProperty('--color-primary-800', this.hexToRgb(this.darkenColor(theme.colors.primary, 30)));
    root.style.setProperty('--color-primary-900', this.hexToRgb(this.darkenColor(theme.colors.primary, 40)));

    console.log('🎨 Theme applied:', themeId, theme);
  },

  // initialize theme on page load
  initializeTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    console.log('🎨 ThemeManager.initializeTheme() - applying theme:', savedTheme);
    this.applyTheme(savedTheme);
  },

  // get current theme
  getCurrentTheme() {
    return localStorage.getItem('selectedTheme') || 'default';
  },

  // save theme selection
  saveTheme(themeId) {
    localStorage.setItem('selectedTheme', themeId);
    this.applyTheme(themeId);
  }
};

// ===========================================
// INITIALIZE THEME ON LOAD
// ===========================================
if (typeof document !== 'undefined') {
  // Initialize theme immediately to prevent flash of unstyled content
  ThemeManager.initializeTheme();
}

// Helper function to get full API URL
CONFIG.getApiUrl = function(endpoint) {
  return this.API.BASE_URL + endpoint;
};

// Helper function to check if API is configured
CONFIG.isApiConfigured = function() {
  return !this.API.BASE_URL.includes('your-api-gateway-url');
};

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
} 