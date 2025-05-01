/**
 * Component Tests for DriMon
 * 
 * This file contains tests for the UI components to ensure they
 * render correctly and can be accessed by their selectors.
 */

// Simple test runner
class TestRunner {
    constructor() {
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
        console.group('Running DriMon Component Tests');
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

// Helper functions for tests
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

function assertHasClass(element, className, message) {
    if (!element.classList.contains(className)) {
        throw new Error(message || `Element does not have class "${className}"`);
    }
}

// Define header component tests
const headerTests = {
    testLogoContainer: async () => {
        // Create logo container
        const logoContainer = createLogoContainer();
        document.body.appendChild(logoContainer);
        
        // Verify element structure
        const logo = document.querySelector('.logo');
        const timeIndicator = document.querySelector('.time-indicator');
        
        assertNotNull(logo, 'Logo element should exist');
        assertNotNull(timeIndicator, 'Time indicator should exist');
        assertEqual(logo.id, 'main-title', 'Logo should have correct ID');
        
        // Clean up
        document.body.removeChild(logoContainer);
    },
    
    testDataContainer: async () => {
        // Create data container
        const dataContainer = createDataContainer();
        document.body.appendChild(dataContainer);
        
        // Verify data chips
        const tempElement = document.getElementById('temperature');
        const lightElement = document.getElementById('light');
        const batteryElement = document.getElementById('battery');
        const windowElement = document.getElementById('window');
        
        assertNotNull(tempElement, 'Temperature element should exist');
        assertNotNull(lightElement, 'Light element should exist');
        assertNotNull(batteryElement, 'Battery element should exist');
        assertNotNull(windowElement, 'Window element should exist');
        
        // Verify container has the right ID
        assertEqual(dataContainer.id, 'infoSection', 'Data container should have correct ID');
        
        // Clean up
        document.body.removeChild(dataContainer);
    },
    
    testDateRanges: async () => {
        // Create date ranges
        const dateRanges = createDateRanges();
        document.body.appendChild(dateRanges);
        
        // Verify date chips
        const chips = dateRanges.querySelectorAll('.date-chip');
        
        assertNotNull(chips, 'Date chips should exist');
        assertEqual(chips.length, 9, 'Should have 9 date range chips');
        
        // Verify some specific chips
        const todayChip = dateRanges.querySelector('[data-range="today"]');
        const weekChip = dateRanges.querySelector('[data-range="this-week"]');
        
        assertNotNull(todayChip, 'Today chip should exist');
        assertNotNull(weekChip, 'Week chip should exist');
        assertEqual(todayChip.textContent, 'i dag', 'Today chip should have correct text');
        
        // Clean up
        document.body.removeChild(dateRanges);
    },
    
    testSearchContainer: async () => {
        // Create search container
        const searchContainer = createSearchContainer();
        document.body.appendChild(searchContainer);
        
        // Verify search elements
        const sortSelect = document.getElementById('sortSelect');
        const resultsInput = document.getElementById('resultsInput');
        const updateButton = document.getElementById('updateButton');
        const darkModeToggle = document.getElementById('darkModeToggle');
        
        assertNotNull(sortSelect, 'Sort select should exist');
        assertNotNull(resultsInput, 'Results input should exist');
        assertNotNull(updateButton, 'Update button should exist');
        assertNotNull(darkModeToggle, 'Dark mode toggle should exist');
        
        // Verify sort options
        const options = sortSelect.querySelectorAll('option');
        assertEqual(options.length, 8, 'Should have 8 sort options');
        
        // Clean up
        document.body.removeChild(searchContainer);
    },
    
    testCompleteHeader: async () => {
        // Create the full header
        const header = createHeader();
        document.body.appendChild(header);
        
        // Verify all main sections exist
        const logoContainer = header.querySelector('.logo-container');
        const dataContainer = header.querySelector('.data-container');
        const dateRanges = header.querySelector('.date-ranges');
        const searchContainer = header.querySelector('.search-container');
        
        assertNotNull(logoContainer, 'Logo container should exist');
        assertNotNull(dataContainer, 'Data container should exist');
        assertNotNull(dateRanges, 'Date ranges should exist');
        assertNotNull(searchContainer, 'Search container should exist');
        
        // Verify header has correct class
        assertHasClass(header, 'modern-header', 'Header should have modern-header class');
        
        // Clean up
        document.body.removeChild(header);
    }
};

// Run all tests function
async function runHeaderComponentTests() {
    const runner = new TestRunner();
    
    // Add all header tests
    runner.addTest('Logo Container Rendering', headerTests.testLogoContainer);
    runner.addTest('Data Container Rendering', headerTests.testDataContainer);
    runner.addTest('Date Ranges Rendering', headerTests.testDateRanges);
    runner.addTest('Search Container Rendering', headerTests.testSearchContainer);
    runner.addTest('Complete Header Rendering', headerTests.testCompleteHeader);
    
    // Run the tests
    const results = await runner.runTests();
    
    // Display results on page if in test mode
    const testResultsContainer = document.getElementById('test-results');
    if (testResultsContainer) {
        testResultsContainer.innerHTML = `
            <div class="test-summary ${results.failed > 0 ? 'test-failed' : 'test-passed'}">
                <h3>Test Results</h3>
                <p>Total: ${results.total}</p>
                <p>Passed: ${results.passed}</p>
                <p>Failed: ${results.failed}</p>
            </div>
        `;
    }
    
    return results;
}

// Export test functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runHeaderComponentTests,
        headerTests
    };
}