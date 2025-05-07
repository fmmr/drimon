# DriMon Testing Guidelines

## Manual Testing Approach

DriMon relies on thorough manual testing rather than automated tests. This approach ensures the application works correctly in real-world scenarios with actual data.

## Core Testing Principles

1. **Test with real data**
   - Use real API endpoints with actual production data
   - Verify functionality with various data ranges and scenarios
   - Test with multiple languages to ensure internationalization works correctly

2. **Test before commit**
   - **IMPORTANT**: All code should be manually tested before any commits
   - Never commit to git without explicit approval
   - Manual testing is necessary to avoid introducing bugs to production
   - Test on multiple browsers and devices when possible

3. **Test at component boundaries**
   - Focus testing on the public interfaces of modules
   - Verify interactions between components work as expected
   - Ensure configuration options are correctly applied

## Testing Process

When testing new changes:

1. **Functionality Testing**
   - Verify the specific functionality being changed works as expected
   - Check all interactive elements respond correctly to user input
   - Test edge cases and error handling

2. **Regression Testing**
   - Ensure existing features continue to work after changes
   - Check for unintended side effects in related components
   - Verify all charts display and update correctly

3. **Performance Testing**
   - Check loading times remain acceptable
   - Ensure charts render promptly and update smoothly
   - Verify mobile performance is satisfactory

4. **Visual Testing**
   - Check layout on different screen sizes
   - Verify dark mode and light mode both work correctly
   - Ensure responsive design adapts appropriately

## Manual Testing Checklist

### Header Components
- Logo container displays correctly
- Sensor data chips show correct values
- Date range controls work properly
- Results count controls function as expected
- All interactive elements respond to user input

### Chart Components
- Charts create proper structure and display correctly
- Statistics are calculated and displayed accurately
- Loading indicators work properly for all states
- Date range functions apply correctly
- Layout adapts appropriately to screen size
- Tooltips display the right information
- Chart synchronization works across all charts

## Debug Mode

DriMon includes a debug mode with developer tools. To activate:

1. Append `?test=true` to any DriMon URL (e.g., `https://drimon.rodland.no/?test=true`)
2. Optional: Set log level with `&logLevel=verbose` (options: `info`, `debug`, `verbose`)

Debug Mode Features:

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

### Usage Examples

```
# Basic debug mode
https://drimon.rodland.no/?test=true

# Debug mode with verbose logging
https://drimon.rodland.no/?test=true&logLevel=verbose

# Debug mode with debug level logging
https://drimon.rodland.no/?test=true&logLevel=debug
```

## Internationalization (I18n) Testing

When testing internationalization:

1. **Manual Testing Process**:
   - Verify all UI elements display correctly in each language
   - Check for missing translation keys (visible as "MISSING_KEY")
   - Validate translations match visual design requirements
   - Test language switching works without page reload
   - Check that all charts update correctly when language changes
   - Verify tooltips and statistics display with correct localized formatting

2. **I18n System Architecture**:
   - Single source of truth in `translations-loader.js`
   - Modernized API with `window.I18n.translate()` and `window.I18n.t()` shorthand
   - Dynamic key inference for backward compatibility
   - No language-specific text in any code files
   - Parameter interpolation with `{{param}}` syntax
   - Language change events with proper DOM updates

The translation system is designed to fail visibly by displaying untranslated keys rather than silently showing incorrect content.

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