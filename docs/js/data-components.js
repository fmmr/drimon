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
    // Handle 'default' range by using the chart's defaultRange
    if (range === 'default') {
        range = config.defaultRange;
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

    if (typeof range === 'string' || typeof range === 'number') {
        // Use centralized DateUtils implementation for all range types
        const dateRange = window.DateUtils.getDateRange(range);
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
    } else {
        // Default to last 24 hours (should not occur with proper input)
        const now = moment();
        const format = window.DateUtils.format;
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
                // Use extraResults if specified in the series config
                const seriesResults = series.extraResults || results;
                return fetchSingleSeries(
                    series.channel,
                    series.field,
                    startDateStr,
                    endDateStr,
                    seriesResults
                );
            });
            
            // Wait for all series data to be fetched
            const seriesData = await Promise.all(seriesPromises);
            
            // Format into a single data structure with multiple series

            // Find the common time range across all series for synchronization
            let allTimestamps = [];

            // Collect all unique timestamps from all series
            seriesData.forEach(data => {
                if (data.feeds && data.feeds.length > 0) {
                    const timestamps = data.feeds.map(feed => feed.created_at);
                    allTimestamps = allTimestamps.concat(timestamps);
                }
            });

            // Sort timestamps and remove duplicates
            allTimestamps = [...new Set(allTimestamps)].sort();

            // Create an object with timestamps as keys for quick lookup
            const timestampMap = {};
            allTimestamps.forEach(timestamp => {
                timestampMap[timestamp] = { created_at: timestamp };
            });

            // For each series, find data for each timestamp or null if missing
            const syncedSeries = seriesData.map((data, index) => {
                const series = config.series[index];
                const fieldName = `field${series.field}`;

                // Create a map of timestamps to values for quick lookup
                const valueMap = {};
                if (data.feeds && data.feeds.length > 0) {
                    data.feeds.forEach(feed => {
                        valueMap[feed.created_at] = feed[fieldName];
                    });
                }

                // Create optimized feeds for this series
                let syncedFeeds;

                // Use common timestamps for synchronization
                syncedFeeds = allTimestamps.map(timestamp => {
                    return {
                        created_at: timestamp,
                        [fieldName]: valueMap[timestamp] || null
                    };
                });

                return {
                    title: series.title,
                    titleKey: series.titleKey,
                    channel: series.channel,
                    field: series.field,
                    color: series.color,
                    axis: series.axis,
                    feeds: syncedFeeds
                };
            });

            // Create combined feeds with all timestamps for reference
            const combinedFeeds = allTimestamps.map(timestamp => {
                return { created_at: timestamp };
            });

            const combinedData = {
                chart_id: config.id,
                series: syncedSeries,
                feeds: combinedFeeds,
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


// Export functions
if (typeof window !== 'undefined') {
    // Browser environment
    window.DataComponents = {
        fetchChartData,
        fetchTimeRangeData,
        fetchSingleSeries,
        processChartData,
        clearCache: () => dataCache.clear()
    };
}