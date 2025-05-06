// Global Chart.js configuration
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

// Store all created charts to allow updates
// Export as a global variable for access by script.js
window.chartInstances = {};
const chartInstances = window.chartInstances;

/**
 * Chart renderer utility functions
 * Contains helper methods for data processing, chart creation and updates
 * 
 * IMPORTANT: This module follows a configuration-driven approach where all chart properties
 * must be explicitly defined in the configuration. No implicit behavior based on chart IDs.
 */
const ChartUtils = {
    // Format a number based on chart configuration and data range
    formatNumber: function(val, config, range) {
        if (!val && val !== 0) return '—';
        
        // Get formatting configuration
        const formatting = config && config.formatting || {};
        
        // First check for explicit decimal places configuration
        if (formatting.decimalPlaces !== undefined) {
            return parseFloat(val.toFixed(3)).toFixed(formatting.decimalPlaces);
        }
        
        // Use useIntegerFormat from either the formatting object or the main config
        const useInteger = (formatting.useIntegerFormat !== undefined) ? 
            formatting.useIntegerFormat : 
            (config && config.useIntegerFormat === true);
        
        // Use config-based or range-based formatting
        if (useInteger || range >= 10) {
            // Format as integer for integer config or large ranges
            return Math.round(val).toString();
        } else if (range < 1 || Math.abs(val) < 1) {
            // Use two decimal places for very small ranges or very small values
            return parseFloat(val.toFixed(3)).toFixed(2);
        } else if (Math.abs(val) < 10) {
            // Use one decimal place for moderately small values
            return parseFloat(val.toFixed(3)).toFixed(1);
        } else {
            // For medium to large values, round to integers
            return Math.round(parseFloat(val.toFixed(3))).toString();
        }
    },
    
    // Filter active datasets from chart data
    // This excludes statistical/hidden datasets used for annotations
    getActiveDatasets: function(chart) {
        if (!chart || !chart.data || !chart.data.datasets) {
            return [];
        }
        
        return chart.data.datasets.filter(dataset => {
            // Skip datasets with all null/undefined values
            const hasRealValues = dataset.data && dataset.data.some(v => v !== null && v !== undefined);
            
            // Skip datasets that are just for statistical indicators
            const isStatDataset = dataset.label && (
                dataset.label.includes('Average') || 
                dataset.label.includes('Avg') || 
                dataset.label.includes('Min') || 
                dataset.label.includes('Max') ||
                dataset.label.includes('Low') ||
                dataset.label.includes('High')
            );
            
            // Skip datasets with all identical values (likely avg line)
            const hasIdenticalValues = dataset.data && 
                dataset.data.length > 1 && 
                new Set(dataset.data.filter(v => v !== null && v !== undefined)).size === 1;
            
            return hasRealValues && !isStatDataset && !hasIdenticalValues;
        });
    },
    
    // Calculate min, max, avg, and current values from datasets
    calculateStats: function(datasets) {
        let minValue = Infinity;
        let maxValue = -Infinity;
        let avgValue = 0;
        let totalValues = 0;
        let totalCount = 0;
        let currentValue = null;
        
        datasets.forEach(dataset => {
            if (!dataset.data || dataset.data.length === 0) return;
            
            const values = dataset.data.filter(v => v !== null && v !== undefined && !isNaN(v));
            if (values.length === 0) return;
            
            const datasetMin = Math.min(...values);
            const datasetMax = Math.max(...values);
            const datasetSum = values.reduce((sum, v) => sum + v, 0);
            
            minValue = Math.min(minValue, datasetMin);
            maxValue = Math.max(maxValue, datasetMax);
            totalValues += datasetSum;
            totalCount += values.length;
        });
        
        // Calculate overall average
        avgValue = totalCount > 0 ? totalValues / totalCount : 0;
        
        // Get current value from the first dataset
        if (datasets.length > 0 && datasets[0].data && datasets[0].data.length > 0) {
            currentValue = datasets[0].data[datasets[0].data.length - 1];
        }
        
        return {
            minValue: minValue !== Infinity ? minValue : 0,
            maxValue: maxValue !== -Infinity ? maxValue : 0,
            avgValue,
            currentValue
        };
    },
    
    // Create annotations for statistical indicators (avg line, min/max points)
    createStatisticalAnnotations: function(config, stats, chartData) {
        const { minValue, maxValue, avgValue } = stats;
        const annotations = {};
        
        // Add average line annotation
        annotations.avgLine = {
            type: 'line',
            yMin: avgValue,
            yMax: avgValue,
            borderColor: '#888888',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
                enabled: false,
                content: window.i18n ? window.i18n.__('avg') : 'Average',
                position: 'start',
                backgroundColor: 'rgba(136, 136, 136, 0.7)'
            }
        };
        
        // Get indicator configuration with defaults
        const indicators = config.indicators || {};
        const showMax = indicators.showMax !== undefined ? indicators.showMax : (config.indicateMax === true);
        const showMin = indicators.showMin !== undefined ? indicators.showMin : (config.indicateMin === true);
        
        // Get indicator colors from configuration or use defaults
        const indicatorColors = indicators.colors || {};
        const maxColor = indicatorColors.max || '#ff5252';
        const minColor = indicatorColors.min || '#4caf50';
        
        if (showMax || showMin) {
            // Find indices where min/max values occur
            const maxIndices = [];
            const minIndices = [];
            
            // Find all occurrences of min and max values
            chartData.datasets[0].data.forEach((value, index) => {
                if (showMax && value === maxValue) maxIndices.push(index);
                if (showMin && value === minValue) minIndices.push(index);
            });
            
            // Add max point annotations if configured
            if (showMax && maxIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMaxIndices = maxIndices.length > 3 ? 
                    [maxIndices[0], maxIndices[Math.floor(maxIndices.length/2)], maxIndices[maxIndices.length-1]] : 
                    maxIndices;
                
                // Create point annotations for each max value
                limitedMaxIndices.forEach((index, i) => {
                    annotations[`maxPoint${i}`] = {
                        type: 'point',
                        xValue: index,
                        yValue: maxValue,
                        backgroundColor: maxColor,
                        borderColor: maxColor,
                        borderWidth: 2,
                        radius: 5,
                        label: {
                            enabled: false,
                            content: window.i18n ? window.i18n.__('high') : 'Max',
                            position: 'top',
                            backgroundColor: 'rgba(255, 82, 82, 0.7)'
                        }
                    };
                });
            }
            
            // Add min point annotations if configured
            if (showMin && minIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMinIndices = minIndices.length > 3 ? 
                    [minIndices[0], minIndices[Math.floor(minIndices.length/2)], minIndices[minIndices.length-1]] : 
                    minIndices;
                
                // Create point annotations for each min value
                limitedMinIndices.forEach((index, i) => {
                    annotations[`minPoint${i}`] = {
                        type: 'point',
                        xValue: index,
                        yValue: minValue,
                        backgroundColor: minColor,
                        borderColor: minColor,
                        borderWidth: 2,
                        radius: 5,
                        label: {
                            enabled: false,
                            content: window.i18n ? window.i18n.__('low') : 'Min',
                            position: 'bottom',
                            backgroundColor: 'rgba(76, 175, 80, 0.7)'
                        }
                    };
                });
            }
        }
        
        return annotations;
    }
};

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
        if (window.i18n && typeof window.i18n.__ === 'function') {
            const translatedTitle = window.i18n.__(translationKey);
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
        if (window.i18n && typeof window.i18n.__ === 'function') {
            loadingTextValue = window.i18n.__('loading');
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
    const activeDatasets = ChartUtils.getActiveDatasets(chart);
    
    // Calculate statistics using utility function
    const stats = ChartUtils.calculateStats(activeDatasets);
    
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
    
    // Get translated labels
    let lowLabel = 'L';
    let avgLabel = 'A';
    let highLabel = 'H';
    let nowLabel = 'N';
    
    if (window.i18n && typeof window.i18n.__ === 'function') {
        const lowTranslation = window.i18n.__('low');
        const avgTranslation = window.i18n.__('avg');
        const highTranslation = window.i18n.__('high');
        const nowTranslation = window.i18n.__('now');
        
        lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
        avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
        highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
        nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
    }
    
    // Get chart config and unit through direct config property access
    const config = window.chartConfigs.find(c => c.id === chartId);
    const unit = config && config.unit ? config.unit : '';
    
    // Format values appropriately
    const range = maxValue - minValue;
    
    // Determine formatting function based on config
    let formatFunc = ChartUtils.formatNumber;
    
    // Special override for window chart - always use integers
    if (chartId === 'chart-window' || 
        (config && config.formatting && config.formatting.decimalPlaces === 0)) {
        formatFunc = (val, config, range) => Math.round(val).toString();
    }
    
    // Build stats HTML
    statsEl.innerHTML = `
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${lowLabel}:</span>
                <span class="chart-stat-label-low"></span>
            </span>${formatFunc(minValue, config, range)}${unit}
        </div>
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${avgLabel}:</span>
                <span class="chart-stat-label-avg"></span>
            </span>${formatFunc(avgValue, config, range)}${unit}
        </div>
        <div class="chart-stat">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${highLabel}:</span>
                <span class="chart-stat-label-high"></span>
            </span>${formatFunc(maxValue, config, range)}${unit}
        </div>
        ${!isMultiSeries ? `
        <div class="chart-stat chart-stat-current">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${nowLabel}:</span>
                <span class="chart-stat-label-now"></span>
            </span>${currentValue !== null ? formatFunc(currentValue, config, range) + unit : '—'}
        </div>
        ` : ''}
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
    if (!chart || !chart.data || !chart.data.datasets || !window.chartTranslator) {
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
                // First try the new I18n system (preferred)
                if (window.I18n && typeof window.I18n.translate === 'function') {
                    translatedLabel = window.I18n.translate(series.titleKey);
                } 
                // Fallback to old system
                else if (window.i18n && typeof window.i18n.__ === 'function') {
                    translatedLabel = window.i18n.__(series.titleKey);
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
                // Otherwise use legacy chartTranslator
                else if (window.chartTranslator && typeof window.chartTranslator.translateSeriesTitle === 'function') {
                    translatedLabel = window.chartTranslator.translateSeriesTitle(series.title);
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
                    // First try the new I18n system (preferred)
                    if (window.I18n && typeof window.I18n.translate === 'function') {
                        translatedLabel = window.I18n.translate(chartConfig.titleKey);
                    } 
                    // Fallback to old system
                    else if (window.i18n && typeof window.i18n.__ === 'function') {
                        translatedLabel = window.i18n.__(chartConfig.titleKey);
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
                    // Otherwise use legacy chartTranslator
                    else if (window.chartTranslator && typeof window.chartTranslator.translateChartTitle === 'function') {
                        translatedLabel = window.chartTranslator.translateChartTitle(chartConfig.title);
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
        
        // Add debug logs for troubleshooting
        console.log(`Translating dataset ${index}: Original = "${originalLabel}", Translated = "${translatedLabel}"`);
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
        // Force Chart.js to re-render the legend completely
        const originalLegendDisplay = chart.options.plugins.legend.display;
        chart.options.plugins.legend.display = false;
        chart.update('none');
        
        // Restore legend display
        chart.options.plugins.legend.display = originalLegendDisplay;
        
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
                                    } else if (window.i18n && typeof window.i18n.__ === 'function') {
                                        translatedTitle = window.i18n.__(dataset._titleKey);
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
                                } else if (window.i18n && typeof window.i18n.__ === 'function') {
                                    translatedTitle = window.i18n.__(series.titleKey);
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
                                valuePart = `: ${ChartUtils.formatNumber(currentValue, chartConfig, range)}`;
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
        if (translationKey && window.i18n && typeof window.i18n.__ === 'function') {
            const translatedTitle = window.i18n.__(translationKey);
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

function createOrUpdateChart(config, data) {
    // Get the loading element
    const loadingEl = document.getElementById(`loading-${config.id}`);
    
    // Get translated loading text - try both systems to ensure it works
    let loadingText = 'Laster data...';
    let noDataText = 'Ingen data tilgjengelig';
    
    // First try the new i18n system (preferred)
    if (window.I18n && typeof window.I18n.translate === 'function') {
        loadingText = window.I18n.translate('loading');
        noDataText = window.I18n.translate('noData');
    }
    // Fallback to the old i18n system
    else if (window.i18n && typeof window.i18n.__ === 'function') {
        loadingText = window.i18n.__('loading');
        noDataText = window.i18n.__('noData');
    }
    
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
    
    // Check if this is a multi-series chart
    let datasets = [];
    let filteredValues = [];
    let timestamps = [];
    let minValue = Infinity;  // Initialize to Infinity so Math.min works properly
    let maxValue = -Infinity;
    let avgValue = 0;
    let hasNegativeValues = false;
    
    // Initialize min and max values for statistics
    
    // Check if we need to apply data transformation
    const dataTransform = config.dataTransform || null;
    
    if (data.is_multi_series) {
        // Handle multi-series data
        if (!data.series || data.series.length === 0 || data.series[0].feeds.length === 0) {
            // No valid data for any series
            const loadingEl = document.getElementById(`loading-${config.id}`);
            if (loadingEl) {
                // Use translated no data text
                let noDataText = 'Ingen gyldige dataverdier';
                if (window.i18n && typeof window.i18n.__ === 'function') {
                    noDataText = window.i18n.__('noData');
                }
                loadingEl.innerHTML = `<div>${noDataText}</div>`;
            }
            return;
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
            
            // Process min values for series
            // Add to filtered values for overall stats
            filteredValues = filteredValues.concat(seriesFiltered);
            
            // Translate series title if possible
            let translatedTitle = series.title;
            if (window.i18n && typeof window.i18n.__ === 'function') {
                // Use titleKey from series config directly if available
                if (series.titleKey) {
                    const translated = window.i18n.__(series.titleKey);
                    if (translated !== series.titleKey) {
                        translatedTitle = translated;
                    }
                }
            }
            
            // Create dataset for this series
            const yAxisID = series.axis || 'y';
            
            // Determine translated title for dataset label
            let datasetLabel = series.title || ''; // Fallback
            
            // Use titleKey if available (preferred)
            if (series.titleKey) {
                if (window.I18n && typeof window.I18n.translate === 'function') {
                    datasetLabel = window.I18n.translate(series.titleKey);
                } else if (window.i18n && typeof window.i18n.__ === 'function') {
                    datasetLabel = window.i18n.__(series.titleKey);
                }
            }
            
            // Ensure we have a valid label
            if (!datasetLabel || datasetLabel === series.titleKey) {
                // Use original title as fallback if translation failed
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
        // Handle single series data (original code)
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
        
        // Process values for temperature charts
        
        if (filteredValues.length === 0) {
            // No valid numeric values
            const loadingEl = document.getElementById(`loading-${config.id}`);
            if (loadingEl) {
                // Use translated no data text
                let noDataText = 'Ingen gyldige dataverdier';
                if (window.i18n && typeof window.i18n.__ === 'function') {
                    noDataText = window.i18n.__('noData');
                }
                loadingEl.innerHTML = `<div>${noDataText}</div>`;
            }
            return;
        }
        
        // Simple min/max calculation from actual data values
        minValue = Math.min(...filteredValues);
        maxValue = Math.max(...filteredValues);
        
        // Min/max values calculated
        
        // Store timestamps for cross-chart syncing
        timestamps = data.feeds.map(feed => feed.created_at);
        
        // Create dataset for single series - use translations if available
        // Get translated chart title
        let chartTitle = config.title;
        
        // Use titleKey directly from config if available
        if (config.titleKey && window.i18n && typeof window.i18n.__ === 'function') {
            chartTitle = window.i18n.__(config.titleKey);
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
    
    // Use the unified stats update function
    updateChartStats(config.id, minValue, maxValue, avgValue, currentValue, data.is_multi_series);
    
    // Ensure we're using the correct locale for time formatting
    if (window.moment && window.i18n) {
        const lang = window.i18n.getCurrentLanguage();
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    const chartData = {
        labels: timestamps.map(timestamp => moment(timestamp).format('LT')),
        datasets: datasets
    };
    
    // Function for cross-chart highlighting
    function syncTooltips(chart, dataIndex) {
        // Skip if invalid index
        if (dataIndex === null || dataIndex === undefined) return;
        
        // Get the timestamp for this data point
        const timestamp = timestamps[dataIndex];
        if (!timestamp) return;
        
        // Sync tooltips across all charts
        Object.values(chartInstances).forEach(otherChart => {
            if (!otherChart || otherChart === chart) return;
            
            // Get raw data for this chart
            const chartId = otherChart.canvas.id;
            const rawData = window.chartRawData[chartId];
            if (!rawData || !rawData.timestamps) return;
            
            // Find the closest timestamp in the other chart
            let closestIndex = -1;
            let minTimeDiff = Infinity;
            
            rawData.timestamps.forEach((time, idx) => {
                const timeDiff = Math.abs(new Date(time) - new Date(timestamp));
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestIndex = idx;
                }
            });
            
            // Only sync if the time difference is within 5 minutes
            if (minTimeDiff <= 5 * 60 * 1000 && closestIndex !== -1) {
                const activeElements = otherChart.getElementsAtEventForMode(
                    { x: otherChart.scales.x.getPixelForValue(closestIndex), y: otherChart.chartArea.top },
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
    
    // Use ChartUtils.getUnitForChart instead of this function
    // This is kept for backward compatibility
    function getUnitForChart(chartId) {
        return ChartUtils.getUnitForChart(chartId);
    }
    
    // Function to get all related chart data (same category and related categories)
    function getRelatedChartData(category, timestamp, config) {
        if (!timestamp || !window.chartRawData) return [];
        
        const relatedData = [];
        const categoriesToInclude = category ? [category] : []; // Always include the main category if specified
        
        // Add related categories if specified in the config
        if (config && config.relatedCategories && Array.isArray(config.relatedCategories)) {
            categoriesToInclude.push(...config.relatedCategories);
        }
        
        // If no categories to include, return empty array
        if (categoriesToInclude.length === 0) return [];
        
        Object.entries(window.chartRawData).forEach(([chartId, rawData]) => {
            // Skip if rawData is invalid
            if (!rawData || !rawData.timestamps || !rawData.timestamps.length) return;
            
            // Check if chart's category is one we should include
            if (rawData.category && categoriesToInclude.includes(rawData.category)) {
                // Find closest timestamp
                let closestIndex = -1;
                let minTimeDiff = Infinity;
                
                rawData.timestamps.forEach((time, idx) => {
                    if (!time) return; // Skip invalid timestamps
                    
                    try {
                        const timeDiff = Math.abs(new Date(time) - new Date(timestamp));
                        if (timeDiff < minTimeDiff) {
                            minTimeDiff = timeDiff;
                            closestIndex = idx;
                        }
                    } catch (e) {
                        // Skip invalid dates
                    }
                });
                
                // Only include if close enough (5 minutes) and valid index
                if (minTimeDiff <= 5 * 60 * 1000 && closestIndex !== -1) {
                    // Get chart config to get correct unit
                    const chartConfig = window.chartConfigs.find(c => c.id === chartId);
                    const unit = chartConfig && chartConfig.unit ? chartConfig.unit : ChartUtils.getUnitForChart(chartId, chartConfig);
                    
                    // Handle both single and multi-series charts
                    if (rawData.is_multi_series && rawData.series && Array.isArray(rawData.series)) {
                        // Add each series in the multi-series chart
                        rawData.series.forEach(series => {
                            if (!series || !series.values || closestIndex >= series.values.length) return;
                            
                            // Get series title - either from translation or from data
                            let title = '';
                            if (chartConfig && chartConfig.titleKey) {
                                const configTitle = window.i18n ? window.i18n.__(chartConfig.titleKey) : chartConfig.title || '';
                                title = `${configTitle} (${series.title || ''})`;
                            } else {
                                title = `${rawData.title || chartId} (${series.title || ''})`;
                            }
                            
                            relatedData.push({
                                title: title,
                                value: series.values[closestIndex],
                                unit: unit,
                                color: series.color || '#666',
                                category: rawData.category, // Store the category for grouping
                                chartId: chartId // Store the chart ID for filtering duplicates
                            });
                        });
                    } else {
                        // Single series chart
                        if (!rawData.values || closestIndex >= rawData.values.length) return;
                        
                        // Get chart title from translations if possible
                        let title = '';
                        if (chartConfig && chartConfig.titleKey) {
                            title = window.i18n ? window.i18n.__(chartConfig.titleKey) : chartConfig.title || chartId;
                        } else {
                            title = rawData.title || chartId;
                        }
                        
                        relatedData.push({
                            title: title,
                            value: rawData.values[closestIndex],
                            unit: unit,
                            color: rawData.color || '#666',
                            category: rawData.category, // Store the category for grouping
                            chartId: chartId // Store the chart ID for filtering duplicates
                        });
                    }
                }
            }
        });
        
        return relatedData;
    }
    
    // Check if this chart has a minimum value configuration
    const hasMinValue = config.minValue !== undefined;
    
    // We'll use the config title directly in the chart options
    // The DOM title element will be updated when language changes
    
    // Optimized chart options for better rendering
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
            ...(!data.is_multi_series && {
                legend: {
                    display: false // Don't show legend for single-series charts, including stat datasets
                }
            }),
        },
        
        scales: {
            x: {
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
                    color: '#666'
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
                        
                        // Check for explicit decimal places setting in config
                        if (config && config.formatting && config.formatting.decimalPlaces !== undefined) {
                            return parseFloat(valueWithFixedPrecision.toFixed(config.formatting.decimalPlaces)).toString();
                        }
                        
                        // Special case for window chart - always show integers
                        if (chartId === 'chart-window') {
                            return Math.round(valueWithFixedPrecision).toString();
                        }
                        
                        // Special case for battery voltage chart - always show 1 decimal place
                        if (chartId === 'chart-battery-voltage') {
                            return parseFloat(valueWithFixedPrecision.toFixed(1)).toString();
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
            },
            // Add secondary Y axis if enabled in config
            ...(config.secondYAxis && {
                y1: {
                    position: 'left', // Put second axis on the opposite side
                    grid: {
                        display: false, // Don't show grid lines for second axis
                        drawOnChartArea: false
                    },
                    // Calculate y1 range based on second series values
                    suggestedMin: function() {
                        // Find the dataset with y1 axis
                        const y1Dataset = datasets.find(d => d.yAxisID === 'y1');
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
                        const y1Dataset = datasets.find(d => d.yAxisID === 'y1');
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
                            
                            // Check for explicit decimal places setting in config
                            if (config && config.formatting && config.formatting.decimalPlaces !== undefined) {
                                return parseFloat(valueWithFixedPrecision.toFixed(config.formatting.decimalPlaces)).toString();
                            }
                            
                            // Special case for window chart - always show integers
                            if (chartId === 'chart-window') {
                                return Math.round(valueWithFixedPrecision).toString();
                            }
                            
                            // Special case for battery voltage chart - always show 1 decimal place
                            if (chartId === 'chart-battery-voltage') {
                                return parseFloat(valueWithFixedPrecision.toFixed(1)).toString();
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
            })
        },
        
        plugins: {
            title: {
                display: false, // Don't display the title - we have our own title element
            },
            legend: {
                // Only show legend for multi-series charts
                display: data.is_multi_series === true, // Explicitly check for true to avoid false positives
                position: 'top',
                labels: {
                    boxWidth: 12, // Bit longer line
                    boxHeight: 2, // Very thin line instead of box
                    padding: 6,   // Less padding
                    font: {
                        size: 8,  // Smaller font
                        weight: 500 // Make labels slightly bolder
                    },
                    color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#c0c0c0' : undefined,
                    usePointStyle: false, // Don't use point style (use line style)
                    
                    // Add current values to the labels
                    generateLabels: function(chart) {
                        // Safety checks for datasets and labels
                        if (!chart || !chart.data || !chart.data.datasets) {
                            return [];
                        }
                        
                        const datasets = chart.data.datasets;
                        const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart) || [];
                        
                        // For multi-series charts with data
                        if (data && data.is_multi_series && data.series && data.series.length > 0 && labels.length > 0) {
                            // Update each label with the current value
                            labels.forEach((label, i) => {
                                // Safety check for datasets and data.series
                                if (i < data.series.length && datasets && datasets[i] && datasets[i].data && datasets[i].data.length > 0) {
                                    // First, ensure label text is translated if needed
                                    if (window.i18n && typeof window.i18n.__ === 'function') {
                                        // Get original text (before any value is added)
                                        const originalText = (label.text || '').split(':')[0].trim();
                                        
                                        // Fall back to hardcoded mapping since we don't have access 
                                        // to the chart configuration in this scope
                                        let titleKey = null;
                                        if (originalText === 'Tak') titleKey = 'ceiling';
                                        else if (originalText === 'Intern') titleKey = 'internal';
                                        else if (originalText === 'Agurk') titleKey = 'cucumber';
                                        else if (originalText === 'Agurk 1') titleKey = 'cucumber1';
                                        else if (originalText === 'Agurk 2') titleKey = 'cucumber2';
                                        else if (originalText === 'Padron') titleKey = 'padron';
                                        else if (originalText === 'Gulv') titleKey = 'floor';
                                        
                                        // Apply translation if found
                                        if (titleKey) {
                                            const translated = window.i18n.__(titleKey);
                                            if (translated !== titleKey) {
                                                label.text = translated;
                                            }
                                        }
                                    }
                                    
                                    // Add current value to label text
                                    const currentValue = datasets[i].data[datasets[i].data.length - 1];
                                    if (currentValue !== undefined && !isNaN(currentValue)) {
                                        // Format value based on magnitude
                                        let formattedValue;
                                        if (Math.abs(currentValue) >= 10) {
                                            formattedValue = Math.round(currentValue);
                                        } else if (Math.abs(currentValue) < 1) {
                                            formattedValue = currentValue.toFixed(2);
                                        } else {
                                            formattedValue = currentValue.toFixed(1);
                                        }
                                        
                                        // Add value to label
                                        label.text += `: ${formattedValue}`;
                                        
                                        // Store the value in the label object for custom rendering if needed
                                        label.value = formattedValue;
                                    }
                                }
                            });
                        }
                        
                        return labels;
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                titleFont: {
                    size: 11
                },
                bodyFont: {
                    size: 11
                },
                padding: 6,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                callbacks: {
                    // Customize title to show full date/time
                    title: (tooltipItems) => {
                        const index = tooltipItems[0].dataIndex;
                        // Explicitly check current locale to make sure it's set correctly
                        if (window.moment && window.i18n) {
                            const lang = window.i18n.getCurrentLanguage();
                            // Set the locale each time to ensure it matches current language
                            const momentLocale = lang === 'no' ? 'nb' : lang;
                            window.moment.locale(momentLocale);
                        }
                        return moment(timestamps[index]).format('LLL');
                    },
                    
                    // Customize format for data values in tooltip
                    label: (tooltipItem) => {
                        const datasetLabel = tooltipItem.dataset.label || '';
                        let formattedValue = tooltipItem.formattedValue;
                        
                        // Use consistent formatting based on configuration
                        if (config.useIntegerFormat === true) {
                            // Format as integer if the chart is configured to use integer format
                            formattedValue = Math.round(tooltipItem.raw);
                        }
                        
                        // Add transformation information in tooltip if configured
                        let displayUnit = config.unit || '';
                        if (config.dataTransform && config.dataTransform.normalizeToZero) {
                            // Optionally add original value info in tooltip
                            const originalValue = tooltipItem.raw - (config.dataTransform.shiftBy || 0);
                            const formattedOriginal = config.useIntegerFormat ? 
                                Math.round(originalValue) : 
                                parseFloat(originalValue.toFixed(1));
                                
                            // Only show if debugging is enabled or always show
                            // return `${datasetLabel}: ${formattedValue}${displayUnit} (raw: ${formattedOriginal}${displayUnit})`;
                            
                            // Simple display without raw value
                            return `${datasetLabel}: ${formattedValue}${displayUnit}`;
                        }
                        
                        // Standard display without transformation info
                        return `${datasetLabel}: ${formattedValue}${displayUnit}`;
                    },
                    
                    // Show data from all related charts in this tooltip
                    afterBody: (tooltipItems) => {
                        if (!tooltipItems.length) return [];
                        
                        // Get timestamp for this tooltip
                        const dataIndex = tooltipItems[0].dataIndex;
                        if (dataIndex === undefined || !timestamps[dataIndex]) return [];
                        
                        const timestamp = timestamps[dataIndex];
                        
                        // Find all related data points from same category and related categories
                        const relatedData = getRelatedChartData(config.category, timestamp, config);
                        
                        // Create a map of chart titles we're already showing in this tooltip
                        const visibleTitles = new Set();
                        // Track current chart ID to filter out any data from the same chart
                        const currentChartId = config.id;
                        
                        // For multi-series charts, track all series being shown in the main tooltip
                        tooltipItems.forEach(item => {
                            const dataset = item.dataset;
                            if (dataset && dataset.label) {
                                // For multi-series charts, store both the chart title and the series combo
                                if (data && data.is_multi_series) {
                                    // Use titleKey or title with safe handling of undefined
                                    const configTitle = config.titleKey ? 
                                        (window.i18n ? window.i18n.__(config.titleKey) : config.title || '') : 
                                        (config.title || '');
                                    
                                    // Safely split dataset label
                                    const labelParts = (dataset.label || '').split(':');
                                    const labelText = labelParts.length > 0 ? labelParts[0].trim() : '';
                                    
                                    visibleTitles.add(`${configTitle} (${labelText})`);
                                } else {
                                    // Use titleKey or title with safe handling of undefined
                                    const configTitle = config.titleKey ? 
                                        (window.i18n ? window.i18n.__(config.titleKey) : config.title || '') : 
                                        (config.title || '');
                                        
                                    visibleTitles.add(configTitle);
                                }
                            }
                        });
                        
                        // Filter out values that are already shown in the tooltip
                        // AND filter out any data from the same chart (to avoid duplication)
                        const filteredRelatedData = relatedData.filter(item => 
                            !visibleTitles.has(item.title) && 
                            (!item.chartId || item.chartId !== currentChartId));
                        
                        // Don't show anything if there are no other charts to display
                        if (filteredRelatedData.length === 0) return [];
                        
                        // Group data by category for better organization
                        const dataByCategory = {};
                        
                        // Group related data by category
                        filteredRelatedData.forEach(item => {
                            const category = item.category || 'other';
                            if (!dataByCategory[category]) {
                                dataByCategory[category] = [];
                            }
                            dataByCategory[category].push(item);
                        });
                        
                        // Format lines for tooltip with category headers
                        const lines = [];
                        let isFirstCategory = true;
                        
                        // Add each category section
                        Object.entries(dataByCategory).forEach(([category, items]) => {
                            if (items.length === 0) return;
                            
                            // Add spacing between categories
                            if (!isFirstCategory) {
                                lines.push('');
                            }
                            
                            // Get category translation key
                            const headerKey = category === 'temperature' ? 'temperatures' :
                                              category === 'weather' ? 'weather' :
                                              category === 'structure' ? 'structure' :
                                              category === 'light' ? 'light' :
                                              category === 'system' ? 'system' :
                                              category === 'soil' ? 'soil' : 'otherValues';
                            
                            // Always use translations if available (not just as fallback)
                            let headerText = '— Andre verdier —'; // Default fallback
                            
                            if (window.i18n && typeof window.i18n.__ === 'function') {
                                // Get fresh translation for current language
                                const translated = window.i18n.__(headerKey);
                                headerText = `— ${translated} —`;
                            } else {
                                // Fallback headers if i18n is not available
                                if (category === 'temperature') {
                                    headerText = '— Temperaturer —';
                                } else if (category === 'weather') {
                                    headerText = '— Vær —';
                                } else if (category === 'structure') {
                                    headerText = '— Struktur —';
                                } else if (category === 'light') {
                                    headerText = '— Lys —';
                                } else if (category === 'system') {
                                    headerText = '— System —';
                                } else if (category === 'soil') {
                                    headerText = '— Jord —';
                                }
                            }
                            
                            lines.push('', headerText);
                            
                            // Add each data item
                            items.forEach(item => {
                                // Get chart config to determine formatting
                                const relatedChartId = item.chartId;
                                const relatedChartConfig = relatedChartId ? 
                                    window.chartConfigs.find(c => c.id === relatedChartId) : null;
                                    
                                // Check chart config for integer formatting flag
                                const useIntegerFormat = relatedChartConfig && 
                                    relatedChartConfig.useIntegerFormat === true;
                                
                                // Always use integer formatting if config says so
                                if (useIntegerFormat) {
                                    formattedValue = Math.round(item.value);
                                }
                                // Use default formatting rules for other values
                                else if (Math.abs(item.value) >= 10) {
                                    formattedValue = Math.round(item.value);
                                } else if (Math.abs(item.value) < 1) {
                                    formattedValue = item.value.toFixed(2);
                                } else {
                                    formattedValue = item.value.toFixed(1);
                                }
                                // Use configuration-based formatting
                                if (relatedChartConfig && relatedChartConfig.useIntegerFormat === true) {
                                    // Format as integer if the chart is configured to use integer format
                                    formattedValue = Math.round(item.value);
                                }
                                
                                lines.push(`${item.title}: ${formattedValue} ${item.unit}`);
                            });
                            
                            isFirstCategory = false;
                        });
                        
                        return lines;
                    }
                }
            }
        },
        
        // Custom handler for hover events
        onHover: (event, elements, chart) => {
            if (!elements || !elements.length) return;
            
            const dataIndex = elements[0].index;
            syncTooltips(chart, dataIndex);
        }
    };
    
    // Calculate statistical values for annotations
    // Only do this for non-multi-series charts to avoid visual clutter
    if (!data.is_multi_series && datasets.length === 1 && filteredValues.length > 0) {
        // Calculate statistical values
        const min = Math.min(...filteredValues);
        const max = Math.max(...filteredValues);
        const avg = avgValue;
        
        // Create annotations array
        const annotations = {};
        
        // Add average line annotation - always show this
        annotations.avgLine = {
            type: 'line',
            yMin: avg,
            yMax: avg,
            borderColor: '#888888',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
                enabled: false,
                content: window.i18n ? window.i18n.__('avg') : 'Average',
                position: 'start',
                backgroundColor: 'rgba(136, 136, 136, 0.7)'
            }
        };
        
        // Check if we should show min/max indicators based on config
        const showMax = config.indicateMax === true;
        const showMin = config.indicateMin === true;
        
        if (showMax || showMin) {
            // Find indices where min/max values occur
            const maxIndices = [];
            const minIndices = [];
            
            // Find all occurrences of min and max values
            datasets[0].data.forEach((value, index) => {
                if (showMax && value === max) maxIndices.push(index);
                if (showMin && value === min) minIndices.push(index);
            });
            
            // Add max point annotations if configured
            if (showMax && maxIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMaxIndices = maxIndices.length > 3 ? 
                    [maxIndices[0], maxIndices[Math.floor(maxIndices.length/2)], maxIndices[maxIndices.length-1]] : 
                    maxIndices;
                
                // Create point annotations for each max value
                limitedMaxIndices.forEach((index, i) => {
                    annotations[`maxPoint${i}`] = {
                        type: 'point',
                        xValue: index,
                        yValue: max,
                        backgroundColor: '#ff5252',
                        borderColor: '#ff5252',
                        borderWidth: 2,
                        radius: 5,
                        label: {
                            enabled: false,
                            content: window.i18n ? window.i18n.__('high') : 'Max',
                            position: 'top',
                            backgroundColor: 'rgba(255, 82, 82, 0.7)'
                        }
                    };
                });
            }
            
            // Add min point annotations if configured
            if (showMin && minIndices.length > 0) {
                // Limit to at most 3 markers to avoid clutter
                const limitedMinIndices = minIndices.length > 3 ? 
                    [minIndices[0], minIndices[Math.floor(minIndices.length/2)], minIndices[minIndices.length-1]] : 
                    minIndices;
                
                // Create point annotations for each min value
                limitedMinIndices.forEach((index, i) => {
                    annotations[`minPoint${i}`] = {
                        type: 'point',
                        xValue: index,
                        yValue: min,
                        backgroundColor: '#4caf50',
                        borderColor: '#4caf50',
                        borderWidth: 2,
                        radius: 5,
                        label: {
                            enabled: false,
                            content: window.i18n ? window.i18n.__('low') : 'Min',
                            position: 'bottom',
                            backgroundColor: 'rgba(76, 175, 80, 0.7)'
                        }
                    };
                });
            }
        }
        
        // Add annotations to chart options
        if (!chartOptions.plugins) {
            chartOptions.plugins = {};
        }
        
        // Add or update annotation plugin options
        chartOptions.plugins.annotation = {
            annotations: annotations
        };
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
    if (data.is_multi_series && chartInstances[config.id]) {
        chartInstances[config.id].update('none');
    }
    
    // For temperature charts, ensure they have correct stats labels (L/A/H/N)
    // Check if it's a temperature chart
    if (config.id === 'chart-temp' || config.id === 'chart-temp-diff' || config.id === 'chart-out-temp') {
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
            
            // Fix temperature chart stats if needed
            const chartId = chart.canvas.id;
            if (chartId === 'chart-temp' || chartId === 'chart-temp-diff' || chartId === 'chart-out-temp') {
                if (typeof fixTemperatureChartStats === 'function') {
                    setTimeout(fixTemperatureChartStats, 100);
                }
            }
        }
    });
}

// Load data for all charts
async function loadAllCharts(range = 1, results = 8000) {
    // Initialize chart layout first
    initializeChartLayout();
    
    // Fetch all chart data in parallel
    const dataPromises = window.chartConfigs.map(config => fetchChartData(config, range, results));
    
    // Wait for all data to be fetched
    const allData = await Promise.all(dataPromises);
    
    // Render all charts with their respective data
    window.chartConfigs.forEach((config, index) => {
        createOrUpdateChart(config, allData[index]);
    });
}

// Refresh all charts - expose globally for script.js
window.refreshCharts = function(range, results) {
    // Properly destroy all existing chart instances first
    Object.keys(chartInstances).forEach(id => {
        if (chartInstances[id]) {
            chartInstances[id].destroy();
            chartInstances[id] = null;
        }
    });
    
    // Clear chart instances object
    Object.keys(chartInstances).forEach(key => delete chartInstances[key]);
    
    // Now load all charts with new parameters
    loadAllCharts(range, results);
    
    // Apply the temperature chart stats fix after charts are loaded
    setTimeout(() => {
        if (typeof fixTemperatureChartStats === 'function') {
            fixTemperatureChartStats();
        }
    }, 1000); // Longer delay to ensure charts are fully loaded
}

// Handle date range selection
function setupDateRangeHandlers() {
    const dateChips = document.querySelectorAll('.date-chip');
    
    // Get range and results from URL parameters or use defaults
    let currentRange = getURLParameter('range') || '1'; // Default to 2 days
    let currentResults = parseInt(getURLParameter('results')) || 8000; // Default to 8000 results
    
    // Set active state for current range
    const activeChip = document.querySelector(`.date-chip[data-range="${currentRange}"]`);
    if (activeChip) {
        activeChip.classList.add('active');
    } else {
        // Default to "2d" if no matching chip is found
        const defaultChip = document.querySelector('.date-chip[data-range="1"]');
        if (defaultChip) {
            defaultChip.classList.add('active');
        }
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
            
            // Update URL with new parameters
            const url = new URL(window.location.href);
            url.searchParams.set('range', range);
            
            if (currentResults !== 8000) {
                url.searchParams.set('results', currentResults);
            } else {
                url.searchParams.delete('results');
            }
            
            // Update browser history without reloading
            window.history.replaceState({}, '', url);
            
            // Refresh charts with new range and current results
            window.refreshCharts(currentRange, currentResults);
        });
    });
    
    // Handle results input and update button
    const resultsInput = document.getElementById('resultsInput');
    const updateButton = document.getElementById('updateButton');
    
    if (resultsInput && updateButton) {
        resultsInput.value = currentResults;
        
        updateButton.addEventListener('click', () => {
            const newResults = parseInt(resultsInput.value) || 8000;
            currentResults = newResults;
            
            // Update URL with new parameters
            const url = new URL(window.location.href);
            
            if (newResults !== 8000) {
                url.searchParams.set('results', newResults);
            } else {
                url.searchParams.delete('results');
            }
            
            // Update browser history without reloading
            window.history.replaceState({}, '', url);
            
            // Refresh charts 
            window.refreshCharts(currentRange, currentResults);
        });
        
        // Also update when pressing Enter in the input
        resultsInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const newResults = parseInt(resultsInput.value) || 8000;
                currentResults = newResults;
                
                // Update URL
                const url = new URL(window.location.href);
                if (newResults !== 8000) {
                    url.searchParams.set('results', newResults);
                } else {
                    url.searchParams.delete('results');
                }
                window.history.replaceState({}, '', url);
                
                // Refresh charts
                window.refreshCharts(currentRange, currentResults);
            }
        });
    }
}

// Sort charts by category - only on mobile devices
// Export sort function to global scope for access from event handlers
window.sortChartsByCategory = sortChartsByCategory;

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
    
    // Save references to the chart instances and their canvases
    // to avoid destroying them when we move elements
    const chartData = {};
    charts.forEach(chart => {
        const id = chart.querySelector('canvas').id;
        chartData[id] = {
            instance: window.chartInstances[id],
            canvasId: id
        };
    });
    
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
    
    // Sort charts based on category
    if (category === 'row') {
        // Sort by row number and then by column position
        chartElements.sort((a, b) => {
            if (a.row !== b.row) {
                return a.row - b.row;
            }
            
            // Get gridColumn from either style property or data attribute to be more robust
            // This fixes an issue where style.gridColumn might not be set on mobile
            let aCol = 0;
            let bCol = 0;
            
            // Try to get from config first (most reliable source)
            const aConfig = window.chartConfigs.find(c => c.id === a.id);
            const bConfig = window.chartConfigs.find(c => c.id === b.id);
            
            if (aConfig && aConfig.gridColumn) {
                aCol = parseInt(aConfig.gridColumn.split('/')[0]) || 0;
            } else if (a.element.style.gridColumn) {
                aCol = parseInt(a.element.style.gridColumn.split('/')[0]) || 0;
            }
            
            if (bConfig && bConfig.gridColumn) {
                bCol = parseInt(bConfig.gridColumn.split('/')[0]) || 0;
            } else if (b.element.style.gridColumn) {
                bCol = parseInt(b.element.style.gridColumn.split('/')[0]) || 0;
            }
            
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

/**
 * Special function to fix the temperature chart stats when they're broken
 * This should be called whenever language changes to ensure proper translation
 */
function fixTemperatureChartStats() {
    // These are the charts that should show Low/Avg/High/Now stats instead of series labels
    const temperatureChartIds = ['chart-temp', 'chart-temp-diff', 'chart-out-temp'];
    
    // Process each chart
    temperatureChartIds.forEach(chartId => {
        const statsEl = document.getElementById(`stats-${chartId}`);
        if (!statsEl) {
            return;
        }
        
        // Get translated labels using the preferred translation system (try both for consistency)
        let lowLabel = 'L';
        let avgLabel = 'A';
        let highLabel = 'H';
        let nowLabel = 'N';
        
        let lowFullLabel = 'Low';
        let avgFullLabel = 'Avg';
        let highFullLabel = 'High';
        let nowFullLabel = 'Now';
        
        // First try the new I18n system
        if (window.I18n && typeof window.I18n.translate === 'function') {
            // Get translations using new system
            const lowTranslation = window.I18n.translate('low');
            const avgTranslation = window.I18n.translate('avg');
            const highTranslation = window.I18n.translate('high');
            const nowTranslation = window.I18n.translate('now');
            
            // Set short labels (first letter capitalized)
            lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
            avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
            highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
            nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
            
            // Set full labels for data attributes
            lowFullLabel = lowTranslation || 'Low';
            avgFullLabel = avgTranslation || 'Avg';
            highFullLabel = highTranslation || 'High';
            nowFullLabel = nowTranslation || 'Now';
        } 
        // Fallback to the old i18n system
        else if (window.i18n && typeof window.i18n.__ === 'function') {
            // Get translations using old system
            const lowTranslation = window.i18n.__('low');
            const avgTranslation = window.i18n.__('avg');
            const highTranslation = window.i18n.__('high');
            const nowTranslation = window.i18n.__('now');
            
            // Set short labels
            lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
            avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
            highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
            nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
            
            // Set full labels
            lowFullLabel = lowTranslation || 'Low';
            avgFullLabel = avgTranslation || 'Avg';
            highFullLabel = highTranslation || 'High';
            nowFullLabel = nowTranslation || 'Now';
        }
        
        // Get chart config for unit and formatting
        const config = window.chartConfigs.find(c => c.id === chartId);
        const unit = config && config.unit ? config.unit : '';
        
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
            if (config && config.useIntegerFormat) {
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
                    <span class="chart-stat-label-short">${lowLabel}:</span>
                    <span class="chart-stat-label-low" data-full-label="${lowFullLabel}:"></span>
                </span>${formattedMin}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${avgLabel}:</span>
                    <span class="chart-stat-label-avg" data-full-label="${avgFullLabel}:"></span>
                </span>${formattedAvg}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${highLabel}:</span>
                    <span class="chart-stat-label-high" data-full-label="${highFullLabel}:"></span>
                </span>${formattedMax}${unit}
            </div>
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${nowLabel}:</span>
                    <span class="chart-stat-label-now" data-full-label="${nowFullLabel}:"></span>
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
    
    // Ensure translations are loaded before creating charts
    if (window.i18n && typeof window.i18n.updatePageLanguage === 'function') {
        // Translations already loaded, initialize charts
        loadAllCharts(range, results);
    } else {
        // Wait for translations to be ready
        const checkTranslations = setInterval(() => {
            if (window.i18n && typeof window.i18n.updatePageLanguage === 'function') {
                clearInterval(checkTranslations);
                loadAllCharts(range, results);
            }
        }, 50);
    }
    
    // Add a failsafe for charts disappearing
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
    }, 30000); // Check every 30 seconds
    
    // Set up a function to initialize the sorting that can be called later
    // when we're sure the dropdown exists
    window.initializeSorting = function() {
        const sortSelect = document.getElementById('sortSelect');
        
        if (!sortSelect) {
            // If sort select isn't found, try again after a delay
            setTimeout(window.initializeSorting, 500);
            return;
        }
        
        // Try to restore last used sort preference
        const lastSort = localStorage.getItem('chartSortPreference');
        
        if (lastSort) {
            sortSelect.value = lastSort;
        }
        
        // Remove any existing event listeners
        const newSortSelect = sortSelect.cloneNode(true);
        sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
        
        // Add event listener to the new element
        newSortSelect.addEventListener('change', (event) => {
            const category = event.target.value;
            window.sortChartsByCategory(category);
        });
        
        // Apply the initial sort if we're in mobile mode and a preference exists
        if (window.innerWidth <= 768 && lastSort) {
            setTimeout(() => window.sortChartsByCategory(lastSort), 500);
        }
    };
    
    // Try to initialize sorting immediately
    window.initializeSorting();
    
    // Also set up a MutationObserver to detect when the header might be added
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
    
    // Start observing for header/sortSelect additions
    bodyObserver.observe(document.body, { childList: true, subtree: true });
});