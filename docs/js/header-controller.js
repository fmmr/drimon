/**
 * Header Controller
 * 
 * Handles the initialization and event binding for the page header
 */

// Initialize the header when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get the header mount point
    const headerMountPoint = document.getElementById('header-mount-point');
    
    // Check for dashboard and mobile modes
    const isDashboardMode = window.Utils.isDashboardMode();
    const isMobileMode = window.matchMedia('(max-width: 768px)').matches && !isDashboardMode;
    
    // Create the header using appropriate config
    let headerConfig;
    if (isDashboardMode) {
        headerConfig = window.headerConfigs.dashboard;
    } else if (isMobileMode) {
        headerConfig = window.headerConfigs.mobile || window.headerConfigs.desktop; // Fallback if mobile not ready
    } else {
        headerConfig = window.headerConfigs.desktop;
    }
    
    const header = createHeader(headerConfig);
    
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
    
    // Set up reset chart order button
    const resetChartOrderButton = document.getElementById('resetChartOrder');
    if (resetChartOrderButton && window.ChartLayout) {
        resetChartOrderButton.addEventListener('click', () => {
            window.ChartLayout.resetChartOrder();
            // Optionally reload the page to show the reset
            window.location.reload();
        });
    }
    
    // Set up reload page button
    const reloadPageButton = document.getElementById('reloadPage');
    if (reloadPageButton) {
        reloadPageButton.addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    // Set up shutdown Pi button
    const shutdownPiButton = document.getElementById('shutdownPi');
    if (shutdownPiButton) {
        shutdownPiButton.addEventListener('click', () => {
            if (confirm('Shutdown Pi? This will turn off the system.')) {
                fetch('http://localhost:9999/shutdown', {
                    method: 'POST'
                }).then(response => {
                    if (response.ok) {
                        alert('Shutdown initiated. System will shutdown shortly.');
                    }
                }).catch(() => {
                    alert('Could not connect to shutdown service. Make sure shutdown_service.py is running.');
                });
            }
        });
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
    
    // Set up keyboard shortcuts directly
    setupKeyboardShortcuts(headerConfig);
    
    // Dispatch a custom event to indicate the header is fully initialized
    // This helps other components that depend on the header being ready
    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('header:initialized'));
    }, 0);
});

/**
 * Sets up keyboard shortcuts based on header configuration
 * @param {Object} config - Header configuration object
 */
function setupKeyboardShortcuts(config) {
    const shortcuts = new Map();
    
    // Collect shortcuts from all components
    Object.values(config.components).forEach(component => {
        if (component.config && component.config.keyboardShortcut) {
            shortcuts.set(component.config.keyboardShortcut, component.type);
        }
        
        // Also check actions for settings dropdown
        if (component.config && component.config.actions) {
            component.config.actions.forEach(actionType => {
                const actionComponent = config.components[actionType];
                if (actionComponent && actionComponent.config && actionComponent.config.keyboardShortcut) {
                    shortcuts.set(actionComponent.config.keyboardShortcut, actionType);
                }
            });
        }
    });
    
    // Add global keydown listener
    document.addEventListener('keydown', (e) => {
        // Only trigger if no input/textarea is focused and no modifier keys
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || 
            e.ctrlKey || e.metaKey || e.altKey) return;
        
        const key = e.key.toLowerCase();
        const componentType = shortcuts.get(key);
        
        if (componentType) {
            e.preventDefault();
            
            // Find and click the corresponding button
            const button = document.getElementById(componentType);
            if (button) {
                button.click();
            }
        }
    });
}