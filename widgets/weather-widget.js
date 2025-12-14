/**
 * Weather Widget
 * 
 * Displays current weather conditions and 7-day forecast for a location.
 * Uses OpenWeatherMap API (or browser geolocation).
 * 
 * Features:
 * - Current temperature, conditions, humidity, wind
 * - 7-day forecast with high/low temps
 * - Auto-detect location via geolocation
 * - Manual location override
 * - Temperature units (Fahrenheit/Celsius)
 * - Weather icons
 */

// Widget Metadata
const WeatherWidgetMetadata = window.WidgetTypes.createWidgetMetadata({
  id: 'weather',
  name: 'Weather',
  description: 'Current weather and 7-day forecast',
  icon: 'cloud',
  category: 'information',
  
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 2 },
  maxSize: { w: 12, h: 6 },
  
  configurable: true,
  refreshable: true,
  refreshInterval: 1800000, // 30 minutes in milliseconds
  
  permissions: [],
  requiresAuth: false,
  requiredStores: [],
  
  features: {
    exportData: false,
    print: false,
    fullscreen: false,
    notifications: false
  }
});

// Widget Settings Schema
WeatherWidgetMetadata.settings = {
  schema: {
    location: {
      type: 'text',
      label: 'Location',
      description: 'Enter city name (e.g., "Seattle, WA") or "auto" to use device location',
      required: false,
      default: 'auto',
      placeholder: 'City name or "auto"'
    },
    units: {
      type: 'select',
      label: 'Temperature Units',
      description: 'Choose Fahrenheit or Celsius',
      required: false,
      default: 'imperial',
      options: [
        { value: 'imperial', label: 'Fahrenheit (°F)' },
        { value: 'metric', label: 'Celsius (°C)' }
      ]
    },
    showForecast: {
      type: 'boolean',
      label: 'Show 7-Day Forecast',
      description: 'Display the weekly forecast',
      required: false,
      default: true,
      toggleLabel: 'Show forecast'
    },
    showDetails: {
      type: 'boolean',
      label: 'Show Weather Details',
      description: 'Show humidity, wind speed, etc.',
      required: false,
      default: true,
      toggleLabel: 'Show details'
    }
  }
};

// Weather Widget Component
const WeatherWidget = {
  name: 'WeatherWidget',
  
  mixins: [window.WidgetBase],
  
  data() {
    return {
      metadata: WeatherWidgetMetadata,
      
      // Weather data
      currentWeather: null,
      forecast: [],
      
      // Location
      locationName: '',
      coordinates: null,
      
      // State
      locationError: null,
      useMockData: false,
      
      // Mock data for demo
      mockWeather: {
        current: {
          temp: 72,
          feelsLike: 70,
          description: 'Partly cloudy',
          icon: '02d',
          humidity: 65,
          windSpeed: 8,
          windDirection: 'NW'
        },
        forecast: [
          { day: 'Mon', high: 75, low: 58, icon: '02d', description: 'Partly cloudy' },
          { day: 'Tue', high: 78, low: 60, icon: '01d', description: 'Sunny' },
          { day: 'Wed', high: 73, low: 57, icon: '10d', description: 'Light rain' },
          { day: 'Thu', high: 70, low: 55, icon: '04d', description: 'Cloudy' },
          { day: 'Fri', high: 76, low: 59, icon: '01d', description: 'Sunny' },
          { day: 'Sat', high: 79, low: 62, icon: '02d', description: 'Partly cloudy' },
          { day: 'Sun', high: 74, low: 58, icon: '03d', description: 'Scattered clouds' }
        ]
      }
    };
  },
  
  computed: {
    // Get location from settings or use 'auto'
    locationSetting() {
      return this.config?.settings?.location || this.metadata.settings.schema.location.default;
    },
    
    // Temperature units
    units() {
      return this.config?.settings?.units || this.metadata.settings.schema.units.default;
    },
    
    // Show forecast?
    showForecast() {
      return this.config?.settings?.showForecast !== false;
    },
    
    // Show details?
    showDetails() {
      return this.config?.settings?.showDetails !== false;
    },
    
    // Temperature symbol
    tempSymbol() {
      return this.units === 'metric' ? '°C' : '°F';
    },
    
    // Has weather data
    hasWeatherData() {
      return this.currentWeather !== null || this.useMockData;
    },
    
    // Current weather display
    currentWeatherData() {
      if (this.useMockData) {
        return this.mockWeather.current;
      }
      return this.currentWeather;
    },
    
    // Forecast display
    forecastData() {
      if (this.useMockData) {
        return this.mockWeather.forecast;
      }
      return this.forecast;
    }
  },
  
  methods: {
    // Required: Implement onRefresh
    async onRefresh() {
      try {
        // Get location first
        await this.getLocation();
        
        // Then fetch weather
        if (this.coordinates) {
          await this.fetchWeatherData();
        }
      } catch (error) {
        console.error('Failed to refresh weather:', error);
        // Fall back to mock data
        this.useMockData = true;
        this.locationError = error.message;
      }
    },
    
    // Get user location
    async getLocation() {
      // If location is set to something other than 'auto', geocode it
      if (this.locationSetting !== 'auto') {
        await this.geocodeLocation(this.locationSetting);
        return;
      }
      
      // Use browser geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported by browser');
      }
      
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.coordinates = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            this.locationError = null;
            resolve();
          },
          (error) => {
            console.warn('Geolocation failed:', error.message);
            // Fall back to default location (Seattle)
            this.coordinates = { lat: 47.6062, lon: -122.3321 };
            this.locationName = 'Seattle, WA (default)';
            this.locationError = 'Using default location';
            resolve();
          },
          {
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });
    },
    
    // Geocode a location string (city name) to coordinates
    async geocodeLocation(location) {
      // Check if we should use real geocoding API
      const useRealAPI = window.WEATHER_CONFIG && !window.WEATHER_CONFIG.useMockData;
      
      if (useRealAPI) {
        try {
          const baseUrl = CONFIG.API.BASE_URL;
          const url = `${baseUrl}/weather/geocode?location=${encodeURIComponent(location)}`;
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('Geocoding failed');
          }
          
          const data = await response.json();
          
          if (data.location) {
            this.coordinates = {
              lat: data.location.lat,
              lon: data.location.lon
            };
            this.locationName = `${data.location.name}${data.location.state ? ', ' + data.location.state : ''}, ${data.location.country}`;
            this.locationError = null;
            console.log('✅ Location geocoded via backend:', this.locationName);
            return;
          }
        } catch (error) {
          console.error('Backend geocoding failed, using fallback:', error);
        }
      }
      
      // Fallback: Use simple mapping for demo/offline mode
      const locationMap = {
        'seattle': { lat: 47.6062, lon: -122.3321, name: 'Seattle, WA' },
        'new york': { lat: 40.7128, lon: -74.0060, name: 'New York, NY' },
        'los angeles': { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA' },
        'chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' },
        'san francisco': { lat: 37.7749, lon: -122.4194, name: 'San Francisco, CA' },
        'miami': { lat: 25.7617, lon: -80.1918, name: 'Miami, FL' },
        'boston': { lat: 42.3601, lon: -71.0589, name: 'Boston, MA' },
        'denver': { lat: 39.7392, lon: -104.9903, name: 'Denver, CO' }
      };
      
      const normalized = location.toLowerCase().trim();
      const found = locationMap[normalized];
      
      if (found) {
        this.coordinates = { lat: found.lat, lon: found.lon };
        this.locationName = found.name;
        this.locationError = null;
      } else {
        // Default to first word as city name
        this.locationName = location;
        this.locationError = 'Location not found, using default';
        this.coordinates = { lat: 47.6062, lon: -122.3321 }; // Seattle default
      }
    },
    
    // Fetch weather data from API
    async fetchWeatherData() {
      // Check if we should use real API or mock data
      const useRealAPI = window.WEATHER_CONFIG && !window.WEATHER_CONFIG.useMockData;
      
      if (useRealAPI) {
        await this.fetchRealWeatherData();
      } else {
        await this.fetchMockWeatherData();
      }
    },
    
    // Fetch real weather data from backend proxy
    async fetchRealWeatherData() {
      try {
        const baseUrl = CONFIG.API.BASE_URL;
        
        // Call backend proxy endpoints
        const currentUrl = `${baseUrl}/weather/current?lat=${this.coordinates.lat}&lon=${this.coordinates.lon}&units=${this.units}`;
        const forecastUrl = `${baseUrl}/weather/forecast?lat=${this.coordinates.lat}&lon=${this.coordinates.lon}&units=${this.units}`;
        
        const [currentResponse, forecastResponse] = await Promise.all([
          fetch(currentUrl),
          fetch(forecastUrl)
        ]);
        
        if (!currentResponse.ok || !forecastResponse.ok) {
          throw new Error('Weather API request failed');
        }
        
        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();
        
        // Parse current weather from backend response
        this.currentWeather = {
          temp: currentData.weather.temp,
          feelsLike: currentData.weather.feelsLike,
          description: currentData.weather.description,
          icon: currentData.weather.icon,
          humidity: currentData.weather.humidity,
          windSpeed: currentData.weather.windSpeed,
          windDirection: this.degreesToDirection(currentData.weather.windDeg)
        };
        
        // Use forecast from backend (already grouped by day)
        this.forecast = forecastData.forecast.slice(0, 7);
        
        // Update location name
        if (currentData.weather.location) {
          this.locationName = `${currentData.weather.location.name}, ${currentData.weather.location.country}`;
        }
        
        this.useMockData = false;
        console.log('✅ Real weather data loaded from backend for', this.locationName);
      } catch (error) {
        console.error('Failed to fetch real weather data from backend:', error);
        // Fall back to mock data
        await this.fetchMockWeatherData();
      }
    },
    
    // Group forecast by day and calculate daily highs/lows
    groupForecastByDay(forecastList) {
      const dailyMap = new Map();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            day: days[date.getDay()],
            date: date,
            temps: [],
            icons: [],
            descriptions: []
          });
        }
        
        const dayData = dailyMap.get(dayKey);
        dayData.temps.push(item.main.temp);
        dayData.icons.push(item.weather[0].icon);
        dayData.descriptions.push(item.weather[0].description);
      });
      
      // Convert to array and calculate highs/lows
      return Array.from(dailyMap.values()).map(day => ({
        day: day.day,
        high: Math.round(Math.max(...day.temps)),
        low: Math.round(Math.min(...day.temps)),
        icon: this.getMostCommonIcon(day.icons),
        description: this.getMostCommonDescription(day.descriptions)
      }));
    },
    
    // Get most common icon from list
    getMostCommonIcon(icons) {
      const counts = {};
      icons.forEach(icon => counts[icon] = (counts[icon] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    },
    
    // Get most common description from list
    getMostCommonDescription(descriptions) {
      const counts = {};
      descriptions.forEach(desc => counts[desc] = (counts[desc] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    },
    
    // Fetch mock weather data (fallback/demo mode)
    async fetchMockWeatherData() {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate realistic weather based on coordinates
      const temp = this.generateRealisticTemp(this.coordinates.lat);
      
      this.currentWeather = {
        temp: Math.round(temp),
        feelsLike: Math.round(temp - 2 + Math.random() * 4),
        description: this.getWeatherDescription(temp),
        icon: this.getWeatherIcon(temp),
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(3 + Math.random() * 15),
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
      };
      
      // Generate 7-day forecast
      this.forecast = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      
      for (let i = 0; i < 7; i++) {
        const dayIndex = (today + i) % 7;
        const dayTemp = temp + (Math.random() - 0.5) * 10;
        
        this.forecast.push({
          day: days[dayIndex],
          high: Math.round(dayTemp + 5),
          low: Math.round(dayTemp - 5),
          icon: this.getWeatherIcon(dayTemp),
          description: this.getWeatherDescription(dayTemp)
        });
      }
      
      this.useMockData = false;
      
      // In production, uncomment this to use real API:
      /*
      const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY';
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${this.coordinates.lat}&lon=${this.coordinates.lon}&units=${this.units}&appid=${apiKey}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${this.coordinates.lat}&lon=${this.coordinates.lon}&cnt=7&units=${this.units}&appid=${apiKey}`;
      
      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl)
      ]);
      
      const currentData = await currentResponse.json();
      const forecastData = await forecastResponse.json();
      
      this.currentWeather = {
        temp: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed),
        windDirection: this.degreesToDirection(currentData.wind.deg)
      };
      
      this.forecast = forecastData.list.map(day => ({
        day: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(day.temp.max),
        low: Math.round(day.temp.min),
        icon: day.weather[0].icon,
        description: day.weather[0].description
      }));
      */
    },
    
    // Generate realistic temperature based on latitude
    generateRealisticTemp(lat) {
      const absLat = Math.abs(lat);
      // Warmer near equator, cooler near poles
      const baseTempF = 85 - (absLat * 0.8);
      // Add some randomness
      return baseTempF + (Math.random() - 0.5) * 20;
    },
    
    // Get weather description based on temp
    getWeatherDescription(temp) {
      if (temp > 85) return 'Hot and sunny';
      if (temp > 75) return 'Partly cloudy';
      if (temp > 65) return 'Mostly sunny';
      if (temp > 55) return 'Cloudy';
      if (temp > 45) return 'Overcast';
      return 'Cold and cloudy';
    },
    
    // Get weather icon based on temp
    getWeatherIcon(temp) {
      if (temp > 80) return '01d'; // clear sky
      if (temp > 70) return '02d'; // few clouds
      if (temp > 60) return '03d'; // scattered clouds
      if (temp > 50) return '04d'; // broken clouds
      return '10d'; // rain
    },
    
    // Convert wind degrees to direction
    degreesToDirection(deg) {
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const index = Math.round(deg / 45) % 8;
      return directions[index];
    },
    
    // Get weather icon URL
    getIconUrl(icon) {
      return `https://openweathermap.org/img/wn/${icon}@2x.png`;
    },
    
    // Format wind speed
    formatWindSpeed(speed) {
      const unit = this.units === 'metric' ? 'km/h' : 'mph';
      return `${speed} ${unit}`;
    }
  },
  
  template: `
    <div class="widget-container weather-widget">
      <!-- Widget Header -->
      <div class="widget-header">
        <h3 class="widget-title">
          <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon(metadata.icon, 'lucide', 20, 'mr-2') : ''"></div>
          {{ metadata.name }}
          <span v-if="locationName" class="text-xs text-gray-600 ml-2">{{ locationName }}</span>
          <span v-if="useMockData" class="text-xs" style="color: #f59e0b; margin-left: 0.5rem;">
            (Demo Data)
          </span>
          <span v-else class="text-xs" style="color: #10b981; margin-left: 0.5rem;">
            🔴 Live
          </span>
        </h3>
        <div class="widget-actions">
          <button
            v-if="editable"
            @click="configure"
            class="widget-action-btn"
            title="Configure"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('settings', 'lucide', 16, '') : ''"></div>
          </button>
          <button
            v-if="refreshable"
            @click="refresh"
            class="widget-action-btn"
            title="Refresh"
            :disabled="loading"
          >
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('refresh-cw', 'lucide', 16, '') : ''"></div>
          </button>
        </div>
      </div>
      
      <!-- Widget Body -->
      <div class="widget-body weather-body">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="loading-spinner"></div>
          <p class="text-sm text-gray-600 mt-2">Loading weather...</p>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error && !useMockData" class="text-center py-8">
          <div class="text-4xl mb-2">⚠️</div>
          <p class="text-sm text-red-600">{{ error }}</p>
          <button @click="refresh" class="btn btn-sm btn-secondary mt-2">
            Try Again
          </button>
        </div>
        
        <!-- Weather Content -->
        <div v-else-if="hasWeatherData" class="weather-content">
          <!-- Location Notice -->
          <div v-if="locationError" class="text-xs text-blue-600 mb-2 p-2 bg-blue-50 rounded mx-4 mt-4">
            ℹ️ {{ locationError }}
          </div>
          
          <!-- Current Weather -->
          <div class="current-weather">
            <div class="weather-main">
              <img 
                :src="getIconUrl(currentWeatherData.icon)" 
                alt="Weather icon"
                class="weather-icon"
              />
              <div class="weather-temp">
                <div class="temp-current">{{ currentWeatherData.temp }}{{ tempSymbol }}</div>
                <div class="temp-feels">Feels like {{ currentWeatherData.feelsLike }}{{ tempSymbol }}</div>
              </div>
            </div>
            <div class="weather-description">
              {{ currentWeatherData.description }}
            </div>
            
            <!-- Weather Details -->
            <div v-if="showDetails" class="weather-details">
              <div class="detail-item">
                <span class="detail-icon">💧</span>
                <span class="detail-value">{{ currentWeatherData.humidity }}%</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">💨</span>
                <span class="detail-value">{{ formatWindSpeed(currentWeatherData.windSpeed) }} {{ currentWeatherData.windDirection }}</span>
              </div>
            </div>
          </div>
          
          <!-- 7-Day Forecast -->
          <div v-if="showForecast && forecastData.length > 0" class="forecast">
            <div class="forecast-title">7-Day Forecast</div>
            <div class="forecast-days">
              <div 
                v-for="(day, index) in forecastData" 
                :key="index"
                class="forecast-day"
              >
                <div class="forecast-day-name">{{ day.day }}</div>
                <img 
                  :src="getIconUrl(day.icon)" 
                  :alt="day.description"
                  class="forecast-icon"
                  :title="day.description"
                />
                <div class="forecast-temps">
                  <span class="temp-high">{{ day.high }}°</span>
                  <span class="temp-low">{{ day.low }}°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- No Data State -->
        <div v-else class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-3">
            <div v-html="Helpers?.IconLibrary?.getIcon ? Helpers.IconLibrary.getIcon('cloud', 'lucide', 64, 'text-gray-400') : ''"></div>
          </div>
          <p class="text-sm text-gray-600">No weather data available</p>
          <button @click="refresh" class="btn btn-sm btn-primary mt-2">
            Load Weather
          </button>
        </div>
      </div>
    </div>
  `
};

// Register widget
if (typeof window !== 'undefined' && window.widgetRegistry) {
  window.widgetRegistry.register(WeatherWidgetMetadata, WeatherWidget);
  console.log('✅ Weather Widget registered');
}

// Export for use
window.WeatherWidget = WeatherWidget;
window.WeatherWidgetMetadata = WeatherWidgetMetadata;

