/**
 * Theme Controller
 * 
 * Handles theme switching between light and dark mode, including
 * updates to chart colors and storage of user preferences.
 */

const ThemeController = {
    /**
     * Toggle between dark and light mode
     */
    toggleDarkMode: function() {
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
        this.updateChartColors(!isDark);
    },
    
    /**
     * Update chart colors based on current theme
     * @param {boolean} isDark - Whether dark mode is active
     */
    updateChartColors: function(isDark) {
        // Only update if charts exist
        if (!window.chartInstances) return;
        
        // Get all chart instances
        Object.values(window.chartInstances).forEach(chart => {
            this.updateSingleChartColors(chart, isDark);
        });
    },
    
    /**
     * Update colors for a single chart instance
     * @param {Chart} chart - Chart instance to update
     * @param {boolean} isDark - Whether dark mode is active
     */
    updateSingleChartColors: function(chart, isDark) {
        if (!chart) return;
        
        // Update grid colors
        if (chart.options.scales.y.grid) {
            chart.options.scales.y.grid.color = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        }
        
        // Update tick colors
        if (chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.color = isDark ? '#c0c0c0' : '#666';
        }
        
        if (chart.options.scales.x.ticks) {
            chart.options.scales.x.ticks.color = isDark ? '#c0c0c0' : '#666';
        }
        
        // Update legend colors for better readability in dark mode
        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = isDark ? '#c0c0c0' : '#666';
            
            // Make legend text slightly bolder in dark mode
            if (chart.options.plugins.legend.labels.font) {
                chart.options.plugins.legend.labels.font.weight = isDark ? 500 : 400;
            }
        }
        
        // Update without animation
        chart.update('none');
    },
    
    /**
     * Apply saved theme preference on page load
     */
    initialize: function() {
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
    }
};

// Export the controller
window.ThemeController = ThemeController;