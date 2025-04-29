// Configuration for all charts with logical color grouping
const chartConfigs = [
    // Row 1
    { 
        id: 'chart-temp',
        title: 'Temperatur', 
        channel: 2568299, 
        field: 1, 
        color: '#d62020', // Red for temperature
        area: '1 / 1 / 2 / 3',
        category: 'temperature'
    },
    { 
        id: 'chart-window',
        title: 'Vindusåpning', 
        channel: 2568299, 
        field: 4, 
        color: '#8a5a44', // Brown for physical structure
        area: '1 / 3 / 2 / 5',
        startDate: '2024-07-25 18:00:00',
        category: 'structure'
    },
    { 
        id: 'chart-light',
        title: 'Lys', 
        channel: 2568299, 
        field: 8, 
        color: '#ffb700', // Yellow for light
        area: '1 / 5 / 2 / 7',
        startDate: '2024-08-06 17:00:00',
        category: 'light'
    },
    { 
        id: 'chart-battery',
        title: 'Batteri (%)', 
        channel: 2584547, 
        field: 3, 
        color: '#4a6741', // Dark green for system
        area: '1 / 7 / 2 / 9',
        category: 'system'
    },

    // Row 2
    { 
        id: 'chart-out-temp',
        title: 'Utetemperatur', 
        channel: 2626867, 
        field: 1, 
        color: '#e57373', // Light red for temp
        area: '2 / 1 / 3 / 3',
        category: 'temperature'
    },
    { 
        id: 'chart-temp-diff',
        title: 'Temperatur Diff', 
        channel: 2626867, 
        field: 3, 
        color: '#9c27b0', // Purple for difference
        area: '2 / 3 / 3 / 5',
        category: 'temperature'
    },
    { 
        id: 'chart-wind',
        title: 'Vind', 
        channel: 2626867, 
        field: 5, 
        color: '#81d4fa', // Light blue for weather
        area: '2 / 5 / 3 / 6',
        category: 'weather'
    },
    { 
        id: 'chart-rain',
        title: 'Nedbør', 
        channel: 2626867, 
        field: 6, 
        color: '#0288d1', // Dark blue for weather
        area: '2 / 6 / 3 / 7',
        category: 'weather'
    },
    { 
        id: 'chart-pressure',
        title: 'Lufttrykk', 
        channel: 2568299, 
        field: 7, 
        color: '#5c6bc0', // Indigo for pressure/weather
        area: '2 / 7 / 3 / 9',
        category: 'weather'
    },

    // Row 3
    { 
        id: 'chart-humidity',
        title: 'Luftfuktighet', 
        channel: 2568299, 
        field: 2, 
        color: '#29b6f6', // Light blue for humidity
        area: '3 / 1 / 4 / 3',
        category: 'humidity'
    },
    { 
        id: 'chart-soil-agurk',
        title: 'Fuktighet Agurk', 
        channel: 2584548, 
        field: 6, 
        color: '#43a047', // Green for cucumber
        area: '3 / 3 / 4 / 5',
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
    },
    { 
        id: 'chart-soil-tomat',
        title: 'Fuktighet Tomat', 
        channel: 2584548, 
        field: 7, 
        color: '#e53935', // Red for tomato
        area: '3 / 5 / 4 / 6',
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
    },
    { 
        id: 'chart-soil-paprika',
        title: 'Fuktighet Paprika', 
        channel: 2584548, 
        field: 8, 
        color: '#fb8c00', // Orange for paprika
        area: '3 / 6 / 4 / 7',
        startDate: '2024-07-25 00:00:00',
        category: 'soil'
    },
    { 
        id: 'chart-agurk',
        title: 'Agurk', 
        channel: 2584548, 
        field: 3, 
        color: '#66bb6a', // Light green for cucumber
        area: '3 / 7 / 4 / 8',
        startDate: '2024-07-25 15:00:00',
        category: 'plants'
    },
    { 
        id: 'chart-paprika',
        title: 'Paprika', 
        channel: 2584548, 
        field: 5, 
        color: '#ff9800', // Light orange for paprika
        area: '3 / 8 / 4 / 9',
        startDate: '2024-07-25 15:00:00',
        category: 'plants'
    },

    // Row 4
    { 
        id: 'chart-bme-temp',
        title: 'BME Temp', 
        channel: 2584548, 
        field: 1, 
        color: '#c62828', // Dark red for temp
        area: '4 / 1 / 5 / 3',
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
    },
    { 
        id: 'chart-aht-temp',
        title: 'AHT Temp', 
        channel: 2584548, 
        field: 2, 
        color: '#ef5350', // Medium red for temp
        area: '4 / 3 / 5 / 4',
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
    },
    { 
        id: 'chart-floor-temp',
        title: 'Gulv Temp', 
        channel: 2584548, 
        field: 4, 
        color: '#ff8a65', // Salmon for floor temp
        area: '4 / 4 / 5 / 5',
        startDate: '2024-07-25 15:00:00',
        category: 'temperature'
    },
    { 
        id: 'chart-battery-voltage',
        title: 'Batteri (spenning)', 
        channel: 2584547, 
        field: 2, 
        color: '#689f38', // Green for system
        area: '4 / 5 / 5 / 6',
        category: 'system'
    },
    { 
        id: 'chart-wifi',
        title: 'WiFi', 
        channel: 2584547, 
        field: 1, 
        color: '#7cb342', // Light green for system
        area: '4 / 6 / 5 / 7',
        startDate: '2024-07-25 15:00:00',
        category: 'system'
    },
    { 
        id: 'chart-light-int',
        title: 'Lys Int', 
        channel: 2584547, 
        field: 5, 
        color: '#ffd600', // Gold for light
        area: '4 / 7 / 5 / 8',
        startDate: '2024-08-06 15:00:00',
        category: 'light'
    },
    { 
        id: 'chart-time-used',
        title: 'Tid brukt', 
        channel: 2584547, 
        field: 4, 
        color: '#546e7a', // Dark gray for system
        area: '4 / 8 / 5 / 9',
        category: 'system'
    }
];