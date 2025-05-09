/**
 * Light Tooltip Updater
 * 
 * Updates the light data chip tooltip with both light readings (ceiling and internal)
 * from chart statistics once they become available.
 */

window.LightTooltipUpdater = (function() {
    // Store light chart statistics for tooltip use
    let lightChartStats = {
        ceiling: {
            minValue: null,
            maxValue: null,
            avgValue: null,
            currentValue: null
        },
        internal: {
            minValue: null,
            maxValue: null,
            avgValue: null,
            currentValue: null
        },
        lastUpdated: null
    };
    
    // Flag to track if light tooltip has been updated with chart stats
    let lightTooltipUpdated = false;
    
    /**
     * Update the light tooltip with chart statistics
     * @param {Object} stats - Statistics object from chart
     * @param {Object} seriesData - Series data identifying which sensor this is for
     * @returns {void}
     */
    function updateLightTooltipWithStats(stats, seriesData) {
        if (!seriesData || !seriesData.titleKey) return;
        
        // Determine which light sensor this data is for
        const sensorType = seriesData.titleKey === 'ceiling' ? 'ceiling' : 
                         seriesData.titleKey === 'internal' ? 'internal' : null;
        
        if (!sensorType) return;
        
        // Store the stats for the specific sensor
        lightChartStats[sensorType] = {
            ...lightChartStats[sensorType],
            ...stats
        };
        
        // Update timestamp
        lightChartStats.lastUpdated = new Date();
        
        // Update tooltip content
        updateTooltipContent();
        
        // Set flag
        lightTooltipUpdated = true;
    }
    
    /**
     * Update the tooltip content with current statistics
     * @returns {void}
     */
    function updateTooltipContent() {
        // Get light data chip
        const lightChip = document.querySelector('#light');
        if (!lightChip || !lightChip.parentElement) return;
        
        const lightChipElement = lightChip.parentElement;
        
        // Format stats values with appropriate precision (always integer for light)
        const formatValue = (value) => {
            if (value === null || value === undefined) return '—';
            return typeof value === 'number' ? Math.round(value) : value;
        };
        
        // Get current light values from cached data
        let ceilingLight = null;
        let internalLight = null;
        
        // Use values from chart stats if available
        if (lightChartStats.ceiling.currentValue !== null) {
            ceilingLight = formatValue(lightChartStats.ceiling.currentValue);
        } else if (window.latestData && window.latestData.light !== null) {
            ceilingLight = formatValue(window.latestData.light);
        }
        
        // Get internal light from stored chart stats
        if (lightChartStats.internal.currentValue !== null) {
            internalLight = formatValue(lightChartStats.internal.currentValue);
        }
        
        // Get translations for tooltip
        const lightLabel = window.I18n.translate('light');
        const ceilingLabel = window.I18n.translate('ceiling');
        const internalLabel = window.I18n.translate('internal');
        
        let tooltipContent = '';
        
        // Start with the ceiling light value which is always available
        tooltipContent = `${ceilingLabel}: ${ceilingLight} lux`;
        
        // Add internal light value if available
        if (internalLight !== null) {
            tooltipContent += `\n${internalLabel}: ${internalLight} lux`;
        }
        
        // Add current light state from latestData
        if (window.latestData && window.latestData.light !== null) {
            const lightState = getLightText(window.latestData.light);
            let displayLightState = lightState;
            
            if (window.I18n && typeof window.I18n.translate === 'function') {
                // Map light state to translation key
                const lightKey = lightState === 'Natt' ? 'night' : 
                               lightState === 'Skumring' ? 'dusk' : 
                               lightState === 'Skyet' ? 'cloudy' : 
                               lightState === 'Sol' ? 'sunny' : lightState;
                displayLightState = window.I18n.translate(lightKey);
            }
            
            // Add light state to tooltip
            tooltipContent += `\n${lightLabel}: ${displayLightState}`;
        }
        
        // Update tooltip content
        lightChipElement.setAttribute('data-tooltip-content', tooltipContent);
        lightChipElement.setAttribute('data-has-tooltip', 'true');
    }
    
    // Helper function to get light state text based on light value
    function getLightText(light) {
        if (light < 5) return 'Natt';
        if (light < 500) return 'Skumring';
        if (light < 9000) return 'Skyet';
        return 'Sol';
    }
    
    /**
     * Listen for chart events to update statistics
     * @returns {void}
     */
    function initChartListeners() {
        // Check if light chart exists and get its data
        document.addEventListener('chart:rendered', function(event) {
            if (!event.detail || !event.detail.chartId) return;
            
            // Only interested in the light chart
            if (event.detail.chartId === 'chart-light') {
                const chartInstance = window.chartInstances['chart-light'];
                if (!chartInstance) return;
                
                // Get current light value from data handler if available
                if (window.latestData && window.latestData.light !== null) {
                    lightChartStats.ceiling.currentValue = window.latestData.light;
                }
                
                // Force stats recalculation for the chart
                if (window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                    window.ChartStats.recalculateChartStats(chartInstance);
                }
            }
        });
        
        // Listen for chart stats update events
        document.addEventListener('chart:stats:updated', function(event) {
            if (!event.detail || !event.detail.chartId) return;
            
            // Only interested in the light chart
            if (event.detail.chartId === 'chart-light') {
                const stats = event.detail.stats || {};
                const seriesData = event.detail.seriesData || {};
                
                updateLightTooltipWithStats(stats, seriesData);
            }
        });
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            initChartListeners();
            
            // Try to update tooltip content with available data
            updateTooltipContent();
            
            // After a delay, force a stat recalculation if charts are loaded
            setTimeout(() => {
                if (window.chartInstances && window.chartInstances['chart-light'] && 
                    window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                    window.ChartStats.recalculateChartStats(window.chartInstances['chart-light']);
                }
                updateTooltipContent();
            }, 2000);
        }, 1000);
        
        // Also listen for language changes to update tooltip text
        document.addEventListener('languageChanged', function() {
            updateTooltipContent();
        });
    });
    
    // Also listen for chart rendering completed to update tooltip
    document.addEventListener('chart:rendered', function(event) {
        // Allow time for chart to fully initialize
        setTimeout(() => {
            // Force stats recalculation for light chart
            if (window.chartInstances && window.chartInstances['chart-light'] && 
                window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                window.ChartStats.recalculateChartStats(window.chartInstances['chart-light']);
            }
            updateTooltipContent();
        }, 500);
    });
    
    // Public API
    return {
        updateLightTooltipWithStats,
        getStats: () => ({ ...lightChartStats }),
        isUpdated: () => lightTooltipUpdated
    };
})();