# DriMon
Monitoring our greenhouse at Rødtangen, Norway

This README is work-in-progress and consists of a lot of TODOs and notes.  I hope I'll get around to add content.

## Links
* [Main site with charts and data](https://rodland.no/drimon/)
* [Thingspeak Channel 1](https://thingspeak.com/channels/2568299)
* [Thingspeak Channel 2](https://thingspeak.com/channels/2584548)
* [Thingspeak Channel 3](https://thingspeak.com/channels/2584547)
* [Github page](https://github.com/fmmr/drivhus)

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
TODO: v1 and v2 - process/price.  errors/bugs
### casing
TODO: biltema assormtebox 
### sensors
#### List of sensors
TODO: add all components
<table>
	<thead>
  <tr>
    <th>ID</th>
    <th>Component</th>
    <th>Description</th>
    <th>Protocol</th>
    <th>Links</th>
    <th>Buy</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td class="tg-0lax">BH1750</td>
    <td class="tg-0pky">Lightsensor</td>
    <td class="tg-0pky">Measures ambient light in lux</td>
    <td class="tg-0pky">I²C</td>
    <td class="tg-0pky"><ul>
		<li><a href="https://github.com/claws/BH1750">Arduino Library</a></li>
		<li><a href="https://randomnerdtutorials.com/esp32-bh1750-ambient-light-sensor/">Random Nerd Tutorials</a>
	</ul></td>
    <td class="tg-0pky"><ul><li><a href="https://www.aliexpress.com/item/1005006794832418.html">AliExpress</a></td>
  </tr>
  <!--
  <tr>
    <td></td>
    <td></td>
    <td></td>
    <td></td>
    <td class="tg-0pky"><ul>
		<li><a href=""></a></li>
		<li><a href=""></a>
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
### Thingspeak
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
