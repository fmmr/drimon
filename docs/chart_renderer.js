'use strict';

// Import chart utilities
(function() {
    const script = document.createElement('script');
    script.src = 'js/core/chart-utils.js';
    script.async = false;
    script.defer = false;
    document.head.appendChild(script);
})();

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

// Export determineSmartTimeFormat function globally for use by script.js
window.determineSmartTimeFormat = function(timestamps, range) {
    return window.ChartUtils.determineSmartTimeFormat(timestamps, range);
};

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
    // Initial variables
    let datasets = [];
    let filteredValues = [];
    let timestamps = [];
    let minValue = Infinity;  // Initialize to Infinity so Math.min works properly
    let maxValue = -Infinity;
    let avgValue = 0;
    let hasNegativeValues = false;
    
    // Check if we need to apply data transformation
    const dataTransform = config.dataTransform;
    
    // Process data based on whether it's multi-series or single-series
    if (data.is_multi_series) {
        // Handle multi-series data
        if (!data.series || data.series.length === 0 || data.series[0].feeds.length === 0) {
            // No valid data for any series
            return { 
                isValid: false,
                errorType: 'no-valid-series-data'
            };
        }
        
        // Use timestamps from first series for consistency
        timestamps = data.series[0].feeds.map(feed => feed.created_at);
        
        // Process each series data
        data.series.forEach(series => {
            // Get values for this series
            let seriesValues = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
            
            // Apply data transformation if configured
            if (dataTransform) {
                seriesValues = seriesValues.map(value => {
                    if (isNaN(value)) return value;
                    
                    // Apply shift transformation
                    if (dataTransform.shiftBy !== undefined) {
                        return value + dataTransform.shiftBy;
                    }
                    
                    return value;
                });
            }
            
            const seriesFiltered = seriesValues.filter(v => !isNaN(v));
            
            // Skip empty series
            if (seriesFiltered.length === 0) return;
            
            // Check for negative values
            if (seriesFiltered.some(v => v < 0)) {
                hasNegativeValues = true;
            }
            
            // Simple min/max calculation from actual data values
            const seriesMin = Math.min(...seriesFiltered);
            const seriesMax = Math.max(...seriesFiltered);
            minValue = Math.min(minValue, seriesMin);
            maxValue = Math.max(maxValue, seriesMax);
            
            // Add to filtered values for overall stats
            filteredValues = filteredValues.concat(seriesFiltered);
            
            // Translate series title if possible
            let translatedTitle = series.title;
            if (window.I18n && typeof window.I18n.translate === 'function') {
                // Use titleKey from series config directly if available
                if (series.titleKey) {
                    const translated = window.I18n.translate(series.titleKey);
                    if (translated !== series.titleKey) {
                        translatedTitle = translated;
                    }
                }
            }
            
            // Create dataset for this series
            const yAxisID = series.axis || 'y';
            
            // Determine translated title for dataset label
            let datasetLabel = series.title || ''; // Fallback
            
            // Use titleKey if available
            if (series.titleKey) {
                datasetLabel = window.I18n.translate(series.titleKey);
            }
            
            // Ensure we have a valid label
            if (!datasetLabel || datasetLabel === series.titleKey) {
                datasetLabel = series.title || `Series ${datasets.length + 1}`;
            }
            
            datasets.push({
                label: datasetLabel,
                data: seriesValues,
                borderColor: series.color,
                backgroundColor: `${series.color}20`,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.1,
                yAxisID: yAxisID, // Explicitly set the y-axis ID
                // Store original config for reference during updates
                _titleKey: series.titleKey,
                _originalTitle: series.title
            });
        });
    } else {
        // Handle single series data
        let values = data.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
        
        // Apply data transformation if configured
        if (dataTransform) {
            values = values.map(value => {
                if (isNaN(value)) return value;
                
                // Apply shift transformation
                if (dataTransform.shiftBy !== undefined) {
                    return value + dataTransform.shiftBy;
                }
                
                return value;
            });
        }
        
        hasNegativeValues = values.some(v => v < 0);
        
        // Calculate data range for better scaling - only filter NaN values, keep zeros and all valid numbers
        filteredValues = values.filter(v => !isNaN(v));
        
        if (filteredValues.length === 0) {
            // No valid numeric values
            return { 
                isValid: false,
                errorType: 'no-valid-numeric-values'
            };
        }
        
        // Simple min/max calculation from actual data values
        minValue = Math.min(...filteredValues);
        maxValue = Math.max(...filteredValues);
        
        // Store timestamps for cross-chart syncing
        timestamps = data.feeds.map(feed => feed.created_at);
        
        // Create dataset for single series - use translations if available
        // Get translated chart title
        let chartTitle = config.title;
        
        // Use titleKey directly from config if available
        if (config.titleKey) {
            chartTitle = window.I18n.translate(config.titleKey);
        }
        
        datasets.push({
            label: chartTitle,
            data: values,
            borderColor: config.color,
            backgroundColor: hasNegativeValues ? 'rgba(0,0,0,0)' : `${config.color}20`,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: !hasNegativeValues,
            tension: 0.1,
            yAxisID: 'y' // Always use primary y-axis for single series
        });
    }
    
    // Calculate average across all series
    const sum = filteredValues.reduce((acc, val) => acc + val, 0);
    avgValue = sum / filteredValues.length;
    
    // Add 5% padding to min/max values to prevent data points from touching edges
    const range = maxValue - minValue;
    
    // Handle case where min and max are identical or very small range
    const paddingAmount = range < 0.1 ? (Math.abs(minValue) * 0.05 || 0.1) : range * 0.05;
    
    // Don't go below zero for non-negative data sets
    const paddedMinValue = hasNegativeValues ? minValue - paddingAmount : Math.max(0, minValue - paddingAmount);
    const paddedMaxValue = maxValue + paddingAmount;
    
    // Store raw data for shared tooltips
    window.chartRawData = window.chartRawData || {};
    
    if (data.is_multi_series) {
        // Store data for each series for multi-series charts
        window.chartRawData[config.id] = {
            timestamps: timestamps,
            series: data.series.map(series => ({
                title: series.title || '',
                titleKey: series.titleKey,
                values: series.feeds.map(feed => parseFloat(feed[`field${series.field}`])),
                color: series.color
            })),
            is_multi_series: true,
            title: config.title || '',
            titleKey: config.titleKey,
            category: config.category || '',
            unit: config.unit || ''
        };
    } else {
        // For single series charts, keep original format
        window.chartRawData[config.id] = {
            timestamps: timestamps,
            values: datasets[0].data,
            title: config.title || '',
            titleKey: config.titleKey,
            category: config.category || '',
            color: config.color,
            unit: config.unit || ''
        };
    }
    
    // Get the most recent (current) value
    const currentValue = filteredValues.length > 0 ? filteredValues[filteredValues.length - 1] : null;
    
    // Ensure we're using the correct locale for time formatting
    const lang = window.I18n.getCurrentLanguage();
    const momentLocale = lang === 'no' ? 'nb' : lang;
    window.moment.locale(momentLocale);
    
    // Select appropriate time format based on date range and timespan
    // Get the range parameter from URL for proper time formatting
    const rangeParam = getURLParameter('range') || '1';
    const timeFormat = determineSmartTimeFormat(timestamps, rangeParam);
    
    // Store the time format for reference by other functions
    window.chartTimeFormats = window.chartTimeFormats || {};
    window.chartTimeFormats[config.id] = timeFormat;
    
    // Format timestamps with the determined format
    const chartData = {
        labels: timestamps.map(timestamp => moment(timestamp).format(timeFormat)),
        datasets: datasets,
        _timeFormat: timeFormat // Store for reference
    };
    
    return {
        isValid: true,
        chartData: chartData,
        stats: {
            minValue,
            maxValue,
            avgValue,
            currentValue
        },
        meta: {
            range,
            hasNegativeValues,
            paddedMinValue,
            paddedMaxValue,
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
    
    // Add tooltip configuration
    chartOptions.plugins.tooltip = window.ChartUtils.createTooltipConfig(config, chartData, chartData.labels);
    
    // Handle hover events
    chartOptions.onHover = (event, elements, chart) => {
        if (!elements || !elements.length) return;
        
        const dataIndex = elements[0].index;
        syncTooltips(chart, dataIndex);
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

// Initialize the charts layout
function initializeChartLayout() {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.innerHTML = '';
    
    // Group charts by row (1-4) for organization for desktop view
    const rowGroups = {};
    window.chartConfigs.forEach(config => {
        if (!rowGroups[config.row]) {
            rowGroups[config.row] = [];
        }
        rowGroups[config.row].push(config);
    });
    
    // Calculate grid positions for each chart (for desktop view)
    calculateGridPositions(rowGroups);
    
    // Determine if we're in mobile mode (for class distinction)
    const isMobile = window.innerWidth <= 768;
    
    // For mobile sort by rows, then by column position to ensure a logical order
    let orderedConfigs = [...window.chartConfigs];
    
    if (isMobile) {
        // Sort by row and then by column position
        orderedConfigs.sort((a, b) => {
            // First sort by row
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            
            // If same row, sort by grid column (leftmost first)
            const aColStart = parseInt(a.gridColumn.split('/')[0].trim());
            const bColStart = parseInt(b.gridColumn.split('/')[0].trim());
            return aColStart - bColStart;
        });
    }
    
    // Add all charts to the container at once
    orderedConfigs.forEach(config => {
        // Create chart div
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart';
        
        // Add multi-series class if needed
        if (config.series && Array.isArray(config.series) && config.series.length > 1) {
            chartDiv.classList.add('multi-series');
        }
        
        // Only set grid positions if not mobile (CSS will override these in mobile mode)
        if (!isMobile) {
            chartDiv.style.gridRow = config.gridRow;
            chartDiv.style.gridColumn = config.gridColumn;
        }
        
        // Add a data attribute for the row for potential filtering
        chartDiv.setAttribute('data-row', config.row);
        chartDiv.setAttribute('data-category', config.category || '');
        
        // Create title using translation key from config
        // Get translation key directly from config or use a fallback
        const translationKey = config.titleKey || (config.title ? config.title.toLowerCase().replace(/\s+/g, '') : 'chart');
        
        // Create title div with translation attributes
        const titleDiv = document.createElement('div');
        titleDiv.className = 'chart-title';
        titleDiv.setAttribute('data-i18n', translationKey);
        
        // Apply translation immediately if available, otherwise use title from config
        if (window.I18n && typeof window.I18n.translate === 'function') {
            const translatedTitle = window.I18n.translate(translationKey);
            titleDiv.textContent = translatedTitle;
            titleDiv.title = translatedTitle;
        } else {
            // Fallback to title property if available
            titleDiv.textContent = config.title || translationKey;
            titleDiv.title = config.title || translationKey;
        }
        
        titleDiv.setAttribute('data-i18n-title', translationKey); // For tooltip translation
        
        // For multi-series charts, the current values are shown in the legend
        // (No longer needed to update the title)
        
        // Create stats container (will be populated with data later)
        const statsDiv = document.createElement('div');
        statsDiv.className = 'chart-stats';
        statsDiv.id = `stats-${config.id}`;
        
        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'chart-canvas-container';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = config.id;
        
        // Add loading indicator - always visible initially
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.id = `loading-${config.id}`;
        loadingDiv.style.display = 'block'; // Ensure it's visible
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        // Get translated loading text
        let loadingTextValue = 'Laster data...';
        if (window.I18n && typeof window.I18n.translate === 'function') {
            loadingTextValue = window.I18n.translate('loading');
        }
        
        const loadingText = document.createElement('div');
        loadingText.textContent = loadingTextValue;
        
        // Assemble the DOM structure
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        
        canvasContainer.appendChild(canvas);
        canvasContainer.appendChild(loadingDiv);
        
        chartDiv.appendChild(titleDiv);
        chartDiv.appendChild(statsDiv); // Add stats div below the title
        chartDiv.appendChild(canvasContainer);
        
        chartContainer.appendChild(chartDiv);
    });
    
    // Add window resize handler (but avoid duplicate listeners)
    window.removeEventListener('resize', window.resizeAllCharts);
    window.addEventListener('resize', window.resizeAllCharts);
    
    // Add a class to the container based on viewport
    chartContainer.classList.toggle('mobile-layout', isMobile);
}

// Calculate grid positions for each chart
function calculateGridPositions(rowGroups) {
    // Process each row
    Object.keys(rowGroups).sort().forEach(rowNum => {
        const chartsInRow = rowGroups[rowNum];
        const totalCharts = chartsInRow.length;
        
        // Each chart occupies one grid row based on its row number
        const gridRow = rowNum;
        
        // For charts in this row, assign grid columns
        let columnStart = 1; // Grid columns start at 1
        
        // Apply specific span rules based on number of charts in row
        const spans = [];
        
        // Follow the rules specified:
        switch (totalCharts) {
            case 1: // 1 chart: span 8
                spans.push(8);
                break;
                
            case 2: // 2 charts: each span 4
                spans.push(4, 4);
                break;
                
            case 3: // 3 charts: leftmost spans 4, the next 2 spans 2
                spans.push(4, 2, 2);
                break;
                
            case 4: // 4 charts: each span 2
                spans.push(2, 2, 2, 2);
                break;
                
            case 5: // 5 charts: 3 leftmost spans 2, the next 2 spans 1
                spans.push(2, 2, 2, 1, 1);
                break;
                
            case 6: // 6 charts: 2 leftmost spans 2, the next 4 spans 1
                spans.push(2, 2, 1, 1, 1, 1);
                break;
                
            case 7: // 7 charts: leftmost spans 2, the next 6 spans 1
                spans.push(2, 1, 1, 1, 1, 1, 1);
                break;
                
            case 8: // 8 charts: all spans 1
                for (let i = 0; i < 8; i++) spans.push(1);
                break;
                
            default: // More than 8 charts (shouldn't happen, but just in case)
                // Distribute evenly
                const baseWidth = Math.floor(8 / totalCharts);
                spans.push(...new Array(totalCharts).fill(baseWidth));
                // Distribute remainder to first charts
                const remainder = 8 - (baseWidth * totalCharts);
                for (let i = 0; i < remainder; i++) {
                    spans[i]++;
                }
                break;
        }
        
        // Assign grid column positions to each chart
        chartsInRow.forEach((chart, index) => {
            const columnSpan = spans[index];
            
            // Set the grid position
            chart.gridRow = gridRow;
            chart.gridColumn = `${columnStart} / span ${columnSpan}`;
            
            // Store column span for tick calculations
            chart.columnSpan = columnSpan;
            
            // Move to next column
            columnStart += columnSpan;
        });
    });
}

// Use data component functions for fetching data
// Create a reference to the fetchChartData function from data_components.js
window.fetchChartData = window.DataComponents.fetchChartData;

/**
 * Recalculates statistics for a chart from its data
 * @param {Chart} chart - The Chart.js instance to recalculate stats for
 * @returns {void}
 */
function recalculateChartStats(chart) {
    if (!chart || !chart.data || !chart.data.datasets) return;
    
    // Get chart info
    const chartId = chart.canvas.id;
    const chartConfig = window.chartConfigs.find(c => c.id === chartId);
    const isMultiSeries = chartConfig && chartConfig.series && Array.isArray(chartConfig.series) && chartConfig.series.length > 1;
    
    // Get active datasets using utility function
    const activeDatasets = window.ChartUtils.getActiveDatasets(chart);
    
    // Calculate statistics using utility function
    const stats = window.ChartUtils.calculateStats(activeDatasets);
    
    // Update the stats display
    updateChartStats(chartId, stats.minValue, stats.maxValue, stats.avgValue, stats.currentValue, isMultiSeries);
}

/**
 * Updates the chart statistics display with calculated values
 * @param {string} chartId - The ID of the chart
 * @param {number} minValue - Minimum value in the dataset
 * @param {number} maxValue - Maximum value in the dataset
 * @param {number} avgValue - Average value of the dataset
 * @param {number} currentValue - Current/latest value in the dataset
 * @param {boolean} isMultiSeries - Whether this is a multi-series chart
 * @returns {void}
 */
function updateChartStats(chartId, minValue, maxValue, avgValue, currentValue, isMultiSeries) {
    const statsEl = document.getElementById(`stats-${chartId}`);
    if (!statsEl) return;
    
    /**
     * Gets translated label for a statistic type
     * @param {string} key - The translation key
     * @param {string} defaultChar - Default character if translation not available
     * @returns {string} Translated label (first character uppercase) or default
     */
    function getTranslatedLabel(key, defaultChar) {
        if (window.I18n && typeof window.I18n.translate === 'function') {
            const translation = window.I18n.translate(key);
            return translation && translation.length > 0 
                ? translation[0].toUpperCase() 
                : defaultChar;
        }
        return defaultChar;
    }
    
    // Get translated labels
    const lowLabel = getTranslatedLabel('low', 'L');
    const avgLabel = getTranslatedLabel('avg', 'A');
    const highLabel = getTranslatedLabel('high', 'H');
    const nowLabel = getTranslatedLabel('now', 'N');
    
    // Get chart config and unit through direct config property access
    const config = window.chartConfigs.find(c => c.id === chartId);
    const unit = config && config.unit ? config.unit : '';
    
    // Format values appropriately
    const range = maxValue - minValue;
    
    // Determine formatting function based on config
    let formatFunc = window.ChartUtils.formatNumber;
    
    // Use integer formatting if decimal places is explicitly set to 0 in config
    if (config && config.formatting && config.formatting.decimalPlaces === 0) {
        formatFunc = (val, config, range) => Math.round(val).toString();
    }
    
    /**
     * Creates HTML for a single stat item
     * @param {string} label - The label (single character)
     * @param {string} labelClass - The class for the label span
     * @param {number|null} value - The value to display
     * @param {string} extraClass - Additional CSS class
     * @returns {string} HTML string for the stat item
     */
    function createStatHtml(label, labelClass, value, extraClass = '') {
        return `
        <div class="chart-stat ${extraClass}">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${label}:</span>
                <span class="chart-stat-label-${labelClass}"></span>
            </span>${value !== null ? formatFunc(value, config, range) + unit : '—'}
        </div>`;
    }
    
    // Build stats HTML
    statsEl.innerHTML = `
        ${createStatHtml(lowLabel, 'low', minValue)}
        ${createStatHtml(avgLabel, 'avg', avgValue)}
        ${createStatHtml(highLabel, 'high', maxValue)}
        ${!isMultiSeries ? createStatHtml(nowLabel, 'now', currentValue, 'chart-stat-current') : ''}
    `;
    
    // Apply visibility based on user preference
    const statsVisible = localStorage.getItem('statsVisible') !== 'false';
    statsEl.style.display = statsVisible ? 'flex' : 'none';
}

/**
 * Translates all chart labels and updates stats with localized values
 * @param {Chart} chart - The Chart.js instance to translate
 * @returns {void}
 */
window.translateChartLabels = function(chart) {
    if (!chart || !chart.data || !chart.data.datasets || !window.ChartI18n) {
        return;
    }

    // Get chart info
    const chartId = chart.canvas.id;
    const chartConfig = window.chartConfigs.find(c => c.id === chartId);
    const isMultiSeries = chartConfig && chartConfig.series && Array.isArray(chartConfig.series) && chartConfig.series.length > 1;
    
    // Get special handling options from chart config
    const specialHandling = chartConfig && chartConfig.specialHandling;

    // Update all dataset labels with correct translations
    translateDatasetLabels(chart, chartConfig, isMultiSeries);
    
    // Update chart legend with translated labels
    updateChartLegend(chart, chartConfig, isMultiSeries, specialHandling);
    
    // Recalculate and update stats with translations
    recalculateChartStats(chart);
    
    // Apply changes with a short timeout to ensure the update happens
    setTimeout(() => {
        try {
            chart.update('none');
            
            // Always recalculate stats after chart update to ensure correct values
            recalculateChartStats(chart);
        } catch (e) {
            // Silently ignore errors
        }
    }, 10);
}

/**
 * Translates all dataset labels in a chart
 * @param {Chart} chart - The Chart.js instance
 * @param {Object} chartConfig - Configuration for the chart
 * @param {boolean} isMultiSeries - Whether chart has multiple series
 * @returns {void}
 */
function translateDatasetLabels(chart, chartConfig, isMultiSeries) {
    chart.data.datasets.forEach((dataset, index) => {
        if (!dataset.label) return;
        
        // Get original label (without any current value)
        const originalLabel = dataset.label.split(':')[0].trim();
        let translatedLabel;
        
        // For multi-series charts, look up series titles from chart config
        if (isMultiSeries && chartConfig && chartConfig.series && chartConfig.series[index]) {
            const series = chartConfig.series[index];
            
            // Use titleKey if available, otherwise use series.title
            if (series.titleKey) {
                if (window.I18n && typeof window.I18n.translate === 'function') {
                    translatedLabel = window.I18n.translate(series.titleKey);
                } 
                // Fallback to title or original label if no i18n available
                else {
                    translatedLabel = series.title || originalLabel;
                }
            } else if (series.title) {
                // If no titleKey but has a title, try to use a mapping system to find the key
                // First check if there's a helper from chart-i18n.js
                if (window.ChartI18n && typeof window.ChartI18n.translateSeriesLabel === 'function') {
                    translatedLabel = window.ChartI18n.translateSeriesLabel(series.title);
                } 
                // Direct fallback to title if no translation system
                else {
                    translatedLabel = series.title;
                }
            } else {
                // No titleKey or title, use the original label
                translatedLabel = originalLabel;
            }
        } else {
            // For single series charts, use chart title
            if (chartConfig) {
                if (chartConfig.titleKey) {
                    // Use the I18n system
                    if (window.I18n && typeof window.I18n.translate === 'function') {
                        translatedLabel = window.I18n.translate(chartConfig.titleKey);
                    } 
                    // Fallback to title or original label if no i18n available
                    else {
                        translatedLabel = chartConfig.title || originalLabel;
                    }
                } else if (chartConfig.title) {
                    // If no titleKey but has a title, try to use a mapping system
                    if (window.ChartI18n && typeof window.ChartI18n.translateChartTitle === 'function') {
                        translatedLabel = window.ChartI18n.translateChartTitle(chartConfig.title);
                    } 
                    // Direct fallback to title
                    else {
                        translatedLabel = chartConfig.title;
                    }
                } else {
                    translatedLabel = originalLabel; // Fallback to original
                }
            } else {
                translatedLabel = originalLabel; // No config, use original
            }
        }
        
        // Apply translations and preserve value part
        if (translatedLabel && translatedLabel !== originalLabel) {
            const parts = dataset.label.split(':');
            if (parts.length > 1) {
                dataset.label = `${translatedLabel}: ${parts[1].trim()}`;
            } else {
                dataset.label = translatedLabel;
            }
        }
        
        // Debug logs removed to avoid console clutter
    });
}

/**
 * Updates chart legend with translated labels
 * @param {Chart} chart - The Chart.js instance
 * @param {Object} chartConfig - Configuration for the chart
 * @param {boolean} isMultiSeries - Whether chart has multiple series
 * @param {Object} specialHandling - Special handling options from chart config
 * @returns {void}
 */
function updateChartLegend(chart, chartConfig, isMultiSeries, specialHandling) {
    if (!chart.options || !chart.options.plugins || !chart.options.plugins.legend) {
        return;
    }
    
    try {
        // Store original legend settings
        const originalLegendSettings = {
            display: chart.options.plugins.legend.display,
            labels: {...chart.options.plugins.legend.labels}
        };
        
        // Force Chart.js to re-render the legend completely
        chart.options.plugins.legend.display = false;
        chart.update('none');
        
        // Restore legend settings
        chart.options.plugins.legend.display = originalLegendSettings.display;
        
        // Ensure we keep the custom legend styling consistent
        if (isMultiSeries) {
            chart.options.plugins.legend.align = 'center'; // Center the legend
            chart.options.plugins.legend.labels = {
                ...originalLegendSettings.labels,
                usePointStyle: false, // Don't use point style for better line representation
                boxWidth: 15, // Width for line representation
                boxHeight: 0, // No explicit height for proper line rendering
                lineWidth: 2, // Thickness of the line in the legend
                padding: 8, // Add padding for better spacing
                font: {
                    size: 9, // Smaller font size
                    weight: '600' // Semi-bold weight (between normal 400 and bold 700)
                }
            };
        }
        
        // Set up custom legend generator that properly handles translations
        const defaultGenerateLabels = Chart.defaults.plugins.legend.labels.generateLabels;
        chart.options.plugins.legend.labels.generateLabels = function(chart) {
            const labels = defaultGenerateLabels(chart);
            
            // For multi-series charts, handle legend labels specially
            if (isMultiSeries) {
                labels.forEach((label, i) => {
                    if (i < chart.data.datasets.length && chartConfig && chartConfig.series && i < chartConfig.series.length) {
                        const dataset = chart.data.datasets[i];
                        
                        // Get original series title from configuration (source of truth)
                        const series = chartConfig.series[i];
                        let translatedTitle = '';
                        
                        // First check if we have the dataset with stored information
                        if (dataset) {
                            // First try to use the translated label that should be set in the dataset directly
                            if (dataset.label) {
                                translatedTitle = dataset.label.split(':')[0].trim(); // Strip any value part
                            }
                            // If no valid dataset label, try to regenerate it
                            else if (dataset._titleKey || dataset._originalTitle) {
                                // Use stored titleKey
                                if (dataset._titleKey) {
                                    if (window.I18n && typeof window.I18n.translate === 'function') {
                                        translatedTitle = window.I18n.translate(dataset._titleKey);
                                    }
                                } 
                                // Fallback to original title
                                else if (dataset._originalTitle) {
                                    translatedTitle = dataset._originalTitle;
                                }
                            }
                        }
                            
                        // If we couldn't get the translation from the dataset, try the series config
                        if (!translatedTitle && series) {
                            // Try getting translation using titleKey
                            if (series.titleKey) {
                                if (window.I18n && typeof window.I18n.translate === 'function') {
                                    translatedTitle = window.I18n.translate(series.titleKey);
                                } else {
                                    translatedTitle = series.title || '';
                                }
                            } 
                            // If no titleKey, use title directly
                            else if (series.title) {
                                translatedTitle = series.title;
                            } else {
                                // Series has no titleKey or title property
                                translatedTitle = `Series ${i+1}`;
                            }
                        }
                        
                        // Last resort fallback
                        if (!translatedTitle) {
                            translatedTitle = `Series ${i+1}`;
                        }
                        
                        // If we still have no translation, use dataset.label as fallback
                        if (!translatedTitle && dataset && dataset.label) {
                            translatedTitle = dataset.label.split(':')[0].trim();
                        }
                        
                        // Extract current value if present to append to label
                        let valuePart = '';
                        if (dataset && dataset.data && dataset.data.length > 0) {
                            const currentValue = dataset.data[dataset.data.length - 1];
                            if (currentValue !== undefined && !isNaN(currentValue)) {
                                // Format based on the value range
                                const range = 0; // Default range for formatting
                                valuePart = `: ${window.ChartUtils.formatNumber(currentValue, chartConfig, range)}`;
                            }
                        }
                        
                        // Special handling for charts that need consistent labels
                        if (specialHandling && specialHandling.consistentLegendLabels) {
                            // Apply the translation directly to both the dataset label and legend text
                            const fullLabel = `${translatedTitle}${valuePart}`;
                            
                            // Update in both places to ensure consistency
                            dataset.label = fullLabel;
                            label.text = fullLabel;
                        } else {
                            // For other charts, ensure the dataset label is properly set first
                            if (dataset && translatedTitle) {
                                // Update dataset label if it doesn't match the translation
                                const currentLabelBase = dataset.label ? dataset.label.split(':')[0].trim() : '';
                                if (currentLabelBase !== translatedTitle) {
                                    if (valuePart) {
                                        dataset.label = `${translatedTitle}${valuePart}`;
                                    } else {
                                        dataset.label = translatedTitle;
                                    }
                                }
                            }
                            
                            // Then set the legend text from the dataset
                            if (dataset && dataset.label) {
                                label.text = dataset.label;
                            } else if (translatedTitle) {
                                // Fallback if dataset.label is not available
                                label.text = `${translatedTitle}${valuePart}`;
                            }
                        }
                    }
                });
            }
            
            return labels;
        };
    } catch (e) {
        console.error("Error updating legend:", e);
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
    
    // 2. Then update each chart's labels, legends and stats - with a small delay for legend update
    if (window.chartInstances) {
        Object.entries(window.chartInstances).forEach(([chartId, chartInstance]) => {
            if (chartInstance) {
                window.translateChartLabels(chartInstance);
            }
        });
    }
    
    // 3. Fix temperature chart stats that might display series labels instead of L/A/H/N
    if (typeof fixTemperatureChartStats === 'function') {
        // Add a slight delay to ensure chart stats are updated first
        setTimeout(fixTemperatureChartStats, 50);
    }
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
    
    // Function for cross-chart highlighting
    function syncTooltips(chart, dataIndex) {
        // Skip if invalid index
        if (dataIndex === null || dataIndex === undefined) return;
        
        // Get the timestamp for the data point from raw data
        const rawData = window.chartRawData[chart.canvas.id];
        if (!rawData || !rawData.timestamps || !rawData.timestamps[dataIndex]) return;
        
        const timestamp = rawData.timestamps[dataIndex];
        
        // Make sure we have a Date object
        const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
        
        // Sync tooltips across all charts
        Object.values(chartInstances).forEach(otherChart => {
            if (!otherChart || otherChart === chart) return;
            
            // Get raw data for the other chart
            const chartId = otherChart.canvas.id;
            const otherRawData = window.chartRawData[chartId];
            if (!otherRawData || !otherRawData.timestamps) return;
            
            // Find the closest timestamp in the other chart
            let closestIndex = -1;
            let minTimeDiff = Infinity;
            
            otherRawData.timestamps.forEach((time, idx) => {
                const timeDiff = Math.abs(new Date(time) - timestampDate);
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = idx;
                }
            });
            
            // Only sync if the time difference is within 5 minutes
            if (minTimeDiff <= 5 * 60 * 1000 && closestIndex !== -1) {
                // For time scale, we need to pass the actual Date object to getPixelForValue
                const timeValue = new Date(otherRawData.timestamps[closestIndex]);
                
                const activeElements = otherChart.getElementsAtEventForMode(
                    { x: otherChart.scales.x.getPixelForValue(timeValue), y: otherChart.chartArea.top },
                    'nearest',
                    { intersect: false },
                    false
                );
                
                // Activate the tooltip on the other chart
                otherChart.tooltip.setActiveElements(activeElements, { x: 0, y: 0 });
                otherChart.update('none');
            }
        });
    }
    
    // Create or update chart
    const canvas = document.getElementById(config.id);
    if (!canvas) return;
    
    if (chartInstances[config.id]) {
        // Update existing chart
        chartInstances[config.id].data = chartData;
        chartInstances[config.id].options = chartOptions;
        chartInstances[config.id].update('none');
        
        // Always recalculate stats to ensure they're correct
        recalculateChartStats(chartInstances[config.id]);
    } else {
        // Create new chart
        chartInstances[config.id] = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
        
        // Calculate initial stats for new chart
        recalculateChartStats(chartInstances[config.id]);
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
        if (typeof fixTemperatureChartStats === 'function') {
            // Apply the fix with a small delay to ensure the chart is fully rendered
            setTimeout(fixTemperatureChartStats, 100);
        }
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
        // Properly destroy all existing chart instances
        Object.keys(chartInstances).forEach(id => {
            if (chartInstances[id]) {
                chartInstances[id].destroy();
                chartInstances[id] = null;
            }
        });
        
        // Clear chart instances
        Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
        
        // Reinitialize layout
        const currentRange = getURLParameter('range') || '1';
        const currentResults = parseInt(getURLParameter('results')) || 8000;
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
                if (typeof fixTemperatureChartStats === 'function') {
                    setTimeout(fixTemperatureChartStats, 100);
                }
            }
        }
    });
}

// Load data for all charts with progressive rendering
async function loadAllCharts(range = 1, results = 8000) {
    console.time('Total chart loading');
    
    // Initialize chart layout first
    console.time('Chart layout initialization');
    initializeChartLayout();
    console.timeEnd('Chart layout initialization');
    
    // Start a counter to track when all charts are loaded
    let chartsLoaded = 0;
    const totalCharts = window.chartConfigs.length;
    
    // Create and track all fetch promises
    console.time('Data fetching (total)');
    
    // Use Promise.allSettled to handle individual chart loading without waiting for all
    const fetchPromises = window.chartConfigs.map((config, index) => {
        // Start fetching data for this chart
        return fetchChartData(config, range, results)
            .then(data => {
                // When data arrives, immediately render the chart
                console.time(`Rendering chart ${config.id}`);
                createOrUpdateChart(config, data);
                console.timeEnd(`Rendering chart ${config.id}`);
                
                // Increment counter
                chartsLoaded++;
                
                // If this is the last chart, log completion
                if (chartsLoaded === totalCharts) {
                    console.timeEnd('Data fetching (total)');
                    console.timeEnd('Total chart loading');
                }
                
                // Return the data for Promise tracking
                return data;
            })
            .catch(error => {
                console.error(`Error loading chart ${config.id}:`, error);
                
                // Even on error, increment counter
                chartsLoaded++;
                
                // If this is the last chart, log completion
                if (chartsLoaded === totalCharts) {
                    console.timeEnd('Data fetching (total)');
                    console.timeEnd('Total chart loading');
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
    console.time('Refresh charts');
    
    // Properly destroy all existing chart instances first
    console.time('Destroy charts');
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            chartInstances[id] = null;
        }
    });
    
    // Clear chart instances object
    Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
    console.timeEnd('Destroy charts');
    
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
                console.time('Fix temperature chart stats');
                if (typeof fixTemperatureChartStats === 'function') {
                    fixTemperatureChartStats();
                }
                console.timeEnd('Fix temperature chart stats');
                console.timeEnd('Refresh charts');
                
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
                
                console.time('Fix temperature chart stats (fallback)');
                if (typeof fixTemperatureChartStats === 'function') {
                    fixTemperatureChartStats();
                }
                console.timeEnd('Fix temperature chart stats (fallback)');
                
                // Only end the timer if it hasn't been ended yet
                try {
                    console.timeEnd('Refresh charts');
                } catch (e) {
                    // Timer already ended, ignore
                }
                
                // Mark stats as fixed
                statsFixed = true;
            }
        }, 5000); // 5-second timeout as a fallback
    }
}

// Handle date range selection
function setupDateRangeHandlers() {
    const dateChips = document.querySelectorAll('.date-chip');
    
    // Get range and results from URL parameters or use defaults
    let currentRange = getURLParameter('range') || '1'; // Default to 1 day
    let currentResults = parseInt(getURLParameter('results')) || 8000; // Default to 8000 results
    
    // Set active state for current range
    const activeChip = document.querySelector(`.date-chip[data-range="${currentRange}"]`);
    if (activeChip) {
        activeChip.classList.add('active');
    } else {
        // Default to "1" if no matching chip is found
        const defaultChip = document.querySelector('.date-chip[data-range="1"]');
        if (defaultChip) {
            defaultChip.classList.add('active');
        }
    }
    
    /**
     * Updates URL parameters and refreshes charts
     * @param {string} range - The selected date range
     * @param {number} results - The number of results to show
     */
    function updateChartsWithParams(range, results) {
        // Update URL with new parameters
        const url = new URL(window.location.href);
        url.searchParams.set('range', range);
        
        if (results !== 8000) {
            url.searchParams.set('results', results);
        } else {
            url.searchParams.delete('results');
        }
        
        // Update browser history without reloading
        window.history.replaceState({}, '', url);
        
        // Refresh charts with new parameters
        window.refreshCharts(range, results);
    }
    
    // Add click handlers to all date range chips
    dateChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all chips
            dateChips.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked chip
            chip.classList.add('active');
            
            // Get selected range
            const range = chip.getAttribute('data-range');
            currentRange = range;
            
            // Update URL and refresh charts
            updateChartsWithParams(currentRange, currentResults);
        });
    });
    
    // Handle results input and update button
    const resultsInput = document.getElementById('resultsInput');
    const updateButton = document.getElementById('updateButton');
    
    if (resultsInput && updateButton) {
        resultsInput.value = currentResults;
        
        // Process results input and update charts
        function processResultsInput() {
            const newResults = parseInt(resultsInput.value) || 8000;
            currentResults = newResults;
            
            // Update URL and refresh charts
            updateChartsWithParams(currentRange, currentResults);
        }
        
        // Set up button click handler
        updateButton.addEventListener('click', processResultsInput);
        
        // Set up enter key handler
        resultsInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                processResultsInput();
            }
        });
    }
}

/**
 * Sort charts by category - only on mobile devices
 * @param {string} category - The category to sort by, or 'row' for row-based sorting
 */
function sortChartsByCategory(category) {
    // Only apply sorting on mobile (to avoid issues on desktop grid layout)
    // Force mobile mode if needed for testing by adding ?forceMobile=true to URL
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobile = urlParams.get('forceMobile') === 'true';
    const isMobileView = window.innerWidth <= 768 || forceMobile;
    
    if (!isMobileView) {
        return;
    }
    
    const chartContainer = document.getElementById('chartContainer');
    
    if (!chartContainer) {
        return;
    }
    
    const charts = Array.from(chartContainer.querySelectorAll('.chart'));
    
    // Create a sortable array of chart elements with their metadata
    const chartElements = charts.map(chart => {
        // Get canvas element - if missing, skip this chart
        const canvas = chart.querySelector('canvas');
        if (!canvas) {
            return null;
        }
        
        return {
            element: chart,
            row: parseInt(chart.getAttribute('data-row') || '0'),
            category: chart.getAttribute('data-category') || '',
            id: canvas.id
        };
    }).filter(Boolean); // Remove any null elements (charts with missing canvas)
    
    /**
     * Gets the column position for a chart element
     * @param {Object} chartElement - The chart element with id property
     * @returns {number} - The column position (defaults to 0 if not found)
     */
    function getColumnPosition(chartElement) {
        // Try to get from config first (most reliable source)
        const config = window.chartConfigs.find(c => c.id === chartElement.id);
        let column = 0;
        
        if (config && config.gridColumn) {
            column = parseInt(config.gridColumn.split('/')[0]) || 0;
        } else if (chartElement.element.style.gridColumn) {
            column = parseInt(chartElement.element.style.gridColumn.split('/')[0]) || 0;
        }
        
        return column;
    }
    
    // Sort charts based on category
    if (category === 'row') {
        // Sort by row number and then by column position
        chartElements.sort((a, b) => {
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            
            // Compare column positions
            const aCol = getColumnPosition(a);
            const bCol = getColumnPosition(b);
            
            return aCol - bCol;
        });
    } else {
        // Sort by category (matching category first, then other charts by row)
        chartElements.sort((a, b) => {
            const aMatches = a.category === category;
            const bMatches = b.category === category;
            
            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;
            
            // If both match or don't match the category, sort by row
            return a.row - b.row;
        });
    }
    
    // Remove all charts from container, but DO NOT destroy Chart instances
    charts.forEach(chart => chart.remove());
    
    // Reattach charts in the new order
    chartElements.forEach(item => {
        chartContainer.appendChild(item.element);
    });
    
    // Store the current sort preference
    localStorage.setItem('chartSortPreference', category);
}

// Export sort function to global scope for access from event handlers
window.sortChartsByCategory = sortChartsByCategory;

/**
 * Special function to fix the temperature chart stats when they're broken
 * This should be called whenever language changes to ensure proper translation
 */
// Function to get translation labels
function getStatLabels() {
    const lowTranslation = window.I18n.translate('low');
    const avgTranslation = window.I18n.translate('avg');
    const highTranslation = window.I18n.translate('high');
    const nowTranslation = window.I18n.translate('now');
    
    return {
        lowLabel: lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L',
        avgLabel: avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A',
        highLabel: highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H',
        nowLabel: nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N',
        lowFullLabel: lowTranslation,
        avgFullLabel: avgTranslation,
        highFullLabel: highTranslation,
        nowFullLabel: nowTranslation
    };
}

function fixTemperatureChartStats() {
    // Get stat labels
    const labels = getStatLabels();
    
    // Find all charts with statsLabelsStyle: 'LAHN' configuration
    const chartsWithSpecialStats = window.chartConfigs.filter(config => config.statsLabelsStyle === 'LAHN');
    
    // Process each chart with special stats formatting
    chartsWithSpecialStats.forEach(chartConfig => {
        const chartId = chartConfig.id;
        const statsEl = document.getElementById(`stats-${chartId}`);
        if (!statsEl) {
            return;
        }
        
        // First check if the stats element already has the correct structure
        const existingLabels = statsEl.querySelectorAll('.chart-stat-label-short');
        
        // If stats already have the correct structure and labels, skip updating
        if (existingLabels.length === 4) {
            // Check if labels match
            if (existingLabels[0].textContent === `${labels.lowLabel}:` &&
                existingLabels[1].textContent === `${labels.avgLabel}:` &&
                existingLabels[2].textContent === `${labels.highLabel}:` &&
                existingLabels[3].textContent === `${labels.nowLabel}:`) {
                // Structure and labels are correct, no need to update
                return;
            }
        }
        
        // Use chartConfig directly (already have it) for unit and formatting 
        const unit = chartConfig.unit || '';
        
        // Determine values for chart statistics
        let minValue = 0;
        let maxValue = 0;
        let avgValue = 0;
        let currentValue = null;
        let range = 0;
        
        // First try getting values from chart instance
        const chartInstance = window.chartInstances[chartId];
        if (chartInstance && chartInstance.data && chartInstance.data.datasets && 
            chartInstance.data.datasets.length > 0 && chartInstance.data.datasets[0].data) {
            
            // Get values from the first dataset
            const dataset = chartInstance.data.datasets[0];
            const validValues = dataset.data.filter(v => v !== null && v !== undefined && !isNaN(v));
            
            if (validValues.length > 0) {
                minValue = Math.min(...validValues);
                maxValue = Math.max(...validValues);
                avgValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
                currentValue = validValues[validValues.length - 1];
                range = maxValue - minValue;
            }
        }
        // If chart instance not available, try to extract values from the existing stats element
        else {
            // Extract values from existing stats
            try {
                const statDivs = statsEl.querySelectorAll('.chart-stat');
                if (statDivs.length >= 3) {
                    // Extract numeric values from stat divs
                    const getNumericValue = (div) => {
                        const text = div.textContent.trim();
                        const match = text.match(/[-\d.]+/);
                        return match ? parseFloat(match[0]) : null;
                    };
                    
                    minValue = getNumericValue(statDivs[0]);
                    avgValue = getNumericValue(statDivs[1]);
                    maxValue = getNumericValue(statDivs[2]);
                    
                    if (statDivs.length >= 4) {
                        currentValue = getNumericValue(statDivs[3]);
                    }
                    
                    // Ensure values are valid numbers
                    minValue = !isNaN(minValue) ? minValue : 0;
                    avgValue = !isNaN(avgValue) ? avgValue : 0;
                    maxValue = !isNaN(maxValue) ? maxValue : 0;
                    currentValue = !isNaN(currentValue) ? currentValue : null;
                    
                    range = maxValue - minValue;
                }
            } catch (e) {
                // Use default values
                minValue = 0;
                maxValue = 0;
                avgValue = 0;
                currentValue = null;
                range = 0;
            }
        }
        
        // Format values appropriately
        const formatNumber = (val) => {
            if (val === null || val === undefined || isNaN(val)) return '—';
            if (chartConfig && chartConfig.useIntegerFormat) {
                return Math.round(val).toString();
            } else if (range >= 10) {
                return Math.round(val).toString();
            } else if (range < 1) {
                return val.toFixed(2);
            } else {
                return val.toFixed(1);
            }
        };
        
        // Create the properly formatted values
        const formattedMin = formatNumber(minValue);
        const formattedAvg = formatNumber(avgValue);
        const formattedMax = formatNumber(maxValue);
        const formattedCurrent = currentValue !== null ? formatNumber(currentValue) : '—';
        
        // Replace the content of the stats element with properly structured HTML
        // This ensures that the HTML structure is correct regardless of what was there before
        statsEl.innerHTML = `
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${labels.lowLabel}:</span>
                    <span class="chart-stat-label-low" data-full-label="${labels.lowFullLabel}:"></span>
                </span>${formattedMin}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${labels.avgLabel}:</span>
                    <span class="chart-stat-label-avg" data-full-label="${labels.avgFullLabel}:"></span>
                </span>${formattedAvg}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${labels.highLabel}:</span>
                    <span class="chart-stat-label-high" data-full-label="${labels.highFullLabel}:"></span>
                </span>${formattedMax}${unit}
            </div>
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${labels.nowLabel}:</span>
                    <span class="chart-stat-label-now" data-full-label="${labels.nowFullLabel}:"></span>
                </span>${formattedCurrent !== '—' ? formattedCurrent + unit : '—'}
            </div>
        `;
    });
}

// Initialize chart system when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // We'll skip setupDateRangeHandlers() here since it's now called in index.html
    // after the header is created dynamically
    
    // Get range and results from URL parameters or use defaults
    const range = getURLParameter('range') || '1';
    const results = parseInt(getURLParameter('results')) || 8000;
    
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
            
            // Get current range and results
            const currentRange = getURLParameter('range') || '1';
            const currentResults = parseInt(getURLParameter('results')) || 8000;
            
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