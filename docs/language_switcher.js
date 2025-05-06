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
                
                // Apply the temperature chart stats fix
                if (typeof fixTemperatureChartStats === 'function') {
                    // Give time for chart translations to complete first
                    setTimeout(fixTemperatureChartStats, 200);
                }
                
                // Use the direct DOM manipulation utility after a delay
                setTimeout(() => {
                    // If we have the utility function, use it
                    if (window.updateChartLegendDOM) {
                        window.updateChartLegendDOM();
                    }
                    
                    // Force chart update to ensure proper rendering (but NOT duplicate translations)
                    // The translations are already handled by the languageChanged event listener
                    if (window.chartInstances) {
                        Object.values(window.chartInstances).forEach(chart => {
                            if (chart) {
                                // Just update the chart - don't call translateChartLabels again
                                // as it's already been called by the languageChanged event
                                try {
                                    chart.update('none');
                                } catch (e) {
                                    console.error("Error updating chart:", e);
                                }
                            }
                        });
                    }
                }, 300);
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

// Add the language switcher when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short time to ensure header is loaded (if it's being dynamically created)
    setTimeout(() => {
        addLanguageSwitcherToHeader();
    }, 100);
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