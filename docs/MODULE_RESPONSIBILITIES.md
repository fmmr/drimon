# DriMon Module Responsibilities

This document defines the clear responsibilities of each module in the refactored architecture. Each module should have a single, well-defined purpose and clear interfaces for interacting with other modules.

## Core Modules

### `/core/utils.js` (Implemented)

**Primary Responsibility**: Provide general-purpose utility functions used across the application.

**Specific Responsibilities**:
- Date formatting and manipulation functions
- Number formatting and statistics calculation
- URL parameter handling and query string utilities
- DOM creation and event handling utilities
- Debounce and throttle functions
- Event emitter implementation

**Interfaces**:
- `formatDate()`: Format date with locale support
- `formatRelativeTime()`: Format relative time strings
- `getURLParameter()`: Parse URL parameters
- `formatNumber()`: Format numbers with units
- `getDateRange()`: Get date ranges for queries
- `createElement()`: Create DOM elements
- `addEventListenerWithCleanup()`: Manage event listeners
- `debounce()`: Create debounced functions
- `throttle()`: Create throttled functions
- `calculateStatistics()`: Calculate min/max/avg values
- `createEventEmitter()`: Create event management system
- Pure functional interface (input → output with no side effects)

### `/core/i18n.js`

**Primary Responsibility**: Manage translations and language switching.

**Specific Responsibilities**:
- Store and retrieve translations
- Language switching functionality
- Translation key validation
- Translation helper functions
- Event dispatching for language changes

**Interfaces**:
- `__.()`: Get translated string for a key
- `setLanguage()`: Change the current language
- `getCurrentLanguage()`: Get the current language code
- Listen for 'languageChanged' event

### `/core/config.js` (Implemented)

**Primary Responsibility**: Manage application-wide configuration settings.

**Specific Responsibilities**:
- Define configuration schema for charts and application settings
- Validate configuration values against schema
- Provide access to chart and application configuration
- Store default configuration values
- Apply configuration-driven approach with explicit properties

**Interfaces**:
- `validateChartConfig()`: Validate a chart configuration
- `validateAppConfig()`: Validate application configuration
- `getChartConfig()`: Get chart config by ID
- `getAllChartConfigs()`: Get all chart configurations
- `getChartsForRow()`: Get charts for a specific row
- `getChartsByCategory()`: Get charts by category
- `getUnitForChart()`: Get unit for a chart
- `shouldUseIntegerValues()`: Check integer formatting
- `getConfig()`: Get application config value
- `setConfig()`: Set application config value

## Data Modules

### `/data/api.js`

**Primary Responsibility**: Handle all communication with external APIs.

**Specific Responsibilities**:
- Make HTTP requests to ThingSpeak
- Handle API errors
- Manage authentication if needed
- Format API responses

**Interfaces**:
- `fetchData()`: Fetch data from an API endpoint
- Error handling patterns
- Response formatting

### `/data/data-fetcher.js`

**Primary Responsibility**: Fetch and cache data from APIs.

**Specific Responsibilities**:
- Coordinate data fetching from multiple sources
- Implement request throttling and batching
- Handle data caching
- Manage request cancellation

**Interfaces**:
- `fetchChartData()`: Fetch data for a chart
- `fetchAllChartsData()`: Fetch data for all charts
- `invalidateCache()`: Clear cache

### `/data/data-processor.js`

**Primary Responsibility**: Transform raw API data into the format needed by UI components.

**Specific Responsibilities**:
- Data filtering and cleaning
- Data transformation and normalization
- Merging data from multiple sources
- Calculating derived values

**Interfaces**:
- `processChartData()`: Transform API data for charts
- Data structure transformation functions

## Component Modules

### `/components/charts/chart-factory.js`

**Primary Responsibility**: Create chart instances based on configuration.

**Specific Responsibilities**:
- Instantiate charts with the right configuration
- Apply chart plugins
- Register chart types
- Create chart instances

**Interfaces**:
- `createChart()`: Create a new chart
- Chart type registration

### `/components/charts/chart-renderer.js`

**Primary Responsibility**: Render and update charts on the screen.

**Specific Responsibilities**:
- Initialize chart layout
- Render charts with data
- Update charts with new data
- Manage chart lifecycles

**Interfaces**:
- `renderChart()`: Render a chart
- `updateChart()`: Update a chart with new data
- `resizeChart()`: Resize a chart
- `destroyChart()`: Clean up a chart
- `initializeChartLayout()`: Set up the chart layout

### `/components/charts/annotations.js`

**Primary Responsibility**: Manage chart annotations for statistical indicators and other markers.

**Specific Responsibilities**:
- Create annotation configurations
- Update annotations based on data
- Manage annotation visibility

**Interfaces**:
- `createAnnotationsForChart()`: Create annotations for a chart
- `updateAnnotations()`: Update annotations with new data

### `/components/charts/statistics.js`

**Primary Responsibility**: Calculate and display statistical information for charts.

**Specific Responsibilities**:
- Calculate min, max, avg values
- Format statistical values
- Create statistical displays
- Update statistics based on data

**Interfaces**:
- `calculateStatistics()`: Calculate statistics from chart data
- `updateStatisticsDisplay()`: Update statistics UI elements

### `/components/charts/tooltips.js`

**Primary Responsibility**: Create and manage chart tooltips.

**Specific Responsibilities**:
- Generate tooltip content
- Format tooltip values
- Handle tooltip positioning
- Manage tooltip interactions

**Interfaces**:
- `createTooltipConfig()`: Create tooltip configuration
- `generateTooltipContent()`: Generate tooltip content

### `/components/header/header.js`

**Primary Responsibility**: Create and manage the main header component.

**Specific Responsibilities**:
- Create header components
- Manage header state
- Handle header events

**Interfaces**:
- `createHeader()`: Create the header component
- `updateHeaderData()`: Update header with new data

### `/components/header/data-chips.js`

**Primary Responsibility**: Create and manage data display chips in the header.

**Specific Responsibilities**:
- Create data chips
- Update data chips with new values
- Manage data chip styling

**Interfaces**:
- `createDataChip()`: Create a data chip
- `updateDataChip()`: Update data chip with new value

### `/components/header/date-range.js`

**Primary Responsibility**: Manage date range selection.

**Specific Responsibilities**:
- Create date range selector
- Handle date range changes
- Format date range displays

**Interfaces**:
- `createDateRanges()`: Create date range selector
- `setDateRange()`: Change the selected range
- `getSelectedRange()`: Get the current range

### `/components/weather/weather.js`

**Primary Responsibility**: Fetch and display weather information.

**Specific Responsibilities**:
- Fetch weather data from API
- Display weather information
- Manage weather icons
- Format weather data

**Interfaces**:
- `createWeatherComponent()`: Create weather component
- `updateWeather()`: Update weather display
- `fetchWeatherData()`: Fetch weather data

## UI Modules

### `/ui/layout.js`

**Primary Responsibility**: Manage the application layout.

**Specific Responsibilities**:
- Calculate chart positions
- Manage responsive layout
- Handle layout changes

**Interfaces**:
- `calculateLayout()`: Calculate component positions
- `applyLayout()`: Apply layout to the DOM
- `handleResize()`: Handle window resize events

### `/ui/theme.js`

**Primary Responsibility**: Manage theme switching and styling.

**Specific Responsibilities**:
- Toggle dark/light mode
- Apply theme to components
- Store theme preferences

**Interfaces**:
- `toggleDarkMode()`: Toggle between dark and light mode
- `applyTheme()`: Apply theme to components
- `getCurrentTheme()`: Get the current theme

### `/ui/responsive.js`

**Primary Responsibility**: Handle responsive design adaptations.

**Specific Responsibilities**:
- Detect viewport changes
- Adjust component sizes and layouts
- Trigger responsive adaptations

**Interfaces**:
- `handleResize()`: Handle window resize events
- `isMobileMode()`: Check if mobile layout is active
- `getResponsiveSize()`: Get size constraints for components

## Debug Module

### `/debug/debug.js`

**Primary Responsibility**: Provide debugging utilities for development.

**Specific Responsibilities**:
- Toggle debug mode
- Log debug information
- Visualize component states
- Monitor performance

**Interfaces**:
- `initDebugMode()`: Initialize debug mode
- `logEvent()`: Log a debug event
- `logComponentRender()`: Track component rendering
- `logNetworkRequest()`: Monitor network activity

## Application Entry Point

### `main.js`

**Primary Responsibility**: Initialize the application and manage its lifecycle.

**Specific Responsibilities**:
- Load and bootstrap modules
- Initialize global configurations
- Set up event listeners
- Manage application state
- Coordinate module initialization

**Interfaces**:
- Document `DOMContentLoaded` event handler
- Global error handling
- Application lifecycle hooks

## Interaction Patterns

1. **Module Communication**: Modules should communicate through well-defined interfaces, not global state
2. **Event-Driven Updates**: Use event system for cross-module updates
3. **Configuration-Driven Behavior**: Module behavior should be driven by configuration
4. **Clear Dependency Graph**: Avoid circular dependencies
5. **Explicit Data Flow**: Data should flow through explicit channels, not globals

## Implementation Guidelines

1. Each module should export a clear public API
2. Internal implementation details should be hidden
3. Modules should be testable in isolation
4. Dependencies should be explicitly imported
5. Global state should be minimized or eliminated
6. Error handling should be consistent across modules
7. Configuration should be validated on module initialization
8. Event listeners should be properly managed (added/removed)