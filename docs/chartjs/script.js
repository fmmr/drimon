// Global timezone setting
const timezone = "Europe/Oslo";

// Reference to fetchChartData function needed for periodic updates
// This will be set by chart_renderer.js

// Initialize app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial data for header
    fetchData();
    fetchMetData();
    
    // Set up periodic data refresh for header (every minute)
    setInterval(() => {
        // Update header data
        fetchData();
        fetchMetData();
        
        // Also refresh charts if showing the latest data
        const currentRange = getURLParameter('range') || '1';
        if (currentRange === '1' || currentRange === 'today') {
            const currentResults = parseInt(getURLParameter('results')) || 8000;
            
            // Use a gentle refresh approach that won't destroy the charts
            // but will update them with new data
            window.chartConfigs.forEach(async (config) => {
                try {
                    const newData = await fetchChartData(config, currentRange, currentResults);
                    if (window.chartInstances[config.id] && newData && newData.feeds && newData.feeds.length > 0) {
                        // Update chart data and refresh
                        const values = newData.feeds.map(feed => parseFloat(feed[`field${config.field}`]));
                        const labels = newData.feeds.map(feed => moment(feed.created_at).format('LT'));
                        
                        window.chartInstances[config.id].data.labels = labels;
                        window.chartInstances[config.id].data.datasets[0].data = values;
                        window.chartInstances[config.id].update('none'); // Update without animation
                    }
                } catch (e) {
                    console.error(`Error updating chart ${config.id}:`, e);
                }
            });
        }
    }, 60000);
    
    // Add click event to the logo for GitHub link
    const logo = document.getElementById('main-title');
    if (logo) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://github.com/fmmr/drimon', '_blank');
        });
    }
    
    // Add window resize handler with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            // Call resize handler in chart_renderer.js
            if (typeof window.resizeAllCharts === 'function') {
                window.resizeAllCharts();
            }
        }, 250);
    });
});