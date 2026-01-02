import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['**/*.test.js', '**/__tests__/**/*.js'],
    
    // Exclude node_modules and other non-test directories
    exclude: ['node_modules/**', 'frontEnd/**', '.serverless/**', 'src/**'],
    
    // Use jsdom for browser-like environment
    environment: 'jsdom',
    
    // Globals (describe, it, expect available without imports)
    globals: true,
    
    // Reporter
    reporters: ['verbose'],
    
    // Timeout for each test (ms)
    testTimeout: 10000,
    
    // Setup files to run before tests
    setupFiles: ['./test/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.test.js',
        '**/test/**',
        'frontEnd/**',
        '.serverless/**',
        'src/**'
      ]
    }
  }
});
