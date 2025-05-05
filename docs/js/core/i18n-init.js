/**
 * @file i18n-init.js
 * @description Initializer for the i18n system that loads translations and sets up the environment
 * @module core/i18n-init
 */

import I18n from './i18n.js';

/**
 * Initialize the i18n system with translations
 * @param {Object} [options] - Configuration options
 * @returns {Promise<boolean>} Success flag
 */
export async function initializeI18n(options = {}) {
    try {
        // Use the translations preloaded from translations-loader.js
        if (!window.DriMonTranslations) {
            console.error('No translations found. Make sure translations-loader.js is loaded before this script.');
            return false;
        }
        
        // Initialize I18n with the preloaded translations
        const success = I18n.initialize(window.DriMonTranslations, options);
        
        if (success) {
            // Set up event listeners for DOM updates
            document.addEventListener('DOMContentLoaded', () => {
                // Update all translatable elements on page
                I18n.updatePageLanguage();
                
                // Set up language switcher buttons
                document.querySelectorAll('[data-language-switch]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const lang = btn.getAttribute('data-language-switch');
                        if (lang) {
                            I18n.setLanguage(lang);
                        }
                    });
                });
            });
            
            // Log a success message with stats
            const stats = {};
            I18n.getSupportedLanguages().forEach(lang => {
                stats[lang] = Object.keys(window.DriMonTranslations[lang]).length;
            });
            
            console.info('I18n system initialized successfully', {
                languages: I18n.getSupportedLanguages(),
                current: I18n.getCurrentLanguage(),
                translationCounts: stats
            });
        }
        
        return success;
    } catch (error) {
        console.error('Error initializing i18n system:', error);
        return false;
    }
}

// Auto-initialize if this script is loaded directly
if (typeof window !== 'undefined') {
    initializeI18n().catch(error => {
        console.error('Failed to auto-initialize i18n system:', error);
    });
}

export default { 
    initializeI18n, 
    I18n 
};