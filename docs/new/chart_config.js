// Configuration for all charts with row-based layout
const chartConfigs = [
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
        category: 'structure'
    },
    { 
        id: 'chart-light',
        title: 'Lys', 
        channel: 2568299, 
        field: 8, 
        color: '#ffb700', // Yellow for light
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
    { 
        id: 'chart-agurk',
        title: 'Agurk Temp', 
        channel: 2584548, 
        field: 3, 
        color: '#c62828', // Light green for cucumber
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plants'
    },
    { 
        id: 'chart-paprika',
        title: 'Padron Temp', 
        channel: 2584548, 
        field: 5, 
        color: '#c62828', // Light orange for paprika
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plants'
    },

    // Row 3
    { 
        id: 'chart-humidity',
        title: 'Luftfuktighet', 
        channel: 2568299, 
        field: 2, 
        color: '#5c6bc0',
        row: 3,
        category: 'humidity'
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
        id: 'chart-light-int',
        title: 'Lys Int', 
        channel: 2584547, 
        field: 5, 
        color: '#ffb700',
        row: 4,
        startDate: '2024-08-06 15:00:00',
        category: 'light'
    },
    { 
        id: 'chart-time-used',
        title: 'Tid brukt', 
        channel: 2584547, 
        field: 4, 
        color: '#4a6741',
        row: 4,
        category: 'system'
    }
];

// Calculate grid areas based on row
// This preserves the existing grid system while making it easier to configure
(function calculateGridAreas() {
    // Group charts by row and maintain original order
    const rowCharts = {};
    chartConfigs.forEach(config => {
        const row = config.row;
        if (!rowCharts[row]) {
            rowCharts[row] = [];
        }
        rowCharts[row].push(config);
    });
    
    // Process each row to calculate grid areas
    Object.keys(rowCharts).forEach(rowNum => {
        const charts = rowCharts[rowNum]; // Maintain original order (no sorting needed)
        const totalCharts = charts.length;
        
        if (totalCharts === 1) {
            // 1 chart: use all 8 columns
            charts[0].area = `${rowNum} / 1 / ${Number(rowNum) + 1} / 9`;
        } 
        else if (totalCharts === 2) {
            // 2 charts: 4 columns each (50% width)
            charts[0].area = `${rowNum} / 1 / ${Number(rowNum) + 1} / 5`;
            charts[1].area = `${rowNum} / 5 / ${Number(rowNum) + 1} / 9`;
        }
        else if (totalCharts === 3) {
            // 3 charts: first gets 4 columns, others get 2 (50%, 25%, 25%)
            charts[0].area = `${rowNum} / 1 / ${Number(rowNum) + 1} / 5`;
            charts[1].area = `${rowNum} / 5 / ${Number(rowNum) + 1} / 7`;
            charts[2].area = `${rowNum} / 7 / ${Number(rowNum) + 1} / 9`;
        }
        else if (totalCharts === 4) {
            // 4 charts: 2 columns each (25% width)
            charts[0].area = `${rowNum} / 1 / ${Number(rowNum) + 1} / 3`;
            charts[1].area = `${rowNum} / 3 / ${Number(rowNum) + 1} / 5`;
            charts[2].area = `${rowNum} / 5 / ${Number(rowNum) + 1} / 7`;
            charts[3].area = `${rowNum} / 7 / ${Number(rowNum) + 1} / 9`;
        }
        else if (totalCharts >= 5 && totalCharts <= 8) {
            // 5-8 charts: Calculate how many columns are available
            const totalColumns = 8;
            
            // First determine how many 2-column charts can fit
            let columnsRemaining = totalColumns;
            let twoColumnCharts = Math.min(Math.floor(columnsRemaining / 2), totalCharts);
            
            // If we can fit all charts as 2-column, reduce until we need to use 1-column
            while ((twoColumnCharts * 2 + (totalCharts - twoColumnCharts)) > totalColumns) {
                twoColumnCharts--;
            }
            
            // Calculate grid positions
            let currentColumn = 1;
            
            for (let i = 0; i < totalCharts; i++) {
                const chart = charts[i];
                
                if (i < twoColumnCharts) {
                    // 2-column chart
                    chart.area = `${rowNum} / ${currentColumn} / ${Number(rowNum) + 1} / ${currentColumn + 2}`;
                    currentColumn += 2;
                } else {
                    // 1-column chart
                    chart.area = `${rowNum} / ${currentColumn} / ${Number(rowNum) + 1} / ${currentColumn + 1}`;
                    currentColumn += 1;
                }
            }
        }
        else if (totalCharts > 8) {
            // More than 8 charts: divide evenly
            const columnWidth = Math.floor(8 / totalCharts);
            const remainder = 8 % totalCharts;
            
            let currentColumn = 1;
            charts.forEach((chart, index) => {
                // Give extra column space to the first charts if there's a remainder
                const extraSpace = index < remainder ? 1 : 0;
                const width = columnWidth + extraSpace;
                
                chart.area = `${rowNum} / ${currentColumn} / ${Number(rowNum) + 1} / ${currentColumn + width}`;
                currentColumn += width;
            });
        }
    });
})();