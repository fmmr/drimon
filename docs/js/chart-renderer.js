/**
 * Unified Chart Renderer - One function to handle all chart types
 * Works with any chart configuration from chart-config.js
 */

// Global chart instances storage for compatibility
window.chartInstances = window.chartInstances || {};

window.UnifiedChartRenderer = {
    /**
     * Add a chart based on configuration and ThingSpeak data
     * @param {Object} config - Chart configuration from chart-config.js
     * @param {Object} data - ThingSpeak data (single or multi-series)
     * @returns {Chart|null} Chart instance or null if failed
     */
    addChart: function(config, data) {
        // Check if Chart.js loaded
        if (!window.Chart) {
            console.error('Chart.js not loaded - charts unavailable');
            return null;
        }
        
        const canvas = document.getElementById(config.id);
        if (!canvas) {
            console.error(`Canvas not found: ${config.id}`);
            return null;
        }

        // Check if chart already exists - if so, update it instead of recreating
        const existingChart = window.chartInstances[config.id];
        if (existingChart && data && data.feeds && data.feeds.length > 0) {
            return this.updateChart(config, data, existingChart);
        }

        // Handle loading state
        const loadingEl = document.getElementById(`loading-${config.id}`);
        
        // Check for no data
        if (!data || !data.feeds || data.feeds.length === 0) {
            if (loadingEl) {
                const noDataText = window.I18n?.translate('noData') || 'No data';
                loadingEl.innerHTML = `<div>${noDataText}</div>`;
                loadingEl.style.display = 'block';
            }
            return null;
        }
        
        // Hide loading indicator when data is available
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }

        // Config is already fully processed by mergeChartConfig() in chart-config.js
        // Only destroy if we're creating a new chart (not updating existing)
        const existingChartJs = window.Chart.getChart(canvas);
        if (existingChartJs && !existingChart) {
            existingChartJs.destroy();
        }
        
        // Convert ThingSpeak data to Chart.js datasets and calculate time formatting
        const { datasets, stats, timeFormat, timestamps } = this._createDatasets(config, data);
        
        if (datasets.length === 0) {
            console.warn(`No data for chart: ${config.id}`);
            return null;
        }

        // Store the calculated time format for global access (config is read-only)
        window.chartTimeFormats = window.chartTimeFormats || {};
        window.chartTimeFormats[config.id] = timeFormat;

        // Store chart data for tooltip access
        this._storeChartData(config, timestamps, datasets, data);

        // Handle minimal minimum: set min to nearest integer below actual minimum
        if (config.yAxis && config.yAxis.useMinimalMinimum && config.yAxis.min === undefined) {
            // Find the actual minimum value across all datasets
            let actualMin = Infinity;
            datasets.forEach(dataset => {
                dataset.data.forEach(point => {
                    if (point.y < actualMin) {
                        actualMin = point.y;
                    }
                });
            });
            
            if (actualMin < 0) {
                // Set min to the nearest integer below the actual minimum
                const minimalMin = Math.floor(actualMin);
                config = { ...config, yAxis: { ...config.yAxis, min: minimalMin } };
            }
        }

        // Create chart data (no timestamps needed since we use {x, y} format)
        const chartData = this._createChartData(datasets, config);

        // Create chart options
        const options = this._createChartOptions(config);

        if (config.showIndicators) {
            this._addIndicators(options, stats, config.indicators, config);
        }

        // Destroy existing chart if it exists
        if (window.chartInstances[config.id]) {
            window.chartInstances[config.id].destroy();
        }

        // Create the chart
        const chart = new Chart(canvas, {
            type: 'line',
            data: chartData,
            options
        });

        // Store in global chartInstances for compatibility
        window.chartInstances[config.id] = chart;

        // Update statistics
        this._updateStats(config, stats, config.isMultiSeries);

        // Set up language change listener for legend updates
        if (config.isMultiSeries) {
            this._setupLanguageListener(chart, config);
        }

        return chart;
    },

    /**
     * Update existing chart with new data without recreating it
     * @param {Object} config - Chart configuration
     * @param {Object} data - New ThingSpeak data
     * @param {Chart} chart - Existing Chart.js instance
     * @returns {Chart} Updated chart instance
     */
    updateChart: function(config, data, chart) {
        // Convert new data to datasets
        const { datasets, stats, timeFormat, timestamps } = this._createDatasets(config, data);
        
        if (datasets.length === 0) {
            console.warn(`No data for chart update: ${config.id}`);
            return chart;
        }

        // Update chart data
        chart.data.datasets = datasets;
        
        // Update with smooth animation
        chart.update();
        
        // Store updated chart data for tooltip access
        this._storeChartData(config, timestamps, datasets, data);
        
        // Update statistics
        this._updateStats(config, stats, config.isMultiSeries);
        
        return chart;
    },

    /**
     * Convert ThingSpeak data to Chart.js datasets
     * @private
     */
    _createDatasets: function(config, data) {
        const datasets = [];
        let allValues = [];
        let currentValue = null;
        let timestamps = [];
        
        const dataSource = data.is_multi_series ? data.series : [data];
        
        // All charts now use {x, y} format which works for both synchronized and independent timestamps
        // Extract timestamps from first data source for time formatting purposes
        if (dataSource[0] && dataSource[0].feeds) {
            timestamps = dataSource[0].feeds.map(feed => feed.created_at);
        }
        
        // Calculate time format based on timestamps
        let timeFormat = 'HH:mm'; // Default fallback
        if (timestamps.length > 0) {
            timeFormat = this._determineSmartTimeFormat(timestamps);
        }

        // Process each series using unified logic
        config.series.forEach((seriesConfig, index) => {
            const seriesData = dataSource[index] || dataSource[0]; // Fallback to first data for single-series
            
            if (!seriesData || !seriesData.feeds) return;

            // All charts use {x, y} format for proper time scaling
            const dataPoints = seriesData.feeds.map(feed => {
                let value = parseFloat(feed[`field${seriesConfig.field}`]);
                
                // Apply data transformation if configured
                if (config.hasDataTransform) {
                    value += config.shiftByValue;
                }
                
                return {
                    x: feed.created_at, // Let Chart.js handle the date parsing
                    y: value
                };
            }).filter(point => !isNaN(point.y) && point.y !== null)
              .sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());

            if (dataPoints.length > 0) {
                const values = dataPoints.map(p => p.y);
                allValues = allValues.concat(values);

                // Use the last value from the first series as current
                if (index === 0 && currentValue === null) {
                    currentValue = values[values.length - 1];
                }

                const color = seriesConfig.color;
                datasets.push({
                    label: this._getSeriesLabel(seriesConfig, index),
                    data: dataPoints,
                    borderColor: color,
                    backgroundColor: color + '20',
                    borderWidth: 2,
                    borderDash: [],  // Ensure solid lines (no dashing)
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: config.hasFill,
                    tension: 0.1,
                    spanGaps: true,  // Draw lines across missing data points
                    yAxisID: seriesConfig.axis || 'y'
                });
            }
        });

        // Calculate stats from all values
        const stats = allValues.length > 0 ? {
            min: Math.min(...allValues),
            max: Math.max(...allValues),
            avg: allValues.reduce((a, b) => a + b, 0) / allValues.length,
            current: currentValue,
            count: allValues.length
        } : {
            min: 0,
            max: 0, 
            avg: 0,
            current: null,
            count: 0
        };
        
        return { datasets, stats, timeFormat, timestamps };
    },


    /**
     * Store chart data for tooltip access
     * @private
     */
    _storeChartData: function(config, timestamps, datasets, data) {
        // Initialize global storage if needed
        window.chartRawData = window.chartRawData || {};
        
        // Store chart data for tooltip access
        window.chartRawData[config.id] = {
            timestamps: timestamps,
            datasets: datasets,  // Keep {x, y} format
            config: config,
            data: data,
            isMultiSeries: data.is_multi_series
        };
    },

    /**
     * Create chart data structure with proper labels
     * @private
     */
    _createChartData: function(datasets, config) {
        // All charts now use time scale with {x, y} data - no labels needed
        return { datasets };
    },

    /**
     * Create X-axis configuration using range-driven logic
     * @private
     */
    _createXAxisConfig: function(config) {
        // Get range from URL params and resolve to effective range for this chart
        const urlParams = new URLSearchParams(window.location.search);
        const urlRange = urlParams.get('range') || 'default';
        const range = urlRange === 'default' ? config.defaultRange : urlRange;
        
        // Determine time configuration based on range intent first
        let timeConfig, tickConfig;
        
        if (range) {
            switch (range) {
                case 'today':
                case 'yesterday':
                    timeConfig = {
                        unit: 'hour',
                        displayFormats: { hour: 'HH:mm' }
                    };
                    tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 8 : 6 };
                    break;

                case 'this-week':
                    timeConfig = {
                        unit: 'hour',
                        displayFormats: { hour: 'HH:mm' }
                    };
                    tickConfig = {
                        maxTicksLimit: window.innerWidth <= 768 ? 8 : 6,
                        callback: function(value, index, ticks) {
                            const date = new Date(value);
                            if (window.moment) {
                                const dayShort = window.moment(date).format('ddd').substring(0, 2);
                                const time = window.moment(date).format('HH:mm');
                                return `${dayShort} ${time}`;
                            }
                            return new Date(value).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
                        }
                    };
                    break;
                    
                case 'last-week':
                case 'this-month':
                case 'last-month':
                    timeConfig = {
                        unit: 'day',
                        displayFormats: { day: 'D/M' }
                    };
                    tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 7 : 6 };
                    break;
                    
                case 'start':
                    timeConfig = {
                        unit: 'month',
                        displayFormats: { month: 'MMMM' }
                    };
                    tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 4 : 6 };
                    break;
                    
                default:
                    // Handle numeric ranges (days)
                    const numericRange = parseInt(range);
                    if (!isNaN(numericRange)) {
                        if (numericRange <= 1) {
                            timeConfig = {
                                unit: 'hour',
                                displayFormats: { hour: 'HH:mm' }
                            };
                            tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 8 : 6 };
                        } else if (numericRange <= 2) {
                            timeConfig = {
                                unit: 'hour',
                                displayFormats: { hour: 'HH:mm' }
                            };
                            tickConfig = {
                                maxTicksLimit: window.innerWidth <= 768 ? 8 : 6,
                                callback: function(value, index, ticks) {
                                    const date = new Date(value);
                                    if (window.moment) {
                                        const dayShort = window.moment(date).format('ddd').substring(0, 2);
                                        const time = window.moment(date).format('HH:mm');
                                        return `${dayShort} ${time}`;
                                    }
                                    return new Date(value).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
                                }
                            };
                        } else if (numericRange <= 7) {
                            timeConfig = {
                                unit: 'day',
                                displayFormats: { day: 'dddd' }
                            };
                            tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 4 : 3 };
                        } else if (numericRange <= 120) {
                            timeConfig = {
                                unit: 'day',
                                displayFormats: { day: 'D/M' }
                            };
                            tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 7 : 6 };
                        } else {
                            timeConfig = {
                                unit: 'month',
                                displayFormats: { month: 'MMMM' }
                            };
                            tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 4 : 6 };
                        }
                    } else {
                        // Fallback for unknown string ranges
                        timeConfig = {
                            unit: 'day',
                            displayFormats: { day: 'D/M' }
                        };
                        tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 7 : 6 };
                    }
            }
        } else {
            // No range parameter - use fallback
            timeConfig = {
                unit: 'hour',
                displayFormats: { hour: 'HH:mm' }
            };
            tickConfig = { maxTicksLimit: window.innerWidth <= 768 ? 8 : 6 };
        }

        return {
            type: 'time',
            time: timeConfig,
            grid: { display: false },
            ticks: {
                maxRotation: 0,
                autoSkip: true,
                font: { size: 9 },
                ...tickConfig
            },
            border: { display: false }
        };
    },

    /**
     * Create Chart.js options
     * @private
     */
    _createChartOptions: function(config) {

        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: this._createXAxisConfig(config),
                y: this._createYAxisConfig(config),
                // Add second Y axis if configured
                ...(config.hasSecondYAxis && {
                    y1: {
                        position: 'left',
                        grid: { display: false },
                        ticks: { 
                            font: { size: 9 },
                            maxTicksLimit: 5,
                            callback: function(value) {
                                if (value >= 1000) {
                                    return (value / 1000) + 'k';
                                }
                                return value;
                            }
                        }
                    }
                })
            },
            plugins: {
                legend: {
                    display: config.isMultiSeries,
                    position: 'top',
                    labels: {
                        boxWidth: 15,
                        boxHeight: 0,
                        lineWidth: 2,
                        font: { size: 9, weight: 'normal' },
                        usePointStyle: false,
                        padding: 8,
                        generateLabels: (chart) => {
                            return this._generateLegendLabelsWithValues(chart, config);
                        }
                    }
                },
                tooltip: this._createTooltipConfig(config)
            }
        };
    },

    /**
     * Create tooltip configuration
     * @private
     */
    _createTooltipConfig: function(config) {
        return {
            mode: config.tooltipMode,
            intersect: false,
            callbacks: {
                title: (context) => {
                    if (context && context[0] && context[0].parsed && context[0].parsed.x) {
                        return this._formatTooltipTime(context[0].parsed.x, config.id);
                    }
                    return 'Invalid date';
                },
                label: (context) => {
                    const seriesName = context.dataset.label || 'Unknown';
                    const value = context.parsed.y;
                    const unit = config.unit || '';
                    const formattedValue = this._formatValue(value, config);
                    if (value !== null && !isNaN(value)) {
                        return `${seriesName}: ${formattedValue} ${unit}`;
                    }
                    return `${seriesName}: No data`;
                },
                afterBody: (context) => {
                    // Add linked tooltip showing related category data
                    if (config.category && config.categoryHeaderKey) {
                        return this._getLinkedTooltipData(context[0], config);
                    }
                    return [];
                }
            }
        };
    },


    /**
     * Get linked tooltip data for charts in the same category
     * @private
     */
    _getLinkedTooltipData: function(context, currentConfig) {
        if (!context || !context.parsed || !currentConfig.category) {
            return [];
        }

        const timestamp = context.parsed.x;
        const result = [];
        
        // Find all charts with the same category (all charts now use unified renderer)
        const relatedCharts = window.chartConfigs?.filter(chart => 
            chart.category === currentConfig.category && 
            chart.id !== currentConfig.id
        ) || [];

        // Only add category header if there are actually related charts
        if (relatedCharts.length > 0 && currentConfig.categoryHeaderKey && window.I18n) {
            const categoryHeader = window.I18n.translate(currentConfig.categoryHeaderKey);
            if (categoryHeader !== currentConfig.categoryHeaderKey) {
                result.push(''); // Empty line for spacing
                result.push(`— ${categoryHeader} —`);
            }
        }

        // Get values from related charts at the same timestamp
        relatedCharts.forEach(chartConfig => {
            const chartData = window.chartRawData?.[chartConfig.id];
            
            if (!chartData || !chartData.timestamps || !chartData.datasets) {
                return;
            }

            // Find closest timestamp index
            const closestIndex = this._findClosestTimestampIndex(chartData.timestamps, timestamp);
            
            if (closestIndex === -1) {
                return;
            }

            // Get chart title (translated if possible)
            let chartTitle = chartConfig.title || chartConfig.id;
            if (chartConfig.titleKey && window.I18n) {
                const translated = window.I18n.translate(chartConfig.titleKey);
                if (translated !== chartConfig.titleKey) {
                    chartTitle = translated;
                }
            }

            // Get value from unified format datasets
            if (chartData.datasets[0] && chartData.datasets[0].data) {
                const dataPoint = chartData.datasets[0].data[closestIndex];
                const value = dataPoint && typeof dataPoint === 'object' ? dataPoint.y : dataPoint;
                
                if (value !== null && value !== undefined && !isNaN(value)) {
                    const formattedValue = this._formatValue(value, chartConfig);
                    const unit = chartConfig.unit || '';
                    const line = `${chartTitle}: ${formattedValue} ${unit}`;
                    result.push(line);
                }
            }
        });

        return result;
    },

    /**
     * Find the closest timestamp index for tooltip linking
     * @private
     */
    _findClosestTimestampIndex: function(timestamps, targetTimestamp) {
        if (!timestamps || timestamps.length === 0) {
            return -1;
        }

        let closestIndex = 0;
        let minDiff = Math.abs(new Date(timestamps[0]).getTime() - targetTimestamp);

        for (let i = 1; i < timestamps.length; i++) {
            const diff = Math.abs(new Date(timestamps[i]).getTime() - targetTimestamp);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        // Only return match if within 6 hours (6 * 60 * 60 * 1000 ms)
        const maxDiffMs = 6 * 60 * 60 * 1000;
        return minDiff <= maxDiffMs ? closestIndex : -1;
    },


    /**
     * Enhance axis time format for tooltip with additional context
     * @private
     */
    _enhanceTimeFormatForTooltip: function(axisFormat) {
        switch (axisFormat) {
            case 'HH:mm': return 'ddd HH:mm';
            case 'ddd HH:mm': return 'ddd HH:mm';
            case 'dddd': return 'ddd HH:mm';
            case 'D/M': return 'ddd D/M HH:mm';
            case 'MMMM': return 'D/M HH:mm';
            default: return 'ddd DD MMM YYYY, HH:mm';
        }
    },

    /**
     * Format tooltip time with context enhancement
     * @private
     */
    _formatTooltipTime: function(timestamp, chartId) {
        if (!window.moment) {
            return new Date(timestamp).toLocaleString();
        }

        // Get the chart's time format and enhance it for tooltip
        const axisFormat = (window.chartTimeFormats && window.chartTimeFormats[chartId]) 
            ? window.chartTimeFormats[chartId] 
            : 'ddd DD MMM YYYY, HH:mm';
            
        const tooltipFormat = this._enhanceTimeFormatForTooltip(axisFormat);
        return window.moment(timestamp).format(tooltipFormat);
    },

    /**
     * Get series label with translation support
     * @private
     */
    _getSeriesLabel: function(seriesConfig, index) {
        if (seriesConfig.titleKey && window.I18n) {
            const translated = window.I18n.translate(seriesConfig.titleKey);
            if (translated !== seriesConfig.titleKey) {
                return translated;
            }
        }
        return seriesConfig.title || `Series ${index + 1}`;
    },


    /**
     * Create Y-axis configuration with rounding support
     * @private
     */
    _createYAxisConfig: function(config) {
        const yAxisConfig = {
            position: 'right',
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                lineWidth: 1,
                drawBorder: false
            },
            ticks: { font: { size: 9 } }
        };

        // Apply yAxis configuration from config if available
        if (config.yAxis) {
            Object.assign(yAxisConfig, {
                position: config.yAxis.position || yAxisConfig.position,
                min: config.yAxis.min,
                grid: {
                    ...yAxisConfig.grid,
                    color: config.yAxis.gridColor || yAxisConfig.grid.color
                }
            });

            yAxisConfig.afterDataLimits = (scale) => {
                const roundToNearest = config.yAxis.roundToNearest;
                
                // Only apply rounding if min/max are not explicitly set
                if (config.yAxis.min === undefined) {
                    scale.min = Math.floor(scale.min / roundToNearest) * roundToNearest;
                }
                if (config.yAxis.max === undefined) {
                    scale.max = Math.ceil(scale.max / roundToNearest) * roundToNearest;
                }
            };
            
            if (config.yAxis.formatLargeNumbers) {
                yAxisConfig.ticks.callback = function(value) {
                    if (value >= 1000) {
                        return (value / 1000) + 'k';
                    }
                    return value;
                };
                yAxisConfig.ticks.maxTicksLimit = 5;
            } else {
                yAxisConfig.ticks.maxTicksLimit = config.yAxis.maxTicks;
            }
        }

        return yAxisConfig;
    },

    /**
     * Format value according to chart configuration
     * @private
     */
    _formatValue: function(value, config) {
        if (value === null || value === undefined || isNaN(value)) {
            return 'No data';
        }

        const formatting = config.formatting || {};
        
        if (formatting.useIntegerFormat) {
            return Math.round(value).toString();
        } else {
            const decimals = formatting.decimalPlaces !== undefined ? formatting.decimalPlaces : 0;
            return value.toFixed(decimals);
        }
    },

    /**
     * Add min/max/avg indicators to chart options
     * @private
     */
    _addIndicators: function(options, stats, indicators, config) {
        if (stats.count === 0) return;

        const { min, max, avg } = stats;

        // Initialize annotations plugin if not exists
        if (!options.plugins.annotation) {
            options.plugins.annotation = { annotations: {} };
        }

        // Add min line
        if (indicators.showMin) {
            options.plugins.annotation.annotations.minLine = {
                type: 'line',
                yMin: min,
                yMax: min,
                borderColor: indicators.colors.min,
                borderWidth: 1,
                borderDash: [5, 5]
            };
        }

        // Add max line
        if (indicators.showMax) {
            options.plugins.annotation.annotations.maxLine = {
                type: 'line',
                yMin: max,
                yMax: max,
                borderColor: indicators.colors.max,
                borderWidth: 1,
                borderDash: [5, 5]
            };
        }

        // Add avg line
        if (indicators.showAvg) {
            options.plugins.annotation.annotations.avgLine = {
                type: 'line',
                yMin: avg,
                yMax: avg,
                borderColor: indicators.colors.avg,
                borderWidth: 1,
                borderDash: [2, 2],
                label: {
                    content: `Avg: ${this._formatValue(avg, config)}`,
                    enabled: true,
                    position: 'end'
                }
            };
        }
    },

    /**
     * Update chart statistics display
     * @private
     */
    _updateStats: function(config, stats, isMultiSeries) {
        const statsContainer = document.getElementById(`stats-${config.id}`);
        if (!statsContainer || stats.count === 0) return;

        const { min, max, avg, current } = stats;
        const unit = config.unit || '';

        // Build stats HTML with current value for single-series charts
        let statsHTML = `
            <div class="chart-stat">
                <span class="chart-stat-symbol chart-stat-symbol-low">▼</span>
                <span class="chart-stat-value">${this._formatValue(min, config)} ${unit}</span>
            </div>
            <div class="chart-stat">
                <span class="chart-stat-symbol chart-stat-symbol-avg">●</span>
                <span class="chart-stat-value">${this._formatValue(avg, config)} ${unit}</span>
            </div>
            <div class="chart-stat">
                <span class="chart-stat-symbol chart-stat-symbol-high">▲</span>
                <span class="chart-stat-value">${this._formatValue(max, config)} ${unit}</span>
            </div>`;

        // Add current value for single-series charts
        if (!isMultiSeries && current !== null) {
            statsHTML += `
            <div class="chart-stat">
                <span class="chart-stat-symbol chart-stat-symbol-now">▶</span>
                <span class="chart-stat-value">${this._formatValue(current, config)} ${unit}</span>
            </div>`;
        }

        statsContainer.innerHTML = statsHTML;
    },

    /**
     * Generate legend labels with current values
     * @private
     */
    _generateLegendLabelsWithValues: function(chart, config) {
        const labels = [];
        
        chart.data.datasets.forEach((dataset, index) => {
            if (dataset.data && dataset.data.length > 0) {
                // Get the last (current) value
                const lastPoint = dataset.data[dataset.data.length - 1];
                const currentValue = lastPoint ? lastPoint.y : null;
                
                // Get translated label
                let label = dataset.label || `Series ${index + 1}`;
                if (config.series && config.series[index] && config.series[index].titleKey && window.I18n) {
                    const translated = window.I18n.translate(config.series[index].titleKey);
                    // Always use the translated value, even if it's the same as the key
                    label = translated;
                }
                
                // Format current value
                if (currentValue !== null && !isNaN(currentValue)) {
                    const formattedValue = this._formatValue(currentValue, config);
                    label = `${label}: ${formattedValue}${(config.displayUnit)}`;
                }
                
                labels.push({
                    text: label,
                    fillStyle: dataset.borderColor,
                    strokeStyle: dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: !chart.isDatasetVisible(index),
                    datasetIndex: index
                });
            }
        });
        
        return labels;
    },

    /**
     * Determine smart time format based on range intent and data timespan
     * @private
     */
    _determineSmartTimeFormat: function(timestamps) {
        // Get range from URL params (same as _createXAxisConfig)
        const urlParams = new URLSearchParams(window.location.search);
        const range = urlParams.get('range');
        
        // Check range intent first - fixes bug with string ranges like "this-month"
        if (range) {
            switch (range) {
                case 'today':
                case 'yesterday':
                    return 'HH:mm';
                
                case 'this-week':
                    return 'ddd HH:mm';
                    
                case 'last-week':
                case 'this-month':
                case 'last-month':
                    return 'D/M';  // Clear date format for longer ranges
                    
                case 'start':
                    return 'MMMM';  // Month names for very long ranges
            }
            
            // Handle numeric ranges (days)
            const numericRange = parseInt(range);
            if (!isNaN(numericRange)) {
                if (numericRange <= 1) return 'HH:mm';
                if (numericRange <= 2) return 'ddd HH:mm';
                if (numericRange <= 7) return 'dddd';
                if (numericRange <= 120) return 'D/M';
                return 'MMMM';
            }
        }
        
        // Fallback: determine from actual data timespan
        if (!timestamps || timestamps.length < 2) return 'HH:mm';
        
        const firstTime = new Date(timestamps[0]);
        const lastTime = new Date(timestamps[timestamps.length - 1]);
        const timespan = lastTime.getTime() - firstTime.getTime();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (timespan < 1 * dayInMs) {
            return 'HH:mm';
        } else if (timespan < 2 * dayInMs) {
            return 'ddd HH:mm';
        } else if (timespan < 7 * dayInMs) {
            return 'dddd';
        } else if (timespan < 120 * dayInMs) {
            return 'D/M';
        } else {
            return 'MMMM';
        }
    },

    /**
     * Set up language change listener for dynamic legend updates
     * @private
     */
    _setupLanguageListener: function(chart, config) {
        // Remove any existing listener for this chart
        const chartId = config.id;
        if (window.chartLanguageListeners && window.chartLanguageListeners[chartId]) {
            document.removeEventListener('languageChanged', window.chartLanguageListeners[chartId]);
        }

        // Create new listener
        const languageListener = () => {
            // Update legend labels with new translations
            chart.update('none');
        };

        // Store listener for cleanup
        window.chartLanguageListeners = window.chartLanguageListeners || {};
        window.chartLanguageListeners[chartId] = languageListener;

        // Add listener
        document.addEventListener('languageChanged', languageListener);
    }
};

// Essential functions for compatibility with rest of system

// Chart.js global configuration (moved from chart-renderer.js)
Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#666';
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;


// Create a reference to the fetchChartData function from data_components.js
window.fetchChartData = window.DataComponents.fetchChartData;

window.recalculateChartStats = function(chart) {
};

window.translateChartLabels = function(chart) {
};

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
    
    
});

window.resizeAllCharts = function() {
    Object.keys(window.chartInstances).forEach(id => {
        const chart = window.chartInstances[id];
        if (chart) {
            chart.resize();
            chart.update('none');
        }
    });
};

window.refreshCharts = function(range, results) {
    // Destroy all existing charts
    Object.keys(window.chartInstances).forEach(id => {
        if (window.chartInstances[id]) {
            window.chartInstances[id].destroy();
            delete window.chartInstances[id];
        }
    });
    
    // Reload all charts
    loadAllCharts(range, results);
};

// Non-destructive chart update for auto-refresh
window.updateAllCharts = async function(range, results) {
    if (!window.chartConfigs) return;
    
    // Get configs based on current mode
    const isDashboard = window.Utils.isDashboardMode();
    const configsToUpdate = isDashboard 
        ? window.getDashboardCharts()
        : window.chartConfigs;
    
    // Update each chart individually without destroying
    const updatePromises = configsToUpdate.map(async (config) => {
        const effectiveRange = range === 'default' ? config.defaultRange : range;
        
        if (window.DataComponents && window.DataComponents.fetchChartData) {
            try {
                const newData = await window.DataComponents.fetchChartData(config, effectiveRange, results);
                // This will use updateChart() if chart exists, or create new if not
                window.UnifiedChartRenderer.addChart(config, newData);
                return newData;
            } catch (error) {
                console.error(`Error updating chart ${config.id}:`, error);
                return null;
            }
        }
        return Promise.resolve(null);
    });
    
    await Promise.allSettled(updatePromises);
};

// Update only charts with recent data (effectiveRange <= 3)
window.updateRecentCharts = async function(range, results) {
    if (!window.chartConfigs) return;
    
    // Get configs based on current mode
    const isDashboard = window.Utils.isDashboardMode();
    const allConfigs = isDashboard 
        ? window.getDashboardCharts()
        : window.chartConfigs;
    
    // Filter to only recent data charts
    const recentCharts = allConfigs.filter(config => {
        const effectiveRange = range === 'default' ? config.defaultRange : range;
        return parseInt(effectiveRange) <= 3;
    });
    
    if (recentCharts.length === 0) return;
    
    // Update each recent chart individually
    const updatePromises = recentCharts.map(async (config) => {
        const effectiveRange = range === 'default' ? config.defaultRange : range;
        
        if (window.DataComponents && window.DataComponents.fetchChartData) {
            try {
                const newData = await window.DataComponents.fetchChartData(config, effectiveRange, results);
                window.UnifiedChartRenderer.addChart(config, newData);
                return newData;
            } catch (error) {
                console.error(`Error updating recent chart ${config.id}:`, error);
                return null;
            }
        }
        return Promise.resolve(null);
    });
    
    await Promise.allSettled(updatePromises);
};

// Smart auto-refresh for charts
let autoRefreshInterval = null;
let lastFullRefresh = 0;
const FULL_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

window.startChartAutoRefresh = function(intervalSeconds = 300) {
    // Don't start if already running
    if (autoRefreshInterval) return;
    
    lastFullRefresh = Date.now();
    
    autoRefreshInterval = setInterval(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentRange = urlParams.get('range') || 'default';
        const currentResults = parseInt(urlParams.get('results')) || 8000;
        const now = Date.now();
        
        // Check if it's time for a full refresh (15 minutes)
        if (now - lastFullRefresh >= FULL_REFRESH_INTERVAL) {
            window.updateAllCharts(currentRange, currentResults);
            lastFullRefresh = now;
        } else {
            // Partial refresh: only update charts with recent data (effectiveRange <= 3)
            window.updateRecentCharts(currentRange, currentResults);
        }
    }, intervalSeconds * 1000);
};

window.stopChartAutoRefresh = function() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
};

// Global function to get dashboard charts for current selected set
window.getDashboardCharts = function() {
    const selectedSet = window.Utils.getSelectedChartSet();
    const chartIds = window.Utils.getChartsForSet(selectedSet);
    
    // Return charts in the order specified in the chart set config, not chartConfigs order
    return chartIds.map(chartId => {
        return window.chartConfigs.find(config => config.id === chartId);
    }).filter(Boolean);
};

// Chart loading function - handles both regular and dashboard modes
async function loadAllCharts(range = 1, results = 8000, isDashboard = false) {
    if (!window.chartConfigs) {
        console.error('Chart configs not loaded');
        return;
    }
    
    // Filter configs for dashboard mode
    const configs = isDashboard 
        ? window.getDashboardCharts()
        : window.chartConfigs;
    
    // Initialize chart layout if container is empty
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer && chartContainer.children.length === 0) {
        if (window.ChartLayout && window.ChartLayout.initializeChartLayout) {
            window.ChartLayout.initializeChartLayout(configs);
        }
    }
    
    // Load charts progressively
    const fetchPromises = configs.map((config) => {
        const effectiveRange = range === 'default' ? config.defaultRange : range;
        
        if (window.DataComponents && window.DataComponents.fetchChartData) {
            return window.DataComponents.fetchChartData(config, effectiveRange, results)
                .then(data => {
                    window.UnifiedChartRenderer.addChart(config, data);
                    return data;
                })
                .catch(error => {
                    console.error(`Error loading chart ${config.id}:`, error);
                    return null;
                });
        }
        return Promise.resolve(null);
    });
    
    await Promise.allSettled(fetchPromises);
}



// Expose chart sorting function (implementation is in chart-layout.js)
window.sortChartsByCategory = function(category) {
    if (window.ChartLayout && window.ChartLayout.sortChartsByCategory) {
        window.ChartLayout.sortChartsByCategory(category);
    }
};

// Chart reload function for chart set changes
window.loadChartsForMode = function() {
    const isDashboard = window.Utils.isDashboardMode();
    const range = window.currentRange || 1;
    const results = window.currentResults || 8000;
    
    // Destroy existing chart instances
    if (window.chartInstances) {
        Object.values(window.chartInstances).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        window.chartInstances = {};
    }
    
    // Clear existing charts and layout for chart set changes
    const chartContainer = document.getElementById('chartContainer');
    if (chartContainer) {
        chartContainer.innerHTML = '';
    }
    
    loadAllCharts(range, results, isDashboard);
};