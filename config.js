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
      
      // Recipes
      RECIPES: '/recipes',
      
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
    VERSION: '1.0.23 - Wondrous Urchin (Dec 14, 2025)',
    
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
  // ===========================================
  // STANDARDIZED SHADE GENERATION SYSTEM
  // ===========================================
  // 
  // This system generates consistent color shades following Tailwind's
  // 50-900 scale using HSL color space for perceptually uniform results.
  //
  // Shade Scale Reference:
  //   50  - Lightest (backgrounds, subtle highlights)
  //   100 - Very light (hover backgrounds)
  //   200 - Light (borders, dividers)
  //   300 - Light-medium (disabled states)
  //   400 - Medium-light (placeholder text)
  //   500 - BASE COLOR (primary usage)
  //   600 - Medium-dark (hover states on buttons)
  //   700 - Dark (active states, emphasis)
  //   800 - Very dark (text on light backgrounds)
  //   900 - Darkest (headings, high contrast)
  //
  // Usage in CSS variables:
  //   --color-primary-50 through --color-primary-900
  //   --color-success-50 through --color-success-700
  //   etc.
  // ===========================================

  // Shade multipliers for consistent generation (relative to 500 base)
  // These values produce results similar to Tailwind's color palette
  SHADE_CONFIG: {
    50:  { lightness: 0.95 },  // Very light background
    100: { lightness: 0.90 },  // Light background
    200: { lightness: 0.80 },  // Lighter
    300: { lightness: 0.65 },  // Light-medium
    400: { lightness: 0.50 },  // Medium-light
    500: { lightness: 0.00 },  // Base (no change)
    600: { lightness: -0.10 }, // Slightly darker
    700: { lightness: -0.25 }, // Darker
    800: { lightness: -0.40 }, // Very dark
    900: { lightness: -0.55 }, // Darkest
  },

  // Convert hex to HSL
  hexToHsl(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  // Convert HSL to hex
  hslToHex(h, s, l) {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  // Generate a specific shade from a base color
  generateShade(baseColor, shade) {
    const hsl = this.hexToHsl(baseColor);
    if (!hsl) return baseColor;
    
    const config = this.SHADE_CONFIG[shade];
    if (!config) return baseColor;
    
    // Adjust lightness based on shade config
    let newLightness;
    if (config.lightness >= 0) {
      // Lighter shades: interpolate toward white
      newLightness = hsl.l + (100 - hsl.l) * config.lightness;
    } else {
      // Darker shades: interpolate toward black
      newLightness = hsl.l * (1 + config.lightness);
    }
    
    // Clamp lightness to valid range
    newLightness = Math.max(0, Math.min(100, newLightness));
    
    // Slightly reduce saturation for very light shades to avoid garish colors
    let newSaturation = hsl.s;
    if (shade <= 100) {
      newSaturation = hsl.s * 0.8;
    }
    
    return this.hslToHex(hsl.h, newSaturation, newLightness);
  },

  // Generate all shades for a color and return as object
  generateAllShades(baseColor) {
    const shades = {};
    Object.keys(this.SHADE_CONFIG).forEach(shade => {
      shades[shade] = this.generateShade(baseColor, parseInt(shade));
    });
    return shades;
  },

  // Legacy methods (kept for backward compatibility)
  darkenColor(color, percent) {
    // Map old percentage to approximate shade
    // 10% -> 600, 20% -> 700, 30% -> 800, 40% -> 900
    const shadeMap = { 10: 600, 15: 600, 20: 700, 25: 700, 30: 800, 40: 900 };
    const shade = shadeMap[percent] || 600;
    return this.generateShade(color, shade);
  },

  lightenColor(color, percent) {
    // Map old percentage to approximate shade
    // 10% -> 400, 20% -> 300, 30% -> 200, 40% -> 100, 45% -> 50
    const shadeMap = { 10: 400, 20: 300, 30: 200, 40: 100, 42: 100, 45: 50, 48: 50, 50: 50 };
    const shade = shadeMap[percent] || 100;
    return this.generateShade(color, shade);
  },

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
      null;
  },

  // Detect if theme is dark based on text color luminance
  isDarkTheme(theme) {
    // Calculate luminance of text color - if it's light, theme is dark
    const hsl = this.hexToHsl(theme.colors.textPrimary);
    if (hsl && hsl.l > 50) {
      return true;
    }
    // Fallback to known dark themes list
    const darkThemes = ['darknight', 'cyberpunk', 'obsidian', 'deepforest', 'darkcrimson', 'strikingElegance', 'nocturne', 'carbon', 'tiktokPartners', 'distinction', 'historyBlockchain', 'studioSimpatico', 'boldByNature'];
    return darkThemes.includes(theme.id);
  },

  // apply a theme to CSS custom properties
  applyTheme(themeId) {
    // Handle invalid theme IDs gracefully
    if (!themeId || typeof themeId !== 'string') {
      console.warn(`Invalid theme ID: '${themeId}', falling back to default`);
      themeId = 'default';
    }
    
    const theme = CONFIG.THEMES[themeId];
    if (!theme) {
      console.warn(`Theme '${themeId}' not found, falling back to default`);
      try {
        localStorage.setItem('selectedTheme', 'default');
      } catch (e) {
        this._inMemoryTheme = 'default';
      }
      return this.applyTheme('default');
    }

    const root = document.documentElement;
    const isDark = this.isDarkTheme(theme);
    
    try {
      // ===========================================
      // PRIMARY COLOR SCALE (50-900)
      // ===========================================
      const primaryShades = this.generateAllShades(theme.colors.primary);
      root.style.setProperty('--color-primary-50', primaryShades[50]);
      root.style.setProperty('--color-primary-100', primaryShades[100]);
      root.style.setProperty('--color-primary-200', primaryShades[200]);
      root.style.setProperty('--color-primary-300', primaryShades[300]);
      root.style.setProperty('--color-primary-400', primaryShades[400]);
      root.style.setProperty('--color-primary-500', theme.colors.primary);
      root.style.setProperty('--color-primary-600', primaryShades[600]);
      root.style.setProperty('--color-primary-700', primaryShades[700]);
      root.style.setProperty('--color-primary-800', primaryShades[800]);
      root.style.setProperty('--color-primary-900', primaryShades[900]);

      // ===========================================
      // SECONDARY COLOR SCALE (50-900)
      // ===========================================
      const secondaryShades = this.generateAllShades(theme.colors.secondary);
      root.style.setProperty('--color-secondary-50', secondaryShades[50]);
      root.style.setProperty('--color-secondary-100', secondaryShades[100]);
      root.style.setProperty('--color-secondary-200', secondaryShades[200]);
      root.style.setProperty('--color-secondary-300', secondaryShades[300]);
      root.style.setProperty('--color-secondary-400', secondaryShades[400]);
      root.style.setProperty('--color-secondary-500', theme.colors.secondary);
      root.style.setProperty('--color-secondary-600', secondaryShades[600]);
      root.style.setProperty('--color-secondary-700', secondaryShades[700]);
      root.style.setProperty('--color-secondary-800', secondaryShades[800]);
      root.style.setProperty('--color-secondary-900', secondaryShades[900]);

      // ===========================================
      // SUCCESS COLOR SCALE (50-700)
      // ===========================================
      const successShades = this.generateAllShades(theme.colors.success);
      root.style.setProperty('--color-success-50', successShades[50]);
      root.style.setProperty('--color-success-100', successShades[100]);
      root.style.setProperty('--color-success-200', successShades[200]);
      root.style.setProperty('--color-success-500', theme.colors.success);
      root.style.setProperty('--color-success-600', successShades[600]);
      root.style.setProperty('--color-success-700', successShades[700]);

      // ===========================================
      // WARNING COLOR SCALE (50-700)
      // ===========================================
      const warnBase = theme.colors.warning || theme.colors.secondary;
      const warningShades = this.generateAllShades(warnBase);
      root.style.setProperty('--color-warning-50', warningShades[50]);
      root.style.setProperty('--color-warning-100', warningShades[100]);
      root.style.setProperty('--color-warning-200', warningShades[200]);
      root.style.setProperty('--color-warning-500', warnBase);
      root.style.setProperty('--color-warning-600', warningShades[600]);
      root.style.setProperty('--color-warning-700', warningShades[700]);

      // ===========================================
      // ERROR COLOR SCALE (50-700)
      // ===========================================
      const errorBase = theme.colors.error || this.generateShade(theme.colors.primary, 700);
      const errorShades = this.generateAllShades(errorBase);
      root.style.setProperty('--color-error-50', errorShades[50]);
      root.style.setProperty('--color-error-100', errorShades[100]);
      root.style.setProperty('--color-error-200', errorShades[200]);
      root.style.setProperty('--color-error-500', errorBase);
      root.style.setProperty('--color-error-600', errorShades[600]);
      root.style.setProperty('--color-error-700', errorShades[700]);

      // ===========================================
      // TEXT COLORS
      // ===========================================
      root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
      root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
      // Muted text: lighter version of secondary text
      const textSecondaryHsl = this.hexToHsl(theme.colors.textSecondary);
      if (textSecondaryHsl) {
        const mutedLightness = isDark ? textSecondaryHsl.l - 15 : textSecondaryHsl.l + 10;
        root.style.setProperty('--color-text-muted', this.hslToHex(textSecondaryHsl.h, textSecondaryHsl.s * 0.8, mutedLightness));
      }

      // ===========================================
      // BACKGROUND & SURFACE COLORS
      // ===========================================
      let bgPrimary, bgSecondary, cardBg, borderColor;
      
      if (isDark) {
        // Dark themes: derive backgrounds from primary, going darker
        bgPrimary = primaryShades[900];
        bgSecondary = secondaryShades[900];
        cardBg = primaryShades[800];
        borderColor = primaryShades[700];
      } else {
        // Light themes: use lightest shades for backgrounds
        bgPrimary = primaryShades[50];
        bgSecondary = secondaryShades[50];
        cardBg = '#ffffff'; // Cards are always white in light mode
        borderColor = primaryShades[200];
      }

      root.style.setProperty('--color-bg-primary', bgPrimary);
      root.style.setProperty('--color-bg-secondary', bgSecondary);
      root.style.setProperty('--color-bg-card', cardBg);
      root.style.setProperty('--color-bg-card-hover', isDark ? primaryShades[700] : primaryShades[100]);
      root.style.setProperty('--color-border-card', borderColor);

      // ===========================================
      // NEUTRAL COLOR SCALE
      // ===========================================
      if (isDark) {
        // Dark themes: neutrals derived from primary
        root.style.setProperty('--color-neutral-50', primaryShades[900]);
        root.style.setProperty('--color-neutral-100', primaryShades[800]);
        root.style.setProperty('--color-neutral-200', primaryShades[700]);
        root.style.setProperty('--color-neutral-300', primaryShades[600]);
        root.style.setProperty('--color-neutral-400', primaryShades[500]);
        root.style.setProperty('--color-neutral-500', primaryShades[400]);
        root.style.setProperty('--color-neutral-600', primaryShades[300]);
        root.style.setProperty('--color-neutral-700', primaryShades[200]);
        root.style.setProperty('--color-neutral-800', primaryShades[100]);
        root.style.setProperty('--color-neutral-900', primaryShades[50]);
      } else {
        // Light themes: standard Tailwind slate neutrals
        root.style.setProperty('--color-neutral-50', '#F8FAFC');
        root.style.setProperty('--color-neutral-100', '#f1f5f9');
        root.style.setProperty('--color-neutral-200', '#e2e8f0');
        root.style.setProperty('--color-neutral-300', '#cbd5e1');
        root.style.setProperty('--color-neutral-400', '#94a3b8');
        root.style.setProperty('--color-neutral-500', '#64748b');
        root.style.setProperty('--color-neutral-600', '#475569');
        root.style.setProperty('--color-neutral-700', '#334155');
        root.style.setProperty('--color-neutral-800', '#1e293b');
        root.style.setProperty('--color-neutral-900', '#0f172a');
      }

      // ===========================================
      // COMPONENT-SPECIFIC COLORS (semantic aliases)
      // ===========================================
      root.style.setProperty('--color-quicklist-border', borderColor);
      root.style.setProperty('--color-quicklist-bg', cardBg);
      root.style.setProperty('--color-quicklist-text', theme.colors.textPrimary);
      root.style.setProperty('--color-family-card-bg', cardBg);
      root.style.setProperty('--color-family-card-border', borderColor);
      root.style.setProperty('--color-family-card-hover', theme.colors.primary);
      root.style.setProperty('--color-unassigned-bg', cardBg);
      root.style.setProperty('--color-unassigned-border', borderColor);
      root.style.setProperty('--color-earnings-border', successShades[200]);
      root.style.setProperty('--color-earnings-text', successShades[600]);

      // ===========================================
      // GRADIENTS (using standardized shades)
      // ===========================================
      root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${theme.colors.primary}, ${primaryShades[600]})`);
      root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${theme.colors.secondary}, ${secondaryShades[600]})`);
      root.style.setProperty('--gradient-success', `linear-gradient(135deg, ${theme.colors.success}, ${successShades[600]})`);
      root.style.setProperty('--gradient-warning', `linear-gradient(135deg, ${warnBase}, ${warningShades[600]})`);
      root.style.setProperty('--gradient-error', `linear-gradient(135deg, ${errorBase}, ${errorShades[600]})`);
      root.style.setProperty('--gradient-sunset', `linear-gradient(135deg, ${warningShades[500]}, ${errorShades[500]})`);
      root.style.setProperty('--gradient-ocean', `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`);

      // ===========================================
      // FOCUS RING
      // ===========================================
      root.style.setProperty('--color-focus-ring', theme.colors.primary);

      console.log('🎨 Theme applied:', themeId, '(dark:', isDark, ')');
    
      // Cache critical CSS variables for iOS resume recovery
      this._cacheCSSVariables();
    } catch (e) {
      console.error('Failed to apply theme CSS variables:', e);
      this._applyFallbackColors();
    }
  },
  
  // Cache CSS variables to localStorage for iOS PWA resume recovery
  _cacheCSSVariables() {
    try {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const criticalVars = {
        '--color-bg-primary': style.getPropertyValue('--color-bg-primary').trim(),
        '--color-bg-secondary': style.getPropertyValue('--color-bg-secondary').trim(),
        '--color-bg-card': style.getPropertyValue('--color-bg-card').trim(),
        '--color-text-primary': style.getPropertyValue('--color-text-primary').trim(),
        '--color-text-secondary': style.getPropertyValue('--color-text-secondary').trim(),
        '--color-primary-500': style.getPropertyValue('--color-primary-500').trim(),
        '--color-secondary-500': style.getPropertyValue('--color-secondary-500').trim(),
        '--color-border-card': style.getPropertyValue('--color-border-card').trim(),
        '--color-success-500': style.getPropertyValue('--color-success-500').trim(),
        '--color-warning-500': style.getPropertyValue('--color-warning-500').trim(),
        '--color-error-500': style.getPropertyValue('--color-error-500').trim()
      };
      localStorage.setItem('fcc_css_variables', JSON.stringify(criticalVars));
    } catch (e) {
      console.warn('Failed to cache CSS variables:', e);
    }
  },

  // ===========================================
  // iOS PWA RECOVERY METHODS
  // ===========================================

  // Hardcoded fallback colors for when CSS variables are lost and cannot be recovered
  FALLBACK_COLORS: {
    '--color-bg-primary': '#f8fafc',
    '--color-bg-secondary': '#f1f5f9',
    '--color-bg-card': '#ffffff',
    '--color-text-primary': '#2D3748',
    '--color-text-secondary': '#718096',
    '--color-primary-500': '#4A90E2',
    '--color-secondary-500': '#7B68EE',
    '--color-border-card': '#e2e8f0',
    '--color-success-500': '#22C55E',
    '--color-warning-500': '#F59E0B',
    '--color-error-500': '#EF4444'
  },

  // In-memory theme fallback when localStorage is unavailable
  _inMemoryTheme: 'default',

  // Force refresh the current theme (for iOS PWA resume recovery)
  forceRefresh() {
    const currentTheme = this.getCurrentTheme();
    console.log('🔄 ThemeManager.forceRefresh() - re-applying theme:', currentTheme);
    this.applyTheme(currentTheme);
  },

  // Verify that CSS variables are correctly applied
  verifyThemeApplied() {
    try {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      
      // Check critical CSS variables
      const bgPrimary = style.getPropertyValue('--color-bg-primary').trim();
      const textPrimary = style.getPropertyValue('--color-text-primary').trim();
      const primary500 = style.getPropertyValue('--color-primary-500').trim();
      
      // Variables should not be empty or transparent
      const isValid = bgPrimary && bgPrimary !== '' && bgPrimary !== 'rgba(0, 0, 0, 0)' &&
                      textPrimary && textPrimary !== '' &&
                      primary500 && primary500 !== '';
      
      // Also verify against cached values if available
      if (isValid) {
        try {
          const cached = localStorage.getItem('fcc_css_variables');
          if (cached) {
            const cachedVars = JSON.parse(cached);
            // Check if at least the primary color matches
            if (cachedVars['--color-primary-500'] && cachedVars['--color-primary-500'] !== primary500) {
              console.warn('🎨 CSS variables do not match cached values');
              return false;
            }
          }
        } catch (e) {
          // Ignore cache comparison errors
        }
      }
      
      return isValid;
    } catch (e) {
      console.warn('Failed to verify theme:', e);
      return false;
    }
  },

  // Detect if CSS variables were lost (e.g., after iOS bfcache restoration)
  _detectCSSVariableLoss() {
    try {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const bgPrimary = style.getPropertyValue('--color-bg-primary').trim();
      
      // Check for signs of CSS variable loss
      return !bgPrimary || 
             bgPrimary === '' || 
             bgPrimary === 'rgba(0, 0, 0, 0)' ||
             bgPrimary === 'transparent' ||
             bgPrimary === 'rgb(0, 0, 0)';
    } catch (e) {
      console.warn('Failed to detect CSS variable loss:', e);
      return true; // Assume loss on error
    }
  },

  // Apply hardcoded fallback colors when theme recovery fails
  _applyFallbackColors() {
    console.warn('🎨 Applying fallback colors due to theme recovery failure');
    try {
      const root = document.documentElement;
      Object.entries(this.FALLBACK_COLORS).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
      console.log('🎨 Fallback colors applied successfully');
    } catch (e) {
      console.error('Failed to apply fallback colors:', e);
    }
  },

  // initialize theme on page load
  initializeTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    console.log('🎨 ThemeManager.initializeTheme() - applying theme:', savedTheme);
    this.applyTheme(savedTheme);
  },

  // get current theme (with localStorage error handling)
  getCurrentTheme() {
    try {
      return localStorage.getItem('selectedTheme') || this._inMemoryTheme || 'default';
    } catch (e) {
      console.warn('localStorage unavailable, using in-memory theme:', e);
      return this._inMemoryTheme || 'default';
    }
  },

  // save theme selection (with localStorage error handling)
  saveTheme(themeId) {
    try {
      localStorage.setItem('selectedTheme', themeId);
    } catch (e) {
      console.warn('localStorage unavailable, using in-memory theme:', e);
      this._inMemoryTheme = themeId;
    }
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
  // DISABLED: Dark mode auto-sync is disabled to prevent theme conflicts on iOS PWA resume
  // The user's explicitly selected theme should always be preserved
  handleColorSchemeChange(event) {
    // NO-OP: Dark mode sync disabled for iOS PWA stability
    console.log('🌓 Dark mode sync disabled - ignoring system color scheme change');
    return;
  },

  // Initialize dark mode sync listener
  // DISABLED: Dark mode auto-sync is disabled to prevent theme conflicts on iOS PWA resume
  initDarkModeSync() {
    // NO-OP: Dark mode sync disabled for iOS PWA stability
    console.log('🌓 Dark mode sync disabled - not registering system preference listener');
    return;
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
