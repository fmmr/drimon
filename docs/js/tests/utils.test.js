/**
 * @file utils.test.js
 * @description Tests for the Utils module
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

// Import Utils module
// IMPORTANT: In the next phase of refactoring, we'll switch to proper ES module imports:
// import Utils from '../core/utils.js';
// 
// We should always import the actual production code rather than copying it.
// This ensures tests validate the real implementation.
// For now, we're temporarily using the global Utils object

// Define tests for Utils module
const utilsTests = {
    testFormatNumber: async () => {
        // Test integer formatting
        assertEqual(
            Utils.formatNumber(42.5, { useInteger: true }),
            '43',
            'formatNumber should round to integer when useInteger is true'
        );
        
        // Test decimal formatting
        assertEqual(
            Utils.formatNumber(42.5, { decimals: 2 }),
            '42.50',
            'formatNumber should format with specified decimals'
        );
        
        // Test unit appending
        assertEqual(
            Utils.formatNumber(42, { unit: '°C' }),
            '42 °C',
            'formatNumber should append unit'
        );
        
        // Test range-based formatting
        assertEqual(
            Utils.formatNumber(42.5, { range: 10 }),
            '43',
            'formatNumber should round when range >= 10'
        );
        
        assertEqual(
            Utils.formatNumber(42.5, { range: 5 }),
            '42.5',
            'formatNumber should use 1 decimal when 1 <= range < 10'
        );
        
        assertEqual(
            Utils.formatNumber(42.5, { range: 0.5 }),
            '42.50',
            'formatNumber should use 2 decimals when range < 1'
        );
        
        // Test null/undefined handling
        assertEqual(
            Utils.formatNumber(null),
            '—',
            'formatNumber should return placeholder for null'
        );
        
        assertEqual(
            Utils.formatNumber(undefined),
            '—',
            'formatNumber should return placeholder for undefined'
        );
    },
    
    testGetURLParameter: async () => {
        // This test assumes URL parameters could be mocked
        // In a real test environment, we would use a proper mocking framework
        
        // For now, let's just test the function exists and returns the right type
        assertType(
            Utils.getURLParameter,
            'function',
            'getURLParameter should be a function'
        );
    },
    
    testGetDateRange: async () => {
        // Test numeric range
        const numericRange = Utils.getDateRange('7');
        assertNotNull(numericRange.startDate, 'startDate should not be null for numeric range');
        assertEqual(typeof numericRange.startDate, 'string', 'startDate should be a string');
        
        // Test named ranges
        const todayRange = Utils.getDateRange('today');
        assertNotNull(todayRange.startDate, 'startDate should not be null for "today" range');
        
        const yesterdayRange = Utils.getDateRange('yesterday');
        assertNotNull(yesterdayRange.startDate, 'startDate should not be null for "yesterday" range');
        assertNotNull(yesterdayRange.endDate, 'endDate should not be null for "yesterday" range');
        
        // Test start range
        const startRange = Utils.getDateRange('start');
        assertNotNull(startRange.startDate, 'startDate should not be null for "start" range');
    },
    
    testShouldUseIntegerValues: async () => {
        // Test explicit config
        assertEqual(
            Utils.shouldUseIntegerValues({ useIntegerFormat: true }),
            true,
            'shouldUseIntegerValues should return true when useIntegerFormat is true'
        );
        
        // Test chart ID heuristics
        assertEqual(
            Utils.shouldUseIntegerValues({ id: 'chart-light' }),
            true,
            'shouldUseIntegerValues should return true for light charts'
        );
        
        assertEqual(
            Utils.shouldUseIntegerValues({ id: 'chart-temp' }),
            false,
            'shouldUseIntegerValues should return false for temperature charts'
        );
    },
    
    testGetUnitForChart: async () => {
        // Test direct unit in config
        assertEqual(
            Utils.getUnitForChart({ unit: 'XYZ' }),
            'XYZ',
            'getUnitForChart should return unit from config'
        );
        
        // Test chart ID heuristics
        assertEqual(
            Utils.getUnitForChart('chart-temp'),
            '°C',
            'getUnitForChart should return °C for temperature charts'
        );
        
        assertEqual(
            Utils.getUnitForChart('chart-humidity'),
            '%',
            'getUnitForChart should return % for humidity charts'
        );
        
        assertEqual(
            Utils.getUnitForChart('chart-light'),
            'lux',
            'getUnitForChart should return lux for light charts'
        );
    },
    
    testCalculateStatistics: async () => {
        // Test with normal array
        const stats = Utils.calculateStatistics([10, 20, 30, 40, 50]);
        assertEqual(stats.minValue, 10, 'minValue should be 10');
        assertEqual(stats.maxValue, 50, 'maxValue should be 50');
        assertEqual(stats.avgValue, 30, 'avgValue should be 30');
        assertEqual(stats.currentValue, 50, 'currentValue should be 50');
        
        // Test with empty array
        const emptyStats = Utils.calculateStatistics([]);
        assertEqual(emptyStats.minValue, 0, 'minValue should be 0 for empty array');
        assertEqual(emptyStats.maxValue, 0, 'maxValue should be 0 for empty array');
        assertEqual(emptyStats.avgValue, 0, 'avgValue should be 0 for empty array');
        assertEqual(emptyStats.currentValue, null, 'currentValue should be null for empty array');
        
        // Test with null/undefined values
        const nullStats = Utils.calculateStatistics([10, null, 30, undefined, 50]);
        assertEqual(nullStats.minValue, 10, 'minValue should ignore null/undefined values');
        assertEqual(nullStats.maxValue, 50, 'maxValue should ignore null/undefined values');
        assertEqual(nullStats.avgValue, 30, 'avgValue should ignore null/undefined values');
        assertEqual(nullStats.currentValue, 50, 'currentValue should be the last valid value');
    },
    
    testCreateElement: async () => {
        // Test creating simple element
        const element = Utils.createElement('div');
        assertEqual(element.tagName.toLowerCase(), 'div', 'Should create a div element');
        
        // Test with attributes
        const buttonWithAttrs = Utils.createElement('button', {
            className: 'test-button',
            id: 'test-button',
            textContent: 'Click Me'
        });
        
        assertEqual(buttonWithAttrs.tagName.toLowerCase(), 'button', 'Should create a button element');
        assertEqual(buttonWithAttrs.className, 'test-button', 'Should set class name correctly');
        assertEqual(buttonWithAttrs.id, 'test-button', 'Should set id correctly');
        assertEqual(buttonWithAttrs.textContent, 'Click Me', 'Should set text content correctly');
        
        // Test with children
        const parent = Utils.createElement('div', { className: 'parent' }, [
            Utils.createElement('span', { textContent: 'Child 1' }),
            Utils.createElement('span', { textContent: 'Child 2' })
        ]);
        
        assertEqual(parent.children.length, 2, 'Should have 2 children');
        assertEqual(parent.children[0].textContent, 'Child 1', 'First child should have correct text');
        assertEqual(parent.children[1].textContent, 'Child 2', 'Second child should have correct text');
        
        // Test with string child
        const textElement = Utils.createElement('p', {}, 'Hello, world!');
        assertEqual(textElement.textContent, 'Hello, world!', 'Should set text content from string child');
    },
    
    testAddEventListenerWithCleanup: async () => {
        // Create a test element
        const button = document.createElement('button');
        
        // Counter to track event calls
        let clickCount = 0;
        
        // Event handler
        const handleClick = () => { clickCount++; };
        
        // Add event listener with cleanup
        const cleanup = Utils.addEventListenerWithCleanup(button, 'click', handleClick);
        
        // Simulate a click
        button.click();
        assertEqual(clickCount, 1, 'Event handler should be called once');
        
        // Simulate another click
        button.click();
        assertEqual(clickCount, 2, 'Event handler should be called twice');
        
        // Call cleanup function
        cleanup();
        
        // Simulate another click
        button.click();
        assertEqual(clickCount, 2, 'Event handler should not be called after cleanup');
    },
    
    testAddMultipleEventListeners: async () => {
        // Create a test element
        const element = document.createElement('div');
        
        // Counters to track event calls
        let clickCount = 0;
        let mouseoverCount = 0;
        
        // Event handlers
        const handleClick = () => { clickCount++; };
        const handleMouseover = () => { mouseoverCount++; };
        
        // Add multiple event listeners
        const cleanup = Utils.addMultipleEventListeners(element, {
            click: handleClick,
            mouseover: handleMouseover
        });
        
        // Simulate events
        element.click();
        assertEqual(clickCount, 1, 'Click handler should be called once');
        
        // Create and dispatch a mouseover event
        const mouseoverEvent = new MouseEvent('mouseover', { bubbles: true });
        element.dispatchEvent(mouseoverEvent);
        assertEqual(mouseoverCount, 1, 'Mouseover handler should be called once');
        
        // Call cleanup function
        cleanup();
        
        // Simulate events again
        element.click();
        element.dispatchEvent(mouseoverEvent);
        
        assertEqual(clickCount, 1, 'Click handler should not be called after cleanup');
        assertEqual(mouseoverCount, 1, 'Mouseover handler should not be called after cleanup');
    },
    
    testDebounceAndThrottle: async () => {
        // This is a more complex test that requires timing, so we'll do some basic validation
        
        // Test debounce exists and returns a function
        const debounced = Utils.debounce(() => {}, 100);
        assertType(debounced, 'function', 'Debounce should return a function');
        
        // Test throttle exists and returns a function
        const throttled = Utils.throttle(() => {}, 100);
        assertType(throttled, 'function', 'Throttle should return a function');
    },
    
    testCreateEventEmitter: async () => {
        // Create an event emitter
        const emitter = Utils.createEventEmitter();
        
        // Test basic structure
        assertType(emitter.on, 'function', 'Emitter should have on method');
        assertType(emitter.off, 'function', 'Emitter should have off method');
        assertType(emitter.emit, 'function', 'Emitter should have emit method');
        assertType(emitter.once, 'function', 'Emitter should have once method');
        
        // Test event subscription and emission
        let callCount = 0;
        let lastData = null;
        
        const handler = (data) => {
            callCount++;
            lastData = data;
        };
        
        // Subscribe to event
        const unsubscribe = emitter.on('test', handler);
        
        // Emit event
        emitter.emit('test', { value: 42 });
        
        assertEqual(callCount, 1, 'Handler should be called once');
        assertEqual(lastData.value, 42, 'Handler should receive correct data');
        
        // Emit again
        emitter.emit('test', { value: 43 });
        
        assertEqual(callCount, 2, 'Handler should be called twice');
        assertEqual(lastData.value, 43, 'Handler should receive updated data');
        
        // Unsubscribe
        unsubscribe();
        
        // Emit again
        emitter.emit('test', { value: 44 });
        
        assertEqual(callCount, 2, 'Handler should not be called after unsubscribe');
        assertEqual(lastData.value, 43, 'Data should not be updated after unsubscribe');
        
        // Test once method
        let onceCallCount = 0;
        
        emitter.once('once-test', () => {
            onceCallCount++;
        });
        
        // Emit twice
        emitter.emit('once-test');
        emitter.emit('once-test');
        
        assertEqual(onceCallCount, 1, 'Once handler should only be called once');
    },
    
    testQueryStringHelpers: async () => {
        // Test toQueryString
        const params = {
            name: 'John Doe',
            age: 30,
            isActive: true,
            nullValue: null,
            undefinedValue: undefined
        };
        
        const queryString = Utils.toQueryString(params);
        
        // Check that values are properly encoded and nulls/undefineds are filtered
        assertTrue(
            queryString.includes('name=John%20Doe'),
            'Query string should include encoded name'
        );
        
        assertTrue(
            queryString.includes('age=30'),
            'Query string should include age'
        );
        
        assertTrue(
            queryString.includes('isActive=true'),
            'Query string should include isActive'
        );
        
        assertFalse(
            queryString.includes('nullValue'),
            'Query string should not include null values'
        );
        
        assertFalse(
            queryString.includes('undefinedValue'),
            'Query string should not include undefined values'
        );
        
        // Test parseQueryString
        const parsed = Utils.parseQueryString('name=John%20Doe&age=30&isActive=true');
        
        assertEqual(parsed.name, 'John Doe', 'Should parse name correctly');
        assertEqual(parsed.age, '30', 'Should parse age correctly');
        assertEqual(parsed.isActive, 'true', 'Should parse isActive correctly');
        
        // Test with leading ?
        const parsedWithQuestionMark = Utils.parseQueryString('?name=John%20Doe&age=30');
        
        assertEqual(parsedWithQuestionMark.name, 'John Doe', 'Should parse name correctly with leading ?');
        assertEqual(parsedWithQuestionMark.age, '30', 'Should parse age correctly with leading ?');
    }
};

// Run tests when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const runner = new TestRunner('Utils');
    
    // Add all Utils tests
    runner.addTest('formatNumber', utilsTests.testFormatNumber);
    runner.addTest('getURLParameter', utilsTests.testGetURLParameter);
    runner.addTest('getDateRange', utilsTests.testGetDateRange);
    runner.addTest('shouldUseIntegerValues', utilsTests.testShouldUseIntegerValues);
    runner.addTest('getUnitForChart', utilsTests.testGetUnitForChart);
    runner.addTest('calculateStatistics', utilsTests.testCalculateStatistics);
    runner.addTest('createElement', utilsTests.testCreateElement);
    runner.addTest('addEventListenerWithCleanup', utilsTests.testAddEventListenerWithCleanup);
    runner.addTest('addMultipleEventListeners', utilsTests.testAddMultipleEventListeners);
    runner.addTest('debounceAndThrottle', utilsTests.testDebounceAndThrottle);
    runner.addTest('createEventEmitter', utilsTests.testCreateEventEmitter);
    runner.addTest('queryStringHelpers', utilsTests.testQueryStringHelpers);
    
    // Run the tests
    runner.runTests().then(results => {
        // Display results on page if in test mode
        const testResultsContainer = document.getElementById('test-results');
        if (testResultsContainer) {
            testResultsContainer.innerHTML += `
                <div class="test-summary ${results.failed > 0 ? 'test-failed' : 'test-passed'}">
                    <h3>Utils Module Test Results</h3>
                    <p>Total: ${results.total}</p>
                    <p>Passed: ${results.passed}</p>
                    <p>Failed: ${results.failed}</p>
                </div>
            `;
        }
    });
});