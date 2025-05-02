/**
 * DriMon Translations
 * 
 * This file contains translations for the DriMon dashboard in multiple languages.
 * Currently supported: Norwegian (no), English (en), Spanish (es)
 */

// Translation keys and values for all supported languages
const translations = {
    // Norwegian (Bokmål) - Default language
    'no': {
        // General UI
        'loading': 'Laster...',
        'noData': 'Ingen data tilgjengelig',
        'today': 'i dag',
        'yesterday': 'i går',
        'week': 'uke',
        'lastWeek': 'uke-1',
        'start': 'start',
        'results': 'Resultater',
        'update': 'Oppdater',
        
        // Header data
        'temperature': 'Temperatur',
        'humidity': 'Luftfuktighet',
        'pressure': 'Lufttrykk',
        'battery': 'Batteri',
        'batteryVoltage': 'Batteri Spenning',
        'light': 'Lysnivå',
        'window': 'Vindusåpning',
        'time': 'Sist oppdatert',
        
        // Light levels
        'night': 'Natt',
        'dusk': 'Skumring',
        'cloudy': 'Skyet',
        'sunny': 'Sol',
        
        // Window state
        'closed': 'Lukket',
        'ajar': 'Glippe',
        'open': 'Åpent',
        
        // Sort options
        'sortBy': 'Sorter etter kategori',
        'default': 'Standard',
        'temperatureSort': 'Temperatur',
        'humiditySort': 'Fuktighet',
        'weatherSort': 'Vær',
        'systemSort': 'System',
        'soilSort': 'Jord',
        'lightSort': 'Lys',
        'structureSort': 'Struktur',
        
        // Chart titles
        'temperatureChart': 'Temperatur',
        'windowChart': 'Vindusåpning',
        'lightChart': 'Lys',
        'batteryPercentChart': 'Batteri (%)',
        'tempDiffChart': 'Temperatur Diff',
        'plantsTempsChart': 'Plante Temperaturer',
        'outTempChart': 'Utetemperatur',
        'sensorsTempsChart': 'Sensor Temperaturer',
        'humidityChart': 'Luftfuktighet',
        'pressureChart': 'Lufttrykk',
        'windChart': 'Vind',
        'rainChart': 'Nedbør',
        'soilMoistureChart': 'Jordfuktighet',
        'batteryVoltageChart': 'Batteri (spenning)',
        'wifiChart': 'WiFi',
        'timeUsedChart': 'Tid brukt',
        
        // Chart components
        'ceiling': 'Tak',
        'internal': 'Intern',
        'cucumber': 'Agurk',
        'cucumber1': 'Agurk 1',
        'cucumber2': 'Agurk 2',
        'padron': 'Padron',
        'floor': 'Gulv',
        'today': 'i dag',
        'twoDay': '2d',
        'threeDay': '3d',
        'sevenDay': '7d',
        'fourteenDay': '14d',
        
        // Statistics
        'low': 'Lav',
        'avg': 'Gj.snitt',
        'high': 'Høy',
        'now': 'Nå',
        
        // Tooltips
        'otherValues': 'Andre verdier',
        'temperatures': 'Temperaturer',
        'weather': 'Vær',
        'structure': 'Struktur',
        'light': 'Lys',
        'system': 'System',
        'soil': 'Jord',
        
        // Language selection
        'language': 'Språk',
        
        // Button tooltips
        'darkModeTooltip': 'Bytt mellom mørk og lys modus',
        'statsTooltip': 'Vis/skjul statistikker'
    },
    
    // English
    'en': {
        // General UI
        'loading': 'Loading...',
        'noData': 'No data available',
        'today': 'today',
        'yesterday': 'yesterday',
        'week': 'week',
        'lastWeek': 'week-1',
        'start': 'start',
        'results': 'Results',
        'update': 'Update',
        
        // Header data
        'temperature': 'Temperature',
        'humidity': 'Humidity',
        'pressure': 'Pressure',
        'battery': 'Battery',
        'batteryVoltage': 'Battery Voltage',
        'light': 'Light Level',
        'window': 'Window Opening',
        'time': 'Last updated',
        
        // Light levels
        'night': 'Night',
        'dusk': 'Dusk',
        'cloudy': 'Cloudy',
        'sunny': 'Sunny',
        
        // Window state
        'closed': 'Closed',
        'ajar': 'Ajar',
        'open': 'Open',
        
        // Sort options
        'sortBy': 'Sort by category',
        'default': 'Default',
        'temperatureSort': 'Temperature',
        'humiditySort': 'Humidity',
        'weatherSort': 'Weather',
        'systemSort': 'System',
        'soilSort': 'Soil',
        'lightSort': 'Light',
        'structureSort': 'Structure',
        
        // Chart titles
        'temperatureChart': 'Temperature',
        'windowChart': 'Window Opening',
        'lightChart': 'Light',
        'batteryPercentChart': 'Battery (%)',
        'tempDiffChart': 'Temperature Diff',
        'plantsTempsChart': 'Plant Temperatures',
        'outTempChart': 'Outdoor Temperature',
        'sensorsTempsChart': 'Sensor Temperatures',
        'humidityChart': 'Humidity',
        'pressureChart': 'Pressure',
        'windChart': 'Wind',
        'rainChart': 'Precipitation',
        'soilMoistureChart': 'Soil Moisture',
        'batteryVoltageChart': 'Battery (voltage)',
        'wifiChart': 'WiFi',
        'timeUsedChart': 'Time Used',
        
        // Chart components
        'ceiling': 'Ceiling',
        'internal': 'Internal',
        'cucumber': 'Cucumber',
        'cucumber1': 'Cucumber 1',
        'cucumber2': 'Cucumber 2',
        'padron': 'Padron',
        'floor': 'Floor',
        'today': 'today',
        'twoDay': '2d',
        'threeDay': '3d',
        'sevenDay': '7d',
        'fourteenDay': '14d',
        
        // Statistics
        'low': 'Low',
        'avg': 'Avg',
        'high': 'High',
        'now': 'Now',
        
        // Tooltips
        'otherValues': 'Other values',
        'temperatures': 'Temperatures',
        'weather': 'Weather',
        'structure': 'Structure',
        'light': 'Light',
        'system': 'System',
        'soil': 'Soil',
        
        // Language selection
        'language': 'Language',
        
        // Button tooltips
        'darkModeTooltip': 'Toggle between dark and light mode',
        'statsTooltip': 'Show/hide statistics'
    },
    
    // Spanish
    'es': {
        // General UI
        'loading': 'Cargando...',
        'noData': 'Datos no disponibles',
        'today': 'hoy',
        'yesterday': 'ayer',
        'week': 'semana',
        'lastWeek': 'semana-1',
        'start': 'inicio',
        'results': 'Resultados',
        'update': 'Actualizar',
        
        // Header data
        'temperature': 'Temperatura',
        'humidity': 'Humedad',
        'pressure': 'Presión',
        'battery': 'Batería',
        'batteryVoltage': 'Voltaje de Batería',
        'light': 'Nivel de Luz',
        'window': 'Apertura de Ventana',
        'time': 'Última actualización',
        
        // Light levels
        'night': 'Noche',
        'dusk': 'Crepúsculo',
        'cloudy': 'Nublado',
        'sunny': 'Soleado',
        
        // Window state
        'closed': 'Cerrada',
        'ajar': 'Entreabierta',
        'open': 'Abierta',
        
        // Sort options
        'sortBy': 'Ordenar por categoría',
        'default': 'Predeterminado',
        'temperatureSort': 'Temperatura',
        'humiditySort': 'Humedad',
        'weatherSort': 'Clima',
        'systemSort': 'Sistema',
        'soilSort': 'Suelo',
        'lightSort': 'Luz',
        'structureSort': 'Estructura',
        
        // Chart titles
        'temperatureChart': 'Temperatura',
        'windowChart': 'Apertura de Ventana',
        'lightChart': 'Luz',
        'batteryPercentChart': 'Batería (%)',
        'tempDiffChart': 'Diferencia de Temperatura',
        'plantsTempsChart': 'Temperaturas de Plantas',
        'outTempChart': 'Temperatura Exterior',
        'sensorsTempsChart': 'Temperaturas de Sensores',
        'humidityChart': 'Humedad',
        'pressureChart': 'Presión',
        'windChart': 'Viento',
        'rainChart': 'Precipitación',
        'soilMoistureChart': 'Humedad del Suelo',
        'batteryVoltageChart': 'Batería (voltaje)',
        'wifiChart': 'WiFi',
        'timeUsedChart': 'Tiempo Utilizado',
        
        // Chart components
        'ceiling': 'Techo',
        'internal': 'Interno',
        'cucumber': 'Pepino',
        'cucumber1': 'Pepino 1',
        'cucumber2': 'Pepino 2',
        'padron': 'Pimiento de Padrón',
        'floor': 'Suelo',
        'today': 'hoy',
        'twoDay': '2d',
        'threeDay': '3d',
        'sevenDay': '7d',
        'fourteenDay': '14d',
        
        // Statistics
        'low': 'Bajo',
        'avg': 'Prom',
        'high': 'Alto',
        'now': 'Ahora',
        
        // Tooltips
        'otherValues': 'Otros valores',
        'temperatures': 'Temperaturas',
        'weather': 'Clima',
        'structure': 'Estructura',
        'light': 'Luz',
        'system': 'Sistema',
        'soil': 'Suelo',
        
        // Language selection
        'language': 'Idioma',
        
        // Button tooltips
        'darkModeTooltip': 'Cambiar entre modo oscuro y claro',
        'statsTooltip': 'Mostrar/ocultar estadísticas'
    }
};

// Current language setting (defaults to Norwegian)
let currentLanguage = localStorage.getItem('language') || 'no';

// Create a central chart translation repository
window.chartTranslator = {
    // Maps for easy lookup
    seriesTitleMap: {
        'Tak': 'ceiling',
        'Intern': 'internal',
        'Agurk': 'cucumber',
        'Agurk 1': 'cucumber1',
        'Agurk 2': 'cucumber2',
        'Padron': 'padron',
        'Gulv': 'floor'
    },
    
    chartTitleMap: {
        'Temperatur': 'temperatureChart',
        'Vindusåpning': 'windowChart',
        'Lys': 'lightChart',
        'Batteri (%)': 'batteryPercentChart',
        'Temperatur Diff': 'tempDiffChart',
        'Plante Temperaturer': 'plantsTempsChart',
        'Utetemperatur': 'outTempChart',
        'Sensor Temperaturer': 'sensorsTempsChart',
        'Luftfuktighet': 'humidityChart',
        'Lufttrykk': 'pressureChart',
        'Vind': 'windChart',
        'Nedbør': 'rainChart',
        'Jordfuktighet': 'soilMoistureChart',
        'Batteri (spenning)': 'batteryVoltageChart',
        'WiFi': 'wifiChart',
        'Tid brukt': 'timeUsedChart'
    },
    
    // Translate chart titles 
    translateChartTitle: function(title) {
        const key = this.chartTitleMap[title];
        if (key && window.i18n && typeof window.i18n.__ === 'function') {
            return window.i18n.__(key);
        }
        return title;
    },
    
    // Translate series titles
    translateSeriesTitle: function(title) {
        const key = this.seriesTitleMap[title];
        if (key && window.i18n && typeof window.i18n.__ === 'function') {
            return window.i18n.__(key);
        }
        return title;
    }
};

/**
 * Get a translated string for the current language
 * @param {string} key - The translation key
 * @returns {string} - The translated string
 */
function __(key) {
    // Get the current language's dictionary
    const langDict = translations[currentLanguage] || translations['no'];
    
    // Return the translated string or the key itself if not found
    return langDict[key] || key;
}

/**
 * Change the current language
 * @param {string} lang - Language code ('no', 'en', 'es')
 */
function setLanguage(lang) {
    // Only change if it's a supported language
    if (translations[lang]) {
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // Update moment.js locale for proper date formatting
        if (window.moment) {
            // Map our language codes to moment locales
            const momentLocale = lang === 'no' ? 'nb' : lang; // Norwegian Bokmål uses 'nb' in moment
            window.moment.locale(momentLocale);
        }
        
        // Trigger page update for static elements
        updatePageLanguage();
        
        // Dispatch a custom event so other scripts can respond
        // All dynamic chart updates will happen in response to this event
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
        
        return true;
    }
    return false;
}

/**
 * Get the current language code
 * @returns {string} - Current language code
 */
function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Update all translatable elements on the page
 */
function updatePageLanguage() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            // Check if there's a data-i18n-attr attribute to specify which attribute to update
            const attr = el.getAttribute('data-i18n-attr');
            if (attr) {
                el.setAttribute(attr, __(key));
            } else {
                // Default: update the text content
                el.textContent = __(key);
            }
        }
    });
    
    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.setAttribute('placeholder', __(key));
        }
    });
    
    // Update title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            el.setAttribute('title', __(key));
        }
    });
}

// Initialize language from localStorage when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load language from localStorage or use default
    let savedLang = localStorage.getItem('language') || 'no';
    
    // Ensure it's a supported language
    if (!translations[savedLang]) savedLang = 'no';
    
    // Set moment.js locale immediately (also done in setLanguage, but needed for initial load)
    if (window.moment) {
        const momentLocale = savedLang === 'no' ? 'nb' : savedLang;
        window.moment.locale(momentLocale);
    }
    
    // Set the language (this will also update the page)
    setLanguage(savedLang);
});

// Expose the translation functions globally
window.i18n = {
    __,
    setLanguage,
    getCurrentLanguage,
    updatePageLanguage,
    supportedLanguages: Object.keys(translations)
};