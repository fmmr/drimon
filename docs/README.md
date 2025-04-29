# DriMon Website and ESP32 Updates

## Website Update
The updated version of the website is available in the following files:
- `new_index.html` - Updated HTML structure using direct D3.js charts
- `chart_config.js` - Configuration for all charts
- `chart_renderer.js` - D3.js chart rendering functions
- `new_script.js` - Main script for the updated website

To use the new version:
1. Test it locally by opening `new_index.html` in a browser
2. Once verified, rename the files (removing 'new_' prefix) to replace the iframe-based implementation

## ESP32 Display Improvements
An improved display layout is available in `7_display_improved.ino` with the following changes:
- Clearer labeling of all sensor readings
- Visual battery level indicator on OLED
- Multiple display pages to show more information
- Human-readable status indicators (e.g., "CLOSED/OPEN" for window, "NIGHT/DUSK/SHADE/SUNNY" for light)
- Better organized serial output for debugging

To use the improved display:
1. Rename `7_display_improved.ino` to `7_display.ino` (after backing up the original)
2. Upload the code to your ESP32 when available

## ThingSpeak Channels
The website uses data from the following ThingSpeak channels:
- 2568299: Main sensor data (temperature, humidity, window, pressure, light)
- 2584548: Secondary sensor data (soil moisture, temperatures)
- 2584547: System metrics (battery, WiFi, time used)
- 2626867: External weather data