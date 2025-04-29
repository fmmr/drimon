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

The web interface uses:

- **D3.js**: For interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for both desktop and mobile
- **Vanilla JavaScript**: For DOM manipulation and data fetching
- **Moment.js**: For date handling and formatting
- **Bootstrap & Font Awesome**: For basic styling and icons

### Key Files

- `index.html`: Main entry point and layout
- `header.css`: Styling for the modern header with data chips
- `d3.css`: Chart styling
- `chart_config.js`: Configuration for all charts with row-based layout
- `chart_renderer.js`: Core chart rendering using D3.js
- `data.js`: Data fetching and processing from ThingSpeak
- `script.js`: Main application logic and UI interaction
- `met.js`: Integration with met.no weather data

### Chart Configuration

Charts are configured using a row-based layout system that automatically calculates grid positions. Each chart belongs to a specific row and the system handles responsive layout.

## Development

To preview this site locally, you can use any static file server. For example:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

## Deployment

The site is deployed via GitHub Pages at [https://drimon.rodland.no/](https://drimon.rodland.no/)