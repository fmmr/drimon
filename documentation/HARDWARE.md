# DriMon Hardware

Physical device — components, power, and PCB. For runtime references (LED codes, buttons, status field), see [QUICK_REFERENCE.md](QUICK_REFERENCE.md). For the WiFi mesh topology (BSSID → node-name mapping), see [MESH_NODES.md](MESH_NODES.md). For historical debug notes on a specific incident, see [HARDWARE_SOLAR_CHARGING_CHECK.md](HARDWARE_SOLAR_CHARGING_CHECK.md).

## Core Components

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
    <td>Dual-core MCU with WiFi and Bluetooth for sensor integration and data transmission (30-pin dev module)</td>
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
    <td>Solar Power Manager 5V for Li-ion/LiPo batteries with charge control (CN3065-class IC). Supplies 5V continuously on USB-OUT to the ESP32.</td>
    <td></td>
    <td><a href="https://wiki.dfrobot.com/Solar_Power_Manager_5V_SKU__DFR0559">Product wiki</a></td>
  </tr>
  <tr>
    <td>DFR0563 Battery Gauge</td>
    <td>I²C 3.7V Li Battery Fuel Gauge (MAX17043-based) for accurate battery monitoring. Wired directly to the battery (not via PCB header).</td>
    <td>I²C</td>
    <td><a href="https://wiki.dfrobot.com/Gravity__3.7V_Li_Battery_Fuel_Gauge_SKU__DFR0563">Product wiki</a></td>
  </tr>
</tbody>
</table>

## Sensor Array

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
    <td>Ambient light measurements (ceiling at 0x5C, internal at 0x23)</td>
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
    <td>Soil moisture measurements at multiple planting locations (SOIL_1_PIN=34, SOIL_2_PIN=39, SOIL_3_PIN=36)</td>
    <td>Analog</td>
    <td>ESP32 ADC with per-sensor calibration</td>
  </tr>
  <tr>
    <td>DS18B20 Temperature Sensors (3)</td>
    <td>Digital temperature sensors for soil and plant monitoring (OneWire chain on GPIO 23)</td>
    <td>1-Wire</td>
    <td><a href="https://github.com/milesburton/Arduino-Temperature-Control-Library">DallasTemperature</a></td>
  </tr>
  <tr>
    <td>OLED Display</td>
    <td>Local data display for on-site monitoring (SSD1306 128×64 at 0x3C)</td>
    <td>I²C</td>
    <td><a href="https://github.com/adafruit/Adafruit_SSD1306">Adafruit SSD1306</a></td>
  </tr>
  <tr>
    <td>16x2 LCD Display</td>
    <td>Secondary display for key metrics (I²C backpack at 0x27)</td>
    <td>I²C</td>
    <td><a href="https://github.com/johnrickman/LiquidCrystal_I2C">LiquidCrystal_I2C</a></td>
  </tr>
</tbody>
</table>

## Power Management

- **Solar Charging**: Primary power source via 5 V solar panel → DFR0559 solar input
- **Li-Ion Battery Pack**: 3.7 V nominal, **1S3P** (three 3000 mAh cells in parallel = **9000 mAh** reserve)
- **Deep Sleep Mode**: Automatic sleep scheduling based on light conditions (Night 900 s / Dusk 420 s / Day 600 s)
- **Sensor Power Switching**: `SENSOR_POWER_PIN` (GPIO 13) gates power to sensors during sleep to minimize standby draw
- **Battery Monitoring**: DFR0563 fuel gauge over I²C reads voltage + estimated %

### Power Budget

Empirically measured (from a period when solar charging was broken and the system ran on battery alone):

| Metric | Value |
|---|---|
| Battery pack capacity | ~9000 mAh @ 3.7 V (~33 Wh) |
| Standalone runtime (no charging) | ~14 days |
| Daily consumption | ~640 mAh/day |
| Average sustained current | ~27 mA (24/7) |

Where the current goes (rough breakdown):

- **DFR0559 boost converter quiescent** — on 24/7 to feed the ESP32 via USB-OUT; ~10–20 mA continuous
- **DFR0563 fuel gauge** — always connected to battery; ~50 µA
- **ESP32 deep sleep** — <10 µA between wakes
- **ESP32 wake cycles** — ~200 wakes/day × ~7 s awake × ~100 mA avg = ~40 mAh/day
  - Optimizations landed: static IP + RTC-cached BSSID/channel + polling connect wait (~1.9 s saved per wake vs pre-optimization baseline)

For solar to keep pace, the panel needs to deliver **~640 mAh/day averaged over rolling weeks**. A sunny day typically delivers 2000–3000+ mAh, so 3–4 sunny days per week is enough to break even.

### Li-Ion voltage → state of charge

Trust the voltage chart over the MAX17043 percentage — the gauge's `%` is a voltage-based estimate through Maxim's ModelGauge algorithm and gets noisy under WiFi TX load transients.

The Li-Ion discharge curve is highly non-linear (flat in the middle):

| Voltage | Approx SoC | Notes |
|---|---|---|
| 4.20 V | 100 % | Full — DFR0559 DONE LED lights (if load allows current to taper) |
| 4.16 V | ~90 % | Typical peak in field operation |
| 4.00 V | ~70–75 % | Long flat plateau in the middle |
| 3.70 V | ~25 % | Curve starts steepening downward |
| 3.30 V | 0 % | Cutoff — DFR0559 stops discharge |

So the overnight drop from 4.16 V → 4.02 V looks large but represents only ~7–8 % of real capacity (~600–700 mAh), which matches the empirical daily consumption.

## Wiring notes

- **Battery**: three cells in parallel; leads split and go directly to both the DFR0559 JST and the DFR0563 JST. The "Bat" header on the PCB is a probe/monitor point, not a required electrical node.
- **ESP32 power**: fed via a USB cable from DFR0559 **USB-A OUT** → ESP32 **micro-USB VBUS**. The legacy "Charger Vcc → ESP Vin" jumper on the PCB header is unused and can be left disconnected.
- **DS18B20 chain**: OneWire on GPIO 23; power-cycled every wake via `SENSOR_POWER_PIN` (GPIO 13). A marginal joint on any sensor in the chain can produce bit-corruption readings (`-53`, `-55`, plus the standard `85` / `-127` markers) — filtered client-side and retried at read time in firmware.

## Custom PCB

Custom printed circuit boards integrate all components into a compact, weather-resistant package:

- [PCB v1.0](https://aisler.net/p/QGJVZVVV) — Initial design
- [PCB v1.1](https://aisler.net/p/GKWHNKOD) — Enhanced layout with improved sensor connectivity
- Fritzing sources at `/Users/fmr/projects/fritzing/all_on_one_with_usb_1.3.fzz`
