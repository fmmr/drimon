// Header configuration - following chart-config.js pattern
// Single source of truth for header options and overrides

// All available date ranges used by both regular and dashboard headers
const AllDateRanges = [
    { range: 'default', key: 'defaultDate', icon: 'fas fa-home' },
    { range: '1', key: 'twoDay', icon: 'fas fa-2' },
    { range: '2', key: 'threeDay', icon: 'fas fa-3' },
    { range: '6', key: 'sevenDay', icon: 'fas fa-7' },
    { range: '13', key: 'fourteenDay', iconDouble: ['fas fa-1', 'fas fa-4'] },
    { range: '30', key: 'thirtyDay', iconDouble: ['fas fa-3', 'fas fa-0'] },
    { range: 'today', key: 'today', icon: 'fas fa-calendar-day' },
    { range: 'yesterday', key: 'yesterday', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-day'] },
    { range: 'this-week', key: 'week', icon: 'fas fa-calendar-week' },
    { range: 'last-week', key: 'lastWeek', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-week'] },
    { range: 'this-month', key: 'month', icon: 'fas fa-calendar-alt' },
    { range: 'last-month', key: 'lastMonth', iconDouble: ['fas fa-step-backward', 'fas fa-calendar-alt'] },
    { range: 'start', key: 'start', icon: 'fas fa-hourglass-start' }
];

// Default header configuration - single source of truth
const DEFAULT_HEADER_CONFIG = {
    // Primary date ranges (shown as chips in dateRanges component)
    // Regular/Mobile: first 6 dates = ['default', '1', '2', '6', '13', '30']
    // Dashboard: empty array []
    primaryDateRanges: AllDateRanges.slice(0, 6),
    
    // Secondary date ranges (shown in settingsDropdown component)  
    // Regular/Mobile: remaining dates = ['today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month', 'start']
    // Dashboard: all dates = ['default', '1', '2', '6', '13', '30', 'today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month', 'start']
    secondaryDateRanges: AllDateRanges.slice(6),
    
    components: {
        logo: {
            type: 'logoContainer',
            config: {
                logoUrl: 'https://github.com/fmmr/drimon',
                logoImage: 'logos/1_100x55.webp',
                logoAlt: 'DriMon'
            }
        },
        data: {
            type: 'dataContainer',
            config: {
                chips: [
                    { id: 'time', type: 'timeChip' }, // MOVED from logo - first position
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
            config: {}  // Uses primaryDateRanges from top level
        },
        actionButtons: {
            type: 'actionButtons',
            config: {
                darkMode: { enabled: true },
                statsToggle: { enabled: true },
                languageSwitcher: { enabled: true }
            }
        },
        settingsDropdown: {
            type: 'settingsDropdown',
            config: {
                showDateRanges: true,        // Show secondary date ranges in dropdown
                showDivider: false,          // No divider needed (no actions below)
                actions: {
                    darkMode: { enabled: false },      // Not in dropdown for regular mode
                    statsToggle: { enabled: false }    // Not in dropdown for regular mode
                }
            }
        },
        search: {
            type: 'searchContainer',
            config: {
                includeSortDropdown: true,   // chart sorting (mobile only)
                includeResults: true         // results input + update button
            }
        }
    },
    
    // Layout order
    layout: ['logo', 'data', 'thingspeak', 'dateRanges', 'actionButtons', 'settingsDropdown', 'search'],
    
    // Header theme
    theme: 'modern-header'
};

// Header configurations with overrides for different modes
const HEADER_MODE_CONFIGS = [
    {
        id: 'regular',
        // Uses all defaults from DEFAULT_HEADER_CONFIG
    },
    {
        id: 'dashboard',
        // Date range overrides - all dates go to settings dropdown
        primaryDateRanges: [],  // No date chips in dateRanges component
        secondaryDateRanges: AllDateRanges,  // All 13 dates in settingsDropdown: ['default', '1', '2', '6', '13', '30', 'today', 'yesterday', 'this-week', 'last-week', 'this-month', 'last-month', 'start']
        
        components: {
            logo: {
                config: {
                    logoUrl: null  // No link for dashboard
                }
            },
            settingsDropdown: {
                config: {
                    showDateRanges: true,        // Show all date ranges in dropdown
                    showDivider: true,           // Show divider between dates and actions
                    actions: {
                        darkMode: { enabled: true },      // Dark mode in dropdown for dashboard
                        statsToggle: { enabled: true }    // Stats toggle in dropdown for dashboard
                    }
                }
            }
        },
        layout: ['logo', 'data', 'settingsDropdown'],  // No thingspeak, dateRanges, actionButtons, search
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
    regular: mergeHeaderConfig(HEADER_MODE_CONFIGS.find(c => c.id === 'regular')),
    dashboard: mergeHeaderConfig(HEADER_MODE_CONFIGS.find(c => c.id === 'dashboard'))
};

// Also export the raw data for debugging
window.HeaderConfigData = {
    DEFAULT_HEADER_CONFIG,
    HEADER_MODE_CONFIGS,
    AllDateRanges,
    mergeHeaderConfig
};