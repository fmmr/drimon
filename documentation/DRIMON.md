# DriMon - Drivhus Monitor

Monitoring our greenhouse at Rødtangen, Norway

## Overview

DriMon is a web-based visualization platform for greenhouse monitoring data. This project displays sensor data from a network of ESP32-based monitoring systems installed in a greenhouse.

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

## Links
* [Main site - Charts and Data](https://drimon.rodland.no/)
* [Thingspeak Channel 1](https://thingspeak.com/channels/2568299)
* [Thingspeak Channel 2](https://thingspeak.com/channels/2584548)
* [Thingspeak Channel 3](https://thingspeak.com/channels/2584547)
* [Github page](https://github.com/fmmr/drimon)

## Project Components

### Hardware Components (ESP32)
The sensor system in the greenhouse is based on ESP32 microcontrollers with various sensors.

#### List of Components
<table>
	<thead>
  <tr>
    <th>SKU/ID</th>
    <th>Component</th>
    <th>Description</th>
    <th>Protocol</th>
    <th>Links</th>
    <th>Buy</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td class="tg-0lax">ESP32</td>
    <td class="tg-0pky">Microcontroller</td>
    <td class="tg-0pky">A feature-rich MCU with integrated Wi-Fi and Bluetooth connectivity for a wide-range of applications.</td>
    <td class="tg-0pky"></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://en.wikipedia.org/wiki/ESP32">Wikipedia</a></li>
		<li><a href="https://www.espressif.com/en/products/socs/esp32">Espressif</a></li>
	</ul></td>
    <td class="tg-0pky"><ul><li><a href="https://www.aliexpress.com/item/1005006422498371.html">AliExpress</a></td>
  </tr>
  <tr>
    <td>FIT0601</td>
    <td>Solar Panel</td>
    <td>Monocrystalline Solar Panel (5V 1A)</td>
    <td></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1774.html">Product page</a></li>
	</ul></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1774.html">DFRobot</a></li>
	</ul></td>
  </tr>
  <tr>
    <td>DFR0559</td>
    <td>Battery Charger</td>
    <td>Solar Power Manager 5V</td>
    <td>Charges Li-ion/LiPo batteries</td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1712.html">Product page</a></li>
		<li><a href="https://wiki.dfrobot.com/Solar_Power_Manager_5V_SKU__DFR0559">Product wiki</a></li>
	</ul></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1712.html">DFRobot</a></li>
	</ul></td>
  </tr>
  <tr>
    <td>DFR0563</td>
    <td>Battery Gauge</td>
    <td>Gravity: I2C 3.7V Li Battery Fuel Gauge</td>
    <td>Measures voltage and remaining percentage of battery.  Also includes low battery power alert interrupt (not used).</td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1734.html">Product page</a></li>
		<li><a href="https://wiki.dfrobot.com/Gravity__3.7V_Li_Battery_Fuel_Gauge_SKU__DFR0563">Product wiki</a></li>
	</ul></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.dfrobot.com/product-1734.html">DFRobot</a></li>
	</ul></td>
  </tr>
  <tr>
    <td class="tg-0lax">BH1750</td>
    <td class="tg-0pky">Lightsensor</td>
    <td class="tg-0pky">Measures ambient light in lux.</td>
    <td class="tg-0pky">I²C</td>
    <td class="tg-0pky"><ul>
		<li><a href="https://github.com/claws/BH1750">Arduino Library</a></li>
		<li><a href="https://randomnerdtutorials.com/esp32-bh1750-ambient-light-sensor/">Random Nerd Tutorials</a></li>
	</ul></td>
    <td class="tg-0pky"><ul><li><a href="https://www.aliexpress.com/item/1005006794832418.html">AliExpress</a></td>
  </tr>
  <tr>
    <td>VL53L0X </td>
    <td>Time of Flight Distance Sensor</td>
    <td>Measures distance in mm.</td>
    <td class="tg-0pky">I²C</td>
    <td class="tg-0pky"><ul>
		<li><a href="https://github.com/pololu/vl53l0x-arduino">Arduino Library</a></li>
		<li><a href="https://www.electronicwings.com/esp32/vl53l0x-sensor-interfacing-with-esp32">Electronic Wings</a></li>
		<li><a href="https://www.instructables.com/VL53L0X-Laser-Ranging-Sensor-Test/">Instructables</a></li>
	</ul></td>
    <td class="tg-0pky"><ul>
		<li><a href="https://www.aliexpress.com/item/1005006177829793.html">AliExpress</a></li>
	</ul></td>
  </tr>
</tbody>
</table>

### Custom PCB
- [v 1.0](https://aisler.net/p/QGJVZVVV)
- [v 1.1](https://aisler.net/p/GKWHNKOD)

### Web Interface

The web interface uses:

- **Chart.js**: For interactive data visualization and charts
- **Modern HTML/CSS**: Responsive design optimized for both desktop and mobile
- **Vanilla JavaScript**: For DOM manipulation and data fetching
- **Moment.js**: For date handling and formatting
- **Bootstrap & Font Awesome**: For basic styling and icons
- **Internationalization (i18n)**: Multi-language support (Norwegian, English, Spanish)

#### Features

- **Interactive Charts**: Time-series data visualization with pan and zoom
- **Statistical Analysis**: Automatic calculation of min/max/average values
- **Weather Integration**: Real-time weather data from YR.no
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark Mode**: Toggleable light/dark theme
- **Multiple Languages**: Support for Norwegian, English, and Spanish

## Getting Started

To preview this site locally, you can use any static file server. For example:

```bash
# Using Python
python -m http.server

# Or using Node.js
npx serve
```

## Greenhouse Installation

The DriMon system was installed in our greenhouse at Rødtangen, Norway, built during the summer of 2023. The monitoring system was installed during the summer of 2024.

### Future Plans

Future enhancements include:
- Automated watering system
- Nutrient monitoring and control
- Additional sensors for soil and air quality
- Improved predictive analytics for plant growth