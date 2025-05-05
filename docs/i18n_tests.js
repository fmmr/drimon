/**
 * Automated tests for internationalization (i18n) in DriMon
 * 
 * This file contains automated tests to verify that all UI elements
 * are correctly translated when the page loads and when languages are switched.
 * 
 * Run these tests by adding ?test_i18n=true to the URL.
 */

// Test configuration
const languagesToTest = ['no', 'en', 'es'];
const defaultLanguage = 'no';
let currentLanguageIndex = 0;
let testResults = {};
let testsCompleted = 0;
let testsTotal = 0;

// Test categories and elements to check
const testDefinitions = {
    'Chart Titles': {
        selector: '.chart-title',
        sampleKeys: ['temperatureChart', 'windowChart', 'lightChart', 'humidityChart', 'soilMoistureChart'],
        verify: (elements, lang) => {
            // Verify a sample of chart titles have correct translations
            let success = true;
            let count = 0;
            
            const titles = Array.from(elements).map(el => el.textContent);
            
            // Create expected values for sample keys in current language
            const expected = sampleKeys.map(key => window.I18n.translate(key));
            
            // Check if expected values exist in the elements
            expected.forEach(exp => {
                if (!titles.find(title => title === exp)) {
                    success = false;
                    console.error(`Failed to find expected title "${exp}" in language ${lang}`);
                } else {
                    count++;
                }
            });
            
            return { success, count, total: expected.length };
        }
    },
    'Series Labels': {
        selector: 'canvas',
        // Test specific series titles in multi-series charts
        verify: (elements, lang) => {
            // Get all chart instances and check their dataset labels
            let success = true;
            let count = 0;
            let total = 0;
            
            if (!window.chartInstances) return { success: false, count: 0, total: 0 };
            
            // Keys to verify in dataset labels
            const keysToCheck = ['ceiling', 'internal', 'cucumber1', 'cucumber2', 'padron', 'floor'];
            const chartIds = ['chart-soil-moisture', 'chart-light', 'chart-plants-temp', 'chart-sensors-temp'];
            
            // Expected translations for each key
            const expected = keysToCheck.map(key => window.I18n.translate(key));
            
            // Check translations in chart datasets
            Object.entries(window.chartInstances).forEach(([chartId, chart]) => {
                if (chartIds.includes(chartId) && chart && chart.data && chart.data.datasets) {
                    total += chart.data.datasets.length;
                    
                    chart.data.datasets.forEach(dataset => {
                        if (!dataset.label) return;
                        
                        // For each dataset, check if any expected translation is present
                        const labelBase = dataset.label.split(':')[0].trim();
                        expected.forEach(exp => {
                            if (labelBase === exp) {
                                count++;
                            }
                        });
                    });
                }
            });
            
            success = count > 0;
            return { success, count, total };
        }
    },
    'Statistics Labels': {
        selector: '.chart-stat-label-short',
        verify: (elements, lang) => {
            // Verify stat labels (L, A, H, N) are translated
            const expectedLabels = {
                'no': ['L', 'A', 'H', 'N'],
                'en': ['L', 'A', 'H', 'N'],
                'es': ['B', 'P', 'A', 'A'] // Spanish: Bajo, Promedio, Alto, Ahora
            };
            
            const expected = expectedLabels[lang] || expectedLabels['en'];
            let count = 0;
            let total = elements.length;
            
            // Each label should end with a colon
            Array.from(elements).forEach(el => {
                const label = el.textContent.replace(':', '');
                if (expected.includes(label)) {
                    count++;
                }
            });
            
            return { success: count > 0, count, total };
        }
    },
    'Header Time': {
        selector: '#time-since',
        verify: (elements, lang) => {
            // Just verify the element exists and has content
            return { 
                success: elements.length > 0 && elements[0].textContent.trim() !== '', 
                count: elements.length, 
                total: 1 
            };
        }
    },
    'Data Chips': {
        selector: '.data-chip-text',
        verify: (elements, lang) => {
            // Just verify all data chips have content
            let count = 0;
            const total = elements.length;
            
            Array.from(elements).forEach(el => {
                if (el.textContent.trim() !== '') {
                    count++;
                }
            });
            
            return { success: count === total, count, total };
        }
    },
    'Date Selectors': {
        selector: '.date-chip',
        verify: (elements, lang) => {
            // Check for translations of date ranges
            const expected = window.I18n.translate('today');
            let found = false;
            
            Array.from(elements).forEach(el => {
                if (el.textContent.includes(expected)) {
                    found = true;
                }
            });
            
            return { success: found, count: found ? 1 : 0, total: 1 };
        }
    },
    'Button Tooltips': {
        selector: '#darkModeToggle, #statsToggle',
        verify: (elements, lang) => {
            // Check tooltips for buttons
            const darkModeTooltip = window.I18n.translate('darkModeTooltip');
            const statsTooltip = window.I18n.translate('statsTooltip');
            let count = 0;
            
            Array.from(elements).forEach(el => {
                const title = el.getAttribute('title');
                if (title === darkModeTooltip || title === statsTooltip) {
                    count++;
                }
            });
            
            return { success: count > 0, count, total: elements.length };
        }
    }
};

/**
 * Start the test suite
 */
function startI18nTests() {
    // Initialize test results
    languagesToTest.forEach(lang => {
        testResults[lang] = {};
        Object.keys(testDefinitions).forEach(testName => {
            testResults[lang][testName] = { success: false, count: 0, total: 0 };
        });
    });
    
    // Calculate total tests
    testsTotal = Object.keys(testDefinitions).length * languagesToTest.length;
    
    // Start with default language
    changeLanguageAndTest(defaultLanguage);
}

/**
 * Change language and run tests
 */
function changeLanguageAndTest(lang) {
    console.log(`Testing language: ${lang}`);
    
    // Set language
    window.I18n.setLanguage(lang);
    
    // Wait for language change to take effect
    setTimeout(() => {
        // Run tests for this language
        Object.entries(testDefinitions).forEach(([testName, test]) => {
            const elements = document.querySelectorAll(test.selector);
            const result = test.verify(elements, lang);
            testResults[lang][testName] = result;
            console.log(`[${lang}] ${testName}: ${result.success ? 'PASS' : 'FAIL'} (${result.count}/${result.total})`);
            testsCompleted++;
        });
        
        // Move to next language or finish
        currentLanguageIndex++;
        if (currentLanguageIndex < languagesToTest.length) {
            changeLanguageAndTest(languagesToTest[currentLanguageIndex]);
        } else {
            displayTestResults();
        }
    }, 1000); // Wait for translations to apply
}

/**
 * Display test results
 */
function displayTestResults() {
    console.log('All I18n tests completed!');
    console.log('Summary:');
    
    let totalPass = 0;
    let totalTests = 0;
    
    // Display results for each language
    languagesToTest.forEach(lang => {
        console.log(`\nLanguage: ${lang.toUpperCase()}`);
        const langResults = testResults[lang];
        let langPass = 0;
        let langTotal = 0;
        
        Object.entries(langResults).forEach(([testName, result]) => {
            console.log(`  ${testName}: ${result.success ? 'PASS' : 'FAIL'} (${result.count}/${result.total})`);
            if (result.success) langPass++;
            langTotal++;
        });
        
        console.log(`  Summary: ${langPass}/${langTotal} tests passed`);
        totalPass += langPass;
        totalTests += langTotal;
    });
    
    console.log(`\nOverall: ${totalPass}/${totalTests} tests passed`);
    
    // Create visual indicator on the page
    const testIndicator = document.createElement('div');
    testIndicator.style.position = 'fixed';
    testIndicator.style.top = '10px';
    testIndicator.style.right = '10px';
    testIndicator.style.padding = '10px';
    testIndicator.style.background = totalPass === totalTests ? '#4caf50' : '#f44336';
    testIndicator.style.color = 'white';
    testIndicator.style.fontWeight = 'bold';
    testIndicator.style.borderRadius = '4px';
    testIndicator.style.zIndex = '9999';
    testIndicator.textContent = `I18n Tests: ${totalPass}/${totalTests}`;
    document.body.appendChild(testIndicator);
}

// Check if we should run tests
document.addEventListener('DOMContentLoaded', () => {
    // Check URL for test parameter
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('test_i18n') === 'true') {
        // Wait for charts to load
        setTimeout(startI18nTests, 3000);
    }
});