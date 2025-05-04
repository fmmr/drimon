/**
 * @file config.test.js
 * @description Tests for the Config module
 */

// Import Config modules directly
// IMPORTANT: In the next phase of refactoring, we'll switch to proper ES module imports:
// import Config from '../core/config.js';
// import { ChartConfigSchema, DefaultChartConfig } from '../core/config-schema.js';
// 
// We should always import the actual production code rather than copying it.
// This ensures tests validate the real implementation.
// For now, we're temporarily using the global Config object

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

// Define tests for Config module
const configTests = {
    testValidateChartConfig: async () => {
        // Test a valid configuration
        const validConfig = {
            id: 'test-chart',
            titleKey: 'testChart',
            channel: 123456,
            field: 1,
            row: 1,
            category: 'test',
            unit: '°C'
        };
        
        const validResult = Config.validateChartConfig(validConfig);
        assertTrue(validResult.isValid, 'Valid config should pass validation');
        assertEqual(validResult.errors.length, 0, 'Valid config should have no errors');
        
        // Test an invalid configuration (missing required property)
        const invalidConfig1 = {
            titleKey: 'testChart',
            channel: 123456,
            field: 1
            // missing id and row
        };
        
        const invalidResult1 = Config.validateChartConfig(invalidConfig1);
        assertFalse(invalidResult1.isValid, 'Config missing required properties should fail validation');
        assertTrue(invalidResult1.errors.length > 0, 'Invalid config should have errors');
        
        // Test an invalid configuration (wrong type)
        const invalidConfig2 = {
            id: 'test-chart',
            titleKey: 'testChart',
            channel: '123456', // string instead of number (this actually passes due to auto-conversion)
            field: 'invalid', // string that's not a number
            row: 1,
            category: 'test'
        };
        
        const invalidResult2 = Config.validateChartConfig(invalidConfig2);
        assertFalse(invalidResult2.isValid, 'Config with wrong types should fail validation');
        assertTrue(invalidResult2.errors.length > 0, 'Invalid config should have errors');
        
        // Test a valid multi-series configuration
        const validMultiSeriesConfig = {
            id: 'test-multi-chart',
            titleKey: 'testMultiChart',
            row: 1,
            category: 'test',
            unit: '°C',
            series: [
                {
                    titleKey: 'series1',
                    channel: 123456,
                    field: 1,
                    color: '#ff0000'
                },
                {
                    titleKey: 'series2',
                    channel: 123456,
                    field: 2,
                    color: '#00ff00'
                }
            ]
        };
        
        const validMultiResult = Config.validateChartConfig(validMultiSeriesConfig);
        assertTrue(validMultiResult.isValid, 'Valid multi-series config should pass validation');
        assertEqual(validMultiResult.errors.length, 0, 'Valid multi-series config should have no errors');
        
        // Test invalid configuration (both series and direct channel/field)
        const invalidConfig3 = {
            id: 'test-invalid-chart',
            titleKey: 'testInvalidChart',
            row: 1,
            category: 'test',
            channel: 123456, // Direct channel
            field: 1,        // Direct field
            series: [        // Also has series
                {
                    titleKey: 'series1',
                    channel: 123456,
                    field: 1
                }
            ]
        };
        
        const invalidResult3 = Config.validateChartConfig(invalidConfig3);
        assertFalse(invalidResult3.isValid, 'Config with both series and direct channel/field should fail validation');
        assertTrue(invalidResult3.errors.length > 0, 'Invalid config should have errors');
    },
    
    testGetChartConfig: async () => {
        // Initialize with test configurations
        const testConfigs = [
            {
                id: 'chart-temp',
                titleKey: 'temperatureChart',
                row: 1,
                channel: 123456,
                field: 1,
                category: 'temperature',
                unit: '°C'
            },
            {
                id: 'chart-humidity',
                titleKey: 'humidityChart',
                row: 1,
                channel: 123456,
                field: 2,
                category: 'weather',
                unit: '%'
            }
        ];
        
        Config.initialize({ chartConfigs: testConfigs });
        
        // Test getting config by ID
        const tempConfig = Config.getChartConfig('chart-temp');
        assertNotNull(tempConfig, 'Should retrieve chart config by ID');
        assertEqual(tempConfig.id, 'chart-temp', 'Retrieved config should have correct ID');
        assertEqual(tempConfig.category, 'temperature', 'Retrieved config should have correct category');
        
        // Test getting non-existent config
        const nonExistentConfig = Config.getChartConfig('non-existent');
        assertEqual(nonExistentConfig, null, 'Should return null for non-existent chart ID');
    },
    
    testGetChartsForRow: async () => {
        // Initialize with test configurations
        const testConfigs = [
            {
                id: 'chart-temp',
                titleKey: 'temperatureChart',
                row: 1,
                channel: 123456,
                field: 1,
                category: 'temperature'
            },
            {
                id: 'chart-humidity',
                titleKey: 'humidityChart',
                row: 1,
                channel: 123456,
                field: 2,
                category: 'weather'
            },
            {
                id: 'chart-pressure',
                titleKey: 'pressureChart',
                row: 2,
                channel: 123456,
                field: 3,
                category: 'weather'
            }
        ];
        
        Config.initialize({ chartConfigs: testConfigs });
        
        // Test getting charts for row 1
        const row1Charts = Config.getChartsForRow(1);
        assertEqual(row1Charts.length, 2, 'Should find 2 charts in row 1');
        assertEqual(row1Charts[0].id, 'chart-temp', 'First chart in row 1 should be chart-temp');
        assertEqual(row1Charts[1].id, 'chart-humidity', 'Second chart in row 1 should be chart-humidity');
        
        // Test getting charts for row 2
        const row2Charts = Config.getChartsForRow(2);
        assertEqual(row2Charts.length, 1, 'Should find 1 chart in row 2');
        assertEqual(row2Charts[0].id, 'chart-pressure', 'Chart in row 2 should be chart-pressure');
        
        // Test getting charts for non-existent row
        const row3Charts = Config.getChartsForRow(3);
        assertEqual(row3Charts.length, 0, 'Should find 0 charts in non-existent row');
    },
    
    testGetChartsByCategory: async () => {
        // Initialize with test configurations
        const testConfigs = [
            {
                id: 'chart-temp',
                titleKey: 'temperatureChart',
                row: 1,
                channel: 123456,
                field: 1,
                category: 'temperature'
            },
            {
                id: 'chart-humidity',
                titleKey: 'humidityChart',
                row: 1,
                channel: 123456,
                field: 2,
                category: 'weather'
            },
            {
                id: 'chart-pressure',
                titleKey: 'pressureChart',
                row: 2,
                channel: 123456,
                field: 3,
                category: 'weather'
            }
        ];
        
        Config.initialize({ chartConfigs: testConfigs });
        
        // Test getting charts for 'temperature' category
        const tempCharts = Config.getChartsByCategory('temperature');
        assertEqual(tempCharts.length, 1, 'Should find 1 chart in temperature category');
        assertEqual(tempCharts[0].id, 'chart-temp', 'Chart in temperature category should be chart-temp');
        
        // Test getting charts for 'weather' category
        const weatherCharts = Config.getChartsByCategory('weather');
        assertEqual(weatherCharts.length, 2, 'Should find 2 charts in weather category');
        
        // Test getting charts for non-existent category
        const nonExistentCharts = Config.getChartsByCategory('non-existent');
        assertEqual(nonExistentCharts.length, 0, 'Should find 0 charts in non-existent category');
    },
    
    testGetUnitForChart: async () => {
        // Initialize with test configurations
        const testConfigs = [
            {
                id: 'chart-temp',
                titleKey: 'temperatureChart',
                row: 1,
                channel: 123456,
                field: 1,
                category: 'temperature',
                unit: '°C'
            },
            {
                id: 'chart-humidity',
                titleKey: 'humidityChart',
                row: 1,
                channel: 123456,
                field: 2,
                category: 'weather',
                unit: '%'
            }
        ];
        
        Config.initialize({ chartConfigs: testConfigs });
        
        // Test getting unit by chart ID
        const tempUnit = Config.getUnitForChart('chart-temp');
        assertEqual(tempUnit, '°C', 'Should return correct unit for chart-temp');
        
        // Test getting unit by chart config object
        const humidityUnit = Config.getUnitForChart({ id: 'chart-humidity' });
        assertEqual(humidityUnit, '%', 'Should return correct unit for chart-humidity config object');
        
        // Test getting unit for config object with direct unit property
        const directUnit = Config.getUnitForChart({ unit: 'XYZ' });
        assertEqual(directUnit, 'XYZ', 'Should return unit directly from config object');
        
        // Test getting unit for non-existent chart (should return empty string)
        const nonExistentUnit = Config.getUnitForChart('non-existent-chart');
        assertEqual(nonExistentUnit, '', 'Should return empty string for non-existent chart');
    },
    
    testShouldUseIntegerValues: async () => {
        // Initialize with test configurations
        const testConfigs = [
            {
                id: 'chart-temp',
                titleKey: 'temperatureChart',
                row: 1,
                channel: 123456,
                field: 1,
                category: 'temperature',
                useIntegerFormat: false
            },
            {
                id: 'chart-light',
                titleKey: 'lightChart',
                row: 1,
                channel: 123456,
                field: 3,
                category: 'light',
                useIntegerFormat: true
            }
        ];
        
        Config.initialize({ chartConfigs: testConfigs });
        
        // Test with explicit config value
        const tempFormat = Config.shouldUseIntegerValues({ id: 'chart-temp' });
        assertFalse(tempFormat, 'chart-temp should not use integer format');
        
        const lightFormat = Config.shouldUseIntegerValues({ id: 'chart-light' });
        assertTrue(lightFormat, 'chart-light should use integer format');
        
        // Test with direct config property
        const directFormat = Config.shouldUseIntegerValues({ useIntegerFormat: true });
        assertTrue(directFormat, 'Config with useIntegerFormat: true should return true');
        
        // Test with unknown chart ID (should return default false)
        const unknownFormat = Config.shouldUseIntegerValues({ id: 'unknown-chart' });
        assertFalse(unknownFormat, 'Unknown chart should return default false value');
    },
    
    testAppConfig: async () => {
        // Initialize with test app configuration
        Config.initialize({
            chartConfigs: [{
                id: 'chart-test',
                titleKey: 'testChart',
                row: 1,
                channel: 123456,
                field: 1
            }],
            defaultDateRange: '7',
            defaultLanguage: 'no',
            apiBaseUrl: 'https://test-api.example.com'
        });
        
        // Test getting app config values
        const dateRange = Config.getConfig('defaultDateRange');
        assertEqual(dateRange, '7', 'Should return correct defaultDateRange');
        
        const language = Config.getConfig('defaultLanguage');
        assertEqual(language, 'no', 'Should return correct defaultLanguage');
        
        const apiUrl = Config.getConfig('apiBaseUrl');
        assertEqual(apiUrl, 'https://test-api.example.com', 'Should return correct apiBaseUrl');
        
        // Test getting non-existent config with default
        const nonExistent = Config.getConfig('nonExistent', 'default');
        assertEqual(nonExistent, 'default', 'Should return default value for non-existent config');
        
        // Test setting config value
        Config.setConfig('newSetting', 'value');
        const newSetting = Config.getConfig('newSetting');
        assertEqual(newSetting, 'value', 'Should set and retrieve new config value');
    }
};

// Run tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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

    const runner = new TestRunner('Config');
    
    // Add all Config tests
    runner.addTest('validateChartConfig', configTests.testValidateChartConfig);
    runner.addTest('getChartConfig', configTests.testGetChartConfig);
    runner.addTest('getChartsForRow', configTests.testGetChartsForRow);
    runner.addTest('getChartsByCategory', configTests.testGetChartsByCategory);
    runner.addTest('getUnitForChart', configTests.testGetUnitForChart);
    runner.addTest('shouldUseIntegerValues', configTests.testShouldUseIntegerValues);
    runner.addTest('appConfig', configTests.testAppConfig);
    
    // Run the tests
    runner.runTests().then(results => {
        // Display results on page if in test mode
        const testResultsContainer = document.getElementById('test-results');
        if (testResultsContainer) {
            testResultsContainer.innerHTML += `
                <div class="test-summary ${results.failed > 0 ? 'test-failed' : 'test-passed'}">
                    <h3>Config Module Test Results</h3>
                    <p>Total: ${results.total}</p>
                    <p>Passed: ${results.passed}</p>
                    <p>Failed: ${results.failed}</p>
                </div>
            `;
        }
    });
});