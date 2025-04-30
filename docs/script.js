// Global timezone setting
const timezone = "Europe/Oslo";

// Reference to fetchChartData function needed for periodic updates
// This will be set by chart_renderer.js

// Function to toggle dark mode
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Toggle theme attribute
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    
    // Update toggle button icon
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('.icon');
        if (icon) {
            icon.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }
    
    // Save preference in localStorage
    localStorage.setItem('darkMode', isDark ? 'light' : 'dark');
    
    // Update chart colors if they exist
    updateChartColors(!isDark);
}

// Function to update chart colors based on theme
function updateChartColors(isDark) {
    // Only update if charts exist
    if (!window.chartInstances) return;
    
    // Get all chart instances
    Object.values(window.chartInstances).forEach(chart => {
        if (!chart) return;
        
        // Update grid colors
        if (chart.options.scales.y.grid) {
            chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        }
        
        // Update tick colors
        if (chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.color = isDark ? '#aaa' : '#666';
        }
        
        if (chart.options.scales.x.ticks) {
            chart.options.scales.x.ticks.color = isDark ? '#aaa' : '#666';
        }
        
        // Update without animation
        chart.update('none');
    });
}

// Function to toggle stats display
function toggleStats() {
    // Get current visibility state
    const isVisible = localStorage.getItem('statsVisible') !== 'false';
    
    // Toggle the state
    localStorage.setItem('statsVisible', isVisible ? 'false' : 'true');
    
    // Update button appearance
    const statsToggle = document.getElementById('statsToggle');
    if (statsToggle) {
        statsToggle.classList.toggle('active', !isVisible);
    }
    
    // Update all stat elements' visibility - ensure they have content before showing
    document.querySelectorAll('.chart-stats').forEach(el => {
        // First ensure the elements have content if toggling to visible
        if (!isVisible && el.innerHTML.trim() === '') {
            // Create placeholder content if empty - will be replaced when charts update
            el.innerHTML = `
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">L:</span>
                        <span class="chart-stat-label-low"></span>
                    </span>—
                </div>
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">A:</span>
                        <span class="chart-stat-label-avg"></span>
                    </span>—
                </div>
                <div class="chart-stat">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">H:</span>
                        <span class="chart-stat-label-high"></span>
                    </span>—
                </div>
                <div class="chart-stat chart-stat-current">
                    <span class="chart-stat-label">
                        <span class="chart-stat-label-short">N:</span>
                        <span class="chart-stat-label-now"></span>
                    </span>—
                </div>
            `;
        }
        
        // Now set display style
        el.style.display = isVisible ? 'none' : 'flex';
        
        // Ensure stats get proper height allocation
        if (!isVisible) {
            // Force a reflow to ensure height is allocated
            setTimeout(() => {
                if (window.chartInstances) {
                    Object.values(window.chartInstances).forEach(chart => {
                        if (chart) chart.resize();
                    });
                }
            }, 10);
        }
    });
}

// Initialize app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved dark mode preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update toggle button icon
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle && savedTheme === 'dark') {
            const icon = darkModeToggle.querySelector('.icon');
            if (icon) {
                icon.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    }
    
    // Apply saved stats display preference
    const statsVisible = localStorage.getItem('statsVisible') !== 'false';
    const statsToggle = document.getElementById('statsToggle');
    if (statsToggle) {
        statsToggle.classList.toggle('active', statsVisible);
    }
    
    // Set up dark mode toggle button
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Set up stats toggle button
    if (statsToggle) {
        statsToggle.addEventListener('click', toggleStats);
    }
    
    // Fetch initial data for header (weather is handled separately in weather.js)
    fetchData();
    
    // Set up periodic data refresh for header (every minute)
    setInterval(() => {
        // Update header data (weather updates on its own schedule)
        fetchData();
        
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