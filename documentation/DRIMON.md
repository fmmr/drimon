# DriMon - Drivhus Monitor

## Overview

DriMon is a web-based visualization platform for greenhouse monitoring data. This project displays sensor data from a network of ESP32-based monitoring systems installed in a greenhouse at Rødtangen, Norway.

The system consists of:

1. **Hardware Sensors**: ESP32-based sensors measuring:
   - Temperature (multiple locations - ambient, plants, floor)
   - Humidity
   - Air pressure
   - Light levels (external and internal)
   - Soil moisture (multiple sensors)
   - Window opening distance
   - Battery status (voltage and percentage)
   - WiFi signal strength
   - System time usage

2. **Data Storage**: [ThingSpeak](https://thingspeak.com/) channels store the time-series data from multiple sensors with organized field allocation.

3. **Web Visualization**: A responsive web interface that displays:
   - Real-time sensor readings with visual indicators
   - Interactive time-series charts with statistical analysis
   - Historical data with configurable time ranges
   - Weather integration from YR.no with forecast data
   - Astronomical data (sunrise/sunset times)

## Key Features

- **Interactive Charts**: Time-series data visualization with over 15 distinct measurements
- **Multi-Series Charts**: Combined visualization of related data (e.g., multiple temperature sensors)
- **Statistical Analysis**: Automatic calculation of min/max/average values with visual indicators
- **Cross-Chart Synchronization**: Coordinated tooltips across related chart categories
- **Weather Integration**: Real-time weather data from YR.no with icon visualization
- **Smart Date Ranges**: Customizable time periods with chart-specific defaults
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Toggleable theme with automatic system preference detection
- **Multiple Languages**: Support for Norwegian, English, and Spanish
- **Real-time Updates**: Automatic data refresh with pull-to-refresh on mobile
- **Category-Based Organization**: Mobile chart sorting by measurement type
- **Offline Capabilities**: Local caching and offline indicator

## Data Channels

DriMon data is organized across multiple ThingSpeak channels:

* **Channel 1** (Main sensors):
  * Temperature (Greenhouse ambient)
  * Humidity
  * WiFi signal strength
  * Window opening distance
  * Battery voltage
  * Battery percentage
  * Air pressure
  * Light level (ceiling)

* **Channel 2** (Plant monitoring):
  * BME280 temperature
  * AHT20 temperature
  * Soil temperature sensors (multiple locations)
  * Internal temperature
  * Soil moisture sensors (cucumber and padron plants)

* **Channel 3** (System monitoring):
  * WiFi signal strength
  * Battery voltage
  * Battery percentage
  * System processing time
  * Internal light level
  * Weather data integration

## Links

* [Live Dashboard](https://drimon.rodland.no/) - Real-time charts and data
* [ThingSpeak Channel 1](https://thingspeak.com/channels/2568299) - Main sensors
* [ThingSpeak Channel 2](https://thingspeak.com/channels/2584548) - Plant monitoring
* [ThingSpeak Channel 3](https://thingspeak.com/channels/2584547) - System monitoring
* [GitHub Repository](https://github.com/fmmr/drimon) - Source code

## Status Field Telemetry

Each ThingSpeak entry carries a `status` string, set by the ESP32 via `ThingSpeak.setStatus()` on all three channels. The status is a `_`-separated set of `PREFIX-VALUE` parts.

Example:

```
T-OK_SHADE_W-OPEN_B-OK_P-HIGH_WF-HIT_WT-388_SD-12000
```

| Prefix | Meaning | Values |
|---|---|---|
| `T-` | Temperature classification | `COLD` / `OK` / `HOT` |
| (unprefixed) | Light level | `NIGHT` / `DUSK` / `SHADE` / `SUN` |
| `W-` | Window state | `CLOSE` / `OPEN` |
| `B-` | Battery state | `OK` / `LOW` |
| `P-` | Air pressure | `LOW` / `OK` / `HIGH` |
| `WF-` | WiFi cache outcome | `HIT` / `MISS` / `FBK` / `FAIL` |
| `WT-` | WiFi connect time (ms) | integer |
| `SD-` | Display-read pause (ms) | 0 (timer wake) or 12000 (button/fresh wake) |

### Querying status history

Dedicated endpoint (only returns entries where status was set):

```
https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100
```

- `results=` caps at 8000
- `days=` defaults to 1 (24 h); increase to fetch further back
- Both parameters are ANDed — increasing one without the other still caps at the smaller window

Alternative: `feeds.json?results=8000&days=100&status=true` returns status alongside field values in one response.

### Example analysis pipelines

WiFi connect time over time:

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[] | select(.status? and (.status | test("WT-"))) | [.created_at, (.status | capture("WT-(?<t>[0-9]+)").t)] | @tsv'
```

WiFi cache-hit histogram:

```bash
curl -s 'https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100' \
  | jq -r '.feeds[].status // empty' \
  | grep -oE 'WF-[A-Z]+' \
  | sort | uniq -c
```

Window-open duration, temperature classification breakdown, etc. can be derived similarly by adjusting the prefix in the regex.

### Ideas for future analytics

- Window-open duration per day (`W-OPEN` vs `W-CLOSE` transitions)
- Time spent in each light classification (`NIGHT` / `DUSK` / `SHADE` / `SUN`)
- WiFi reliability trend (`WF-HIT` rate, `WT-` p95 over rolling windows)
- Battery-low events per day (`B-LOW` count)
- Correlation between weather pressure state (`P-*`) and other events

## Hardware Components

The sensor system in the greenhouse is based on ESP32 microcontrollers with various sensors, powered by solar energy with battery backup.

### Core Components

<table>
  <thead>
  <tr>
    <th>Component</th>
    <th>Description</th>
    <th>Protocol</th>
    <th>Links</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>ESP32 Microcontroller</td>
    <td>Dual-core MCU with WiFi and Bluetooth for sensor integration and data transmission</td>
    <td></td>
    <td><a href="https://www.espressif.com/en/products/socs/esp32">Espressif</a></td>
  </tr>
  <tr>
    <td>FIT0601 Solar Panel</td>
    <td>Monocrystalline Solar Panel (5V 1A) for power generation</td>
    <td></td>
    <td><a href="https://www.dfrobot.com/product-1774.html">Product page</a></td>
  </tr>
  <tr>
    <td>DFR0559 Battery Charger</td>
    <td>Solar Power Manager 5V for Li-ion/LiPo batteries with charge control</td>
    <td></td>
    <td><a href="https://wiki.dfrobot.com/Solar_Power_Manager_5V_SKU__DFR0559">Product wiki</a></td>
  </tr>
  <tr>
    <td>DFR0563 Battery Gauge</td>
    <td>I2C 3.7V Li Battery Fuel Gauge for accurate battery monitoring</td>
    <td>I²C</td>
    <td><a href="https://wiki.dfrobot.com/Gravity__3.7V_Li_Battery_Fuel_Gauge_SKU__DFR0563">Product wiki</a></td>
  </tr>
</tbody>
</table>

### Sensor Array

<table>
  <thead>
  <tr>
    <th>Sensor</th>
    <th>Measurement</th>
    <th>Protocol</th>
    <th>Library</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>BME280 Environmental Sensor</td>
    <td>Temperature, humidity, and barometric pressure with altitude compensation</td>
    <td>I²C</td>
    <td><a href="https://github.com/adafruit/Adafruit_BME280_Library">Adafruit BME280</a></td>
  </tr>
  <tr>
    <td>AHT20 Temperature & Humidity</td>
    <td>High-precision temperature and humidity measurements</td>
    <td>I²C</td>
    <td><a href="https://github.com/adafruit/Adafruit_AHTX0">Adafruit AHTX0</a></td>
  </tr>
  <tr>
    <td>BH1750 Light Sensors (2)</td>
    <td>Ambient light measurements (ceiling and internal)</td>
    <td>I²C</td>
    <td><a href="https://github.com/claws/BH1750">BH1750 Library</a></td>
  </tr>
  <tr>
    <td>VL53L0X Distance Sensor</td>
    <td>Time-of-Flight distance measurement for window opening</td>
    <td>I²C</td>
    <td><a href="https://github.com/pololu/vl53l0x-arduino">VL53L0X Library</a></td>
  </tr>
  <tr>
    <td>Capacitive Soil Moisture Sensors (3)</td>
    <td>Soil moisture measurements at multiple planting locations</td>
    <td>Analog</td>
    <td>ESP32 ADC with calibration</td>
  </tr>
  <tr>
    <td>DS18B20 Temperature Sensors (3)</td>
    <td>Digital temperature sensors for soil and plant monitoring</td>
    <td>1-Wire</td>
    <td><a href="https://github.com/milesburton/Arduino-Temperature-Control-Library">DallasTemperature</a></td>
  </tr>
  <tr>
    <td>OLED Display</td>
    <td>Local data display for on-site monitoring (SSD1306)</td>
    <td>I²C</td>
    <td><a href="https://github.com/adafruit/Adafruit_SSD1306">Adafruit SSD1306</a></td>
  </tr>
  <tr>
    <td>16x2 LCD Display</td>
    <td>Secondary display for key metrics</td>
    <td>I²C</td>
    <td><a href="https://github.com/johnrickman/LiquidCrystal_I2C">LiquidCrystal_I2C</a></td>
  </tr>
</tbody>
</table>

### Power Management System

The monitoring system implements sophisticated power management:

- **Solar Charging**: Primary power source with 5V solar panel
- **LiPo Battery**: 3.7V backup power with charge monitoring
- **Deep Sleep Mode**: Automatic sleep scheduling based on light conditions
  - Night mode (900s sleep): Conserves power during darkness
  - Dusk mode (420s sleep): Moderate sampling rate
  - Day mode (600s sleep): Standard monitoring frequency
- **Power Switching**: Sensor power control to minimize standby consumption
- **Battery Monitoring**: Accurate voltage and percentage tracking

### Custom PCB

Custom printed circuit boards integrate all components into a compact, weather-resistant package:

- [PCB v1.0](https://aisler.net/p/QGJVZVVV) - Initial design
- [PCB v1.1](https://aisler.net/p/GKWHNKOD) - Enhanced layout with improved sensor connectivity

## Web Interface Architecture

The web interface is built with modern, vanilla JavaScript using a component-based architecture:

### Frontend Technologies

- **Chart.js**: Interactive data visualization with statistical analysis
- **Modern HTML5/CSS3**: Semantic markup with CSS Grid and Flexbox
- **Vanilla JavaScript**: Pure JS without frameworks for optimal performance
- **Moment.js**: Comprehensive date and time handling
- **ThingSpeak API**: Data source integration with caching
- **YR.no API**: Weather data integration with proxy support for cross-browser compatibility
- **Bootstrap & Font Awesome**: Lightweight styling with icon support
- **Internationalization**: Custom i18n system with key-based translations

### Key Architecture Features

- **Component Pattern**: Modular JavaScript functions that create and return DOM elements
- **Data-View Separation**: Clear separation between data fetching and UI rendering
- **Progressive Loading**: Charts load in parallel for optimal performance
- **Cross-Chart Communication**: Data synchronization across related charts
- **Resource Pooling**: Object reuse to optimize memory consumption
- **Lifecycle Management**: Structured chart creation, update, and cleanup
- **Responsive Grid**: Dynamic layout system for all screen sizes

## Arduino Firmware

The ESP32 firmware uses a modular approach with these key features:

- **Multi-Sensor Integration**: Manages all sensors with calibration
- **Power Management**: Deep sleep scheduling based on light conditions
- **ThingSpeak Posting**: Transmits data to three separate channels
- **Local Display**: Real-time readings on OLED and LCD displays
- **Error Handling**: Robust error recovery for sensor and network issues
- **Weather Data**: Integration with YR.no API for comparative measurements

## Getting Started

To preview this site locally, you can use any static file server:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

For hardware development, the Arduino code is organized in multiple files:
- `20240724_drimon_1_3.ino`: Main entry point
- `3_setup.ino`: Initialization and configuration
- `4_met.ino`: Weather API integration
- `5_measure.ino`: Sensor measurement routines
- `7_display.ino`: Display handling
- `8_sleep.ino`: Power management
- `9_thingspeak.ino`: Data transmission
- `sensordata.h`: Data structure definitions

## Greenhouse Installation

The DriMon system was installed in a greenhouse at Rødtangen, Norway. The greenhouse structure was built during the summer of 2023, with the monitoring system installed and expanded during the summer of 2024.

## Future Plans

Future enhancements include:
- Webcam integration with image capture and time-lapse
- Automated watering system triggered by soil moisture readings
- Nutrient monitoring and control for hydroponic applications
- Additional sensors for CO₂ and air quality
- Improved predictive analytics for plant growth conditions
- Mobile app with push notifications for critical alerts

For a detailed list of planned enhancements, see [Future Enhancements](FUTURE.md).