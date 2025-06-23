/**
 * Chip Configuration System
 * 
 * Provides a unified configuration system for all data chips in the DriMon application.
 * Follows the same pattern as header-config.js and chart-config.js with:
 * - Default configuration as documentation
 * - Individual chip configs that override defaults
 * - Merge function to create final configurations
 */

// Default chip configuration - serves as documentation and fallback
const DefaultChipConfig = {
    // Data source configuration
    dataKey: null,              // Key in latestData object (e.g., 'temperature', 'battery')
    unit: '',                   // Display unit (e.g., '°C', '%', 'hPa')
    
    // Display configuration
    hasIcon: false,             // Whether chip shows an icon
    hasStatus: false,           // Whether chip shows status CSS classes
    hasText: false,             // Whether chip shows text instead of value
    needsTranslation: false,    // Whether text values need i18n translation
    
    // Threshold configuration
    thresholds: {
        statusRanges: [],       // Ranges for CSS status classes
        statuses: [],           // CSS status class names
        iconRanges: [],         // Ranges for icon selection
        icons: [],              // Icon names (without fas fa- prefix)
        textRanges: [],         // Ranges for text values
        texts: []               // Text values (i18n keys if needsTranslation is true)
    },
    
    // Tooltip configuration
    hasTooltip: true,           // Whether chip shows tooltip
    customTooltip: false,       // Whether chip uses custom tooltip logic
    tooltipKey: null,           // Base i18n key for tooltip title
    
    // Layout configuration
    views: ['mobile', 'desktop', 'dashboard'], // Which views show this chip
    order: 100,                 // Display order within view
    
    // Custom behavior
    customUpdate: false,        // Whether chip uses custom update logic
    updateFunction: null,       // Custom update function name (global scope)
    additionalData: [],         // Additional data keys needed for this chip
    fixedIcon: null,            // Fixed icon name (overrides threshold-based icons)
    
    // Element configuration
    elementId: null,            // DOM element ID for the value span
    containerClass: 'data-chip' // CSS class for the chip container
};

// Individual chip configurations
const ChipConfigs = {
    timeChip: {
        dataKey: 'timeSince', // Shows HH:MM format time
        hasIcon: true,
        hasTooltip: true,
        customTooltip: true, // Complex tooltip with multiple channel timestamps
        tooltipKey: 'time',
        views: ['mobile', 'desktop', 'dashboard'],
        order: 1,
        elementId: 'time-since',
        containerClass: 'data-chip time-pill',
        // Time chip uses fixed clock icon
        fixedIcon: 'clock'
    },

    temperature: {
        dataKey: 'temperature',
        unit: '°C',
        hasIcon: true,
        hasStatus: true,
        thresholds: {
            statusRanges: [16, 35],
            statuses: ['low', 'normal', 'critical'],
            iconRanges: [5, 10, 15, 20, 25, 30, 33],
            icons: ['thermometer-empty', 'thermometer-quarter', 'thermometer-quarter', 'thermometer-half', 'thermometer-half', 'thermometer-three-quarters', 'thermometer-full', 'fire']
        },
        tooltipKey: 'temperature',
        views: ['mobile', 'desktop', 'dashboard'],
        order: 2,
        elementId: 'temperature'
    },
    
    weather: {
        dataKey: 'metTemp', // Gets data from latestWeatherData
        unit: '°C',
        hasIcon: true,
        hasStatus: true,
        thresholds: {
            statusRanges: [17, 25],
            statuses: ['low', 'normal', 'critical']
        },
        hasTooltip: true,
        customTooltip: true, // Complex weather tooltip 
        tooltipKey: 'outTempChart',
        views: ['mobile', 'desktop', 'dashboard'],
        order: 3,
        elementId: 'met-temp',
        containerClass: 'data-chip weather-data-chip'
    },
    
    sunEvents: {
        customUpdate: true,
        updateFunction: 'window.SunEvents.updateSunEventsChip',
        hasTooltip: true,
        customTooltip: true,
        views: ['mobile', 'desktop'],
        order: 4,
        elementId: 'sun-events-chip',
        containerClass: 'data-chip sun-events-chip'
    },
    
    pressure: {
        dataKey: 'pressure',
        unit: 'hPa',
        hasStatus: true,
        thresholds: {
            statusRanges: [1000, 1010],
            statuses: ['low-pressure', 'normal', 'high-pressure']
        },
        hasTooltip: false,
        views: ['mobile', 'desktop', 'dashboard'],
        order: 5,
        elementId: 'pressure'
    },
    
    battery: {
        dataKey: 'battery',
        unit: '%',
        hasIcon: true,
        hasStatus: true,
        thresholds: {
            statusRanges: [60, 80, 90],
            statuses: ['critical', 'warning', 'low', 'good'],
            iconRanges: [10, 25, 50, 75, 95],
            icons: ['battery-empty', 'battery-quarter', 'battery-quarter', 'battery-half', 'battery-three-quarters', 'battery-full']
        },
        hasTooltip: true,
        customTooltip: true, // Uses battery + voltage tooltip
        tooltipKey: 'battery',
        views: ['mobile', 'desktop', 'dashboard'],
        order: 6,
        elementId: 'battery',
        // Additional data needed for battery tooltip
        additionalData: ['batteryVolt']
    },
    
    window: {
        dataKey: 'windowOpening',
        hasIcon: true,
        hasText: true,
        needsTranslation: true,
        thresholds: {
            textRanges: [75, 100],
            texts: ['closed', 'ajar', 'open'],
            iconRanges: [75, 100],
            icons: ['window-close', 'grip-lines-vertical', 'window-maximize']
        },
        hasTooltip: true,
        customTooltip: true, // Uses window + status tooltip
        tooltipKey: 'window',
        views: ['mobile', 'desktop'],
        order: 7,
        elementId: 'window'
    },
    
    light: {
        dataKey: 'light',
        hasText: true,
        needsTranslation: true,
        thresholds: {
            textRanges: [5, 500, 9000],
            texts: ['night', 'dusk', 'cloudy', 'sunny']
        },
        hasTooltip: true,
        customTooltip: true, // Uses light + status tooltip
        tooltipKey: 'light',
        views: ['mobile', 'desktop'],
        order: 8,
        elementId: 'light'
    }
};

/**
 * Merge default configuration with chip-specific configuration
 * @param {Object} chipConfig - Chip-specific configuration
 * @returns {Object} Merged configuration
 */
function mergeChipConfig(chipConfig) {
    // Deep merge thresholds object
    const mergedThresholds = {
        ...DefaultChipConfig.thresholds,
        ...chipConfig.thresholds
    };
    
    // Merge main config
    const merged = {
        ...DefaultChipConfig,
        ...chipConfig,
        thresholds: mergedThresholds
    };
    
    return merged;
}

/**
 * Get merged configuration for a specific chip
 * @param {string} chipKey - Key of the chip to get config for
 * @returns {Object} Merged chip configuration
 */
function getChipConfig(chipKey) {
    const chipConfig = ChipConfigs[chipKey];
    if (!chipConfig) {
        throw new Error(`Unknown chip configuration: ${chipKey}`);
    }
    
    return mergeChipConfig(chipConfig);
}

/**
 * Get all chip configurations for a specific view
 * @param {string} view - View name ('mobile', 'desktop', 'dashboard')
 * @returns {Array} Array of chip configurations sorted by order
 */
function getChipsForView(view) {
    const chips = [];
    
    Object.keys(ChipConfigs).forEach(chipKey => {
        const config = getChipConfig(chipKey);
        if (config.views.includes(view)) {
            chips.push({
                key: chipKey,
                config: config
            });
        }
    });
    
    // Sort by order
    chips.sort((a, b) => a.config.order - b.config.order);
    
    return chips;
}

/**
 * Get all available chip keys
 * @returns {Array} Array of chip keys
 */
function getAllChipKeys() {
    return Object.keys(ChipConfigs);
}

/**
 * Generate THRESHOLDS object from chip configurations for backward compatibility
 * @returns {Object} THRESHOLDS object in the old format
 */
function generateThresholds() {
    const thresholds = {};
    
    Object.keys(ChipConfigs).forEach(chipKey => {
        const config = mergeChipConfig(ChipConfigs[chipKey]);
        
        if (config.thresholds && Object.keys(config.thresholds).length > 0) {
            // Map chip keys to THRESHOLDS keys
            let thresholdKey;
            switch (chipKey) {
                case 'temperature': thresholdKey = 'TEMPERATURE'; break;
                case 'battery': thresholdKey = 'BATTERY'; break;
                case 'pressure': thresholdKey = 'PRESSURE'; break;
                case 'weather': thresholdKey = 'WEATHER'; break;
                case 'window': thresholdKey = 'WINDOW'; break;
                case 'light': thresholdKey = 'LIGHT'; break;
                default: return; // Skip chips without threshold mapping
            }
            
            thresholds[thresholdKey] = config.thresholds;
        }
    });
    
    return thresholds;
}

// Export configurations and utilities
window.ChipConfig = {
    // Configurations
    DefaultChipConfig,
    ChipConfigs,
    
    // Utilities
    mergeChipConfig,
    getChipConfig,
    getChipsForView,
    getAllChipKeys,
    generateThresholds
};

// Create THRESHOLDS object for backward compatibility
window.THRESHOLDS = generateThresholds();

// Make individual functions available globally for backward compatibility
window.getChipConfig = getChipConfig;
window.getChipsForView = getChipsForView;