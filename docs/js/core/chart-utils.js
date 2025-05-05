/**
 * @file chart-utils.js
 * @description Utility functions for chart handling in DriMon
 * 
 * This file provides backward compatibility for chart utilities
 * that were previously defined globally.
 */

// Define ChartUtils globally to ensure it's available before charts are rendered
window.ChartUtils = {
    /**
     * Get unit for a chart based on its ID
     * @param {string} chartId - Chart ID
     * @returns {string} Unit string
     */
    getUnitForChart: function(chartId) {
        // Find the chart config
        if (window.chartConfigs && Array.isArray(window.chartConfigs)) {
            const config = window.chartConfigs.find(c => c.id === chartId);
            if (config && config.unit) {
                return config.unit;
            }
            
            // If we can't find the unit, log a warning but return empty string to avoid errors
            console.warn(`Chart with ID '${chartId}' has no unit defined in its configuration. Using empty string.`);
        } else {
            console.warn('ChartConfigs not available or not an array');
        }
        return '';
    },
    
    /**
     * Check if a chart should use integer values
     * @param {string} chartId - Chart ID
     * @returns {boolean} True if integer values should be used
     */
    shouldUseIntegerValues: function(chartId) {
        // Find the chart config
        if (window.chartConfigs && Array.isArray(window.chartConfigs)) {
            const config = window.chartConfigs.find(c => c.id === chartId);
            if (config && config.hasOwnProperty('useIntegerFormat')) {
                return config.useIntegerFormat;
            }
        }
        return false;
    }
};