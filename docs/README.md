# DriMon Web Application Documentation

## Overview

The DriMon web application is a sophisticated, responsive dashboard for visualizing greenhouse sensor data, developed by Fredrik Rødland. Built with vanilla JavaScript and Chart.js, it provides real-time and historical data visualization with multi-language support, theming, and adaptive layouts.

## Project Structure

### Core Files

- **`index.html`** - Main HTML entry point with script loading order
- **`css/`** - Stylesheets organized by component
- **`js/`** - JavaScript modules following component-based architecture
- **`img/`** - Icons and favicon assets
- **`logos/`** - DriMon branding assets
- **`weather-icons/`** - YR.no weather condition icons

### JavaScript Architecture

The application follows a modular architecture with 34 JavaScript files:

#### Core System Files
- **`app.js`** - Main application initialization and URL parameter handling
- **`constants.js`** - Central configuration (ThingSpeak channels, coordinates)
- **`utils.js`** - Utility functions (formatting, URL params, dashboard detection)

#### Data Management
- **`data-components.js`** - Data processing and transformation
- **`data-handler.js`** - ThingSpeak API integration and data fetching
- **`data-request-manager.js`** - Request queuing and rate limiting
- **`resource-pool.js`** - Memory management for large datasets

#### Visualization & Charts
- **`chart-config.js`** - Chart configuration and series definitions
- **`chart-layout.js`** - Responsive chart layout management  
- **`chart-renderer.js`** - Chart.js integration and rendering
- **`stats-controller.js`** - Statistical calculations and markers

#### User Interface & Layout
- **`header-components.js`** - Header element generation
- **`header-config.js`** - Header configuration and setup
- **`header-controller.js`** - Header UI management
- **`layout-controller.js`** - Responsive layout handling
- **`theme-controller.js`** - Light/dark mode switching

#### Interactive Elements
- **`chip-config.js`** - UI chip component configuration
- **`chip-handler.js`** - UI chip interaction handling
- **`pull-to-refresh.js`** - Mobile gesture support
- **`tooltip-controller.js`** - Interactive tooltip system
- **`temp-tooltip-updater.js`** - Temperature-specific tooltip updates
- **`light-tooltip-updater.js`** - Light sensor tooltip updates

#### Internationalization
- **`i18n.js`** - Translation system core
- **`i18n-controller.js`** - Translation initialization
- **`i18n-init.js`** - Translation system initialization
- **`language-switcher.js`** - Language selection UI
- **`translations-loader.js`** - Dynamic translation loading

#### Date & Time Management
- **`date-controller.js`** - Date range management
- **`date-utils.js`** - Date utility functions

#### External Integrations
- **`cors-utils.js`** - CORS proxy utilities for external APIs
- **`forecast.js`** - Weather forecast visualization
- **`weather.js`** - YR.no weather API integration

#### Specialized Features
- **`manifest-handler.js`** - PWA manifest management
- **`planet-positions.js`** - Astronomical event tracking
- **`sun-events.js`** - Sunrise/sunset calculations

## URL Parameters

The application supports several URL parameters for customization:

### Core Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `range` | string | `'default'` | Time range for data display |
| `results` | integer | `8000` | Maximum number of data points to fetch |
| `dashboard` | boolean | `false` | Enable dashboard/kiosk mode |
| `lang` | string | `'no'` | Interface language (no/en/es) |
| `theme` | string | `'auto'` | Color theme (light/dark/auto) |

### Usage Examples

```
# Basic usage with 3-day range
https://drimon.rodland.no/?range=3

# Dashboard mode with Norwegian language
https://drimon.rodland.no/?dashboard=true&lang=no

# Large dataset with specific date range
https://drimon.rodland.no/?range=7&results=15000

# Dark theme with English language
https://drimon.rodland.no/?theme=dark&lang=en
```

## View Modes

### Standard Mode
- **Layout**: Grid-based responsive layout with adaptive columns
- **Features**: Full navigation, language switching, detailed tooltips, header controls
- **Target**: Desktop and mobile browsers
- **Mobile Optimizations**: Touch-friendly controls, swipe gestures, optimized chart sizes

### Mobile Screen Optimizations
- **Responsive Grid**: Dynamic column adjustment based on screen width
- **Touch Interactions**: Pull-to-refresh, swipe navigation, tap-friendly buttons
- **Optimized Charts**: Reduced data points, simplified legends, touch-responsive tooltips
- **Compact UI**: Collapsed headers, streamlined controls, mobile-first design
- **Performance**: Lazy loading, reduced animations, efficient rendering

### Dashboard Mode
- **Activation**: `?dashboard=true` or Raspberry Pi detection (800x480 screen)
- **Layout**: Optimized 2x2 chart grid with fixed positioning
- **Features**: Auto-refresh, simplified UI, chart set selection dropdown
- **Target**: Kiosk displays, wall-mounted screens, embedded displays

### Chart Sets (Dashboard Mode)
Dashboard mode includes 4 selectable chart sets accessible via dropdown menu:

1. **Set 1**: Temperature overview, humidity, system metrics
2. **Set 2**: Detailed temperature sensors, soil monitoring  
3. **Set 3**: Light levels, environmental conditions
4. **Set 4**: Weather integration, astronomical events

## Features

### Data Visualization
- **Interactive Charts**: Chart.js-powered time-series visualization
- **Multi-Channel Support**: 4 ThingSpeak channels with different data types
- **Statistical Analysis**: Min/max/average calculations with visual markers
- **Real-time Updates**: Automatic data refresh with smart caching
- **Cross-Chart Synchronization**: Coordinated tooltips and interactions

### User Experience
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Touch Support**: Mobile-optimized gestures and interactions
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: Optimized rendering with resource pooling

### Customization
- **Multi-language**: Norwegian, English, Spanish with dynamic loading
- **Theming**: Light/dark modes with system preference detection
- **Date Ranges**: Flexible time period selection (24h to 30 days)
- **Data Filtering**: Configurable data quality filters and exclusions

### External Integrations
- **Weather Data**: YR.no API integration with location-based forecasts
- **Astronomical Events**: Comprehensive sun/moon calculations with planetary positions
- **Geolocation**: Rødtangen, Norway coordinates (59.532213, 10.418231)

### Astronomical Features
The application includes sophisticated astronomical calculations providing detailed information about celestial events:

#### Sun Events
- **Daily Cycles**: Sunrise, sunset, dawn, dusk calculations using SunCalc library
- **Day Length Tracking**: Current day/night length with historical comparison to solstices
- **Seasonal Changes**: Day length increase/decrease since last solstice with precise measurements
- **Solar Position**: Real-time sun azimuth and altitude when visible above horizon
- **Next Event Display**: Countdown to next sunrise/sunset with remaining time

#### Moon Tracking
- **Lunar Phases**: 8-phase moon visualization with custom SVG generation
- **Moonrise/Moonset**: Daily lunar event times
- **Moon Position**: Real-time lunar azimuth and altitude when visible
- **Phase Names**: Translated phase descriptions (New, Waxing Crescent, First Quarter, etc.)
- **Illumination Data**: Precise lunar illumination percentage

#### Planetary Positions
- **Visible Planets**: Real-time calculations for Mercury, Venus, Mars, Jupiter, Saturn
- **Orbital Mechanics**: Simplified planetary position calculations using J2000 epoch orbital elements
- **Visibility Detection**: Determines which planets are above horizon at current time
- **Position Display**: Compass direction and elevation angle for each visible planet
- **Horizon Tracking**: Only shows planets with positive altitude (above horizon)

#### Interactive Tooltip
The sun/moon chip provides a comprehensive tooltip containing:
- **Sun Data**: Sunrise/sunset times, day/night length, seasonal changes, current position
- **Moon Data**: Rise/set times, current phase with name, position when visible
- **Planetary Data**: Positions of all currently visible planets with compass directions
- **Time Comparisons**: Day length changes since winter/summer solstice
- **Multi-language Support**: All astronomical terms translated to Norwegian/English/Spanish

#### Technical Implementation
- **SunCalc Integration**: Precise calculations using established astronomical library
- **Custom Planet Calculations**: Simplified orbital mechanics for visualization purposes
- **Caching Strategy**: Daily astronomical data cached until midnight for performance
- **Real-time Updates**: Positions updated every minute, events calculated dynamically
- **SVG Generation**: Custom moon phase visualization with 8 distinct phases

## Configuration

### ThingSpeak Channels
Configured in `constants.js`:

```javascript
THINGSPEAK: {
    CHANNELS: {
        DRIMON_CHANNEL: { id: 2568299 },  // Main environmental data
        TEMP_CHANNEL: { id: 2584548 },    // Temperature monitoring
        TECH_CHANNEL: { id: 2584547 },    // System performance
        EXT_CHANNEL: { id: 2626867 }      // External weather
    }
}
```

### Geographic Location
```javascript
LOCATION: {
    LAT: 59.532213,
    LON: 10.418231,
    NAME: 'Rødtangen'
}
```

## Development

### Dependencies
- **Chart.js** - Data visualization
- **Moment.js** - Date/time handling with localization
- **SunCalc** - Astronomical calculations
- **Bootstrap 4** - UI components and grid system
- **Font Awesome** - Icon library

### Build Process
The application is static HTML/CSS/JavaScript requiring no build step:

```bash
# Local development server
python -m http.server 8000
# or
npx serve docs/
```

### Browser Support
- Modern browsers with ES6+ support
- Responsive design for mobile devices
- Progressive enhancement for older browsers

## API Integration

### ThingSpeak Data Fetching
- **Base URL**: `https://api.thingspeak.com/channels/{channel}/feeds.json`
- **Rate Limiting**: Managed by `data-request-manager.js`
- **Caching**: Local storage with TTL expiration
- **Error Handling**: Retry logic with exponential backoff

### Weather APIs (MET Norway)
The application integrates with multiple MET Norway API endpoints:

#### Nowcast API (Current Weather)
- **Endpoint**: `https://api.met.no/weatherapi/nowcast/2.0/complete`
- **Location**: Rødtangen coordinates (59.532213, 10.418231)
- **Features**: Real-time weather conditions, next hour precipitation, wind data
- **Update Frequency**: 2-minute cache with forced refresh at peak hours (6-8, 12-13, 18-19)
- **Data**: Temperature, humidity, wind speed/direction/gusts, precipitation

#### Location Forecast API (Multi-day Forecast)
- **Endpoint**: `https://api.met.no/weatherapi/locationforecast/2.0/compact`
- **Location**: Rødtangen coordinates (59.532213, 10.418231)
- **Features**: 7-day weather forecast with 4 daily periods (night, morning, afternoon, evening)
- **Update Frequency**: 20-minute cache with forced refresh windows
- **Data**: Temperature trends, weather symbols, high/low temperatures, precipitation forecasts

#### Integration Features
- **Smart Caching**: Multi-level cache strategy with time-based invalidation
- **CORS Handling**: Centralized proxy system for browser compatibility
- **Fallback Support**: Multiple fetch methods with graceful degradation
- **Real-time Updates**: Automatic refresh on page visibility changes
- **Cross-module Integration**: Shared data between nowcast and forecast modules

#### Interactive Weather Tooltip
The weather data chip provides a comprehensive tooltip containing both current conditions and forecast data:

**Current Weather Section:**
- **Real-time Conditions**: Temperature, humidity, wind speed/direction/gusts, precipitation
- **Weather Icons**: Visual symbols from YR.no representing current conditions
- **Wind Information**: Speed and cardinal direction (N, NE, E, etc.) with gust data
- **Precipitation**: Current and next-hour precipitation amounts in mm
- **Data Sources**: Clear indication of data source (yr.no with proxy method if applicable)

**Forecast Section:**
- **7-Day Outlook**: Extended forecast table with daily breakdowns
- **Time Periods**: Four daily periods (night, morning, afternoon, evening)
- **Temperature Trends**: High/low temperatures and period-specific temperatures
- **Weather Symbols**: Icon-based weather condition indicators for each period
- **Today Highlighting**: Current day emphasized in forecast table

**Timestamp Information:**
- **Forecast Time**: The specific time the current weather data represents
- **Nowcast Updated**: When the real-time data was last updated at YR.no servers
- **Forecast Updated**: When the extended forecast was last updated
- **Fetched Time**: When the data was retrieved by the application
- **Data Source**: Method used to fetch data (direct, proxy, etc.)

**Technical Features:**
- **Dynamic Content**: Tooltip switches between basic weather data and full forecast on user interaction
- **Multi-language Support**: All weather terms and conditions translated
- **Cache Coordination**: Displays data freshness and update frequencies
- **Cross-module Data**: Seamlessly combines nowcast and forecast information
- **Responsive Layout**: Optimized table layout for different screen sizes

## Header Data Chips

The application header features a series of data-at-a-glance chips that provide real-time sensor readings with color-coded status indicators and detailed tooltips. Each chip displays current values with contextual color coding based on configurable thresholds.

### Data Chip Types

#### Environmental Monitoring Chips
- **Temperature Chip**: Current greenhouse temperature with status color (red/yellow/green based on optimal growing ranges)
- **Humidity Chip**: Current relative humidity percentage with moisture level indicators
- **Pressure Chip**: Atmospheric pressure in hPa with weather trend implications
- **Light Chip**: Current light intensity in lux with day/night/shade level indicators

#### System Status Chips  
- **Battery Chip**: Current battery percentage with charge level status (critical/low/good)
- **Distance Chip**: Window opening measurement in cm with open/closed status
- **Weather Chip**: External temperature from YR.no with comprehensive weather data

#### Astronomical Information
- **Sun/Moon Chip**: Next sunrise/sunset event with current moon phase visualization

### Chip Visual Design
- **Color Coding**: Dynamic background colors (red/yellow/green) based on data thresholds
- **Status Icons**: Contextual icons representing each data type (thermometer, droplet, etc.)
- **Real-time Updates**: Values refresh automatically based on data fetch intervals
- **Responsive Layout**: Chips adapt to different screen sizes with priority ordering

### Interactive Tooltips
Each data chip provides detailed tooltip information on hover/tap:

#### Environmental Chip Tooltips
- **Temperature**: Current value, min/max for selected time period, average temperature, status description
- **Humidity**: Current percentage, min/max values, average humidity, moisture level status
- **Pressure**: Current atmospheric pressure, trend analysis, weather implications, barometric changes
- **Light**: Current lux level, daily light cycle information, seasonal light patterns, photosynthesis adequacy

#### System Chip Tooltips
- **Battery**: Current percentage, voltage readings, charging/discharging status, system power health
- **Distance**: Current window opening measurement, ventilation status, position history, opening trends
- **Weather**: Complete current conditions and 7-day forecast (detailed in weather section above)

#### Astronomical Chip Tooltip
- **Sun/Moon**: Complete astronomical data including planetary positions (detailed above)

### Threshold Configuration
Each chip uses detailed threshold values to determine status colors and provide contextual information:

#### Temperature Chip (°C)
- **Cold** (< 15°C): Red indicator - too cold for optimal plant growth
- **Cool** (15-18°C): Blue indicator - cool but acceptable
- **Good** (18-25°C): Green indicator - optimal growing temperature
- **Warm** (25-30°C): Yellow indicator - getting warm, monitor ventilation
- **Hot** (> 30°C): Red indicator - too hot, immediate action needed

#### Humidity Chip (%)
- **Dry** (< 40%): Red indicator - too dry, risk of plant stress
- **Low** (40-50%): Yellow indicator - slightly low humidity
- **Good** (50-70%): Green indicator - optimal humidity range
- **High** (70-80%): Yellow indicator - getting humid, watch for condensation
- **Wet** (> 80%): Red indicator - too humid, risk of mold/disease

#### Battery Chip (%)
- **Critical** (< 20%): Red indicator - immediate charging needed
- **Low** (20-50%): Yellow indicator - monitor charge levels
- **Good** (50-80%): Green indicator - adequate charge
- **Full** (> 80%): Green indicator - well charged


#### Distance/Window Chip (cm)
- **Closed** (< 5 cm): Blue indicator - window closed
- **Slightly Open** (5-20 cm): Green indicator - partially open for ventilation
- **Open** (20-50 cm): Yellow indicator - well ventilated
- **Wide Open** (> 50 cm): Red indicator - fully open, potential heat loss

#### Pressure Chip (hPa)
- **Low** (< 1000 hPa): Yellow indicator - low pressure, possible storms
- **Normal** (1000-1020 hPa): Green indicator - stable weather
- **High** (> 1020 hPa): Blue indicator - high pressure, clear weather

#### Light Chip (lux)
- **Night** (< 10 lux): Dark blue indicator - nighttime conditions
- **Dim** (10-500 lux): Blue indicator - low light, supplemental lighting needed
- **Moderate** (500-10,000 lux): Green indicator - good growing light
- **Bright** (10,000-50,000 lux): Yellow indicator - bright daylight
- **Intense** (> 50,000 lux): Red indicator - very intense light, potential stress

#### Weather Chip (°C)
- **Freezing** (< 0°C): Blue indicator - freezing conditions
- **Cold** (0-10°C): Light blue indicator - cold weather
- **Cool** (10-20°C): Green indicator - comfortable outdoor temperature
- **Mild** (20-30°C): Yellow indicator - warm weather
- **Hot** (> 30°C): Red indicator - hot conditions

### Data Sources
- **ThingSpeak Channels**: Real-time sensor data from greenhouse hardware
- **Weather APIs**: External temperature and forecast data from YR.no
- **Astronomical Calculations**: Sun/moon/planetary position calculations
- **System Metrics**: Battery monitoring, WiFi signal strength, and system status

**Note**: WiFi signal strength (RSSI) data is available as a chart visualization but not as a header data chip.

### Mobile Optimization
- **Touch-friendly**: Larger tap targets for mobile devices
- **Swipe Support**: Horizontal scrolling for chip overflow on small screens
- **Condensed View**: Priority-based chip visibility on narrow displays
- **Tooltip Adaptation**: Touch-optimized tooltip presentation

## Deployment

The application is deployed as static files to GitHub Pages:

- **Production URL**: https://drimon.rodland.no/
- **CDN**: Global distribution via GitHub's CDN
- **SSL**: Automatic HTTPS with custom domain
- **Caching**: Optimized asset delivery with appropriate headers

## Performance Optimization

### Resource Management
- **Asset Optimization**: WebP images, minified CSS/JS
- **Lazy Loading**: Charts rendered on-demand
- **Memory Management**: Resource pooling for large datasets
- **Caching Strategy**: Multi-level caching (browser, localStorage, CDN)

### Data Handling
- **Smart Fetching**: Incremental data loading
- **Background Updates**: Non-blocking refresh cycles  
- **Compression**: Efficient data structures and algorithms
- **Error Recovery**: Graceful degradation with offline support

## Monitoring and Analytics

### Error Tracking
- Client-side error logging
- Performance monitoring
- User interaction analytics

### Usage Metrics
- Page load times
- Chart rendering performance
- API response times
- User engagement patterns

---

*This documentation covers the complete DriMon web application architecture, features, and usage patterns. For hardware documentation, see the main project README and documentation/ directory.*