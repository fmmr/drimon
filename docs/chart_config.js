// Configuration for all charts with row-based layout
// Make available globally for script.js
window.chartConfigs = [
    // Define chart groupings for linked tooltips
    // Groups: temperature, humidity, weather, system, light, soil
    // Row 1
    { 
        id: 'chart-temp',
        titleKey: 'temperatureChart', 
        channel: 2568299, 
        field: 1, 
        color: '#c62828', // Red for temperature
        row: 1,
        category: 'temperature',
        unit: '°C',
        // For backward compatibility
        useIntegerFormat: false,
        // Structured formatting configuration
        formatting: {
            useIntegerFormat: false,
            decimalPlaces: 1 // Show 1 decimal place for most temperature values
        },
        // Structured indicator configuration
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true,
            colors: {
                min: '#4caf50', // Green for min
                max: '#ff5252', // Red for max
                avg: '#888888'  // Gray for average
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
        channel: 2568299, 
        field: 4, 
        color: '#8a5a44',
        row: 1,
        startDate: '2024-07-25 18:00:00',
        category: 'structure',
        unit: 'mm',
        useIntegerFormat: true,
        minValue: 50,  // Set minimum Y-axis value
        relatedCategories: ['temperature'],  // Show temperature values in tooltip
        indicateMax: true,
        indicateMin: true  // Add option to highlight the low value
    },
    // Multi-series chart for light measurements with dual y-axes
    {
        id: 'chart-light',
        titleKey: 'lightChart', 
        series: [
            {
                titleKey: 'ceiling',   // External/ceiling light
                channel: 2568299, 
                field: 8,
                color: '#e6a500',  // Yellow for light
                axis: 'y'          // Primary y-axis
            },
            {
                titleKey: 'internal',  // Internal light intensity
                channel: 2584547, 
                field: 5,
                color: '#8a5a00',  // Dark yellow for light intensity
                axis: 'y1'         // Secondary y-axis
            }
        ],
        row: 1,
        startDate: '2024-08-06 17:00:00',
        category: 'light',
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
        channel: 2584547, 
        field: 3, 
        color: '#4a6741', // Dark green for system
        row: 1,
        category: 'system',
        unit: '%',
        useIntegerFormat: true,
        indicateMin: true
    },

    // Row 2
    { 
        id: 'chart-temp-diff',
        titleKey: 'tempDiffChart', 
        channel: 2626867, 
        field: 3, 
        color: '#c62828',
        row: 2,
        category: 'temperature',
        unit: '°C',
        useIntegerFormat: false,
        indicateMin: true,
        indicateMax: true
    },
    // Multi-series chart combining cucumber and padron temperatures (positioned as 2nd chart in row 2)
    {
        id: 'chart-plants-temp',
        titleKey: 'plantsTempsChart',
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'cucumber',
                channel: 2584548,
                field: 3,
                color: '#e67e22'  // Orange-red for cucumber
            },
            {
                titleKey: 'padron',
                channel: 2584548,
                field: 5,
                color: '#9b59b6'  // Purple-red for padron
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plant-temperature',  // Custom category to separate from other temperature charts
        unit: '°C',
        useIntegerFormat: false
    },
    { 
        id: 'chart-out-temp',
        titleKey: 'outTempChart', 
        channel: 2626867, 
        field: 1, 
        color: '#c62828',
        row: 2,
        category: 'temperature',
        unit: '°C',
        useIntegerFormat: false,
        indicateMin: true,
        indicateMax: true
    },
    // Multi-series chart combining BME, AHT, and Floor temperature sensors
    {
        id: 'chart-sensors-temp',
        titleKey: 'sensorsTempsChart',
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'BME',  // Technical sensor name as the key itself
                title: 'BME',     // Same as key for readability
                channel: 2584548,
                field: 1,
                color: '#e67e22'  // Orange-red - reused from plant temp chart
            },
            {
                titleKey: 'AHT',  // Technical sensor name as the key itself
                title: 'AHT',     // Same as key for readability
                channel: 2584548,
                field: 2,
                color: '#9b59b6'  // Purple-red - reused from plant temp chart
            },
            {
                titleKey: 'floor',
                channel: 2584548,
                field: 4,
                color: '#2980b9'  // Blue for floor temperature - more contrast
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'detail-temperature',  // Custom category to separate from other temperature charts
        unit: '°C',
        useIntegerFormat: false
    },

    // Row 3
    { 
        id: 'chart-humidity',
        titleKey: 'humidityChart', 
        channel: 2568299, 
        field: 2, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        unit: '%',
        useIntegerFormat: true,
        indicateMin: true,
        indicateMax: true
    },
    { 
        id: 'chart-pressure',
        titleKey: 'pressureChart', 
        channel: 2568299, 
        field: 7, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        unit: 'hPa',
        // For backward compatibility
        useIntegerFormat: true,
        // Structured formatting configuration
        formatting: {
            useIntegerFormat: true // Always use integer format for pressure values
        },
        // Structured indicator configuration
        indicators: {
            showMin: false,
            showMax: false,
            showAvg: true
        }
    },
    { 
        id: 'chart-wind',
        titleKey: 'windChart', 
        channel: 2626867, 
        field: 5, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        unit: 'm/s',
        useIntegerFormat: false
    },
    { 
        id: 'chart-rain',
        titleKey: 'rainChart', 
        channel: 2626867, 
        field: 6, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather',
        unit: 'mm',
        useIntegerFormat: false
    },

    // Row 4
    // Multi-series chart for soil moisture
    {
        id: 'chart-soil-moisture',
        titleKey: 'soilMoistureChart', 
        series: [
            {
                titleKey: 'cucumber1',
                channel: 2584548, 
                field: 6,
                color: '#1976d2'  // Blue-green
            },
            {
                titleKey: 'cucumber2',
                channel: 2584548, 
                field: 7,
                color: '#388e3c'  // Medium green
            },
            {
                titleKey: 'padron',
                channel: 2584548, 
                field: 8,
                color: '#f9a825'  // Yellow-green
            }
        ],
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil-moisture',  // Custom category to separate from other soil charts
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
        channel: 2584547, 
        field: 2, 
        color: '#4a6741',
        row: 4,
        category: 'system',
        unit: 'V',
        // Use structured formatting config instead of special case in code
        formatting: {
            decimalPlaces: 1, // Always show 1 decimal place for battery voltage
            useIntegerFormat: false
        }
    },
    { 
        id: 'chart-wifi',
        titleKey: 'wifiChart', 
        channel: 2584547, 
        field: 1, 
        color: '#4a6741',
        row: 4,
        startDate: '2024-07-25 15:00:00',
        category: 'system',
        unit: 'dBm',
        useIntegerFormat: true,
        indicateMin: true
    },
    { 
        id: 'chart-time-used',
        titleKey: 'timeUsedChart', 
        channel: 2584547, 
        field: 4, 
        color: '#4a6741',
        row: 4,
        category: 'system',
        unit: 'ms',  // Adding missing unit
        useIntegerFormat: true
    },
];