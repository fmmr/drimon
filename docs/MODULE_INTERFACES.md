# DriMon Module Interfaces

This document details the interfaces between modules in the refactored architecture. It defines how modules should communicate with each other, their expected inputs and outputs, and the patterns they should use.

## Interface Design Principles

1. **Explicit Dependencies**: Modules should explicitly import their dependencies
2. **Pure Functions**: Prefer pure functions where possible
3. **Minimal Interfaces**: Keep interfaces narrow and focused
4. **Consistent Error Handling**: Use consistent patterns for error handling
5. **Event-Based Communication**: Use events for cross-cutting concerns
6. **Type Safety**: Document parameter and return types

## Core Module Interfaces

### Utils Module Interface (Implemented)

```javascript
/**
 * Core utilities module
 * @module core/utils
 */

/**
 * Format a date according to locale and format string
 * @param {Date|string} date - Date to format
 * @param {string} [format='LLL'] - Format string (moment.js format)
 * @param {string} [locale] - Optional locale override
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'LLL', locale = null) { /* ... */ }

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format relative to now
 * @param {string} [locale] - Optional locale override
 * @returns {string} Relative time string
 */
function formatRelativeTime(date, locale = null) { /* ... */ }

/**
 * Get URL parameter by name
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null if not found
 */
function getURLParameter(name) { /* ... */ }

/**
 * Format a number for display
 * @param {number} value - Number to format
 * @param {Object} options - Formatting options
 * @param {boolean} [options.useInteger=false] - Whether to format as integer
 * @param {number} [options.decimals] - Number of decimal places
 * @param {string} [options.unit=''] - Unit to append
 * @param {number} [options.range=0] - Data range for dynamic precision
 * @returns {string} Formatted number
 */
function formatNumber(value, options = {}) { /* ... */ }

/**
 * Get range of dates based on predefined options
 * @param {string} rangeCode - Range identifier (e.g., 'today', '7d')
 * @returns {Object} Object with startDate and endDate
 */
function getDateRange(rangeCode) { /* ... */ }

/**
 * Create DOM element with attributes and children
 * @param {string} tagName - HTML tag name
 * @param {Object} [attributes={}] - HTML attributes
 * @param {Array|Node|string} [children] - Child elements or text
 * @returns {HTMLElement} Created DOM element
 */
function createElement(tagName, attributes = {}, children = null) { /* ... */ }

/**
 * Add an event listener with proper cleanup
 * @param {Element} element - DOM element to attach listener to
 * @param {string} event - Event name (e.g., 'click')
 * @param {Function} handler - Event handler function
 * @param {Object} [options] - Event listener options 
 * @returns {Function} Function to remove the event listener
 */
function addEventListenerWithCleanup(element, event, handler, options) { /* ... */ }

/**
 * Add multiple event listeners with single cleanup function
 * @param {Element} element - DOM element to attach listeners to
 * @param {Object} eventMap - Map of event names to handler functions
 * @param {Object} [options] - Event listener options
 * @returns {Function} Function to remove all event listeners
 */
function addMultipleEventListeners(element, eventMap, options) { /* ... */ }

/**
 * Debounce a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) { /* ... */ }

/**
 * Throttle a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) { /* ... */ }

/**
 * Calculate statistics from an array of values
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Statistics object with min, max, avg, and currentValue properties
 */
function calculateStatistics(values) { /* ... */ }

/**
 * Create a simple event emitter
 * @returns {Object} Event emitter object with on, off, emit, and once methods
 */
function createEventEmitter() { /* ... */ }

/**
 * Convert object to query string
 * @param {Object} data - Data object to convert to query string
 * @returns {string} URL query parameters string
 */
function toQueryString(data) { /* ... */ }

/**
 * Parse query string into object
 * @param {string} queryString - URL query string (with or without leading ?)
 * @returns {Object} Parsed query parameters
 */
function parseQueryString(queryString) { /* ... */ }
```

### I18n Module Interface

```javascript
/**
 * Internationalization module
 * @module core/i18n
 */

/**
 * Get translation for a key
 * @param {string} key - Translation key
 * @param {Object} [replacements={}] - Replacement values for placeholders
 * @returns {string} Translated string
 */
function __(key, replacements = {}) { /* ... */ }

/**
 * Set current language
 * @param {string} languageCode - Language code (e.g., 'en', 'no')
 * @returns {boolean} Success flag
 * @fires languageChanged
 */
function setLanguage(languageCode) { /* ... */ }

/**
 * Get current language code
 * @returns {string} Current language code
 */
function getCurrentLanguage() { /* ... */ }

/**
 * Check if a translation key exists
 * @param {string} key - Translation key to check
 * @returns {boolean} True if key exists
 */
function hasTranslation(key) { /* ... */ }

/**
 * Get list of available languages
 * @returns {Array<string>} Array of language codes
 */
function getAvailableLanguages() { /* ... */ }

/**
 * Register a listener for language changes
 * @param {Function} callback - Function to call when language changes
 * @returns {Function} Function to remove the listener
 */
function onLanguageChanged(callback) { /* ... */ }
```

### Config Module Interface (Implemented)

```javascript
/**
 * Configuration module
 * @module core/config
 * 
 * This module implements a configuration-driven approach where:
 * - All chart properties must be explicitly defined in the configuration
 * - No implicit behavior based on chart IDs or naming conventions
 * - All configurations are validated against a schema
 * - Default values are applied where not specified
 */

/**
 * Initialize configuration
 * @param {Object} config - Application configuration
 * @returns {boolean} Success flag
 */
function initialize(config) { /* ... */ }

/**
 * Validate a chart configuration against the schema
 * @param {Object} config - Chart configuration
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateChartConfig(config) { /* ... */ }

/**
 * Validate application configuration
 * @param {Object} config - Application configuration
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateAppConfig(config) { /* ... */ }

/**
 * Get chart configuration by ID
 * @param {string} chartId - Chart ID
 * @returns {Object|null} Chart configuration or null if not found
 */
function getChartConfig(chartId) { /* ... */ }

/**
 * Get all chart configurations
 * @returns {Array<Object>} Array of chart configurations
 */
function getAllChartConfigs() { /* ... */ }

/**
 * Get charts for a specific row
 * @param {number} rowNumber - Row number
 * @returns {Array<Object>} Array of chart configurations for the row
 */
function getChartsForRow(rowNumber) { /* ... */ }

/**
 * Get charts by category
 * @param {string} category - Category name
 * @returns {Array<Object>} Array of chart configurations for the category
 */
function getChartsByCategory(category) { /* ... */ }

/**
 * Get the unit for a chart from its configuration
 * @param {string|Object} chartIdOrConfig - Chart ID or config object
 * @returns {string} Unit string or empty string if not found
 */
function getUnitForChart(chartIdOrConfig) { /* ... */ }

/**
 * Check if a chart should use integer formatting
 * @param {Object} config - Chart configuration
 * @returns {boolean} True if chart should use integer values
 */
function shouldUseIntegerValues(config) { /* ... */ }

/**
 * Get application configuration value
 * @param {string} key - Configuration key
 * @param {*} [defaultValue] - Default value if key not found
 * @returns {*} Configuration value
 */
function getConfig(key, defaultValue = null) { /* ... */ }

/**
 * Set application configuration value
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function setConfig(key, value) { /* ... */ }
```

## Data Module Interfaces

### API Module Interface

```javascript
/**
 * API client module
 * @module data/api
 */

/**
 * Fetch data from ThingSpeak API
 * @param {Object} options - Request options
 * @param {number} options.channel - Channel ID
 * @param {number} options.field - Field number
 * @param {string} [options.startDate] - Start date (ISO format)
 * @param {string} [options.endDate] - End date (ISO format)
 * @param {number} [options.results=8000] - Maximum results
 * @returns {Promise<Object>} Promise resolving to API response
 */
function fetchThingSpeakData(options) { /* ... */ }

/**
 * Fetch weather data from Met API
 * @param {Object} options - Request options
 * @param {number} options.lat - Latitude
 * @param {number} options.lon - Longitude
 * @returns {Promise<Object>} Promise resolving to weather data
 */
function fetchWeatherData(options) { /* ... */ }

/**
 * Set request timeout
 * @param {number} timeout - Timeout in milliseconds
 */
function setTimeout(timeout) { /* ... */ }

/**
 * Set request headers
 * @param {Object} headers - Request headers
 */
function setHeaders(headers) { /* ... */ }

/**
 * Register error handler
 * @param {Function} handler - Error handler function
 */
function onError(handler) { /* ... */ }
```

### Data Fetcher Module Interface

```javascript
/**
 * Data fetcher module
 * @module data/data-fetcher
 */

/**
 * Fetch data for a chart
 * @param {Object} config - Chart configuration
 * @param {string|number} range - Date range code or days
 * @param {number} [results=8000] - Maximum results
 * @returns {Promise<Object>} Promise resolving to chart data
 */
function fetchChartData(config, range, results = 8000) { /* ... */ }

/**
 * Fetch data for all charts
 * @param {string|number} range - Date range code or days
 * @param {number} [results=8000] - Maximum results
 * @returns {Promise<Array<Object>>} Promise resolving to array of chart data
 */
function fetchAllChartsData(range, results = 8000) { /* ... */ }

/**
 * Fetch latest sensor data for header
 * @returns {Promise<Object>} Promise resolving to latest sensor data
 */
function fetchLatestData() { /* ... */ }

/**
 * Clear cached data
 * @param {string} [chartId] - Specific chart ID to clear, or all if omitted
 */
function clearCache(chartId) { /* ... */ }

/**
 * Register data fetch listener
 * @param {Function} callback - Function to call when data is fetched
 * @returns {Function} Function to unregister the listener
 */
function onDataFetched(callback) { /* ... */ }
```

### Data Processor Module Interface

```javascript
/**
 * Data processor module
 * @module data/data-processor
 */

/**
 * Process chart data
 * @param {Object} config - Chart configuration
 * @param {Object} data - Raw API data
 * @returns {Object} Processed chart data
 */
function processChartData(config, data) { /* ... */ }

/**
 * Process multi-series chart data
 * @param {Object} config - Chart configuration
 * @param {Array<Object>} seriesData - Array of raw API data
 * @returns {Object} Processed multi-series data
 */
function processMultiSeriesData(config, seriesData) { /* ... */ }

/**
 * Calculate statistics for chart data
 * @param {Array<number>} values - Array of data values
 * @returns {Object} Object with min, max, and avg values
 */
function calculateStatistics(values) { /* ... */ }

/**
 * Get data range information
 * @param {Array<number>} values - Array of data values
 * @returns {Object} Object with min, max, range, and padding values
 */
function getDataRange(values) { /* ... */ }
```

## Component Module Interfaces

### Chart Factory Module Interface

```javascript
/**
 * Chart factory module
 * @module components/charts/chart-factory
 */

/**
 * Create chart instance
 * @param {string} chartId - Chart ID
 * @param {Object} config - Chart configuration
 * @param {HTMLElement} container - DOM container
 * @returns {Object} Chart instance
 */
function createChart(chartId, config, container) { /* ... */ }

/**
 * Create chart container
 * @param {Object} config - Chart configuration
 * @param {boolean} [isMobile=false] - Whether in mobile mode
 * @returns {HTMLElement} Chart container element
 */
function createChartContainer(config, isMobile = false) { /* ... */ }

/**
 * Register chart type
 * @param {string} type - Chart type identifier
 * @param {Function} factory - Chart creation function
 */
function registerChartType(type, factory) { /* ... */ }

/**
 * Destroy chart instance
 * @param {string} chartId - Chart ID
 * @returns {boolean} Success flag
 */
function destroyChart(chartId) { /* ... */ }

/**
 * Get chart instance
 * @param {string} chartId - Chart ID
 * @returns {Object|null} Chart instance or null if not found
 */
function getChartInstance(chartId) { /* ... */ }
```

### Chart Renderer Module Interface

```javascript
/**
 * Chart renderer module
 * @module components/charts/chart-renderer
 */

/**
 * Initialize chart layout
 * @returns {void}
 */
function initializeChartLayout() { /* ... */ }

/**
 * Render chart with data
 * @param {Object} chart - Chart instance
 * @param {Object} data - Chart data
 * @returns {void}
 */
function renderChart(chart, data) { /* ... */ }

/**
 * Update chart with new data
 * @param {Object} chart - Chart instance
 * @param {Object} data - New chart data
 * @returns {void}
 */
function updateChart(chart, data) { /* ... */ }

/**
 * Resize all charts
 * @returns {void}
 */
function resizeAllCharts() { /* ... */ }

/**
 * Show loading indicator for chart
 * @param {string} chartId - Chart ID
 * @param {string} [message] - Optional loading message
 * @returns {void}
 */
function showLoading(chartId, message) { /* ... */ }

/**
 * Hide loading indicator for chart
 * @param {string} chartId - Chart ID
 * @returns {void}
 */
function hideLoading(chartId) { /* ... */ }
```

### Annotations Module Interface

```javascript
/**
 * Chart annotations module
 * @module components/charts/annotations
 */

/**
 * Create annotations for chart
 * @param {Object} config - Chart configuration
 * @param {Object} statistics - Statistical data
 * @param {Object} chartData - Chart data
 * @returns {Object} Annotations configuration
 */
function createAnnotations(config, statistics, chartData) { /* ... */ }

/**
 * Update annotations
 * @param {Object} chart - Chart instance
 * @param {Object} statistics - New statistical data
 * @returns {void}
 */
function updateAnnotations(chart, statistics) { /* ... */ }

/**
 * Add custom annotation
 * @param {Object} chart - Chart instance
 * @param {Object} annotation - Annotation configuration
 * @returns {string} Annotation ID
 */
function addAnnotation(chart, annotation) { /* ... */ }

/**
 * Remove annotation
 * @param {Object} chart - Chart instance
 * @param {string} annotationId - Annotation ID
 * @returns {boolean} Success flag
 */
function removeAnnotation(chart, annotationId) { /* ... */ }
```

### Statistics Module Interface

```javascript
/**
 * Chart statistics module
 * @module components/charts/statistics
 */

/**
 * Calculate statistics for chart data
 * @param {Object} chart - Chart instance
 * @returns {Object} Statistics object
 */
function calculateChartStatistics(chart) { /* ... */ }

/**
 * Update statistics display
 * @param {string} chartId - Chart ID
 * @param {Object} statistics - Statistics object
 * @param {boolean} [isMultiSeries=false] - Whether chart is multi-series
 * @returns {void}
 */
function updateStatisticsDisplay(chartId, statistics, isMultiSeries = false) { /* ... */ }

/**
 * Format statistical value
 * @param {number} value - Value to format
 * @param {Object} config - Chart configuration
 * @param {number} [range] - Data range for precision
 * @returns {string} Formatted value
 */
function formatStatisticValue(value, config, range) { /* ... */ }

/**
 * Create statistics container
 * @param {string} chartId - Chart ID
 * @returns {HTMLElement} Statistics container
 */
function createStatisticsContainer(chartId) { /* ... */ }
```

### Header Module Interface

```javascript
/**
 * Header module
 * @module components/header/header
 */

/**
 * Create header
 * @returns {HTMLElement} Header element
 */
function createHeader() { /* ... */ }

/**
 * Update header with data
 * @param {Object} data - Sensor data
 * @returns {void}
 */
function updateHeaderData(data) { /* ... */ }

/**
 * Register header event handler
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Function to unregister handler
 */
function onHeaderEvent(event, handler) { /* ... */ }

/**
 * Add component to header
 * @param {string} position - Position identifier
 * @param {HTMLElement} component - Component to add
 * @returns {void}
 */
function addHeaderComponent(position, component) { /* ... */ }
```

## Event System Interface

```javascript
/**
 * Event system
 * @module core/events
 */

/**
 * Register event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} Unregister function
 */
function on(event, callback) { /* ... */ }

/**
 * Unregister event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 * @returns {boolean} Success flag
 */
function off(event, callback) { /* ... */ }

/**
 * Emit event
 * @param {string} event - Event name
 * @param {Object} [data] - Event data
 * @returns {void}
 */
function emit(event, data) { /* ... */ }

/**
 * Register one-time event listener
 * @param {string} event - Event name
 * @param {Function} callback - Event callback
 * @returns {Function} Unregister function
 */
function once(event, callback) { /* ... */ }
```

## Standard Events

The application should emit and listen for these standard events:

| Event Name | Description | Data |
|------------|-------------|------|
| `languageChanged` | Language has been changed | `{ language: string }` |
| `themeChanged` | Theme has been changed | `{ theme: 'light' \| 'dark' }` |
| `dataFetched` | New data has been fetched | `{ chartId: string, data: Object }` |
| `chartCreated` | Chart has been created | `{ chartId: string, instance: Object }` |
| `chartUpdated` | Chart has been updated | `{ chartId: string, instance: Object }` |
| `chartDestroyed` | Chart has been destroyed | `{ chartId: string }` |
| `layoutChanged` | Layout has changed | `{ isMobile: boolean }` |
| `rangeChanged` | Date range has changed | `{ range: string, results: number }` |
| `error` | An error has occurred | `{ source: string, message: string, details: Object }` |

## Module Import/Export Pattern

Modules should export their public interface:

```javascript
// Example module export (ES modules syntax)
export {
    formatDate,
    formatRelativeTime,
    getURLParameter,
    // ...other functions
};

// Default export
export default {
    formatDate,
    formatRelativeTime,
    getURLParameter,
    // ...other functions
};
```

For backward compatibility during refactoring, modules can also expose their interface through the window object:

```javascript
// Backward compatibility
if (typeof window !== 'undefined') {
    window.Utils = {
        formatDate,
        formatRelativeTime,
        getURLParameter,
        // ...other functions
    };
}
```

## Error Handling

All modules should use a consistent error handling pattern:

1. Functions should validate their inputs
2. Async functions should return promises that reject with descriptive errors
3. Error objects should include:
   - `message`: Human-readable error message
   - `code`: Error code for programmatic handling
   - `details`: Additional error details

Example error handling:

```javascript
async function fetchChartData(config, range) {
    if (!config) {
        throw new Error('Chart configuration is required');
    }
    
    try {
        const response = await api.fetchThingSpeakData({ 
            channel: config.channel,
            // ...other options
        });
        
        return processChartData(config, response);
    } catch (error) {
        // Emit error event
        Events.emit('error', {
            source: 'data-fetcher',
            message: `Failed to fetch data for chart ${config.id}`,
            details: error
        });
        
        // Re-throw with better context
        throw new Error(`Failed to fetch data for chart ${config.id}: ${error.message}`);
    }
}
```

## Testing Guidelines

When developing tests for modules, follow these key principles:

1. **Import production code directly** - Never duplicate production code in test files. Tests should import the actual code they're testing to ensure they validate the real implementation.

2. **Use real data** - Tests should use real API endpoints and real data when possible rather than mocked data. This approach helps identify actual integration issues.

3. **Keep test code isolated** - Test-specific code (HTML, CSS, and JavaScript) should only contain what's needed to run the tests, not duplicate production code.

4. **Test before commit** - All code should be manually tested before any commits. Never commit to git without explicit approval to avoid introducing bugs to production.

5. **Test at component boundaries** - Focus testing on the public interfaces of modules rather than internal implementations.

6. **Test imports in your tests** - Ensure that all imports are correctly working in your tests to catch module resolution issues.

Example test structure:

```javascript
// Import the production code directly
import { formatNumber } from '../core/utils.js';

// Test utility functions - not duplicated from production
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
    }
}

// Test with real values
function testFormatNumber() {
    assertEqual(formatNumber(42.5, { useInteger: true }), '43', 'Should round to integer');
    assertEqual(formatNumber(42.5, { decimals: 2 }), '42.50', 'Should use specified decimals');
    // Additional tests...
}
```
```

## Module Interaction Examples

### Creating and Updating a Chart

```javascript
// 1. Get chart configuration
const config = Config.getChartConfig('chart-temp');

// 2. Create chart container
const container = ChartFactory.createChartContainer(config);
document.getElementById('chartContainer').appendChild(container);

// 3. Create chart instance
const chart = ChartFactory.createChart('chart-temp', config, container);

// 4. Show loading state
ChartRenderer.showLoading('chart-temp');

// 5. Fetch data
DataFetcher.fetchChartData(config, '1d')
    .then(data => {
        // 6. Render chart with data
        ChartRenderer.renderChart(chart, data);
        
        // 7. Hide loading state
        ChartRenderer.hideLoading('chart-temp');
        
        // 8. Calculate statistics
        const stats = Statistics.calculateChartStatistics(chart);
        
        // 9. Update statistics display
        Statistics.updateStatisticsDisplay('chart-temp', stats, false);
    })
    .catch(error => {
        // Handle error
        console.error('Failed to fetch chart data:', error);
    });
```

### Language Switching

```javascript
// 1. Register for language change events
Events.on('languageChanged', ({ language }) => {
    // 2. Update moment locale
    if (language === 'no') {
        moment.locale('nb');
    } else {
        moment.locale(language);
    }
    
    // 3. Update all charts
    Object.values(ChartFactory.getAllChartInstances()).forEach(chart => {
        ChartRenderer.updateChartLanguage(chart);
    });
    
    // 4. Update header
    HeaderModule.translateHeader();
});

// 5. Handle language switch click
function handleLanguageSwitch(languageCode) {
    // 6. Set new language
    I18n.setLanguage(languageCode);
    
    // Event will be emitted by setLanguage
}
```

This comprehensive interface documentation should guide the implementation of the refactored architecture, ensuring that modules interact in a consistent and maintainable way.