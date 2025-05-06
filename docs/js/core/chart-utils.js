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
    }
};