# DriMon Testing Guidelines

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

## Test Harness

A standalone test harness is provided at `test_components.html` which offers:

- **Manual Component Testing**: Visual verification of individual components
- **Automated Tests**: Programmatic verification of component functionality
- **Interactive Debugging**: Event binding tests and interactive manipulation

## Component Tests

The test suite validates various aspects of the system:

### Header Components
- **Logo Container**: Verifies the logo and time indicator rendering
- **Data Container**: Tests sensor data chips display and formatting
- **Date Ranges**: Validates date selection controls
- **Search Container**: Tests result count controls and toggle buttons
- **Event Binding**: Verifies interactive elements respond to user input

### Chart Components
- **Chart Container**: Tests chart creation with proper structure
- **Chart Stats**: Verifies statistics calculation and display
- **Loading Indicator**: Tests loading states and error handling
- **Date Range Functions**: Validates date range calculations

## Test Implementation

The testing architecture consists of:

- **component_tests.js**: Automated test framework with assertion functions
- **Test Runner**: JavaScript class that manages test execution and reporting
- **Visual Verification**: Manual testing capabilities with interactive UI
- **Isolated Testing**: Components can be tested individually or in groups

## Running Tests

To run the tests:

1. Start a local server as described in the Development section
2. Navigate to `/test_components.html` in your browser
3. Use the tabs to switch between test types:
   - **Manual Tests**: Click buttons to render and test individual components
   - **Automated Tests**: Run full test suites with detailed reporting
   - **Chart Tests**: Test chart-specific components and functionality

## Test Mode

DriMon includes a comprehensive test mode with debug tools. To activate:

1. Append `?test=true` to any DriMon URL (e.g., `https://drimon.rodland.no/?test=true`)
2. Optional: Set log level with `&logLevel=verbose` (options: `info`, `debug`, `verbose`)
3. For i18n tests: Append `?test_i18n=true` to run automated internationalization tests

Test Mode Features:

### Enhanced Logging
- Timestamped console output with elapsed time tracking
- Log level filtering (info, debug, verbose)
- Internal event tracking for diagnostics

### Debug Panel
- Access via the 🔍 button in the bottom right corner
- View recent events, errors, and log messages
- Monitor and inspect network requests in real-time
- Track component rendering performance

### Network Monitoring
- All API calls are automatically logged and can be inspected
- Response data and timing information available
- Error tracking for failed requests

### Component Tracking
- Performance metrics for all rendered components
- Render time measurement
- Component hierarchy visualization

### Usage Examples

```
# Basic test mode
https://drimon.rodland.no/?test=true

# Test mode with verbose logging
https://drimon.rodland.no/?test=true&logLevel=verbose

# Test mode with debug level logging
https://drimon.rodland.no/?test=true&logLevel=debug

# Run i18n tests - automatically tests all UI translations
https://drimon.rodland.no/?test_i18n=true
```

## I18n Testing

The internationalization system has dedicated testing tools:

1. **Automated I18n Tests**: 
   - Accessible at `/i18n_tests.html`
   - Tests translation system, language switching, and parameter interpolation
   - Provides validation of translation keys across languages
   - Can be run automatically with `?test_i18n=true` URL parameter

2. **Translation Key Validation**:
   - Use `I18n.validateTranslations()` to check for missing keys
   - Warns about keys present in one language but missing in others
   - Validates all translations in the system at once

3. **Unit Tests**:
   - Located in `/js/tests/i18n.test.js`
   - Tests all core I18n functionality
   - Verifies backward compatibility with legacy code
   - Tests parameter interpolation and missing key handling

4. **Translation Testing Process**:
   1. Run automated tests with `?test_i18n=true`
   2. Verify all UI elements display correctly in each language
   3. Check console for missing translation warnings
   4. Validate translations match visual design requirements
   5. Test language switching works without page reload

5. **Chart Translation Testing**:
   - Test dynamic translation key inference for chart titles
   - Verify series label translation works correctly
   - Test language switching updates chart titles and labels
   - Ensure statistics display with correct localized formatting

6. **I18n System Architecture**:
   - Single source of truth in `translations-loader.js`
   - Modernized API with `window.I18n.translate()` and `window.I18n.t()` shorthand
   - Dynamic key inference for backward compatibility with legacy code
   - No language-specific text in any code files
   - Parameter interpolation with `{{param}}` syntax
   - Language change events with proper DOM updates

The translation system is designed to fail visibly by displaying untranslated keys rather than silently showing incorrect content.

The debug panel provides an interactive interface for exploring the application's inner workings without affecting production functionality.

## Configuration-Driven Testing

The DriMon application follows a configuration-driven approach, where module behavior is determined by explicit configuration rather than implicit conventions. When testing:

1. Always test with explicit configuration parameters
2. Avoid relying on ID-based or naming convention-based defaults
3. Validate that configuration validation properly rejects invalid configurations
4. Test default values to ensure they provide meaningful fallbacks
5. Use direct property access instead of helper functions where appropriate (e.g., `config.unit` instead of `getUnitForChart(config)`)
6. Ensure test fixtures include all required configuration properties

Example of configuration-driven testing:

```javascript
// AVOID this pattern (relies on ID-based defaults):
const formatString = formatValue(42, { chartId: 'chart-temp' });

// PREFER this pattern (explicit configuration):
const formatString = formatValue(42, { 
  unit: '°C', 
  useIntegerFormat: false,
  decimals: 1
});
```

This approach ensures our tests will remain valid even as we evolve the application's implementation details and reinforces the principle that all behavior should be driven by explicit configuration.