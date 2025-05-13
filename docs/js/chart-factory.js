/**
 * Chart Factory Module
 * 
 * This module provides a factory system for creating and managing charts.
 * It implements a registry pattern that allows different chart types to be
 * registered and created using a consistent interface.
 */

/**
 * ChartFactory - Main factory module for creating and managing charts
 */
const ChartFactory = {
    // Registry of chart type factories
    _factories: {},
    
    // Registry of chart instances
    _instances: {},
    
    // Chart state management
    _states: {},
    
    /**
     * Initialize the chart factory
     * @returns {void}
     */
    initialize: function() {
        // Clear any existing state
        this._instances = {};
        this._states = {};
        
        // Register default chart types
        this.registerDefaults();
        
        // Listen for global events
        this._attachGlobalEventHandlers();
    },
    
    /**
     * Register default chart type factories
     * @returns {void}
     */
    registerDefaults: function() {
        // Register standard chart types
        this.register('line', this._createLineChartFactory());
        this.register('multiSeries', this._createMultiSeriesChartFactory());
    },
    
    /**
     * Register a chart type factory
     * @param {string} type - Chart type identifier
     * @param {Object} factory - Factory object with create method
     * @returns {void}
     */
    register: function(type, factory) {
        if (!type || typeof type !== 'string') {
            console.error('Chart type must be a non-empty string');
            return;
        }
        
        if (!factory || typeof factory !== 'object' || typeof factory.create !== 'function') {
            console.error('Chart factory must be an object with a create method');
            return;
        }
        
        this._factories[type] = factory;
    },
    
    /**
     * Create a chart based on configuration
     * @param {Object} config - Chart configuration
     * @param {Object} data - Chart data
     * @param {string} [containerId] - Optional container ID (defaults to 'chartContainer')
     * @returns {Object} Created chart instance or null if creation failed
     */
    create: function(config, data, containerId = 'chartContainer') {
        if (!config || !config.id) {
            console.error('Invalid chart configuration: missing id');
            return null;
        }
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Chart container not found: ${containerId}`);
            return null;
        }
        
        // Determine chart type from config
        const chartType = this._determineChartType(config);
        
        // Get factory for this chart type
        const factory = this._factories[chartType];
        if (!factory) {
            console.error(`No factory registered for chart type: ${chartType}`);
            return null;
        }
        
        // Create chart using the factory
        try {
            const chart = factory.create(config, data);
            
            if (chart) {
                // Store chart instance
                this._instances[config.id] = chart;
                
                // Initialize chart state
                this._initializeChartState(config.id, config);
                
                return chart;
            }
        } catch (error) {
            console.error(`Error creating chart ${config.id}:`, error);
        }
        
        return null;
    },
    
    /**
     * Update an existing chart with new data
     * @param {string} chartId - Chart ID
     * @param {Object} data - New chart data
     * @returns {boolean} Success status
     */
    update: function(chartId, data) {
        const chart = this._instances[chartId];
        
        if (!chart) {
            console.error(`Chart not found for update: ${chartId}`);
            return false;
        }
        
        try {
            // Find the appropriate factory for this chart
            const chartType = this._getChartTypeFromInstance(chart);
            const factory = this._factories[chartType];
            
            if (factory && typeof factory.update === 'function') {
                // Use factory update method if available
                return factory.update(chart, data);
            } else {
                // Default update behavior
                this._updateChartData(chart, data);
                return true;
            }
        } catch (error) {
            console.error(`Error updating chart ${chartId}:`, error);
            return false;
        }
    },
    
    /**
     * Destroy a chart instance and clean up resources
     * @param {string} chartId - Chart ID
     * @returns {boolean} Success status
     */
    destroy: function(chartId) {
        const chart = this._instances[chartId];
        
        if (!chart) {
            return false;
        }
        
        try {
            // Use ChartLifecycleManager if available for complete cleanup
            if (window.ChartLifecycleManager) {
                return window.ChartLifecycleManager.cleanupChart(chartId);
            }
            
            // Otherwise, fall back to basic cleanup
            
            // Call Chart.js destroy method
            if (chart.destroy && typeof chart.destroy === 'function') {
                chart.destroy();
            }
            
            // Remove from instances registry
            delete this._instances[chartId];
            
            // Remove state
            delete this._states[chartId];
            
            return true;
        } catch (error) {
            console.error(`Error destroying chart ${chartId}:`, error);
            return false;
        }
    },
    
    /**
     * Get a chart instance by ID
     * @param {string} chartId - Chart ID
     * @returns {Object|null} Chart instance or null if not found
     */
    getInstance: function(chartId) {
        return this._instances[chartId] || null;
    },
    
    /**
     * Get all chart instances
     * @returns {Object} Object mapping chart IDs to instances
     */
    getAllInstances: function() {
        return { ...this._instances };
    },
    
    /**
     * Resize all charts (e.g., on window resize)
     * @returns {void}
     */
    resizeAll: function() {
        const chartIds = Object.keys(this._instances);
        
        chartIds.forEach(chartId => {
            const chart = this._instances[chartId];
            if (chart && chart.resize && typeof chart.resize === 'function') {
                chart.resize();
                chart.update('none');
            }
        });
    },
    
    /**
     * Update the display state of charts (e.g., mobile vs. desktop)
     * @param {boolean} isMobile - Whether the display is in mobile mode
     * @returns {void}
     */
    updateDisplayState: function(isMobile) {
        // Update all charts' display state
        const chartIds = Object.keys(this._instances);
        
        chartIds.forEach(chartId => {
            const state = this._states[chartId];
            if (state) {
                state.isMobile = isMobile;
            }
        });
    },
    
    /**
     * Get the state for a chart
     * @param {string} chartId - Chart ID
     * @returns {Object|null} Chart state or null if not found
     */
    getState: function(chartId) {
        return this._states[chartId] || null;
    },
    
    /**
     * Update part of a chart's state
     * @param {string} chartId - Chart ID
     * @param {Object} stateUpdate - State properties to update
     * @returns {boolean} Success status
     */
    updateState: function(chartId, stateUpdate) {
        if (!this._states[chartId]) {
            return false;
        }
        
        this._states[chartId] = {
            ...this._states[chartId],
            ...stateUpdate
        };
        
        return true;
    },
    
    /**
     * Refresh all charts with the same data
     * @returns {void}
     */
    refreshAll: function() {
        const chartIds = Object.keys(this._instances);
        
        chartIds.forEach(chartId => {
            const chart = this._instances[chartId];
            if (chart && chart.update && typeof chart.update === 'function') {
                chart.update('none');
            }
        });
    },
    
    /* PRIVATE METHODS */
    
    /**
     * Initialize chart state
     * @private
     * @param {string} chartId - Chart ID
     * @param {Object} config - Chart configuration
     * @returns {void}
     */
    _initializeChartState: function(chartId, config) {
        this._states[chartId] = {
            id: chartId,
            config: { ...config },
            isMobile: window.innerWidth <= 768,
            lastUpdated: new Date().getTime(),
            visible: true
        };
    },
    
    /**
     * Attach global event handlers
     * @private
     * @returns {void}
     */
    _attachGlobalEventHandlers: function() {
        // Handle window resize
        window.addEventListener('resize', () => {
            // Debounce resize events
            if (this._resizeTimeout) {
                clearTimeout(this._resizeTimeout);
            }
            
            this._resizeTimeout = setTimeout(() => {
                const isMobile = window.innerWidth <= 768;
                
                // Update display state first
                this.updateDisplayState(isMobile);
                
                // Then resize all charts
                this.resizeAll();
            }, 250); // 250ms debounce
        });
        
        // Handle language changes
        document.addEventListener('languageChanged', () => {
            // Refresh all charts with updated translations
            this.refreshAll();
        });
    },
    
    /**
     * Determine the chart type from configuration
     * @private
     * @param {Object} config - Chart configuration
     * @returns {string} Chart type
     */
    _determineChartType: function(config) {
        // Multi-series check
        if (config.series && Array.isArray(config.series) && config.series.length > 1) {
            return 'multiSeries';
        }
        
        // Default to line chart
        return 'line';
    },
    
    /**
     * Get chart type from instance
     * @private
     * @param {Object} chart - Chart instance
     * @returns {string} Chart type
     */
    _getChartTypeFromInstance: function(chart) {
        // For Chart.js instances, we can determine by inspecting data
        if (chart.data && chart.data.datasets) {
            if (chart.data.datasets.length > 1) {
                return 'multiSeries';
            }
        }
        
        // Default to line
        return 'line';
    },
    
    /**
     * Basic chart data update function
     * @private
     * @param {Object} chart - Chart instance
     * @param {Object} data - New data
     * @returns {void}
     */
    _updateChartData: function(chart, data) {
        if (!chart || !chart.data || !data) return;
        
        // Update labels
        if (data.labels) {
            chart.data.labels = data.labels;
        }
        
        // Update datasets
        if (data.datasets && Array.isArray(data.datasets)) {
            data.datasets.forEach((newDataset, i) => {
                if (chart.data.datasets[i]) {
                    Object.assign(chart.data.datasets[i], newDataset);
                } else {
                    chart.data.datasets.push(newDataset);
                }
            });
        }
        
        // Apply changes
        chart.update('none');
    },
    
    /**
     * Create line chart factory
     * @private
     * @returns {Object} Line chart factory
     */
    _createLineChartFactory: function() {
        return {
            /**
             * Create a line chart
             * @param {Object} config - Chart configuration
             * @param {Object} data - Chart data
             * @returns {Object} Chart instance
             */
            create: function(config, data) {
                // Get canvas element
                const canvas = document.getElementById(config.id);
                if (!canvas) return null;
                
                // Process data for line chart
                const chartData = this._processLineChartData(config, data);
                
                // Create chart options
                const chartOptions = this._createLineChartOptions(config, chartData);
                
                // Create Chart.js instance
                return new Chart(canvas, {
                    type: 'line',
                    data: chartData,
                    options: chartOptions
                });
            },
            
            /**
             * Update a line chart
             * @param {Object} chart - Chart instance
             * @param {Object} data - New data
             * @returns {boolean} Success status
             */
            update: function(chart, data) {
                if (!chart || !data) return false;
                
                try {
                    // Get chart config from canvas ID
                    const chartId = chart.canvas.id;
                    const config = window.chartConfigs.find(c => c.id === chartId);
                    
                    if (!config) return false;
                    
                    // Process new data
                    const chartData = this._processLineChartData(config, data);
                    
                    // Update chart data
                    chart.data.labels = chartData.labels;
                    
                    // Update datasets
                    chartData.datasets.forEach((dataset, i) => {
                        if (chart.data.datasets[i]) {
                            Object.assign(chart.data.datasets[i], dataset);
                        } else {
                            chart.data.datasets.push(dataset);
                        }
                    });
                    
                    // Apply changes
                    chart.update('none');
                    
                    return true;
                } catch (error) {
                    console.error('Error updating line chart:', error);
                    return false;
                }
            },
            
            /**
             * Process data for line chart
             * @private
             * @param {Object} config - Chart configuration
             * @param {Object} data - Raw data
             * @returns {Object} Processed chart data
             */
            _processLineChartData: function(config, data) {
                // Process timestamps into Date objects for time scale
                const timestamps = data.feeds.map(feed => feed.created_at);
                const labels = timestamps.map(timestamp => new Date(timestamp));
                
                // Process values
                let values = data.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
                
                // Apply data transformation if configured
                if (config.dataTransform) {
                    values = this._applyDataTransform(values, config.dataTransform);
                }
                
                // Check for negative values
                const hasNegativeValues = values.some(v => v < 0);
                
                // Create dataset with data points as {x, y} objects for time scale
                const dataset = {
                    label: config.title || config.id,
                    data: labels.map((date, index) => ({
                        x: date,
                        y: values[index]
                    })),
                    borderColor: config.color,
                    backgroundColor: hasNegativeValues ? 'rgba(0,0,0,0)' : `${config.color}20`,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: !hasNegativeValues,
                    tension: 0.1,
                    yAxisID: 'y'
                };
                
                return {
                    labels,
                    datasets: [dataset],
                    timestamps,
                    hasNegativeValues
                };
            },
            
            /**
             * Apply data transformations to values
             * @private
             * @param {Array} values - Data values
             * @param {Object} transform - Transform configuration
             * @returns {Array} Transformed values
             */
            _applyDataTransform: function(values, transform) {
                return window.ChartUtils.transformValues(values, transform);
            },
            
            /**
             * Create chart options for line chart
             * @private
             * @param {Object} config - Chart configuration
             * @param {Object} chartData - Processed chart data
             * @returns {Object} Chart.js options
             */
            _createLineChartOptions: function(config, chartData) {
                // Get theme
                const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
                
                // Get layout properties
                const isMobile = window.innerWidth <= 768;
                
                // Create chart options (similar to existing code in chart_renderer.js)
                return {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // Disable animation for immediate rendering
                    
                    layout: {
                        padding: {
                            left: 0,
                            right: 2,
                            top: 2,
                            bottom: 0
                        }
                    },
                    
                    scales: {
                        x: {
                            type: 'time', // Use time scale
                            time: {
                                displayFormats: {
                                    millisecond: 'HH:mm:ss.SSS',
                                    second: 'HH:mm:ss',
                                    minute: 'HH:mm',
                                    hour: 'HH:mm',
                                    day: 'MMM D',
                                    week: 'MMM D',
                                    month: 'MMM YYYY',
                                    quarter: 'MMM YYYY',
                                    year: 'YYYY'
                                },
                                unit: 'auto',
                                tooltipFormat: 'MMM D, YYYY, HH:mm',
                            },
                            grid: {
                                display: false // No X grid lines
                            },
                            ticks: {
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: isMobile ? 6 : ((config.columnSpan && config.columnSpan >= 2) ? 6 : 4),
                                font: {
                                    size: 9
                                },
                                color: isDarkMode ? '#c0c0c0' : '#666'
                            },
                            border: {
                                display: false
                            }
                        },
                        y: {
                            position: isMobile ? 'left' : 'right',
                            grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                lineWidth: 1,
                                drawBorder: false
                            },
                            beginAtZero: false,
                            ticks: {
                                font: {
                                    size: isMobile ? 8 : 9
                                },
                                maxTicksLimit: isMobile ? 4 : 5,
                                color: isDarkMode ? '#c0c0c0' : '#666',
                                padding: 0
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    
                    plugins: {
                        title: {
                            display: false // Don't display the title - we have our own title element
                        },
                        legend: {
                            display: false // Don't show legend for single-series charts
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
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    }
                };
            }
        };
    },
    
    /**
     * Create multi-series chart factory
     * @private
     * @returns {Object} Multi-series chart factory
     */
    _createMultiSeriesChartFactory: function() {
        return {
            /**
             * Create a multi-series chart
             * @param {Object} config - Chart configuration
             * @param {Object} data - Chart data
             * @returns {Object} Chart instance
             */
            create: function(config, data) {
                // Get canvas element
                const canvas = document.getElementById(config.id);
                if (!canvas) return null;
                
                // Process data for multi-series chart
                const chartData = this._processMultiSeriesChartData(config, data);
                
                // Create chart options
                const chartOptions = this._createMultiSeriesChartOptions(config, chartData);
                
                // Create Chart.js instance
                return new Chart(canvas, {
                    type: 'line',
                    data: chartData,
                    options: chartOptions
                });
            },
            
            /**
             * Update a multi-series chart
             * @param {Object} chart - Chart instance
             * @param {Object} data - New data
             * @returns {boolean} Success status
             */
            update: function(chart, data) {
                if (!chart || !data) return false;
                
                try {
                    // Get chart config from canvas ID
                    const chartId = chart.canvas.id;
                    const config = window.chartConfigs.find(c => c.id === chartId);
                    
                    if (!config) return false;
                    
                    // Process new data
                    const chartData = this._processMultiSeriesChartData(config, data);
                    
                    // Update chart data
                    chart.data.labels = chartData.labels;
                    
                    // Update datasets
                    chartData.datasets.forEach((dataset, i) => {
                        if (chart.data.datasets[i]) {
                            Object.assign(chart.data.datasets[i], dataset);
                        } else {
                            chart.data.datasets.push(dataset);
                        }
                    });
                    
                    // Apply changes
                    chart.update('none');
                    
                    return true;
                } catch (error) {
                    console.error('Error updating multi-series chart:', error);
                    return false;
                }
            },
            
            /**
             * Process data for multi-series chart
             * @private
             * @param {Object} config - Chart configuration
             * @param {Object} data - Raw data
             * @returns {Object} Processed chart data
             */
            _processMultiSeriesChartData: function(config, data) {
                // Multi-series data comes in a different format
                if (!data.is_multi_series || !data.series || !Array.isArray(data.series)) {
                    // Return empty chart data if no series
                    return {
                        labels: [],
                        datasets: [],
                        timestamps: [],
                        hasNegativeValues: false
                    };
                }

                // Check if this is a chart with disabled timestamp synchronization
                const disableSyncTimestamps = config.disableSyncTimestamps === true;
                let timestamps = [];
                let labels = [];

                // Get timestamps from first series (already synchronized in data-components.js if needed)
                timestamps = data.series[0].feeds.map(feed => feed.created_at);
                labels = timestamps.map(timestamp => new Date(timestamp));
                
                let hasNegativeValues = false;
                
                // Create datasets for each series
                const datasets = data.series.map((series, index) => {
                    // Get matching config for this series
                    const seriesConfig = config.series[index] || {};
                    
                    // Get values for this series
                    let seriesValues = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
                    
                    // Apply data transformation if configured
                    if (config.dataTransform) {
                        seriesValues = this._applyDataTransform(seriesValues, config.dataTransform);
                    }
                    
                    // Check for negative values
                    if (seriesValues.some(v => v < 0)) {
                        hasNegativeValues = true;
                    }
                    
                    // Translate series title if possible
                    let translatedTitle = series.title;
                    if (window.I18n && typeof window.I18n.translate === 'function') {
                        // Use titleKey from series config directly if available
                        if (seriesConfig.titleKey) {
                            const translated = window.I18n.translate(seriesConfig.titleKey);
                            if (translated !== seriesConfig.titleKey) {
                                translatedTitle = translated;
                            }
                        }
                    }
                    
                    // Create dataset for this series with {x, y} format for time scale
                    const yAxisID = seriesConfig.axis || 'y';

                    // Check if this is a chart with disabled timestamp synchronization
                    const disableSyncTimestamps = config.disableSyncTimestamps === true;
                    let dataPoints = [];

                    if (disableSyncTimestamps) {
                        // For charts with disabled sync (like light chart), each series needs its own timestamps
                        // Get timestamps and values directly from this series
                        const seriesDates = series.feeds.map(feed => new Date(feed.created_at));
                        const seriesValues = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));

                        // Create data points for this series
                        dataPoints = seriesDates.map((date, i) => ({
                            x: date,
                            y: seriesValues[i]
                        }));
                    } else {
                        // For normal charts, use the common timestamps
                        dataPoints = labels.map((date, i) => ({
                            x: date,
                            y: seriesValues[i]
                        }));
                    }

                    return {
                        label: translatedTitle || series.title || `Series ${index + 1}`,
                        data: dataPoints,
                        borderColor: series.color || seriesConfig.color,
                        backgroundColor: `${series.color || seriesConfig.color}20`,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: false,
                        tension: 0.1,
                        yAxisID: yAxisID
                    };
                });
                
                return {
                    labels,
                    datasets,
                    timestamps,
                    hasNegativeValues,
                    isMultiSeries: true
                };
            },
            
            /**
             * Apply data transformations to values
             * @private
             * @param {Array} values - Data values
             * @param {Object} transform - Transform configuration
             * @returns {Array} Transformed values
             */
            _applyDataTransform: function(values, transform) {
                return window.ChartUtils.transformValues(values, transform);
            },
            
            /**
             * Create chart options for multi-series chart
             * @private
             * @param {Object} config - Chart configuration
             * @param {Object} chartData - Processed chart data
             * @returns {Object} Chart.js options
             */
            _createMultiSeriesChartOptions: function(config, chartData) {
                // Get theme
                const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
                
                // Get layout properties
                const isMobile = window.innerWidth <= 768;
                
                // Create multi-series chart options
                const options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false, // Disable animation for immediate rendering
                    
                    layout: {
                        padding: {
                            left: 0,
                            right: config.secondYAxis ? 20 : 2,
                            top: 2,
                            bottom: 0
                        }
                    },
                    
                    scales: {
                        x: {
                            type: 'time', // Use time scale
                            time: {
                                displayFormats: {
                                    millisecond: 'HH:mm:ss.SSS',
                                    second: 'HH:mm:ss',
                                    minute: 'HH:mm',
                                    hour: 'HH:mm',
                                    day: 'MMM D',
                                    week: 'MMM D',
                                    month: 'MMM YYYY',
                                    quarter: 'MMM YYYY',
                                    year: 'YYYY'
                                },
                                unit: 'auto',
                                tooltipFormat: 'MMM D, YYYY, HH:mm',
                            },
                            grid: {
                                display: false // No X grid lines
                            },
                            ticks: {
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: isMobile ? 6 : ((config.columnSpan && config.columnSpan >= 2) ? 6 : 4),
                                font: {
                                    size: 9
                                },
                                color: isDarkMode ? '#c0c0c0' : '#666'
                            },
                            border: {
                                display: false
                            }
                        },
                        y: {
                            position: isMobile ? 'left' : 'right',
                            grid: {
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                lineWidth: 1,
                                drawBorder: false
                            },
                            beginAtZero: false,
                            ticks: {
                                font: {
                                    size: isMobile ? 8 : 9
                                },
                                maxTicksLimit: isMobile ? 4 : 5,
                                color: isDarkMode ? '#c0c0c0' : '#666',
                                padding: 0
                            },
                            border: {
                                display: false
                            }
                        }
                    },
                    
                    plugins: {
                        title: {
                            display: false // Don't display the title - we have our own title element
                        },
                        legend: {
                            display: true, // Show legend for multi-series charts
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                boxHeight: 2,
                                padding: 6,
                                font: {
                                    size: 8,
                                    weight: 500
                                },
                                color: isDarkMode ? '#c0c0c0' : undefined,
                                usePointStyle: false
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
                            backgroundColor: 'rgba(0, 0, 0, 0.7)'
                        }
                    }
                };
                
                // Add secondary Y-axis if configured
                if (config.secondYAxis) {
                    options.scales.y1 = {
                        position: 'left',
                        grid: {
                            display: false,
                            drawOnChartArea: false
                        },
                        ticks: {
                            font: {
                                size: isMobile ? 8 : 9
                            },
                            maxTicksLimit: isMobile ? 4 : 5,
                            color: '#8a5a00', // Standard color for secondary axis
                            padding: 0
                        },
                        border: {
                            display: false
                        }
                    };
                }
                
                return options;
            }
        };
    }
};

// Export the factory for access from other modules
if (typeof window !== 'undefined') {
    window.ChartFactory = ChartFactory;
}