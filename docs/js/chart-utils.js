/**
 * @file chart-utils.js
 * @description Utility functions for chart handling and data processing
 * @module core/chart-utils
 */

/**
 * @namespace ChartUtils
 * @description Utility functions specific to chart operations
 */
window.ChartUtils = window.ChartUtils || {
    /**
     * Synchronizes tooltips across multiple charts based on timestamp
     * @param {Chart} chart - The source chart that triggered the tooltip
     * @param {number} dataIndex - Index of the data point in the source chart
     * @returns {void}
     */
    syncTooltips: function(chart, dataIndex) {
        // Skip if invalid index
        if (dataIndex === null || dataIndex === undefined) return;
        
        // Get the timestamp for the data point from raw data
        const rawData = window.chartRawData?.[chart.canvas.id];
        if (!rawData || !rawData.timestamps || !rawData.timestamps[dataIndex]) return;
        
        const timestamp = rawData.timestamps[dataIndex];
        
        // Make sure we have a Date object
        const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
        
        // Sync tooltips across all charts
        Object.values(window.chartInstances || {}).forEach(otherChart => {
            if (!otherChart || otherChart === chart) return;
            
            // Get raw data for the other chart
            const chartId = otherChart.canvas.id;
            const otherRawData = window.chartRawData?.[chartId];
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
    },
    /**
     * Apply transformations to data values
     * @param {Array<number>} values - Array of numeric values to transform
     * @param {Object} transform - Transformation configuration
     * @returns {Array<number>} Transformed values
     */
    transformValues: function(values, transform) {
        if (!transform) return values;
        
        return values.map(value => {
            if (isNaN(value)) return value;
            
            // Apply shift transformation
            if (transform.shiftBy !== undefined) {
                return value + transform.shiftBy;
            }
            
            return value;
        });
    },
    
    /**
     * Create dataset configuration based on series information
     * @param {Object} series - Series configuration
     * @param {Array<number>} values - Data values for the series
     * @param {string} axis - Y-axis ID for this dataset
     * @param {boolean} hasNegativeValues - Whether data contains negative values
     * @returns {Object} Dataset configuration for Chart.js
     */
    /**
     * Calculate statistics for a dataset
     * @param {Array<number>} values - Array of numeric values
     * @returns {Object} Statistics object with min, max, avg, and hasNegativeValues
     */
    calculateDataStatistics: function(values) {
        const filteredValues = values.filter(v => !isNaN(v));
        
        // Handle empty dataset
        if (filteredValues.length === 0) {
            return {
                minValue: 0,
                maxValue: 0,
                avgValue: 0,
                currentValue: null,
                hasNegativeValues: false
            };
        }
        
        const minValue = Math.min(...filteredValues);
        const maxValue = Math.max(...filteredValues);
        const sum = filteredValues.reduce((acc, val) => acc + val, 0);
        const avgValue = sum / filteredValues.length;
        const currentValue = filteredValues[filteredValues.length - 1];
        const hasNegativeValues = filteredValues.some(v => v < 0);
        
        // Calculate padded values for display
        const range = maxValue - minValue;
        const paddingAmount = range < 0.1 ? (Math.abs(minValue) * 0.05 || 0.1) : range * 0.05;
        const paddedMinValue = hasNegativeValues ? minValue - paddingAmount : Math.max(0, minValue - paddingAmount);
        const paddedMaxValue = maxValue + paddingAmount;
        
        return {
            filteredValues,
            minValue,
            maxValue,
            avgValue,
            currentValue,
            hasNegativeValues,
            range,
            paddedMinValue,
            paddedMaxValue
        };
    },
    
    /**
     * Store chart data in global storage for tooltip syncing
     * @param {string} chartId - ID of the chart
     * @param {Object} config - Chart configuration
     * @param {Array} timestamps - Array of timestamps
     * @param {Array} datasets - Prepared datasets
     * @param {boolean} isMultiSeries - Whether chart has multiple series
     * @param {Object} sourceData - Original source data
     */
    storeChartData: function(chartId, config, timestamps, datasets, isMultiSeries, sourceData) {
        // Ensure the global storage exists
        window.chartRawData = window.chartRawData || {};
        
        if (isMultiSeries) {
            // Store data for each series in multi-series chart
            window.chartRawData[chartId] = {
                timestamps: timestamps,
                series: sourceData.series.map(series => ({
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
            // Store data for single-series chart
            window.chartRawData[chartId] = {
                timestamps: timestamps,
                values: datasets[0].data,
                title: config.title || '',
                titleKey: config.titleKey,
                category: config.category || '',
                color: config.color,
                unit: config.unit || ''
            };
        }
    },
    
    createDatasetConfig: function(config, values, isMultiSeries = false) {
        const hasNegativeValues = values.some(v => v < 0);
        let datasetLabel = '';
        const yAxisID = isMultiSeries ? (config.axis || 'y') : 'y';
        
        // Get dataset label based on config
        if (config.titleKey) {
            datasetLabel = window.I18n.translate(config.titleKey);
        } else if (config.title) {
            datasetLabel = config.title;
        } else if (isMultiSeries) {
            datasetLabel = `Series ${config.index || 0}`;
        }
        
        return {
            label: datasetLabel,
            data: values,
            borderColor: config.color,
            backgroundColor: hasNegativeValues && !isMultiSeries ? 'rgba(0,0,0,0)' : `${config.color}20`,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: isMultiSeries ? false : !hasNegativeValues,
            tension: 0.1,
            yAxisID: yAxisID,
            _titleKey: config.titleKey,
            _originalTitle: config.title
        };
    },
    
    /**
     * Smart time format detection based purely on the data timespan
     * Determines the best time format for displaying time-based charts
     * 
     * @param {Array<string>} timestamps - Array of timestamp strings
     * @param {string} [range] - Optional range parameter for additional context
     * @returns {string} Moment.js format string for time formatting
     */
    determineSmartTimeFormat: function(timestamps, range) {
        // Default to time only format if we can't determine range
        if (!timestamps || timestamps.length < 2) return 'HH:mm';
        
        // Calculate data timespan in milliseconds
        const firstTime = new Date(timestamps[0]);
        const lastTime = new Date(timestamps[timestamps.length - 1]);
        const timespan = lastTime.getTime() - firstTime.getTime();
        const dayInMs = 24 * 60 * 60 * 1000;
        const hourInMs = 60 * 60 * 1000;
        
        // Use different formats based on the timespan
        if (timespan < 2 * hourInMs) {
            // Less than 2 hours - show minutes
            return 'HH:mm';
        } else if (timespan < 2 * dayInMs) {
            // Less than 1 day - show hours
            return 'HH:mm';
        } else if (timespan < 3 * dayInMs) {
            // 1-2 days - show day of week + time
            return 'ddd HH:mm';
        } else if (timespan < 7 * dayInMs) {
            // 2-7 days - show day of week + day of month
            return 'dddd';
        } else if (timespan < 120 * dayInMs) {
            // 7-31 days - show day of month + month
            return 'D/M';
        } else {
            // More than 1 year - show month + year
            return 'MMMM';
        }
    },

    /**
     * Gets data from charts related to the specified category at a specific timestamp
     * Used for enhancing tooltips with data from other related charts
     * 
     * @param {string} category - The category to match charts against
     * @param {string|Date} timestamp - The timestamp to find nearby data points for
     * @param {Object} config - Chart configuration containing related categories
     * @returns {Array} Array of related data points with title, value, unit, color, etc.
     */
    getRelatedChartData: function(category, timestamp, config) {
        // Return early if no timestamp or chart data
        if (!timestamp || !window.chartRawData) return [];
        
        const relatedData = [];
        
        // 1. Determine which categories to include
        const categoriesToInclude = category ? [category] : []; // Always include the main category if specified
        
        // Add related categories if specified in the config
        if (config?.relatedCategories?.length) {
            categoriesToInclude.push(...config.relatedCategories);
        }
        
        // Return early if no categories to include
        if (categoriesToInclude.length === 0) return [];
        
        // 2. Find matching charts and closest data points
        Object.entries(window.chartRawData).forEach(([chartId, rawData]) => {
            // Skip if rawData is invalid
            if (!rawData?.timestamps?.length) return;
            
            // Check if chart's category is one we should include
            if (rawData.category && categoriesToInclude.includes(rawData.category)) {
                // 3. Find closest timestamp
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
                
                // 4. Only include if close enough (5 minutes) and valid index
                const FIVE_MINUTES_MS = 5 * 60 * 1000;
                if (minTimeDiff <= FIVE_MINUTES_MS && closestIndex !== -1) {
                    // Get chart config to get correct unit
                    const chartConfig = window.chartConfigs.find(c => c.id === chartId);
                    
                    // Unit must come from chart configuration
                    if (!chartConfig?.unit) {
                        console.error(`Configuration error: Missing unit for chart ${chartId}. Add 'unit' property to chart config.`);
                    }
                    const unit = chartConfig?.unit || '';
                    
                    // 5. Handle both multi-series and single-series charts
                    if (rawData.is_multi_series && rawData.series?.length) {
                        // Add each series in the multi-series chart
                        rawData.series.forEach(series => {
                            if (!series?.values || closestIndex >= series.values.length) return;
                            
                            // Get series title from translation or data
                            const configTitle = chartConfig?.titleKey 
                                ? window.I18n.translate(chartConfig.titleKey)
                                : (rawData.title || chartId);
                                
                            const seriesTitle = series.title || '';
                            const title = `${configTitle} (${seriesTitle})`;
                            
                            relatedData.push({
                                title,
                                value: series.values[closestIndex],
                                unit,
                                color: series.color || '#666',
                                category: rawData.category, // Store the category for grouping
                                chartId // Store the chart ID for filtering duplicates
                            });
                        });
                    } else {
                        // Single series chart
                        if (!rawData.values || closestIndex >= rawData.values.length) return;
                        
                        // Get chart title from translations if possible
                        const title = chartConfig?.titleKey
                            ? window.I18n.translate(chartConfig.titleKey)
                            : (rawData.title || chartId);
                        
                        relatedData.push({
                            title,
                            value: rawData.values[closestIndex],
                            unit,
                            color: rawData.color || '#666',
                            category: rawData.category,
                            chartId
                        });
                    }
                }
            }
        });
        
        return relatedData;
    },
    
    /**
     * Format a number based on chart configuration and data range
     * @param {number} val - Value to format
     * @param {Object} config - Chart configuration
     * @param {number} range - Data range for determining format precision
     * @returns {string} Formatted number
     */
    formatNumber: function(val, config, range) {
        // Return placeholder for null, undefined, or NaN
        if (val === null || val === undefined || isNaN(val)) return '—';
        
        // Get formatting configuration
        const formatting = config?.formatting || {};
        
        // 1. If decimal places are explicitly specified, use that
        if (formatting.decimalPlaces !== undefined) {
            return val.toFixed(formatting.decimalPlaces);
        }
        
        // 2. Check for integer formatting preference
        const useInteger = formatting.useIntegerFormat ?? config?.useIntegerFormat;
        
        // 3. Apply the appropriate formatting
        if (useInteger || range >= 10) {
            return Math.round(val).toString();   // Integer format
        } else if (range < 1 || Math.abs(val) < 1) {
            return val.toFixed(2);               // Two decimal places for small values
        } else if (Math.abs(val) < 10) {
            return val.toFixed(1);               // One decimal place for medium values
        } else {
            return Math.round(val).toString();   // Integer for larger values
        }
    },
    
    /**
     * Creates tooltip configuration for charts
     * @param {Object} config - Chart configuration 
     * @param {Object} data - Chart data
     * @param {Array} timestamps - Array of timestamp values
     * @returns {Object} - Tooltip configuration object
     */
    createTooltipConfig: function(config, data, timestamps) {
        // Get translated text
        const getTranslatedText = (key) => window.I18n.translate(key);
            
        return {
            mode: 'index',
            intersect: false,
            titleFont: { size: 11 },
            bodyFont: { size: 11 },
            padding: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            callbacks: {
                // 1. Title formatter - shows formatted date/time
                title: (tooltipItems) => {
                    if (!tooltipItems || tooltipItems.length === 0) return '';
                    
                    const item = tooltipItems[0];
                    // Get the real timestamp from our stored raw data
                    const dataIndex = item.dataIndex;
                    const chartId = item.chart.canvas.id;
                    
                    let timestamp;
                    
                    // Try to get the timestamp from raw data store
                    if (window.chartRawData && 
                        window.chartRawData[chartId] && 
                        window.chartRawData[chartId].timestamps && 
                        dataIndex !== undefined && 
                        dataIndex < window.chartRawData[chartId].timestamps.length) {
                        
                        timestamp = window.chartRawData[chartId].timestamps[dataIndex];
                    } else {
                        // Fallback to using the label value (which might be already formatted)
                        // and try to parse it back to a date object
                        const labelValue = item.label;
                        try {
                            timestamp = moment(labelValue, 'DD MMM YYYY, HH:mm').toDate();
                        } catch (e) {
                            // If parsing fails, just use the label as-is
                            return labelValue;
                        }
                    }
                    
                    // Ensure correct locale is set
                    if (window.moment && window.I18n) {
                        const lang = window.I18n.getCurrentLanguage();
                        const momentLocale = lang === 'no' ? 'nb' : lang;
                        window.moment.locale(momentLocale);
                    }
                    
                    // Get the chart's time format from global storage
                    let timeFormat = 'ddd DD MMM YYYY, HH:mm'; // Default full format
                    
                    if (window.chartTimeFormats && window.chartTimeFormats[chartId]) {
                        // Use the same format as the chart's x-axis
                        timeFormat = window.chartTimeFormats[chartId];
                        
                        // For very short timeformats, add additional context
                        if (timeFormat === 'HH:mm') {
                            // For time-only formats, add the date for context in tooltip
                            return moment(timestamp).format('HH:mm') + ' (' + moment(timestamp).format('D MMM') + ')';
                        } else if (timeFormat === 'ddd HH:mm') {
                            // For day+time formats, add the full date for context
                            return moment(timestamp).format('ddd HH:mm') + ' (' + moment(timestamp).format('D MMM YYYY') + ')';
                        } else if (timeFormat === 'dddd') {
                            // For day name formats, add the date for context
                            return moment(timestamp).format('dddd') + ' (' + moment(timestamp).format('D MMM') + ')';
                        } else if (timeFormat === 'D/M') {
                            // For day/month format, add the year and time
                            return moment(timestamp).format('D/M') + ' (' + moment(timestamp).format('YYYY, HH:mm') + ')';
                        } else if (timeFormat === 'MMMM') {
                            // For month only format, add the year
                            return moment(timestamp).format('MMMM YYYY');
                        }
                    } else {
                        // Fallback to smart detection
                        timeFormat = this.determineSmartTimeFormat([timestamp]);
                    }
                    
                    // Use the determined format
                    return moment(timestamp).format(timeFormat);
                },
                
                // 2. Label formatter - shows dataset value with unit
                label: (tooltipItem) => {
                    const datasetLabel = tooltipItem.dataset.label || '';
                    const value = tooltipItem.raw;
                    
                    // Format value based on configuration
                    let formattedValue = tooltipItem.formattedValue;
                    if (config.useIntegerFormat === true) {
                        formattedValue = Math.round(value);
                    }
                    
                    // Add unit from configuration
                    const displayUnit = config.unit || '';
                    
                    // Check if this is a min or max point we should highlight
                    const indicators = config.indicators || {};
                    const showMax = indicators.showMax ?? false; // Default to false if not specified
                    const showMin = indicators.showMin ?? false; // Default to false if not specified
                    
                    // Get dataset min/max values to compare
                    let isMinPoint = false;
                    let isMaxPoint = false;
                    
                    if (tooltipItem.dataset.data?.length > 0) {
                        const validValues = tooltipItem.dataset.data.filter(v => v !== null && v !== undefined && !isNaN(v));
                        if (validValues.length > 0) {
                            const minValue = Math.min(...validValues);
                            const maxValue = Math.max(...validValues);
                            
                            isMinPoint = showMin && (value === minValue);
                            isMaxPoint = showMax && (value === maxValue);
                        }
                    }
                    
                    // Highlight min/max points 
                    if (isMaxPoint) {
                        return `${datasetLabel}: ${formattedValue}${displayUnit} 🔼`; // Green upward triangle
                    } else if (isMinPoint) {
                        return `${datasetLabel}: ${formattedValue}${displayUnit} 🔽`; // Blue downward triangle
                    } else {
                        return `${datasetLabel}: ${formattedValue}${displayUnit}`;
                    }
                },
                
                // 3. AfterBody formatter - shows related chart data
                afterBody: (tooltipItems) => {
                    if (!tooltipItems.length) return [];
                    
                    // Get timestamp for this tooltip
                    const dataIndex = tooltipItems[0].dataIndex;
                    if (dataIndex === undefined || !timestamps[dataIndex]) return [];
                    
                    const timestamp = timestamps[dataIndex];
                    
                    // 3.1 Get related data points from other charts
                    const relatedData = this.getRelatedChartData(config.category, timestamp, config);
                    
                    // 3.2 Determine which titles are already shown in this tooltip
                    const visibleTitles = new Set();
                    const currentChartId = config.id;
                    
                    // For multi-series charts, track series titles separately
                    tooltipItems.forEach(item => {
                        const dataset = item.dataset;
                        if (!dataset?.label) return;
                        
                        if (data?.is_multi_series) {
                            // For multi-series, format as "Chart Title (Series Name)"
                            const configTitle = config.titleKey
                                ? getTranslatedText(config.titleKey, config.title || '')
                                : (config.title || '');
                                
                            const labelParts = (dataset.label || '').split(':');
                            const labelText = labelParts[0]?.trim() || '';
                            
                            visibleTitles.add(`${configTitle} (${labelText})`);
                        } else {
                            // For single series, just use chart title
                            const configTitle = config.titleKey
                                ? getTranslatedText(config.titleKey, config.title || '')
                                : (config.title || '');
                                
                            visibleTitles.add(configTitle);
                        }
                    });
                    
                    // 3.3 Filter out data we're already showing
                    const filteredRelatedData = relatedData.filter(item => 
                        !visibleTitles.has(item.title) && 
                        (!item.chartId || item.chartId !== currentChartId));
                    
                    if (filteredRelatedData.length === 0) return [];
                    
                    // 3.4 Group data by category for better organization
                    const dataByCategory = {};
                    filteredRelatedData.forEach(item => {
                        const category = item.category || 'other';
                        if (!dataByCategory[category]) {
                            dataByCategory[category] = [];
                        }
                        dataByCategory[category].push(item);
                    });
                    
                    // 3.5 Format tooltip lines with category headers
                    const lines = [];
                    let isFirstCategory = true;
                    
                    Object.entries(dataByCategory).forEach(([category, items]) => {
                        if (items.length === 0) return;
                        
                        // Add spacing between categories
                        if (!isFirstCategory) {
                            lines.push('');
                        }
                        
                        // 3.5.1 Get category header text
                        let headerKey = 'otherValues'; // Default fallback
                        
                        // Try to find the category header key from configs
                        const chartsInCategory = window.chartConfigs.filter(c => c.category === category);
                        const chartWithHeaderKey = chartsInCategory.find(c => c.categoryHeaderKey);
                        
                        if (chartWithHeaderKey?.categoryHeaderKey) {
                            headerKey = chartWithHeaderKey.categoryHeaderKey;
                        } else {
                            console.error(`Configuration error: Missing categoryHeaderKey for category "${category}".`);
                        }
                        
                        // 3.5.2 Translate or use fallback header
                        let headerText = '— Andre verdier —'; // Default fallback
                        
                        if (window.I18n?.translate) {
                            const translated = window.I18n.translate(headerKey);
                            headerText = `— ${translated} —`;
                        } else {
                            // Fallback category headers when translation not available
                            const categoryHeaders = {
                                'temperature': '— Temperaturer —',
                                'weather': '— Vær —',
                                'structure': '— Struktur —',
                                'light': '— Lys —',
                                'system': '— System —',
                                'soil': '— Jord —'
                            };
                            
                            headerText = categoryHeaders[category] || headerText;
                        }
                        
                        lines.push('', headerText);
                        
                        // 3.5.3 Add each data item with formatted value
                        items.forEach(item => {
                            // Get chart config to determine formatting
                            const relatedChartConfig = item.chartId ? 
                                window.chartConfigs.find(c => c.id === item.chartId) : null;
                                
                            // Format value according to configuration and magnitude
                            let formattedValue;
                            
                            // Use integer format if configured
                            if (relatedChartConfig?.useIntegerFormat === true) {
                                formattedValue = Math.round(item.value);
                            }
                            // Otherwise format based on magnitude
                            else if (Math.abs(item.value) >= 10) {
                                formattedValue = Math.round(item.value);
                            } else if (Math.abs(item.value) < 1) {
                                formattedValue = item.value.toFixed(2);
                            } else {
                                formattedValue = item.value.toFixed(1);
                            }
                            
                            lines.push(`${item.title}: ${formattedValue} ${item.unit}`);
                        });
                        
                        isFirstCategory = false;
                    });
                    
                    return lines;
                }
            }
        };
    },
    
    /**
     * Create annotations for statistical indicators (avg line, min/max points)
     * @param {Object} config - Chart configuration
     * @param {Object} stats - Statistics object with min, max, avg values
     * @param {Object} chartData - The chart data object
     * @returns {Object} Annotations configuration object
     */
    createStatisticalAnnotations: function(config, stats, chartData) {
        const { minValue, maxValue, avgValue } = stats;
        const annotations = {};
        
        // Helper to get translated text
        const getTranslatedText = (key) => window.I18n.translate(key);
        
        // 1. Create average line annotation
        annotations.avgLine = {
            type: 'line',
            yMin: avgValue,
            yMax: avgValue,
            borderColor: '#888888',
            borderWidth: 1,
            borderDash: [5, 5],
            label: {
                enabled: false,
                content: getTranslatedText('avg'),
                position: 'start',
                backgroundColor: 'rgba(136, 136, 136, 0.7)'
            }
        };
        
        // 2. Determine which indicators to show
        const indicators = config.indicators || {};
        const showMax = indicators.showMax ?? false; // Default to false if not specified
        const showMin = indicators.showMin ?? false; // Default to false if not specified
        
        if (!showMax && !showMin) return annotations;
        
        // 3. Get indicator colors from configuration or use defaults
        const indicatorColors = indicators.colors || {};
        const maxColor = indicatorColors.max || '#4caf50'; // Default green for max
        const minColor = indicatorColors.min || '#1e88e5'; // Default blue for min
        
        // 4. Find indices of min/max values
        if (!chartData?.datasets?.[0]?.data) return annotations;
        
        const maxIndices = [];
        const minIndices = [];
        
        chartData.datasets[0].data.forEach((value, index) => {
            if (showMax && value === maxValue) maxIndices.push(index);
            if (showMin && value === minValue) minIndices.push(index);
        });
        
        // 5. Create max point annotations (limited to 3 to avoid clutter)
        if (showMax && maxIndices.length > 0) {
            const indicesToUse = maxIndices.length > 3
                ? [maxIndices[0], maxIndices[Math.floor(maxIndices.length/2)], maxIndices[maxIndices.length-1]]
                : maxIndices;
            
            indicesToUse.forEach((index, i) => {
                annotations[`maxPoint${i}`] = {
                    type: 'point',
                    xValue: index,
                    yValue: maxValue,
                    backgroundColor: '#4caf50', // Green upward triangle
                    borderColor: '#4caf50',
                    borderWidth: 2,
                    radius: 5,
                    pointStyle: 'triangle',
                    rotation: 0, // Point upward
                    label: {
                        enabled: false,
                        content: getTranslatedText('high'),
                        position: 'top',
                        backgroundColor: 'rgba(76, 175, 80, 0.7)' // Green background
                    }
                };
            });
        }
        
        // 6. Create min point annotations (limited to 3 to avoid clutter)
        if (showMin && minIndices.length > 0) {
            const indicesToUse = minIndices.length > 3
                ? [minIndices[0], minIndices[Math.floor(minIndices.length/2)], minIndices[minIndices.length-1]]
                : minIndices;
            
            indicesToUse.forEach((index, i) => {
                annotations[`minPoint${i}`] = {
                    type: 'point',
                    xValue: index,
                    yValue: minValue,
                    backgroundColor: '#1e88e5', // Blue downward triangle
                    borderColor: '#1e88e5',
                    borderWidth: 2,
                    radius: 5,
                    pointStyle: 'triangle',
                    rotation: 180, // Point downward
                    label: {
                        enabled: false,
                        content: getTranslatedText('low'),
                        position: 'bottom',
                        backgroundColor: 'rgba(30, 136, 229, 0.7)' // Blue background
                    }
                };
            });
        }
        
        return annotations;
    },
    
    /**
     * Filter out statistical datasets and annotations, keeping only active data
     * @param {Chart} chart - The Chart.js instance
     * @returns {Array} Array of active datasets
     */
    getActiveDatasets: function(chart) {
        if (!chart?.data?.datasets) return [];
        
        return chart.data.datasets.filter(dataset => {
            if (!dataset?.data) return false;
            
            // Check if dataset has valid data points (not all null/undefined)
            const hasValidData = dataset.data.some(v => v !== null && v !== undefined);
            if (!hasValidData) return false;
            
            // Skip statistical datasets (averages, min/max lines, etc)
            if (dataset.label) {
                const statKeywords = ['Average', 'Avg', 'Min', 'Max', 'Low', 'High'];
                if (statKeywords.some(keyword => dataset.label.includes(keyword))) {
                    return false;
                }
            }
            
            // Skip datasets with all identical values (likely avg/reference lines)
            const uniqueValues = new Set(dataset.data.filter(v => v !== null && v !== undefined));
            if (dataset.data.length > 1 && uniqueValues.size === 1) {
                return false;
            }
            
            return true;
        });
    },
    
    /**
     * Calculate min, max, avg, and current values from datasets
     * @param {Array} datasets - Array of datasets to calculate stats for
     * @returns {Object} Statistics object
     */
    calculateStats: function(datasets) {
        // Default values in case there's no valid data
        const stats = {
            minValue: 0,
            maxValue: 0,
            avgValue: 0,
            currentValue: null
        };
        
        if (!datasets?.length) return stats;
        
        // Collect all valid values and track totals
        let totalValues = 0;
        let totalCount = 0;
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        // Process each dataset
        datasets.forEach(dataset => {
            if (!dataset?.data?.length) return;
            
            // Filter out invalid values
            const validValues = dataset.data.filter(v => 
                v !== null && v !== undefined && !isNaN(v)
            );
            
            if (!validValues.length) return;
            
            // Update min, max, and totals
            minValue = Math.min(minValue, Math.min(...validValues));
            maxValue = Math.max(maxValue, Math.max(...validValues));
            totalValues += validValues.reduce((sum, v) => sum + v, 0);
            totalCount += validValues.length;
        });
        
        // Calculate average if we have any values
        if (totalCount > 0) {
            stats.avgValue = totalValues / totalCount;
            stats.minValue = minValue;
            stats.maxValue = maxValue;
        }
        
        // Get current value from the first dataset
        if (datasets[0]?.data?.length) {
            stats.currentValue = datasets[0].data[datasets[0].data.length - 1];
        }
        
        return stats;
    }
};

// ChartUtils is now defined directly as a global object
