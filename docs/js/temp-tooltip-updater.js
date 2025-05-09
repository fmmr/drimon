/**
 * Temperature Tooltip Updater
 * 
 * Updates the temperature data chip tooltip with chart statistics
 * once they become available.
 */

window.TempTooltipUpdater = (function() {
    // Store temperature chart statistics for tooltip use
    let tempChartStats = {
        minValue: null,
        maxValue: null,
        avgValue: null,
        currentValue: null,
        lastUpdated: null
    };
    
    // Flag to track if temp tooltip has been updated with chart stats
    let tempTooltipUpdated = false;
    
    /**
     * Update the temperature tooltip with chart statistics
     * @param {Object} stats - Statistics object from chart
     * @returns {void}
     */
    function updateTempTooltipWithStats(stats) {
        // Store the stats
        tempChartStats = {
            ...tempChartStats,
            ...stats,
            lastUpdated: new Date()
        };
        
        // Update tooltip content
        updateTooltipContent();
        
        // Set flag
        tempTooltipUpdated = true;
    }
    
    /**
     * Update the tooltip content with current statistics
     * @returns {void}
     */
    function updateTooltipContent() {
        // Get temp data chip
        const tempChip = document.querySelector('#temperature');
        if (!tempChip || !tempChip.parentElement) return;
        
        const tempChipElement = tempChip.parentElement;
        
        // Format stats values with appropriate precision
        const formatValue = (value) => {
            if (value === null || value === undefined) return '—';
            return typeof value === 'number' ? Math.round(value * 10) / 10 : value;
        };
        
        const currentTemp = formatValue(tempChartStats.currentValue);
        const minTemp = formatValue(tempChartStats.minValue);
        const maxTemp = formatValue(tempChartStats.maxValue);
        const avgTemp = formatValue(tempChartStats.avgValue);
        
        // Get translations for tooltip
        const tempLabel = window.I18n.translate('temperature');
        const nowLabel = window.I18n.translate('now');
        const minLabel = window.I18n.translate('low');
        const maxLabel = window.I18n.translate('high');
        const avgLabel = window.I18n.translate('avg');
        
        // Create tooltip content with stats
        let tooltipContent = `${tempLabel}: ${currentTemp} °C`;
        
        // Add statistics if available
        if (tempChartStats.minValue !== null) {
            tooltipContent += `\n${minLabel}: ${minTemp} °C`;
            tooltipContent += `\n${avgLabel}: ${avgTemp} °C`;
            tooltipContent += `\n${maxLabel}: ${maxTemp} °C`;
        } else if (window.latestData && window.latestData.temperature !== null) {
            // Use current temperature as fallback for all stats until real stats arrive
            const current = window.latestData.temperature;
            tooltipContent += `\n${minLabel}: ${formatValue(current)} °C`;
            tooltipContent += `\n${avgLabel}: ${formatValue(current)} °C`;
            tooltipContent += `\n${maxLabel}: ${formatValue(current)} °C`;
        } else {
            // Show simple statistics info if chart data isn't loaded yet
            tooltipContent = `${tempLabel}: ${currentTemp} °C\n${window.I18n.translate('statsLoading') || 'Loading stats...'}`;
        }
        
        // Update tooltip content
        tempChipElement.setAttribute('data-tooltip-content', tooltipContent);
        tempChipElement.setAttribute('data-has-tooltip', 'true');
    }
    
    /**
     * Listen for chart events to update statistics
     * Called when a chart is created or updated
     * @returns {void}
     */
    function initChartListeners() {
        // Check if temp chart exists and get its data
        document.addEventListener('chart:rendered', function(event) {
            if (!event.detail || !event.detail.chartId) return;
            
            // Only interested in the temperature chart
            if (event.detail.chartId === 'chart-temp') {
                const chartInstance = window.chartInstances['chart-temp'];
                if (!chartInstance) return;
                
                // Get current temperature from data handler if available
                if (window.latestData && window.latestData.temperature) {
                    tempChartStats.currentValue = window.latestData.temperature;
                }
                
                // Use recalculateChartStats to get statistics
                if (window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                    // This will trigger the event we listen for below
                    window.ChartStats.recalculateChartStats(chartInstance);
                    
                    // Attempt to get stats directly as a backup
                    setTimeout(() => {
                        // If we didn't get stats update yet, try again
                        if (tempChartStats.minValue === null) {
                            // Calculate basic stats manually
                            const datasets = chartInstance.data.datasets;
                            if (datasets && datasets.length > 0) {
                                const values = datasets[0].data
                                    .map(d => typeof d === 'object' ? d.y : d)
                                    .filter(v => !isNaN(v));
                                    
                                if (values.length > 0) {
                                    tempChartStats.minValue = Math.min(...values);
                                    tempChartStats.maxValue = Math.max(...values);
                                    tempChartStats.avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
                                    updateTooltipContent();
                                }
                            }
                        }
                    }, 1000); // Wait a second before trying manual calculation
                }
            }
        });
        
        // Listen for chart stats update events
        document.addEventListener('chart:stats:updated', function(event) {
            if (!event.detail || !event.detail.chartId) return;
            
            // Only interested in the temperature chart
            if (event.detail.chartId === 'chart-temp') {
                const stats = event.detail.stats || {};
                updateTempTooltipWithStats(stats);
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
                if (window.chartInstances && window.chartInstances['chart-temp'] && 
                    window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                    window.ChartStats.recalculateChartStats(window.chartInstances['chart-temp']);
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
            // Force stats recalculation for temperature chart
            if (window.chartInstances && window.chartInstances['chart-temp'] && 
                window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                window.ChartStats.recalculateChartStats(window.chartInstances['chart-temp']);
            }
            updateTooltipContent();
        }, 500);
    });
    
    // Public API
    return {
        updateTempTooltipWithStats,
        getStats: () => ({ ...tempChartStats }),
        isUpdated: () => tempTooltipUpdated
    };
})();