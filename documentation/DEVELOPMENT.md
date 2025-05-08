# DriMon Development Documentation

This document provides guidelines for developers working on the DriMon project, including architecture details, component responsibilities, and best practices.

## Architecture Overview

DriMon follows a component-based architecture optimized for maintainability and testability:

- **Component Pattern**: Modular JavaScript functions that create and return DOM elements
- **Data-View Separation**: Clear separation between data fetching and UI rendering
- **API Abstraction**: Standardized interfaces for data sources (ThingSpeak, YR.no)
- **Event Delegation**: Centralized event handling model for interactive elements
- **Responsive Grid**: Dynamic grid-based layout system for varied screen sizes

## Technology Stack

- **Chart.js**: Interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for desktop and mobile
- **Vanilla JavaScript**: DOM manipulation and data fetching
- **Moment.js**: Date handling and formatting
- **Bootstrap & Font Awesome**: Basic styling and icons
- **Internationalization (i18n)**: Multi-language support (Norwegian, English, Spanish)

## Core Modules and Component Responsibilities

### Core Utilities

#### `/js/core/utils.js`
- Date formatting and manipulation
- Number formatting and statistics calculation
- URL parameter handling
- DOM creation helpers
- Debounce and throttle functions
- Event emitter implementation

#### `/js/core/chart-utils.js`
- Data transformation functions
- Dataset configuration
- Chart data storage and retrieval
- Tooltip configuration generation
- Annotation generation
- Smart time format determination
- Value formatting based on range

#### `/js/core/i18n.js`
- Translation storage and retrieval
- Language switching functionality
- Translation key validation
- Translation helper functions
- Event dispatching for language changes

### Chart System

#### `/js/core/chart-layout.js`
- Grid position calculation for charts
- Chart layout structure initialization
- Category-based chart sorting (mobile view)
- Chart titles and loading indicators
- Responsive layout management

#### `/js/core/chart-stats.js`
- Statistics translation labels
- Statistic value formatting
- Statistics display HTML generation
- Chart statistics updates
- Statistics recalculation from chart data

#### `/js/core/chart-factory.js`
- Factory pattern for different chart types
- Chart instance management
- Chart lifecycle methods (create, update, destroy)
- Chart configuration handling

#### `/js/core/chart-loader.js`
- Progressive chart loading with state tracking
- Chart layout and grid positioning
- Loading and refreshing methods
- Loading progress coordination

#### `/js/core/chart-controller.js`
- Global and per-chart state management
- Chart interaction event handling
- Display mode, dark mode, stats visibility management
- Chart synchronization coordination
- Event-based state updates

### Data Handling

#### `/js/core/data-request-manager.js`
- Request throttling to limit concurrent API calls
- Request batching for multiple fields
- Request debouncing to prevent duplicates
- Caching system for responses
- Error handling for network failures
- Performance monitoring statistics

## Key Files

- `index.html`: Main entry point and layout
- `header.css`: Styling for the modern header with data chips
- `main.css`: Main styling and chart layout
- `dark-mode.css`: Dark mode styles and theme switching

### Component Files
- `header_components.js`: Reusable UI components for the page header
- `chart_components.js`: Reusable chart and visualization components
- `data_components.js`: Data fetching and processing components

### Configuration and Logic
- `chart_config.js`: Configuration for all charts with row-based layout
- `chart_renderer.js`: Core chart rendering using Chart.js
- `data.js`: Data handling and sensor information processing
- `weather.js`: Weather data integration with YR.no
- `date_utils.js`: Date range handling and URL parameter parsing
- `script.js`: Main application logic and UI interaction

## Feature Implementations

### Chart Configuration System

Charts are configured using a row-based layout system that automatically calculates grid positions. Each chart belongs to a specific row and category, with responsive layouts for both desktop and mobile devices.

#### Chart-Specific Default Ranges

Each chart can have a custom default time range when the "Default" date picker option (house icon) is selected:

```javascript
{
    id: 'chart-temperature',
    titleKey: 'temperatureChart',
    // ... other properties
    defaultRange: 1  // Default to 1 day for temperature chart
}
```

The system uses these chart-specific defaults when:
1. The "Default" (house icon) option is selected from the date picker
2. No range parameter is provided in the URL (defaults to "Default")

### Statistical Indicators

Charts include visual statistical indicators with configurable options:
- **Average Value Lines**: Horizontal dashed lines showing the average value
- **Maximum Points**: Optional diamond markers highlighting the highest values
- **Minimum Points**: Optional triangle markers showing the lowest values
- **Statistical Information**: Min/max/avg values displayed in chart stats

Configuration example:
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

## Current Module Structure

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
  └─ debug.js               # Debug utilities
```