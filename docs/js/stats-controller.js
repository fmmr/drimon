/**
 * Stats Controller
 * 
 * Manages chart statistics display functionality, including
 * toggling visibility and storing user preferences.
 */

const StatsController = {
    /**
     * Toggle statistics display on all charts
     */
    toggleStats: function() {
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
                // Check if this is a multi-series chart from class name or data attribute
                const isMultiSeries = el.closest('.chart').classList.contains('multi-series');
                
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
                    ${!isMultiSeries ? `
                    <div class="chart-stat chart-stat-current">
                        <span class="chart-stat-label">
                            <span class="chart-stat-label-short">N:</span>
                            <span class="chart-stat-label-now"></span>
                        </span>—
                    </div>
                    ` : ''}
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
    },
    
    /**
     * Initialize stats controller with saved preferences
     */
    initialize: function() {
        // Apply saved stats display preference
        const statsVisible = localStorage.getItem('statsVisible') !== 'false';
        const statsToggle = document.getElementById('statsToggle');
        if (statsToggle) {
            statsToggle.classList.toggle('active', statsVisible);
        }
    }
};

// Export the controller
window.StatsController = StatsController;