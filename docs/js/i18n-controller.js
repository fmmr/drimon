/**
 * i18n Controller
 * 
 * Handles initialization of the internationalization system
 */

const I18nController = {
    /**
     * Initialize the i18n system
     */
    initialize: function() {
        // Initialize I18n with the translations from translations-loader.js
        if (window.I18n && typeof window.I18n.initialize === 'function' && window.DriMonTranslations) {
            const success = window.I18n.initialize(window.DriMonTranslations, {
                defaultLanguage: 'no',
                warnOnMissing: true
            });
            
            if (success && window.ChartI18n) {
                // Initialize chart translator
                window.ChartI18n.initialize();
                
                // Signal that the new i18n system is ready
                document.dispatchEvent(new CustomEvent('i18nReady'));
            }
        } else {
            console.error('Failed to initialize i18n system - required components not available');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    I18nController.initialize();
});

// Export the controller
window.I18nController = I18nController;