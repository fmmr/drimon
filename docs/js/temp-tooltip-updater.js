/**
 * Temperature Tooltip Updater
 * 
 * Updates the temperature data chip tooltip with chart statistics
 * once they become available.
 */

window.TempTooltipUpdater = (function() {
    // Store temperature chart statistics for tooltip use
    let tempChartStats = {
        main: {
            minValue: null,
            maxValue: null,
            avgValue: null,
            currentValue: null
        },
        other: {}, // Will store current values from other temp charts
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
        // Store the main temp chart stats
        tempChartStats.main = {
            ...tempChartStats.main,
            ...stats
        };
        tempChartStats.lastUpdated = new Date();
        
        // Update tooltip content
        updateTooltipContent();
        
        // Set flag
        tempTooltipUpdated = true;
    }
    
    /**
     * Calculate stats from main temperature chart if available
     */
    function updateMainTempStats() {
        const chart = window.chartInstances?.['chart-temp'];
        if (chart && chart.data?.datasets?.[0]?.data) {
            const data = chart.data.datasets[0].data;
            const values = data
                .map(d => typeof d === 'object' ? d.y : d)
                .filter(v => v !== null && v !== undefined && !isNaN(v));
                
            if (values.length > 0) {
                tempChartStats.main.minValue = Math.min(...values);
                tempChartStats.main.maxValue = Math.max(...values);
                tempChartStats.main.avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;
                tempChartStats.main.currentValue = values[values.length - 1];
            }
        }
        
        // Also use window.latestData if available
        if (window.latestData?.temperature) {
            tempChartStats.main.currentValue = window.latestData.temperature;
        }
    }

    /**
     * Collect current values from other temperature charts
     */
    function collectOtherTempValues() {
        const otherTempCharts = ['chart-out-temp', 'chart-temp-diff', 'chart-plants-temp', 'chart-sensors-temp'];
        
        tempChartStats.other = {};
        
        otherTempCharts.forEach(chartId => {
            const chart = window.chartInstances?.[chartId];
            if (!chart || !chart.data?.datasets) return;
            
            const config = window.chartConfigs?.find(c => c.id === chartId);
            if (!config) return;
            
            // Get chart title
            let title = config.title || chartId;
            if (config.titleKey && window.I18n) {
                const translated = window.I18n.translate(config.titleKey);
                if (translated !== config.titleKey) {
                    title = translated;
                }
            }
            
            // Handle multi-series charts (plants and sensors)
            if (config.isMultiSeries && chart.data.datasets.length > 1) {
                chart.data.datasets.forEach((dataset, index) => {
                    if (dataset.data && dataset.data.length > 0) {
                        const lastPoint = dataset.data[dataset.data.length - 1];
                        const value = typeof lastPoint === 'object' ? lastPoint.y : lastPoint;
                        if (value !== null && !isNaN(value)) {
                            const seriesKey = `${chartId}-${index}`;
                            
                            // Always use the series name from config
                            let seriesTitle = `Series ${index + 1}`; // fallback if no config
                            if (config.series && config.series[index]) {
                                const seriesConfig = config.series[index];
                                if (seriesConfig.titleKey) {
                                    // Try translation first, but always use the titleKey
                                    const translated = window.I18n ? window.I18n.translate(seriesConfig.titleKey) : seriesConfig.titleKey;
                                    seriesTitle = translated;
                                } else if (seriesConfig.title) {
                                    seriesTitle = seriesConfig.title;
                                }
                            }
                            
                            tempChartStats.other[seriesKey] = {
                                current: value,
                                title: seriesTitle || `${title} ${index + 1}`
                            };
                        }
                    }
                });
            } else {
                // Single series chart
                const dataset = chart.data.datasets[0];
                if (dataset?.data && dataset.data.length > 0) {
                    const lastPoint = dataset.data[dataset.data.length - 1];
                    const value = typeof lastPoint === 'object' ? lastPoint.y : lastPoint;
                    if (value !== null && !isNaN(value)) {
                        tempChartStats.other[chartId] = {
                            current: value,
                            title: title
                        };
                    }
                }
            }
        });
    }

    /**
     * Update the tooltip content with current statistics
     * @returns {void}
     */
    function updateTooltipContent() {
        // Update main temperature stats
        updateMainTempStats();
        
        // Collect data from other temperature charts
        collectOtherTempValues();
        
        // Get temp data chip
        const tempChip = document.querySelector('#temperature');
        if (!tempChip || !tempChip.parentElement) return;
        
        const tempChipElement = tempChip.parentElement;
        
        // Format stats values with appropriate precision
        const formatValue = (value) => {
            if (value === null || value === undefined) return '—';
            return typeof value === 'number' ? Math.round(value * 10) / 10 : value;
        };
        
        const currentTemp = formatValue(tempChartStats.main.currentValue);
        const minTemp = formatValue(tempChartStats.main.minValue);
        const maxTemp = formatValue(tempChartStats.main.maxValue);
        const avgTemp = formatValue(tempChartStats.main.avgValue);
        
        // Get translations for tooltip
        const tempLabel = window.I18n.translate('temperature');
        const nowLabel = window.I18n.translate('now');
        const minLabel = window.I18n.translate('low');
        const maxLabel = window.I18n.translate('high');
        const avgLabel = window.I18n.translate('avg');
        
        // Create tooltip content with stats
        let tooltipData = {};

        // Add main temperature statistics if available
        if (tempChartStats.main.minValue !== null) {
            tooltipData[nowLabel] = `${currentTemp} °C`;
            tooltipData[minLabel] = `${minTemp} °C`;
            tooltipData[avgLabel] = `${avgTemp} °C`;
            tooltipData[maxLabel] = `${maxTemp} °C`;
        } else {
            // Just show current if stats aren't available yet
            const current = window.latestData?.temperature || tempChartStats.main.currentValue;
            if (current !== null) {
                tooltipData[nowLabel] = `${formatValue(current)} °C`;
            }
        }

        // Add separator after main temperature stats
        if (tempChartStats.main.minValue !== null || (window.latestData?.temperature)) {
            tooltipData['---1'] = '';
        }

        // Add other temperature chart current values with separators
        const otherKeys = Object.keys(tempChartStats.other).sort();
        otherKeys.forEach((key, index) => {
            const data = tempChartStats.other[key];
            if (data.current !== null) {
                tooltipData[data.title] = `${formatValue(data.current)} °C`;
                
                // Add separators after specific entries
                if (data.title === 'Temp diff') {
                    tooltipData['---2'] = '';
                } else if (data.title === 'Padron') {
                    tooltipData['---3'] = '';
                }
            }
        });

        // Format the tooltip content using the HTML tabular formatter
        let tooltipContent = window.Utils.formatTabularTooltip(tooltipData, {
            useHTML: true
        });
        
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
                    tempChartStats.main.currentValue = window.latestData.temperature;
                }
                
                // Use recalculateChartStats to get statistics
                if (window.ChartStats && typeof window.ChartStats.recalculateChartStats === 'function') {
                    // This will trigger the event we listen for below
                    window.ChartStats.recalculateChartStats(chartInstance);
                }
                
                // Force update tooltip content
                updateTooltipContent();
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