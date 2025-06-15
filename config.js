// Family Command Center - Frontend Configuration
// This file is safe to be public as it only contains client-side configuration

const CONFIG = {
  // API Configuration
  // Replace these URLs with your actual API Gateway endpoints after deployment
  API: {
    BASE_URL: 'https://ogfq4bq65c.execute-api.us-east-1.amazonaws.com',
    
    // API Endpoints
    ENDPOINTS: {
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
      STORES: '/stores'
    }
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
  }
};

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