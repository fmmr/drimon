const timezone = "Europe/Oslo";

document.addEventListener('DOMContentLoaded', () => {
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    const isDashboardMode = window.Utils.isDashboardMode();
    
    const savedScrollPosition = localStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition));
        localStorage.removeItem('scrollPosition');
    }
    
    if (isDashboardMode && window.i18n && typeof window.i18n.setLanguage === 'function') {
        window.i18n.setLanguage('no');
    }
    
    if (window.moment && window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        const lang = window.i18n.getCurrentLanguage() || 'no';
        const momentLocale = lang === 'no' ? 'nb' : lang;
        window.moment.locale(momentLocale);
    }
    
    if (typeof window.LayoutController !== 'undefined') {
        window.LayoutController.setupMobileLayout();
    }
    
    if (typeof window.ThemeController !== 'undefined') {
        window.ThemeController.initialize();
    }
    
    if (typeof window.StatsController !== 'undefined') {
        window.StatsController.initialize();
    }
    
    if (typeof window.DateController !== 'undefined') {
        window.DateController.initialize();
    }
    
    const range = getURLParameter('range') || 'default';
    const results = parseInt(getURLParameter('results')) || 8000;
    
    setTimeout(() => {
        const allDateChips = document.querySelectorAll('.date-chip');
        
        allDateChips.forEach(chip => {
            chip.classList.remove('active');
        });
        
        const activeChip = document.querySelector(`.date-chip[data-range="${range}"]`);
        if (activeChip) {
            activeChip.classList.add('active');
        }
    }, 100);
    
    setTimeout(() => {
        loadAllCharts(range, results, isDashboardMode).then(() => {
            window.startChartAutoRefresh(90);
        });
    }, 100);
    
    setInterval(() => {
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer && chartContainer.children.length === 0) {
            
            if (!window.Utils) {
                console.error('Utils is not defined in failsafe interval. Critical dependency missing.');
                return;
            }
            
            const currentRange = window.Utils.getURLParameter('range') || '1';
            const currentResults = parseInt(window.Utils.getURLParameter('results')) || 8000;
            
            loadAllCharts(currentRange, currentResults);
        }
    }, 60000);
    
    window.initializeSorting = function() {
        const sortSelect = document.getElementById('mobileSortSelect');
        
        if (!sortSelect) {
            setTimeout(window.initializeSorting, 500);
            return;
        }
        
        const lastSort = localStorage.getItem('chartSortPreference');
        
        if (lastSort) {
            sortSelect.value = lastSort;
        }
        
        const handleSortChange = (category) => {
            localStorage.setItem('chartSortPreference', category);
            window.sortChartsByCategory(category);
        };
        
        sortSelect.addEventListener('change', (event) => {
            handleSortChange(event.target.value);
        });
        
        if (lastSort) {
            setTimeout(() => window.sortChartsByCategory(lastSort), 500);
        }
    };
    
    function setupSortingInitialization() {
        window.initializeSorting();
        
        const bodyObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    if (document.getElementById('mobileSortSelect')) {
                        window.initializeSorting();
                        bodyObserver.disconnect();
                        break;
                    }
                }
            }
        });
        
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        
        setTimeout(() => bodyObserver.disconnect(), 10000);
    }
    
    setupSortingInitialization();
    
    const logo = document.getElementById('main-title');
    if (logo) {
        logo.parentElement.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://github.com/fmmr/drimon', '_blank');
        });
    }
    
    if (typeof fetchData === 'function') {
        fetchData();
    }
    
    
    let lastFullRefreshTime = Date.now();
    let lastUserActivity = Date.now();
    const FULL_REFRESH_INTERVAL = 20 * 60 * 1000;

    const resetActivityTimer = () => {
        lastUserActivity = Date.now();
        lastFullRefreshTime = Date.now();
    };

    ['click', 'touchstart', 'mousemove', 'keypress', 'scroll', 'wheel'].forEach(eventType => {
        window.addEventListener(eventType, resetActivityTimer, { passive: true });
    });

    setInterval(() => {
        const isLocalFile = window.location.protocol === 'file:';

        if (!isLocalFile) {
            fetch('./site.webmanifest?heartbeat=' + Date.now(), {
                method: 'HEAD',
                cache: 'no-store'
            }).catch(() => {});
        } else {
            console.debug('Local heartbeat ping at ' + new Date().toISOString());
        }
    }, 5 * 60 * 1000);

    setInterval(() => {
        if (typeof fetchData === 'function') {
            fetchData();
        }

        const now = Date.now();
        const timeSinceLastRefresh = now - lastFullRefreshTime;
        const timeSinceLastActivity = now - lastUserActivity;

        if (timeSinceLastRefresh > FULL_REFRESH_INTERVAL &&
            (timeSinceLastActivity > 2 * 60 * 1000 || timeSinceLastRefresh > 45 * 60 * 1000)) {


            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            localStorage.setItem('scrollPosition', scrollPosition.toString());

            window.location.reload(true);
            return;
        }

        const getParam = (name) => {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(name) || '';
        };

        const checkForDetachedCharts = () => {
            if (window.chartInstances) {
                for (const chartId in window.chartInstances) {
                    try {
                        const instance = window.chartInstances[chartId];
                        const element = document.getElementById(chartId);

                        if (!element || !element.parentElement ||
                            !instance.canvas || !instance.canvas.parentElement) {
                            return true;
                        }
                    } catch (err) {
                        return true;
                    }
                }
            }
            return false;
        };

        if (checkForDetachedCharts()) {
            lastFullRefreshTime = 0;
        }

    }, 60000);
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (typeof window.resizeAllCharts === 'function') {
                window.resizeAllCharts();
            }
            
            if (window.DateController && typeof window.DateController.reattachDateDropdownHandlers === 'function') {
                window.DateController.reattachDateDropdownHandlers();
            }
        }, 250);
    });
});

