# DriMon Direct Chart Implementation

This directory contains a new implementation of the DriMon dashboard that uses direct API calls to ThingSpeak instead of embedding iframes.

## Features

- Direct data fetching from ThingSpeak APIs
- D3.js visualization (version 7.9.0)
- Interactive charts with tooltips that always stay visible
- Responsive design
- Color-coded data categories
- Optimized rendering for dense data sets

## Files

- **index.html**: Main HTML file with updated implementation
- **d3.min_7.9.0.js**: D3.js library version 7.9.0
- **d3.css**: Styling for D3 charts
- **chart_renderer.js**: D3 chart rendering logic
- **chart_config.js**: Configuration for all charts with category-based coloring
- **new_script.js**: Main application script
- **data.js**: Data fetching and processing for summary display
- **met.js**: Met.no weather data integration

## How to Use

1. Open `/docs/new/index.html` in a browser to test locally
2. When ready to go live, you can:
   - Move all files to the main docs directory, or
   - Set up a subdirectory redirect on the server
   
## Accessing ThingSpeak APIs

The implementation uses the following ThingSpeak APIs:

- Channel data: `https://api.thingspeak.com/channels/{channel_id}/fields/{field_number}.json`
- Last value: `https://api.thingspeak.com/channels/{channel_id}/feeds/last.json`

## Data Channels

The dashboard uses data from these ThingSpeak channels:
- 2568299: Main sensor data (temperature, humidity, window, pressure, light)
- 2584548: Secondary sensor data (soil moisture, temperatures)
- 2584547: System metrics (battery, WiFi, time used)
- 2626867: External weather data