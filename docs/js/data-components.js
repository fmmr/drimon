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
                    seriesResults,
                    series.title,
                    series.dataFilter
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
        // Single series - use original code, pass dataFilter from first series if available
        const dataFilter = (config.series && config.series[0] && config.series[0].dataFilter) || null;
        return fetchSingleSeries(
            config.channel, 
            config.field, 
            startDateStr, 
            endDateStr, 
            results,
            config.title,
            dataFilter
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
 * @param {Object} dataFilter - Optional data filtering config
 * @returns {Promise<Object>} - ThingSpeak API response
 */
async function fetchSingleSeries(channel, field, startDateStr, endDateStr, results, title = "", dataFilter = null) {
    let data;
    
    // Check if DataRequestManager is available (should be loaded in index.html)
    if (window.DataRequestManager) {
        // Use optimized request manager
        data = await window.DataRequestManager.fetchData({
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
            
            data = await response.json();
        } catch (error) {
            // Failed to fetch data - return empty data structure rather than null to avoid further errors
            data = {
                channel: channel,
                field: field,
                feeds: []
            };
        }
    }
    
    // Apply data filtering if configured
    if (dataFilter && data && data.feeds && Array.isArray(data.feeds)) {
        const fieldName = `field${field}`;
        data.feeds = data.feeds.filter(feed => {
            const rawValue = feed[fieldName];
            if (rawValue === null || rawValue === undefined || rawValue === '') {
                return false;
            }
            
            const numValue = parseFloat(rawValue);
            if (isNaN(numValue)) {
                return false;
            }
            // Check exclude list - handle both exact matches and rounded values
            if (dataFilter.exclude && dataFilter.exclude.length > 0) {
                for (const excludeValue of dataFilter.exclude) {
                    if (Math.abs(numValue - excludeValue) < 0.001) {
                        return false;
                    }
                }
            }
            
            // Check min threshold
            if (dataFilter.min !== undefined && numValue < dataFilter.min) {
                return false;
            }
            
            // Check max threshold
            if (dataFilter.max !== undefined && numValue > dataFilter.max) {
                return false;
            }
            
            return true;
        });
    }
    
    return data;
}

/**
 * Processes raw data into the format needed for charts
 * @param {Object} config - Chart configuration
 * @param {Object} data - Raw data from ThingSpeak API
 * @returns {Object} - Processed data ready for chart rendering
 */


// Export functions
if (typeof window !== 'undefined') {
    // Browser environment
    window.DataComponents = {
        fetchChartData
    };
}