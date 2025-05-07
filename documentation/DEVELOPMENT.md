# DriMon Development Documentation

## Architecture Overview

DriMon follows a component-based architecture for maintainability and testability:

- **Component Pattern**: Modular JavaScript functions that create and return DOM elements
- **Data-View Separation**: Clear separation between data fetching and UI rendering
- **API Abstraction**: Standardized interfaces for data sources (ThingSpeak, YR.no)
- **Event Delegation**: Centralized event handling model for interactive elements
- **Responsive Grid**: Dynamic grid-based layout system for varied screen sizes

### Technologies

The web interface uses:

- **Chart.js**: For interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for both desktop and mobile
- **Vanilla JavaScript**: For DOM manipulation and data fetching
- **Moment.js**: For date handling and formatting
- **Bootstrap & Font Awesome**: For basic styling and icons
- **Internationalization (i18n)**: Multi-language support (Norwegian, English, Spanish)

### Key Files

- `index.html`: Main entry point and layout
- `header.css`: Styling for the modern header with data chips
- `main.css`: Main styling and chart layout
- `dark-mode.css`: Dark mode styles and theme switching

#### Component System
- `header_components.js`: Reusable UI components for the page header
- `chart_components.js`: Reusable chart and visualization components
- `data_components.js`: Data fetching and processing components
- `component_tests.js`: Testing framework for component validation

#### Application Logic
- `chart_config.js`: Configuration for all charts with row-based layout
- `js/core/chart-utils.js`: Utility functions for chart operations
- `js/core/chart-layout.js`: Layout management and DOM structure
- `js/core/chart-stats.js`: Statistics calculation and display
- `chart_renderer.js`: Core chart rendering using Chart.js (delegates to modules)
- `data.js`: Data handling and sensor information processing
- `weather.js`: Weather data integration with YR.no
- `date_utils.js`: Date range handling and URL parameter parsing
- `script.js`: Main application logic and UI interaction
- `js/core/i18n.js`: Internationalization system with multi-language support
- `js/core/translations-loader.js`: Translation data loader

### Chart Configuration

Charts are configured using a row-based layout system that automatically calculates grid positions. Each chart belongs to a specific row and category, with responsive layouts for both desktop and mobile devices.

### Statistical Indicators

Charts include visual statistical indicators with configurable options:
- **Average Value Lines**: Horizontal dashed lines showing the average value (always visible)
- **Maximum Points**: Optional diamond markers highlighting the highest values
- **Minimum Points**: Optional triangle markers showing the lowest values
- **Statistical Information**: Min/max/avg values displayed in chart stats

Statistical indicators can be configured per chart:
```javascript
{
    id: 'chart-temp',
    title: 'Temperature',
    // ... other configuration ...
    indicateMin: true, // Show minimum value markers
    indicateMax: true  // Show maximum value markers
}
```

### Mobile Support

The interface includes enhanced mobile support:
- Single-column chart layout on small screens
- Category-based chart sorting (available only on mobile)
- Touch-friendly controls
- Optimized performance for mobile devices

## Module Responsibilities

### Core Modules

#### `/js/core/utils.js` (Implemented)

**Primary Responsibility**: Provide general-purpose utility functions used across the application.

**Specific Responsibilities**:
- Date formatting and manipulation functions
- Number formatting and statistics calculation
- URL parameter handling and query string utilities
- DOM creation and event handling utilities
- Debounce and throttle functions
- Event emitter implementation

#### `/js/core/chart-utils.js` (Implemented)

**Primary Responsibility**: Provide chart-specific utility functions.

**Specific Responsibilities**:
- Data transformation functions
- Dataset configuration creation
- Statistics calculation for charts
- Chart data storage and retrieval
- Tooltip configuration generation
- Annotation generation
- Smart time format determination
- Value formatting based on range

#### `/js/core/chart-layout.js` (Implemented)

**Primary Responsibility**: Manage chart layout and DOM structure.

**Specific Responsibilities**:
- Calculate grid positions for charts
- Initialize chart layout structure
- Sort charts by category (mobile view)
- Create chart titles and loading indicators
- Manage responsive layout changes

#### `/js/core/chart-stats.js` (Implemented)

**Primary Responsibility**: Handle chart statistics calculation and display.

**Specific Responsibilities**:
- Get translation labels for statistics
- Format statistic values based on range
- Create HTML for statistics display
- Update chart statistics with proper values
- Recalculate statistics from chart data
- Update all chart statistics consistently

#### `/js/core/i18n.js` (Implemented)

**Primary Responsibility**: Manage translations and language switching.

**Specific Responsibilities**:
- Store and retrieve translations
- Language switching functionality
- Translation key validation
- Translation helper functions
- Event dispatching for language changes

#### `/js/core/config.js` (Implemented)

**Primary Responsibility**: Manage application-wide configuration settings.

**Specific Responsibilities**:
- Define configuration schema for charts and application settings
- Validate configuration values against schema
- Provide access to chart and application configuration
- Store default configuration values
- Apply configuration-driven approach with explicit properties

### Data Modules

#### `/data/api.js`

**Primary Responsibility**: Handle all communication with external APIs.

**Specific Responsibilities**:
- Make HTTP requests to ThingSpeak
- Handle API errors
- Manage authentication if needed
- Format API responses

#### `/data/data-fetcher.js`

**Primary Responsibility**: Fetch and cache data from APIs.

**Specific Responsibilities**:
- Coordinate data fetching from multiple sources
- Implement request throttling and batching
- Handle data caching
- Manage request cancellation

#### `/data/data-processor.js`

**Primary Responsibility**: Transform raw API data into the format needed by UI components.

**Specific Responsibilities**:
- Data filtering and cleaning
- Data transformation and normalization
- Merging data from multiple sources
- Calculating derived values

### Component Modules

### Chart Factory System

The Chart Factory System is a modular, extensible architecture for creating, managing, and updating charts. It follows modern software design patterns including Factory, Registry, Controller, and Event-based messaging to provide a robust foundation for chart management.

#### `/js/core/chart-factory.js` (Implemented)

**Primary Responsibility**: Create and manage chart instances based on configuration.

**Specific Responsibilities**:
- Provide a factory pattern for creating different types of charts
- Register different chart type factories (line, multi-series, etc.)
- Manage chart instances and provide lifecycle methods (create, update, destroy)
- Handle chart configuration and options generation

**Public API**:
```javascript
ChartFactory.initialize()                         // Initialize the factory
ChartFactory.register(type, factory)             // Register a chart type factory
ChartFactory.create(config, data, containerId)   // Create a chart instance
ChartFactory.update(chartId, data)               // Update an existing chart
ChartFactory.destroy(chartId)                    // Destroy a chart instance
ChartFactory.getInstance(chartId)                // Get a chart instance
ChartFactory.getAllInstances()                   // Get all chart instances
ChartFactory.resizeAll()                         // Resize all charts
```

#### `/js/core/chart-loader.js` (Implemented)

**Primary Responsibility**: Handle progressive loading of charts.

**Specific Responsibilities**:
- Manage the loading of multiple charts with state tracking
- Initialize chart layout and grid positioning
- Provide methods for loading and refreshing charts
- Monitor loading progress and coordinate with chart factory

**Public API**:
```javascript
ChartLoader.initialize(config)                   // Initialize the loader with configuration
ChartLoader.loadAllCharts(range, results)        // Load all charts with range and results
ChartLoader.refreshAllCharts()                   // Refresh all charts with current settings
ChartLoader.setEventHandlers(handlers)           // Set event handlers for loading events
ChartLoader.changeRange(range, results)          // Change date range and results count
ChartLoader.sortChartsByCategory(category)       // Sort charts by category (mobile view)
```

#### `/js/core/chart-controller.js` (Implemented)

**Primary Responsibility**: Provide state management for charts.

**Specific Responsibilities**:
- Maintain global and per-chart state
- Handle chart interaction events and broadcasting
- Manage global state like display mode, dark mode, stats visibility
- Coordinate synchronization between charts
- Provide event-based state updates

**Public API**:
```javascript
ChartController.initialize(initialState)         // Initialize the controller
ChartController.registerChart(chartId, config)   // Register a chart with the controller
ChartController.unregisterChart(chartId)         // Unregister a chart
ChartController.getGlobalState()                 // Get global state
ChartController.getChartState(chartId)           // Get a chart's state
ChartController.updateGlobalState(stateUpdate)   // Update global state
ChartController.updateChartState(chartId, state) // Update a chart's state
ChartController.addEventListener(type, callback) // Add an event listener
ChartController.toggleStatsVisibility(visible)   // Toggle chart statistics visibility
ChartController.syncCharts(...)                  // Synchronize charts for tooltips/highlighting
```

#### Key Benefits

1. **Separation of Concerns**: Each module has a clear, focused responsibility.
2. **Extensibility**: New chart types can be easily added through the registry.
3. **Testability**: Modular design enables isolated testing of components.
4. **Progressive Loading**: Charts load and display as their data becomes available.
5. **State Management**: Centralized state tracking prevents inconsistencies.
6. **Event System**: Enables responsive, reactive updates across components.

#### Integration with Existing Code

The chart factory system is designed to integrate with and eventually replace the current chart implementation in `chart_renderer.js`. The new system provides a more modular, maintainable approach while maintaining compatibility with existing chart configurations and data formats.

#### Demo

A demonstration page (`chart_factory_demo.html`) is included to showcase the chart factory system in action.

#### `/components/charts/chart-renderer.js`

**Primary Responsibility**: Render and update charts on the screen.

**Specific Responsibilities**:
- Initialize chart layout
- Render charts with data
- Update charts with new data
- Manage chart lifecycles

#### `/components/charts/annotations.js`

**Primary Responsibility**: Manage chart annotations for statistical indicators and other markers.

**Specific Responsibilities**:
- Create annotation configurations
- Update annotations based on data
- Manage annotation visibility

#### `/components/header/header_components.js`

**Primary Responsibility**: Create and manage the main header component with a declarative approach.

**Specific Responsibilities**:
- Create modular header components using a component registry
- Provide a declarative configuration system for the header
- Manage header state with the HeaderController
- Handle component lifecycle and event binding
- Enable dynamic updates of individual components
- Support internationalization with translation keys

#### `/components/weather/weather.js`

**Primary Responsibility**: Fetch and display weather information.

**Specific Responsibilities**:
- Fetch weather data from API
- Display weather information
- Manage weather icons
- Format weather data

## Code Analysis and Improvement Opportunities

### Code Duplication

1. **Translation Logic**
   - Multiple instances of checking for window.i18n and calling __ function across files
   - Opportunity: Create a centralized translation helper that handles null/fallback cases

2. **Date Formatting**
   - Moment.js usage is scattered across multiple files
   - Locale handling is duplicated in several places
   - Opportunity: Create a unified date utility module

3. **Chart Configuration Access**
   - Multiple functions to get chart properties (unit, integer formatting, etc.)
   - Similar code in chart_renderer.js and data_components.js
   - Opportunity: Create a unified chart configuration accessor

4. **DOM Element Creation**
   - Many similar element creation patterns across components
   - Opportunity: Create helper function for common element creation patterns

### Complex Code

1. **chart_renderer.js**
   - At 2000+ lines, this file is too large and has too many responsibilities
   - Contains rendering, data processing, event handling, and more
   - Complex conditional logic based on chart types/IDs
   - Opportunity: Split into smaller modules with clear responsibilities

2. **Multi-Series Chart Handling**
   - Complex conditional logic for handling multi-series vs single-series charts
   - Opportunity: Create a unified chart factory with specific strategies for different chart types

3. **ID-Based Conditionals**
   - Many conditionals based on chart IDs or titles in chart_renderer.js
   - Opportunity: Move to configuration-driven approach

### Key Improvement Opportunities

1. **Create a Unified Utility Module**
   - Date handling functions
   - Number formatting functions
   - DOM helpers
   - Translation helpers

2. **Split Chart Renderer**
   - Chart factory module
   - Layout manager
   - Annotation system
   - Tooltip generator
   - Legend manager
   - Statistics calculator

3. **Implement Configuration Schema**
   - Validate chart configurations
   - Provide defaults
   - Document options

4. **Introduce State Management**
   - Move away from global window properties
   - Create proper state containers
   - Implement reactive updates

## Dependency Graph

The current dependency graph between modules:

```
index.html
  |
  ├─ debug.js ──────────────┐
  │                          │
  ├─ translations.js ────────┼─────────────────────────────────┐
  │                          │                                 │
  ├─ header_components.js ───┼─────────────────────────────────┼─┐
  │   │                      │                                 │ │
  │   ├─ language_switcher.js│                                 │ │
  │                          │                                 │ │
  ├─ chart_components.js ────┼─────────────────────────────────┼─┼─┐
  │                          │                                 │ │ │
  ├─ data_components.js ─────┼─────────────────────────────────┼─┼─┼─┐
  │                          │                                 │ │ │ │
  ├─ date_utils.js ──────────┼─────────────────────────────────┼─┼─┼─┼─┐
  │                          │                                 │ │ │ │ │
  ├─ data.js ────────────────┼─────────────────────────────────┼─┼─┼─┼─┤
  │                          │                                 │ │ │ │ │
  ├─ weather.js ─────────────┼─────────────────────────────────┼─┼─┼─┼─┤
  │                          │                                 │ │ │ │ │
  ├─ chart_config.js ────────┼─┐                               │ │ │ │ │
  │                          │ │                               │ │ │ │ │
  ├─ chart_renderer.js       │ │                               │ │ │ │ │
  │        │                 │ │                               │ │ │ │ │
  │        v                 │ v                               v v v v v
  └─ script.js ─────────────────────────────────────────────────────────┘
```

### Global State Dependencies

1. **window.chartConfigs**
   - Defined in: chart_config.js
   - Used in: chart_renderer.js, script.js

2. **window.chartInstances**
   - Defined in: chart_renderer.js
   - Used in: script.js

3. **window.i18n**
   - Defined in: translations.js
   - Used in: All modules with user-facing text

### Current Module Structure

```
/js/core/
  ├─ utils.js               # Common utilities for all modules
  ├─ chart-utils.js         # Chart-specific utility functions
  ├─ chart-layout.js        # Layout management for charts
  ├─ chart-stats.js         # Statistics calculation and display
  ├─ chart-factory.js       # Chart creation factory
  ├─ chart-loader.js        # Progressive chart loading
  ├─ chart-controller.js    # Chart state management
  ├─ i18n.js                # Internationalization system
  ├─ i18n-init.js           # I18n initialization
  ├─ translations-loader.js # Translation data
  └─ config.js              # Configuration schema and validation

/js/tests/
  ├─ chart-factory.test.js  # Tests for chart factory
  ├─ chart-controller.test.js # Tests for chart controller
  ├─ i18n.test.js           # Tests for i18n system
  ├─ utils.test.js          # Tests for utilities
  └─ config.test.js         # Tests for configuration system

/ (root)
  ├─ chart_config.js        # Chart configuration data
  ├─ chart_renderer.js      # Chart rendering (delegates to modules)
  ├─ data_components.js     # Data fetching and processing
  ├─ header_components.js   # Header components and registry
  ├─ chart_components.js    # Chart UI components
  ├─ script.js              # Main application logic
  ├─ data.js                # Sensor data handling
  ├─ date_utils.js          # Date range utilities
  ├─ weather.js             # Weather integration
  ├─ component_tests.js     # Component testing framework
  └─ debug.js               # Debug utilities
```

### Future Module Structure

```
/js/core/
  ├─ utils.js               # Common utilities for all modules
  ├─ chart-utils.js         # Chart-specific utility functions
  ├─ chart-layout.js        # Layout management for charts
  ├─ chart-stats.js         # Statistics calculation and display
  ├─ chart-factory.js       # Chart creation factory
  ├─ chart-loader.js        # Progressive chart loading
  ├─ chart-controller.js    # Chart state management
  ├─ i18n.js                # Internationalization system
  ├─ i18n-init.js           # I18n initialization
  ├─ translations-loader.js # Translation data
  └─ config.js              # Configuration schema and validation

/js/data/
  ├─ api.js                 # API client
  ├─ data-fetcher.js        # Data fetching logic
  ├─ data-processor.js      # Data transformation
  └─ cache.js               # In-memory data caching with expiration

/js/components/
  ├─ charts/
  │   ├─ annotations.js     # Chart annotations
  │   ├─ tooltips.js        # Chart tooltips
  │   └─ legend.js          # Chart legend management
  │
  ├─ header/
  │   ├─ header-components.js  # Header components and registry
  │   ├─ header-controller.js  # Header state management
  │   ├─ component-registry.js # Component registration system
  │   ├─ data-chips.js         # Data display components
  │   ├─ date-range.js         # Date range selector
  │   └─ controls.js           # UI controls
  │
  └─ weather/
      └─ weather.js         # Weather component

/js/ui/
  ├─ layout.js              # Layout management
  ├─ theme.js               # Theme management
  └─ responsive.js          # Responsive design

/js/debug/
  └─ debug.js               # Debug utilities

/js/main.js                 # Application entry point
```

## Development Workflow

To preview this site locally, you can use any static file server. For example:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

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