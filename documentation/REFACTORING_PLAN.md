# DriMon Web Interface Refactoring Plan

## Overview

This document outlines the comprehensive plan to refactor and simplify the DriMon web interface while maintaining all existing functionality. The goal is to create a more maintainable, modular codebase with better separation of concerns, less duplication, and improved internationalization support.

## Core Principles

1. **Configuration-driven architecture**: Move all configuration to `chart_config.js` and eliminate conditional logic based on chart IDs or titles
2. **Internationalization-first approach**: Use only translation keys in the codebase, never hardcoded strings
3. **Modular components**: Clearly separate concerns with well-defined interfaces between modules
4. **Simplified logic**: Reduce complexity and eliminate duplicated code
5. **Automated tests**: Add comprehensive tests to validate changes and prevent regressions

## Project Structure After Refactoring

```
/docs/
  /js/
    /core/
      utils.js             # Common utilities
      i18n.js              # Internationalization system
      config-schema.js     # Configuration schema and validation
    /components/
      chart-renderer.js    # Core chart rendering
      chart-factory.js     # Chart creation factory
      annotations.js       # Chart annotations
      statistics.js        # Statistics calculation and display
    /data/
      data-fetcher.js      # Data fetching from API
      data-processor.js    # Data transformation
      cache.js             # Data caching system
    /ui/
      header.js            # Header components
      controls.js          # User controls
      responsive.js        # Responsive layout management
    /debug/
      debug.js             # Debug utilities
    main.js                # Application entry point
  /css/
    main.css               # Main styles
    dark-mode.css          # Dark mode styles
    components.css         # Component-specific styles
  /tests/
    unit/                  # Unit tests
    integration/           # Integration tests
    visual/                # Visual regression tests
  index.html               # Main application
  test.html                # Test page
```

## Implementation Approach

1. **Incremental changes**: Refactor the codebase incrementally to maintain functionality throughout
2. **Feature branches**: Implement each major change in a separate feature branch
3. **Manual testing**: Thoroughly test all changes with real data before implementation
4. **Continuous validation**: Regularly test the UI to ensure functionality is preserved
5. **Documentation-driven**: Update documentation as code changes are made
6. **No premature commits**: Do not commit to git without explicit approval - production code should be manually tested before any commit

## Success Metrics

1. **Code maintainability**: Reduced cyclomatic complexity and improved readability
2. **Performance**: Faster rendering and data processing
3. **Testability**: Comprehensive test coverage
4. **Extensibility**: Easier to add new features or chart types
5. **Internationalization**: Complete separation of code and translatable text

## Progress Report

### Completed Tasks

#### Core Architecture

- **✅ Chart Configuration System**
  - Refactored `chart_config.js` to be the single source of truth for all chart-related configuration
  - Added proper JSDoc documentation to configuration schema
  - Standardized configuration properties (units, formatting, display options)
  - Implemented validation for chart configuration
  - Moved any hardcoded properties from chart renderer into configuration
  - Removed ID-based logic in favor of explicit configuration properties
  - Implemented true configuration-driven approach with direct property access
  - Added data transformation system with configuration (`dataTransform` property)

- **✅ Internationalization Improvements**
  - Replaced all references to old window.i18n with the new I18n system
  - Removed legacy translations.js and consolidated to translations-loader.js as single source of truth
  - Improved chart-i18n.js to use dynamic translation key inference without language-specific code
  - Enhanced i18n tests to verify the new system works correctly
  - Added validation to ensure all text uses translation keys
  - Removed all language-specific strings from the codebase
  - Fixed Norwegian typos in translation strings

- **✅ Utility Functions**
  - Created a dedicated utility module `utils.js` for shared functions
  - Moved date handling, number formatting, and other shared functionality to utilities
  - Implemented proper error handling and validation in utility functions
  - Manually tested all utility functions with real data

#### Component Refactoring

- **✅ Chart Renderer**
  - Simplified `chart_renderer.js` by extracting logical groups into separate modules
  - Created a proper component hierarchy with clear responsibilities
  - Removed any ID-based or title-based conditionals
  - Implemented a more declarative approach to chart creation
  - Split rendering logic from data processing
  - Extracted statistics functions to dedicated module
  - Extracted layout management functions to dedicated module
  - Extracted utilities to chart-utils.js
  - Removed all backward compatibility and fallback code

- **✅ Data Components**
  - Refactored `data_components.js` to focus solely on data fetching and processing
  - Implemented clear interfaces between data and rendering components
  - Added proper caching mechanism for data
  - Improved error handling for network requests

- **✅ Header Components**
  - Refactored header components to use a more declarative approach
  - Implemented consistent event handling
  - Improved interaction with charts and data system

#### Feature Enhancements

- **✅ Chart Statistics**
  - Simplified statistics calculation and display
  - Implemented a more uniform approach to statistics across chart types
  - Moved statistics format options to configuration
  - Created dedicated chart-stats.js module for statistics handling
  - Standardized statistics display across all chart types

- **✅ Multi-Series Charts**
  - Refactored multi-series chart handling to be more consistent
  - Implemented better legend management
  - Improved tooltip display for multi-series charts
  - Fixed legend flickering during language switching
  - Improved tooltip synchronization between charts
  - Added proper date formatting in tooltips based on timespan

- **✅ Responsive Design**
  - Refactored layout management for better responsiveness
  - Simplified mobile vs. desktop logic
  - Improved chart resizing logic

- **✅ Performance Improvements**
  - Optimized chart rendering for large datasets
  - Implemented proper memoization for expensive calculations
  - Implemented smarter data fetching strategy
  - Ensured charts are fetched async and displayed as soon as possible
  - Added progressive rendering of charts as data becomes available
  - Improved chart syncing for better performance
  - Used animation-free updates for language switching
  - Implemented proper caching headers

- **✅ Request Optimization**
  - Implemented request throttling to limit concurrent API calls
  - Added request debouncing to prevent duplicate requests
  - Added request batching for multiple fields from same channel
  - Optimized payloads by combining related requests
  - Created dedicated DataRequestManager module for centralized request handling
  - Improved error handling and resilience for network failures
  - Added request statistics tracking for performance monitoring

#### Documentation and Testing

- **✅ Comprehensive Testing Guidelines**
  - Documented manual testing procedures
  - Created testing checklist for chart components

- **✅ Documentation**
  - Created comprehensive API documentation
  - Added architectural documentation
  - Documented configuration options
  - Added inline code documentation

### Pending Tasks

#### Core Architecture

- **Code Quality**
  - [ ] Remove any unused code
  - [ ] Ensure there is a minimal or no duplicated code
  - [ ] Add JSDoc comments to utility functions

#### Component Refactoring

- **Chart Components**
  - [ ] Simplify chart component creation with factory functions
  - [ ] Add proper lifecycle management for chart components
  - [ ] Implement state management for chart interactions
  - [ ] Create a component registry for better management

#### Feature Enhancements

- **Chart Statistics**
  - [ ] Add validation for statistics values

- **Multi-Series Charts**
  - [ ] Add validation for series configuration

- **Chart Annotations**
  - [ ] Create a dedicated annotations module
  - [ ] Add validation for annotation configuration

- **Responsive Design**
  - [ ] Create adaptive configuration for different screen sizes

#### Performance Improvements

- **Rendering Optimization**
  - [ ] Implement lazy loading for charts
  - [ ] Add request batching for multiple chart data fetches

- **Memory Management**
  - [ ] Add proper cleanup for disposed charts
  - [ ] Implement resource pooling for shared resources
  - [ ] Optimize data structures for memory efficiency
  - [ ] Add memory usage monitoring in debug mode

- **Network Optimization**
  - [ ] Add request throttling and debouncing
  - [ ] Optimize payload sizes

#### Documentation and Testing

- **Comprehensive Testing Guidelines**
  - [ ] Add performance testing guidelines
  - [ ] Create accessibility testing guidelines

- **Documentation**
  - [ ] Create developer guide for future maintenance

#### Final Cleanup and Review

- **Code Quality**
  - [ ] Run code quality tools and address issues
  - [ ] Check for any remaining hardcoded strings
  - [ ] Ensure consistent coding style
  - [ ] Validate against coding standards

- **Final Testing**
  - [ ] Verify all functionality works as expected
  - [ ] Test on various devices and browsers
  - [ ] Validate all configurations
  - [ ] Perform final performance testing

## Next Steps

After implementing a few more core modules, we should:
1. Apply the new modules to index.html alongside the existing code
2. Verify functionality with real data from ThingSpeak
3. Test on different devices and screen sizes
4. Only when verified, gradually migrate functionality from old to new modules