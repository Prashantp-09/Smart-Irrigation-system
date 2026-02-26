# Smart Irrigation System - Web Dashboard

## Project Overview
A web-based dashboard that monitors weather conditions using live API data and provides smart irrigation recommendations.

## Features
1. **Weather Dashboard** - Display current weather data (temperature, humidity, rainfall)
2. **Irrigation Recommendation** - AI-based suggestions for watering based on weather
3. **Soil Moisture Estimation** - Estimate soil moisture based on weather conditions
4. **7-Day Forecast** - Show upcoming weather for planning irrigation schedule
5. **Auto Irrigation Control** - Manual on/off toggle for simulation

## Technical Stack
- HTML5 for structure
- CSS3 for styling (responsive design)
- JavaScript (Vanilla) for functionality
- OpenWeatherMap API for live weather data

## Files to Create
1. `index.html` - Main dashboard structure
2. `style.css` - Styling and responsive design
3. `script.js` - API integration and logic

## API Integration
- Use OpenWeatherMap free API or similar
- Fetch current weather data
- Fetch 7-day forecast data
- Calculate irrigation needs based on:
  - Temperature
  - Humidity
  - Rainfall probability
  - Recent rainfall

## Implementation Steps
1. Create project directory structure
2. Build HTML dashboard layout
3. Style with CSS (modern, clean UI)
4. Implement JavaScript for API calls
5. Add irrigation logic algorithm
6. Test and refine

## UI Components
- Current weather display (temp, humidity, wind)
- Irrigation status indicator (On/Off)
- Soil moisture gauge
- Weather-based recommendation card
- 7-day forecast grid
- Manual control panel
