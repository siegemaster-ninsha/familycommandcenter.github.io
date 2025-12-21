/**
 * Weather API Configuration
 * 
 * Now uses BACKEND PROXY - no client-side API key needed!
 * The API key is securely stored on the backend.
 */

window.WEATHER_CONFIG = {
  // Use backend proxy (API key stays secret on server)
  useBackendProxy: true,
  
  // Backend API will be auto-detected from CONFIG.apiUrl
  // No need to configure API keys here!
  
  // Default settings
  defaultUnits: 'imperial', // 'imperial' or 'metric'
  
  // Fallback location if geolocation fails
  defaultLocation: {
    lat: 28.8036,
    lon: -81.7256,
    name: 'Tavares, FL'
  },
  
  // Enable/disable mock data mode
  // Set to false to use real weather from backend
  useMockData: false,
  
  // Cache settings
  cacheDuration: 1800000, // 30 minutes in milliseconds
  
  // Rate limiting
  minRefreshInterval: 600000 // 10 minutes minimum between refreshes
};

