# DriMon Web Interface Refactoring Plan

## Overview

This document outlines the comprehensive plan to refactor and simplify the DriMon web interface while maintaining all existing functionality. The goal is to create a more maintainable, modular codebase with better separation of concerns, less Application, and improved internationalization support.

## Core Principles

1. **Configuration-driven architecture**: Move all configuration to `chart_config.js` and eliminate conditional logic based on chart IDs or titles
2. **Internationalization-first approach**: Use only translation keys in the codebase, never hardcoded strings
3. **Modular components**: Clearly separate concerns with well-defined interfaces between modules
4. **Simplified logic**: Reduce complexity and eliminate duplicated code
5. **Automated tests**: Add comprehensive tests to validate changes and prevent regressions

## Phase 1: Analysis and Preparation

### 1.1 Code Audit
- [x] Review all JavaScript files to understand dependencies and code flow
- [x] Document key functions and their responsibilities (created FUNCTION_INVENTORY.md)
- [x] Identify areas of duplication and overly complex code (created CODE_ANALYSIS.md)
- [x] Create a dependency graph between modules (created DEPENDENCY_GRAPH.md)

### 1.2 Test Environment Setup
- [x] Enhance `test.html` to include test cases for all key components
- [ ] Add unit tests for chart rendering functions
- [ ] Add tests for internationalization (i18n) functionality
- [ ] Create automated test suite for chart configuration validation

### 1.3 Define Module Boundaries
- [x] Clearly define responsibilities for each module (created MODULE_RESPONSIBILITIES.md)
- [x] Create interface documentation for module interactions (created MODULE_INTERFACES.md)
- [x] Define data flow between components (included in MODULE_INTERFACES.md)

## Phase 2: Core Architecture Refactoring

### 2.1 Chart Configuration System
- [ ] Refactor `chart_config.js` to be the single source of truth for all chart-related configuration
- [ ] Add proper JSDoc documentation to configuration schema
- [ ] Standardize configuration properties (units, formatting, display options)
- [ ] Implement validation for chart configuration
- [ ] Move any hardcoded properties from chart renderer into configuration

### 2.2 Internationalization Improvements
- [ ] Refactor translation system to eliminate hardcoded string comparisons
- [ ] Remove string lookup maps in favor of direct key references
- [ ] Create helper utilities for i18n key management
- [ ] Ensure all user-facing text uses translation keys
- [ ] Add translation validation system to catch missing keys

### 2.3 Utility Functions
- [x] Define utility module structure and interfaces (included in MODULE_INTERFACES.md)
- [x] Create a dedicated utility module `utils.js` for shared functions
- [x] Move date handling, number formatting, and other shared functionality to utilities
- [x] Implement proper error handling and validation in utility functions
- [x] Add unit tests for all utility functions

### 2.4 Code quality
- [x] Identify any unused code (included in CODE_ANALYSIS.md)
- [ ] Remove any unused code
- [ ] Ensure there is a minimal or no duplicated code
- [ ] Add JSDoc comments to utility functions

## Phase 3: Component Refactoring

### 3.1 Chart Renderer
- [ ] Simplify `chart_renderer.js` by extracting logical groups into separate modules
- [ ] Create a proper component hierarchy with clear responsibilities
- [ ] Remove any ID-based or title-based conditionals
- [ ] Implement a more declarative approach to chart creation
- [ ] Split rendering logic from data processing

### 3.2 Data Components
- [ ] Refactor `data_components.js` to focus solely on data fetching and processing
- [ ] Implement clear interfaces between data and rendering components
- [ ] Add proper caching mechanism for data
- [ ] Improve error handling for network requests

### 3.3 Chart Components
- [ ] Simplify chart component creation with factory functions
- [ ] Add proper lifecycle management for chart components
- [ ] Implement state management for chart interactions
- [ ] Create a component registry for better management

### 3.4 Header Components
- [ ] Refactor header components to use a more declarative approach
- [ ] Implement consistent event handling
- [ ] Improve interaction with charts and data system

## Phase 4: Feature-Specific Refactoring

### 4.1 Chart Statistics
- [ ] Simplify statistics calculation and display
- [ ] Implement a more uniform approach to statistics across chart types
- [ ] Move statistics format options to configuration
- [ ] Add validation for statistics values

### 4.2 Multi-Series Charts
- [ ] Refactor multi-series chart handling to be more consistent
- [ ] Implement better legend management
- [ ] Improve tooltip display for multi-series charts
- [ ] Add validation for series configuration

### 4.3 Chart Annotations
- [ ] Create a dedicated annotations module
- [ ] Refactor statistical indicators to use a declarative approach
- [ ] Implement a more flexible annotation system
- [ ] Add validation for annotation configuration

### 4.4 Responsive Design
- [ ] Refactor layout management for better responsiveness
- [ ] Simplify mobile vs. desktop logic
- [ ] Improve chart resizing logic
- [ ] Create adaptive configuration for different screen sizes

## Phase 5: Performance Improvements

### 5.1 Rendering Optimization
- [ ] Implement lazy loading for charts
- [ ] Optimize chart rendering for large datasets
- [ ] Add request batching for multiple chart data fetches
- [ ] Implement proper memoization for expensive calculations

### 5.2 Memory Management
- [ ] Add proper cleanup for disposed charts
- [ ] Implement resource pooling for shared resources
- [ ] Optimize data structures for memory efficiency
- [ ] Add memory usage monitoring in debug mode

### 5.3 Network Optimization
- [ ] Implement smarter data fetching strategy
- [ ] Ensure charts are fetched async and displayed as soon as possible
- [ ] Add request throttling and debouncing
- [ ] Optimize payload sizes
- [ ] Implement proper caching headers

## Phase 6: Testing and Documentation

### 6.1 Comprehensive Testing
- [ ] Add end-to-end tests for complete user flows
- [ ] Implement visual regression testing for charts
- [ ] Add performance benchmarks
- [ ] Implement accessibility testing

### 6.2 Documentation
- [ ] Create comprehensive API documentation
- [ ] Add architectural documentation
- [ ] Document configuration options
- [ ] Create developer guide for future maintenance
- [ ] Add inline code documentation

## Phase 7: Final Cleanup and Review

### 7.1 Code Quality
- [ ] Run code quality tools and address issues
- [ ] Check for any remaining hardcoded strings
- [ ] Ensure consistent coding style
- [ ] Validate against coding standards

### 7.2 Final Testing
- [ ] Verify all functionality works as expected
- [ ] Test on various devices and browsers
- [ ] Validate all configurations
- [ ] Perform final performance testing

## Implementation Approach

1. **Incremental changes**: Refactor the codebase incrementally to maintain functionality throughout
2. **Feature branches**: Implement each major change in a separate feature branch
3. **Test-first approach**: Write tests before implementing changes where possible
4. **Continuous validation**: Regularly test the UI to ensure functionality is preserved
5. **Documentation-driven**: Update documentation as code changes are made
6. **No premature commits**: Do not commit to git without explicit approval - production code should be manually tested before any commit
7. **Real testing**: Test files should import production code directly rather than duplicating it, and should use real data when possible
8. **Test code isolation**: Test code (HTML, CSS, JS) should only contain what's needed to run tests, not duplicated production code

## Next Steps

We have made good progress with the utility functions module and testing environment. Here are the next steps to continue the refactoring:

1. **Chart Configuration System**: Begin extraction of chart configuration logic:
   - Create a `config.js` module in `/docs/js/core/`
   - Create a schema for chart configurations
   - Add validation functions for configuration
   - Create accessor functions for chart properties
   - Add unit tests for configuration validation

2. **Core Module Implementation**:
   - Implement an event system that uses the EventEmitter from utils.js
   - Create the i18n module in `/docs/js/core/` to handle translations
   - Add tests for i18n functionality

3. **Data Module Implementation**:
   - Create a data fetcher module to handle API calls
   - Implement proper caching
   - Add data processing utilities
   - Create tests for data fetching and processing

4. **Complete Folder Structure**:
   - Create remaining directories according to the project structure
   - Set up entry points and module exports
   - Update imports in existing files

These tasks will continue building the core architecture needed for the rest of the refactoring process. We will focus on implementing one module at a time to ensure proper unit testing and validation.

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

## Success Metrics

1. **Code maintainability**: Reduced cyclomatic complexity and improved readability
2. **Performance**: Faster rendering and data processing
3. **Testability**: Comprehensive test coverage
4. **Extensibility**: Easier to add new features or chart types
5. **Internationalization**: Complete separation of code and translatable text

This plan will serve as our roadmap for the refactoring effort, being updated as we progress and discover new insights during the implementation.