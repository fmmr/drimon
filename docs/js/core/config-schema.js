/**
 * @file config-schema.js
 * @description Schema definitions for chart configuration validation
 * @module core/config-schema
 */

/**
 * Schema for single series configuration
 * @type {Object}
 */
export const SeriesSchema = {
  // Required properties
  required: ['channel', 'field'],
  
  // Properties definition
  properties: {
    // Title or title key for translation
    titleKey: { type: 'string' },
    title: { type: 'string' },
    
    // Data source
    channel: { type: 'number' },
    field: { type: 'number' },
    
    // Visual styling
    color: { type: 'string' },
    
    // For multi-axis charts
    axis: { 
      type: 'string',
      enum: ['y', 'y1']
    }
  }
};

/**
 * Schema for chart configuration
 * @type {Object}
 */
export const ChartConfigSchema = {
  // Required properties
  required: ['id', 'row', 'unit'],
  
  // Properties definition
  properties: {
    // Core identification
    id: { type: 'string' },
    
    // Title information
    titleKey: { type: 'string' },
    title: { type: 'string' },
    
    // Layout positioning
    row: { type: 'number' },
    gridRow: { type: 'string' },
    gridColumn: { type: 'string' },
    
    // Data source (for single-series charts)
    channel: { type: 'number' },
    field: { type: 'number' },
    
    // Data source (for multi-series charts)
    series: { 
      type: 'array',
      items: SeriesSchema
    },
    
    // Visual styling
    color: { type: 'string' },
    category: { type: 'string' },
    
    // Date filtering
    startDate: { type: 'string' },
    
    // Unit and formatting
    unit: { type: 'string' },
    useIntegerFormat: { type: 'boolean' },
    
    // Y-axis configuration
    minValue: { type: 'number' },
    maxValue: { type: 'number' },
    secondYAxis: { type: 'boolean' },
    
    // Statistical indicators
    indicateMin: { type: 'boolean' },
    indicateMax: { type: 'boolean' },
    
    // Related data
    relatedCategories: { 
      type: 'array',
      items: { type: 'string' }
    },
    
    // Special handling flags
    specialHandling: {
      type: 'object',
      properties: {
        consistentLegendLabels: { type: 'boolean' }
      }
    }
  }
};

/**
 * Default chart configuration
 * @type {Object}
 */
export const DefaultChartConfig = {
  useIntegerFormat: false,
  indicateMin: false,
  indicateMax: false,
  secondYAxis: false,
  category: 'default',
  unit: ''  // Empty default unit - should be overridden in actual configs
};

/**
 * Schema for global application configuration
 * @type {Object}
 */
export const AppConfigSchema = {
  required: ['chartConfigs'],
  properties: {
    chartConfigs: {
      type: 'array',
      items: ChartConfigSchema
    },
    defaultDateRange: { type: 'string' },
    apiBaseUrl: { type: 'string' },
    defaultLanguage: { type: 'string' }
  }
};

export default {
  SeriesSchema,
  ChartConfigSchema,
  DefaultChartConfig,
  AppConfigSchema
};