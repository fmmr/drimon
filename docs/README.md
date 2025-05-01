# DriMon - Drivhus Monitor

A web-based visualization platform for greenhouse monitoring data. This project displays sensor data from a network of ESP32-based monitoring systems installed in a greenhouse.

## Architecture

The system consists of:

1. **Hardware Sensors**: ESP32-based sensors measuring:
   - Temperature (multiple locations)
   - Humidity
   - Air pressure
   - Light levels
   - Soil moisture
   - Window opening
   - Battery status

2. **Data Storage**: [ThingSpeak](https://thingspeak.com/) channels store the time-series data from the sensors.

3. **Web Visualization**: This web interface that displays:
   - Real-time sensor readings
   - Interactive time-series charts
   - Historical data analysis

## Technical Implementation

### Technologies

The web interface uses:

- **Chart.js**: For interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for both desktop and mobile
- **Vanilla JavaScript**: For DOM manipulation and data fetching
- **Moment.js**: For date handling and formatting
- **Bootstrap & Font Awesome**: For basic styling and icons

### Architecture

DriMon follows a component-based architecture for maintainability and testability:

- **Component Pattern**: Modular JavaScript functions that create and return DOM elements
- **Data-View Separation**: Clear separation between data fetching and UI rendering
- **API Abstraction**: Standardized interfaces for data sources (ThingSpeak, YR.no)
- **Event Delegation**: Centralized event handling model for interactive elements
- **Responsive Grid**: Dynamic grid-based layout system for varied screen sizes

### Key Files

- `index.html`: Main entry point and layout
- `header.css`: Styling for the modern header with data chips
- `main.css`: Main styling and chart layout
- `dark-mode.css`: Dark mode styles and theme switching

#### Component System
- `header_components.js`: Reusable UI components for the page header
- `chart_components.js`: Reusable chart and visualization components
- `data_components.js`: Data fetching and processing components
- `component_tests.js`: Testing framework for component validation

#### Application Logic
- `chart_config.js`: Configuration for all charts with row-based layout
- `chart_renderer.js`: Core chart rendering using Chart.js
- `data.js`: Data handling and sensor information processing
- `weather.js`: Weather data integration with YR.no
- `date_utils.js`: Date range handling and URL parameter parsing
- `script.js`: Main application logic and UI interaction

#### Testing
- `test_components.html`: Test harness for component testing

### Chart Configuration

Charts are configured using a row-based layout system that automatically calculates grid positions. Each chart belongs to a specific row and category, with responsive layouts for both desktop and mobile devices.

### Mobile Support

The interface includes enhanced mobile support:
- Single-column chart layout on small screens
- Category-based chart sorting (available only on mobile)
- Touch-friendly controls
- Optimized performance for mobile devices

## Development

To preview this site locally, you can use any static file server. For example:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

## Testing

DriMon implements a component-based architecture with dedicated testing tools for reliable development and maintenance. The testing system includes:

### Test Harness

A standalone test harness is provided at `test_components.html` which offers:

- **Manual Component Testing**: Visual verification of individual components
- **Automated Tests**: Programmatic verification of component functionality
- **Interactive Debugging**: Event binding tests and interactive manipulation

### Component Tests

The test suite validates various aspects of the system:

#### Header Components
- **Logo Container**: Verifies the logo and time indicator rendering
- **Data Container**: Tests sensor data chips display and formatting
- **Date Ranges**: Validates date selection controls
- **Search Container**: Tests result count controls and toggle buttons
- **Event Binding**: Verifies interactive elements respond to user input

#### Chart Components
- **Chart Container**: Tests chart creation with proper structure
- **Chart Stats**: Verifies statistics calculation and display
- **Loading Indicator**: Tests loading states and error handling
- **Date Range Functions**: Validates date range calculations

### Test Implementation

The testing architecture consists of:

- **component_tests.js**: Automated test framework with assertion functions
- **Test Runner**: JavaScript class that manages test execution and reporting
- **Visual Verification**: Manual testing capabilities with interactive UI
- **Isolated Testing**: Components can be tested individually or in groups

### Running Tests

To run the tests:

1. Start a local server as described in the Development section
2. Navigate to `/test_components.html` in your browser
3. Use the tabs to switch between test types:
   - **Manual Tests**: Click buttons to render and test individual components
   - **Automated Tests**: Run full test suites with detailed reporting
   - **Chart Tests**: Test chart-specific components and functionality

### Test Mode

DriMon includes a comprehensive test mode with debug tools. To activate:

1. Append `?test=true` to any DriMon URL (e.g., `https://drimon.rodland.no/?test=true`)
2. Optional: Set log level with `&logLevel=verbose` (options: `info`, `debug`, `verbose`)

Test Mode Features:

#### Enhanced Logging
- Timestamped console output with elapsed time tracking
- Log level filtering (info, debug, verbose)
- Internal event tracking for diagnostics

#### Debug Panel
- Access via the 🔍 button in the bottom right corner
- View recent events, errors, and log messages
- Monitor and inspect network requests in real-time
- Track component rendering performance

#### Network Monitoring
- All API calls are automatically logged and can be inspected
- Response data and timing information available
- Error tracking for failed requests

#### Component Tracking
- Performance metrics for all rendered components
- Render time measurement
- Component hierarchy visualization

#### Usage Examples

```
# Basic test mode
https://drimon.rodland.no/?test=true

# Test mode with verbose logging
https://drimon.rodland.no/?test=true&logLevel=verbose

# Test mode with debug level logging
https://drimon.rodland.no/?test=true&logLevel=debug
```

The debug panel provides an interactive interface for exploring the application's inner workings without affecting production functionality.

## Deployment

The site is deployed via GitHub Pages at [https://drimon.rodland.no/](https://drimon.rodland.no/)