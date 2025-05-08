/**
 * Chart Loader Module
 * 
 * This module handles loading and rendering of charts using the ChartFactory.
 * It implements progressive loading and handles chart layout initialization.
 */

/**
 * ChartLoader - Responsible for loading, initializing and refreshing charts
 */
const ChartLoader = {
    // Configuration
    _config: {
        containerId: 'chartContainer',
        defaultRange: 1,
        defaultResults: 8000,
        mobileBreakpoint: 768
    },
    
    // State
    _state: {
        initialized: false,
        loading: false,
        chartsToLoad: 0,
        chartsLoaded: 0,
        currentRange: 1,
        currentResults: 8000,
        isMobile: false
    },
    
    // Event handlers
    _eventHandlers: {
        onComplete: null,
        onProgress: null,
        onError: null
    },
    
    /**
     * Initialize the chart loader
     * @param {Object} [config] - Optional configuration
     * @returns {void}
     */
    initialize: function(config = {}) {
        // Merge config with defaults
        this._config = { ...this._config, ...config };
        
        // Initialize state
        this._state.isMobile = window.innerWidth <= this._config.mobileBreakpoint;
        this._state.currentRange = Utils.getURLParameter('range') || this._config.defaultRange;
        this._state.currentResults = parseInt(Utils.getURLParameter('results')) || this._config.defaultResults;
        
        // Make sure ChartFactory is initialized
        if (window.ChartFactory && typeof window.ChartFactory.initialize === 'function') {
            window.ChartFactory.initialize();
        } else {
            console.error('ChartFactory not available');
            return;
        }
        
        // Set up event handlers
        this._setupEventHandlers();
        
        // Mark as initialized
        this._state.initialized = true;
    },
    
    /**
     * Load all charts with current range and results
     * @param {number} [range] - Optional range override
     * @param {number} [results] - Optional results override
     * @returns {Promise} Promise that resolves when all charts are loaded
     */
    loadAllCharts: async function(range, results) {
        // Don't load if already loading
        if (this._state.loading) {
            return Promise.reject(new Error('Charts already loading'));
        }
        
        // Check initialization
        if (!this._state.initialized) {
            this.initialize();
        }
        
        console.time('Total chart loading');
        
        // Set loading state
        this._state.loading = true;
        this._state.chartsLoaded = 0;
        
        // Update range and results if provided
        if (range !== undefined) this._state.currentRange = range;
        if (results !== undefined) this._state.currentResults = results;
        
        // Initialize chart layout
        console.time('Chart layout initialization');
        this._initializeChartLayout();
        console.timeEnd('Chart layout initialization');
        
        // Load all charts
        console.time('Data fetching (total)');
        
        // Set up counters for tracking progress
        const chartConfigs = window.chartConfigs || [];
        this._state.chartsToLoad = chartConfigs.length;
        
        // Create and track all fetch promises
        const fetchPromises = chartConfigs.map((config, index) => {
            // Start fetching data for this chart
            return this._fetchChartData(config, this._state.currentRange, this._state.currentResults)
                .then(data => {
                    // When data arrives, immediately render the chart
                    console.time(`Rendering chart ${config.id}`);
                    this._createOrUpdateChart(config, data);
                    console.timeEnd(`Rendering chart ${config.id}`);
                    
                    // Increment counter and trigger progress event
                    this._state.chartsLoaded++;
                    if (this._eventHandlers.onProgress) {
                        this._eventHandlers.onProgress({
                            loaded: this._state.chartsLoaded,
                            total: this._state.chartsToLoad,
                            percent: Math.round((this._state.chartsLoaded / this._state.chartsToLoad) * 100)
                        });
                    }
                    
                    // If this is the last chart, log completion and trigger completion event
                    if (this._state.chartsLoaded === this._state.chartsToLoad) {
                        console.timeEnd('Data fetching (total)');
                        console.timeEnd('Total chart loading');
                        this._state.loading = false;
                        
                        if (this._eventHandlers.onComplete) {
                            this._eventHandlers.onComplete();
                        }
                    }
                    
                    // Return the data for Promise tracking
                    return data;
                })
                .catch(error => {
                    console.error(`Error loading chart ${config.id}:`, error);
                    
                    // Even on error, increment counter
                    this._state.chartsLoaded++;
                    
                    // Trigger error event
                    if (this._eventHandlers.onError) {
                        this._eventHandlers.onError({
                            chartId: config.id,
                            error: error
                        });
                    }
                    
                    // If this is the last chart, log completion
                    if (this._state.chartsLoaded === this._state.chartsToLoad) {
                        console.timeEnd('Data fetching (total)');
                        console.timeEnd('Total chart loading');
                        this._state.loading = false;
                        
                        if (this._eventHandlers.onComplete) {
                            this._eventHandlers.onComplete();
                        }
                    }
                    
                    // Return null for failed charts
                    return null;
                });
        });
        
        // Return promise that resolves when all charts are loaded
        return Promise.allSettled(fetchPromises);
    },
    
    /**
     * Refresh all charts with current range and results
     * @returns {Promise} Promise that resolves when all charts are refreshed
     */
    refreshAllCharts: async function() {
        console.time('Refresh charts');
        
        // Destroy all existing charts
        console.time('Destroy charts');
        if (window.ChartFactory) {
            const instances = window.ChartFactory.getAllInstances();
            Object.keys(instances).forEach(chartId => {
                window.ChartFactory.destroy(chartId);
            });
        }
        console.timeEnd('Destroy charts');
        
        // Load all charts with current parameters
        return this.loadAllCharts(this._state.currentRange, this._state.currentResults)
            .finally(() => {
                console.timeEnd('Refresh charts');
            });
    },
    
    /**
     * Set the event handlers for loader events
     * @param {Object} handlers - Event handler functions
     * @returns {void}
     */
    setEventHandlers: function(handlers) {
        this._eventHandlers = {
            ...this._eventHandlers,
            ...handlers
        };
    },
    
    /**
     * Get the current state of the loader
     * @returns {Object} Current state
     */
    getState: function() {
        return { ...this._state };
    },
    
    /**
     * Change the date range and results
     * @param {number} range - New range value
     * @param {number} [results] - Optional new results value
     * @returns {void}
     */
    changeRange: function(range, results) {
        // Update state
        this._state.currentRange = range;
        if (results !== undefined) this._state.currentResults = results;
        
        // Update URL with new parameters
        const url = new URL(window.location.href);
        url.searchParams.set('range', range);
        
        if (this._state.currentResults !== this._config.defaultResults) {
            url.searchParams.set('results', this._state.currentResults);
        } else {
            url.searchParams.delete('results');
        }
        
        // Update browser history without reloading
        window.history.replaceState({}, '', url);
        
        // Refresh charts with new parameters
        return this.refreshAllCharts();
    },
    
    /**
     * Sort charts by category (for mobile view)
     * @param {string} category - Category to sort by, or 'row' for default ordering
     * @returns {void}
     */
    sortChartsByCategory: function(category) {
        // Only apply sorting on mobile
        if (!this._state.isMobile) {
            return;
        }
        
        const container = document.getElementById(this._config.containerId);
        if (!container) {
            return;
        }
        
        const charts = Array.from(container.querySelectorAll('.chart'));
        
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
        }).filter(Boolean); // Remove any null elements
        
        // Sort charts based on category
        if (category === 'row') {
            // Sort by row number
            chartElements.sort((a, b) => {
                if (a.row !== b.row) {
                    return a.row - b.row;
                }
                
                // Get config for column position
                const aConfig = window.chartConfigs.find(c => c.id === a.id);
                const bConfig = window.chartConfigs.find(c => c.id === b.id);
                
                const aCol = aConfig && aConfig.gridColumn ? 
                    parseInt(aConfig.gridColumn.split('/')[0]) || 0 : 0;
                    
                const bCol = bConfig && bConfig.gridColumn ? 
                    parseInt(bConfig.gridColumn.split('/')[0]) || 0 : 0;
                
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
        
        // Remove all charts from container
        charts.forEach(chart => chart.remove());
        
        // Reattach charts in the new order
        chartElements.forEach(item => {
            container.appendChild(item.element);
        });
        
        // Store the current sort preference
        localStorage.setItem('chartSortPreference', category);
    },
    
    /* PRIVATE METHODS */
    
    /**
     * Initialize the chart layout with placeholders
     * @private
     * @returns {void}
     */
    _initializeChartLayout: function() {
        const container = document.getElementById(this._config.containerId);
        if (!container) {
            console.error(`Chart container not found: ${this._config.containerId}`);
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Group charts by row for organization
        const rowGroups = {};
        (window.chartConfigs || []).forEach(config => {
            if (!rowGroups[config.row]) {
                rowGroups[config.row] = [];
            }
            rowGroups[config.row].push(config);
        });
        
        // Calculate grid positions for each chart
        this._calculateGridPositions(rowGroups);
        
        // Determine if we're in mobile mode
        const isMobile = this._state.isMobile;
        
        // For mobile, sort by rows
        let orderedConfigs = [...(window.chartConfigs || [])];
        
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
            
            // Only set grid positions if not mobile
            if (!isMobile) {
                chartDiv.style.gridRow = config.gridRow;
                chartDiv.style.gridColumn = config.gridColumn;
            }
            
            // Add data attributes for filtering
            chartDiv.setAttribute('data-row', config.row);
            chartDiv.setAttribute('data-category', config.category || '');
            
            // Create title using translation key from config
            const translationKey = config.titleKey || 
                (config.title ? config.title.toLowerCase().replace(/\s+/g, '') : 'chart');
            
            // Create title div with translation attributes
            const titleDiv = document.createElement('div');
            titleDiv.className = 'chart-title';
            titleDiv.setAttribute('data-i18n', translationKey);
            
            // Apply translation immediately if available
            if (window.I18n && typeof window.I18n.translate === 'function') {
                const translatedTitle = window.I18n.translate(translationKey);
                titleDiv.textContent = translatedTitle;
                titleDiv.title = translatedTitle;
            } else {
                // Fallback to title property
                titleDiv.textContent = config.title || translationKey;
                titleDiv.title = config.title || translationKey;
            }
            
            titleDiv.setAttribute('data-i18n-title', translationKey);
            
            // Create stats container
            const statsDiv = document.createElement('div');
            statsDiv.className = 'chart-stats';
            statsDiv.id = `stats-${config.id}`;
            
            // Create canvas container
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'chart-canvas-container';
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.id = config.id;
            
            // Add loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-indicator';
            loadingDiv.id = `loading-${config.id}`;
            loadingDiv.style.display = 'block';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            
            // Get translated loading text
            let loadingTextValue = 'Loading data...';
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
            chartDiv.appendChild(statsDiv);
            chartDiv.appendChild(canvasContainer);
            
            container.appendChild(chartDiv);
        });
        
        // Add a class to the container based on viewport
        container.classList.toggle('mobile-layout', isMobile);
    },
    
    /**
     * Calculate grid positions for charts based on rows
     * @private
     * @param {Object} rowGroups - Chart configs grouped by row
     * @returns {void}
     */
    _calculateGridPositions: function(rowGroups) {
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
            
            // Follow the rules specified
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
    },
    
    /**
     * Create or update a chart using the ChartFactory
     * @private
     * @param {Object} config - Chart configuration
     * @param {Object} data - Chart data
     * @returns {void}
     */
    _createOrUpdateChart: function(config, data) {
        // Get the loading element
        const loadingEl = document.getElementById(`loading-${config.id}`);
        
        // Get translated loading and no data text
        let loadingText = 'Loading data...';
        let noDataText = 'No data available';
        
        if (window.I18n && typeof window.I18n.translate === 'function') {
            loadingText = window.I18n.translate('loading');
            noDataText = window.I18n.translate('noData');
        }
        
        // Reset loading element to its initial state
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="loading-spinner"></div>
                <div>${loadingText}</div>
            `;
            loadingEl.style.display = 'block';
        }
        
        // Check if data is valid
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
        
        // Check if chart already exists
        const existingChart = window.ChartFactory.getInstance(config.id);
        
        if (existingChart) {
            // Update existing chart
            window.ChartFactory.update(config.id, data);
        } else {
            // Create new chart
            const chart = window.ChartFactory.create(config, data);
            
            // Additional setup after chart creation
            if (chart) {
                this._setupStatsDisplay(config, data);
            }
        }
    },
    
    /**
     * Set up the statistics display for a chart
     * @private
     * @param {Object} config - Chart configuration
     * @param {Object} data - Chart data
     * @returns {void}
     */
    _setupStatsDisplay: function(config, data) {
        // Calculate chart statistics
        const statsData = this._calculateChartStatistics(config, data);
        
        // Update stats display
        this._updateChartStats(config.id, statsData, data.is_multi_series, config.unit, config);
    },
    
    /**
     * Calculate statistics for a chart
     * @private
     * @param {Object} config - Chart configuration
     * @param {Object} data - Chart data
     * @returns {Object} Statistics data
     */
    _calculateChartStatistics: function(config, data) {
        let minValue = Infinity;
        let maxValue = -Infinity;
        let avgValue = 0;
        let currentValue = null;
        let totalValues = 0;
        let totalCount = 0;
        
        // Process data based on whether it's multi-series or not
        if (data.is_multi_series && data.series && Array.isArray(data.series)) {
            // For multi-series, calculate stats across all series
            data.series.forEach(series => {
                if (!series.feeds || series.feeds.length === 0) return;
                
                // Get values for this series
                const values = series.feeds
                    .map(feed => parseFloat(feed[`field${series.field}`]))
                    .filter(v => !isNaN(v));
                
                if (values.length === 0) return;
                
                const seriesMin = Math.min(...values);
                const seriesMax = Math.max(...values);
                const seriesSum = values.reduce((sum, v) => sum + v, 0);
                
                minValue = Math.min(minValue, seriesMin);
                maxValue = Math.max(maxValue, seriesMax);
                totalValues += seriesSum;
                totalCount += values.length;
                
                // Use the last value from the first series as current value
                if (currentValue === null && values.length > 0) {
                    currentValue = values[values.length - 1];
                }
            });
        } else {
            // For single series, process the feeds directly
            if (data.feeds && data.feeds.length > 0) {
                const values = data.feeds
                    .map(feed => parseFloat(feed[`field${config.field}`]))
                    .filter(v => !isNaN(v));
                
                if (values.length > 0) {
                    minValue = Math.min(...values);
                    maxValue = Math.max(...values);
                    totalValues = values.reduce((sum, v) => sum + v, 0);
                    totalCount = values.length;
                    currentValue = values[values.length - 1];
                }
            }
        }
        
        // Calculate average
        avgValue = totalCount > 0 ? totalValues / totalCount : 0;
        
        // Set fallbacks for invalid values
        if (minValue === Infinity) minValue = 0;
        if (maxValue === -Infinity) maxValue = 0;
        
        return {
            minValue,
            maxValue,
            avgValue,
            currentValue
        };
    },
    
    /**
     * Update the chart statistics display
     * @private
     * @param {string} chartId - Chart ID
     * @param {Object} statsData - Statistics data
     * @param {boolean} isMultiSeries - Whether this is a multi-series chart
     * @param {string} unit - Display unit
     * @param {Object} config - Chart configuration for formatting
     * @returns {void}
     */
    _updateChartStats: function(chartId, statsData, isMultiSeries, unit = '', config) {
        const statsEl = document.getElementById(`stats-${chartId}`);
        if (!statsEl) return;
        
        const { minValue, maxValue, avgValue, currentValue } = statsData;
        
        // Get translated labels
        let lowLabel = 'L';
        let avgLabel = 'A';
        let highLabel = 'H';
        let nowLabel = 'N';
        
        if (window.I18n && typeof window.I18n.translate === 'function') {
            const lowTranslation = window.I18n.translate('low');
            const avgTranslation = window.I18n.translate('avg');
            const highTranslation = window.I18n.translate('high');
            const nowTranslation = window.I18n.translate('now');
            
            lowLabel = lowTranslation && lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L';
            avgLabel = avgTranslation && avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A';
            highLabel = highTranslation && highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H';
            nowLabel = nowTranslation && nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N';
        }
        
        // Format values appropriately
        const range = maxValue - minValue;
        
        // Determine formatting based on config and range
        const formatNumber = (val) => {
            if (val === null || val === undefined || isNaN(val)) return '—';
            
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
            
            // Format based on range and configuration
            if (useInteger || range >= 10) {
                return Math.round(val).toString();
            } else if (range < 1 || Math.abs(val) < 1) {
                return parseFloat(val.toFixed(3)).toFixed(2);
            } else if (Math.abs(val) < 10) {
                return parseFloat(val.toFixed(3)).toFixed(1);
            } else {
                return Math.round(parseFloat(val.toFixed(3))).toString();
            }
        };
        
        // Build stats HTML
        statsEl.innerHTML = `
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${lowLabel}:</span>
                    <span class="chart-stat-label-low"></span>
                </span>${formatNumber(minValue)}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${avgLabel}:</span>
                    <span class="chart-stat-label-avg"></span>
                </span>${formatNumber(avgValue)}${unit}
            </div>
            <div class="chart-stat">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${highLabel}:</span>
                    <span class="chart-stat-label-high"></span>
                </span>${formatNumber(maxValue)}${unit}
            </div>
            ${!isMultiSeries ? `
            <div class="chart-stat chart-stat-current">
                <span class="chart-stat-label">
                    <span class="chart-stat-label-short">${nowLabel}:</span>
                    <span class="chart-stat-label-now"></span>
                </span>${currentValue !== null ? formatNumber(currentValue) + unit : '—'}
            </div>
            ` : ''}
        `;
        
        // Apply visibility based on user preference
        const statsVisible = localStorage.getItem('statsVisible') !== 'false';
        statsEl.style.display = statsVisible ? 'flex' : 'none';
    },
    
    /**
     * Fetch data for a chart
     * @private
     * @param {Object} config - Chart configuration
     * @param {number} range - Date range in days
     * @param {number} results - Maximum number of results
     * @returns {Promise} Promise that resolves with chart data
     */
    _fetchChartData: function(config, range, results) {
        // Use data_components.js for fetching if available
        if (window.DataComponents && typeof window.DataComponents.fetchChartData === 'function') {
            return window.DataComponents.fetchChartData(config, range, results);
        } else if (window.fetchChartData && typeof window.fetchChartData === 'function') {
            return window.fetchChartData(config, range, results);
        } else {
            return Promise.reject(new Error('No data fetching function available'));
        }
    },
    
    /**
     * Set up event handlers
     * @private
     * @returns {void}
     */
    _setupEventHandlers: function() {
        // Handle window resize
        window.removeEventListener('resize', this._handleResize);
        window.addEventListener('resize', this._handleResize.bind(this));
    },
    
    /**
     * Resize event handler
     * @private
     * @param {Event} event - Resize event
     * @returns {void}
     */
    _handleResize: function(event) {
        const wasMobile = this._state.isMobile;
        const isMobile = window.innerWidth <= this._config.mobileBreakpoint;
        
        // Update state
        this._state.isMobile = isMobile;
        
        // Check if layout mode has changed
        if (wasMobile !== isMobile) {
            // Layout mode change requires full refresh
            this.refreshAllCharts();
        } else {
            // Otherwise just resize charts
            if (window.ChartFactory) {
                window.ChartFactory.resizeAll();
            }
        }
    },
    
    // _getURLParameter function removed - using Utils.getURLParameter directly instead
};

// Export for browser context
if (typeof window !== 'undefined') {
    window.ChartLoader = ChartLoader;
}