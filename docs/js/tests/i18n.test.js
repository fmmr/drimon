/**
 * @file i18n.test.js
 * @description Tests for the I18n module
 */

// Create test runner
class TestRunner {
    constructor(moduleName) {
        this.moduleName = moduleName;
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async runTests() {
        console.group(`Running tests for ${this.moduleName}`);
        console.log(`Starting ${this.tests.length} tests...`);
        
        const startTime = performance.now();
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ PASS: ${test.name}`);
                this.results.passed++;
            } catch (error) {
                console.error(`❌ FAIL: ${test.name}`);
                console.error(`   Error: ${error.message}`);
                this.results.failed++;
            }
            this.results.total++;
        }
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`Tests completed in ${duration}s`);
        console.log(`Results: ${this.results.passed} passed, ${this.results.failed} failed, ${this.results.total} total`);
        console.groupEnd();
        
        return this.results;
    }
}

// Helper assertion functions
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected "${expected}", got "${actual}"`);
    }
}

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message || 'Expected value to not be null or undefined');
    }
}

function assertType(value, type, message) {
    if (typeof value !== type) {
        throw new Error(`${message || 'Type assertion failed'}: expected type "${type}", got "${typeof value}"`);
    }
}

function assertTrue(value, message) {
    if (value !== true) {
        throw new Error(message || `Expected true, got ${value}`);
    }
}

function assertFalse(value, message) {
    if (value !== false) {
        throw new Error(message || `Expected false, got ${value}`);
    }
}

function assertDeepEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    
    if (actualStr !== expectedStr) {
        throw new Error(`${message || 'Deep equality assertion failed'}: expected ${expectedStr}, got ${actualStr}`);
    }
}

// Import I18n module
// IMPORTANT: In the next phase of refactoring, we'll switch to proper ES module imports:
// import I18n from '../core/i18n.js';
// 
// We should always import the actual production code rather than copying it.
// This ensures tests validate the real implementation.
// For now, we're temporarily assuming the I18n object is attached to window

// Sample translations for testing
const testTranslations = {
    'en': {
        'greeting': 'Hello',
        'farewell': 'Goodbye',
        'error': 'Error',
        'param_test': 'Hello, {{name}}!',
        'multi_param': 'Hello, {{name}}! You have {{count}} messages.',
        'english_only': 'English only string'
    },
    'no': {
        'greeting': 'Hei',
        'farewell': 'Farvel',
        'error': 'Feil',
        'param_test': 'Hei, {{name}}!',
        'multi_param': 'Hei, {{name}}! Du har {{count}} meldinger.'
    },
    'es': {
        'greeting': 'Hola',
        'farewell': 'Adiós',
        'error': 'Error',
        'param_test': '¡Hola, {{name}}!',
        'multi_param': '¡Hola, {{name}}! Tienes {{count}} mensajes.',
        'spanish_only': 'Cadena solo en español'
    }
};

// Define tests for I18n module
const i18nTests = {
    testInitialize: async () => {
        // Test with valid translations
        const result = I18n.initialize(testTranslations);
        assertTrue(result, 'Initialize should return true for valid translations');
        
        // Test with invalid translations
        const invalidResult1 = I18n.initialize(null);
        assertFalse(invalidResult1, 'Initialize should return false for null translations');
        
        const invalidResult2 = I18n.initialize('not an object');
        assertFalse(invalidResult2, 'Initialize should return false for non-object translations');
        
        // Reset with valid translations for subsequent tests
        I18n.initialize(testTranslations);
    },
    
    testTranslation: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        
        // Test basic translation
        I18n.setLanguage('en');
        assertEqual(I18n.translate('greeting'), 'Hello', 'Should translate to English');
        
        I18n.setLanguage('no');
        assertEqual(I18n.translate('greeting'), 'Hei', 'Should translate to Norwegian');
        
        I18n.setLanguage('es');
        assertEqual(I18n.translate('greeting'), 'Hola', 'Should translate to Spanish');
        
        // Test shorthand method
        assertEqual(I18n.t('greeting'), 'Hola', 'Shorthand t() method should work');
        
        // Test with missing key
        assertEqual(I18n.translate('nonexistent_key'), 'nonexistent_key', 'Should return key for missing translation');
        
        // Test with empty key
        assertEqual(I18n.translate(''), '', 'Should return empty string for empty key');
        
        // Test with null key
        assertEqual(I18n.translate(null), '', 'Should return empty string for null key');
    },
    
    testParameterInterpolation: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        I18n.setLanguage('en');
        
        // Test with single parameter
        assertEqual(
            I18n.translate('param_test', { name: 'John' }),
            'Hello, John!',
            'Should interpolate name parameter'
        );
        
        // Test with multiple parameters
        assertEqual(
            I18n.translate('multi_param', { name: 'John', count: 5 }),
            'Hello, John! You have 5 messages.',
            'Should interpolate multiple parameters'
        );
        
        // Test with missing parameter
        assertEqual(
            I18n.translate('param_test', {}),
            'Hello, {{name}}!',
            'Should leave placeholder for missing parameter'
        );
        
        // Test with extra parameters
        assertEqual(
            I18n.translate('param_test', { name: 'John', extra: 'ignored' }),
            'Hello, John!',
            'Should ignore extra parameters'
        );
        
        // Test parameter interpolation in different languages
        I18n.setLanguage('no');
        assertEqual(
            I18n.translate('param_test', { name: 'John' }),
            'Hei, John!',
            'Should interpolate parameters in Norwegian'
        );
        
        I18n.setLanguage('es');
        assertEqual(
            I18n.translate('param_test', { name: 'John' }),
            '¡Hola, John!',
            'Should interpolate parameters in Spanish'
        );
    },
    
    testLanguageManagement: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        
        // Test setting valid language
        const result = I18n.setLanguage('en');
        assertTrue(result, 'Setting valid language should return true');
        assertEqual(I18n.getCurrentLanguage(), 'en', 'Current language should be set correctly');
        
        // Test setting invalid language
        const invalidResult = I18n.setLanguage('fr');
        assertFalse(invalidResult, 'Setting invalid language should return false');
        assertEqual(I18n.getCurrentLanguage(), 'en', 'Current language should remain unchanged');
        
        // Test getting supported languages
        const supportedLanguages = I18n.getSupportedLanguages();
        assertTrue(
            supportedLanguages.includes('en') && 
            supportedLanguages.includes('no') && 
            supportedLanguages.includes('es'),
            'Should return all supported languages'
        );
        assertEqual(supportedLanguages.length, 3, 'Should have exactly 3 supported languages');
    },
    
    testKeyManagement: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        
        // Test getting all keys
        const allKeys = I18n.getAllKeys();
        assertTrue(allKeys.includes('greeting'), 'All keys should include greeting');
        assertTrue(allKeys.includes('english_only'), 'All keys should include english_only');
        assertTrue(allKeys.includes('spanish_only'), 'All keys should include spanish_only');
        
        // Test checking if key exists
        assertTrue(I18n.hasKey('greeting'), 'Common key should exist');
        assertTrue(I18n.hasKey('english_only'), 'Language-specific key should exist');
        assertFalse(I18n.hasKey('nonexistent_key'), 'Nonexistent key should return false');
        
        // Test checking if key has translation in specific language
        assertTrue(I18n.hasTranslation('greeting', 'en'), 'Common key should have translation in English');
        assertTrue(I18n.hasTranslation('english_only', 'en'), 'English-only key should have translation in English');
        assertFalse(I18n.hasTranslation('english_only', 'no'), 'English-only key should not have translation in Norwegian');
        
        // Test with current language
        I18n.setLanguage('es');
        assertTrue(I18n.hasTranslation('spanish_only'), 'Spanish-only key should have translation in current language (Spanish)');
        assertFalse(I18n.hasTranslation('english_only'), 'English-only key should not have translation in current language (Spanish)');
    },
    
    testTranslationValidation: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        
        // Test validation
        const validation = I18n.validateTranslations();
        assertTrue(validation.isValid, 'Validation should pass for test translations');
        
        // There should be warnings for missing keys in each language
        assertTrue(validation.warnings.length > 0, 'Should have warnings for missing keys');
        
        // Check that English is missing spanish_only
        const englishWarning = validation.warnings.find(w => w.language === 'en');
        assertTrue(
            englishWarning && englishWarning.missingKeys.includes('spanish_only'),
            'English should be missing spanish_only key'
        );
        
        // Check that Norwegian is missing both english_only and spanish_only
        const norwegianWarning = validation.warnings.find(w => w.language === 'no');
        assertTrue(
            norwegianWarning && 
            norwegianWarning.missingKeys.includes('english_only') &&
            norwegianWarning.missingKeys.includes('spanish_only'),
            'Norwegian should be missing english_only and spanish_only keys'
        );
        
        // Check that Spanish is missing english_only
        const spanishWarning = validation.warnings.find(w => w.language === 'es');
        assertTrue(
            spanishWarning && spanishWarning.missingKeys.includes('english_only'),
            'Spanish should be missing english_only key'
        );
    },
    
    testComponentTranslator: async () => {
        // Create test translations with prefixes
        const componentTranslations = {
            'en': {
                'header.title': 'Dashboard',
                'header.subtitle': 'Statistics',
                'chart.title': 'Temperature',
                'chart.yaxis': 'Value'
            },
            'no': {
                'header.title': 'Dashbord',
                'header.subtitle': 'Statistikk',
                'chart.title': 'Temperatur',
                'chart.yaxis': 'Verdi'
            }
        };
        
        // Initialize with component translations
        I18n.initialize(componentTranslations);
        I18n.setLanguage('en');
        
        // Create component translators
        const headerTranslator = I18n.createComponentTranslator('header');
        const chartTranslator = I18n.createComponentTranslator('chart');
        
        // Test component translation
        assertEqual(
            headerTranslator('title'),
            'Dashboard',
            'Component translator should resolve prefixed keys'
        );
        
        assertEqual(
            chartTranslator('title'),
            'Temperature',
            'Chart translator should resolve chart prefixed keys'
        );
        
        // Test language switching with component translator
        I18n.setLanguage('no');
        assertEqual(
            headerTranslator('title'),
            'Dashbord',
            'Component translator should work after language change'
        );
        
        assertEqual(
            chartTranslator('title'),
            'Temperatur',
            'Chart translator should work after language change'
        );
        
        // Test with missing key
        assertEqual(
            headerTranslator('nonexistent'),
            'header.nonexistent',
            'Component translator should handle missing keys correctly'
        );
    },
    
    testBackwardCompatibility: async () => {
        // Initialize for this test
        I18n.initialize(testTranslations);
        I18n.setLanguage('en');
        
        // Test if global __ function works
        assertEqual(
            window.__(key = 'greeting'),
            'Hello',
            'Global __ function should work'
        );
        
        // Test if window.i18n is properly set up
        assertTrue(
            typeof window.i18n === 'object' && typeof window.i18n.__ === 'function',
            'window.i18n object should be set up'
        );
        
        // Test if window.i18n.__ function works
        assertEqual(
            window.i18n.__('greeting'),
            'Hello',
            'window.i18n.__ function should work'
        );
        
        // Test language management through window.i18n
        window.i18n.setLanguage('es');
        assertEqual(
            window.i18n.__('greeting'),
            'Hola',
            'window.i18n.setLanguage should work'
        );
        
        assertEqual(
            window.i18n.getCurrentLanguage(),
            'es',
            'window.i18n.getCurrentLanguage should work'
        );
    }
};

// Run tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const runner = new TestRunner('I18n');
    
    // Add all I18n tests
    runner.addTest('initialize', i18nTests.testInitialize);
    runner.addTest('translation', i18nTests.testTranslation);
    runner.addTest('parameterInterpolation', i18nTests.testParameterInterpolation);
    runner.addTest('languageManagement', i18nTests.testLanguageManagement);
    runner.addTest('keyManagement', i18nTests.testKeyManagement);
    runner.addTest('translationValidation', i18nTests.testTranslationValidation);
    runner.addTest('componentTranslator', i18nTests.testComponentTranslator);
    runner.addTest('backwardCompatibility', i18nTests.testBackwardCompatibility);
    
    // Run the tests
    runner.runTests().then(results => {
        // Display results on page if in test mode
        const testResultsContainer = document.getElementById('test-results');
        if (testResultsContainer) {
            testResultsContainer.innerHTML += `
                <div class="test-summary ${results.failed > 0 ? 'test-failed' : 'test-passed'}">
                    <h3>I18n Module Test Results</h3>
                    <p>Total: ${results.total}</p>
                    <p>Passed: ${results.passed}</p>
                    <p>Failed: ${results.failed}</p>
                </div>
            `;
        }
    });
});