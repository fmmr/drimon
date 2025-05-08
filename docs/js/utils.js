/**
 * @file utils.js
 * @description Core utility functions for the DriMon application
 * @module core/utils
 */

/**
 * @namespace Utils
 * @description Common utility functions for the DriMon application
 */
const Utils = {
    /**
     * Format a date according to locale and format string
     * @param {Date|string} date - Date to format
     * @param {string} [format='LLL'] - Format string (moment.js format)
     * @param {string} [locale] - Optional locale override
     * @returns {string} Formatted date string
     */
    formatDate: function(date, format = 'LLL', locale = null) {
        if (!window.moment) {
            return String(date);
        }
        
        // Store current locale to restore it later
        const currentLocale = moment.locale();
        
        // Set locale if provided
        if (locale) {
            moment.locale(locale);
        }
        
        // Format the date
        const formatted = moment(date).format(format);
        
        // Restore original locale if we changed it
        if (locale) {
            moment.locale(currentLocale);
        }
        
        return formatted;
    },
    
    /**
     * Format a relative time (e.g., "2 hours ago")
     * @param {Date|string} date - Date to format relative to now
     * @param {string} [locale] - Optional locale override
     * @returns {string} Relative time string
     */
    formatRelativeTime: function(date, locale = null) {
        if (!window.moment) {
            return String(date);
        }
        
        // Store current locale to restore it later
        const currentLocale = moment.locale();
        
        // Set locale if provided
        if (locale) {
            moment.locale(locale);
        }
        
        // Format the relative time
        const formatted = moment(date).fromNow();
        
        // Restore original locale if we changed it
        if (locale) {
            moment.locale(currentLocale);
        }
        
        return formatted;
    },
    
    /**
     * Get URL parameter by name
     * @param {string} name - Parameter name
     * @returns {string|null} Parameter value or null if not found
     */
    /**
     * Get URL parameter by name using the modern URLSearchParams API
     * @param {string} name - Parameter name to retrieve
     * @returns {string} Parameter value or empty string if not found
     */
    getURLParameter: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    },
    
    /**
     * Format a number for display
     * @param {number} value - Number to format
     * @param {Object} options - Formatting options or chart config
     * @param {boolean} [options.useInteger=false] - Whether to format as integer
     * @param {number} [options.decimals] - Number of decimal places
     * @param {string} [options.unit=''] - Unit to append
     * @param {number} [options.range=0] - Data range for dynamic precision
     * @param {Object} [options.formatting] - Chart-specific formatting options
     * @returns {string} Formatted number
     */
    formatNumber: function(value, options = {}, range = 0) {
        // Handle undefined, null or NaN
        if (value === null || value === undefined || isNaN(value)) {
            return '—';
        }
        
        let formatted;
        let unit = '';
        
        // Handle both simple options and chart-specific configs
        // Check if this is being called with chart config object
        if (options.formatting || options.useIntegerFormat !== undefined) {
            // Handle chart-specific config format from chart-utils.js
            const formatting = options.formatting || {};
            
            // Get decimal places from formatting if specified
            if (formatting.decimalPlaces !== undefined) {
                formatted = value.toFixed(formatting.decimalPlaces);
            } 
            // Get useInteger flag from formatting or config
            else if (formatting.useIntegerFormat || options.useIntegerFormat || range >= 10) {
                formatted = Math.round(value).toString();
            }
            // For very small values or small ranges
            else if (range < 1 || Math.abs(value) < 1) {
                formatted = value.toFixed(2);
            }
            // Medium precision for medium values
            else if (Math.abs(value) < 10) {
                formatted = value.toFixed(1);
            }
            // Integer for larger values
            else {
                formatted = Math.round(value).toString();
            }
            
            // Use provided unit if available
            unit = options.unit || '';
        } 
        else {
            // Use direct options format
            const useInteger = options.useInteger || false;
            const decimals = options.decimals;
            unit = options.unit || '';
            
            // Format with direct options
            if (useInteger || range >= 10) {
                // Use integer format
                formatted = Math.round(value).toString();
            } else if (decimals !== undefined) {
                // Use specified decimals
                formatted = value.toFixed(decimals);
            } else if (range < 1) {
                // Use more precision for small ranges
                formatted = value.toFixed(2);
            } else {
                // Default precision
                formatted = value.toFixed(1);
            }
        }
        
        // Add unit if provided
        return formatted + (unit ? ` ${unit}` : '');
    },
    
    /**
     * Get range of dates based on predefined options
     * @param {string} rangeCode - Range identifier (e.g., 'today', '7d')
     * @returns {Object} Object with startDate and endDate
     */
    getDateRange: function(rangeCode) {
        const now = moment();
        const format = 'YYYY-MM-DD HH:mm:ss';
        let startDate = '';
        let endDate = '';
        
        if (rangeCode.match(/^\d+$/)) {
            // If range is a number, subtract that many days
            const days = parseInt(rangeCode);
            startDate = moment().subtract(days, 'days').startOf('day').format(format);
        } else {
            switch (rangeCode) {
                case 'start':
                    startDate = moment('2024-07-15').format(format);
                    break;
                case 'today':
                    startDate = moment().startOf('day').format(format);
                    break;
                case 'yesterday':
                    startDate = moment().subtract(1, 'days').startOf('day').format(format);
                    endDate = moment().subtract(1, 'days').endOf('day').format(format);
                    break;
                case 'this-week':
                    startDate = moment().startOf('isoWeek').format(format);
                    break;
                case 'last-week':
                    startDate = moment().subtract(1, 'weeks').startOf('isoWeek').format(format);
                    endDate = moment().subtract(1, 'weeks').endOf('isoWeek').format(format);
                    break;
                default:
                    startDate = moment().subtract(1, 'days').format(format);
            }
        }
        
        return { startDate, endDate };
    },
    
    /**
     * Create DOM element with attributes and children
     * @param {string} tagName - HTML tag name
     * @param {Object} [attributes={}] - HTML attributes
     * @param {Array|Node|string} [children] - Child elements or text
     * @returns {HTMLElement} Created DOM element
     */
    createElement: function(tagName, attributes = {}, children = null) {
        const element = document.createElement(tagName);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.entries(value).forEach(([prop, val]) => {
                    element.style[prop] = val;
                });
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element[key] = value;
            }
        });
        
        // Add children
        if (children) {
            if (Array.isArray(children)) {
                children.forEach(child => {
                    if (child) {
                        element.appendChild(
                            typeof child === 'string' ? document.createTextNode(child) : child
                        );
                    }
                });
            } else if (typeof children === 'string') {
                element.textContent = children;
            } else {
                element.appendChild(children);
            }
        }
        
        return element;
    },
    
    /**
     * Add an event listener with proper cleanup
     * @param {Element} element - DOM element to attach listener to
     * @param {string} event - Event name (e.g., 'click')
     * @param {Function} handler - Event handler function
     * @param {Object} [options] - Event listener options 
     * @returns {Function} Function to remove the event listener
     */
    addEventListenerWithCleanup: function(element, event, handler, options) {
        if (!element || !event || typeof handler !== 'function') {
            console.error('Invalid parameters for addEventListenerWithCleanup');
            return () => {};
        }
        
        element.addEventListener(event, handler, options);
        
        return function cleanup() {
            element.removeEventListener(event, handler, options);
        };
    },
    
    /**
     * Add multiple event listeners with single cleanup function
     * @param {Element} element - DOM element to attach listeners to
     * @param {Object} eventMap - Map of event names to handler functions
     * @param {Object} [options] - Event listener options
     * @returns {Function} Function to remove all event listeners
     */
    addMultipleEventListeners: function(element, eventMap, options) {
        if (!element || !eventMap || typeof eventMap !== 'object') {
            console.error('Invalid parameters for addMultipleEventListeners');
            return () => {};
        }
        
        const cleanupFunctions = [];
        
        Object.entries(eventMap).forEach(([event, handler]) => {
            const cleanup = this.addEventListenerWithCleanup(element, event, handler, options);
            cleanupFunctions.push(cleanup);
        });
        
        return function cleanupAll() {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    },
    
    /**
     * Debounce a function call
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    /**
     * Throttle a function call
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle: function(func, limit) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= limit) {
                lastCall = now;
                func.apply(this, args);
            }
        };
    },
    
    /**
     * Calculate statistics from an array of values
     * @param {Array<number>} values - Array of numeric values
     * @returns {Object} Statistics object with min, max, and avg properties
     */
    calculateStatistics: function(values) {
        if (!values || values.length === 0) {
            return { minValue: 0, maxValue: 0, avgValue: 0, currentValue: null };
        }
        
        // Filter out non-numeric values
        const filteredValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
        
        if (filteredValues.length === 0) {
            return { minValue: 0, maxValue: 0, avgValue: 0, currentValue: null };
        }
        
        const minValue = Math.min(...filteredValues);
        const maxValue = Math.max(...filteredValues);
        const sum = filteredValues.reduce((acc, val) => acc + val, 0);
        const avgValue = sum / filteredValues.length;
        const currentValue = filteredValues[filteredValues.length - 1];
        
        return { minValue, maxValue, avgValue, currentValue };
    },
    
    /**
     * Create a simple event emitter
     * @returns {Object} Event emitter object with on, off, and emit methods
     */
    createEventEmitter: function() {
        const listeners = new Map();
        
        return {
            /**
             * Register an event listener
             * @param {string} event - Event name
             * @param {Function} callback - Event handler
             * @returns {Function} Function to remove this specific listener
             */
            on(event, callback) {
                if (!listeners.has(event)) {
                    listeners.set(event, new Set());
                }
                
                listeners.get(event).add(callback);
                
                return () => this.off(event, callback);
            },
            
            /**
             * Remove an event listener
             * @param {string} event - Event name
             * @param {Function} callback - Event handler to remove
             * @returns {boolean} True if listener was removed
             */
            off(event, callback) {
                if (!listeners.has(event)) return false;
                
                const eventListeners = listeners.get(event);
                const result = eventListeners.delete(callback);
                
                if (eventListeners.size === 0) {
                    listeners.delete(event);
                }
                
                return result;
            },
            
            /**
             * Emit an event
             * @param {string} event - Event name
             * @param {*} data - Event data
             */
            emit(event, data) {
                if (!listeners.has(event)) return;
                
                listeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error(`Error in event listener for ${event}:`, error);
                    }
                });
            },
            
            /**
             * Register a one-time event listener
             * @param {string} event - Event name
             * @param {Function} callback - Event handler
             * @returns {Function} Function to remove the listener
             */
            once(event, callback) {
                const onceWrapper = (data) => {
                    this.off(event, onceWrapper);
                    callback(data);
                };
                
                return this.on(event, onceWrapper);
            }
        };
    },
    
    
    /**
     * Get data as query parameters string
     * @param {Object} data - Data object to convert to query string
     * @returns {string} URL query parameters string
     */
    toQueryString: function(data) {
        if (!data || typeof data !== 'object') {
            return '';
        }
        
        return Object.entries(data)
            .filter(([_, value]) => value !== null && value !== undefined)
            .map(([key, value]) => {
                return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join('&');
    },
    
    /**
     * Parse query string into object
     * @param {string} queryString - URL query string (with or without leading ?)
     * @returns {Object} Parsed query parameters
     */
    parseQueryString: function(queryString) {
        if (!queryString) {
            return {};
        }
        
        // Remove leading ? if present
        const qs = queryString.startsWith('?') ? queryString.substring(1) : queryString;
        
        // Split into key-value pairs
        return qs.split('&').reduce((params, param) => {
            if (!param) return params;
            
            const [key, value] = param.split('=').map(part => decodeURIComponent(part.trim()));
            if (key) {
                params[key] = value !== undefined ? value : '';
            }
            return params;
        }, {});
    },
    
    /**
     * Calculate statistics from numeric values
     * Unified method for different contexts (raw values, datasets, API data)
     * 
     * @param {Object} options - Statistics calculation options
     * @param {Array} [options.values] - Simple array of numeric values
     * @param {Array} [options.datasets] - Chart.js datasets with data property
     * @param {Object} [options.apiData] - API data with feeds or series
     * @param {Object} [options.config] - Chart configuration with field property
     * @param {boolean} [options.includePadding=false] - Whether to include padding for visualization
     * @returns {Object} Statistics object with min, max, avg, etc.
     */
    calculateStatistics: function(options = {}) {
        // Default statistics values
        const stats = {
            minValue: 0,
            maxValue: 0,
            avgValue: 0,
            currentValue: null,
            hasNegativeValues: false,
            count: 0
        };
        
        let allValues = [];
        
        // Process based on input type
        if (options.values && Array.isArray(options.values)) {
            // Simple array of values
            allValues = options.values.filter(v => v !== null && v !== undefined && !isNaN(v));
        } 
        else if (options.datasets && Array.isArray(options.datasets)) {
            // Chart.js datasets
            options.datasets.forEach(dataset => {
                if (dataset?.data && Array.isArray(dataset.data)) {
                    const validValues = dataset.data.filter(v => 
                        v !== null && v !== undefined && !isNaN(v)
                    );
                    allValues = allValues.concat(validValues);
                }
            });
            
            // Get current value from the first dataset
            if (options.datasets[0]?.data?.length) {
                stats.currentValue = options.datasets[0].data[options.datasets[0].data.length - 1];
            }
        }
        else if (options.apiData) {
            // Handle API data format (with feeds or multi-series)
            const data = options.apiData;
            const config = options.config || {};
            
            if (data.is_multi_series && data.series && Array.isArray(data.series)) {
                // Multi-series data
                data.series.forEach((series, index) => {
                    if (!series.feeds || series.feeds.length === 0) return;
                    
                    // Get values for this series
                    const values = series.feeds
                        .map(feed => parseFloat(feed[`field${series.field}`]))
                        .filter(v => !isNaN(v));
                    
                    if (values.length === 0) return;
                    
                    allValues = allValues.concat(values);
                    
                    // Use the last value from the first series as current value
                    if (stats.currentValue === null && index === 0 && values.length > 0) {
                        stats.currentValue = values[values.length - 1];
                    }
                });
            } else if (data.feeds && data.feeds.length > 0 && config.field) {
                // Single series data
                const values = data.feeds
                    .map(feed => parseFloat(feed[`field${config.field}`]))
                    .filter(v => !isNaN(v));
                
                if (values.length > 0) {
                    allValues = values;
                    stats.currentValue = values[values.length - 1];
                }
            }
        }
        
        // Calculate statistics if we have values
        if (allValues.length > 0) {
            stats.minValue = Math.min(...allValues);
            stats.maxValue = Math.max(...allValues);
            const sum = allValues.reduce((acc, val) => acc + val, 0);
            stats.avgValue = sum / allValues.length;
            stats.count = allValues.length;
            stats.hasNegativeValues = allValues.some(v => v < 0);
            
            if (stats.currentValue === null) {
                stats.currentValue = allValues[allValues.length - 1];
            }
            
            // Calculate range
            stats.range = stats.maxValue - stats.minValue;
            
            // Add padding for visualization if requested
            if (options.includePadding) {
                const paddingAmount = stats.range < 0.1 ? 
                    (Math.abs(stats.minValue) * 0.05 || 0.1) : stats.range * 0.05;
                
                stats.paddedMinValue = stats.hasNegativeValues ? 
                    stats.minValue - paddingAmount : 
                    Math.max(0, stats.minValue - paddingAmount);
                    
                stats.paddedMaxValue = stats.maxValue + paddingAmount;
            }
        }
        
        return stats;
    }
};

// For backward compatibility with old code
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}