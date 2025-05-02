/**
 * Language Switcher Component for DriMon
 * 
 * This file contains the language switcher component with small flags
 * to switch between Norwegian, English, and Spanish.
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
    
    // Get current language
    const currentLang = window.i18n ? window.i18n.getCurrentLanguage() : 'no';
    
    // Create flag buttons for each language
    languages.forEach(lang => {
        const button = document.createElement('button');
        button.className = `lang-flag ${lang.code === currentLang ? 'active' : ''}`;
        button.setAttribute('data-lang', lang.code);
        button.setAttribute('title', lang.name);
        button.setAttribute('aria-label', `Switch to ${lang.name}`);
        
        // Use emoji flag
        button.textContent = lang.emoji;
        
        // Add click event
        button.addEventListener('click', () => {
            // Only proceed if i18n is available
            if (window.i18n && typeof window.i18n.setLanguage === 'function') {
                // Set the language
                window.i18n.setLanguage(lang.code);
                
                // Update active state on buttons
                document.querySelectorAll('.lang-flag').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang.code);
                });
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

// Export the component
if (typeof window !== 'undefined') {
    window.LanguageSwitcher = {
        createLanguageSwitcher,
        addLanguageSwitcherToHeader
    };
}