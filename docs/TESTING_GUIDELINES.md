# DriMon Testing Guidelines

This document provides guidelines for testing the DriMon codebase during and after the refactoring process.

## Core Testing Principles

1. **Import production code directly**
   - Never duplicate production code in test files
   - Tests should import the actual code they're testing
   - This ensures tests validate the real implementation, not a copy

2. **Use real data whenever possible**
   - Tests should use real API endpoints rather than mocked data
   - Using real data helps identify actual integration issues
   - Avoid creating static mock data that becomes outdated

3. **Keep test code isolated**
   - Test-specific code (HTML, CSS, JavaScript) should only contain what's needed to run tests
   - Don't duplicate production HTML/CSS/JS in test files
   - Reference production files directly when needed

4. **Test before commit**
   - **IMPORTANT**: All code should be manually tested before any commits
   - Never commit to git without explicit approval
   - Manual testing is necessary to avoid introducing bugs to production

5. **Test at component boundaries**
   - Focus testing on the public interfaces of modules
   - Avoid testing implementation details when possible
   - Write tests that will survive refactoring of internal implementations

## Test File Organization

Test files should be organized to mirror the structure of the production code:

```
/docs/js/core/utils.js  → /docs/js/tests/utils.test.js
/docs/js/data/api.js    → /docs/js/tests/data/api.test.js
```

## Test Approach

### Unit Tests

Unit tests should:
- Test individual functions and methods
- Validate correct behavior for expected inputs
- Check error handling for invalid inputs
- Focus on public interfaces, not implementation details

Example unit test:

```javascript
// Import production code directly
import { formatNumber } from '../core/utils.js';

// Test with multiple input combinations
function testFormatNumber() {
  // Test integer formatting
  assertEqual(formatNumber(42.5, { useInteger: true }), '43');
  
  // Test decimal formatting
  assertEqual(formatNumber(42.5, { decimals: 2 }), '42.50');
  
  // Test unit appending
  assertEqual(formatNumber(42, { unit: '°C' }), '42 °C');
  
  // Test null/undefined handling
  assertEqual(formatNumber(null), '—');
}
```

### Integration Tests

Integration tests should:
- Test interactions between components
- Validate correct data flow through multiple modules
- Check error handling and recovery
- Use real API endpoints when possible

Example integration test:

```javascript
// Import production modules directly
import { fetchChartData } from '../data/data-fetcher.js';
import { processChartData } from '../data/data-processor.js';
import { createChart } from '../components/charts/chart-factory.js';

// Test the end-to-end flow
async function testChartCreation() {
  // Use real configuration
  const config = getChartConfig('chart-temp');
  
  // Fetch real data
  const data = await fetchChartData(config, '1d');
  
  // Process the data
  const processedData = processChartData(config, data);
  
  // Create chart with the data
  const chartElement = document.getElementById('test-chart');
  const chart = createChart('chart-temp', config, chartElement);
  
  // Verify the chart was created successfully
  assertNotNull(chart);
  assertEqual(chart.config.type, 'line');
  // More assertions...
}
```

### UI Tests

UI tests in `test.html` should:
- Test visual rendering and interaction
- Validate component appearance and behavior
- Check responsive design and theme support
- Test accessibility features

## Testing Tools

We use a simple custom testing framework with:

- `assertEqual()` - Verify equality between actual and expected values
- `assertNotNull()` - Verify a value is not null or undefined
- `assertTrue()` / `assertFalse()` - Verify boolean conditions
- `assertType()` - Verify the type of a value
- `assertDeepEqual()` - Verify equality of objects or arrays

## Running Tests

Tests can be executed by:

1. Opening `test.html` in a browser
2. Using the test runner in each test module
3. Checking console output for test results

## Continuous Improvement

The testing approach will evolve throughout the refactoring process. We'll continually improve our testing practices to ensure high-quality code.

Remember: **The ultimate goal of testing is to provide confidence that the code works as expected and to catch regressions early.**