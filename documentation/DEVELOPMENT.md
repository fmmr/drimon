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
- `chart_renderer.js`: Core chart rendering using Chart.js
- `data.js`: Data handling and sensor information processing
- `weather.js`: Weather data integration with YR.no
- `date_utils.js`: Date range handling and URL parameter parsing
- `script.js`: Main application logic and UI interaction
- `translations.js`: Internationalization system with multi-language support

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

#### `/core/utils.js` (Implemented)

**Primary Responsibility**: Provide general-purpose utility functions used across the application.

**Specific Responsibilities**:
- Date formatting and manipulation functions
- Number formatting and statistics calculation
- URL parameter handling and query string utilities
- DOM creation and event handling utilities
- Debounce and throttle functions
- Event emitter implementation

#### `/core/i18n.js`

**Primary Responsibility**: Manage translations and language switching.

**Specific Responsibilities**:
- Store and retrieve translations
- Language switching functionality
- Translation key validation
- Translation helper functions
- Event dispatching for language changes

#### `/core/config.js` (Implemented)

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

#### `/components/charts/chart-factory.js`

**Primary Responsibility**: Create chart instances based on configuration.

**Specific Responsibilities**:
- Instantiate charts with the right configuration
- Apply chart plugins
- Register chart types
- Create chart instances

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

#### `/components/header/header.js`

**Primary Responsibility**: Create and manage the main header component.

**Specific Responsibilities**:
- Create header components
- Manage header state
- Handle header events

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

### Proposed Module Structure

```
/core/
  ├─ utils.js               # Common utilities for all modules
  │   ├─ date_utils.js      # Date handling functions
  │   └─ dom_utils.js       # DOM manipulation helpers
  │
  ├─ i18n.js                # Internationalization system
  │   └─ translations.js    # Translation data
  │
  └─ config.js              # Configuration system
      └─ chart_config.js    # Chart configuration data

/data/
  ├─ api.js                 # API client
  ├─ data_fetcher.js        # Data fetching logic
  ├─ data_processor.js      # Data transformation
  └─ cache.js               # Data caching

/components/
  ├─ charts/
  │   ├─ chart_factory.js   # Chart creation and initialization
  │   ├─ chart_renderer.js  # Chart rendering and updates
  │   ├─ annotations.js     # Chart annotations
  │   ├─ tooltips.js        # Chart tooltips
  │   └─ statistics.js      # Chart statistics
  │
  ├─ header/
  │   ├─ header.js          # Header component
  │   ├─ data_chips.js      # Data display components
  │   ├─ date_range.js      # Date range selector
  │   └─ controls.js        # UI controls
  │
  └─ weather/
      └─ weather.js         # Weather component

/ui/
  ├─ layout.js              # Layout management
  ├─ theme.js               # Theme management
  └─ responsive.js          # Responsive design

/debug/
  └─ debug.js               # Debug utilities

main.js                     # Application entry point
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