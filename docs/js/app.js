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
    
    // Initialize charts
    // Get URL parameters helper
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    // Get range and results from URL parameters or use defaults
    // Default to 'default' range (house icon) if no range parameter is provided
    const range = getURLParameter('range') || 'default';
    const results = parseInt(getURLParameter('results')) || 8000;
    
    // Ensure only one date chip is active on load
    setTimeout(() => {
        const allDateChips = document.querySelectorAll('.date-chip');
        
        // First remove active class from all chips
        allDateChips.forEach(chip => {
            chip.classList.remove('active');
        });
        
        // Then find and activate the current range chip
        const activeChip = document.querySelector(`.date-chip[data-range="${range}"]`);
        if (activeChip) {
            activeChip.classList.add('active');
        }
    }, 100);
    
    // Initialize chart loading with a short delay to avoid blocking the initial render
    setTimeout(() => {
        // Initialize charts
        loadAllCharts(range, results).then(() => {
            // Start auto-refresh after initial load
            window.startChartAutoRefresh(90);
        });
    }, 100); // Short delay to allow UI to render first
    
    // Add a failsafe for charts disappearing, but with reduced frequency to avoid performance issues
    setInterval(() => {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer && chartContainer.children.length === 0) {
            
            // Make sure Utils is defined before using it
            if (!window.Utils) {
                console.error('Utils is not defined in failsafe interval. Critical dependency missing.');
                return;
            }
            
            // Get current range and results
            const currentRange = window.Utils.getURLParameter('range') || '1';
            const currentResults = parseInt(window.Utils.getURLParameter('results')) || 8000;
            
            // Reload all charts
            loadAllCharts(currentRange, currentResults);
        }
    }, 60000); // Check every 60 seconds (reduced from 30s)
    
    // Initialize sorting functionality
    /**
     * Initializes chart sorting functionality with desktop and mobile select elements
     * This function can be called later when we're sure the dropdown exists
     */
    window.initializeSorting = function() {
        const sortSelect = document.getElementById('sortSelect');
        const mobileSortSelect = document.getElementById('mobileSortSelect');
        
        if (!sortSelect) {
            // If sort select isn't found, try again after a delay
            setTimeout(window.initializeSorting, 500);
            return;
        }
        
        // Try to restore last used sort preference
        const lastSort = localStorage.getItem('chartSortPreference');
        
        // Initialize both selects with the saved preference
        if (lastSort) {
            sortSelect.value = lastSort;
            if (mobileSortSelect) {
                mobileSortSelect.value = lastSort;
            }
        }
        
        /**
         * Handles sort selection changes from any dropdown
         * @param {string} category - The category to sort by
         * @param {HTMLElement} sourceElement - The select element that triggered the change
         */
        const handleSortChange = (category, sourceElement) => {
            // Save preference to localStorage
            localStorage.setItem('chartSortPreference', category);
            
            // Update the other dropdown if this change came from one of them
            if (sourceElement === sortSelect && mobileSortSelect) {
                mobileSortSelect.value = category;
            } else if (sourceElement === mobileSortSelect && sortSelect) {
                sortSelect.value = category;
            }
            
            // Perform the actual sorting
            window.sortChartsByCategory(category);
        };
        
        // Set up event listeners for both dropdowns
        sortSelect.addEventListener('change', (event) => {
            handleSortChange(event.target.value, sortSelect);
        });
        
        if (mobileSortSelect) {
            mobileSortSelect.addEventListener('change', (event) => {
                handleSortChange(event.target.value, mobileSortSelect);
            });
        }
        
        // Apply the initial sort if we're in mobile mode and a preference exists
        if (window.innerWidth <= 768 && lastSort) {
            setTimeout(() => window.sortChartsByCategory(lastSort), 500);
        }
    };
    
    /**
     * Sets up a MutationObserver to initialize sorting when elements are ready
     * This ensures sorting is initialized even when elements are added dynamically
     */
    function setupSortingInitialization() {
        // Try to initialize sorting immediately first
        window.initializeSorting();
        
        // Set up a MutationObserver to detect when the sort select elements are added to the DOM
        const bodyObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    // Check if sortSelect was added
                    if (document.getElementById('sortSelect')) {
                        window.initializeSorting();
                        // No need to keep observing once we've found it
                        bodyObserver.disconnect();
                        break;
                    }
                }
            }
        });
        
        // Start observing DOM changes
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        
        // Safety cleanup - disconnect after 10 seconds if it hasn't found the element
        setTimeout(() => bodyObserver.disconnect(), 10000);
    }
    
    // Initialize sorting system
    setupSortingInitialization();
    
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
                            return true; // Found a detached chart
                        }
                    } catch (err) {
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

        // Chart auto-refresh is now handled in chart-renderer.js
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