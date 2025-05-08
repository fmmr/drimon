/**
 * Data Components
 * 
 * This file contains reusable components for data handling in DriMon.
 * Functions for fetching, processing, and transforming data from the ThingSpeak API.
 */

// Timezone configuration
const DEFAULT_TIMEZONE = "Europe/Oslo";
const DEFAULT_RESULTS = 8000;

// Simple in-memory cache for chart data
const dataCache = {
    cache: {},
    
    /**
     * Generate a cache key for a specific request
     * @param {Object} config - Chart configuration
     * @param {string} range - Date range
     * @param {number} results - Maximum results
     * @returns {string} - Cache key
     */
    generateKey: function(config, range, results) {
        // Create a unique key based on chart ID, range and results
        return `${config.id}_${range}_${results}`;
    },
    
    /**
     * Store data in cache with expiration
     * @param {string} key - Cache key
     * @param {Object} data - Chart data
     */
    set: function(key, data) {
        // Cache data with timestamp
        this.cache[key] = {
            data: data,
            timestamp: Date.now(),
            expires: Date.now() + 60000 // Cache for 1 minute
        };
    },
    
    /**
     * Get data from cache if valid
     * @param {string} key - Cache key
     * @returns {Object|null} - Cached data or null if not found/expired
     */
    get: function(key) {
        const entry = this.cache[key];
        
        // Return null if entry doesn't exist or is expired
        if (!entry || Date.now() > entry.expires) {
            return null;
        }
        
        // Return cached data
        return entry.data;
    },
    
    /**
     * Clear the entire cache or a specific entry
     * @param {string} [key] - Optional key to clear specific entry
     */
    clear: function(key) {
        if (key) {
            delete this.cache[key];
        } else {
            this.cache = {};
        }
    }
};

/**
 * Fetches chart data from ThingSpeak API based on configuration
 * @param {Object} config - Chart configuration object
 * @param {string|number} range - Date range string or number of days
 * @param {number} results - Maximum number of results to fetch
 * @returns {Promise<Object>} - Chart data object
 */
async function fetchChartData(config, range = 1, results = DEFAULT_RESULTS) {
    // Handle 'default' range by using the chart's defaultRange or falling back to 1
    if (range === 'default') {
        range = config.defaultRange || 1;
    }
    
    // Check if we have cached data
    const cacheKey = dataCache.generateKey(config, range, results);
    const cachedData = dataCache.get(cacheKey);
    
    // Return cached data if available
    if (cachedData) {
        return cachedData;
    }
    
    // Get date range either from range parameter or URL
    let startDateStr, endDateStr;
    
    if (typeof range === 'string') {
        const dateRange = getDateRange(range);
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
    } else if (typeof range === 'number') {
        // Backward compatibility for numeric ranges
        const dateRange = getDateRange(range.toString());
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
    } else {
        // Default to last 24 hours
        const now = moment();
        const format = 'YYYY-MM-DD HH:mm:ss';
        startDateStr = now.subtract(1, 'days').format(format);
        endDateStr = '';
    }
    
    // Use the start date from the configuration if specified and we're using 'start' range
    if (range === 'start' && config.startDate) {
        startDateStr = config.startDate;
    }
    
    // Fetch data
    const data = await fetchTimeRangeData(config, startDateStr, endDateStr, results);
    
    // Cache the data if valid
    if (data && data.feeds && data.feeds.length > 0) {
        dataCache.set(cacheKey, data);
    }
    
    return data;
}

/**
 * Fetches data for a specific time range
 * @param {Object} config - Chart configuration
 * @param {string} startDateStr - Start date string
 * @param {string} endDateStr - End date string
 * @param {number} results - Maximum number of results
 * @returns {Promise<Object>} - Processed data object
 */
async function fetchTimeRangeData(config, startDateStr, endDateStr, results = DEFAULT_RESULTS) {
    // Check if this is a multi-series chart
    if (config.series && Array.isArray(config.series)) {
        // Fetch data for all series in parallel
        try {
            const seriesPromises = config.series.map(series => {
                return fetchSingleSeries(
                    series.channel, 
                    series.field,
                    startDateStr,
                    endDateStr,
                    results
                );
            });
            
            // Wait for all series data to be fetched
            const seriesData = await Promise.all(seriesPromises);
            
            // Format into a single data structure with multiple series
            const combinedData = {
                chart_id: config.id,
                series: seriesData.map((data, index) => ({
                    title: config.series[index].title,
                    titleKey: config.series[index].titleKey, // Include titleKey for translation
                    channel: config.series[index].channel,
                    field: config.series[index].field,
                    color: config.series[index].color,
                    axis: config.series[index].axis, // Include axis information
                    feeds: data.feeds
                })),
                feeds: seriesData[0].feeds, // Use first series for timestamps
                is_multi_series: true,
                secondYAxis: config.secondYAxis // Pass along second y-axis config
            };
            
            return combinedData;
        } catch (error) {
            // Failed to fetch multi-series data
            return {
                chart_id: config.id,
                series: [],
                feeds: [],
                is_multi_series: true
            };
        }
    } else {
        // Single series - use original code
        return fetchSingleSeries(
            config.channel, 
            config.field, 
            startDateStr, 
            endDateStr, 
            results,
            config.title
        );
    }
}

/**
 * Fetches data for a single data series
 * @param {number} channel - ThingSpeak channel ID
 * @param {number} field - Field number to fetch
 * @param {string} startDateStr - Start date
 * @param {string} endDateStr - End date
 * @param {number} results - Maximum results
 * @param {string} title - Optional title
 * @returns {Promise<Object>} - ThingSpeak API response
 */
async function fetchSingleSeries(channel, field, startDateStr, endDateStr, results, title = "") {
    // Check if DataRequestManager is available (should be loaded in index.html)
    if (window.DataRequestManager) {
        // Use optimized request manager
        return window.DataRequestManager.fetchData({
            channel,
            field,
            start: startDateStr,
            end: endDateStr,
            results,
            timezone: DEFAULT_TIMEZONE,
            title
        });
    } else {
        // Fallback to original implementation if DataRequestManager isn't available
        
        // Build API URL with appropriate parameters
        let url = `https://api.thingspeak.com/channels/${channel}/fields/${field}.json?timezone=${DEFAULT_TIMEZONE}&results=${results}`;
        
        if (startDateStr) {
            url += `&start=${encodeURIComponent(startDateStr)}`;
        }
        
        if (endDateStr) {
            url += `&end=${encodeURIComponent(endDateStr)}`;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            // Failed to fetch data - return empty data structure rather than null to avoid further errors
            return {
                channel: channel,
                field: field,
                feeds: []
            };
        }
    }
}

/**
 * Processes raw data into the format needed for charts
 * @param {Object} config - Chart configuration
 * @param {Object} data - Raw data from ThingSpeak API
 * @returns {Object} - Processed data ready for chart rendering
 */
function processChartData(config, data) {
    // Check if we have valid data
    if (!data || !data.feeds || data.feeds.length === 0) {
        return {
            valid: false,
            message: 'Ingen data tilgjengelig'
        };
    }
    
    let datasets = [];
    let filteredValues = [];
    let timestamps = [];
    let minValue = Infinity;
    let maxValue = -Infinity;
    let avgValue = 0;
    let hasNegativeValues = false;
    let secondaryAxisValues = [];
    
    // Check if we need to apply data transformation
    const dataTransform = config.dataTransform || null;
    
    // Process multi-series data
    if (data.is_multi_series) {
        if (!data.series || data.series.length === 0 || data.series[0].feeds.length === 0) {
            return {
                valid: false,
                message: 'Ingen gyldige dataverdier'
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
                seriesValues = applyDataTransformation(seriesValues, dataTransform);
            }
            
            const seriesFiltered = seriesValues.filter(v => !isNaN(v));
            
            // Skip empty series
            if (seriesFiltered.length === 0) return;
            
            // Check for negative values
            if (seriesFiltered.some(v => v < 0)) {
                hasNegativeValues = true;
            }
            
            // Track values for second axis if needed
            if (series.axis === 'y1') {
                secondaryAxisValues = secondaryAxisValues.concat(seriesFiltered);
            }
            
            // Update min/max values
            const seriesMin = Math.min(...seriesFiltered);
            const seriesMax = Math.max(...seriesFiltered);
            minValue = Math.min(minValue, seriesMin);
            maxValue = Math.max(maxValue, seriesMax);
            
            // Add to filtered values for overall stats
            filteredValues = filteredValues.concat(seriesFiltered);
            
            // Create dataset for this series
            const yAxisID = series.axis || 'y';
            
            // Use titleKey for translation if available
            let label = series.title;
            if (series.titleKey && window.I18n && typeof window.I18n.translate === 'function') {
                label = window.I18n.translate(series.titleKey);
            }
            
            datasets.push({
                label: label,
                data: seriesValues,
                borderColor: series.color,
                backgroundColor: `${series.color}20`,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                fill: false,
                tension: 0.1,
                yAxisID: yAxisID, // Explicitly set the y-axis ID
                titleKey: series.titleKey // Store titleKey for future translation updates
            });
        });
    } else {
        // Handle single series data
        let values = data.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
        
        // Apply data transformation if configured
        if (dataTransform) {
            values = applyDataTransformation(values, dataTransform);
        }
        
        hasNegativeValues = values.some(v => v < 0);
        
        // Calculate data range for better scaling
        filteredValues = values.filter(v => !isNaN(v));
        
        if (filteredValues.length === 0) {
            return {
                valid: false,
                message: 'Ingen gyldige dataverdier'
            };
        }
        
        minValue = Math.min(...filteredValues);
        maxValue = Math.max(...filteredValues);
        
        // Store timestamps for cross-chart syncing
        timestamps = data.feeds.map(feed => feed.created_at);
        
        // Create dataset for single series
        // Use titleKey for translation if available
        let label = config.title;
        if (config.titleKey && window.I18n && typeof window.I18n.translate === 'function') {
            label = window.I18n.translate(config.titleKey);
        }
        
        datasets.push({
            label: label,
            data: values,
            borderColor: config.color,
            backgroundColor: hasNegativeValues ? 'rgba(0,0,0,0)' : `${config.color}20`,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: !hasNegativeValues,
            tension: 0.1,
            yAxisID: 'y', // Always use primary y-axis for single series
            titleKey: config.titleKey // Store titleKey for future translation updates
        });
    }
    
    /**
     * Applies data transformations to an array of values
     * 
     * Supported transformations:
     * - shiftBy: Number - Shifts all data points by the specified amount
     * 
     * Example config:
     * ```javascript
     * dataTransform: {
     *   shiftBy: -63  // Shift all values down by 63 units
     * }
     * ```
     * 
     * @param {number[]} values - Array of data values
     * @param {Object} transform - Transformation configuration
     * @returns {number[]} - Transformed values
     */
    function applyDataTransformation(values, transform) {
        if (!values || !Array.isArray(values) || !transform) {
            return values;
        }
        
        return values.map(value => {
            if (isNaN(value)) return value;
            
            // Apply shift transformation
            if (transform.shiftBy !== undefined) {
                return value + transform.shiftBy;
            }
            
            // Can add more transformation types here in the future
            
            return value;
        });
    }
    
    // Calculate average across all series
    const sum = filteredValues.reduce((acc, val) => acc + val, 0);
    avgValue = filteredValues.length > 0 ? sum / filteredValues.length : 0;
    
    // Add 5% padding to min/max values to prevent data points from touching edges
    const range = maxValue - minValue;
    
    // Handle case where min and max are identical or very small range
    const paddingAmount = range < 0.1 ? (Math.abs(minValue) * 0.05 || 0.1) : range * 0.05;
    
    // Don't go below zero for non-negative data sets
    const paddedMinValue = hasNegativeValues ? minValue - paddingAmount : Math.max(0, minValue - paddingAmount);
    const paddedMaxValue = maxValue + paddingAmount;
    
    // Secondary axis ranges
    let secondaryAxisMin, secondaryAxisMax;
    if (secondaryAxisValues.length > 0) {
        secondaryAxisMin = Math.min(...secondaryAxisValues);
        secondaryAxisMax = Math.max(...secondaryAxisValues);
        
        // Add 5% padding
        const secondaryPadding = (secondaryAxisMax - secondaryAxisMin) * 0.05;
        secondaryAxisMin = Math.max(0, secondaryAxisMin - secondaryPadding);
        secondaryAxisMax = secondaryAxisMax + secondaryPadding;
    }
    
    // Apply chart config minimum value if provided
    let adjustedMinValue = config.minValue !== undefined ? 
                           Math.max(config.minValue, minValue) : 
                           minValue;
    
    // Current value (for single series charts)
    const currentValue = filteredValues.length > 0 ? 
                         filteredValues[filteredValues.length - 1] : 
                         null;
    
    return {
        valid: true,
        chartId: config.id,
        timestamps: timestamps,
        datasets: datasets,
        filteredValues: filteredValues,
        minValue: minValue,
        maxValue: maxValue,
        avgValue: avgValue,
        adjustedMinValue: adjustedMinValue,
        currentValue: currentValue,
        paddedMinValue: paddedMinValue,
        paddedMaxValue: paddedMaxValue,
        hasNegativeValues: hasNegativeValues,
        isMultiSeries: data.is_multi_series,
        secondaryAxisMin: secondaryAxisMin,
        secondaryAxisMax: secondaryAxisMax,
        series: data.series, // Pass through series data for multi-series charts
        category: config.category,
        unit: config.unit || ''
    };
}

/**
 * Gets date range start and end dates based on range code
 * @param {string} range - Range code or number of days
 * @returns {Object} - Object with startDate and endDate
 */
function getDateRange(range) {
    const now = moment();
    const format = 'YYYY-MM-DD HH:mm:ss';
    
    switch (range) {
        case 'today':
            // Just today, from midnight to now
            return {
                startDate: now.clone().startOf('day').format(format),
                endDate: now.format(format)
            };
            
        case 'yesterday':
            // Just yesterday, full day
            return {
                startDate: now.clone().subtract(1, 'days').startOf('day').format(format),
                endDate: now.clone().subtract(1, 'days').endOf('day').format(format)
            };
            
        case 'this-week':
            // This week, from Monday midnight to now
            return {
                startDate: now.clone().startOf('isoWeek').format(format),
                endDate: now.format(format)
            };
            
        case 'last-week':
            // Last week, full week Monday-Sunday
            return {
                startDate: now.clone().subtract(1, 'weeks').startOf('isoWeek').format(format),
                endDate: now.clone().subtract(1, 'weeks').endOf('isoWeek').format(format)
            };
            
        case 'start':
            // From the beginning of data collection to now
            const startOfData = now.clone().subtract(60, 'days'); // Use 60 days ago as start date
            return {
                startDate: startOfData.format(format),
                endDate: now.format(format)
            };
            
        default:
            // If it's a number, interpret as number of days ago to now
            const days = parseInt(range);
            if (!isNaN(days)) {
                return {
                    startDate: now.clone().subtract(days, 'days').format(format),
                    endDate: now.format(format)
                };
            } else {
                // Default to last 24 hours
                return {
                    startDate: now.clone().subtract(1, 'days').format(format),
                    endDate: now.format(format)
                };
            }
    }
}


/**
 * Determines whether a chart should use integer values
 * @param {Object} config - Chart configuration
 * @returns {boolean} - True if chart should use only integers
 */
function shouldUseIntegerValues(config) {
    // First check for formatting configuration (preferred)
    if (config && config.formatting && config.formatting.useIntegerFormat !== undefined) {
        return config.formatting.useIntegerFormat;
    }
    
    // Check for direct property configuration
    if (config && config.useIntegerFormat !== undefined) {
        return config.useIntegerFormat;
    }
    
    // Missing formatting configuration - use default
    
    // Default to false - decimal formatting
    return false;
}

/**
 * Formats a number for display, selecting appropriate precision
 * @param {number} value - Number to format
 * @param {Object} config - Chart configuration
 * @param {number} range - Range of values in the chart
 * @returns {string} - Formatted number string
 */
function formatChartNumber(value, config, range) {
    // Check for NaN or null values
    if (value === null || value === undefined || isNaN(value)) {
        return '—';
    }
    
    // First check for explicit decimal places configuration (preferred approach)
    if (config && config.formatting && config.formatting.decimalPlaces !== undefined) {
        return parseFloat(value.toFixed(3)).toFixed(config.formatting.decimalPlaces);
    }
    
    // Check if we should use integer format based on configuration
    if (shouldUseIntegerValues(config)) {
        return Math.round(value).toString();
    }
    
    // If no explicit formatting config, use sensible defaults
    
    // Default formatting based on value range
    if (range >= 10) {
        return Math.round(value).toString(); // Integer for large ranges
    } else if (range < 1 || Math.abs(value) < 1) {
        return parseFloat(value.toFixed(3)).toFixed(2); // 2 decimal places for very small ranges/values
    } else {
        return parseFloat(value.toFixed(3)).toFixed(1); // 1 decimal place for medium values
    }
}

// Export functions
if (typeof window !== 'undefined') {
    // Browser environment
    window.DataComponents = {
        fetchChartData,
        fetchTimeRangeData,
        fetchSingleSeries,
        processChartData,
        getDateRange,
        shouldUseIntegerValues,
        formatChartNumber
    };
}