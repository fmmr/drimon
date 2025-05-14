# DriMon Development Documentation

This document provides guidelines for developers working on the DriMon project, including architecture details, component responsibilities, and best practices.

## Architecture Overview

DriMon follows a component-based architecture optimized for maintainability and testability:

- **Component Pattern**: Modular JavaScript functions that create and return DOM elements
- **Data-View Separation**: Clear separation between data fetching and UI rendering
- **API Abstraction**: Standardized interfaces for data sources (ThingSpeak, YR.no)
- **Event Delegation**: Centralized event handling model for interactive elements
- **Responsive Grid**: Dynamic grid-based layout system for varied screen sizes
- **Resource Pooling**: Reuse of configuration objects to optimize memory usage
- **Lifecycle Management**: Structured chart initialization, updating, and cleanup
- **Progressive Loading**: Charts load in parallel for optimal performance
- **Cross-Chart Communication**: Data synchronization across related charts

## Technology Stack

- **Chart.js**: Interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for desktop and mobile
- **Vanilla JavaScript**: DOM manipulation and data fetching
- **Moment.js**: Date handling and formatting
- **Bootstrap & Font Awesome**: Basic styling and icons
- **ThingSpeak API**: Data storage and retrieval for sensor readings
- **YR.no Weather API**: Integration with Norwegian Meteorological Institute
- **Internationalization (i18n)**: Multi-language support (Norwegian, English, Spanish)

## Core Modules and Component Responsibilities

### Core Utilities

#### `/js/utils.js`
- Date formatting and manipulation
- Number formatting with context-aware precision
- URL parameter handling and parsing
- DOM creation and manipulation helpers
- Debounce and throttle functions for performance
- Statistical calculations for chart data
- Tabular tooltip formatting

#### `/js/chart-utils.js`
- Data transformation functions with shift/scale operations
- Dataset configuration with style management
- Chart data storage and state management
- Tooltip configuration with synchronized behavior
- Annotation generation for statistical indicators
- Smart time format determination based on range
- Inter-chart communication handling

#### `/js/i18n.js`
- Translation storage with validation
- Language detection and persistence
- On-demand translation lookup
- Key-based translation system
- DOM element translation utilities
- Language change event dispatching
- Translation context creation for components

### Chart System

#### `/js/chart-layout.js`
- Grid position calculation with responsive breakpoints
- Layout initialization with category support
- Category-based chart sorting for mobile
- Dynamic layout adjustments for screen sizes
- Chart container creation and management
- Chart title and loading indicator handling

#### `/js/chart-stats.js`
- Statistical value calculation and formatting
- Statistics display generation
- Low/Average/High/Now (LAHN) label system
- Statistics recalculation on data updates
- Stats visibility state management
- Event dispatching for updated statistics

#### `/js/chart-lifecycle-manager.js`
- Chart instance registration and tracking
- Chart cleanup and resource release
- Update tracking for performance monitoring
- Reference management to prevent memory leaks
- Error recovery for chart rendering issues

#### `/js/chart-renderer.js`
- Chart creation and configuration application
- Data preparation and transformation
- Chart options configuration
- Statistical annotation management
- Progressive chart loading
- Synchronized tooltip handling
- Responsive chart resizing
- Chart refreshing and data updates

### Controller System

#### `/js/date-controller.js`
- Date range selection handling
- URL parameter synchronization
- Date picker initialization
- Date range validation
- Today/yesterday/week/month/custom range support
- Default range handling per chart

#### `/js/theme-controller.js`
- Dark/light mode toggle functionality
- Theme state persistence
- System theme detection
- Dynamic stylesheet application
- Theme change event dispatching

#### `/js/layout-controller.js`
- Mobile/desktop layout detection
- Layout mode switching
- Orientation change handling
- Element repositioning for different screen sizes

#### `/js/tooltip-controller.js`
- Tooltip creation and positioning
- Hover state management
- Touch device support
- HTML content rendering
- Auto-dismissal handling

### Data Handling

#### `/js/data-request-manager.js`
- Request throttling to limit concurrent API calls
- Request batching for multiple fields
- Request debouncing to prevent duplicates
- Response caching with TTL management
- Error handling and recovery
- Performance monitoring

#### `/js/data-handler.js`
- ThingSpeak API connection management
- Data fetching and aggregation
- Data transformation and normalization
- Current value tracking and updates
- Periodic refresh scheduling

#### `/js/weather.js`
- YR.no API integration with CORS handling
- Weather data fetching and caching
- Weather icon loading and display
- Automatic refresh scheduling
- Proxy fallback for browser compatibility

## Key Files

- `index.html`: Main entry point with script loading order
- `css/header.css`: Styling for the modern header with data chips
- `css/main.css`: Main styling and chart layout grid
- `css/dark-mode.css`: Dark mode style overrides
- `css/tooltip.css`: Custom tooltip styling
- `css/language_switcher.css`: Language selector styling
- `css/debug.css`: Development-only debug helpers

### Component Files
- `js/header-components.js`: Data chip and header UI components
- `js/data-components.js`: Data fetching and processing components
- `js/language-switcher.js`: Language selection interface

### Configuration and Logic
- `js/chart-config.js`: Configuration for all charts with row-based layout
- `js/app.js`: Application initialization and core logic
- `js/planet-positions.js`: Astronomical calculations
- `js/sun-events.js`: Sunrise/sunset/twilight calculations
- `js/pull-to-refresh.js`: Mobile pull-to-refresh gesture handling
- `js/manifest-handler.js`: PWA capabilities

## Feature Implementations

### Chart Configuration System

Charts are configured using a row-based layout system that automatically calculates grid positions. Each chart belongs to a specific row and category, with responsive layouts for both desktop and mobile devices.

#### Chart Configuration Object Structure

```javascript
{
    id: 'chart-temp',                // Unique identifier
    titleKey: 'temperatureChart',    // Translation key
    channel: 2568299,                // ThingSpeak channel ID
    field: 1,                        // ThingSpeak field number
    color: '#c62828',                // Chart line color
    row: 1,                          // Grid row position
    category: 'temperature',         // Category for grouping/filtering
    categoryHeaderKey: 'temperatures', // Tooltip category header
    unit: '°C',                      // Display unit
    defaultRange: 1,                 // Default time range (days)

    // Structured formatting options
    formatting: {
        useIntegerFormat: false,
        decimalPlaces: 1             // Precision control
    },

    // Statistics display options
    statsLabelsStyle: 'LAHN',        // Low/Avg/High/Now style

    // Statistical indicator configuration
    indicators: {
        showMin: true,
        showMax: true,
        showAvg: true,
        colors: {
            min: '#1e88e5',          // Blue for minimum
            max: '#4caf50',          // Green for maximum
            avg: '#888888'           // Gray for average
        }
    },

    // Y-axis configuration
    yAxis: {
        position: 'right',
        beginAtZero: false,
        gridColor: 'rgba(0, 0, 0, 0.05)'
    },

    // Data transformation (offset correction)
    dataTransform: {
        shiftBy: -63                 // Calibration adjustment
    }
}
```

#### Multi-Series Charts

Charts can display multiple data series from different channels and fields:

```javascript
{
    id: 'chart-light',
    titleKey: 'lightChart',
    defaultRange: 1,
    series: [
        {
            titleKey: 'ceiling',      // External light
            channel: 2568299,
            field: 8,
            color: '#e6a500',
            axis: 'y'                 // Primary y-axis
        },
        {
            titleKey: 'internal',     // Internal light
            channel: 2584547,
            field: 5,
            color: '#8a5a00',
            axis: 'y1'                // Secondary y-axis
        }
    ],
    // Additional configuration
}
```

### Chart Rendering System

The chart rendering system uses a progressive loading approach:

1. Chart containers are created based on configuration
2. Data is fetched for all charts in parallel
3. Each chart renders as soon as its data arrives
4. Statistical indicators and annotations are added
5. Tooltips are configured with cross-chart synchronization

### Internationalization System

The i18n system provides:

1. Key-based translation lookups with fallback to default language
2. DOM attribute translation using data-i18n attributes
3. Dynamic language switching with localStorage persistence
4. Translation validation to catch missing keys
5. Event-based updates to all translatable elements

### Statistical Indicators

Charts include visual statistical indicators with configurable options:
- **Average Value Lines**: Horizontal dashed lines showing the average value
- **Maximum Points**: Diamond markers highlighting the highest values
- **Minimum Points**: Triangle markers showing the lowest values
- **Statistical Information**: Min/max/avg/current values in chart stats

### Mobile Support

The interface includes enhanced mobile support:
- Single-column chart layout on small screens
- Category-based chart sorting (available only on mobile)
- Touch-friendly controls with larger tap targets
- Pull-to-refresh gesture support
- Optimized performance for mobile devices

### Weather Integration

Weather data from YR.no provides:
- Current temperature with icon
- Precipitation forecast
- Wind speed and direction
- Humidity and other conditions
- CORS-compatible fetching with proxy fallbacks for Safari

## Development Workflow

To preview this site locally, you can use any static file server:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

## Implementation Guidelines

1. Each module should export a clear public API
2. Internal implementation details should be hidden
3. Modules should be testable in isolation
4. Dependencies should be explicitly imported
5. Global state should be minimized or eliminated
6. Error handling should be consistent across modules
7. Configuration should be validated on module initialization
8. Event listeners should be properly managed (added/removed)

## Interaction Patterns

1. **Module Communication**: Modules should communicate through well-defined interfaces, not global state
2. **Event-Driven Updates**: Use event system for cross-module updates
3. **Configuration-Driven Behavior**: Module behavior should be driven by configuration
4. **Clear Dependency Graph**: Avoid circular dependencies
5. **Explicit Data Flow**: Data should flow through explicit channels, not globals

## Data Refresh & Chart Update Mechanisms

The application implements multiple complementary update mechanisms to ensure data freshness and chart rendering integrity, particularly during long browser sessions:

### Regular Data Refresh (1-minute interval)
- **Implementation**: Main interval in `app.js`
- **Behavior**: Every minute, fetches new data for displayed charts when viewing current/recent data
- **Conditions**: Only applies when range is 'default', 'today', or '1'
- **Method**: Updates existing chart instances without full rebuilds
- **Benefits**: Regular data updates without performance impact

### Chart Canvas Auto-Refresh (10-minute interval)
- **Implementation**: Interval in `chart-lifecycle-manager.js` via `_setupAutomaticCleanup`
- **Behavior**: Forces all chart canvases to redraw themselves using Chart.js' resize mechanism
- **Purpose**: Prevents rendering artifacts that can accumulate over time
- **Type**: Visual refresh that doesn't fetch new data, just redraws existing data
- **Code**: `ChartFactory.resizeAll()` forces Chart.js to redraw all canvases

### Full Page Refresh (20-minute timer with conditions)
- **Implementation**: Timer in `app.js` with scroll position preservation
- **Behavior**: Reloads entire page after 20 minutes of display time with conditions
- **Conditions**: Triggers only when:
  - User has been inactive for at least 2 minutes (to avoid disrupting active usage)
  - OR it's been 45+ minutes since last refresh regardless of activity
- **Benefits**: Completely fresh state, eliminating any JS memory issues
- **User experience**: Preserves scroll position for seamless transition

### Time-Based Force Refresh (key times of day)
- **Implementation**: Condition checks in `weather.js` and `forecast.js`
- **Behavior**: Forces data refresh at specific times of day regardless of cache status
- **Times**: Morning (6-8 AM), Midday (12-13 PM), Evening (18-19 PM)
- **Purpose**: Ensures fresh data at times when weather conditions typically change
- **Method**: Bypasses normal caching by setting `forceRefresh` flag

### DOM Detachment Detection (1-minute check)
- **Implementation**: `checkForDetachedCharts()` function in `app.js`
- **Behavior**: Checks if chart canvas elements have become detached from DOM
- **Action**: If detachment detected, triggers full page refresh on next cycle
- **Purpose**: Prevents "white chart" issue by forcing refresh before it's visible
- **Details**: Verifies both element existence and parent-child relationships

### Hour Change Detection (forecast-specific)
- **Implementation**: `checkHourChange()` function in `forecast.js`
- **Behavior**: On each minute, checks if we've just passed the top of an hour
- **Action**: Forces forecast data refresh when hour changes (at 00:00-00:59 of each hour)
- **Purpose**: Ensures timely updates of forecast time periods which change by hour

### Cache TTL Mechanisms
- **Implementation**: Cache checks in `weather.js` and `forecast.js`
- **Weather data**: 3-minute cache with automatic expiration (WEATHER_CACHE_TTL)
- **Forecast data**: 30-minute cache with automatic expiration (FORECAST_CACHE_TTL)
- **Override**: Both caches are bypassed at key times of day (see Time-Based Force Refresh)

### Error-Triggered Refresh
- **Implementation**: Try/catch blocks around chart updates in `app.js`
- **Behavior**: If chart update results in error, schedules full page refresh
- **Method**: Sets `lastFullRefreshTime = 0` to trigger refresh on next cycle
- **Purpose**: Self-healing when chart corruption or DOM issues are detected

### Session Heartbeat (5-minute intervals)
- **Implementation**: Interval in `app.js`
- **Server mode**: Sends tiny HEAD request to site.webmanifest every 5 minutes
- **Local file mode**: Uses console activity to keep JS engine active
- **Purpose**: Prevents browser from hibernating background tabs
- **Benefits**: Ensures continuous operation of other refresh mechanisms

## Current Module Structure

```
/js/
  ├─ app.js                      # Application initialization
  ├─ chart-config.js             # Chart configuration data
  ├─ chart-i18n.js               # Chart-specific translations
  ├─ chart-layout.js             # Layout management for charts
  ├─ chart-lifecycle-manager.js  # Chart instance lifecycle
  ├─ chart-renderer.js           # Chart rendering engine
  ├─ chart-stats.js              # Statistics calculation and display
  ├─ chart-utils.js              # Chart-specific utility functions
  ├─ data-components.js          # Data component definitions
  ├─ data-handler.js             # ThingSpeak data handling
  ├─ data-request-manager.js     # API request management
  ├─ date-controller.js          # Date range control
  ├─ date-utils.js               # Date manipulation utilities
  ├─ debug.js                    # Debugging utilities
  ├─ header-components.js        # Header UI components
  ├─ header-controller.js        # Header state management
  ├─ i18n-controller.js          # Internationalization control
  ├─ i18n-init.js                # i18n initialization
  ├─ i18n.js                     # Translation system
  ├─ language-switcher.js        # Language selection UI
  ├─ layout-controller.js        # Responsive layout control
  ├─ light-tooltip-updater.js    # Light chart tooltip customization
  ├─ manifest-handler.js         # PWA manifest handling
  ├─ planet-positions.js         # Astronomical calculations
  ├─ pull-to-refresh.js          # Mobile pull gesture
  ├─ resource-pool.js            # Object pooling system
  ├─ stats-controller.js         # Statistics visibility control
  ├─ sun-events.js               # Sunrise/sunset calculation
  ├─ temp-tooltip-updater.js     # Temperature tooltip customization
  ├─ theme-controller.js         # Dark/light mode control
  ├─ tooltip-controller.js       # Tooltip management
  ├─ translations-loader.js      # Translation data loading
  ├─ utils.js                    # Common utility functions
  └─ weather.js                  # YR.no weather integration
```