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
        if (window.chartInstances) {
            Object.values(window.chartInstances).forEach(chart => {
                if (chart) {
                    this.translateChart(chart);
                }
            });
        }
    },
    
    /**
     * Translates all chart labels and updates the chart display
     * @param {Chart} chart - The Chart.js instance to translate
     * @returns {void}
     */
    translateChart: function(chart) {
        if (!chart || !chart.data || !chart.data.datasets) {
            return;
        }

        // Get chart info
        const chartId = chart.canvas.id;
        const chartConfig = window.chartConfigs.find(c => c.id === chartId);
        const isMultiSeries = chartConfig && chartConfig.series && 
                            Array.isArray(chartConfig.series) && chartConfig.series.length > 1;
        
        // Get special handling options from chart config
        const specialHandling = chartConfig && chartConfig.specialHandling;

        // Update all dataset labels with correct translations
        this.translateDatasetLabels(chart, chartConfig, isMultiSeries);
        
        // Update chart legend with translated labels
        this.updateChartLegend(chart, chartConfig, isMultiSeries, specialHandling);
        
        // Apply changes directly with animation disabled to avoid flicker
        try {
            // Use animation.duration = 0 to prevent legend flicker
            const originalAnimation = chart.options.animation;
            chart.options.animation = { duration: 0 };
            
            // Update with animation disabled
            chart.update();
            
            // Restore original animation settings
            chart.options.animation = originalAnimation;
        } catch (e) {
            console.error("Error updating chart after translation:", e);
        }
    },
    
    /**
     * Translates all dataset labels in a chart
     * @param {Chart} chart - The Chart.js instance
     * @param {Object} chartConfig - Configuration for the chart
     * @param {boolean} isMultiSeries - Whether chart has multiple series
     * @returns {void}
     */
    translateDatasetLabels: function(chart, chartConfig, isMultiSeries) {
        chart.data.datasets.forEach((dataset, index) => {
            if (!dataset.label) return;
            
            // Get original label (without any current value)
            const originalLabel = dataset.label.split(':')[0].trim();
            let translatedLabel;
            
            // For multi-series charts, look up series titles from chart config
            if (isMultiSeries && chartConfig && chartConfig.series && chartConfig.series[index]) {
                const series = chartConfig.series[index];
                translatedLabel = this.translateSeriesLabel(series);
            } else {
                // For single series charts, use chart title
                translatedLabel = this.translateChartTitle(chartConfig);
            }
            
            // Apply translations and preserve value part
            if (translatedLabel && translatedLabel !== originalLabel) {
                const parts = dataset.label.split(':');
                if (parts.length > 1) {
                    dataset.label = `${translatedLabel}: ${parts[1].trim()}`;
                } else {
                    dataset.label = translatedLabel;
                }
            }
        });
    },
    
    /**
     * Updates chart legend with translated labels
     * @param {Chart} chart - The Chart.js instance
     * @param {Object} chartConfig - Configuration for the chart
     * @param {boolean} isMultiSeries - Whether chart has multiple series
     * @param {Object} specialHandling - Special handling options from chart config
     * @returns {void}
     */
    updateChartLegend: function(chart, chartConfig, isMultiSeries, specialHandling) {
        if (!chart.options || !chart.options.plugins || !chart.options.plugins.legend) {
            return;
        }
        
        try {
            // Store original legend settings
            const originalLegendSettings = {
                display: chart.options.plugins.legend.display,
                labels: {...chart.options.plugins.legend.labels}
            };
            
            // Update legend styling without hiding it first
            if (isMultiSeries) {
                // Apply consistent styling without changing display state
                Object.assign(chart.options.plugins.legend, {
                    align: 'center', // Center the legend
                    labels: {
                        ...originalLegendSettings.labels,
                        usePointStyle: false, // Don't use point style for better line representation
                        boxWidth: 15, // Width for line representation
                        boxHeight: 0, // No explicit height for proper line rendering
                        lineWidth: 2, // Thickness of the line in the legend
                        padding: 8, // Add padding for better spacing
                        font: {
                            size: 9, // Smaller font size
                            weight: '600' // Semi-bold weight (between normal 400 and bold 700)
                        }
                    }
                });
            }
            
            // Set up custom legend generator that properly handles translations
            const defaultGenerateLabels = Chart.defaults.plugins.legend.labels.generateLabels;
            chart.options.plugins.legend.labels.generateLabels = function(chart) {
                const labels = defaultGenerateLabels(chart);
                
                // For multi-series charts, handle legend labels specially
                if (isMultiSeries) {
                    labels.forEach((label, i) => {
                        if (i < chart.data.datasets.length && chartConfig && chartConfig.series && i < chartConfig.series.length) {
                            const dataset = chart.data.datasets[i];
                            
                            // Get original series title from configuration (source of truth)
                            const series = chartConfig.series[i];
                            let translatedTitle = '';
                            
                            // First check if we have the dataset with stored information
                            if (dataset) {
                                // First try to use the translated label that should be set in the dataset directly
                                if (dataset.label) {
                                    translatedTitle = dataset.label.split(':')[0].trim(); // Strip any value part
                                }
                                // If no valid dataset label, try to regenerate it
                                else if (dataset._titleKey || dataset._originalTitle) {
                                    // Use stored titleKey
                                    if (dataset._titleKey) {
                                        if (window.I18n && typeof window.I18n.translate === 'function') {
                                            translatedTitle = window.I18n.translate(dataset._titleKey);
                                        }
                                    } 
                                    // Fallback to original title
                                    else if (dataset._originalTitle) {
                                        translatedTitle = dataset._originalTitle;
                                    }
                                }
                            }
                                
                            // If we couldn't get the translation from the dataset, try the series config
                            if (!translatedTitle && series) {
                                // Get translated title using the chartI18n helper
                                translatedTitle = window.ChartI18n.translateSeriesLabel(series);
                            }
                            
                            // Last resort fallback
                            if (!translatedTitle) {
                                translatedTitle = `Series ${i+1}`;
                            }
                            
                            // Extract current value if present to append to label
                            let valuePart = '';
                            if (dataset && dataset.data && dataset.data.length > 0) {
                                const currentValue = dataset.data[dataset.data.length - 1];
                                if (currentValue !== undefined && !isNaN(currentValue)) {
                                    // Format based on the value range
                                    const range = 0; // Default range for formatting
                                    valuePart = `: ${window.ChartUtils.formatNumber(currentValue, chartConfig, range)}`;
                                }
                            }
                            
                            // Special handling for charts that need consistent labels
                            if (specialHandling && specialHandling.consistentLegendLabels) {
                                // Apply the translation directly to both the dataset label and legend text
                                const fullLabel = `${translatedTitle}${valuePart}`;
                                
                                // Update in both places to ensure consistency
                                dataset.label = fullLabel;
                                label.text = fullLabel;
                            } else {
                                // For other charts, ensure the dataset label is properly set first
                                if (dataset && translatedTitle) {
                                    // Update dataset label if it doesn't match the translation
                                    const currentLabelBase = dataset.label ? dataset.label.split(':')[0].trim() : '';
                                    if (currentLabelBase !== translatedTitle) {
                                        if (valuePart) {
                                            dataset.label = `${translatedTitle}${valuePart}`;
                                        } else {
                                            dataset.label = translatedTitle;
                                        }
                                    }
                                }
                                
                                // Then set the legend text from the dataset
                                if (dataset && dataset.label) {
                                    label.text = dataset.label;
                                } else if (translatedTitle) {
                                    // Fallback if dataset.label is not available
                                    label.text = `${translatedTitle}${valuePart}`;
                                }
                            }
                        }
                    });
                }
                
                return labels;
            };
        } catch (e) {
            console.error("Error updating legend:", e);
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
            // If title property is available, use it directly
            if (titleOrConfig.title) {
                // Try to translate using generatedKey pattern
                const generatedKey = titleOrConfig.title.replace(/\s+/g, '') + 'Chart';
                
                // Check if this key exists in translations
                if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(generatedKey)) {
                    return window.I18n.translate(generatedKey);
                }
                
                // Check if title itself is a valid key
                if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(titleOrConfig.title)) {
                    return window.I18n.translate(titleOrConfig.title);
                }
                
                return titleOrConfig.title;
            }
            return '';
        }
        
        // For string titles, generate and check keys directly
        if (typeof titleOrConfig === 'string') {
            // Generate a key from the title
            const generatedKey = titleOrConfig.replace(/\s+/g, '') + 'Chart';
            
            // Check if this key exists in translations
            if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(generatedKey)) {
                return window.I18n.translate(generatedKey);
            }
            
            // Check if title itself is a valid key
            if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(titleOrConfig)) {
                return window.I18n.translate(titleOrConfig);
            }
            
            // Try to translate with the generated key anyway
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
            // Use title property directly
            if (labelOrSeries.title) {
                // Check if title is a valid translation key
                if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(labelOrSeries.title)) {
                    return window.I18n.translate(labelOrSeries.title);
                }
                
                // Try with simple lowercase key
                const simpleKey = labelOrSeries.title.toLowerCase().replace(/\s+/g, '');
                if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(simpleKey)) {
                    return window.I18n.translate(simpleKey);
                }
                
                return labelOrSeries.title;
            }
            
            // If no title keys are found, log a warning
            console.warn('Series object has no titleKey or title property:', labelOrSeries);
            return 'missing_series_title';
        }
        
        // For string labels
        if (typeof labelOrSeries === 'string') {
            // Check if the string is already a valid translation key
            if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(labelOrSeries)) {
                return window.I18n.translate(labelOrSeries);
            }
            
            // Try with simple lowercase key
            const simpleKey = labelOrSeries.toLowerCase().replace(/\s+/g, '');
            if (window.I18n && window.I18n.hasKey && window.I18n.hasKey(simpleKey)) {
                return window.I18n.translate(simpleKey);
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

