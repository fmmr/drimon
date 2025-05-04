# DriMon Dependency Graph

This document maps the dependencies between JavaScript modules in the DriMon codebase.

## Current Module Dependencies

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

## Detailed Dependencies

### script.js
Depends on:
- chart_renderer.js (window.chartInstances, window.refreshCharts, window.resizeAllCharts)
- data.js (fetchData)
- moment.js (external)
- translations.js (window.i18n)

### chart_renderer.js
Depends on:
- chart_config.js (window.chartConfigs)
- data_components.js (window.fetchChartData)
- translations.js (window.i18n)
- date_utils.js (getURLParameter)
- moment.js (external)
- Chart.js (external)

### data_components.js
Depends on:
- date_utils.js (getDateRange)
- moment.js (external)

### chart_components.js
Depends on:
- Chart.js (external)
- moment.js (external)
- translations.js (window.i18n)

### data.js
Depends on:
- weather.js (updateWeatherDisplay)
- translations.js (window.i18n)
- moment.js (external)

### weather.js
Depends on:
- translations.js (window.i18n)
- moment.js (external)

### header_components.js
Depends on:
- translations.js (window.i18n)

### date_utils.js
Depends on:
- moment.js (external)

### language_switcher.js
Depends on:
- translations.js (window.i18n)

### debug.js
No significant dependencies on other modules

### translations.js
Depends on:
- moment.js (external)

## Global State Dependencies

### window.chartConfigs
- Defined in: chart_config.js
- Used in: chart_renderer.js, script.js

### window.chartInstances
- Defined in: chart_renderer.js
- Used in: script.js

### window.chartRawData
- Defined in: chart_renderer.js
- Used in: chart_renderer.js (internally)

### window.i18n
- Defined in: translations.js
- Used in: All modules with user-facing text

### window.DriMonDebug
- Defined in: debug.js
- Used in: debug.js (internally)

## Problematic Dependencies

1. **Bidirectional Dependency**
   - script.js ↔ chart_renderer.js: Functions are exported/imported in both directions

2. **Global State Dependencies**
   - Many modules rely on global window.* objects rather than explicit imports

3. **Missing Abstractions**
   - chart_renderer.js directly accesses data_components.js functionality
   - data.js directly calls weather.js functions

4. **Inconsistent Module Boundaries**
   - Some functionality (like date handling) is spread across multiple files

## Proposed Module Structure

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

This proposed structure eliminates circular dependencies and creates clear boundaries between module responsibilities.