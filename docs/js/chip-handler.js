/**
 * Unified Chip Handler
 * 
 * Single place for ALL chip handling - creation, updating, and lifecycle management.
 * Uses chip-config.js for configuration and consolidates all chip logic.
 */

/**
 * Chip Handler - manages all chip operations
 */
/**
 * Threshold utility function - moved from data-handler.js
 */
window.getStatusFromThreshold = function(value, thresholdConfig, type = 'statuses') {
    let ranges;
    if (type === 'statuses') {
        ranges = thresholdConfig.statusRanges;
    } else if (type === 'icons') {
        ranges = thresholdConfig.iconRanges;
    } else if (type === 'texts') {
        ranges = thresholdConfig.textRanges;
    } else {
        throw new Error(`Invalid type: ${type}. Must be 'statuses', 'icons', or 'texts'`);
    }
    
    const results = thresholdConfig[type];
    
    if (!ranges) {
        throw new Error(`Invalid threshold config: missing ${type}Ranges property`);
    }
    
    if (!results) {
        throw new Error(`Invalid threshold config: missing ${type} property`);
    }
    
    if (results.length !== ranges.length + 1) {
        throw new Error(`Invalid threshold config: ${results.length} ${type} but ${ranges.length} ranges. Must be n+1.`);
    }
    
    for (let i = 0; i < ranges.length; i++) {
        if (value < ranges[i]) {
            return results[i];
        }
    }
    
    return results[results.length - 1];
};

window.ChipHandler = (function() {
    
    // Cache for created chip elements
    let chipElements = {};
    
    // Cache for latest data values
    let latestChipData = {};
    
    /**
     * Create a chip element based on configuration
     * @param {string} chipKey - Key of the chip to create
     * @param {Object} config - Merged chip configuration
     * @returns {HTMLElement} Created chip element
     */
    function createChip(chipKey, config) {
        let chip;
        let valueSpan;
        let iconElement = null;
        
        // Handle special chip types with complex DOM structures
        if (chipKey === 'weather') {
            chip = createWeatherChip(config);
            valueSpan = chip.querySelector('#met-temp');
            iconElement = chip.querySelector('.weather-icon');
        } else if (chipKey === 'sunEvents') {
            chip = createSunEventsChip(config);
            valueSpan = chip.querySelector('#next-event-time');
            iconElement = chip.querySelector('#moon-phase-icon');
        } else {
            // Standard chip creation
            chip = document.createElement('div');
            chip.className = config.containerClass;
            
            // Add icon if configured
            if (config.hasIcon) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-question mr-1'; // Default icon, will be updated
                chip.appendChild(icon);
                iconElement = icon;
            }
            
            // Add value/text span
            valueSpan = document.createElement('span');
            valueSpan.id = config.elementId;
            valueSpan.textContent = window.I18n.translate('loading');
            valueSpan.setAttribute('data-i18n', 'loading');
            chip.appendChild(valueSpan);
        }
        
        // Add tooltip if configured
        if (config.hasTooltip && config.tooltipKey) {
            const tooltipText = window.I18n.translate(config.tooltipKey);
            chip.setAttribute('data-tooltip-content', tooltipText);
            chip.setAttribute('data-has-tooltip', 'true');
            chip.setAttribute('data-i18n-title', config.tooltipKey);
        }
        
        // Store reference
        chipElements[chipKey] = {
            container: chip,
            valueElement: valueSpan,
            iconElement: iconElement
        };
        
        return chip;
    }
    
    /**
     * Create weather chip with complex DOM structure
     * @param {Object} config - Chip configuration
     * @returns {HTMLElement} Weather chip element
     */
    function createWeatherChip(config) {
        const chip = document.createElement('div');
        chip.className = config.containerClass;
        chip.id = 'met-link';

        // Create weather icon container
        const weatherIcon = document.createElement('div');
        weatherIcon.className = 'weather-icon';
        weatherIcon.id = 'weather-icon-container';
        weatherIcon.innerHTML = `<svg viewBox="0 0 20 20" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="transparent" stroke="#666" stroke-width="0.5" />
        </svg>`;

        // Create temperature display container
        const temperatureDisplay = document.createElement('div');
        temperatureDisplay.className = 'weather-temp-display';

        // Temperature text element
        const metTemp = document.createElement('span');
        metTemp.id = config.elementId;
        metTemp.textContent = window.I18n.translate('loading');
        metTemp.setAttribute('data-i18n', 'loading');

        temperatureDisplay.appendChild(metTemp);
        chip.appendChild(weatherIcon);
        chip.appendChild(temperatureDisplay);

        return chip;
    }
    
    /**
     * Create sun events chip with complex DOM structure
     * @param {Object} config - Chip configuration
     * @returns {HTMLElement} Sun events chip element
     */
    function createSunEventsChip(config) {
        const chip = document.createElement('div');
        chip.className = config.containerClass;
        chip.id = config.elementId;
        
        // Create moon phase SVG icon container
        const moonPhaseIcon = document.createElement('div');
        moonPhaseIcon.className = 'moon-phase-icon';
        moonPhaseIcon.id = 'moon-phase-icon';
        moonPhaseIcon.innerHTML = `<svg viewBox="0 0 20 20" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="9" fill="#222" stroke="#666" stroke-width="0.5" />
        </svg>`;
        
        // Create time display element
        const timeDisplay = document.createElement('div');
        timeDisplay.className = 'sun-event-time';
        
        // Main time element for next event
        const nextEventTime = document.createElement('span');
        nextEventTime.id = 'next-event-time';
        nextEventTime.textContent = '--:--';
        
        // Remaining time element (empty now)
        const remainingTime = document.createElement('span');
        remainingTime.id = 'remaining-time';
        remainingTime.className = 'remaining-time';
        remainingTime.textContent = '';
        
        timeDisplay.appendChild(nextEventTime);
        timeDisplay.appendChild(remainingTime);
        chip.appendChild(moonPhaseIcon);
        chip.appendChild(timeDisplay);
        
        // Mark as having tooltip
        chip.setAttribute('data-has-tooltip', 'true');
        
        return chip;
    }
    
    /**
     * Update a chip with new data
     * @param {string} chipKey - Key of the chip to update
     * @param {Object} config - Merged chip configuration
     * @param {Object} data - Latest data object
     */
    function updateChip(chipKey, config, data) {
        const elements = chipElements[chipKey];
        if (!elements) return;
        
        // Handle custom update functions
        if (config.customUpdate && config.updateFunction) {
            try {
                // Call custom update function
                if (typeof window[config.updateFunction] === 'function') {
                    window[config.updateFunction]();
                } else {
                    // Try to access nested function (e.g., window.SunEvents.updateSunEventsChip)
                    const funcPath = config.updateFunction.split('.');
                    let func = window;
                    for (const part of funcPath) {
                        func = func[part];
                    }
                    if (typeof func === 'function') {
                        func();
                    }
                }
            } catch (error) {
                console.warn(`Failed to call custom update function for ${chipKey}:`, error);
            }
            return;
        }
        
        // Get data value - special handling for weather chip
        let value;
        if (chipKey === 'weather') {
            // Weather data comes from latestWeatherData
            if (!window.latestWeatherData || !window.latestWeatherData.properties) return;
            const details = window.latestWeatherData.properties.timeseries[0].data.instant.details;
            value = Math.round(details.air_temperature * 10) / 10;
        } else {
            value = data[config.dataKey];
            if (value === null || value === undefined) return;
        }
        
        // Store latest value
        latestChipData[chipKey] = value;
        
        // Update display content
        if (chipKey === 'timeChip') {
            // Special handling for time chip - show HH:MM format
            const createdDate = new Date(latestChipData.createdAt || data.createdAt);
            const timeFormatted = createdDate.toLocaleTimeString('no-NO', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            elements.valueElement.textContent = timeFormatted;
            elements.valueElement.setAttribute('data-timestamp', createdDate.toISOString());
        } else if (config.hasText) {
            // Text-based chip (window, light)
            const textValue = window.getStatusFromThreshold(value, config.thresholds, 'texts');
            const displayText = window.I18n.translate(textValue);
            
            elements.valueElement.innerHTML = displayText;
        } else {
            // Value-based chip (temperature, battery, pressure)
            elements.valueElement.innerHTML = `${value} ${config.unit}`;
        }
        
        // Update status class
        if (config.hasStatus) {
            const statusClass = window.getStatusFromThreshold(value, config.thresholds, 'statuses');
            elements.container.className = `${config.containerClass} ${statusClass}`;
        } else {
            elements.container.className = config.containerClass;
        }
        
        // Update icon
        if (config.hasIcon && elements.iconElement) {
            let iconName;
            if (config.fixedIcon) {
                // Use fixed icon
                iconName = config.fixedIcon;
            } else {
                // Use threshold-based icon
                iconName = window.getStatusFromThreshold(value, config.thresholds, 'icons');
            }
            elements.iconElement.className = `fas fa-${iconName} mr-1`;
        }
        
        // Update tooltip
        if (config.hasTooltip) {
            if (config.customTooltip) {
                updateCustomTooltip(chipKey, config, value);
            } else {
                // Standard tooltip just shows the translated title
                const tooltipText = window.I18n.translate(config.tooltipKey);
                elements.container.setAttribute('data-tooltip-content', tooltipText);
            }
        }
    }
    
    /**
     * Update custom tooltips for specific chips
     * @param {string} chipKey - Key of the chip
     * @param {Object} config - Chip configuration
     * @param {*} value - Current value
     */
    function updateCustomTooltip(chipKey, config, value) {
        const elements = chipElements[chipKey];
        if (!elements) return;
        
        let tooltipData = {};
        
        switch (chipKey) {
            case 'battery':
                // Battery tooltip includes voltage
                tooltipData = {
                    [window.I18n.translate('battery')]: `${value}%`,
                    [window.I18n.translate('batteryVoltage')]: `${latestChipData.batteryVolt || window.latestData?.batteryVolt || 0}V`
                };
                break;
                
            case 'window':
                // Window tooltip shows value + status
                const windowText = window.getStatusFromThreshold(value, config.thresholds, 'texts');
                const displayWindowState = window.I18n.translate(windowText);
                tooltipData = {
                    [window.I18n.translate('window')]: `${value}mm`,
                    [window.I18n.translate('status')]: displayWindowState
                };
                break;
                
            case 'light':
                // Light tooltip shows value + status
                const lightText = window.getStatusFromThreshold(value, config.thresholds, 'texts');
                const displayLightState = window.I18n.translate(lightText);
                tooltipData = {
                    [window.I18n.translate('ceiling')]: `${value} lux`,
                    [window.I18n.translate('light')]: displayLightState
                };
                break;
                
            case 'timeChip':
                // Complex time tooltip with multiple channel timestamps
                const timeTooltipData = {};
                
                // Create labels using channel info from THINGSPEAK.CHANNELS
                const drimonLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.DRIMON_CHANNEL.id})`;
                const tempLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TEMP_CHANNEL.id})`;
                const techLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.TECH_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.TECH_CHANNEL.id})`;
                const extLabel = `${window.I18n.translate(window.THINGSPEAK.CHANNELS.EXT_CHANNEL.translationKey)} (${window.THINGSPEAK.CHANNELS.EXT_CHANNEL.id})`;

                // Add data from different channels
                if (window.latestData1) {
                    timeTooltipData[drimonLabel] = window.latestData1.lastUpdated;
                }
                if (window.latestData2) {
                    timeTooltipData[tempLabel] = window.latestData2.lastUpdated;
                }
                if (window.latestData3) {
                    timeTooltipData[techLabel] = window.latestData3.lastUpdated;
                }
                if (window.latestData4) {
                    timeTooltipData[extLabel] = window.latestData4.lastUpdated;
                }
                
                // Add local time
                timeTooltipData[window.I18n.translate('localTime')] = window.moment().format('L LTS');
                
                // Add weather data timestamps if available
                if (window.latestWeatherData && window.latestWeatherData.properties) {
                    const weatherData = window.latestWeatherData.properties;
                    
                    if (weatherData.timeseries && weatherData.timeseries.length > 0) {
                        timeTooltipData[window.I18n.translate('forecastTime')] = window.moment(weatherData.timeseries[0].time).format('L LTS');
                    }
                    
                    if (weatherData.meta?.updated_at) {
                        timeTooltipData[window.I18n.translate('nowcastUpdated')] = window.moment(weatherData.meta.updated_at).format('L LTS');
                    }
                }
                
                if (window.latestForecastData && window.latestForecastData._lastUpdated) {
                    timeTooltipData[window.I18n.translate('forecastUpdated')] = window.moment(window.latestForecastData._lastUpdated).format('L LTS');
                }

                // Add the "X minutes ago" text as the first item in the tooltip
                const updateTimeData = {
                    [window.I18n.translate('time')]: latestChipData.timeSince || window.latestData?.timeSince
                };
                
                // Combine update time with other channel data
                tooltipData = { ...updateTimeData, ...timeTooltipData };
                break;
                
            default:
                // Fallback to standard tooltip
                tooltipData = {
                    [window.I18n.translate(config.tooltipKey)]: `${value} ${config.unit}`
                };
        }
        
        // Format tooltip using HTML tabular formatter if available
        const tooltipText = window.Utils && typeof window.Utils.formatTabularTooltip === 'function'
            ? window.Utils.formatTabularTooltip(tooltipData, { useHTML: true })
            : Object.entries(tooltipData).map(([key, val]) => `${key}: ${val}`).join('\n');
        
        elements.container.setAttribute('data-tooltip-content', tooltipText);
    }
    
    /**
     * Create all chips for a specific view
     * @param {string} view - View name ('mobile', 'desktop', 'dashboard')
     * @returns {Array} Array of created chip elements
     */
    function createChipsForView(view) {
        const chips = window.getChipsForView(view);
        const createdChips = [];
        
        chips.forEach(({ key, config }) => {
            const chipElement = createChip(key, config);
            createdChips.push({
                key,
                element: chipElement,
                config
            });
        });
        
        return createdChips;
    }
    
    /**
     * Update all chips with latest data
     * @param {Object} data - Latest data object
     */
    function updateAllChips(data) {
        // Store reference to latest data
        if (data) {
            Object.assign(latestChipData, data);
        }
        
        // Update each chip
        window.getAllChipKeys().forEach(chipKey => {
            try {
                const config = window.getChipConfig(chipKey);
                updateChip(chipKey, config, latestChipData);
            } catch (error) {
                console.warn(`Failed to update chip ${chipKey}:`, error);
            }
        });
    }
    
    /**
     * Update chips when language changes
     */
    function updateChipsForLanguageChange() {
        window.getAllChipKeys().forEach(chipKey => {
            try {
                const config = window.getChipConfig(chipKey);
                const elements = chipElements[chipKey];
                
                if (!elements) return;
                
                // Update tooltip title
                if (config.hasTooltip && config.tooltipKey) {
                    const tooltipText = window.I18n.translate(config.tooltipKey);
                    elements.container.setAttribute('data-tooltip-content', tooltipText);
                }
                
                // Re-update the chip to refresh translated text
                if (latestChipData[config.dataKey] !== undefined) {
                    updateChip(chipKey, config, latestChipData);
                }
            } catch (error) {
                console.warn(`Failed to update chip ${chipKey} for language change:`, error);
            }
        });
    }
    
    /**
     * Get chip element references
     * @param {string} chipKey - Key of the chip
     * @returns {Object} Object with container, valueElement, and iconElement
     */
    function getChipElements(chipKey) {
        return chipElements[chipKey] || null;
    }
    
    /**
     * Initialize chip handler
     */
    function initialize() {
        // Listen for language changes
        document.addEventListener('languageChanged', updateChipsForLanguageChange);
    }
    
    // Public API
    return {
        // Creation
        createChip,
        createChipsForView,
        
        // Updates
        updateChip,
        updateAllChips,
        updateChipsForLanguageChange,
        
        // Utilities
        getChipElements,
        initialize,
        
        // Data access
        get latestData() { return { ...latestChipData }; }
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ChipHandler.initialize();
});