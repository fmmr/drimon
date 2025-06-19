/**
 * Header Controller
 * 
 * Handles the initialization and event binding for the page header
 */

// Initialize the header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the header mount point
    const headerMountPoint = document.getElementById('header-mount-point');
    
    // Check for dashboard mode
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    const urlDashboardMode = getURLParameter('dashboard') === 'true';
    const isPi = (window.screen.width === 800 && window.screen.height === 480) || 
                 (/CrOS.*x86_64/.test(navigator.userAgent) && window.screen.width <= 800);
    const isDashboardMode = urlDashboardMode || isPi;
    
    // Create the header using appropriate config
    const header = isDashboardMode ? createHeader(DashboardHeaderConfig) : createHeader();
    
    // Mount the header to the DOM
    headerMountPoint.appendChild(header);

    // Initialize the page after header is created
    // This ensures all event handlers are attached to the newly created header elements
    
    // Set up dark mode toggle button
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle && window.ThemeController) {
        darkModeToggle.addEventListener('click', () => window.ThemeController.toggleDarkMode());
    }
    
    // Set up stats toggle button
    const statsToggle = document.getElementById('statsToggle');
    if (statsToggle && window.StatsController) {
        statsToggle.addEventListener('click', () => window.StatsController.toggleStats());
    }
    
    // Initialize date controller
    if (window.DateController) {
        window.DateController.initialize();
    }
    
    // Apply translations to the page
    document.addEventListener('i18nReady', () => {
        // Update all translatable elements on the page
        if (window.I18n && typeof window.I18n.updatePageLanguage === 'function') {
            window.I18n.updatePageLanguage();
        }
        
        // Allow ChartI18n to update chart translations
        if (window.chartInstances) {
            Object.values(window.chartInstances).forEach(chart => {
                if (chart) {
                    window.ChartI18n.translateChart(chart);
                }
            });
        }
    });
    
    // Dispatch a custom event to indicate the header is fully initialized
    // This helps other components that depend on the header being ready
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('header:initialized'));
    }, 0);
});