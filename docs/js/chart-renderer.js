'use strict';

// Chart renderer module for visualizing data using Chart.js

// Register the moment.js adapter for Chart.js time scale
// This ensures proper time formatting for the axis
// Create a simple adapter that uses moment.js for date handling
Chart.register({
    id: 'moment',
    _date: {
        parse: function(value) {
            return moment(value).toDate();
        },
        format: function(time, format) {
            return moment(time).format(format);
        },
        add: function(time, amount, unit) {
            return moment(time).add(amount, unit).toDate();
        },
        diff: function(max, min, unit) {
            return moment(max).diff(moment(min), unit);
        },
        startOf: function(time, unit, weekday) {
            return moment(time).startOf(unit).toDate();
        },
        endOf: function(time, unit) {
            return moment(time).endOf(unit).toDate();
        }
    }
});

// Global Chart.js configuration
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Export ChartUtils.determineSmartTimeFormat function globally for direct access
window.determineSmartTimeFormat = window.ChartUtils.determineSmartTimeFormat;

// Store all created charts to allow updates
// Export as a global variable for access by script.js
window.chartInstances = {};
const chartInstances = window.chartInstances;

/**
 * Prepares chart data from the raw data source
 * Processes raw API data into a format suitable for Chart.js, handling both
 * single and multi-series charts.
 * 
 * @param {Object} config - The chart configuration
 * @param {Object} data - The raw data from the API
 * @returns {Object} Processed data including datasets, stats, and formatting options
 */
function prepareChartData(config, data) {
    let datasets = [];
    let allValues = [];
    let timestamps = [];
    let hasNegativeValues = false;
    
    // 1. Validate and extract basic data
    if (data.is_multi_series) {
        // Handle multi-series data
        if (!data.series || data.series.length === 0 || data.series[0].feeds.length === 0) {
            return { 
                isValid: false,
                errorType: 'no-valid-series-data'
            };
        }
        
        // Use timestamps from first series for consistency
        timestamps = data.series[0].feeds.map(feed => feed.created_at);
        
        // 2. Process each series
        data.series.forEach((series, index) => {
            // Get and transform values
            let rawValues = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
            const seriesValues = window.ChartUtils.transformValues(rawValues, config.dataTransform);
            const seriesFiltered = seriesValues.filter(v => !isNaN(v));
            
            // Skip empty series
            if (seriesFiltered.length === 0) return;
            
            // Track negative values
            if (seriesFiltered.some(v => v < 0)) {
                hasNegativeValues = true;
            }
            
            // Combine with other values for stats
            allValues = allValues.concat(seriesFiltered);
            
            // Create dataset configuration
            const seriesConfig = {
                ...series,
                index,
                title: series.title,
                titleKey: series.titleKey,
                color: series.color,
                axis: series.axis
            };
            
            const dataset = window.ChartUtils.createDatasetConfig(seriesConfig, seriesValues, true);
            datasets.push(dataset);
        });
    } else {
        // Handle single series data
        let rawValues = data.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
        const values = window.ChartUtils.transformValues(rawValues, config.dataTransform);
        const filteredValues = values.filter(v => !isNaN(v));
        
        // Validate data
        if (filteredValues.length === 0) {
            return { 
                isValid: false,
                errorType: 'no-valid-numeric-values'
            };
        }
        
        // Track values and stats
        allValues = filteredValues;
        timestamps = data.feeds.map(feed => feed.created_at);
        hasNegativeValues = values.some(v => v < 0);
        
        // Create dataset for single series
        const dataset = window.ChartUtils.createDatasetConfig(config, values, false);
        datasets.push(dataset);
    }
    
    // 3. Calculate data statistics
    const stats = window.Utils.calculateStatistics({
        values: allValues,
        includePadding: true
    });
    
    // 4. Prepare chart storage for tooltips and syncing
    window.ChartUtils.storeChartData(config.id, config, timestamps, datasets, data.is_multi_series, data);
    
    // 5. Set up locale and time formatting
    const lang = window.I18n.getCurrentLanguage();
    const momentLocale = lang === 'no' ? 'nb' : lang;
    window.moment.locale(momentLocale);
    
    // Get appropriate time format
    const rangeParam = window.Utils ? window.Utils.getURLParameter('range') : 
                       (new URLSearchParams(window.location.search).get('range')) || '1';
    
    const timeFormat = window.ChartUtils.determineSmartTimeFormat(timestamps);
    
    // Store time format for reference
    window.chartTimeFormats = window.chartTimeFormats || {};
    window.chartTimeFormats[config.id] = timeFormat;
    
    // 6. Format timestamps and prepare final chart data
    const chartData = {
        labels: timestamps.map(timestamp => moment(timestamp).format(timeFormat)),
        datasets: datasets,
        _timeFormat: timeFormat
    };
    
    // 7. Return complete chart data with stats and metadata
    return {
        isValid: true,
        chartData: chartData,
        stats: {
            minValue: stats.minValue,
            maxValue: stats.maxValue,
            avgValue: stats.avgValue,
            currentValue: stats.currentValue
        },
        meta: {
            range: stats.range,
            hasNegativeValues: stats.hasNegativeValues,
            paddedMinValue: stats.paddedMinValue,
            paddedMaxValue: stats.paddedMaxValue,
            isMultiSeries: data.is_multi_series
        }
    };
}

/**
 * Creates chart options configuration
 * @param {Object} config - The chart configuration
 * @param {Object} chartData - The processed chart data
 * @param {Object} meta - Metadata about the chart data from prepareChartData
 * @returns {Object} Configuration options for Chart.js
 */
function createChartOptions(config, chartData, meta) {
    // Extract necessary meta information
    const { paddedMinValue, paddedMaxValue, hasNegativeValues } = meta;
    
    // Check if this chart has a minimum value configuration
    const hasMinValue = config.minValue !== undefined;
    
    // Prepare chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Disable animation for immediate rendering
        
        layout: {
            padding: {
                left: 0,
                right: config.secondYAxis ? 20 : 2, // Add more padding if using second y-axis
                top: 2,
                bottom: 0
            }
        },
        
        // Only show legend for multi-series charts or when explicitly enabled
        plugins: {
            ...(!meta.isMultiSeries && {
                legend: {
                    display: false // Don't show legend for single-series charts, including stat datasets
                }
            }),
            ...(meta.isMultiSeries && {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'center', // Center the legend in the chart
                    labels: {
                        boxWidth: 15, // Width for line representation
                        boxHeight: 0, // No explicit height for proper line rendering
                        lineWidth: 2, // Thickness of the line in the legend
                        font: {
                            size: 9, // Smaller font size
                            weight: '600' // Semi-bold weight (between normal 400 and bold 700)
                        },
                        usePointStyle: false, // Use standard line style
                        padding: 8 // Add padding for better spacing
                    }
                }
            }),
        },
        
        scales: {
            x: {
                // For simplicity and maximum compatibility, we'll use a category scale
                // with automatic formatting based on the timespan
                grid: {
                    display: false // No X grid lines
                },
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    // Mobile: always use 6 ticks since all charts are full width
                    // Desktop: Use columnSpan to determine tick count
                    // - Small charts (span 1): 4 ticks
                    // - Larger charts (span 2+): 6 ticks
                    maxTicksLimit: window.innerWidth <= 768 ? 6 : ((config.columnSpan && config.columnSpan >= 2) ? 6 : 4),
                    font: {
                        size: 9
                    },
                    color: '#666',
                    autoSkipPadding: 10,
                    align: 'center'
                },
                border: {
                    display: false
                }
            },
            y: {
                // Use yAxis configuration if available, or default values
                position: config.yAxis && config.yAxis.position ? config.yAxis.position : 
                         (window.innerWidth <= 768 ? 'left' : 'right'), // Position scale on left for mobile, right for desktop
                grid: {
                    color: config.yAxis && config.yAxis.gridColor ? config.yAxis.gridColor : 'rgba(0, 0, 0, 0.05)',
                    lineWidth: config.yAxis && config.yAxis.gridLineWidth ? config.yAxis.gridLineWidth : 1,
                    drawBorder: config.yAxis && config.yAxis.drawBorder ? config.yAxis.drawBorder : false
                },
                // Dynamic scale based on config or data range with padding
                min: config.yAxis && config.yAxis.min !== undefined ? config.yAxis.min : 
                    (hasMinValue ? config.minValue : undefined), // Use explicit min if configured
                suggestedMin: (config.yAxis && config.yAxis.min !== undefined) || hasMinValue ? 
                    undefined : paddedMinValue, // Only use suggestedMin if no min configured
                suggestedMax: config.yAxis && config.yAxis.max !== undefined ? config.yAxis.max : paddedMaxValue,
                beginAtZero: config.yAxis && config.yAxis.beginAtZero !== undefined ? 
                    config.yAxis.beginAtZero : false, // Use config or default to false
                ticks: {
                    font: {
                        size: window.innerWidth <= 768 ? 8 : 9
                    },
                    maxTicksLimit: window.innerWidth <= 768 ? 4 : 5,
                    color: '#666',
                    padding: 0,
                    callback: function(value) {
                        // Handle null or undefined values
                        if (value === null || value === undefined) {
                            return '';
                        }
                        
                        // Get chart ID to apply specific formatting for certain charts
                        const chartId = this.chart.canvas.id;
                        const config = window.chartConfigs.find(c => c.id === chartId);
                        
                        // Abbreviate large numbers
                        if (value >= 1000) {
                            return (value / 1000) + 'k';
                        }
                        
                        // Fix floating point precision issues
                        // First round to avoid JavaScript floating point arithmetic problems
                        const valueWithFixedPrecision = parseFloat(value.toFixed(3));
                        
                        // Integer values should always be displayed as integers without decimal places
                        if (Number.isInteger(valueWithFixedPrecision)) {
                            return valueWithFixedPrecision.toString();
                        }
                        
                        // Use formatting configuration from chart config
                        if (config && config.formatting && config.formatting.decimalPlaces !== undefined) {
                            // Force integers (decimal places = 0)
                            if (config.formatting.decimalPlaces === 0) {
                                return Math.round(valueWithFixedPrecision).toString();
                            }
                            
                            // Use specified decimal places for non-zero values
                            return parseFloat(valueWithFixedPrecision.toFixed(config.formatting.decimalPlaces)).toString();
                        }
                        
                        // For small values (like voltage, temperature differences)
                        if (Math.abs(valueWithFixedPrecision) < 10) {
                            // For very small values, use 2 decimal places
                            if (Math.abs(valueWithFixedPrecision) < 1) {
                                return parseFloat(valueWithFixedPrecision.toFixed(2)).toString();
                            }
                            // For moderately small values, use 1 decimal place
                            return parseFloat(valueWithFixedPrecision.toFixed(1)).toString();
                        }
                        
                        // For larger values, use integers
                        return Math.round(valueWithFixedPrecision).toString();
                    }
                },
                border: {
                    display: false
                }
            }
        }
    };
    
    // Add secondary Y axis if enabled in config
    if (config.secondYAxis) {
        chartOptions.scales.y1 = {
            position: 'left', // Put second axis on the opposite side
            grid: {
                display: false, // Don't show grid lines for second axis
                drawOnChartArea: false
            },
            // Calculate y1 range based on second series values
            suggestedMin: function() {
                // Find the dataset with y1 axis
                const y1Dataset = chartData.datasets.find(d => d.yAxisID === 'y1');
                if (y1Dataset && y1Dataset.data.length > 0) {
                    const values = y1Dataset.data.filter(v => !isNaN(v));
                    if (values.length) {
                        const min = Math.min(...values);
                        // Add 5% padding
                        return Math.max(0, min - (min * 0.05));
                    }
                }
                return 0;
            }(),
            suggestedMax: function() {
                // Find the dataset with y1 axis
                const y1Dataset = chartData.datasets.find(d => d.yAxisID === 'y1');
                if (y1Dataset && y1Dataset.data.length > 0) {
                    const values = y1Dataset.data.filter(v => !isNaN(v));
                    if (values.length) {
                        const max = Math.max(...values);
                        // Add 5% padding
                        return max + (max * 0.05);
                    }
                }
                return 100;
            }(),
            ticks: {
                font: {
                    size: window.innerWidth <= 768 ? 8 : 9
                },
                maxTicksLimit: window.innerWidth <= 768 ? 4 : 5,
                color: '#8a5a00', // Match the color of the second series
                padding: 0,
                callback: function(value) {
                    // Handle null or undefined values
                    if (value === null || value === undefined) {
                        return '';
                    }
                    
                    // Get chart ID to apply specific formatting for certain charts
                    const chartId = this.chart.canvas.id;
                    const config = window.chartConfigs.find(c => c.id === chartId);
                    
                    // Abbreviate large numbers
                    if (value >= 1000) {
                        return (value / 1000) + 'k';
                    }
                    
                    // Fix floating point precision issues
                    // First round to avoid JavaScript floating point arithmetic problems
                    const valueWithFixedPrecision = parseFloat(value.toFixed(3));
                    
                    // Integer values should always be displayed as integers without decimal places
                    if (Number.isInteger(valueWithFixedPrecision)) {
                        return valueWithFixedPrecision.toString();
                    }
                    
                    // Use formatting configuration from chart config
                    if (config && config.formatting && config.formatting.decimalPlaces !== undefined) {
                        // Force integers (decimal places = 0)
                        if (config.formatting.decimalPlaces === 0) {
                            return Math.round(valueWithFixedPrecision).toString();
                        }
                        
                        // Use specified decimal places for non-zero values
                        return parseFloat(valueWithFixedPrecision.toFixed(config.formatting.decimalPlaces)).toString();
                    }
                    
                    // For small values (like voltage, temperature differences)
                    if (Math.abs(valueWithFixedPrecision) < 10) {
                        // For very small values, use 2 decimal places
                        if (Math.abs(valueWithFixedPrecision) < 1) {
                            return parseFloat(valueWithFixedPrecision.toFixed(2)).toString();
                        }
                        // For moderately small values, use 1 decimal place
                        return parseFloat(valueWithFixedPrecision.toFixed(1)).toString();
                    }
                    
                    // For larger values, use integers
                    return Math.round(valueWithFixedPrecision).toString();
                }
            },
            border: {
                display: false
            }
        };
    }
    
    // Add tooltip configuration - use the raw timestamps instead of formatted labels
    // This ensures that tooltip functions can access the actual date objects
    const rawTimestamps = window.chartRawData[config.id]?.timestamps || [];
    chartOptions.plugins.tooltip = window.ChartUtils.createTooltipConfig(config, chartData, rawTimestamps);
    
    // Handle hover events for tooltip synchronization
    chartOptions.onHover = (event, elements, chart) => {
        if (!elements || !elements.length) return;
        
        const dataIndex = elements[0].index;
        window.ChartUtils.syncTooltips(chart, dataIndex);
    };
    
    return chartOptions;
}

/**
 * Chart renderer imports utility functions from chart-utils.js
 * Uses configuration-driven approach where all chart properties
 * must be explicitly defined in the configuration. No implicit behavior based on chart IDs.
 */

// getRelatedChartData function has been moved to chart-utils.js

// Export recalculation function for access from script.js
window.recalculateChartStats = recalculateChartStats;

// Use data component functions for fetching data
// Create a reference to the fetchChartData function from data_components.js
window.fetchChartData = window.DataComponents.fetchChartData;

/**
 * Recalculates statistics for a chart from its data
 * Delegates to ChartStats module
 * @param {Chart} chart - The Chart.js instance to recalculate stats for
 * @returns {void}
 */
function recalculateChartStats(chart) {
    window.ChartStats.recalculateChartStats(chart);
}

/**
 * Updates the chart statistics display with calculated values
 * Delegates to ChartStats module
 * @param {string} chartId - The ID of the chart
 * @param {number} minValue - Minimum value in the dataset
 * @param {number} maxValue - Maximum value in the dataset
 * @param {number} avgValue - Average value of the dataset
 * @param {number} currentValue - Current/latest value in the dataset
 * @param {boolean} isMultiSeries - Whether this is a multi-series chart
 * @returns {void}
 */
function updateChartStats(chartId, minValue, maxValue, avgValue, currentValue, isMultiSeries) {
    const stats = { minValue, maxValue, avgValue, currentValue };
    window.ChartStats.updateChartStats(chartId, stats, isMultiSeries);
}

/**
 * Translates all chart labels and updates stats with localized values
 * Delegates to ChartI18n module for translation logic
 * @param {Chart} chart - The Chart.js instance to translate
 * @returns {void}
 */
window.translateChartLabels = function(chart) {
    if (!chart || !chart.data || !chart.data.datasets || !window.ChartI18n) {
        return;
    }

    try {
        // Use ChartI18n module to handle translations
        window.ChartI18n.translateChart(chart);

        // Recalculate stats after translation
        recalculateChartStats(chart);
    } catch (e) {
        console.error("Error updating chart labels:", e);
    }
}

// Listen for language changes to update all chart elements
document.addEventListener('languageChanged', (event) => {
    // 1. First update chart DOM titles
    document.querySelectorAll('.chart-title').forEach(titleEl => {
        const translationKey = titleEl.getAttribute('data-i18n');
        if (translationKey) {
            const translatedTitle = window.I18n.translate(translationKey);
            titleEl.textContent = translatedTitle;
            if (titleEl.hasAttribute('data-i18n-title')) {
                titleEl.title = translatedTitle;
            }
        }
    });
    
    // 2. Let ChartI18n handle updating all chart translations
    if (window.ChartI18n && typeof window.ChartI18n.updateAllChartTranslations === 'function') {
        window.ChartI18n.updateAllChartTranslations();
    }
    
    // 3. Update all chart stats to ensure consistent labels and formatting
    // Add a slight delay to ensure other chart updates have completed
    setTimeout(() => {
        window.ChartStats.updateAllChartStats();
    }, 50);
});

/**
 * Creates or updates a chart with the provided configuration and data
 * @param {Object} config - The chart configuration
 * @param {Object} data - The chart data from the API
 */
function createOrUpdateChart(config, data) {
    // Get the loading element
    const loadingEl = document.getElementById(`loading-${config.id}`);
    
    // Get translated loading text
    const loadingText = window.I18n.translate('loading');
    const noDataText = window.I18n.translate('noData');
    
    // Reset loading element to its initial state
    if (loadingEl) {
        loadingEl.innerHTML = `
            <div class="loading-spinner"></div>
            <div>${loadingText}</div>
        `;
        loadingEl.style.display = 'block';
    }
    
    if (!data || !data.feeds || data.feeds.length === 0) {
        // No data available
        if (loadingEl) {
            loadingEl.innerHTML = `<div>${noDataText}</div>`;
        }
        return;
    }
    
    // Hide loading indicator when data is available
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    
    // Process chart data using the extracted utility function
    const processedData = prepareChartData(config, data);
    
    // Handle any data processing errors
    if (!processedData.isValid) {
        if (loadingEl) {
            // Get appropriate translation key based on error type
            let translationKey = 'noData';
            if (processedData.errorType === 'no-valid-series-data') {
                translationKey = 'noValidSeriesData';
            } else if (processedData.errorType === 'no-valid-numeric-values') {
                translationKey = 'noValidNumericValues';
            }
            
            // Get translated error message
            const errorMsg = window.I18n.translate(translationKey);
            
            loadingEl.innerHTML = `<div>${errorMsg}</div>`;
        }
        return;
    }
    
    // Extract data from processed result
    const { chartData, stats, meta } = processedData;
    const { minValue, maxValue, avgValue, currentValue } = stats;
    const { hasNegativeValues, paddedMinValue, paddedMaxValue, isMultiSeries } = meta;
    
    // Update stats display
    updateChartStats(config.id, minValue, maxValue, avgValue, currentValue, isMultiSeries);
    
    // Create chart options using the extracted utility function
    const chartOptions = createChartOptions(config, chartData, meta);
    
    // Add statistical annotations if needed
    if (!meta.isMultiSeries && chartData.datasets.length === 1) {
        // Use the utility function to create statistical annotations
        const annotations = window.ChartUtils.createStatisticalAnnotations(config, stats, chartData);
        
        // Add annotations to chart options
        if (Object.keys(annotations).length > 0) {
            if (!chartOptions.plugins) {
                chartOptions.plugins = {};
            }
            chartOptions.plugins.annotation = {
                annotations: annotations
            };
        }
    }
    
    // Use syncTooltips from ChartUtils module
    window.syncTooltips = window.ChartUtils.syncTooltips;
    
    // Create or update chart
    const canvas = document.getElementById(config.id);
    if (!canvas) return;
    
    if (chartInstances[config.id]) {
        // Update existing chart
        
        // If ResourcePool is available, handle dataset reuse
        if (window.ResourcePool && chartInstances[config.id].data && chartInstances[config.id].data.datasets) {
            const datasetPool = window.ResourcePool.getPool('datasetConfig');
            if (datasetPool) {
                // Get current datasets
                const currentDatasets = chartInstances[config.id].data.datasets;
                
                // If the number of datasets is changing, we need to handle addition/removal
                if (currentDatasets.length !== chartData.datasets.length) {
                    // If the new chart has fewer datasets, release excess datasets back to the pool
                    if (currentDatasets.length > chartData.datasets.length) {
                        // Release excess datasets to the pool
                        for (let i = chartData.datasets.length; i < currentDatasets.length; i++) {
                            datasetPool.release(currentDatasets[i]);
                        }
                    }
                }
            }
        }
        
        // Update chart data and options
        chartInstances[config.id].data = chartData;
        chartInstances[config.id].options = chartOptions;
        chartInstances[config.id].update('none');
        
        // Always recalculate stats to ensure they're correct
        recalculateChartStats(chartInstances[config.id]);
        
        // Record update in lifecycle manager
        if (window.ChartLifecycleManager) {
            window.ChartLifecycleManager.recordUpdate(config.id);
        }
    } else {
        // Create new chart
        chartInstances[config.id] = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
        
        // Emit chart rendered event
        document.dispatchEvent(new CustomEvent('chart:rendered', {
            detail: {
                chartId: config.id,
                chartType: 'line',
                isMultiSeries: config.series && Array.isArray(config.series) && config.series.length > 1
            }
        }));
        
        // Calculate initial stats for new chart
        recalculateChartStats(chartInstances[config.id]);
        
        // Force emit a chart stats update event to ensure tooltips get updated
        if (config.id === 'chart-temp' && window.latestData && window.latestData.temperature !== null) {
            // Get the most current stats
            const currentStats = {
                minValue: window.latestData.temperature,
                maxValue: window.latestData.temperature,
                avgValue: window.latestData.temperature,
                currentValue: window.latestData.temperature
            };
            
            // Emit chart stats updated event with current data
            document.dispatchEvent(new CustomEvent('chart:stats:updated', {
                detail: {
                    chartId: 'chart-temp',
                    stats: currentStats,
                    isMultiSeries: false,
                    unit: '°C'
                }
            }));
        }
        
        // Register with lifecycle manager
        if (window.ChartLifecycleManager) {
            const container = canvas.closest('.chart');
            const statsElement = document.getElementById(`stats-${config.id}`);
            const loadingElement = document.getElementById(`loading-${config.id}`);
            
            window.ChartLifecycleManager.registerChart(config.id, chartInstances[config.id], {
                container,
                statsElement,
                loadingElement,
                config
            });
        }
    }
    
    // Apply translations to all chart elements (labels, legend, stats)
    // This ensures that the chart is properly translated on initial creation
    if (typeof window.translateChartLabels === 'function') {
        window.translateChartLabels(chartInstances[config.id]);
    }
    
    // If this is a multi-series chart, we'll update the legend with current values
    // (This is now handled by the generateLabels function in the legend options)
    // Just update the chart to refresh the legend
    if (meta.isMultiSeries && chartInstances[config.id]) {
        chartInstances[config.id].update('none');
    }
    
    // Apply special stats labels formatting if configured
    // For example, temperature charts use LAHN (Low/Avg/High/Now) style
    if (config.statsLabelsStyle === 'LAHN') {
        // Update chart stats with a small delay to ensure the chart is fully rendered
        setTimeout(() => {
            if (window.ChartStats && typeof window.ChartStats.updateAllChartStats === 'function') {
                window.ChartStats.updateAllChartStats();
            }
        }, 100);
    }
}

// Call this when window is resized to properly adjust all charts
// Expose globally for script.js
window.resizeAllCharts = function() {
    // Check if layout mode (mobile/desktop) has changed
    const wasMobile = document.getElementById('chartContainer').classList.contains('mobile-layout');
    const isMobile = window.innerWidth <= 768;
    
    // If layout has changed, reinitialize the entire chart layout
    if (wasMobile !== isMobile) {
        // Properly destroy all existing chart instances using lifecycle manager if available
        Object.keys(chartInstances).forEach(id => {
            if (chartInstances[id]) {
                if (window.ChartLifecycleManager) {
                    window.ChartLifecycleManager.cleanupChart(id);
                } else {
                    chartInstances[id].destroy();
                }
                chartInstances[id] = null;
            }
        });
        
        // Clear chart instances
        Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
        
        // Get URL parameters
        function getURLParam(name) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name) || '';
        }
        
        // Reinitialize layout
        const currentRange = getURLParam('range') || '1';
        const currentResults = parseInt(getURLParam('results')) || 8000;
        loadAllCharts(currentRange, currentResults);
        return;
    }
    
    // For each chart instance, resize and update without animation
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            const chart = chartInstances[id];
            
            // Disable animation
            chart.options.animation = false;
            
            // Force resize and update
            chart.resize();
            chart.update('none');
            
            // Recalculate stats after resize to ensure they're correct
            recalculateChartStats(chart);
            
            // Fix special stats labels if needed (e.g., temperature charts)
            const chartConfig = window.chartConfigs.find(c => c.id === chart.canvas.id);
            if (chartConfig && chartConfig.statsLabelsStyle === 'LAHN') {
                setTimeout(() => {
                    window.ChartStats.updateAllChartStats();
                }, 100);
            }
        }
    });
}

// Load data for all charts with progressive rendering
async function loadAllCharts(range = 1, results = 8000) {
    const startTime = performance.now();
    
    // Initialize chart layout
    window.ChartLayout.initializeChartLayout();
    
    // Start a counter to track when all charts are loaded
    let chartsLoaded = 0;
    const totalCharts = window.chartConfigs.length;
    
    // Use Promise.allSettled to handle individual chart loading without waiting for all
    const fetchPromises = window.chartConfigs.map((config, index) => {
        // For default range, use the chart's defaultRange property or fallback to 1
        const effectiveRange = range === 'default' ? (config.defaultRange || 1) : range;
        
        // Start fetching data for this chart
        return fetchChartData(config, effectiveRange, results)
            .then(data => {
                // When data arrives, immediately render the chart
                createOrUpdateChart(config, data);
                
                // Increment counter
                chartsLoaded++;
                
                // If this is the last chart, log completion time
                if (chartsLoaded === totalCharts) {
                    const totalTime = Math.round(performance.now() - startTime);
                    console.log(`Charts loaded in ${totalTime}ms`);
                }
                
                // Return the data for Promise tracking
                return data;
            })
            .catch(error => {
                console.error(`Error loading chart ${config.id}:`, error);
                
                // Even on error, increment counter
                chartsLoaded++;
                
                // If this is the last chart, log completion time
                if (chartsLoaded === totalCharts) {
                    const totalTime = Math.round(performance.now() - startTime);
                    console.log(`Charts loaded in ${totalTime}ms (with errors)`);
                }
                
                // Return null data for failed charts
                return null;
            });
    });
    
    // The following is just for tracking completion, charts will render progressively
    await Promise.allSettled(fetchPromises);
}

// Refresh all charts - expose globally for script.js
window.refreshCharts = function(range, results) {
    const startTime = performance.now();
    
    // Properly destroy all existing chart instances first, using lifecycle manager if available
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            if (window.ChartLifecycleManager) {
                window.ChartLifecycleManager.cleanupChart(id);
            } else {
                chartInstances[id].destroy();
            }
            chartInstances[id] = null;
        }
    });
    
    // Clear chart instances object
    Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
    
    // Now load all charts with new parameters using the progressive loading approach
    loadAllCharts(range, results);
    
    // Setup a completion check for temperature chart stats
    // We'll use MutationObserver to detect when all charts are rendered
    const chartContainer = document.getElementById('chartContainer');
    
    if (chartContainer) {
        // Flag to track if stats have been fixed already
        let statsFixed = false;
        
        // Create a mutation observer to watch for chart container changes
        const observer = new MutationObserver((mutations) => {
            // Skip if stats were already fixed
            if (statsFixed) return;
            
            // Check if all charts are loaded by counting canvas elements
            const canvasElements = chartContainer.querySelectorAll('canvas');
            
            // If we have canvas elements for all charts, run the stats fix
            if (canvasElements.length >= window.chartConfigs.length) {
                window.ChartStats.updateAllChartStats();
                
                // Log completion time
                const totalTime = Math.round(performance.now() - startTime);
                console.log(`Charts refreshed in ${totalTime}ms`);
                
                // Mark stats as fixed
                statsFixed = true;
                
                // Disconnect the observer once we're done
                observer.disconnect();
            }
        });
        
        // Observe changes to the chart container
        observer.observe(chartContainer, { childList: true, subtree: true });
        
        // Add a timeout fallback in case something goes wrong
        setTimeout(() => {
            // Only run if stats haven't been fixed yet
            if (!statsFixed) {
                // Disconnect the observer
                observer.disconnect();
                
                window.ChartStats.updateAllChartStats();
                
                // Log completion time with fallback note
                const totalTime = Math.round(performance.now() - startTime);
                console.log(`Charts refreshed in ${totalTime}ms (fallback method)`);
                
                // Mark stats as fixed
                statsFixed = true;
            }
        }, 5000); // 5-second timeout as a fallback
    }
}

// Note: Date range selection functionality has been moved to date-controller.js

/**
 * Sort charts by category - only on mobile devices
 * Delegated to the ChartLayout module
 * @param {string} category - The category to sort by, or 'row' for row-based sorting
 */
function sortChartsByCategory(category) {
    window.ChartLayout.sortChartsByCategory(category);
}

// Export sort function to global scope for access from event handlers
window.sortChartsByCategory = sortChartsByCategory;

// Initialize chart system when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // We'll skip setupDateRangeHandlers() here since it's now called in index.html
    // after the header is created dynamically
    
    // Get URL parameters helper
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    // Get range and results from URL parameters or use defaults
    // Default to 'default' range (house icon) if no range parameter is provided
    const range = getURLParameter('range') || 'default';
    const results = parseInt(getURLParameter('results')) || 8000;
    
    // Ensure only one date chip is active on load
    setTimeout(() => {
        const allDateChips = document.querySelectorAll('.date-chip');
        
        // First remove active class from all chips
        allDateChips.forEach(chip => {
            chip.classList.remove('active');
        });
        
        // Then find and activate the current range chip
        const activeChip = document.querySelector(`.date-chip[data-range="${range}"]`);
        if (activeChip) {
            activeChip.classList.add('active');
        }
    }, 100);
    
    // Initialize chart loading with a short delay to avoid blocking the initial render
    setTimeout(() => {
        // Ensure translations are loaded before creating charts
        if (window.I18n && typeof window.I18n.updatePageLanguage === 'function') {
            // Translations already loaded, initialize charts
            loadAllCharts(range, results);
        } else {
            // Wait for translations to be ready
            const checkTranslations = setInterval(() => {
                if (window.I18n && typeof window.I18n.updatePageLanguage === 'function') {
                    clearInterval(checkTranslations);
                    loadAllCharts(range, results);
                }
            }, 50);
        }
    }, 100); // Short delay to allow UI to render first
    
    // Add a failsafe for charts disappearing, but with reduced frequency to avoid performance issues
    setInterval(() => {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer && chartContainer.children.length === 0) {
            console.log('Charts disappeared, reloading...');
            
            // Make sure Utils is defined before using it
            if (!window.Utils) {
                console.error('Utils is not defined in failsafe interval. Critical dependency missing.');
                return;
            }
            
            // Get current range and results
            const currentRange = window.Utils.getURLParameter('range') || '1';
            const currentResults = parseInt(window.Utils.getURLParameter('results')) || 8000;
            
            // Reload all charts
            loadAllCharts(currentRange, currentResults);
        }
    }, 60000); // Check every 60 seconds (reduced from 30s)
    
    /**
     * Initializes chart sorting functionality with desktop and mobile select elements
     * This function can be called later when we're sure the dropdown exists
     */
    window.initializeSorting = function() {
        const sortSelect = document.getElementById('sortSelect');
        const mobileSortSelect = document.getElementById('mobileSortSelect');
        
        if (!sortSelect) {
            // If sort select isn't found, try again after a delay
            setTimeout(window.initializeSorting, 500);
            return;
        }
        
        // Try to restore last used sort preference
        const lastSort = localStorage.getItem('chartSortPreference');
        
        // Initialize both selects with the saved preference
        if (lastSort) {
            sortSelect.value = lastSort;
            if (mobileSortSelect) {
                mobileSortSelect.value = lastSort;
            }
        }
        
        /**
         * Handles sort selection changes from any dropdown
         * @param {string} category - The category to sort by
         * @param {HTMLElement} sourceElement - The select element that triggered the change
         */
        const handleSortChange = (category, sourceElement) => {
            // Save preference to localStorage
            localStorage.setItem('chartSortPreference', category);
            
            // Update the other dropdown if this change came from one of them
            if (sourceElement === sortSelect && mobileSortSelect) {
                mobileSortSelect.value = category;
            } else if (sourceElement === mobileSortSelect && sortSelect) {
                sortSelect.value = category;
            }
            
            // Perform the actual sorting
            window.sortChartsByCategory(category);
        };
        
        // Set up event listeners for both dropdowns
        sortSelect.addEventListener('change', (event) => {
            handleSortChange(event.target.value, sortSelect);
        });
        
        if (mobileSortSelect) {
            mobileSortSelect.addEventListener('change', (event) => {
                handleSortChange(event.target.value, mobileSortSelect);
            });
        }
        
        // Apply the initial sort if we're in mobile mode and a preference exists
        if (window.innerWidth <= 768 && lastSort) {
            setTimeout(() => window.sortChartsByCategory(lastSort), 500);
        }
    };
    
    /**
     * Sets up a MutationObserver to initialize sorting when elements are ready
     * This ensures sorting is initialized even when elements are added dynamically
     */
    function setupSortingInitialization() {
        // Try to initialize sorting immediately first
        window.initializeSorting();
        
        // Set up a MutationObserver to detect when the sort select elements are added to the DOM
        const bodyObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    // Check if sortSelect was added
                    if (document.getElementById('sortSelect')) {
                        window.initializeSorting();
                        // No need to keep observing once we've found it
                        bodyObserver.disconnect();
                        break;
                    }
                }
            }
        });
        
        // Start observing DOM changes
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        
        // Safety cleanup - disconnect after 10 seconds if it hasn't found the element
        setTimeout(() => bodyObserver.disconnect(), 10000);
    }
    
    // Initialize sorting system
    setupSortingInitialization();
});