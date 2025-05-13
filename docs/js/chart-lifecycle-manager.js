/**
 * @file chart-lifecycle-manager.js
 * @description Complete lifecycle management for charts
 * 
 * This module provides comprehensive lifecycle management for charts,
 * ensuring proper resource tracking, cleanup, and memory management.
 */

'use strict';

/**
 * @namespace ChartLifecycleManager
 * @description Manages complete chart lifecycle including resource tracking and cleanup
 */
window.ChartLifecycleManager = {
    /**
     * Resource registry for tracking all resources related to charts
     * @private
     */
    _resources: {
        // Chart instances by ID
        charts: {},
        
        // DOM elements by chart ID
        elements: {},
        
        // Event listeners by chart ID
        eventListeners: {},
        
        // Data references by chart ID
        data: {},
        
        // Timeout/interval IDs by chart ID
        timers: {},
        
        // Observer instances by chart ID
        observers: {},
        
        // Other resources by chart ID and type
        custom: {}
    },
    
    /**
     * Lifecycle events and timestamps
     * @private
     */
    _lifecycle: {
        created: {},
        updated: {},
        destroyed: {},
        
        // Performance metrics by chart ID
        performance: {}
    },
    
    /**
     * Initialize the lifecycle manager
     * @returns {void}
     */
    initialize: function() {
        // Register for window events that might affect charts
        window.addEventListener('resize', this._handleWindowResize.bind(this));
        window.addEventListener('beforeunload', this._cleanupAllResources.bind(this));
        
        // Set up automatic garbage collection intervals
        this._setupAutomaticCleanup();
        
        console.debug('ChartLifecycleManager initialized');
    },
    
    /**
     * Register a new chart instance and track all its resources
     * @param {string} chartId - Chart ID
     * @param {Object} chart - Chart.js instance
     * @param {Object} options - Registration options
     * @returns {void}
     */
    registerChart: function(chartId, chart, options = {}) {
        if (!chartId || !chart) return;
        
        // Store chart instance
        this._resources.charts[chartId] = chart;
        
        // Track creation time
        this._lifecycle.created[chartId] = Date.now();
        
        // Initialize resource trackers for this chart
        this._resources.elements[chartId] = {};
        this._resources.eventListeners[chartId] = [];
        this._resources.data[chartId] = {};
        this._resources.timers[chartId] = [];
        this._resources.observers[chartId] = [];
        this._resources.custom[chartId] = {};
        
        // Track canvas element
        if (chart.canvas) {
            this.trackElement(chartId, 'canvas', chart.canvas);
        }
        
        // Track chart container if specified
        if (options.container) {
            this.trackElement(chartId, 'container', options.container);
        }
        
        // Track stats element if specified
        if (options.statsElement) {
            this.trackElement(chartId, 'stats', options.statsElement);
        }
        
        // Track loading indicator if specified
        if (options.loadingElement) {
            this.trackElement(chartId, 'loading', options.loadingElement);
        }
        
        // Register performance observer for rendering performance
        this._setupPerformanceMonitoring(chartId);
        
        // Log creation
        if (window.DriMonDebug && window.DriMonDebug.enabled) {
            console.debug(`Chart ${chartId} registered with lifecycle manager`);
        }
    },
    
    /**
     * Track a DOM element associated with a chart
     * @param {string} chartId - Chart ID
     * @param {string} elementId - Element identifier
     * @param {HTMLElement} element - DOM element to track
     * @returns {void}
     */
    trackElement: function(chartId, elementId, element) {
        if (!chartId || !elementId || !element) return;
        
        if (!this._resources.elements[chartId]) {
            this._resources.elements[chartId] = {};
        }
        
        this._resources.elements[chartId][elementId] = element;
    },
    
    /**
     * Track an event listener associated with a chart
     * @param {string} chartId - Chart ID
     * @param {HTMLElement} element - DOM element with the listener
     * @param {string} event - Event type
     * @param {Function} listener - Event listener function
     * @param {boolean|Object} options - Event listener options
     * @returns {Object} Removal handler
     */
    trackEventListener: function(chartId, element, event, listener, options) {
        if (!chartId || !element || !event || !listener) return;
        
        if (!this._resources.eventListeners[chartId]) {
            this._resources.eventListeners[chartId] = [];
        }
        
        // Add event listener to element
        element.addEventListener(event, listener, options);
        
        // Track listener for cleanup
        const listenerInfo = { element, event, listener, options };
        this._resources.eventListeners[chartId].push(listenerInfo);
        
        // Return an object with a remove method
        return {
            remove: () => {
                this._removeEventListener(chartId, listenerInfo);
            }
        };
    },
    
    /**
     * Track data associated with a chart
     * @param {string} chartId - Chart ID
     * @param {string} dataId - Data identifier
     * @param {*} data - Data to track
     * @returns {void}
     */
    trackData: function(chartId, dataId, data) {
        if (!chartId || !dataId) return;
        
        if (!this._resources.data[chartId]) {
            this._resources.data[chartId] = {};
        }
        
        this._resources.data[chartId][dataId] = data;
    },
    
    /**
     * Track a timer (timeout or interval) associated with a chart
     * @param {string} chartId - Chart ID
     * @param {number} timerId - Timer ID from setTimeout or setInterval
     * @returns {number} The timer ID
     */
    trackTimer: function(chartId, timerId) {
        if (!chartId || !timerId) return timerId;
        
        if (!this._resources.timers[chartId]) {
            this._resources.timers[chartId] = [];
        }
        
        this._resources.timers[chartId].push(timerId);
        
        return timerId;
    },
    
    /**
     * Track a MutationObserver or other observer associated with a chart
     * @param {string} chartId - Chart ID
     * @param {Object} observer - Observer instance
     * @returns {Object} The observer instance
     */
    trackObserver: function(chartId, observer) {
        if (!chartId || !observer) return observer;
        
        if (!this._resources.observers[chartId]) {
            this._resources.observers[chartId] = [];
        }
        
        this._resources.observers[chartId].push(observer);
        
        return observer;
    },
    
    /**
     * Track a custom resource associated with a chart
     * @param {string} chartId - Chart ID
     * @param {string} resourceType - Resource type
     * @param {string} resourceId - Resource identifier
     * @param {*} resource - Resource to track
     * @returns {void}
     */
    trackCustomResource: function(chartId, resourceType, resourceId, resource) {
        if (!chartId || !resourceType || !resourceId) return;
        
        if (!this._resources.custom[chartId]) {
            this._resources.custom[chartId] = {};
        }
        
        if (!this._resources.custom[chartId][resourceType]) {
            this._resources.custom[chartId][resourceType] = {};
        }
        
        this._resources.custom[chartId][resourceType][resourceId] = resource;
    },
    
    /**
     * Record a chart update
     * @param {string} chartId - Chart ID
     * @returns {void}
     */
    recordUpdate: function(chartId) {
        if (!chartId) return;
        
        this._lifecycle.updated[chartId] = Date.now();
    },
    
    /**
     * Clean up all resources associated with a chart
     * @param {string} chartId - Chart ID
     * @returns {boolean} Success status
     */
    cleanupChart: function(chartId) {
        if (!chartId || !this._resources.charts[chartId]) return false;
        
        try {
            // Store metrics before cleanup
            const startTime = performance.now();
            
            // 1. Get a reference to the chart instance before destroying it
            const chart = this._resources.charts[chartId];
            
            // 2. Release dataset configurations back to the pool if ResourcePool exists
            if (window.ResourcePool && chart && chart.data && chart.data.datasets) {
                const datasetPool = window.ResourcePool.getPool('datasetConfig');
                if (datasetPool) {
                    // Clone the datasets array since we'll be modifying it
                    const datasets = [...chart.data.datasets];
                    
                    // Release each dataset configuration back to the pool
                    datasets.forEach(dataset => {
                        try {
                            datasetPool.release(dataset);
                        } catch (e) {
                            // Ignore errors when releasing to pool
                            console.warn(`Error releasing dataset to pool for chart ${chartId}:`, e);
                        }
                    });
                }
            }
            
            // 3. Destroy the Chart.js instance
            if (chart && chart.destroy && typeof chart.destroy === 'function') {
                chart.destroy();
            }
            
            // 4. Clear all event listeners
            this._clearEventListeners(chartId);
            
            // 5. Clear all observers
            this._clearObservers(chartId);
            
            // 6. Clear all timers
            this._clearTimers(chartId);
            
            // 7. Release data references
            delete this._resources.data[chartId];
            
            // 8. Clear references to DOM elements (don't remove them from DOM)
            delete this._resources.elements[chartId];
            
            // 9. Clear custom resources
            delete this._resources.custom[chartId];
            
            // 10. Finally, remove the chart instance reference
            delete this._resources.charts[chartId];
            
            // Record destruction time
            this._lifecycle.destroyed[chartId] = Date.now();
            
            // Calculate cleanup time
            const endTime = performance.now();
            const cleanupTime = endTime - startTime;
            
            // Log cleanup
            if (window.DriMonDebug && window.DriMonDebug.enabled) {
                console.debug(`Chart ${chartId} cleaned up in ${cleanupTime.toFixed(2)}ms`);
            }
            
            return true;
        } catch (error) {
            console.error(`Error cleaning up chart ${chartId}:`, error);
            return false;
        }
    },
    
    /**
     * Get memory usage statistics for all tracked charts
     * @returns {Object} Memory usage statistics
     */
    getMemoryUsage: function() {
        // Basic statistics
        const stats = {
            activeCharts: Object.keys(this._resources.charts).length,
            totalCreated: Object.keys(this._lifecycle.created).length,
            totalDestroyed: Object.keys(this._lifecycle.destroyed).length,
            
            resourceCounts: {
                elements: this._countResources(this._resources.elements),
                eventListeners: this._countResources(this._resources.eventListeners, true),
                data: this._countResources(this._resources.data),
                timers: this._countResources(this._resources.timers, true),
                observers: this._countResources(this._resources.observers, true),
                custom: this._countNestedResources(this._resources.custom)
            },
            
            // Chart age info (how long charts have been active)
            chartAges: this._calculateChartAges(),
            
            // Performance metrics
            performance: this._lifecycle.performance
        };
        
        // Add detailed breakdown if memory estimation is supported
        if (window.performance && window.performance.memory) {
            stats.estimatedMemoryUsage = window.performance.memory;
        }
        
        return stats;
    },
    
    /**
     * Remove resources for charts that haven't been updated in a while
     * @param {number} thresholdMs - Time threshold in milliseconds
     * @returns {number} Number of charts cleaned up
     */
    cleanupStaleCharts: function(thresholdMs = 600000) {
        const now = Date.now();
        let cleanedCount = 0;
        
        // Find charts that haven't been updated recently
        Object.keys(this._resources.charts).forEach(chartId => {
            const lastUpdate = this._lifecycle.updated[chartId] || this._lifecycle.created[chartId] || 0;
            if (now - lastUpdate > thresholdMs) {
                // Clean up chart resources
                if (this.cleanupChart(chartId)) {
                    cleanedCount++;
                }
            }
        });
        
        return cleanedCount;
    },
    
    /**
     * Get the lifecycle status of a chart
     * @param {string} chartId - Chart ID
     * @returns {Object} Lifecycle information
     */
    getLifecycleInfo: function(chartId) {
        if (!chartId) return null;
        
        return {
            created: this._lifecycle.created[chartId],
            lastUpdated: this._lifecycle.updated[chartId],
            destroyed: this._lifecycle.destroyed[chartId],
            age: this._calculateAge(chartId),
            resourceCounts: {
                elements: this._countResourcesForChart(this._resources.elements, chartId),
                eventListeners: this._countResourcesForChart(this._resources.eventListeners, chartId, true),
                data: this._countResourcesForChart(this._resources.data, chartId),
                timers: this._countResourcesForChart(this._resources.timers, chartId, true),
                observers: this._countResourcesForChart(this._resources.observers, chartId, true),
                custom: this._countNestedResourcesForChart(this._resources.custom, chartId)
            },
            performance: this._lifecycle.performance[chartId] || {}
        };
    },
    
    /* PRIVATE METHODS */
    
    /**
     * Handle window resize events
     * @private
     */
    _handleWindowResize: function() {
        // Update all charts to reflect new window size
        // Use debouncing to avoid excessive updates
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
        
        this._resizeTimeout = setTimeout(() => {
            // Use existing global resize function if available
            if (window.resizeAllCharts && typeof window.resizeAllCharts === 'function') {
                window.resizeAllCharts();
            }
        }, 250); // 250ms debounce
    },
    
    /**
     * Clean up all resources before page unload
     * @private
     */
    _cleanupAllResources: function() {
        // Clean up all charts
        Object.keys(this._resources.charts).forEach(chartId => {
            this.cleanupChart(chartId);
        });
        
        // Clear any remaining global resources
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
    },
    
    /**
     * Set up automatic cleanup for stale resources
     * @private
     */
    _setupAutomaticCleanup: function() {
        // Set up periodic garbage collection for stale charts
        const CLEANUP_INTERVAL = 300000; // 5 minutes
        const STALE_THRESHOLD = 1800000; // 30 minutes
        const REFRESH_INTERVAL = 600000; // 10 minutes

        // Create interval for periodic cleanup
        const cleanupInterval = setInterval(() => {
            // Only run cleanup if debug mode is not enabled (to avoid interfering with debugging)
            if (!window.DriMonDebug || !window.DriMonDebug.enabled) {
                const cleanedCount = this.cleanupStaleCharts(STALE_THRESHOLD);

                if (cleanedCount > 0 && console && console.debug) {
                    console.debug(`Auto cleanup: removed ${cleanedCount} stale charts`);
                }
            }
        }, CLEANUP_INTERVAL);

        // Add automatic chart refresh interval to prevent charts from going blank
        const refreshInterval = setInterval(() => {
            // Check if any charts exist
            const chartCount = Object.keys(this._resources.charts).length;
            if (chartCount > 0) {
                // Check if ChartFactory is available
                if (window.ChartFactory && window.ChartFactory.resizeAll) {
                    // Force a resize which will redraw the charts
                    window.ChartFactory.resizeAll();
                    console.debug(`Auto refresh: refreshed ${chartCount} charts`);
                }
            }
        }, REFRESH_INTERVAL);

        // Store interval IDs for potential cleanup
        this._cleanupIntervalId = cleanupInterval;
        this._refreshIntervalId = refreshInterval;
    },
    
    /**
     * Set up performance monitoring for a chart
     * @private
     * @param {string} chartId - Chart ID
     */
    _setupPerformanceMonitoring: function(chartId) {
        if (!this._lifecycle.performance[chartId]) {
            this._lifecycle.performance[chartId] = {
                creationTime: 0,
                updateTimes: [],
                averageUpdateTime: 0,
                renderTimes: [],
                averageRenderTime: 0
            };
        }
    },
    
    /**
     * Clear all event listeners for a chart
     * @private
     * @param {string} chartId - Chart ID
     */
    _clearEventListeners: function(chartId) {
        const listeners = this._resources.eventListeners[chartId];
        if (!listeners || !Array.isArray(listeners)) return;
        
        listeners.forEach(listener => {
            try {
                if (listener && listener.element && listener.event && listener.listener) {
                    listener.element.removeEventListener(listener.event, listener.listener, listener.options);
                }
            } catch (e) {
                // Ignore errors when cleaning up listeners
            }
        });
        
        // Clear listeners array
        this._resources.eventListeners[chartId] = [];
    },
    
    /**
     * Remove a specific event listener
     * @private
     * @param {string} chartId - Chart ID
     * @param {Object} listenerInfo - Listener information
     */
    _removeEventListener: function(chartId, listenerInfo) {
        try {
            if (listenerInfo && listenerInfo.element && listenerInfo.event && listenerInfo.listener) {
                listenerInfo.element.removeEventListener(listenerInfo.event, listenerInfo.listener, listenerInfo.options);
            }
            
            // Remove from tracked listeners
            const listeners = this._resources.eventListeners[chartId];
            if (listeners && Array.isArray(listeners)) {
                const index = listeners.indexOf(listenerInfo);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            }
        } catch (e) {
            // Ignore errors when removing listeners
        }
    },
    
    /**
     * Clear all observers for a chart
     * @private
     * @param {string} chartId - Chart ID
     */
    _clearObservers: function(chartId) {
        const observers = this._resources.observers[chartId];
        if (!observers || !Array.isArray(observers)) return;
        
        observers.forEach(observer => {
            try {
                if (observer && typeof observer.disconnect === 'function') {
                    observer.disconnect();
                }
            } catch (e) {
                // Ignore errors when cleaning up observers
            }
        });
        
        // Clear observers array
        this._resources.observers[chartId] = [];
    },
    
    /**
     * Clear all timers for a chart
     * @private
     * @param {string} chartId - Chart ID
     */
    _clearTimers: function(chartId) {
        const timers = this._resources.timers[chartId];
        if (!timers || !Array.isArray(timers)) return;
        
        timers.forEach(timerId => {
            try {
                clearTimeout(timerId);
                clearInterval(timerId);
            } catch (e) {
                // Ignore errors when cleaning up timers
            }
        });
        
        // Clear timers array
        this._resources.timers[chartId] = [];
    },
    
    /**
     * Count resources for all charts
     * @private
     * @param {Object} resourceObj - Resource object
     * @param {boolean} isArray - Whether the resource is an array
     * @returns {number} Total resource count
     */
    _countResources: function(resourceObj, isArray = false) {
        let count = 0;
        
        Object.keys(resourceObj).forEach(chartId => {
            if (isArray) {
                count += Array.isArray(resourceObj[chartId]) ? resourceObj[chartId].length : 0;
            } else {
                count += Object.keys(resourceObj[chartId]).length;
            }
        });
        
        return count;
    },
    
    /**
     * Count nested resources for all charts
     * @private
     * @param {Object} resourceObj - Resource object
     * @returns {Object} Counts by resource type
     */
    _countNestedResources: function(resourceObj) {
        const counts = {};
        
        Object.keys(resourceObj).forEach(chartId => {
            const chartResources = resourceObj[chartId];
            
            Object.keys(chartResources).forEach(resourceType => {
                if (!counts[resourceType]) {
                    counts[resourceType] = 0;
                }
                
                counts[resourceType] += Object.keys(chartResources[resourceType]).length;
            });
        });
        
        return counts;
    },
    
    /**
     * Count resources for a specific chart
     * @private
     * @param {Object} resourceObj - Resource object
     * @param {string} chartId - Chart ID
     * @param {boolean} isArray - Whether the resource is an array
     * @returns {number} Resource count for the chart
     */
    _countResourcesForChart: function(resourceObj, chartId, isArray = false) {
        if (!resourceObj[chartId]) return 0;
        
        if (isArray) {
            return Array.isArray(resourceObj[chartId]) ? resourceObj[chartId].length : 0;
        } else {
            return Object.keys(resourceObj[chartId]).length;
        }
    },
    
    /**
     * Count nested resources for a specific chart
     * @private
     * @param {Object} resourceObj - Resource object
     * @param {string} chartId - Chart ID
     * @returns {Object} Counts by resource type
     */
    _countNestedResourcesForChart: function(resourceObj, chartId) {
        const counts = {};
        
        if (!resourceObj[chartId]) return counts;
        
        const chartResources = resourceObj[chartId];
        
        Object.keys(chartResources).forEach(resourceType => {
            counts[resourceType] = Object.keys(chartResources[resourceType]).length;
        });
        
        return counts;
    },
    
    /**
     * Calculate age information for all charts
     * @private
     * @returns {Object} Chart age information
     */
    _calculateChartAges: function() {
        const now = Date.now();
        const ages = {
            averageAgeMs: 0,
            oldestChartId: null,
            oldestChartAgeMs: 0,
            chartAges: {}
        };
        
        let totalAge = 0;
        let chartCount = 0;
        
        // Calculate age for each active chart
        Object.keys(this._resources.charts).forEach(chartId => {
            const created = this._lifecycle.created[chartId] || 0;
            if (created > 0) {
                const age = now - created;
                
                // Store chart age
                ages.chartAges[chartId] = age;
                
                // Update total for average
                totalAge += age;
                chartCount++;
                
                // Check if this is the oldest chart
                if (age > ages.oldestChartAgeMs) {
                    ages.oldestChartAgeMs = age;
                    ages.oldestChartId = chartId;
                }
            }
        });
        
        // Calculate average age
        if (chartCount > 0) {
            ages.averageAgeMs = totalAge / chartCount;
        }
        
        return ages;
    },
    
    /**
     * Calculate age for a specific chart
     * @private
     * @param {string} chartId - Chart ID
     * @returns {number} Chart age in milliseconds
     */
    _calculateAge: function(chartId) {
        const created = this._lifecycle.created[chartId] || 0;
        if (created === 0) return 0;
        
        return Date.now() - created;
    }
};

// Initialize the lifecycle manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.ChartLifecycleManager) {
        window.ChartLifecycleManager.initialize();
    }
});