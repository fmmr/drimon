/**
 * @file chart-utils.js
 * @description Utility functions for chart handling in DriMon
 * 
 * This file enforces the configuration-driven approach where all chart properties
 * must be explicitly defined in the configuration.
 */

// Define ChartUtils globally to ensure it's available before charts are rendered
window.ChartUtils = {
    /**
     * @deprecated Units should be read directly from chart configuration
     * @param {string} chartId - Chart ID
     * @returns {string} Empty string with an error message
     */
    getUnitForChart: function(chartId) {
        console.error(`Configuration error: Units should be accessed directly from chart config, not via getUnitForChart(). Chart ID: ${chartId}`);
        return '';
    },
    
    /**
     * @deprecated Integer formats should be read directly from chart configuration
     * @param {object} config - Chart configuration object
     * @returns {boolean} False with an error message
     */
    shouldUseIntegerValues: function(config) {
        // Support direct config access to ease transition
        if (config && typeof config === 'object') {
            // First check for formatting configuration
            if (config.formatting && config.formatting.useIntegerFormat !== undefined) {
                return config.formatting.useIntegerFormat;
            }
            
            // Then check for direct property
            if (config.useIntegerFormat !== undefined) {
                return config.useIntegerFormat;
            }
            
            // Log error for missing configuration properties
            console.error(`Configuration error: Missing formatting.useIntegerFormat in chart config. Add this property to the chart config.`);
        } else {
            console.error(`Configuration error: Invalid chart config object provided to shouldUseIntegerValues()`);
        }
        return false;
    },
    
    /**
     * Creates time scale configuration for Chart.js based on data timespan
     * @param {Array} timestamps - Array of ISO date strings or Date objects
     * @param {string} [range] - Optional range parameter from URL
     * @returns {Object} Time scale configuration object for Chart.js
     */
    createTimeScaleConfig: function(timestamps, range) {
        if (!timestamps || timestamps.length < 2) {
            return {
                type: 'time',
                time: {
                    unit: 'hour',
                    displayFormats: {
                        hour: 'HH:mm'
                    }
                }
            };
        }
        
        // Convert timestamps to Date objects if they're strings
        const dates = timestamps.map(ts => ts instanceof Date ? ts : new Date(ts));
        
        // Calculate the timespan in milliseconds
        const firstTime = dates[0];
        const lastTime = dates[dates.length - 1];
        const timespan = lastTime - firstTime;
        const dayInMs = 24 * 60 * 60 * 1000;
        
        // Use different configurations based on the timespan
        const config = {
            type: 'time',
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
                tooltipFormat: 'MMM D, YYYY, HH:mm'
            }
        };
        
        // Let Chart.js auto-select the unit for most cases
        // but provide some guidance based on the timespan
        if (timespan < dayInMs) {
            // Less than 1 day - use hour or minute units
            config.time.unit = 'hour';
        } else if (timespan < 7 * dayInMs) {
            // Less than 1 week - use day unit
            config.time.unit = 'day';
        } else if (timespan < 30 * dayInMs) {
            // Less than 1 month - use day unit with week stepping
            config.time.unit = 'day';
        } else if (timespan < 365 * dayInMs) {
            // Less than 1 year - use month unit
            config.time.unit = 'month';
        } else {
            // More than 1 year - use year unit
            config.time.unit = 'year';
        }
        
        return config;
    }
};