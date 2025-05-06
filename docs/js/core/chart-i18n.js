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
     * Maps for common chart and series titles
     * @private
     */
    _titleMap: {
        'Temperatur': 'temperatureChart',
        'Vindusåpning': 'windowChart',
        'Lys': 'lightChart',
        'Batteri (%)': 'batteryPercentChart',
        'Temperatur Diff': 'tempDiffChart',
        'Plante Temperaturer': 'plantsTempsChart',
        'Utetemperatur': 'outTempChart',
        'Sensor Temperaturer': 'sensorsTempsChart',
        'Luftfuktighet': 'humidityChart',
        'Lufttrykk': 'pressureChart',
        'Vind': 'windChart',
        'Nedbør': 'rainChart',
        'Jordfuktighet': 'soilMoistureChart',
        'Batteri (spenning)': 'batteryVoltageChart',
        'WiFi': 'wifiChart',
        'Tid brukt': 'timeUsedChart'
    },
    
    _seriesMap: {
        'Tak': 'ceiling',
        'Intern': 'internal',
        'Agurk': 'cucumber',
        'Agurk 1': 'cucumber1',
        'Agurk 2': 'cucumber2',
        'Padron': 'padron',
        'Gulv': 'floor'
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
                return titleOrConfig.title;
            }
            return '';
        }
        
        // Check if this is a known title in our map
        if (typeof titleOrConfig === 'string' && this._titleMap[titleOrConfig]) {
            return window.I18n.translate(this._titleMap[titleOrConfig]);
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
        
        // Check if this is a known series in our map
        if (typeof labelOrSeries === 'string' && this._seriesMap[labelOrSeries]) {
            return window.I18n.translate(this._seriesMap[labelOrSeries]);
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

// For backward compatibility
window.translateChartTitle = function(title) {
    return window.ChartI18n.translateChartTitle(title);
};

window.translateSeriesLabel = function(label) {
    return window.ChartI18n.translateSeriesLabel(label);
};