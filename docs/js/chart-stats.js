/**
 * @file chart-stats.js
 * @description Utility functions for chart statistics management
 * @module core/chart-stats
 */

/**
 * @namespace ChartStats
 * @description Utility functions for chart statistics and display
 */
window.ChartStats = window.ChartStats || {
    /**
     * Get translated labels for statistics (Low, Avg, High, Now)
     * @returns {Object} Object with translated labels
     */
    getStatLabels: function() {
        const lowTranslation = window.I18n.translate('low');
        const avgTranslation = window.I18n.translate('avg');
        const highTranslation = window.I18n.translate('high');
        const nowTranslation = window.I18n.translate('now');
        
        return {
            lowLabel: lowTranslation.length > 0 ? lowTranslation[0].toUpperCase() : 'L',
            avgLabel: avgTranslation.length > 0 ? avgTranslation[0].toUpperCase() : 'A',
            highLabel: highTranslation.length > 0 ? highTranslation[0].toUpperCase() : 'H',
            nowLabel: nowTranslation.length > 0 ? nowTranslation[0].toUpperCase() : 'N',
            lowFullLabel: lowTranslation,
            avgFullLabel: avgTranslation,
            highFullLabel: highTranslation,
            nowFullLabel: nowTranslation
        };
    },
    
    /**
     * Format a number for display in stats based on its range and config
     * @param {number} value - The number to format
     * @param {Object} config - Chart configuration
     * @param {number} range - The data range
     * @returns {string} Formatted number as string
     */
    formatStatValue: function(value, config, range) {
        // Use the centralized Utils.formatNumber function
        return window.Utils.formatNumber(value, config, range);
    },
    
    /**
     * Creates HTML for a single stat item
     * @param {string} label - The label (single character)
     * @param {string} labelClass - The class for the label span
     * @param {number|null} value - The value to display
     * @param {string} unit - The unit to display
     * @param {Function} formatFunc - The formatting function
     * @param {Object} config - Chart configuration
     * @param {number} range - Data range
     * @param {string} extraClass - Additional CSS class
     * @returns {string} HTML string for the stat item
     */
    createStatHtml: function(label, labelClass, fullLabel, value, unit, formatFunc, config, range, extraClass = '') {
        return `
        <div class="chart-stat ${extraClass}">
            <span class="chart-stat-label">
                <span class="chart-stat-label-short">${label}:</span>
                <span class="chart-stat-label-${labelClass}" data-full-label="${fullLabel}:"></span>
            </span>${value !== null ? this.formatStatValue(value, config, range) + unit : '—'}
        </div>`;
    },
    
    /**
     * Updates chart statistics based on calculated values
     * @param {string} chartId - Chart ID
     * @param {Object} stats - Statistics object with min, max, avg values
     * @param {boolean} isMultiSeries - Whether this is a multi-series chart
     * @returns {void}
     */
    updateChartStats: function(chartId, stats, isMultiSeries) {
        const statsEl = document.getElementById(`stats-${chartId}`);
        if (!statsEl) return;
        
        // Get chart config for unit and other properties
        const config = window.chartConfigs.find(c => c.id === chartId);
        if (!config) return;
        
        const unit = config.unit || '';
        
        // Get statistics
        const { minValue, maxValue, avgValue, currentValue } = stats;
        const range = maxValue - minValue;
        
        // Get translated labels
        const labels = this.getStatLabels();
        
        // Build HTML for stats display
        const html = `
            ${this.createStatHtml(labels.lowLabel, 'low', labels.lowFullLabel, minValue, unit, null, config, range)}
            ${this.createStatHtml(labels.avgLabel, 'avg', labels.avgFullLabel, avgValue, unit, null, config, range)}
            ${this.createStatHtml(labels.highLabel, 'high', labels.highFullLabel, maxValue, unit, null, config, range)}
            ${!isMultiSeries ? this.createStatHtml(labels.nowLabel, 'now', labels.nowFullLabel, currentValue, unit, null, config, range, 'chart-stat-current') : ''}
        `;
        
        // Update stats container
        statsEl.innerHTML = html;
        
        // Apply visibility based on user preference
        const statsVisible = localStorage.getItem('statsVisible') !== 'false';
        statsEl.style.display = statsVisible ? 'flex' : 'none';
    },
    
    /**
     * Recalculates statistics for a chart and updates display
     * @param {Chart} chart - The Chart.js instance
     * @returns {void}
     */
    recalculateChartStats: function(chart) {
        if (!chart || !chart.data || !chart.data.datasets) return;
        
        // Get chart info
        const chartId = chart.canvas.id;
        const chartConfig = window.chartConfigs.find(c => c.id === chartId);
        if (!chartConfig) return;
        
        const isMultiSeries = chartConfig.series && 
                             Array.isArray(chartConfig.series) && 
                             chartConfig.series.length > 1;
        
        // Get active datasets using utility function
        const activeDatasets = window.ChartUtils.getActiveDatasets(chart);
        
        // Calculate statistics using centralized Utils function
        const stats = window.Utils.calculateStatistics({
            datasets: activeDatasets
        });
        
        // Update the stats display
        this.updateChartStats(chartId, stats, isMultiSeries);
    },
    
    /**
     * Ensures all charts have properly formatted statistics
     * Handles special LAHN-style statistics formatting
     * @returns {void}
     */
    updateAllChartStats: function() {
        // Process all chart instances
        if (!window.chartInstances) return;
        
        // Update stats for each chart instance
        Object.entries(window.chartInstances).forEach(([chartId, chartInstance]) => {
            if (!chartInstance) return;
            
            // Handle instances with special stats formatting (LAHN style)
            const config = window.chartConfigs.find(c => c.id === chartId);
            if (!config) return;
            
            this.recalculateChartStats(chartInstance);
        });
    }
};