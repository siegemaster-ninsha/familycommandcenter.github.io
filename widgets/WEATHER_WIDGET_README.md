# Weather Widget Documentation

## Overview

The Weather Widget displays current weather conditions and a 7-day forecast for a specified location. It supports automatic location detection via browser geolocation or manual location entry.

## Features

✅ **Current Weather Display**
- Temperature (current and feels-like)
- Weather conditions with icon
- Humidity percentage
- Wind speed and direction

✅ **7-Day Forecast**
- Daily high/low temperatures
- Weather icons
- Hover for detailed conditions

✅ **Configuration Options**
- Manual location entry or auto-detection
- Temperature units (Fahrenheit/Celsius)
- Toggle forecast display
- Toggle weather details
- Adjustable refresh interval (10-120 minutes)

✅ **Responsive Design**
- Full 7-day forecast on desktop
- 4-day forecast on tablet
- 3-day forecast on mobile

## Current Implementation

**The widget currently uses mock/simulated data** with realistic temperature generation based on latitude. This allows the widget to work immediately without requiring API keys or external dependencies.

### Mock Data Features:
- Generates realistic temperatures based on location latitude
- Randomizes weather conditions
- Creates believable 7-day forecasts
- Uses official OpenWeatherMap icon URLs
- Demonstrates all widget functionality

## Integrating Real Weather API

To connect to a real weather service (OpenWeatherMap), follow these steps:

### 1. Get an API Key

Sign up for a free OpenWeatherMap API key:
- Go to: https://openweathermap.org/api
- Sign up for a free account
- Navigate to API Keys section
- Copy your API key

### 2. Update the Widget Code

In `frontEnd/widgets/weather-widget.js`, find the `fetchWeatherData()` method and uncomment the production code block (lines ~330-370):

```javascript
async fetchWeatherData() {
  // Comment out or remove the mock data section
  /*
  await new Promise(resolve => setTimeout(resolve, 500));
  const temp = this.generateRealisticTemp(this.coordinates.lat);
  // ... rest of mock code
  */
  
  // Uncomment and use this production code:
  const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your actual API key
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
}
```

### 3. Improve Geocoding (Optional)

To support more cities, replace the mock geocoding in the `geocodeLocation()` method with OpenWeatherMap's Geocoding API:

```javascript
async geocodeLocation(location) {
  const apiKey = 'YOUR_API_KEY_HERE';
  const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
  
  const response = await fetch(geocodeUrl);
  const data = await response.json();
  
  if (data.length > 0) {
    this.coordinates = {
      lat: data[0].lat,
      lon: data[0].lon
    };
    this.locationName = `${data[0].name}, ${data[0].country}`;
    this.locationError = null;
  } else {
    throw new Error('Location not found');
  }
}
```

## Configuration Options

### Location
- **Type:** Text input
- **Default:** `"auto"`
- **Options:**
  - `"auto"` - Use device location (requires permission)
  - City name - e.g., `"Seattle, WA"` or `"New York"`
  - Currently supports: Seattle, New York, Los Angeles, Chicago, San Francisco, Miami, Boston, Denver

### Temperature Units
- **Type:** Select dropdown
- **Default:** `"imperial"` (Fahrenheit)
- **Options:**
  - Imperial (°F)
  - Metric (°C)

### Show 7-Day Forecast
- **Type:** Boolean toggle
- **Default:** `true`
- **Description:** Show/hide the forecast section

### Show Weather Details
- **Type:** Boolean toggle
- **Default:** `true`
- **Description:** Show/hide humidity and wind information

### Refresh Interval
- **Type:** Number input
- **Default:** `30` minutes
- **Range:** 10-120 minutes
- **Description:** How often to automatically refresh weather data

## Widget Size Recommendations

### Recommended Size: 4x3
- **Width:** 4 columns
- **Height:** 3 rows
- Displays current weather + full 7-day forecast comfortably

### Minimum Size: 3x2
- **Width:** 3 columns
- **Height:** 2 rows
- Compact view, may truncate forecast

### Maximum Size: 6x4
- **Width:** 6 columns  
- **Height:** 4 rows
- Spacious layout with all details visible

## Browser Permissions

### Geolocation Permission
If using `"auto"` location, the widget will request browser geolocation permission on first load. 

**Permission States:**
- ✅ **Granted:** Widget uses device location
- ❌ **Denied:** Widget falls back to default location (Seattle, WA)
- ⏸️ **Prompt:** User will see browser permission dialog

**Fallback Behavior:**
If geolocation fails or is denied, the widget automatically uses a default location and displays a notice.

## Error Handling

The widget gracefully handles various error scenarios:

1. **No Geolocation Support**
   - Falls back to default location (Seattle)
   - Shows warning message

2. **Location Not Found**
   - Uses default coordinates
   - Displays error notice

3. **API Failure** (when using real API)
   - Switches to mock data mode
   - Shows "(Demo Data)" label
   - Allows continued testing

4. **Network Issues**
   - Uses cached data if available
   - Shows appropriate error message
   - Retry button provided

## Styling

The weather widget uses custom CSS classes for styling:

### Main Classes
- `.weather-widget` - Container
- `.weather-content` - Main content area
- `.current-weather` - Current conditions section
- `.forecast` - 7-day forecast section

### Responsive Breakpoints
- **Desktop (>768px):** 7 forecast days
- **Tablet (768px):** 4 forecast days
- **Mobile (<480px):** 3 forecast days

### Color Scheme
The widget uses CSS custom properties from the app's theme:
- Background gradient using `--color-primary-50` and `--color-primary-100`
- Text colors from `--color-text-primary` and `--color-text-secondary`
- Borders from `--color-border-card`

## Usage in Dashboard

### Add Weather Widget
1. Navigate to Dashboard page
2. Click "Add Widget" button
3. Select "Weather" from widget picker
4. Widget appears with default settings

### Configure Widget
1. Click the ⚙️ (configure) button on the widget
2. Adjust settings:
   - Enter location or use "auto"
   - Choose temperature units
   - Toggle forecast/details display
   - Set refresh interval
3. Click "Save"
4. Widget refreshes with new settings

### Remove Widget
1. Enter edit mode by clicking "Customize Dashboard"
2. Click the ❌ (remove) button on the widget
3. Confirm removal

## API Reference

### Widget Metadata
```javascript
{
  id: 'weather',
  name: 'Weather',
  description: 'Current weather and 7-day forecast',
  icon: '🌤️',
  category: 'information',
  version: '1.0.0',
  permissions: {
    requiresAuth: false,
    requiresLocation: true,
    roles: ['parent', 'child']
  }
}
```

### Default Configuration
```javascript
{
  location: 'auto',
  units: 'imperial',
  showForecast: true,
  showDetails: true,
  refreshInterval: 30
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Extended Forecast**
   - 10-day or 14-day forecast option
   - Hourly forecast view

2. **Advanced Features**
   - Weather alerts/warnings
   - Sunrise/sunset times
   - UV index and air quality
   - Precipitation radar

3. **Multiple Locations**
   - Save favorite locations
   - Quick-switch between locations
   - Compare multiple cities

4. **Visualizations**
   - Temperature graph
   - Precipitation chart
   - Wind rose diagram

5. **Smart Features**
   - Outfit suggestions based on weather
   - Activity recommendations
   - Weather-based chore scheduling

## Troubleshooting

### Widget Shows "Loading..." Forever
- Check browser console for errors
- Verify geolocation permission granted
- Ensure widget file loaded correctly
- Try hard refresh (Ctrl+Shift+R)

### Wrong Location Displayed
- Clear browser cache
- Reset geolocation permissions
- Manually enter location in settings
- Check location string spelling

### Icons Not Displaying
- Verify internet connection (icons load from OpenWeatherMap CDN)
- Check browser console for 404 errors
- Ensure icon codes are valid

### Temperature Units Wrong
- Check widget configuration settings
- Verify `units` setting is correct
- Refresh widget after changing settings

## Support

For issues or feature requests:
1. Check browser console for error messages
2. Verify widget registry shows weather widget
3. Test with mock data first before real API
4. Review CORS settings if using external API

## License

Part of the Family Command Center application.

