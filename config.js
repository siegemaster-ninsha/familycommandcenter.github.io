// Family Command Center - Frontend Configuration
// This file is safe to be public as it only contains client-side configuration

const CONFIG = {
  // API Configuration
  // Replace these URLs with your actual API Gateway endpoints after deployment
  API: {
    BASE_URL: 'https://cq5lvrvppd.execute-api.us-east-1.amazonaws.com',
    // websocket base should point to the WebSocket ApiId, not the HTTP ApiId
    WS_BASE: 'wss://kxpcn8baw8.execute-api.us-east-1.amazonaws.com',
    STAGE: 'dev',
    
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
      ACCOUNT_SETTINGS: '/account-settings',
      // Membership & Invites & Spending
      FAMILY_CHILDREN: '/family-members/children',
      PARENT_INVITE: '/family-members/parents/invite',
      PARENT_ACCEPT_INVITE: '/family-members/parents/accept-invite',
      SPEND_REQUESTS: '/family-members/spend-requests'
    }
  },

  // AWS Cognito Configuration
  // Updated with actual deployed Cognito values
  AUTH: {
    REGION: 'us-east-1',
    USER_POOL_ID: 'us-east-1_i0PF716dD',
    CLIENT_ID: '39s0ga9m4baqusk8vnk5sal8kk',
    IDENTITY_POOL_ID: 'us-east-1:5e1cfec5-10da-46c5-a015-5f328f0b7748'
  },

  // Application Settings
  APP: {
    NAME: 'Family Command Center',
    VERSION: '1.0.1 - Wonderful Jaguar (Dec 14, 2025)',
    
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
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
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
        success: '#16A34A',
        warning: '#CA8A04',
        error: '#DC2626',
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
        warning: '#F59E0B',
        error: '#EF4444',
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
        warning: '#F59E0B',
        error: '#F43F5E',
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
        warning: '#FB923C',
        error: '#EF4444',
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
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
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
        warning: '#F59E0B',
        error: '#F43F5E',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    vintageCharm: {
      id: 'vintageCharm',
      name: 'Vintage Charm',
      description: 'Sophisticated palette with burgundy and coral tones',
      colors: {
        primary: '#7B3947',     // Deep burgundy/wine red
        secondary: '#EB615F',   // Coral/salmon pink 
        success: '#84CC16',     // Muted lime for success
        warning: '#D97706',
        error: '#DC2626',
        textPrimary: '#24222D', // Dark charcoal for primary text
        textSecondary: '#9C7379' // Dusty rose/mauve for secondary text
      }
    },
    seafoam: {
      id: 'seafoam',
      name: 'Seafoam',
      description: 'Calming seafoam green with soft ocean tones',
      colors: {
        primary: '#426E6F',     // Main seafoam teal
        secondary: '#346F6F',   // Deeper teal for accents
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937', // Dark gray for primary text
        textSecondary: '#6B7280' // Medium gray for secondary text
      }
    },
    strikingElegance: {
      id: 'strikingElegance',
      name: 'Striking Elegance',
      description: 'Sophisticated navy blue with warm gold accents',
      colors: {
        primary: '#030432',     // Deep navy blue
        secondary: '#F2A249',   // Warm orange/gold
        success: '#10B981',
        warning: '#F59E0B',
        error: '#F43F5E',
        textPrimary: '#FFFFFF', // White text for dark theme
        textSecondary: '#E5E7EB' // Light gray for secondary text
      }
    },
    aurora: {
      id: 'aurora',
      name: 'Aurora',
      description: 'Crisp teal with indigo accents',
      colors: {
        primary: '#0EA5E9',
        secondary: '#6366F1',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    blossom: {
      id: 'blossom',
      name: 'Blossom',
      description: 'Soft rose with deep indigo',
      colors: {
        primary: '#F472B6',
        secondary: '#4338CA',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#DC2626',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    carbon: {
      id: 'carbon',
      name: 'Carbon',
      description: 'Modern dark with electric blue',
      colors: {
        primary: '#111827',
        secondary: '#2563EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#F43F5E',
        textPrimary: '#F9FAFB',
        textSecondary: '#D1D5DB'
      }
    },
    modernMinimal: {
      id: 'modernMinimal',
      name: 'Modern Minimal',
      description: 'Clean indigo primary with cyan accents',
      colors: {
        primary: '#4F46E5',      // Indigo 600
        secondary: '#06B6D4',    // Cyan 500
        success: '#10B981',      // Emerald 500
        warning: '#F59E0B',      // Amber 500
        error: '#EF4444',        // Red 500
        textPrimary: '#0F172A',  // Slate 900
        textSecondary: '#475569' // Slate 600
      }
    },
    warmGrayBlue: {
      id: 'warmGrayBlue',
      name: 'Warm Gray + Blue',
      description: 'Neutral warm grays with crisp blue accents',
      colors: {
        primary: '#2563EB',      // Blue 600
        secondary: '#6B7280',    // Gray 500 (warm gray accent)
        success: '#10B981',
        warning: '#D97706',
        error: '#DC2626',
        textPrimary: '#1F2937',  // Gray 800
        textSecondary: '#6B7280' // Gray 500
      }
    },
    tealSand: {
      id: 'tealSand',
      name: 'Teal + Sand',
      description: 'Relaxed teal with warm sand accents',
      colors: {
        primary: '#0D9488',      // Teal 600
        secondary: '#F59E0B',    // Amber 500 (sand accent)
        success: '#10B981',
        warning: '#CA8A04',
        error: '#DC2626',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    nocturne: {
      id: 'nocturne',
      name: 'Nocturne',
      description: 'Dark, understated surfaces with vivid blue accents',
      colors: {
        primary: '#0B1220',      // very dark navy for surfaces
        secondary: '#3B82F6',    // Blue 500 accent
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#F3F4F6',  // light text
        textSecondary: '#D1D5DB'
      }
    },
    orken: {
      id: 'orken',
      name: 'ORKEN',
      description: 'High-contrast orange with clean neutrals',
      colors: {
        primary: '#FF6B01',
        secondary: '#353535',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#353535',
        textSecondary: '#6B7280'
      }
    },
    manaMate: {
      id: 'manaMate',
      name: 'Mana Yerba Mate',
      description: 'Sunny yellow with navy and soft accents',
      colors: {
        primary: '#FFD372',
        secondary: '#2C3D73',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#475569'
      }
    },
    mammutBaikal: {
      id: 'mammutBaikal',
      name: 'Mammut Expedition',
      description: 'Deep blue with safety orange',
      colors: {
        primary: '#114AB1',
        secondary: '#E4580B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    kaffestuggu: {
      id: 'kaffestuggu',
      name: 'Kaffestuggu',
      description: 'Calm pastels and cozy neutrals',
      colors: {
        primary: '#F2BFA4',
        secondary: '#F5E7DE',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    advillains: {
      id: 'advillains',
      name: 'Advillains',
      description: 'Energetic yellows with modern neutrals',
      colors: {
        primary: '#ECC232',
        secondary: '#BDBCB8',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    adobeBowie: {
      id: 'adobeBowie',
      name: 'Adobe × Bowie',
      description: 'Bold red with soft sand',
      colors: {
        primary: '#F02F34',
        secondary: '#E7D3BB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    historyBlockchain: {
      id: 'historyBlockchain',
      name: 'History of Blockchain',
      description: 'Purple with deep midnight',
      colors: {
        primary: '#6552D0',
        secondary: '#17203D',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    deduxer: {
      id: 'deduxer',
      name: 'Deduxer Studio',
      description: 'Royal purple with modern gray',
      colors: {
        primary: '#6552D0',
        secondary: '#A5A5A5',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    tiktokPartners: {
      id: 'tiktokPartners',
      name: 'TikTok Partners',
      description: 'Black base with neon cyan and hot pink',
      colors: {
        primary: '#000000',
        secondary: '#74F0ED',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EA445A',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    boldByNature: {
      id: 'boldByNature',
      name: 'Bold by Nature',
      description: 'Forest green with citrus and leaf',
      colors: {
        primary: '#172D13',
        secondary: '#D76F30',
        success: '#6BB77B',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    amour: {
      id: 'amour',
      name: 'Amour',
      description: 'Mint teal with coral and gold',
      colors: {
        primary: '#5AC3B0',
        secondary: '#DE5935',
        success: '#10B981',
        warning: '#F7CD46',
        error: '#EF4444',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280'
      }
    },
    authenticBrief: {
      id: 'authenticBrief',
      name: 'The Authentic Brief',
      description: 'Beige base with aqua and magenta accents',
      colors: {
        primary: '#5EBEC4',
        secondary: '#F92C85',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    transformFestival: {
      id: 'transformFestival',
      name: 'Transform Festival',
      description: 'Lime neon with bright lilac',
      colors: {
        primary: '#ABF62D',
        secondary: '#D6A3FB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    bankyfy: {
      id: 'bankyfy',
      name: 'Bankyfy',
      description: 'Golden hues with bright blue',
      colors: {
        primary: '#FECD45',
        secondary: '#2568FB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    sigurd: {
      id: 'sigurd',
      name: 'Sigurd Lewerentz',
      description: 'Gray-blue with stark black and white',
      colors: {
        primary: '#A0AECD',
        secondary: '#000000',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#000000',
        textSecondary: '#6B7280'
      }
    },
    golfspace: {
      id: 'golfspace',
      name: 'GolfSpace',
      description: 'Deep gray with lime accent',
      colors: {
        primary: '#6E6E6E',
        secondary: '#BCFD4C',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    studioSimpatico: {
      id: 'studioSimpatico',
      name: 'Studio Simpatico',
      description: 'Navy base with vivid orange and soft accents',
      colors: {
        primary: '#1A2238',
        secondary: '#FF6A3D',
        success: '#10B981',
        warning: '#F4DB7D',
        error: '#EF4444',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
      }
    },
    uglyDrinks: {
      id: 'uglyDrinks',
      name: 'Ugly Drinks',
      description: 'Cyan with deep navy',
      colors: {
        primary: '#00ABE1',
        secondary: '#161F6D',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        textPrimary: '#0F172A',
        textSecondary: '#475569'
      }
    },
    distinction: {
      id: 'distinction',
      name: 'Distinction',
      description: 'All-black base with rainbow accents',
      colors: {
        primary: '#000000',
        secondary: '#2CCCC3',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#E60576',
        textPrimary: '#F3F4F6',
        textSecondary: '#D1D5DB'
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
    const darkThemes = ['darknight', 'cyberpunk', 'obsidian', 'deepforest', 'darkcrimson', 'strikingElegance', 'nocturne', 'carbon', 'tiktokPartners', 'distinction', 'historyBlockchain', 'studioSimpatico', 'boldByNature'];
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

    // Warning colors (prefer explicit theme warning; fallback to secondary)
    const warnBase = theme.colors.warning || theme.colors.secondary;
    root.style.setProperty('--color-warning-500', warnBase);
    root.style.setProperty('--color-warning-600', this.darkenColor(warnBase, 10));

    // Error colors (prefer explicit theme error; fallback to darkened primary)
    const errorBase = theme.colors.error || this.darkenColor(theme.colors.primary, 15);
    root.style.setProperty('--color-error-500', errorBase);
    root.style.setProperty('--color-error-600', this.darkenColor(errorBase, 10));

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
    root.style.setProperty('--gradient-warning', `linear-gradient(135deg, ${warnBase}, ${this.darkenColor(warnBase, 10)})`);
    root.style.setProperty('--gradient-error', `linear-gradient(135deg, ${errorBase}, ${this.darkenColor(errorBase, 10)})`);

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
  },

  // ===========================================
  // DARK MODE SYNC (iOS/System Preference)
  // ===========================================

  // Default themes for light/dark system preferences
  LIGHT_THEME_DEFAULT: 'default',
  DARK_THEME_DEFAULT: 'nocturne',

  // Get the system's preferred color scheme
  getSystemColorScheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  },

  // Check if user has manually overridden the system preference
  hasUserOverride() {
    return localStorage.getItem('themeOverride') === 'true';
  },

  // Set user override preference
  setUserOverride(override) {
    if (override) {
      localStorage.setItem('themeOverride', 'true');
    } else {
      localStorage.removeItem('themeOverride');
    }
  },

  // Get the appropriate theme based on system preference
  getThemeForSystemPreference(colorScheme) {
    // Check if there's a saved preference for this color scheme
    const savedLightTheme = localStorage.getItem('lightTheme');
    const savedDarkTheme = localStorage.getItem('darkTheme');
    
    if (colorScheme === 'dark') {
      return savedDarkTheme || this.DARK_THEME_DEFAULT;
    }
    return savedLightTheme || this.LIGHT_THEME_DEFAULT;
  },

  // Save theme preference for a specific color scheme
  saveThemeForColorScheme(themeId, colorScheme) {
    if (colorScheme === 'dark') {
      localStorage.setItem('darkTheme', themeId);
    } else {
      localStorage.setItem('lightTheme', themeId);
    }
  },

  // Handle system color scheme change
  handleColorSchemeChange(event) {
    const colorScheme = event.matches ? 'dark' : 'light';
    console.log('🌓 System color scheme changed to:', colorScheme);
    
    // Only auto-switch if user hasn't manually overridden
    if (!ThemeManager.hasUserOverride()) {
      const themeId = ThemeManager.getThemeForSystemPreference(colorScheme);
      console.log('🎨 Auto-switching to theme:', themeId);
      localStorage.setItem('selectedTheme', themeId);
      ThemeManager.applyTheme(themeId);
      
      // Dispatch event for app components to react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('theme-changed', {
          detail: { themeId, colorScheme, source: 'system' }
        }));
      }
    } else {
      console.log('🎨 User has override preference, not auto-switching');
    }
  },

  // Initialize dark mode sync listener
  initDarkModeSync() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      console.log('🌓 Dark mode sync not available (no matchMedia support)');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Add listener for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', this.handleColorSchemeChange);
    } else if (mediaQuery.addListener) {
      // Fallback for older browsers
      mediaQuery.addListener(this.handleColorSchemeChange);
    }

    console.log('🌓 Dark mode sync initialized, current system preference:', 
      mediaQuery.matches ? 'dark' : 'light');
  },

  // Save theme with user override (user explicitly chose a theme)
  saveThemeWithOverride(themeId) {
    this.setUserOverride(true);
    localStorage.setItem('selectedTheme', themeId);
    this.applyTheme(themeId);
    
    // Also save for the current color scheme
    const currentScheme = this.getSystemColorScheme();
    this.saveThemeForColorScheme(themeId, currentScheme);
  },

  // Clear user override and sync with system preference
  clearOverrideAndSync() {
    this.setUserOverride(false);
    const colorScheme = this.getSystemColorScheme();
    const themeId = this.getThemeForSystemPreference(colorScheme);
    localStorage.setItem('selectedTheme', themeId);
    this.applyTheme(themeId);
    
    console.log('🌓 Cleared override, synced to system preference:', colorScheme, '-> theme:', themeId);
    
    // Dispatch event for app components to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme-changed', {
        detail: { themeId, colorScheme, source: 'system-sync' }
      }));
    }
  }
};

// ===========================================
// INITIALIZE THEME ON LOAD
// ===========================================
if (typeof document !== 'undefined') {
  // Initialize theme immediately to prevent flash of unstyled content
  ThemeManager.initializeTheme();
  
  // Initialize dark mode sync for iOS/system preference
  ThemeManager.initDarkModeSync();
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
