// Configuration for all charts with row-based layout
// Make available globally for script.js
//
// Chart Configuration Properties:
// - id: Unique chart identifier
// - titleKey: Translation key for chart title
// - channel: ThingSpeak channel ID
// - field: ThingSpeak field number
// - color: Chart line color in hex format
// - row: Grid row position (1-4)
// - category: Chart category for filtering/grouping
// - unit: Display unit (°C, mm, lux, etc.)
// - useIntegerFormat: Whether to format values as integers
// - minValue: Minimum Y-axis value
// - formatting: Structured formatting options
//   - useIntegerFormat: Whether to format as integers
//   - decimalPlaces: Number of decimal places to display
// - statsLabelsStyle: Style for statistics labels (e.g., 'LAHN' for Low/Avg/High/Now)
// - indicators: Configuration for min/max/avg indicators
// - yAxis: Y-axis configuration options
// - dataTransform: Data transformation options:
//   - shiftBy: Shifts all values by specified amount (negative to shift down)
//   Example: { shiftBy: -63 }
// - categoryHeaderKey: Translation key for category headers in tooltips
//   Example: 'temperatures' for temperature category
// - defaultRange: Default range value for this chart when the 'default' date range is selected
//   Example: 13 for air pressure chart (shows 14 days by default)
// - disableSyncTimestamps: When true, maintains independent timestamps for each series
//   Useful for multi-series charts with data from different channels to prevent dotted lines
//
window.chartConfigs = [
    // Define chart groupings for linked tooltips
    // Groups: temperature, humidity, weather, system, light, soil
    // Row 1
    { 
        id: 'chart-temp',
        titleKey: 'temperatureChart', 
        channel: window.THINGSPEAK.DRIMON_CHANNEL, 
        field: 1, 
        color: '#c62828', // Red for temperature
        row: 1,
        category: 'temperature',
        categoryHeaderKey: 'temperatures', // Translation key for category headers in tooltips
        unit: '°C',
        // For backward compatibility
        useIntegerFormat: false,
        // Structured formatting configuration
        formatting: {
            useIntegerFormat: false,
            decimalPlaces: 1 // Show 1 decimal place for most temperature values
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Use LAHN (Low/Avg/High/Now) style for statistics labels
        statsLabelsStyle: 'LAHN',
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true,
            colors: {
                min: '#1e88e5', // Blue downward triangle
                max: '#4caf50', // Green upward triangle
                avg: '#888888'  // Gray for average line
            }
        },
        // Structured y-axis configuration
        yAxis: {
            position: 'right',
            beginAtZero: false, // Don't force zero for temperature
            gridColor: 'rgba(0, 0, 0, 0.05)'
        }
    },
    { 
        id: 'chart-window',
        titleKey: 'windowChart', 
        channel: window.THINGSPEAK.DRIMON_CHANNEL, 
        field: 4, 
        color: '#8a5a44',
        row: 1,
        startDate: '2024-07-25 18:00:00',
        category: 'structure',
        categoryHeaderKey: 'structure', // Translation key for category headers in tooltips
        unit: 'mm',
        useIntegerFormat: true,
        // Use both options to ensure consistent integer formatting
        formatting: {
            useIntegerFormat: true,
            decimalPlaces: 0  // Force exactly 0 decimal places
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        minValue: 0,  // Changed from 50 to 0 since values will be normalized
        relatedCategories: ['temperature'],  // Show temperature values in tooltip
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        },
        // Add data transformation configuration
        dataTransform: {
            shiftBy: -63  // Shift all values down by 63mm (actually seen 57 in winter)
        },
        // Structured y-axis configuration
        yAxis: {
            beginAtZero: true,    // Always start at 0
            min: 0,               // Force minimum to be 0
            gridColor: 'rgba(0, 0, 0, 0.05)'
        }
    },
    // Multi-series chart for light measurements with dual y-axes
    {
        id: 'chart-light',
        titleKey: 'lightChart',
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Disable synchronization for this chart to preserve all data points
        disableSyncTimestamps: true,
        // Add special handling to show values in the legend
        specialHandling: {
            consistentLegendLabels: true
        },
        series: [
            {
                titleKey: 'ceiling',   // External/ceiling light
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 8,
                color: '#e6a500',  // Yellow for light
                axis: 'y'          // Primary y-axis
            },
            {
                titleKey: 'internal',  // Internal light intensity
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 5,
                color: '#8a5a00',  // Dark yellow for light intensity
                axis: 'y1',        // Secondary y-axis
                // No need for extra results
                extraResults: 10000
            }
        ],
        row: 1,
        startDate: '2024-08-06 17:00:00',
        category: 'light',
        categoryHeaderKey: 'light', // Translation key for category headers in tooltips
        unit: 'lux',
        // For backward compatibility
        useIntegerFormat: true,
        // Structured formatting configuration
        formatting: {
            useIntegerFormat: true // Always use integer format for light values
        },
        secondYAxis: true,          // Enable second y-axis
        // Structured y-axis configuration
        yAxis: {
            gridColor: 'rgba(0, 0, 0, 0.05)',
            gridLineWidth: 1,
            drawBorder: false,
            beginAtZero: true       // Always start at 0 for light measurements
        }
    },
    { 
        id: 'chart-battery',
        titleKey: 'batteryPercentChart', 
        channel: window.THINGSPEAK.TECH_CHANNEL, 
        field: 3, 
        color: '#4a6741', // Dark green for system
        row: 1,
        category: 'system',
        categoryHeaderKey: 'system', // Translation key for category headers in tooltips
        unit: '%',
        useIntegerFormat: true,
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showAvg: true
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 6
    },

    // Row 2
    { 
        id: 'chart-out-temp',
        titleKey: 'outTempChart', 
        channel: window.THINGSPEAK.EXT_CHANNEL, 
        field: 1, 
        color: '#c62828',
        row: 2,
        category: 'temperature',
        categoryHeaderKey: 'temperatures', // Translation key for category headers in tooltips
        unit: '°C',
        useIntegerFormat: false,
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Use LAHN (Low/Avg/High/Now) style for statistics labels
        statsLabelsStyle: 'LAHN',
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        }
    },
    { 
        id: 'chart-temp-diff',
        titleKey: 'tempDiffChart', 
        channel: window.THINGSPEAK.EXT_CHANNEL, 
        field: 3, 
        color: '#c62828',
        row: 2,
        category: 'temperature',
        categoryHeaderKey: 'temperatures', // Translation key for category headers in tooltips
        unit: '°C',
        useIntegerFormat: false,
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Use LAHN (Low/Avg/High/Now) style for statistics labels
        statsLabelsStyle: 'LAHN',
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        }
    },
    // Multi-series chart combining cucumber and padron temperatures (positioned as 2nd chart in row 2)
    {
        id: 'chart-plants-temp',
        titleKey: 'plantsTempsChart',
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Add special handling to show values in the legend
        specialHandling: {
            consistentLegendLabels: true
        },
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'cucumber',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 3,
                color: '#e67e22'  // Orange-red for cucumber
            },
            {
                titleKey: 'padron',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 5,
                color: '#9b59b6'  // Purple-red for padron
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plant-temperature',  // Custom category to separate from other temperature charts
        categoryHeaderKey: 'temperatures', // Use standard temperatures key for translation
        unit: '°C',
        useIntegerFormat: false
    },
    // Multi-series chart combining BME, AHT, and Floor temperature sensors
    {
        id: 'chart-sensors-temp',
        titleKey: 'sensorsTempsChart',
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Add special handling to show values in the legend
        specialHandling: {
            consistentLegendLabels: true
        },
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'BME',  // Technical sensor name as the key itself
                title: 'BME',     // Same as key for readability
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 1,
                color: '#e67e22'  // Orange-red - reused from plant temp chart
            },
            {
                titleKey: 'AHT',  // Technical sensor name as the key itself
                title: 'AHT',     // Same as key for readability
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 2,
                color: '#9b59b6'  // Purple-red - reused from plant temp chart
            },
            {
                titleKey: 'floor',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 4,
                color: '#2980b9'  // Blue for floor temperature - more contrast
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'detail-temperature',  // Custom category to separate from other temperature charts
        categoryHeaderKey: 'temperatures', // Use standard temperatures key for translation
        unit: '°C',
        useIntegerFormat: false
    },

    // Row 3
    { 
        id: 'chart-humidity',
        titleKey: 'humidityChart', 
        channel: window.THINGSPEAK.DRIMON_CHANNEL, 
        field: 2, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather', // Translation key for category headers in tooltips
        unit: '%',
        useIntegerFormat: true,
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        }
    },
    { 
        id: 'chart-temperature',
        titleKey: 'pressureChart', 
        channel: window.THINGSPEAK.DRIMON_CHANNEL, 
        field: 7, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather', // Translation key for category headers in tooltips
        unit: 'hPa',
        // For backward compatibility
        useIntegerFormat: true,
        // Structured formatting configuration
        formatting: {
            useIntegerFormat: true // Always use integer format for temperature values
        },
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 13
    },
    { 
        id: 'chart-wind',
        titleKey: 'windChart', 
        channel: window.THINGSPEAK.EXT_CHANNEL, 
        field: 5, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather', // Translation key for category headers in tooltips
        unit: 'm/s',
        useIntegerFormat: false,
        // Default range for this chart when using the 'default' date range
        defaultRange: 1
    },
    { 
        id: 'chart-rain',
        titleKey: 'rainChart', 
        channel: window.THINGSPEAK.EXT_CHANNEL, 
        field: 6, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather', // Translation key for category headers in tooltips
        unit: 'mm',
        useIntegerFormat: false,
        // Default range for this chart when using the 'default' date range
        defaultRange: 13
    },

    // Row 4
    // Multi-series chart for soil moisture
    {
        id: 'chart-soil-moisture',
        titleKey: 'soilMoistureChart', 
        // Default range for this chart when using the 'default' date range
        defaultRange: 1,
        series: [
            {
                titleKey: 'cucumber1',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 6,
                color: '#1976d2'  // Blue-green
            },
            {
                titleKey: 'cucumber2',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 7,
                color: '#388e3c'  // Medium green
            },
            {
                titleKey: 'padron',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 8,
                color: '#f9a825'  // Yellow-green
            }
        ],
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil-moisture',  // Custom category to separate from other soil charts
        categoryHeaderKey: 'soil', // Translation key for category headers in tooltips
        unit: '%',
        useIntegerFormat: true,
        // Add special handling flag for soil moisture chart to avoid ID checks in code
        specialHandling: {
          consistentLegendLabels: true  // Ensures dataset.label and legend text are consistent
        }
    },
    { 
        id: 'chart-battery-voltage',
        titleKey: 'batteryVoltageChart', 
        channel: window.THINGSPEAK.TECH_CHANNEL, 
        field: 2, 
        color: '#4a6741',
        row: 4,
        category: 'system',
        categoryHeaderKey: 'system', // Translation key for category headers in tooltips
        unit: 'V',
        // Use structured formatting config instead of special case in code
        formatting: {
            decimalPlaces: 1, // Always show 1 decimal place for battery voltage
            useIntegerFormat: false
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 6
    },
    { 
        id: 'chart-wifi',
        titleKey: 'wifiChart', 
        channel: window.THINGSPEAK.TECH_CHANNEL, 
        field: 1, 
        color: '#4a6741',
        row: 4,
        startDate: '2024-07-25 15:00:00',
        category: 'system',
        categoryHeaderKey: 'system', // Translation key for category headers in tooltips
        unit: 'dBm',
        useIntegerFormat: true,
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        },
        // Default range for this chart when using the 'default' date range
        defaultRange: 30
    },
    { 
        id: 'chart-time-used',
        titleKey: 'timeUsedChart', 
        channel: window.THINGSPEAK.TECH_CHANNEL, 
        field: 4, 
        color: '#4a6741',
        row: 4,
        category: 'system',
        categoryHeaderKey: 'system', // Translation key for category headers in tooltips
        unit: 'ms',  // Adding missing unit
        useIntegerFormat: true,
        // Default range for this chart when using the 'default' date range
        defaultRange: 1
    },
];