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
     * Find the appropriate translation key for a chart title
     * This function is used to support legacy code that might pass
     * actual titles instead of translation keys.
     * @private
     * @param {string} chartTitle - The chart title to find a key for
     * @returns {string|null} The translation key or null if not found
     */
    _getChartTitleKey: function(chartTitle) {
        // Return null for empty titles
        if (!chartTitle) return null;
        
        // For legacy support, we'll infer the key from the title
        // but we won't have any language-specific mapping here
        
        // First try to create a valid key from the title itself
        // We'll strip spaces and add 'Chart' suffix
        const inferredKey = chartTitle.replace(/\s+/g, '') + 'Chart';
        
        // See if this key exists in our translations
        if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(inferredKey)) {
            return inferredKey;
        }
        
        // Check if the title actually is a key itself
        if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(chartTitle)) {
            return chartTitle;
        }
        
        // No key could be found
        console.warn(`Could not find translation key for chart title: "${chartTitle}"`);
        return null;
    },
    
    /**
     * Find the appropriate translation key for a series title
     * This function is used to support legacy code that might pass
     * actual titles instead of translation keys.
     * @private
     * @param {string} seriesTitle - The series title to find a key for
     * @returns {string|null} The translation key or null if not found
     */
    _getSeriesKey: function(seriesTitle) {
        // Return null for empty titles
        if (!seriesTitle) return null;
        
        // For legacy support, we'll infer the key from the title
        // but we won't have any language-specific mapping here
        
        // Check if the title already is a key itself
        if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(seriesTitle)) {
            return seriesTitle;
        }
        
        // Some series names convert directly to keys (like 'ceiling', 'internal')
        // Try a simple lowercase conversion
        const simpleKey = seriesTitle.toLowerCase().replace(/\s+/g, '');
        if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(simpleKey)) {
            return simpleKey;
        }
        
        // No key could be found
        console.warn(`Could not find translation key for series title: "${seriesTitle}"`);
        return null;
    },
    
    /**
     * Initialize the chart translator
     * @returns {void}
     */
    initialize: function() {
        // Set up language change event listener
        document.addEventListener('languageChanged', this._handleLanguageChange.bind(this));
        
        // Log initialization
        console.info('ChartI18n initialized');
    },
    
    /**
     * Handle language change event
     * @private
     * @param {CustomEvent} event - Language change event
     */
    _handleLanguageChange: function(event) {
        console.log('Language changed to', event.detail.language);
        this.updateAllChartTranslations();
    },
    
    /**
     * Update all chart translations
     */
    updateAllChartTranslations: function() {
        // Update all charts in the global charts array
        if (window.charts && Array.isArray(window.charts)) {
            window.charts.forEach(chart => {
                if (chart.id) {
                    this.updateChartTranslations(chart.id);
                }
            });
        }
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
                // Try to find a translation key for this title
                const titleKey = this._getChartTitleKey(titleOrConfig.title);
                if (titleKey) {
                    return window.I18n.translate(titleKey);
                }
                return titleOrConfig.title;
            }
            return '';
        }
        
        // For string titles, check if we have a mapping
        if (typeof titleOrConfig === 'string') {
            // Check if this is a known title in our map
            const titleKey = this._getChartTitleKey(titleOrConfig);
            if (titleKey) {
                return window.I18n.translate(titleKey);
            }
            
            // Otherwise treat as a direct title string that needs translation
            // Use a consistent key pattern for chart titles
            const generatedKey = titleOrConfig.replace(/\s+/g, '') + 'Chart';
            
            // Try to translate with the generated key
            const translated = window.I18n.translate(generatedKey);
            
            // If the key wasn't found (returns the key itself), use the original title
            if (translated === generatedKey) {
                return titleOrConfig;
            }
            
            return translated;
        }
        
        return titleOrConfig || '';
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
                // Try to find a translation key for this title
                const titleKey = this._getSeriesKey(labelOrSeries.title);
                if (titleKey) {
                    return window.I18n.translate(titleKey);
                }
                return labelOrSeries.title;
            }
            
            // If no title keys are found, log a warning
            console.warn('Series object has no titleKey or title property:', labelOrSeries);
            return 'missing_series_title';
        }
        
        // For string titles, check if we have a mapping
        if (typeof labelOrSeries === 'string') {
            // Check if this is a known series in our map
            const seriesKey = this._getSeriesKey(labelOrSeries);
            if (seriesKey) {
                return window.I18n.translate(seriesKey);
            }
            
            // Otherwise translate the label directly
            // This will show the key itself if translation is missing (handled by I18n.translate)
            return window.I18n.translate(String(labelOrSeries));
        }
        
        return String(labelOrSeries);
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
     * Get translation for loading text
     * @returns {string} Translated loading text
     */
    getLoadingText: function() {
        return window.I18n.translate('loading');
    },
    
    /**
     * Update translations for an existing chart
     * @param {string} chartId - Chart ID
     * @returns {boolean} Success flag
     */
    updateChartTranslations: function(chartId) {
        // Find the chart instance
        const chartInstance = window.charts ? window.charts.find(c => c.id === chartId) : null;
        if (!chartInstance) return false;
        
        // Find the chart container
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return false;
        
        const chartContainer = chartElement.closest('.chart');
        if (!chartContainer) return false;
        
        // Update the chart title
        const titleElement = chartContainer.querySelector('.chart-title');
        if (titleElement) {
            const originalTitle = titleElement.getAttribute('data-original-title') || titleElement.textContent;
            titleElement.setAttribute('data-original-title', originalTitle);
            titleElement.textContent = this.translateChartTitle(originalTitle);
            titleElement.title = titleElement.textContent; // Update tooltip
        }
        
        // Update chart dataset labels
        if (chartInstance.data && chartInstance.data.datasets) {
            chartInstance.data.datasets.forEach(dataset => {
                if (!dataset.originalLabel) {
                    dataset.originalLabel = dataset.label;
                }
                dataset.label = this.translateSeriesLabel(dataset.originalLabel);
            });
            
            // Update the chart to reflect changes
            chartInstance.update();
        }
        
        // Update statistics labels in the DOM
        const statsElement = document.getElementById(`stats-${chartId}`);
        if (statsElement) {
            const statsLabels = this.getStatisticsLabels();
            
            // Update the first characters of stat labels (used in mobile view)
            const shortLabels = statsElement.querySelectorAll('.chart-stat-label-short');
            shortLabels.forEach(label => {
                const labelType = label.className.includes('low') ? 'min' :
                                 label.className.includes('avg') ? 'avg' :
                                 label.className.includes('high') ? 'max' : 'current';
                
                if (statsLabels[labelType]) {
                    // Use first character of translated label
                    label.textContent = `${statsLabels[labelType].charAt(0).toUpperCase()}:`;
                }
            });
            
            // Update the full stat labels (used in desktop view)
            statsElement.querySelectorAll('.chart-stat-label-low').forEach(el => { 
                el.textContent = statsLabels.min;
            });
            statsElement.querySelectorAll('.chart-stat-label-avg').forEach(el => { 
                el.textContent = statsLabels.avg;
            });
            statsElement.querySelectorAll('.chart-stat-label-high').forEach(el => { 
                el.textContent = statsLabels.max;
            });
            statsElement.querySelectorAll('.chart-stat-label-now').forEach(el => { 
                el.textContent = statsLabels.current;
            });
        }
        
        // Update loading text if visible
        const loadingElement = document.getElementById(`loading-${chartId}`);
        if (loadingElement && loadingElement.style.display !== 'none') {
            const textElement = loadingElement.querySelector('div:not(.loading-spinner)');
            if (textElement) {
                textElement.textContent = this.getLoadingText();
            }
        }
        
        return true;
    }
};

// No backward compatibility functions - use ChartI18n directly