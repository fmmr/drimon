/**
 * @file config.js
 * @description Configuration management for the DriMon application
 * @module core/config
 * 
 * This module implements a configuration-driven approach where:
 * - All chart properties must be explicitly defined in the configuration
 * - No implicit behavior based on chart IDs or naming conventions
 * - All configurations are validated against a schema
 * - Default values are applied where not specified
 * 
 * IMPORTANT: This module avoids any ID-based logic or implicit behavior.
 * All chart properties (like units and formatting) must be explicitly 
 * defined in the chart configuration, rather than inferred from chart IDs
 * or other properties. This ensures consistent, predictable behavior and
 * makes the system more maintainable.
 * 
 * Helper functions that previously used ID-based logic (like getUnitForChart
 * and shouldUseIntegerValues) have been deprecated in favor of direct
 * property access from the configuration objects.
 */

import { ChartConfigSchema, DefaultChartConfig, AppConfigSchema } from './config-schema.js';

/**
 * @class Config
 * @description Core configuration management system
 */
const Config = {
  /** 
   * Store for all chart configurations
   * @private
   */
  _chartConfigs: [],
  
  /**
   * Global application config
   * @private
   */
  _appConfig: {
    defaultDateRange: '1',
    defaultLanguage: 'en',
    apiBaseUrl: 'https://api.thingspeak.com'
  },
  
  /**
   * Initialize configuration
   * @param {Object} config - Application configuration
   * @returns {boolean} Success flag
   */
  initialize: function(config) {
    // Validate the config against schema
    const validationResult = this.validateAppConfig(config);
    
    if (!validationResult.isValid) {
      console.error('Invalid configuration:', validationResult.errors);
      return false;
    }
    
    // Store chart configurations
    this._chartConfigs = config.chartConfigs.map(chartConfig => ({
      ...DefaultChartConfig, // Apply defaults
      ...chartConfig        // Override with provided values
    }));
    
    // Store app config properties
    if (config.defaultDateRange) this._appConfig.defaultDateRange = config.defaultDateRange;
    if (config.defaultLanguage) this._appConfig.defaultLanguage = config.defaultLanguage;
    if (config.apiBaseUrl) this._appConfig.apiBaseUrl = config.apiBaseUrl;
    
    // Initialize global window.chartConfigs for backward compatibility
    if (typeof window !== 'undefined') {
      window.chartConfigs = this._chartConfigs;
    }
    
    return true;
  },
  
  /**
   * Validate a chart configuration against the schema
   * @param {Object} config - Chart configuration
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateChartConfig: function(config) {
    const errors = [];
    
    // Check required properties
    ChartConfigSchema.required.forEach(prop => {
      if (config[prop] === undefined) {
        errors.push(`Missing required property: ${prop}`);
      }
    });
    
    // Validate each property against its schema definition
    Object.entries(config).forEach(([key, value]) => {
      const propSchema = ChartConfigSchema.properties[key];
      
      // Skip properties not in the schema (might be custom extensions)
      if (!propSchema) return;
      
      // Type checking
      if (propSchema.type && typeof value !== propSchema.type) {
        // Special case for numbers that might be strings in some contexts
        if (propSchema.type === 'number' && !isNaN(Number(value))) {
          // It's a valid number as string, so we can continue
        } else {
          errors.push(`Invalid type for ${key}: expected ${propSchema.type}, got ${typeof value}`);
        }
      }
      
      // Enum validation
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(`Invalid value for ${key}: ${value}. Must be one of: ${propSchema.enum.join(', ')}`);
      }
      
      // Array item validation
      if (propSchema.type === 'array' && Array.isArray(value) && propSchema.items) {
        // For arrays with item schemas, validate each item
        if (typeof propSchema.items === 'object') {
          value.forEach((item, index) => {
            // Required properties check for items
            if (propSchema.items.required) {
              propSchema.items.required.forEach(reqProp => {
                if (item[reqProp] === undefined) {
                  errors.push(`Missing required property ${reqProp} in ${key}[${index}]`);
                }
              });
            }
            
            // Type checking for item properties
            if (propSchema.items.properties) {
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                const itemPropSchema = propSchema.items.properties[itemKey];
                if (itemPropSchema && itemPropSchema.type && typeof itemValue !== itemPropSchema.type) {
                  errors.push(`Invalid type for ${key}[${index}].${itemKey}: expected ${itemPropSchema.type}, got ${typeof itemValue}`);
                }
              });
            }
          });
        }
      }
    });
    
    // Special validation: series vs direct channel/field
    if (config.series && (config.channel || config.field)) {
      errors.push('Cannot specify both series and channel/field directly');
    }
    
    // Special validation: either series or channel/field must be specified
    if (!config.series && (!config.channel || !config.field)) {
      errors.push('Must specify either series or channel/field');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Validate application configuration
   * @param {Object} config - Application configuration
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateAppConfig: function(config) {
    const errors = [];
    
    // Check required properties
    AppConfigSchema.required.forEach(prop => {
      if (config[prop] === undefined) {
        errors.push(`Missing required property: ${prop}`);
      }
    });
    
    // Validate chartConfigs
    if (config.chartConfigs) {
      if (!Array.isArray(config.chartConfigs)) {
        errors.push('chartConfigs must be an array');
      } else {
        // Validate each chart config
        config.chartConfigs.forEach((chartConfig, index) => {
          const result = this.validateChartConfig(chartConfig);
          if (!result.isValid) {
            errors.push(`Invalid chart config at index ${index}:`);
            result.errors.forEach(err => errors.push(`  - ${err}`));
          }
        });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  /**
   * Get chart configuration by ID
   * @param {string} chartId - Chart ID
   * @returns {Object|null} Chart configuration or null if not found
   */
  getChartConfig: function(chartId) {
    return this._chartConfigs.find(c => c.id === chartId) || null;
  },
  
  /**
   * Get all chart configurations
   * @returns {Array<Object>} Array of chart configurations
   */
  getAllChartConfigs: function() {
    return [...this._chartConfigs];
  },
  
  /**
   * Get charts for a specific row
   * @param {number} rowNumber - Row number
   * @returns {Array<Object>} Array of chart configurations for the row
   */
  getChartsForRow: function(rowNumber) {
    return this._chartConfigs.filter(c => c.row === rowNumber);
  },
  
  /**
   * Get charts by category
   * @param {string} category - Category name
   * @returns {Array<Object>} Array of chart configurations for the category
   */
  getChartsByCategory: function(category) {
    return this._chartConfigs.filter(c => c.category === category);
  },
  
  
  /**
   * Get application configuration value
   * @param {string} key - Configuration key
   * @param {*} [defaultValue] - Default value if key not found
   * @returns {*} Configuration value
   */
  getConfig: function(key, defaultValue = null) {
    return this._appConfig[key] !== undefined ? this._appConfig[key] : defaultValue;
  },
  
  /**
   * Set application configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  setConfig: function(key, value) {
    this._appConfig[key] = value;
  }
};

// For backward compatibility with old code
if (typeof window !== 'undefined') {
  window.Config = Config;
}

// Export for ES modules
export default Config;