/**
 * @file chart-i18n.js
 * @description Specialized chart internationalization helpers for DriMon
 * 
 * This module provides specialized translation functions for chart components,
 * handling translation of chart titles, series labels, and statistical indicators.
 */

// Create the chart i18n helper as a global object
window.ChartI18n = {
    /**
     * Initialize the chart translator
     * @returns {void}
     */
    initialize: function() {
        // Set up language change event listener
        document.addEventListener('languageChanged', this._handleLanguageChange.bind(this));
    },
    
    /**
     * Handle language change event
     * @private
     * @param {CustomEvent} event - Language change event
     */
    _handleLanguageChange: function(event) {
        // Find all charts with translatable elements and update them
        document.querySelectorAll('[data-chart-id]').forEach(chartElement => {
            this.updateChartTranslations(chartElement.getAttribute('data-chart-id'));
        });
    },
    
    /**
     * Translate a chart title
     * @param {string|object} titleOrConfig - Chart title string or chart configuration object
     * @returns {string} Translated title
     */
    translateChartTitle: function(titleOrConfig) {
        // If titleOrConfig is an object with a titleKey, use that
        if (titleOrConfig && typeof titleOrConfig === 'object') {
            // Config-driven approach with explicit title key
            if (titleOrConfig.titleKey) {
                return window.I18n.translate(titleOrConfig.titleKey);
            }
            // Fallback to title property
            if (titleOrConfig.title) {
                return titleOrConfig.title;
            }
            return '';
        }
        
        // Otherwise treat as a direct title string that needs translation
        // Use a consistent key pattern for chart titles
        const key = typeof titleOrConfig === 'string' ? 
            titleOrConfig.replace(/\s+/g, '') + 'Chart' : '';
        
        // Try to translate with the generated key
        const translated = window.I18n.translate(key);
        
        // If the key wasn't found (returns the key itself), use the original title
        if (translated === key) {
            return titleOrConfig;
        }
        
        return translated;
    },
    
    /**
     * Translate a series label
     * @param {string|object} labelOrSeries - Series label string or series configuration object
     * @returns {string} Translated series label
     */
    translateSeriesLabel: function(labelOrSeries) {
        // Handle undefined or null labels
        if (labelOrSeries === undefined || labelOrSeries === null) {
            console.warn('Undefined or null series label encountered');
            return 'undefined_label';
        }
        
        // If labelOrSeries is an object with a titleKey, use that
        if (labelOrSeries && typeof labelOrSeries === 'object') {
            // Config-driven approach with explicit title key
            if (labelOrSeries.titleKey) {
                return window.I18n.translate(labelOrSeries.titleKey);
            }
            // Fallback to title property
            if (labelOrSeries.title) {
                return labelOrSeries.title;
            }
            
            // If no title keys are found, log a warning
            console.warn('Series object has no titleKey or title property:', labelOrSeries);
            return 'missing_series_title';
        }
        
        // Otherwise translate the label directly
        // This will show the key itself if translation is missing (handled by I18n.translate)
        return window.I18n.translate(String(labelOrSeries));
    },
    
    /**
     * Get translations for chart statistics
     * @returns {Object} Translated statistics labels
     */
    getStatisticsLabels: function() {
        return {
            min: window.I18n.translate('low'),
            max: window.I18n.translate('high'),
            avg: window.I18n.translate('avg'),
            current: window.I18n.translate('now')
        };
    },
    
    /**
     * Update translations for an existing chart
     * @param {string} chartId - Chart ID
     * @returns {boolean} Success flag
     */
    updateChartTranslations: function(chartId) {
        // Find the chart object or element
        const chartElement = document.querySelector(`[data-chart-id="${chartId}"]`);
        if (!chartElement) return false;
        
        // Update the chart title
        const titleElement = chartElement.querySelector('.chart-title');
        if (titleElement) {
            const originalTitle = titleElement.getAttribute('data-original-title') || titleElement.textContent;
            titleElement.setAttribute('data-original-title', originalTitle);
            titleElement.textContent = this.translateChartTitle(originalTitle);
        }
        
        // Update legend labels
        chartElement.querySelectorAll('.legend-label').forEach(label => {
            const originalLabel = label.getAttribute('data-original-label') || label.textContent;
            label.setAttribute('data-original-label', originalLabel);
            label.textContent = this.translateSeriesLabel(originalLabel);
        });
        
        // Update statistics labels
        const statsLabels = this.getStatisticsLabels();
        chartElement.querySelectorAll('[data-stat-type]').forEach(statElement => {
            const statType = statElement.getAttribute('data-stat-type');
            const labelElement = statElement.querySelector('.stat-label');
            if (labelElement && statsLabels[statType]) {
                labelElement.textContent = statsLabels[statType];
            }
        });
        
        return true;
    }
};