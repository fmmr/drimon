<meta name="google-site-verification" content="FM1YRYn40sX8BMJEtySkmjXelYIegzNxT7Ig2Ma3eSE" />

# DriMon

![logo](/docs/logos/drimon.webp)

Monitoring our greenhouse at Rødtangen, Norway

This README is work-in-progress and consists of a lot of TODOs and notes.  I hope I'll get around to add content.

## Links
* [Charts and data (github)](https://drimon.rodland.no/)
* [Thingspeak Channel 1](https://thingspeak.com/channels/2568299)
* [Thingspeak Channel 2](https://thingspeak.com/channels/2584548)
* [Thingspeak Channel 3](https://thingspeak.com/channels/2584547)
* [Github page](https://github.com/fmmr/drimon)

## Building the greenhouse (Summer of 2023)
### digging
TODO: describe with pictures
### filling
TODO: describe with pictures
### assembling
TODO: describe with pictures
### water & electricity
TODO: describe with pictures
### gif of the entire process
TODO: add

## Plants (Summer of 2024)
### Tomatoes
TODO: describe
### Physalis
TODO: describe
### Chilis
TODO: describe
### Peppers (Paprika)
TODO: describe
### Eggplant (Aubergine)
TODO: describe
### Squash
TODO: describe
### Cucumber
TODO: describe
### Alcea (Hollyhock)
TODO: describe
### Urter
TODO: describe
### Pumpkin
TODO: describe


## Monitoring the greenhouse (Summer of 2024)
### custom PCB
TODO: v1 and v2 - process/price.  errors/bugs. v1.0/1.1
[v 1.0](https://aisler.net/p/QGJVZVVV)
[v 1.1](https://aisler.net/p/GKWHNKOD)
Changes I want to make: smaller. fix missing connection.  fewer I²C connections (used + 2). no 1-wire. text visible.  more JCT connectors instead of pins. 38 pin esp32?
### casing
TODO: biltema assortmentbox 
### sensors
#### List of Components
TODO: add all components
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
  <!--
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td class="tg-0pky"><ul>
		<li><a href=""></a></li>
		<li><a href=""></a></li>
	</ul></td>
    <td class="tg-0pky"><ul>
		<li><a href=""></a></li>
	</ul></td>
  </tr>
  -->
</tbody>
</table>

### esp32
TODO: many GPIOas, integrated wifi (and bluetooth)
### interfaces 
TODO: (I²C, 1-Wire, Analogue input, Digital input)
### deep sleep
TODO: striggle with mulitple buttons
### temperature
TODO: hide from sun, calculate average, soil temperature
### soil moisture sensors
TODO: tried both capacitive and resistive, struggling with good calibration
### batteries, solar panel
TODO: which batteries, how many, which solar panel
### windows
TODO: how to measure the "openess"?
### wifi, antenna
TODO: wifi 50 meter outdoor through walls.  Hacked antenna on a 30-pin
### light sensor
TODO: tried 3 different locations - ended up with hald-dome diffuser in roof top.
Typically will not measure anything below 0.5lux or higgher than ca 50000lux.
### battery gauge
hm - reverse voltage
### thingspeak
TODO: describe
### main chart page
#### iframes
TODO: describe
#### data
TODO: describe
#### met.no
TODO: describe

## Ideas and Future
### simple
TODO: add outside temperature (hm - how/where).  
### complex
ideas on actually controlling:
- watering
- nutrition
- light


## Other Links/Inspiration
TODO: add

