/**
 * Main Application Module
 * 
 * Core initialization and global utilities for the DriMon application.
 */

// Global timezone setting
const timezone = "Europe/Oslo";

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize moment.js locale based on the current language
    if (window.moment && window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        const lang = window.i18n.getCurrentLanguage() || 'no';
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    // Initialize layout adjustments
    if (typeof window.LayoutController !== 'undefined') {
        window.LayoutController.setupMobileLayout();
    }
    
    // Initialize theme
    if (typeof window.ThemeController !== 'undefined') {
        window.ThemeController.initialize();
    }
    
    // Initialize stats controller
    if (typeof window.StatsController !== 'undefined') {
        window.StatsController.initialize();
    }
    
    // Initialize date controller
    if (typeof window.DateController !== 'undefined') {
        window.DateController.initialize();
    }
    
    // Add click event to the logo for GitHub link
    const logo = document.getElementById('main-title');
    if (logo) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://github.com/fmmr/drimon', '_blank');
        });
    }
    
    // Fetch initial data for header (weather is handled separately in weather.js)
    if (typeof fetchData === 'function') {
        fetchData();
    }
    
    // Set up periodic data refresh for header (every minute)
    setInterval(() => {
        // Update header data (weather updates on its own schedule)
        if (typeof fetchData === 'function') {
            fetchData();
        }
        
        // Also refresh charts if showing the latest data
        const getParam = (name) => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name) || '';
        };
        
        const currentRange = getParam('range') || 'default';
        if (currentRange === '1' || currentRange === 'today' || currentRange === 'default') {
            const currentResults = parseInt(getParam('results')) || 8000;
            
            // Use a gentle refresh approach that won't destroy the charts
            // but will update them with new data
            if (window.chartConfigs && Array.isArray(window.chartConfigs)) {
                window.chartConfigs.forEach(async (config) => {
                    try {
                        // Get the effective range - if currentRange is 'default', use the chart's defaultRange or fallback to 1
                        const effectiveRange = currentRange === 'default' 
                            ? (config.defaultRange || 1)
                            : currentRange;
                        
                        const newData = await fetchChartData(config, effectiveRange, currentResults);
                        if (window.chartInstances[config.id] && newData) {
                            // Check if it's a multi-series chart
                            if (newData.is_multi_series && newData.series && newData.series.length > 0) {
                                // Update each series
                                for (let i = 0; i < newData.series.length; i++) {
                                    const series = newData.series[i];
                                    if (series && series.feeds && series.feeds.length > 0) {
                                        const values = series.feeds.map(feed => parseFloat(feed[`field${series.field}`]));
                                        
                                        // Update dataset if it exists
                                        if (window.chartInstances[config.id].data.datasets[i]) {
                                            window.chartInstances[config.id].data.datasets[i].data = values;
                                        }
                                    }
                                }
                                
                                // Update labels from first series
                                if (newData.series[0] && newData.series[0].feeds && newData.series[0].feeds.length > 0) {
                                    // Format dates consistently with auto-detected format
                                    let timeFormat = 'HH:mm'; // Default format
                                    
                                    // Try to get the existing format the chart is using
                                    if (window.chartTimeFormats && window.chartTimeFormats[config.id]) {
                                        timeFormat = window.chartTimeFormats[config.id];
                                    } else if (window.determineSmartTimeFormat) {
                                        // Calculate smart format based on timestamps
                                        const timestamps = newData.series[0].feeds.map(feed => feed.created_at);
                                        timeFormat = window.determineSmartTimeFormat(timestamps);
                                    }
                                    
                                    const labels = newData.series[0].feeds.map(feed => moment(feed.created_at).format(timeFormat));
                                    window.chartInstances[config.id].data.labels = labels;
                                }
                                
                                // Update the chart - this will refresh the legend with current values
                                window.chartInstances[config.id].update('none');
                                
                                // Recalculate stats after update
                                if (window.recalculateChartStats) {
                                    window.recalculateChartStats(window.chartInstances[config.id]);
                                }
                            } 
                            // Single series chart
                            else if (newData.feeds && newData.feeds.length > 0) {
                                const values = newData.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
                                // Format dates consistently with auto-detected format
                                let timeFormat = 'HH:mm'; // Default format
                                
                                // Try to get the existing format the chart is using
                                if (window.chartTimeFormats && window.chartTimeFormats[config.id]) {
                                    timeFormat = window.chartTimeFormats[config.id];
                                } else if (window.determineSmartTimeFormat) {
                                    // Calculate smart format based on timestamps
                                    const timestamps = newData.feeds.map(feed => feed.created_at);
                                    timeFormat = window.determineSmartTimeFormat(timestamps);
                                }
                                
                                const labels = newData.feeds.map(feed => moment(feed.created_at).format(timeFormat));
                                
                                window.chartInstances[config.id].data.labels = labels;
                                window.chartInstances[config.id].data.datasets[0].data = values;
                                window.chartInstances[config.id].update('none'); // Update without animation
                                
                                // Recalculate stats after update
                                if (window.recalculateChartStats) {
                                    window.recalculateChartStats(window.chartInstances[config.id]);
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`Error updating chart ${config.id}:`, e);
                    }
                });
            }
        }
    }, 60000);
    
    // Add window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Call resize handler in chart_renderer.js
            if (typeof window.resizeAllCharts === 'function') {
                window.resizeAllCharts();
            }
            
            // Reattach date dropdown handlers after DOM manipulation
            if (window.DateController && typeof window.DateController.reattachDateDropdownHandlers === 'function') {
                window.DateController.reattachDateDropdownHandlers();
            }
        }, 250);
    });
});

// Note: Using Utils.getURLParameter for URL parameter access now