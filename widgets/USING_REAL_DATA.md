# Using Real Data in Widgets

## Overview

Both the Earnings Summary and Weather widgets are currently showing **demo data**. This guide explains how to connect them to real data sources.

---

## Earnings Summary Widget

### Current Status: Demo Data (When Not Logged In)

The widget automatically switches between real and demo data based on authentication status.

### To See Real Data:

#### 1. **Log In to Your Account**
- Click on the "Account" page in navigation
- Log in with your Family Command Center credentials
- Navigate back to Dashboard

#### 2. **Add Family Members**
- Go to the "Family" page
- Add family members to your account
- Assign chores and track completions

#### 3. **View Real Earnings**
- Return to Dashboard
- The Earnings Summary widget will now show:
  - ✅ Real family member names
  - ✅ Actual earnings from completed chores
  - ✅ Real chore completion counts
  - ✅ Live data that updates with your account

### How It Works:

```javascript
// Widget checks authentication status
if (user is authenticated) {
  → Load real data from API
  → Display actual family earnings
} else {
  → Show demo data
  → Display "Login to see real data" message
}
```

### Troubleshooting:

**Widget still shows demo data after login:**
1. Check browser console for API errors
2. Verify you have family members in your account
3. Try clicking the refresh button (🔄) on the widget
4. Check that CORS is configured correctly (should be fixed now)

**API Errors:**
- Open browser DevTools (F12)
- Check Console tab for error messages
- Look for failed API calls in Network tab
- Verify you're logged in on Account page

---

## Weather Widget

### Current Status: Always Demo Data

The weather widget uses **simulated weather data** by default because it requires an external API key.

### Why Demo Data?

- Prevents exposing API keys in client-side code
- No external service dependencies
- Works immediately without configuration
- No API rate limits or costs

### Demo Data Features:

✅ **Realistic temperatures** based on location latitude  
✅ **Varied weather conditions** (sunny, cloudy, rainy, etc.)  
✅ **7-day forecast** with high/low temps  
✅ **Weather icons** from OpenWeatherMap CDN  
✅ **Location-based** temperature generation  

### To Use Real Weather Data:

If you want live weather, you have two options:

#### Option A: OpenWeatherMap API (Recommended)

**Free tier includes:**
- 1,000 API calls per day
- Current weather
- 7-day forecast
- No credit card required

**Steps:**

1. **Get API Key**
   ```
   1. Go to: https://openweathermap.org/api
   2. Sign up for free account
   3. Copy your API key from dashboard
   ```

2. **Update Widget Code**
   
   Open `frontEnd/widgets/weather-widget.js` and find the `fetchWeatherData()` method (around line 230).
   
   **Replace this:**
   ```javascript
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 500));
   
   // Generate realistic weather based on coordinates
   const temp = this.generateRealisticTemp(this.coordinates.lat);
   // ... mock data generation ...
   ```
   
   **With this:**
   ```javascript
   const apiKey = 'YOUR_API_KEY_HERE'; // ← Paste your key here
   
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
   ```

3. **Update Header Template**
   
   Remove the "(Demo Data)" label in the template:
   ```javascript
   // Find this line (around line 396-398):
   <span class="text-xs" style="color: #f59e0b; margin-left: 0.5rem;">
     (Demo Data)
   </span>
   
   // Remove or replace with:
   <span class="text-xs text-gray-600 ml-2">🔴 Live</span>
   ```

4. **Deploy Changes**
   ```powershell
   .\frontEnd\deploy-to-github-pages.ps1
   ```

5. **Test**
   - Refresh dashboard page
   - Widget should now show real weather
   - Try different locations in settings

#### Option B: Other Weather APIs

You can also use:
- **WeatherAPI.com** - 1M calls/month free
- **Weatherbit.io** - 500 calls/day free
- **Visual Crossing** - 1000 calls/day free

Just adapt the API call format in `fetchWeatherData()`.

---

## Backend Weather Proxy (Advanced)

For better security and to hide API keys, you can create a backend proxy:

### 1. Create Weather Handler

```javascript
// src/handlers/weatherHandler.js
exports.handler = async (event) => {
  const { lat, lon, units } = event.queryStringParameters;
  const apiKey = process.env.OPENWEATHER_API_KEY; // Store in env
  
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
  );
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(await response.json())
  };
};
```

### 2. Add to serverless.yml

```yaml
weatherApi:
  handler: src/handlers/weatherHandler.handler
  environment:
    OPENWEATHER_API_KEY: ${env:OPENWEATHER_API_KEY}
  events:
    - httpApi:
        path: /weather/current
        method: get
```

### 3. Update Widget to Use Proxy

```javascript
// In weather-widget.js:
const currentUrl = `${CONFIG.apiUrl}/weather/current?lat=${this.coordinates.lat}&lon=${this.coordinates.lon}&units=${this.units}`;
```

**Benefits:**
- ✅ API key stays secret
- ✅ Can add caching to reduce API calls
- ✅ Can implement rate limiting
- ✅ More control over data format

---

## Testing Checklist

### Earnings Widget:
- [ ] Shows demo data when not logged in
- [ ] Shows "Login to see real data" link
- [ ] Switches to real data after login
- [ ] Displays actual family members
- [ ] Shows correct earnings amounts
- [ ] Refresh button updates data
- [ ] No console errors

### Weather Widget:
- [ ] Shows demo data by default
- [ ] Location detection works (if enabled)
- [ ] Temperature units toggle works
- [ ] 7-day forecast displays correctly
- [ ] Responsive on mobile/tablet
- [ ] After API integration:
  - [ ] Real weather data loads
  - [ ] Forecast is accurate
  - [ ] Icons match conditions
  - [ ] Geolocation works

---

## Summary

| Widget | Default State | Real Data Setup |
|--------|---------------|-----------------|
| **Earnings Summary** | Demo (if not logged in) | ✅ Just log in! |
| **Weather** | Always demo | Requires API key setup |

**Next Steps:**
1. Deploy your changes: `.\frontEnd\deploy-to-github-pages.ps1`
2. Test earnings widget by logging in
3. (Optional) Set up weather API for live weather data

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoints are working
3. Check authentication status
4. Review CORS configuration
5. Test API calls independently

For weather API issues, consult:
- OpenWeatherMap docs: https://openweathermap.org/api
- Widget code comments in `weather-widget.js`
- Example implementations in `WEATHER_WIDGET_README.md`

