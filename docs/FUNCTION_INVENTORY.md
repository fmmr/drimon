# DriMon Function Inventory

This document provides an inventory of all JavaScript functions in the DriMon codebase, their responsibilities, and dependencies. This will serve as a reference for the refactoring process.

## Table of Contents
- [chart_components.js](#chart_componentsjs)
- [chart_config.js](#chart_configjs)
- [chart_renderer.js](#chart_rendererjs)
- [component_tests.js](#component_testsjs)
- [data.js](#datajs)
- [data_components.js](#data_componentsjs)
- [date_utils.js](#date_utilsjs)
- [debug.js](#debugjs)
- [header_components.js](#header_componentsjs)
- [i18n_tests.js](#i18n_testsjs)
- [language_switcher.js](#language_switcherjs)
- [script.js](#scriptjs)
- [translations.js](#translationsjs)
- [weather.js](#weatherjs)

## chart_components.js

Functions for creating and managing chart UI components.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `createChartContainer` | Creates a chart container with title, stats, and canvas | None |
| `createChartTitle` | Creates a chart title element | None |
| `createChartStats` | Creates a chart stats container | None |
| `createChartCanvasContainer` | Creates a canvas container with loading indicator | `createLoadingIndicator` |
| `createLoadingIndicator` | Creates a loading indicator element | None |
| `updateChartStats` | Updates chart statistics display | None |
| `updateLoadingIndicator` | Updates loading indicator message and visibility | None |
| `createChartDataset` | Creates a Chart.js dataset configuration | None |
| `createChartOptions` | Creates complete Chart.js configuration | `createSecondaryYAxisOptions`, `createLegendOptions`, `createTooltipOptions` |
| `createSecondaryYAxisOptions` | Creates configuration for secondary Y axis | None |
| `createLegendOptions` | Creates legend options for Chart.js | None |
| `createTooltipOptions` | Creates tooltip options for Chart.js | None |

## chart_renderer.js

Core chart rendering and management functionality.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `recalculateChartStats` | Recalculates statistics for a chart | `ChartUtils.getActiveDatasets`, `ChartUtils.calculateStats`, `updateChartStats` |
| `updateChartStats` | Updates the chart statistics display | `ChartUtils.getUnitForChart`, `ChartUtils.formatNumber` |
| `translateChartLabels` | Translates all chart labels | `translateDatasetLabels`, `updateChartLegend`, `recalculateChartStats` |
| `translateDatasetLabels` | Translates all dataset labels in a chart | `window.i18n.__`, `window.chartTranslator.translateSeriesTitle`, `window.chartTranslator.translateChartTitle` |
| `updateChartLegend` | Updates chart legend with translated labels | None |
| `initializeChartLayout` | Initializes the chart grid layout | `calculateGridPositions` |
| `calculateGridPositions` | Calculates grid positions for each chart | None |
| `createOrUpdateChart` | Creates or updates a chart instance | `window.i18n.__`, `window.moment.locale`, `ChartUtils.createStatisticalAnnotations`, `ChartUtils.formatNumber`, `recalculateChartStats`, `translateChartLabels` |
| `resizeAllCharts` | Resizes all charts on window resize | `getURLParameter`, `loadAllCharts` |
| `loadAllCharts` | Loads data for all charts | `initializeChartLayout`, `fetchChartData`, `createOrUpdateChart` |
| `setupDateRangeHandlers` | Sets up date range selection handlers | `getURLParameter`, `window.refreshCharts` |
| `sortChartsByCategory` | Sorts charts by category on mobile | None |

## ChartUtils Object

| Method | Description | Dependencies |
|----------|-------------|--------------|
| `getUnitForChart` | Gets the unit for a chart from config | None |
| `shouldUseIntegerValues` | Checks if chart should use integer formatting | None |
| `formatNumber` | Formats a number based on chart config | `shouldUseIntegerValues` |
| `getActiveDatasets` | Filters active datasets from chart data | None |
| `calculateStats` | Calculates min, max, avg from datasets | None |
| `createStatisticalAnnotations` | Creates annotations for statistical indicators | `window.i18n.__` |

## data_components.js

Functions for fetching and processing chart data.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `fetchChartData` | Fetches chart data from ThingSpeak API | `getDateRange`, `fetchTimeRangeData` |
| `fetchTimeRangeData` | Fetches data for a specific time range | `fetchSingleSeries` |
| `fetchSingleSeries` | Fetches data for a single data series | None |
| `processChartData` | Processes raw data for chart rendering | `getUnitForChart` |
| `getDateRange` | Gets date range based on code | `moment` |
| `getUnitForChart` | Determines unit based on chart ID | None |
| `shouldUseIntegerValues` | Checks if chart should use integers | None |
| `formatChartNumber` | Formats a number for display | `shouldUseIntegerValues` |

## date_utils.js

Utility functions for date handling.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `getDateRange` | Gets date range based on selection | `moment` |
| `getURLParameter` | Gets parameters from URL | None |

## header_components.js

Components for the header UI section.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `createLogoContainer` | Creates the logo container element | `window.i18n.__` |
| `createDataChip` | Creates a data chip element with icon and value | `window.i18n.__` |
| `createWeatherPill` | Creates the weather pill container element | `window.i18n.__` |
| `createDataContainer` | Creates the data container with all data chips | `createDataChip`, `createWeatherPill` |
| `createDateChip` | Creates a date chip element | `window.i18n.__` |
| `createDateRanges` | Creates the date ranges container with all date chips | `createDateChip` |
| `createSearchContainer` | Creates the search container with sorting and results options | `window.i18n.__` |
| `createHeader` | Creates the complete header element with all components | `createLogoContainer`, `createDataContainer`, `createDateRanges`, `createSearchContainer` |

## translations.js

Internationalization functions.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `__` | Gets translated string for current language | `translations`, `currentLanguage` |
| `setLanguage` | Changes the current language | `translations`, `localStorage`, `window.moment`, `updatePageLanguage` |
| `getCurrentLanguage` | Gets the current language code | `currentLanguage` |
| `updatePageLanguage` | Updates all translatable elements | `__` |

## script.js

Main application script.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `toggleDarkMode` | Toggles between dark/light mode | `updateChartColors`, `localStorage` |
| `updateChartColors` | Updates chart colors based on theme | `window.chartInstances` |
| `toggleStats` | Toggles statistics display | `localStorage`, `window.chartInstances` |
| `fetchData` | Fetches initial data for header | `getElements`, `status`, `moment`, `updateUIWithLatestData` |

## data.js

Functions for data fetching and UI updates.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `getElements` | Gets references to DOM elements | `document.getElementById` |
| `fetchData` | Fetches data from ThingSpeak API | `getElements`, `Promise.all`, `status`, `moment`, `updateUIWithLatestData` |
| `status` | Extracts status info from API response | None |
| `getClassName` | Determines CSS class based on temperature value | None |
| `getBatteryClassName` | Determines CSS class based on battery level | None |
| `getPressureClassName` | Determines CSS class based on pressure value | None |
| `getWindowText` | Gets text description for window opening value | None |
| `getLightText` | Gets text description for light level value | None |
| `updateUIWithLatestData` | Updates UI elements with latest data | `getElements`, `getClassName`, `getBatteryClassName`, `getPressureClassName`, `getWindowText`, `getLightText`, `window.i18n.__` |

## weather.js

Weather data handling.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `getWeatherElements` | Gets references to weather DOM elements | `document.getElementById` |
| `log` | Logger function with debug toggle | None |
| `fetchWeather` | Fetches weather data from yr.no API | `getWeatherElements`, `localStorage`, `updateDisplay` |
| `updateDisplay` | Stores weather data and calls display update | `updateWeatherDisplay` |
| `updateWeatherDisplay` | Updates UI with weather data | `getWeatherElements`, `moment`, `window.i18n.__` |

## debug.js

Debug utilities for testing and development.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `initDebugMode` | Initialize debug mode if URL parameter present | `setupEnhancedLogging`, `addDebugUi`, `patchFetch` |
| `setupEnhancedLogging` | Set up enhanced console logging | None |
| `addDebugUi` | Adds debug UI elements to the page | `switchDebugTab`, `refreshDebugPanel` |
| `switchDebugTab` | Switch between debug panel tabs | `refreshDebugPanel` |
| `refreshDebugPanel` | Refresh debug panel content | `expandRequestDetails` |
| `expandRequestDetails` | Expand request details in the debug panel | None |
| `patchFetch` | Patch the fetch API to log network requests | None |
| `logComponentRender` | Log component rendering for debugging | None |
| `patchComponentFunctions` | Patch component creation functions | `logComponentRender` |

## language_switcher.js

Language switcher component.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `createLanguageSwitcher` | Creates a language switcher component with flags | `window.i18n.getCurrentLanguage`, `window.i18n.setLanguage` |
| `addLanguageSwitcherToHeader` | Add language switcher to the page header | `createLanguageSwitcher` |
