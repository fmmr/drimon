/**
 * Language Switcher Component for DriMon
 * 
 * This file contains the language switcher component with small flags
 * to switch between Norwegian, English, and Spanish.
 * 
 * @version 2.0
 * @updated Updated to use the new I18n system
 */

/**
 * Creates a language switcher component with flags
 * @returns {HTMLElement} - The language switcher component
 */
function createLanguageSwitcher() {
    // Create container
    const container = document.createElement('div');
    container.className = 'language-switcher';
    
    // Flag data for supported languages
    const languages = [
        { code: 'no', name: 'Norsk', emoji: '🇳🇴' },
        { code: 'en', name: 'English', emoji: '🇬🇧' },
        { code: 'es', name: 'Español', emoji: '🇪🇸' }
    ];
    
    const currentLang = window.I18n.getCurrentLanguage();
    
    // Create flag buttons for each language
    languages.forEach(lang => {
        const button = document.createElement('button');
        button.className = `lang-flag ${lang.code === currentLang ? 'active' : ''}`;
        button.setAttribute('data-lang', lang.code);
        button.setAttribute('data-language-switch', lang.code); // New attribute for the new I18n system
        button.setAttribute('title', lang.name);
        button.setAttribute('aria-label', `Switch to ${lang.name}`);
        
        // Use emoji flag
        button.textContent = lang.emoji;
        
        // Add click event
        button.addEventListener('click', () => {
            let langChanged = false;
            
            if (window.I18n && typeof window.I18n.setLanguage === 'function') {
                langChanged = window.I18n.setLanguage(lang.code);
            }
            
            // If language was changed successfully, update the UI
            if (langChanged) {
                // Update active state on buttons
                document.querySelectorAll('.lang-flag').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang.code);
                });
                
                // Update all chart stats with proper translations
                // Give time for chart translations to complete first
                setTimeout(() => {
                    window.ChartStats.updateAllChartStats();
                }, 200);
                
                // Use the direct DOM manipulation utility after a delay
                // But avoid unnecessary chart updates that can cause flickering
                setTimeout(() => {
                    // If we have the utility function, use it
                    if (window.updateChartLegendDOM) {
                        window.updateChartLegendDOM();
                    }
                    
                    // Apply animation disabling to prevent flickering on language change
                    if (window.chartInstances) {
                        // First disable animation globally for all charts
                        const instances = Object.values(window.chartInstances).filter(chart => chart);
                        
                        // Store original animation settings
                        const originalAnimations = instances.map(chart => chart.options.animation);
                        
                        // Disable animations
                        instances.forEach(chart => {
                            if (chart && chart.options) {
                                chart.options.animation = { duration: 0 };
                            }
                        });
                        
                        // Update all charts silently with no animation
                        instances.forEach(chart => {
                            try {
                                // Update without animation to avoid flickering
                                chart.update();
                            } catch (e) {
                                // Silently ignore errors
                            }
                        });
                        
                        // Restore original animation settings
                        instances.forEach((chart, index) => {
                            if (chart && chart.options) {
                                chart.options.animation = originalAnimations[index];
                            }
                        });
                    }
                }, 100);
            }
        });
        
        container.appendChild(button);
    });
    
    return container;
}

/**
 * Add language switcher to the page header
 */
function addLanguageSwitcherToHeader() {
    // Look for the search container in the header as an insertion point
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer) {
        // Create a wrapper for the language switcher
        const langWrapper = document.createElement('div');
        langWrapper.className = 'language-wrapper';
        
        // Create the language switcher
        const switcher = createLanguageSwitcher();
        
        // Add to the wrapper
        langWrapper.appendChild(switcher);
        
        // Add the wrapper to the search container
        searchContainer.appendChild(langWrapper);
    }
}

// Add the language switcher when the DOM is loaded (unless in dashboard mode)
document.addEventListener('DOMContentLoaded', () => {
    // Check for dashboard mode
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name) || '';
    }
    
    const urlDashboardMode = getURLParameter('dashboard') === 'true';
    const isPi = (window.screen.width === 800 && window.screen.height === 480) || 
                 (/CrOS.*x86_64/.test(navigator.userAgent) && window.screen.width <= 800);
    const isDashboardMode = urlDashboardMode || isPi;
    
    // Only add language switcher if not in dashboard mode
    if (!isDashboardMode) {
        // Wait a short time to ensure header is loaded (if it's being dynamically created)
        setTimeout(() => {
            addLanguageSwitcherToHeader();
        }, 100);
    }
});

// Listen for the new i18n system to be ready
document.addEventListener('i18nReady', () => {
    // Re-create the language switcher if it exists
    const existingSwitcher = document.querySelector('.language-switcher');
    if (existingSwitcher) {
        const parent = existingSwitcher.parentElement;
        parent.innerHTML = '';
        parent.appendChild(createLanguageSwitcher());
    }
});

// Export the component
if (typeof window !== 'undefined') {
    window.LanguageSwitcher = {
        createLanguageSwitcher,
        addLanguageSwitcherToHeader
    };
}