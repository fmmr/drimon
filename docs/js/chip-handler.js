/**
 * Unified Chip Handler
 * 
 * Single place for ALL chip handling - creation, updating, and lifecycle management.
 * Uses chip-config.js for configuration and consolidates all chip logic.
 */

/**
 * Chip Handler - manages all chip operations
 */
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
        const chip = document.createElement('div');
        chip.className = config.containerClass;
        
        // Add icon if configured
        if (config.hasIcon) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-question mr-1'; // Default icon, will be updated
            chip.appendChild(icon);
        }
        
        // Add value/text span
        const valueSpan = document.createElement('span');
        valueSpan.id = config.elementId;
        valueSpan.textContent = window.I18n.translate('loading');
        valueSpan.setAttribute('data-i18n', 'loading');
        chip.appendChild(valueSpan);
        
        // Add tooltip if configured
        if (config.hasTooltip) {
            const tooltipText = window.I18n.translate(config.tooltipKey);
            chip.setAttribute('data-tooltip-content', tooltipText);
            chip.setAttribute('data-has-tooltip', 'true');
            chip.setAttribute('data-i18n-title', config.tooltipKey);
        }
        
        // Store reference
        chipElements[chipKey] = {
            container: chip,
            valueElement: valueSpan,
            iconElement: config.hasIcon ? chip.querySelector('i') : null
        };
        
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
        
        // Get data value
        const value = data[config.dataKey];
        if (value === null || value === undefined) return;
        
        // Store latest value
        latestChipData[chipKey] = value;
        
        // Update display content
        if (config.hasText) {
            // Text-based chip (window, light)
            const textValue = window.getStatusFromThreshold(value, config.thresholds, 'texts');
            let displayText = textValue;
            
            if (config.needsTranslation && window.I18n) {
                displayText = window.I18n.translate(textValue);
            }
            
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
                const displayWindowState = config.needsTranslation ? window.I18n.translate(windowText) : windowText;
                tooltipData = {
                    [window.I18n.translate('window')]: `${value}mm`,
                    [window.I18n.translate('status')]: displayWindowState
                };
                break;
                
            case 'light':
                // Light tooltip shows value + status
                const lightText = window.getStatusFromThreshold(value, config.thresholds, 'texts');
                const displayLightState = config.needsTranslation ? window.I18n.translate(lightText) : lightText;
                tooltipData = {
                    [window.I18n.translate('ceiling')]: `${value} lux`,
                    [window.I18n.translate('light')]: displayLightState
                };
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
        
        console.log('ChipHandler initialized');
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