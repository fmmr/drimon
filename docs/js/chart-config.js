// Default series configuration - single source of truth for series options
const DEFAULT_SERIES_CONFIG = {
    titleKey: undefined,
    channel: undefined,
    field: undefined,
    color: undefined,
    axis: 'y',
    extraResults: undefined,
    dataFilter: {
        min: undefined,
        max: undefined,
        exclude: []
    }
};

// Default configuration values - single source of truth
const DEFAULT_CHART_CONFIG = {
    defaultRange: 1,
    unit: '',
    category: 'uncategorized',
    categoryHeaderKey: undefined,
    startDate: undefined,
    disableFill: false,
    hideLegendUnit: false,
    dataTransform: {},
    show_dashboard: false,
    series: [DEFAULT_SERIES_CONFIG],
    formatting: {
        useIntegerFormat: true,
        decimalPlaces: 0
    },
    yAxis: {
        position: 'right',
        min: undefined,
        gridColor: 'rgba(0, 0, 0, 0.05)',
        roundToNearest: 5,
        maxTicks: 5,
        formatLargeNumbers: false,
        secondYAxis: false,
        useMinimalMinimum: false
    },
    indicators: {
        showMin: true,
        showMax: true,
        showAvg: true,
        colors: {
            min: '#1e88e5',
            max: '#4caf50',  
            avg: '#888888'
        }
    }
};


// Deep merge function for config objects with complete normalization
function mergeChartConfig(userConfig) {
    const merged = { ...DEFAULT_CHART_CONFIG, ...userConfig };
    
    // Deep merge nested objects - always merge to ensure complete structure
    merged.formatting = { ...DEFAULT_CHART_CONFIG.formatting, ...(userConfig.formatting || {}) };
    merged.yAxis = { ...DEFAULT_CHART_CONFIG.yAxis, ...(userConfig.yAxis || {}) };
    merged.indicators = { ...DEFAULT_CHART_CONFIG.indicators, ...(userConfig.indicators || {}) };
    merged.indicators.colors = { ...DEFAULT_CHART_CONFIG.indicators.colors, ...(userConfig.indicators?.colors || {}) };
    merged.dataTransform = { ...DEFAULT_CHART_CONFIG.dataTransform, ...(userConfig.dataTransform || {}) };
    
    // Calculate all derived/normalized values here instead of in chart-renderer
    merged.hasSecondYAxis = !!(merged.yAxis && merged.yAxis.secondYAxis);
    merged.hasDataTransform = merged.dataTransform.shiftBy !== undefined;
    merged.shiftByValue = merged.dataTransform.shiftBy || 0;
    merged.isMultiSeries = merged.series.length > 1;
    
    // Calculate unique channels from series
    const uniqueChannels = new Set(merged.series.map(s => s.channel));
    merged.isMultiChannel = uniqueChannels.size > 1;
    
    // Calculate derived display properties
    merged.hasFill = !merged.isMultiSeries && !merged.disableFill;
    merged.tooltipMode = merged.isMultiChannel ? 'nearest' : 'index';
    merged.showIndicators = !merged.isMultiSeries;
    
    // Merge each series with DEFAULT_SERIES_CONFIG
    const defaultColors = ['#666', '#e6a500', '#8a5a00', '#0066cc', '#cc6600'];
    merged.series = merged.series.map((series, index) => {
        const mergedSeries = { ...DEFAULT_SERIES_CONFIG, ...series };
        
        // Deep merge dataFilter - always merge to ensure complete structure
        mergedSeries.dataFilter = { ...DEFAULT_SERIES_CONFIG.dataFilter, ...(series.dataFilter || {}) };
        
        // Set default color if not provided
        if (!mergedSeries.color) {
            mergedSeries.color = defaultColors[index % defaultColors.length];
        }
        
        return mergedSeries;
    });
    
    merged.displayUnit = merged.hideLegendUnit ? '' : merged.unit;
    
    return merged;
}

const RAW_CHART_CONFIGS = [
    { 
        id: 'chart-temp',
        titleKey: 'temperatureChart',
        series: [
            {
                titleKey: 'temperatureChart',
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 1,
                color: '#c62828'
            }
        ],
        row: 1,
        category: 'temperature',
        categoryHeaderKey: 'temperatures',
        unit: '°C',
        show_dashboard: true,
        formatting: {
            useIntegerFormat: false,
            decimalPlaces: 1
        },
        yAxis: {
            roundToNearest: 5,
            maxTicks: 6
        }
    },
    { 
        id: 'chart-window',
        titleKey: 'windowChart',
        series: [
            {
                titleKey: 'windowChart',
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 4,
                color: '#8a5a44'
            }
        ],
        row: 1,
        startDate: '2024-07-25 18:00:00',
        category: 'structure',
        categoryHeaderKey: 'structure',
        unit: 'mm',
        show_dashboard: true,
        dataTransform: {
            shiftBy: -63
        },
        yAxis: {
            min: 0
        }
    },
    // Multi-series chart for light measurements with dual y-axes
    {
        id: 'chart-light',
        titleKey: 'lightChart',
        series: [
            {
                titleKey: 'ceiling',
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 8,
                color: '#e6a500'
            },
            {
                titleKey: 'internal',
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 5,
                color: '#5e4419',
                axis: 'y1'
            }
        ],
        row: 1,
        startDate: '2024-08-06 17:00:00',
        category: 'light',
        categoryHeaderKey: 'light',
        unit: 'lux',
        show_dashboard: true,
        hideLegendUnit: true,
        yAxis: {
            min: 0,
            formatLargeNumbers: true,
            secondYAxis: true
        }
    },
    { 
        id: 'chart-battery',
        titleKey: 'batteryPercentChart',
        series: [
            {
                titleKey: 'batteryPercentChart',
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 3,
                color: '#56784b'
            }
        ],
        row: 1,
        category: 'system',
        categoryHeaderKey: 'system',
        unit: '%',
        show_dashboard: true,
        indicators: {
            showMin: true,
            showMax: false,
            showAvg: true
        },
        defaultRange: 7
    },

    // Row 2
    { 
        id: 'chart-out-temp',
        titleKey: 'outTempChart',
        series: [
            {
                titleKey: 'outTempChart',
                channel: window.THINGSPEAK.EXT_CHANNEL,
                field: 1,
                color: '#c62828'
            }
        ],
        row: 2,
        category: 'temperature',
        categoryHeaderKey: 'temperatures',
        unit: '°C',
        show_dashboard: true,
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        }
    },
    { 
        id: 'chart-temp-diff',
        titleKey: 'tempDiffChart',
        series: [
            {
                titleKey: 'tempDiffChart',
                channel: window.THINGSPEAK.EXT_CHANNEL,
                field: 3,
                color: '#c62828'
            }
        ],
        row: 2,
        category: 'temperature',
        categoryHeaderKey: 'temperatures',
        unit: '°C',
        show_dashboard: true,
        yAxis: {
            roundToNearest: 2,
            useMinimalMinimum: true
        },
    },
    // Multi-series chart combining cucumber and padron temperatures (positioned as 2nd chart in row 2)
    {
        id: 'chart-plants-temp',
        titleKey: 'plantsTempsChart',
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'cucumber',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 3,
                color: '#e67e22',
                dataFilter: {
                    max: 50,
                    exclude: [-127]
                }
            },
            {
                titleKey: 'padron',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 5,
                color: '#9b59b6',
                dataFilter: {
                    exclude: [-127]
                }
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'plant-temperature',  // Custom category to separate from other temperature charts
        categoryHeaderKey: 'temperatures', // Use standard temperatures key for translation
        unit: '°C'
    },
    // Multi-series chart combining BME, AHT, and Floor temperature sensors
    {
        id: 'chart-sensors-temp',
        titleKey: 'sensorsTempsChart',
        // Define multiple data series for a single chart
        series: [
            {
                titleKey: 'BME',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 1,
                color: '#e67e22'
            },
            {
                titleKey: 'AHT',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 2,
                color: '#9b59b6'
            },
            {
                titleKey: 'floor',
                channel: window.THINGSPEAK.TEMP_CHANNEL,
                field: 4,
                color: '#2980b9',
                dataFilter: {
                    exclude: [-127]
                }
            }
        ],
        row: 2,
        startDate: '2024-07-25 15:00:00',
        category: 'detail-temperature',  // Custom category to separate from other temperature charts
        categoryHeaderKey: 'temperatures', // Use standard temperatures key for translation
        unit: '°C'
    },

    // Row 3
    { 
        id: 'chart-humidity',
        titleKey: 'humidityChart',
        series: [
            {
                titleKey: 'humidityChart',
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 2,
                color: '#5c6bc0'
            }
        ],
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather',
        unit: '%',
        indicators: {
            showMin: true,
            showMax: true,
            showAvg: true
        }
    },
    { 
        id: 'chart-temperature',
        titleKey: 'pressureChart',
        series: [
            {
                titleKey: 'pressureChart',
                channel: window.THINGSPEAK.DRIMON_CHANNEL,
                field: 7,
                color: '#5c6bc0'
            }
        ],
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather',
        unit: 'hPa',
        defaultRange: 13,
        yAxis: {
            roundToNearest: 2,
            maxTicks: 6
        }
    },
    { 
        id: 'chart-wind',
        titleKey: 'windChart',
        series: [
            {
                titleKey: 'windChart',
                channel: window.THINGSPEAK.EXT_CHANNEL,
                field: 5,
                color: '#5c6bc0',
                dataFilter: { max: 30 }
            }
        ],
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather',
        unit: 'm/s',
        defaultRange: 3
    },
    { 
        id: 'chart-rain',
        titleKey: 'rainChart',
        series: [
            {
                titleKey: 'rainChart',
                channel: window.THINGSPEAK.EXT_CHANNEL,
                field: 6,
                color: '#5c6bc0'
            }
        ],
        row: 3,
        category: 'weather',
        categoryHeaderKey: 'weather',
        unit: 'mm',
        defaultRange: 3
    },

    // Row 4
    // Multi-series chart for soil moisture
    {
        id: 'chart-soil-moisture',
        titleKey: 'soilMoistureChart', 
        series: [
            {
                titleKey: 'cucumber1',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 6,
                color: '#1976d2'
            },
            {
                titleKey: 'cucumber2',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 7,
                color: '#388e3c'
            },
            {
                titleKey: 'padron',
                channel: window.THINGSPEAK.TEMP_CHANNEL, 
                field: 8,
                color: '#f9a825'
            }
        ],
        row: 4,
        startDate: '2024-07-25 00:00:00',
        category: 'soil-moisture',  // Custom category to separate from other soil charts
        categoryHeaderKey: 'soil',
        unit: '%'
    },
    { 
        id: 'chart-battery-voltage',
        titleKey: 'batteryVoltageChart',
        series: [
            {
                titleKey: 'batteryVoltageChart',
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 2,
                color: '#4a6741'
            }
        ],
        row: 4,
        category: 'system',
        categoryHeaderKey: 'system',
        unit: 'V',
        formatting: {
            useIntegerFormat: false,
            decimalPlaces: 2 // Always show 1 decimal place for battery voltage
        },
        yAxis: {
            roundToNearest: 0.1 // Round to nearest 0.1V for voltage charts
        },
        defaultRange: 7
    },
    { 
        id: 'chart-wifi',
        titleKey: 'wifiChart',
        series: [
            {
                titleKey: 'wifiChart',
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 1,
                color: '#4a6741'
            }
        ],
        row: 4,
        startDate: '2024-07-25 15:00:00',
        category: 'system',
        categoryHeaderKey: 'system',
        unit: 'dBm',
        disableFill: true,  // Negative values look bad with fill
        defaultRange: 30
    },
    { 
        id: 'chart-time-used',
        titleKey: 'timeUsedChart',
        series: [
            {
                titleKey: 'timeUsedChart',
                channel: window.THINGSPEAK.TECH_CHANNEL,
                field: 4,
                color: '#4a6741'
            }
        ],
        row: 4,
        category: 'system',
        categoryHeaderKey: 'system',
        unit: 'ms'
    },
];

// Process configurations through default merger and export
window.chartConfigs = RAW_CHART_CONFIGS.map(config => mergeChartConfig(config));