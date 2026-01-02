/**
 * Test Setup File
 * Configures the test environment with necessary globals and mocks
 */

import { vi } from 'vitest';

// Mock CONFIG global
global.CONFIG = {
  API: {
    BASE_URL: 'https://api.example.com',
    STAGE: 'dev',
    ENDPOINTS: {
      AUTH_ME: '/auth/me',
      CHORES: '/chores',
      FAMILY_MEMBERS: '/family-members',
      CREATE_CHILD: '/family-members/create-child',
      SPENDING_REQUESTS: '/spending-requests',
      ELECTRONICS_STATUS: '/electronics-status',
      EARNINGS: '/earnings',
      QUICKLIST: '/quicklist'
    }
  },
  ENV: {
    IS_DEVELOPMENT: false
  },
  getApiUrl: (endpoint) => `https://api.example.com/dev${endpoint}`
};

// Mock window object properties
global.window = {
  ...global.window,
  authService: null,
  useAuthStore: null,
  useUIStore: null,
  vueApp: null
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset window mocks
  global.window.authService = null;
  global.window.useAuthStore = null;
  global.window.useUIStore = null;
  global.window.vueApp = null;
});
