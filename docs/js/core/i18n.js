/**
 * @file i18n.js
 * @description Internationalization system for the DriMon application
 * 
 * The i18n module provides a complete translation management system with:
 * - Direct key-based access to translations (no string comparisons or lookup maps)
 * - Validation to catch missing translations
 * - Support for multiple languages with automatic language detection
 * - DOM element translation utilities
 * - Language change event management
 * 
 * Usage:
 * - For direct translations: I18n.translate('key')
 * - To change language: I18n.setLanguage('en')
 * - To update all translatable elements: I18n.updatePageLanguage()
 */

/**
 * @class I18n
 * @description Core internationalization management system
 */
window.I18n = {
    /** 
     * Default language 
     * @private
     */
    _defaultLanguage: 'no',
    
    /**
     * Current language
     * @private
     */
    _currentLanguage: 'no',
    
    /**
     * Translation dictionaries
     * @private
     */
    _translations: {},
    
    /**
     * Set of all keys across all languages (for validation)
     * @private
     */
    _allKeys: new Set(),
    
    /**
     * Missing keys cache (to prevent duplicate warnings)
     * @private
     */
    _missingKeys: new Set(),
    
    /**
     * Translation validator options
     * @private
     */
    _validationOptions: {
        enabled: true,
        warnOnMissing: true,
        strictMode: false, // If true, throws error on missing key instead of returning the key
    },
    
    /**
     * Initialize the i18n system with translations
     * @param {Object} translations - Translation dictionaries for all supported languages
     * @param {Object} [options] - Configuration options
     * @param {string} [options.defaultLanguage='no'] - Default language
     * @param {boolean} [options.warnOnMissing=true] - Whether to warn on missing translations
     * @param {boolean} [options.strictMode=false] - Whether to throw on missing translations
     * @returns {boolean} Success flag
     */
    initialize: function(translations, options = {}) {
        if (!translations || typeof translations !== 'object') {
            console.error('Invalid translations object');
            return false;
        }
        
        this._translations = translations;
        this._defaultLanguage = options.defaultLanguage || 'no';
        
        // Set validation options
        if (options.hasOwnProperty('warnOnMissing')) {
            this._validationOptions.warnOnMissing = !!options.warnOnMissing;
        }
        
        if (options.hasOwnProperty('strictMode')) {
            this._validationOptions.strictMode = !!options.strictMode;
        }
        
        // Build the set of all keys for validation
        this._buildAllKeysSet();
        
        // Load saved language or use default
        const savedLanguage = localStorage.getItem('language') || this._defaultLanguage;
        this.setLanguage(savedLanguage);
        
        return true;
    },
    
    /**
     * Build set of all keys from all language dictionaries
     * @private
     */
    _buildAllKeysSet: function() {
        this._allKeys.clear();
        
        for (const langCode in this._translations) {
            const langDict = this._translations[langCode];
            Object.keys(langDict).forEach(key => this._allKeys.add(key));
        }
    },
    
    /**
     * Get all translation keys
     * @returns {string[]} Array of translation keys
     */
    getAllKeys: function() {
        return [...this._allKeys];
    },
    
    /**
     * Check if a key exists in any language
     * @param {string} key - Translation key
     * @returns {boolean} True if the key exists in any language
     */
    hasKey: function(key) {
        return this._allKeys.has(key);
    },
    
    /**
     * Check if a key exists in a specific language
     * @param {string} key - Translation key
     * @param {string} [language] - Language code (defaults to current language)
     * @returns {boolean} True if the key exists in the specified language
     */
    hasTranslation: function(key, language = null) {
        const lang = language || this._currentLanguage;
        return this._translations[lang] && this._translations[lang][key] !== undefined;
    },
    
    /**
     * Translate a key to the current language
     * @param {string} key - Translation key
     * @param {Object} [params] - Parameters for interpolation
     * @returns {string} Translated string or the key itself if not found
     */
    translate: function(key, params = null) {
        // Return the key if it's empty
        if (!key) return '';
        
        // Get the current language's dictionary
        const langDict = this._translations[this._currentLanguage] || 
                         this._translations[this._defaultLanguage];
        
        // Get the translation or return the key itself
        let translation = langDict && langDict[key];
        
        // If translation not found, handle it according to validation settings
        if (translation === undefined) {
            return this._handleMissingTranslation(key);
        }
        
        // Handle parameter interpolation if provided
        if (params && typeof params === 'object' && translation) {
            translation = this._interpolateParams(translation, params);
        }
        
        return translation;
    },
    
    /**
     * Interpolate parameters in a translation string
     * @private
     * @param {string} translation - Translation string with placeholders
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Interpolated string
     */
    _interpolateParams: function(translation, params) {
        // Replace {{param}} with the actual values
        return translation.replace(/{{(\w+)}}/g, (match, paramName) => {
            return params[paramName] !== undefined ? params[paramName] : match;
        });
    },
    
    /**
     * Handle missing translation based on validation settings
     * @private
     * @param {string} key - Missing translation key
     * @returns {string} The key itself or throws an error in strict mode
     */
    _handleMissingTranslation: function(key) {
        // In strict mode, throw an error
        if (this._validationOptions.strictMode) {
            throw new Error(`Missing translation for key: ${key}`);
        }
        
        // In warning mode, log once for each missing key
        if (this._validationOptions.warnOnMissing && !this._missingKeys.has(key)) {
            console.warn(`Missing translation for key: ${key} in language: ${this._currentLanguage}`);
            this._missingKeys.add(key);
        }
        
        // Return the key itself as a fallback
        return key;
    },
    
    /**
     * Alias for translate (shorter name)
     * @param {string} key - Translation key
     * @param {Object} [params] - Parameters for interpolation
     * @returns {string} Translated string
     */
    t: function(key, params = null) {
        return this.translate(key, params);
    },
    
    /**
     * Change the current language
     * @param {string} language - Language code ('no', 'en', 'es')
     * @returns {boolean} Success flag
     */
    setLanguage: function(language) {
        // Only change if it's a supported language
        if (this._translations[language]) {
            this._currentLanguage = language;
            localStorage.setItem('language', language);
            
            // Update moment.js locale for proper date formatting
            if (window.moment) {
                // Map our language codes to moment locales
                const momentLocale = language === 'no' ? 'nb' : language; // Norwegian Bokmål uses 'nb' in moment
                window.moment.locale(momentLocale);
            }
            
            // Trigger page update for static elements
            this.updatePageLanguage();
            
            // Dispatch a custom event so other scripts can respond
            document.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language: language } 
            }));
            
            return true;
        }
        return false;
    },
    
    /**
     * Get the current language code
     * @returns {string} Current language code
     */
    getCurrentLanguage: function() {
        return this._currentLanguage;
    },
    
    /**
     * Get list of supported languages
     * @returns {string[]} Array of supported language codes
     */
    getSupportedLanguages: function() {
        return Object.keys(this._translations);
    },
    
    /**
     * Update all translatable elements on the page
     */
    updatePageLanguage: function() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                // Check if there's a data-i18n-attr attribute to specify which attribute to update
                const attr = el.getAttribute('data-i18n-attr');
                if (attr) {
                    el.setAttribute(attr, this.translate(key));
                } else {
                    // Default: update the text content
                    el.textContent = this.translate(key);
                }
            }
        });
        
        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (key) {
                el.setAttribute('placeholder', this.translate(key));
            }
        });
        
        // Update title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (key) {
                el.setAttribute('title', this.translate(key));
            }
        });
    },
    
    /**
     * Validate translations for consistency and completeness
     * @returns {Object} Validation results with errors and warnings
     */
    validateTranslations: function() {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {}
        };
        
        const languages = Object.keys(this._translations);
        
        // Check that we have at least one language
        if (languages.length === 0) {
            results.isValid = false;
            results.errors.push('No translation dictionaries found');
            return results;
        }
        
        // Track key statistics
        const keyStats = {};
        languages.forEach(lang => {
            keyStats[lang] = {
                total: 0,
                unique: 0,
                missing: 0
            };
        });
        
        // Get all unique keys from all languages
        const allKeys = this.getAllKeys();
        
        // Check each language for missing keys
        languages.forEach(lang => {
            const langDict = this._translations[lang];
            const langKeys = new Set(Object.keys(langDict));
            
            keyStats[lang].total = langKeys.size;
            
            // Find unique keys (only in this language)
            let uniqueKeys = 0;
            langKeys.forEach(key => {
                let isUnique = true;
                languages.forEach(otherLang => {
                    if (otherLang !== lang && this._translations[otherLang][key] !== undefined) {
                        isUnique = false;
                    }
                });
                if (isUnique) {
                    uniqueKeys++;
                }
            });
            keyStats[lang].unique = uniqueKeys;
            
            // Find missing keys (in other languages but not this one)
            const missingKeys = [];
            allKeys.forEach(key => {
                if (!langKeys.has(key)) {
                    missingKeys.push(key);
                }
            });
            
            keyStats[lang].missing = missingKeys.length;
            
            if (missingKeys.length > 0) {
                results.warnings.push({
                    language: lang,
                    message: `Missing ${missingKeys.length} translations`,
                    missingKeys
                });
            }
        });
        
        results.stats = keyStats;
        results.isValid = results.errors.length === 0;
        
        return results;
    },
    
    /**
     * Create a translation helper for a specific component
     * @param {string} prefix - Key prefix for the component
     * @returns {Function} Translation function for the component
     */
    createComponentTranslator: function(prefix) {
        return (key, params = null) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            return this.translate(fullKey, params);
        };
    },
    
    /**
     * Translate a chart title using its titleKey from the chart configuration
     * @param {string} title - Chart title (used for debugging/warning only)
     * @param {string} [titleKey] - Translation key for the title
     * @returns {string} Translated title or original title if no key found
     */
    translateChartTitle: function(title, titleKey) {
        if (titleKey) {
            return this.translate(titleKey);
        } else {
            // If no key is provided, just return the title itself
            // In strict mode, we should warn about missing translation key
            console.warn(`No translation key provided for chart title: ${title}`);
            return title;
        }
    },
    
    /**
     * Translate a chart series title
     * @param {string} title - Series title
     * @param {string} [titleKey] - Translation key for the series title
     * @returns {string} Translated series title or original title if no key found
     */
    translateSeriesTitle: function(title, titleKey) {
        if (titleKey) {
            return this.translate(titleKey);
        } else {
            // If no key is provided, just return the title itself
            // In strict mode, we should warn about missing translation key
            console.warn(`No translation key provided for series title: ${title}`);
            return title;
        }
    }
};