// Configuration for all charts
const chartConfigs = [
    // Row 1
    { 
        id: 'chart-temp',
        title: 'Temperatur', 
        channel: 2568299, 
        field: 1, 
        color: '#d62020',
        area: '1 / 1 / 2 / 3'
    },
    { 
        id: 'chart-window',
        title: 'Vindusåpning', 
        channel: 2568299, 
        field: 4, 
        color: '#00aa00',
        area: '1 / 3 / 2 / 5',
        startDate: '2024-07-25 18:00:00'
    },
    { 
        id: 'chart-light',
        title: 'Lys', 
        channel: 2568299, 
        field: 8, 
        color: '#ffc107',
        area: '1 / 5 / 2 / 7',
        startDate: '2024-08-06 17:00:00'
    },
    { 
        id: 'chart-battery',
        title: 'Batteri (%)', 
        channel: 2584547, 
        field: 3, 
        color: '#007bff',
        area: '1 / 7 / 2 / 9'
    },

    // Row 2
    { 
        id: 'chart-out-temp',
        title: 'Utetemperatur', 
        channel: 2626867, 
        field: 1, 
        color: '#d62020',
        area: '2 / 1 / 3 / 3'
    },
    { 
        id: 'chart-temp-diff',
        title: 'Temperatur Diff', 
        channel: 2626867, 
        field: 3, 
        color: '#800080',
        area: '2 / 3 / 3 / 5'
    },
    { 
        id: 'chart-wind',
        title: 'Vind', 
        channel: 2626867, 
        field: 5, 
        color: '#17a2b8',
        area: '2 / 5 / 3 / 6'
    },
    { 
        id: 'chart-rain',
        title: 'Nedbør', 
        channel: 2626867, 
        field: 6, 
        color: '#00aaff',
        area: '2 / 6 / 3 / 7'
    },
    { 
        id: 'chart-pressure',
        title: 'Lufttrykk', 
        channel: 2568299, 
        field: 7, 
        color: '#6c757d',
        area: '2 / 7 / 3 / 9'
    },

    // Row 3
    { 
        id: 'chart-humidity',
        title: 'Luftfuktighet', 
        channel: 2568299, 
        field: 2, 
        color: '#00aaff',
        area: '3 / 1 / 4 / 3'
    },
    { 
        id: 'chart-soil-agurk',
        title: 'Fuktighet Agurk', 
        channel: 2584548, 
        field: 6, 
        color: '#28a745',
        area: '3 / 3 / 4 / 5',
        startDate: '2024-07-25 00:00:00'
    },
    { 
        id: 'chart-soil-tomat',
        title: 'Fuktighet Tomat', 
        channel: 2584548, 
        field: 7, 
        color: '#dc3545',
        area: '3 / 5 / 4 / 6',
        startDate: '2024-07-25 00:00:00'
    },
    { 
        id: 'chart-soil-paprika',
        title: 'Fuktighet Paprika', 
        channel: 2584548, 
        field: 8, 
        color: '#fd7e14',
        area: '3 / 6 / 4 / 7',
        startDate: '2024-07-25 00:00:00'
    },
    { 
        id: 'chart-agurk',
        title: 'Agurk', 
        channel: 2584548, 
        field: 3, 
        color: '#28a745',
        area: '3 / 7 / 4 / 8',
        startDate: '2024-07-25 15:00:00'
    },
    { 
        id: 'chart-paprika',
        title: 'Paprika', 
        channel: 2584548, 
        field: 5, 
        color: '#fd7e14',
        area: '3 / 8 / 4 / 9',
        startDate: '2024-07-25 15:00:00'
    },

    // Row 4
    { 
        id: 'chart-bme-temp',
        title: 'BME Temp', 
        channel: 2584548, 
        field: 1, 
        color: '#d62020',
        area: '4 / 1 / 5 / 3',
        startDate: '2024-07-25 15:00:00'
    },
    { 
        id: 'chart-aht-temp',
        title: 'AHT Temp', 
        channel: 2584548, 
        field: 2, 
        color: '#b71c1c', 
        area: '4 / 3 / 5 / 4',
        startDate: '2024-07-25 15:00:00'
    },
    { 
        id: 'chart-floor-temp',
        title: 'Gulv Temp', 
        channel: 2584548, 
        field: 4, 
        color: '#880e4f',
        area: '4 / 4 / 5 / 5',
        startDate: '2024-07-25 15:00:00'
    },
    { 
        id: 'chart-battery-voltage',
        title: 'Batteri (spenning)', 
        channel: 2584547, 
        field: 2, 
        color: '#0d47a1',
        area: '4 / 5 / 5 / 6'
    },
    { 
        id: 'chart-wifi',
        title: 'WiFi', 
        channel: 2584547, 
        field: 1, 
        color: '#039be5',
        area: '4 / 6 / 5 / 7',
        startDate: '2024-07-25 15:00:00'
    },
    { 
        id: 'chart-light-int',
        title: 'Lys Int', 
        channel: 2584547, 
        field: 5, 
        color: '#ffc107',
        area: '4 / 7 / 5 / 8',
        startDate: '2024-08-06 15:00:00'
    },
    { 
        id: 'chart-time-used',
        title: 'Tid brukt', 
        channel: 2584547, 
        field: 4, 
        color: '#6c757d',
        area: '4 / 8 / 5 / 9'
    }
];