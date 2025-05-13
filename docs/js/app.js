/**
 * Main Application Module
 *
 * Core initialization and global utilities for the DriMon application.
 */

// Global timezone setting
const timezone = "Europe/Oslo";

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Restore scroll position if coming from auto-refresh
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition));
        localStorage.removeItem('scrollPosition');
    }
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
    
    // Sun events data is updated via the header:initialized event
    
    // Set up periodic data refresh for header (every minute)
    // Also create a longer interval for full page refresh (prevent blanking issue)
    let lastFullRefreshTime = Date.now();
    let lastUserActivity = Date.now();
    const FULL_REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes (reduced from 25)

    // Track user activity to reset refresh timer when user is active
    const resetActivityTimer = () => {
        lastUserActivity = Date.now();
        lastFullRefreshTime = Date.now(); // Reset the full refresh timer on user activity
    };

    // Add activity listeners
    ['click', 'touchstart', 'mousemove', 'keypress', 'scroll', 'wheel'].forEach(eventType => {
        window.addEventListener(eventType, resetActivityTimer, { passive: true });
    });

    // Create heartbeat to keep session alive
    setInterval(() => {
        // Check if we're running from a server or local file
        const isLocalFile = window.location.protocol === 'file:';

        if (!isLocalFile) {
            // Send a tiny request to keep the session active (only when on a server)
            fetch('./site.webmanifest?heartbeat=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-store'
            }).catch(() => {
                // Ignore errors on heartbeat
            });
        } else {
            // For local file usage, just log a ping to keep JS engine active
            console.debug('Local heartbeat ping at ' + new Date().toISOString());
        }
    }, 5 * 60 * 1000); // Every 5 minutes

    setInterval(() => {
        // Update header data (weather updates on its own schedule)
        if (typeof fetchData === 'function') {
            fetchData();
        }

        // Check if we need a full page refresh to prevent chart blanking
        const now = Date.now();
        const timeSinceLastRefresh = now - lastFullRefreshTime;
        const timeSinceLastActivity = now - lastUserActivity;

        // Only perform a full refresh if:
        // 1. It's been more than the refresh interval since last refresh
        // 2. AND either:
        //    a. User has been inactive for at least 2 minutes (to avoid disrupting active use)
        //    b. OR it's been an extremely long time (45+ min) since the last refresh
        if (timeSinceLastRefresh > FULL_REFRESH_INTERVAL &&
            (timeSinceLastActivity > 2 * 60 * 1000 || timeSinceLastRefresh > 45 * 60 * 1000)) {

            // Log refresh event for debugging
            console.log('Performing full page refresh to prevent UI blanking');

            // Store current scroll position
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            localStorage.setItem('scrollPosition', scrollPosition.toString());

            // Reload page without the cache
            window.location.reload(true);
            return;
        }

        // Also refresh charts if showing the latest data
        const getParam = (name) => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name) || '';
        };

        // Check if any chart is showing signs of being detached
        const checkForDetachedCharts = () => {
            if (window.chartInstances) {
                for (const chartId in window.chartInstances) {
                    try {
                        const instance = window.chartInstances[chartId];
                        const element = document.getElementById(chartId);

                        // Check if either canvas is missing or chart is otherwise detached
                        if (!element || !element.parentElement ||
                            !instance.canvas || !instance.canvas.parentElement) {
                            console.log(`Chart ${chartId} appears to be detached, forcing refresh`);
                            return true; // Found a detached chart
                        }
                    } catch (err) {
                        console.log(`Error checking chart ${chartId}, assuming detached: ${err.message}`);
                        return true; // Error indicates likely detachment
                    }
                }
            }
            return false; // No detached charts found
        };

        // If any charts are detached, force a refresh soon
        if (checkForDetachedCharts()) {
            lastFullRefreshTime = 0;
        }

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
                                
                                try {
                                    // First check if the chart canvas still exists in the DOM
                                    const canvas = document.getElementById(config.id);
                                    const chartInstance = window.chartInstances[config.id];

                                    // Handle detached canvas - we need to rebuild the chart
                                    if (!canvas || !canvas.parentElement || !chartInstance.canvas || !chartInstance.canvas.parentElement) {
                                        // The chart is detached, create a new chart instance
                                        console.log(`Chart ${config.id} is detached, triggering full page refresh`);
                                        // Force a full page refresh on next interval
                                        lastFullRefreshTime = 0;
                                        return;
                                    }

                                    // Update the chart - this will refresh the legend with current values
                                    window.chartInstances[config.id].update('none');

                                    // Recalculate stats after update
                                    if (window.recalculateChartStats) {
                                        window.recalculateChartStats(window.chartInstances[config.id]);
                                    }
                                } catch (err) {
                                    // If we get an error, force refresh on next interval
                                    console.log(`Error updating chart ${config.id}, preparing for refresh: ${err.message}`);
                                    lastFullRefreshTime = 0;
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
                                
                                try {
                                    // First check if the chart canvas still exists in the DOM
                                    const canvas = document.getElementById(config.id);
                                    const chartInstance = window.chartInstances[config.id];

                                    // Handle detached canvas - we need to rebuild the chart
                                    if (!canvas || !canvas.parentElement || !chartInstance.canvas || !chartInstance.canvas.parentElement) {
                                        // The chart is detached, create a new chart instance
                                        console.log(`Chart ${config.id} is detached, triggering full page refresh`);
                                        // Force a full page refresh on next interval
                                        lastFullRefreshTime = 0;
                                        return;
                                    }

                                    // Update the chart data
                                    window.chartInstances[config.id].data.labels = labels;
                                    window.chartInstances[config.id].data.datasets[0].data = values;
                                    window.chartInstances[config.id].update('none'); // Update without animation

                                    // Recalculate stats after update
                                    if (window.recalculateChartStats) {
                                        window.recalculateChartStats(window.chartInstances[config.id]);
                                    }
                                } catch (err) {
                                    // If we get an error, force refresh on next interval
                                    console.log(`Error updating chart ${config.id}, preparing for refresh: ${err.message}`);
                                    lastFullRefreshTime = 0;
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