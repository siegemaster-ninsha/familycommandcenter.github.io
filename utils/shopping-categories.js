// Shopping Categories Utility
// Single source of truth for shopping categories and their colors
// Used by shopping-page.js and recipe-page.js

/**
 * Shopping category color schemes
 * All backgrounds use 600 shade for consistent white text contrast (WCAG AA ~4.5:1)
 */
const CATEGORY_COLOR_SCHEMES = {
  'Produce': {
    background: '#16a34a', // green-600
    border: '#15803d',     // green-700
    accent: '#166534'      // green-800
  },
  'Dairy': {
    background: '#2563eb', // blue-600
    border: '#1d4ed8',     // blue-700
    accent: '#1e40af'      // blue-800
  },
  'Meat': {
    background: '#dc2626', // red-600
    border: '#b91c1c',     // red-700
    accent: '#991b1b'      // red-800
  },
  'Bakery': {
    background: '#d97706', // amber-600
    border: '#b45309',     // amber-700
    accent: '#92400e'      // amber-800
  },
  'Frozen': {
    background: '#7c3aed', // violet-600
    border: '#6d28d9',     // violet-700
    accent: '#5b21b6'      // violet-800
  },
  'Pantry': {
    background: '#a16207', // yellow-700 (better contrast)
    border: '#854d0e',     // yellow-800
    accent: '#713f12'      // yellow-900
  },
  'Household': {
    background: '#4b5563', // gray-600
    border: '#374151',     // gray-700
    accent: '#1f2937'      // gray-800
  },
  'Personal Care': {
    background: '#db2777', // pink-600
    border: '#be185d',     // pink-700
    accent: '#9d174d'      // pink-800
  },
  'General': {
    background: 'var(--color-primary-600)',
    border: 'var(--color-primary-700)',
    accent: 'var(--color-primary-800, #1f2937)'
  }
};

/**
 * Default category list in display order
 */
const DEFAULT_CATEGORIES = [
  'General',
  'Dairy', 
  'Bakery',
  'Produce',
  'Meat',
  'Frozen',
  'Pantry',
  'Household',
  'Personal Care'
];

/**
 * Get colors for a category
 * @param {string} category - Category name
 * @returns {Object} Color scheme with background, border, accent
 */
function getCategoryColors(category) {
  return CATEGORY_COLOR_SCHEMES[category] || CATEGORY_COLOR_SCHEMES['General'];
}

/**
 * Get all available categories
 * @returns {string[]} Array of category names
 */
function getCategories() {
  return [...DEFAULT_CATEGORIES];
}

/**
 * Get all category color schemes
 * @returns {Object} Map of category names to color schemes
 */
function getAllCategoryColors() {
  return { ...CATEGORY_COLOR_SCHEMES };
}

/**
 * Check if a category exists
 * @param {string} category - Category name to check
 * @returns {boolean} True if category exists
 */
function isValidCategory(category) {
  return category in CATEGORY_COLOR_SCHEMES;
}

/**
 * Get badge style object for a category (for Vue :style binding)
 * @param {string} category - Category name
 * @returns {Object} Style object with backgroundColor and color
 */
function getCategoryBadgeStyle(category) {
  const colors = getCategoryColors(category);
  return {
    backgroundColor: colors.background,
    color: 'white'
  };
}

// Export for use in components
if (typeof window !== 'undefined') {
  window.ShoppingCategories = {
    getCategoryColors,
    getCategories,
    getAllCategoryColors,
    isValidCategory,
    getCategoryBadgeStyle,
    CATEGORY_COLOR_SCHEMES,
    DEFAULT_CATEGORIES
  };
}
