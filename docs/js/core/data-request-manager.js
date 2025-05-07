/**
 * @file data-request-manager.js
 * @description Request optimization system for data fetching
 * 
 * This module provides efficient request management including:
 * 1. Request throttling - Limiting the number of concurrent requests
 * 2. Request batching - Combining similar requests when possible
 * 3. Request debouncing - Preventing duplicate requests in quick succession
 * 4. Payload optimization - Minimizing data transfer
 */

'use strict';

/**
 * @namespace DataRequestManager
 * @description Manages and optimizes API requests for chart data
 */
window.DataRequestManager = window.DataRequestManager || {
    /**
     * Configuration settings
     */
    config: {
        // Maximum concurrent requests to ThingSpeak API
        maxConcurrentRequests: 4,
        
        // Debounce timeframe (ms) - requests within this window are combined
        debounceTimeframe: 100,
        
        // Batching enabled - combine similar requests when possible
        batchingEnabled: true,
        
        // Request throttling enabled - limit concurrent requests
        throttlingEnabled: true,
        
        // Request cache time (ms) - how long to cache request results
        cacheTime: 60000, // 1 minute
        
        // Debug mode - log detailed information about request optimization
        debug: false
    },
    
    /**
     * Internal state
     */
    state: {
        // Request queue for pending requests
        requestQueue: [],
        
        // Active request count for throttling
        activeRequests: 0,
        
        // Cache of previous requests and responses
        cache: {},
        
        // Request counters for statistics
        stats: {
            totalRequests: 0,
            batchedRequests: 0,
            cachedResponses: 0,
            throttledRequests: 0,
            debouncedRequests: 0,
            errors: 0
        },
        
        // Pending batch requests by channel and timeframe
        pendingBatches: {},
        
        // Map of request IDs to their promises for debouncing
        pendingPromises: {}
    },
    
    /**
     * Initialize the request manager with custom configuration
     * @param {Object} customConfig - Custom configuration options to override defaults
     */
    initialize: function(customConfig = {}) {
        // Merge custom configuration with defaults
        this.config = {
            ...this.config,
            ...customConfig
        };
        
        // Log initialization in debug mode
        if (this.config.debug) {
            console.log('DataRequestManager initialized with config:', this.config);
        }
        
        // Set up automatic cache cleanup
        setInterval(() => this.cleanupCache(), 300000); // Clean every 5 minutes
    },
    
    /**
     * Fetches data with request optimization
     * @param {Object} options - Request options
     * @param {number} options.channel - ThingSpeak channel ID
     * @param {number} options.field - Field to fetch
     * @param {string} options.start - Start date/time
     * @param {string} options.end - End date/time
     * @param {number} options.results - Maximum results
     * @param {string} options.timezone - Timezone for results
     * @param {Object} options.config - Original chart config for reference
     * @returns {Promise<Object>} - Data response
     */
    fetchData: function(options) {
        // Generate request ID based on parameters
        const requestId = this.generateRequestId(options);
        
        // Check if this exact request is already in progress
        if (this.state.pendingPromises[requestId]) {
            this.state.stats.debouncedRequests++;
            if (this.config.debug) {
                console.log(`Debounced duplicate request: ${requestId}`);
            }
            return this.state.pendingPromises[requestId];
        }
        
        // Check cache first
        const cachedResponse = this.getCachedResponse(requestId);
        if (cachedResponse) {
            this.state.stats.cachedResponses++;
            if (this.config.debug) {
                console.log(`Using cached response for: ${requestId}`);
            }
            return Promise.resolve(cachedResponse);
        }
        
        // Create a new promise for this request
        const requestPromise = new Promise((resolve, reject) => {
            // Add request to queue
            this.state.requestQueue.push({
                options,
                requestId,
                resolve,
                reject,
                timeAdded: Date.now()
            });
            
            this.state.stats.totalRequests++;
            
            // Process queue (will respect throttling)
            this.processQueue();
        });
        
        // Store promise reference for debouncing
        this.state.pendingPromises[requestId] = requestPromise;
        
        // Set timeout to remove from pending promises to prevent memory leaks
        setTimeout(() => {
            delete this.state.pendingPromises[requestId];
        }, 60000); // Remove after 1 minute to prevent debouncing becoming a memory leak
        
        return requestPromise;
    },
    
    /**
     * Process the request queue with throttling
     */
    processQueue: function() {
        // If throttling is disabled, process all requests immediately
        if (!this.config.throttlingEnabled) {
            while (this.state.requestQueue.length > 0) {
                const request = this.state.requestQueue.shift();
                this.executeRequest(request);
            }
            return;
        }
        
        // Check for batching opportunities before processing
        if (this.config.batchingEnabled) {
            this.attemptBatching();
        }
        
        // Process requests up to the concurrent limit
        while (
            this.state.requestQueue.length > 0 && 
            this.state.activeRequests < this.config.maxConcurrentRequests
        ) {
            const request = this.state.requestQueue.shift();
            this.state.activeRequests++;
            
            if (this.state.activeRequests >= this.config.maxConcurrentRequests) {
                this.state.stats.throttledRequests++;
                if (this.config.debug) {
                    console.log(`Throttling engaged: ${this.state.activeRequests} active requests`);
                }
            }
            
            this.executeRequest(request)
                .finally(() => {
                    this.state.activeRequests--;
                    // After completing a request, try to process more from the queue
                    this.processQueue();
                });
        }
    },
    
    /**
     * Execute a single request
     * @param {Object} request - Request object with options and callbacks
     * @returns {Promise<Object>} - Response data
     */
    executeRequest: async function(request) {
        const { options, requestId, resolve, reject } = request;
        
        // Build API URL
        let url = `https://api.thingspeak.com/channels/${options.channel}/fields/${options.field}.json`;
        url += this.buildQueryParams(options);
        
        try {
            if (this.config.debug) {
                console.log(`Executing request: ${url}`);
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Store in cache
            this.cacheResponse(requestId, data);
            
            // Resolve the promise with the data
            resolve(data);
            return data;
        } catch (error) {
            this.state.stats.errors++;
            console.error(`Error fetching data for request ${requestId}:`, error);
            
            // Create a fallback response to avoid cascading failures
            const fallbackData = {
                channel: options.channel,
                field: options.field,
                feeds: []
            };
            
            // Still resolve with empty data structure rather than rejecting
            // This prevents cascading failures in the UI
            resolve(fallbackData);
            return fallbackData;
        }
    },
    
    /**
     * Attempts to batch similar requests to reduce API calls
     */
    attemptBatching: function() {
        // Skip if no requests to batch
        if (this.state.requestQueue.length < 2) return;
        
        // Group requests by channel
        const requestsByChannel = {};
        
        // First pass: group by channel
        this.state.requestQueue.forEach(request => {
            const channel = request.options.channel;
            if (!requestsByChannel[channel]) {
                requestsByChannel[channel] = [];
            }
            requestsByChannel[channel].push(request);
        });
        
        // Second pass: for each channel, look for requests with the same timeframe
        Object.keys(requestsByChannel).forEach(channel => {
            const channelRequests = requestsByChannel[channel];
            
            // Skip if only one request for this channel
            if (channelRequests.length < 2) return;
            
            // Group by similar timeframes
            const requestsByTimeframe = {};
            
            channelRequests.forEach(request => {
                const timeKey = `${request.options.start}_${request.options.end}_${request.options.results}`;
                if (!requestsByTimeframe[timeKey]) {
                    requestsByTimeframe[timeKey] = [];
                }
                requestsByTimeframe[timeKey].push(request);
            });
            
            // For each timeframe group with multiple requests, batch them
            Object.keys(requestsByTimeframe).forEach(timeKey => {
                const requests = requestsByTimeframe[timeKey];
                
                // Only batch if multiple requests share the same timeframe
                if (requests.length < 2) return;
                
                // Remove these requests from the queue as we'll handle them specially
                this.state.requestQueue = this.state.requestQueue.filter(r => 
                    !requests.includes(r)
                );
                
                // Create field list for multi-field request
                const fields = requests.map(r => r.options.field).join(',');
                
                // Create master request with all fields
                const masterRequest = {
                    ...requests[0],
                    options: {
                        ...requests[0].options,
                        fields: fields
                    }
                };
                
                // Execute the batched request
                this.executeBatchedRequest(masterRequest, requests);
                
                this.state.stats.batchedRequests += requests.length - 1;
                
                if (this.config.debug) {
                    console.log(`Batched ${requests.length} requests for channel ${channel} timeframe ${timeKey}`);
                }
            });
        });
    },
    
    /**
     * Executes a batched request and distributes results to original requesters
     * @param {Object} masterRequest - Combined request with multiple fields
     * @param {Array<Object>} originalRequests - List of original individual requests
     */
    executeBatchedRequest: async function(masterRequest, originalRequests) {
        try {
            // Increment active requests count
            this.state.activeRequests++;
            
            // Build batched API URL with all fields
            const options = masterRequest.options;
            let url = `https://api.thingspeak.com/channels/${options.channel}/feeds.json`;
            url += this.buildQueryParams(options);
            
            if (this.config.debug) {
                console.log(`Executing batched request: ${url}`);
            }
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Distribute results to each original request
            originalRequests.forEach(request => {
                const field = request.options.field;
                const fieldKey = `field${field}`;
                
                // Extract just this field's data from the combined response
                const fieldData = {
                    channel: data.channel,
                    field: field,
                    feeds: data.feeds.map(feed => ({
                        ...feed,
                        [fieldKey]: feed[fieldKey]
                    }))
                };
                
                // Cache individual response
                this.cacheResponse(request.requestId, fieldData);
                
                // Resolve the original promise
                request.resolve(fieldData);
            });
        } catch (error) {
            this.state.stats.errors++;
            console.error(`Error executing batched request:`, error);
            
            // Create fallback responses for all original requests
            originalRequests.forEach(request => {
                const fallbackData = {
                    channel: request.options.channel,
                    field: request.options.field,
                    feeds: []
                };
                request.resolve(fallbackData);
            });
        } finally {
            // Decrement active requests count
            this.state.activeRequests--;
            
            // Check if we can process more from the queue
            this.processQueue();
        }
    },
    
    /**
     * Build query parameters for ThingSpeak API request
     * @param {Object} options - Request options
     * @returns {string} - Query string
     */
    buildQueryParams: function(options) {
        const params = new URLSearchParams();
        
        if (options.timezone) {
            params.append('timezone', options.timezone);
        } else {
            params.append('timezone', 'Europe/Oslo'); // Default timezone
        }
        
        if (options.results) {
            params.append('results', options.results);
        }
        
        if (options.start) {
            params.append('start', options.start);
        }
        
        if (options.end) {
            params.append('end', options.end);
        }
        
        // If this is a batched request with multiple fields
        if (options.fields) {
            // Nothing needed here, feeds.json endpoint returns all fields
        }
        
        return `?${params.toString()}`;
    },
    
    /**
     * Generate a unique request ID based on parameters
     * @param {Object} options - Request options
     * @returns {string} - Unique request ID
     */
    generateRequestId: function(options) {
        return `${options.channel}_${options.field}_${options.start || 'nostart'}_${options.end || 'noend'}_${options.results || 8000}`;
    },
    
    /**
     * Cache a response for future use
     * @param {string} requestId - Request identifier
     * @param {Object} data - Response data
     */
    cacheResponse: function(requestId, data) {
        this.state.cache[requestId] = {
            data: data,
            timestamp: Date.now(),
            expires: Date.now() + this.config.cacheTime
        };
    },
    
    /**
     * Get cached response if available and not expired
     * @param {string} requestId - Request identifier
     * @returns {Object|null} - Cached response or null
     */
    getCachedResponse: function(requestId) {
        const entry = this.state.cache[requestId];
        
        if (!entry || Date.now() > entry.expires) {
            return null;
        }
        
        return entry.data;
    },
    
    /**
     * Clean up expired cache entries to prevent memory leaks
     */
    cleanupCache: function() {
        const now = Date.now();
        let expiredCount = 0;
        
        Object.keys(this.state.cache).forEach(key => {
            if (now > this.state.cache[key].expires) {
                delete this.state.cache[key];
                expiredCount++;
            }
        });
        
        if (this.config.debug && expiredCount > 0) {
            console.log(`Cleaned up ${expiredCount} expired cache entries`);
        }
    },
    
    /**
     * Get statistics about request optimization
     * @returns {Object} - Statistics object
     */
    getStatistics: function() {
        const { stats } = this.state;
        
        // Calculate savings percentages
        const totalOptimized = stats.batchedRequests + stats.cachedResponses + stats.debouncedRequests;
        const optimizationRate = stats.totalRequests > 0 
            ? Math.round((totalOptimized / stats.totalRequests) * 100) 
            : 0;
        
        return {
            ...stats,
            activeRequests: this.state.activeRequests,
            queuedRequests: this.state.requestQueue.length,
            cacheSize: Object.keys(this.state.cache).length,
            totalOptimized,
            optimizationRate: `${optimizationRate}%`,
            requestsPerSecond: stats.totalRequests > 0 
                ? (stats.totalRequests / ((Date.now() - this.initTime) / 1000)).toFixed(2)
                : 0
        };
    },
    
    // Store initialization time for statistics
    initTime: Date.now()
};

// Initialize with default configuration
window.DataRequestManager.initialize();