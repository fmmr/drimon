// Configuration for all charts with row-based layout
// Make available globally for script.js
window.chartConfigs = [
    // Define chart groupings for linked tooltips
    // Groups: temperature, humidity, weather, system, light, soil
    // Row 1
    { 
        id: 'chart-temp',
        title: 'Temperatur', 
        channel: 2568299, 
        field: 1, 
        color: '#c62828', // Red for temperature
        row: 1,
        category: 'temperature'
    },
    { 
        id: 'chart-window',
        title: 'Vindusåpning', 
        channel: 2568299, 
        field: 4, 
        color: '#8a5a44',
        row: 1,
        startDate: '2024-07-25 18:00:00',
        category: 'structure',
        minValue: 50  // Set minimum Y-axis value
    },
    // Multi-series chart for light measurements with dual y-axes
    {
        id: 'chart-light',
        title: 'Lys', 
        series: [
            {
                title: 'Tak',       // External/ceiling light
                channel: 2568299, 
                field: 8,
                color: '#e6a500',  // Yellow for light
                axis: 'y'          // Primary y-axis
            },
            {
                title: 'Intern',    // Internal light intensity
                channel: 2584547, 
                field: 5,
                color: '#8a5a00',  // Dark yellow for light intensity
                axis: 'y1'         // Secondary y-axis
            }
        ],
        row: 1,
        startDate: '2024-08-06 17:00:00',
        category: 'light',
        secondYAxis: true          // Enable second y-axis
    },
    { 
        id: 'chart-battery',
        title: 'Batteri (%)', 
        channel: 2584547, 
        field: 3, 
        color: '#4a6741', // Dark green for system
        row: 1,
        category: 'system'
    },

    // Row 2
    { 
        id: 'chart-temp-diff',
        title: 'Temperatur Diff', 
        channel: 2626867, 
        field: 3, 
        color: '#c62828',
        row: 2,
        category: 'temperature'
    },
    // Multi-series chart combining cucumber and padron temperatures (positioned as 2nd chart in row 2)
    {
        id: 'chart-plants-temp',
        title: 'Plante Temperaturer',
        // Define multiple data series for a single chart
        series: [
            {
                title: 'Agurk',
                channel: 2584548,
                field: 3,
                color: '#e67e22'  // Orange-red for cucumber
            },
            {
                title: 'Padron',
                channel: 2584548,
                field: 5,
                color: '#9b59b6'  // Purple-red for padron
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plant-temperature'  // Custom category to separate from other temperature charts
    },
    { 
        id: 'chart-out-temp',
        title: 'Utetemperatur', 
        channel: 2626867, 
        field: 1, 
        color: '#c62828',
        row: 2,
        category: 'temperature'
    },
    // Multi-series chart combining BME, AHT, and Floor temperature sensors
    {
        id: 'chart-sensors-temp',
        title: 'Sensor Temperaturer',
        // Define multiple data series for a single chart
        series: [
            {
                title: 'BME',
                channel: 2584548,
                field: 1,
                color: '#d35400'  // Burnt orange for BME
            },
            {
                title: 'AHT',
                channel: 2584548,
                field: 2,
                color: '#8e44ad'  // Purple for AHT
            },
            {
                title: 'Gulv',
                channel: 2584548,
                field: 4,
                color: '#c0392b'  // Brick red for floor temperature
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'detail-temperature'  // Custom category to separate from other temperature charts
    },

    // Row 3
    { 
        id: 'chart-humidity',
        title: 'Luftfuktighet', 
        channel: 2568299, 
        field: 2, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather'
    },
    { 
        id: 'chart-pressure',
        title: 'Lufttrykk', 
        channel: 2568299, 
        field: 7, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather'
    },
    { 
        id: 'chart-wind',
        title: 'Vind', 
        channel: 2626867, 
        field: 5, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather'
    },
    { 
        id: 'chart-rain',
        title: 'Nedbør', 
        channel: 2626867, 
        field: 6, 
        color: '#5c6bc0',
        row: 3,
        category: 'weather'
    },

    // Row 4
    // Multi-series chart for soil moisture
    {
        id: 'chart-soil-moisture',
        title: 'Jordfuktighet', 
        series: [
            {
                title: 'Agurk 1',
                channel: 2584548, 
                field: 6,
                color: '#2e7d32'  // Dark green
            },
            {
                title: 'Agurk 2',
                channel: 2584548, 
                field: 7,
                color: '#43a047'  // Medium green
            },
            {
                title: 'Padron',
                channel: 2584548, 
                field: 8,
                color: '#66bb6a'  // Light green
            }
        ],
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil-moisture'  // Custom category to separate from other soil charts
    },
    { 
        id: 'chart-battery-voltage',
        title: 'Batteri (spenning)', 
        channel: 2584547, 
        field: 2, 
        color: '#4a6741',
        row: 4,
        category: 'system'
    },
    { 
        id: 'chart-wifi',
        title: 'WiFi', 
        channel: 2584547, 
        field: 1, 
        color: '#4a6741',
        row: 4,
        startDate: '2024-07-25 15:00:00',
        category: 'system'
    },
    { 
        id: 'chart-time-used',
        title: 'Tid brukt', 
        channel: 2584547, 
        field: 4, 
        color: '#4a6741',
        row: 4,
        category: 'system'
    },
];