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
    { 
        id: 'chart-light',
        title: 'Lys', 
        channel: 2568299, 
        field: 8, 
        color: '#e6a500', // Yellow for light
        row: 1,
        startDate: '2024-08-06 17:00:00',
        category: 'light'
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
                color: '#e63946'  // Bright red for cucumber
            },
            {
                title: 'Padron',
                channel: 2584548,
                field: 5,
                color: '#9d0208'  // Dark red for padron
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
    { 
        id: 'chart-bme-temp',
        title: 'BME Temp', 
        channel: 2584548, 
        field: 1, 
        color: '#c62828',
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
    },
    { 
        id: 'chart-aht-temp',
        title: 'AHT Temp', 
        channel: 2584548, 
        field: 2, 
        color: '#c62828',
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
    },
    { 
        id: 'chart-floor-temp',
        title: 'Gulv Temp', 
        channel: 2584548, 
        field: 4, 
        color: '#c62828',
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
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
    { 
        id: 'chart-soil-paprika',
        title: 'Fuktighet Agurk 1', 
        channel: 2584548, 
        field: 6, 
        color: '#43a047',
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
    },
    { 
        id: 'chart-soil-agurk',
        title: 'Fuktighet Agurk 2', 
        channel: 2584548, 
        field: 7, 
        color: '#43a047',
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
    },
    { 
        id: 'chart-soil-tomat',
        title: 'Fuktighet Padron', 
        channel: 2584548, 
        field: 8, 
        color: '#43a047',
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
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
    { 
        id: 'chart-light-int',
        title: 'Lys Int', 
        channel: 2584547, 
        field: 5, 
        color: '#e6a500',
        row: 4,
        startDate: '2024-08-06 15:00:00',
        category: 'light'
    }
];