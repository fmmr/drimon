// Header configuration - following chart-config.js pattern
// Single source of truth for header options and overrides

// All available date ranges used by both regular and dashboard headers
const AllDateRanges = [
    { range: 'default', key: 'defaultDate', icon: 'fas fa-home' },
    { range: '2', key: 'twoDay', icon: 'fas fa-2' },
    { range: '3', key: 'threeDay', icon: 'fas fa-3' },
    { range: '7', key: 'sevenDay', icon: 'fas fa-7' },
    { range: '14', key: 'fourteenDay', iconDouble: ['fas fa-1', 'fas fa-4'] },
    { range: '30', key: 'thirtyDay', iconDouble: ['fas fa-3', 'fas fa-0'] },
    { range: 'today', key: 'today', icon: 'fas fa-calendar-day' },
    { range: 'yesterday', key: 'yesterday', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-day'] },
    { range: 'this-week', key: 'week', icon: 'fas fa-calendar-week' },
    { range: 'last-week', key: 'lastWeek', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-week'] },
    { range: 'this-month', key: 'month', icon: 'fas fa-calendar-alt' },
    { range: 'last-month', key: 'lastMonth', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-alt'] },
    { range: 'start', key: 'start', icon: 'fas fa-hourglass-start' }
];

// Chart set definitions for dashboard mode
const ChartSets = {
    1: {
        key: 'defaultCharts',
        icon: 'fas fa-home',
        charts: ['chart-temp', 'chart-window', 'chart-light', 'chart-battery', 'chart-out-temp', 'chart-temp-diff']
    },
    2: {
        key: 'temperatureCharts',
        icon: 'fas fa-thermometer-half',
        charts: ['chart-temp', 'chart-out-temp', 'chart-temp-diff', 'chart-plants-temp', 'chart-sensors-temp', 'chart-soil-moisture']
    },
    3: {
        key: 'weatherCharts',
        icon: 'fas fa-cloud',
        charts: ['chart-humidity', 'chart-temperature', 'chart-wind', 'chart-rain', 'chart-light', 'chart-out-temp']
    },
    4: {
        key: 'systemCharts',
        icon: 'fas fa-cog',
        charts: ['chart-window', 'chart-light', 'chart-battery', 'chart-battery-voltage', 'chart-wifi', 'chart-time-used']
    }
};

// Default header configuration - single source of truth
const DEFAULT_HEADER_CONFIG = {
    
    components: {
        logo: {
            type: 'logoContainer',
            config: {
                logoUrl: 'https://github.com/fmmr/drimon',
                logoImage: 'logos/1_100x55.webp',
                logoAlt: 'DriMon',
                logoClassName: 'logo',
                logoId: 'main-title',
                customClasses: ''
            }
        },
        data: {
            type: 'dataContainer',
            config: {
                chips: [
                    { id: 'time-since', icon: 'fas fa-clock', titleKey: 'time' }, // MOVED from logo - first position
                    { id: 'temperature', icon: 'fas fa-thermometer-half', titleKey: 'temperature' },
                    { id: 'weather', type: 'weatherPill' },
                    { id: 'sunEvents', type: 'sunEventChip' },
                    { id: 'light', icon: 'fas fa-sun', titleKey: 'light', initialText: '' },
                    { id: 'window', icon: 'fas fa-window-maximize', titleKey: 'window', initialText: '' },
                    { id: 'pressure', icon: 'fas fa-compress-alt', titleKey: 'pressure' },
                    { id: 'battery', icon: 'fas fa-battery-half', titleKey: 'battery' }
                ]
            }
        },
        thingspeak: {
            type: 'thingSpeakLinks',
            config: {}
        },
        dateRanges: {
            type: 'dateRanges',
            config: {
                ranges: AllDateRanges.slice(0, 6)  // First 6 ranges: default, 1, 2, 6, 13, 30
            }
        },
        settingsDropdown: {
            type: 'settingsDropdown',
            config: {
                icon: 'fas fa-cog',
                dateRanges: AllDateRanges.slice(6),  // Secondary ranges: today, yesterday, this-week, last-week, this-month, last-month, start
                secondaryDateRanges: [],              // Optional secondary date ranges for row breaks
                actions: ['resetChartOrder'],         // Add reset chart order action
                showDivider: true,                    // Show divider before actions
                showSecondDivider: false,             // Second divider before chart selector
                chartSetSelector: undefined,          // Chart set selector config (dashboard only)
                layout: 'vertical'
            }
        },
        resultsInput: {
            type: 'resultsInput',
            config: {
                placeholderKey: 'results',
                buttonKey: 'update'
            }
        },
        darkModeToggle: {
            type: 'darkModeToggle',
            config: {
                icon: 'fas fa-moon',
                keyboardShortcut: 'd'
            }
        },
        statsToggle: {
            type: 'statsToggle',
            config: {
                icon: 'fas fa-chart-line',
                keyboardShortcut: 's'
            }
        },
        sortDropdown: {
            type: 'sortDropdown',
            config: {
                categoryMap: {
                    'temperature': 'temperatureSort',
                    'plant-temperature': 'temperatureSort',
                    'detail-temperature': 'temperatureSort',
                    'humidity': 'humiditySort',
                    'weather': 'weatherSort',
                    'system': 'systemSort',
                    'soil': 'soilSort',
                    'soil-moisture': 'soilSort',
                    'light': 'lightSort',
                    'structure': 'structureSort'
                }
            }
        },
        languageSwitcher: {
            type: 'languageSwitcher',
            config: {}
        },
        resetChartOrder: {
            type: 'resetChartOrder',
            config: {
                icon: 'fas fa-undo',
                titleKey: 'resetChartOrder',
                keyboardShortcut: 'r'
            }
        }
    },
    
    // Layout order (single row for regular mode)
    layout: ['logo', 'data', 'thingspeak', 'dateRanges', 'settingsDropdown', 'languageSwitcher', 'darkModeToggle', 'statsToggle', 'resultsInput'],
    
    // Header theme
    theme: 'modern-header'
};

// Header configurations with overrides for different modes
const HEADER_MODE_CONFIGS = [
    {
        id: 'desktop',
        // Uses all defaults from DEFAULT_HEADER_CONFIG
    },
    {
        id: 'mobile',
        
        components: {
            logo: {
                config: {
                    logoUrl: null  // No link for mobile (like dashboard)
                }
            },
            data: {
                type: 'dataContainer',
                config: {
                    chips: [
                        { id: 'time-since', icon: 'fas fa-clock', titleKey: 'time' },
                        { id: 'temperature', icon: 'fas fa-thermometer-half', titleKey: 'temperature' },
                        { id: 'weather', type: 'weatherPill' },
                        { id: 'sunEvents', type: 'sunEventChip' },
                        { id: 'pressure', icon: 'fas fa-compress-alt', titleKey: 'pressure' },
                        { id: 'battery', icon: 'fas fa-battery-half', titleKey: 'battery' }
                    ]
                }
            },
            dateRanges: {
                type: 'dateRanges',
                config: {
                    ranges: [
                        { range: 'default', key: 'defaultDate', icon: 'fas fa-home' },
                        { range: '1', key: 'twoDay', icon: 'fas fa-2' },
                        { range: '6', key: 'sevenDay', icon: 'fas fa-7' },
                        { range: '13', key: 'fourteenDay', iconDouble: ['fas fa-1', 'fas fa-4'] },
                        { range: '30', key: 'thirtyDay', iconDouble: ['fas fa-3', 'fas fa-0'] },
                        { range: 'today', key: 'today', icon: 'fas fa-calendar-day' },
                        { range: 'this-week', key: 'week', icon: 'fas fa-calendar-week' },
                        { range: 'start', key: 'start', icon: 'fas fa-hourglass-start' }
                    ]
                }
            },
            dateRangesRow2: {
                type: 'dateRanges',
                config: {
                    ranges: [
                        { range: 'last-week', key: 'lastWeek', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-week'] },
                        { range: 'last-month', key: 'lastMonth', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-alt'] }
                    ]
                }
            }
        },
        layout: ['logo', 'languageSwitcher', 'darkModeToggle', 'statsToggle', 'sortDropdown'],
        layout2: ['data'],
        layout3: ['dateRanges'], 
        theme: 'modern-header mobile-header'
    },
    {
        id: 'dashboard',
        
        components: {
            logo: {
                config: {
                    logoUrl: null  // No link for dashboard
                }
            },
            settingsDropdown: {
                config: {
                    icon: 'fas fa-cog',
                    dateRanges: AllDateRanges.slice(0, 6),  // First 6: default, 1, 2, 6, 13, 30
                    secondaryDateRanges: AllDateRanges.slice(6),  // Remaining: today, yesterday, this-week, last-week, this-month, last-month, start
                    actions: ['darkModeToggle', 'statsToggle'],  // Reuse existing components (no resetChartOrder for dashboard)
                    chartSetSelector: {
                        chartSets: ChartSets
                    },
                    showDivider: true,                   // Divider between dates and actions
                    showSecondDivider: true,             // Second divider before chart selector
                    layout: 'horizontal'                 // Better for small dashboard screen
                }
            }
        },
        layout: ['logo', 'data', 'settingsDropdown'],
        theme: 'modern-header dashboard-header'
    }
];

// Deep merge function for header config objects
function mergeHeaderConfig(userConfig) {
    const merged = { ...DEFAULT_HEADER_CONFIG, ...userConfig };
    
    // Deep merge nested objects
    merged.components = { ...DEFAULT_HEADER_CONFIG.components, ...(userConfig.components || {}) };
    
    // Deep merge individual component configs
    Object.keys(DEFAULT_HEADER_CONFIG.components).forEach(componentKey => {
        if (userConfig.components && userConfig.components[componentKey]) {
            merged.components[componentKey] = {
                ...DEFAULT_HEADER_CONFIG.components[componentKey],
                ...userConfig.components[componentKey]
            };
            
            // Deep merge component config
            merged.components[componentKey].config = {
                ...DEFAULT_HEADER_CONFIG.components[componentKey].config,
                ...(userConfig.components[componentKey].config || {})
            };
        }
    });
    
    return merged;
}

// Process configurations and export final results
window.headerConfigs = {
    desktop: mergeHeaderConfig(HEADER_MODE_CONFIGS.find(c => c.id === 'desktop')),
    mobile: mergeHeaderConfig(HEADER_MODE_CONFIGS.find(c => c.id === 'mobile')),
    dashboard: mergeHeaderConfig(HEADER_MODE_CONFIGS.find(c => c.id === 'dashboard'))
};

// Export ChartSets globally for use by other modules
window.ChartSets = ChartSets;

// Also export the raw data for debugging
window.HeaderConfigData = {
    DEFAULT_HEADER_CONFIG,
    HEADER_MODE_CONFIGS,
    AllDateRanges,
    ChartSets
};