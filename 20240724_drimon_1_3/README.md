# ESP32 Firmware (`20240724_drimon_1_3`)

The greenhouse-monitor firmware that runs on the ESP32 Dev Module. Wakes periodically or on button press, reads all sensors, posts to three ThingSpeak channels, sleeps.

For runtime reference (LED codes, buttons, status field decoding), see [../documentation/QUICK_REFERENCE.md](../documentation/QUICK_REFERENCE.md).

## Files

| File | Role |
|---|---|
| `20240724_drimon_1_3.ino` | Main entry: `setup()` + `loop()`, pin definitions, sensor instances, wake-reason routing |
| `3_setup.ino` | `setupPins`, `connectToWiFi` (with RTC-cached BSSID + static IP), `initDisplays`, `initSensors` |
| `5_measure.ino` | `measure()` — averaged sensor reads, `readDallas` retry helper, `status()` string builder |
| `7_display.ino` | Serial log, OLED (SSD1306), LCD (I²C 16×2) rendering |
| `8_sleep.ino` | `getSleepDuration` (light-adaptive), `enterDeepSleep` with EXT0 wake on GPIO 15 |
| `9_thingspeak.ino` | Three-channel POST (main sensors, plant/temp, system/tech) with per-channel error LED codes |
| `9_util.ino` | `calibrate_soil` — one-off soil-moisture calibration harness |
| `sensordata.h` | `SensorData` struct |
| `secrets.h` | **not committed** — WiFi credentials + ThingSpeak write API keys |

## Deep sleep + wake behavior

Between measurements the ESP32 is in deep sleep (~10 µA). Three ways to wake:

| Wake source | Enclosure control | `DISPLAY_ON` | `SHOULD_POST` | RTC preserved? |
|---|---|---|---|---|
| Timer (5–15 min, light-adaptive) | — | false | reads switch | yes |
| GPIO 15 EXT0 | 🟢 green push button (right extension, top) | true | reads switch | yes |
| EN reset | 🔵 blue push button (right extension, below green) | true | **always false** | no |

`RTC_DATA_ATTR` variables (WiFi BSSID + channel cache) survive across timer/button wakes, so subsequent WiFi connects are `WF-HIT` (fast). A full reset wipes the cache → next connect is `WF-MISS` (fresh scan).

## Build & flash

Arduino IDE + ESP32 board support (Espressif ESP32 board manager). Board: **ESP32 Dev Module**.

### Required libraries (Library Manager)

- Adafruit AHTX0
- Adafruit BME280 Library
- Adafruit SSD1306
- Adafruit VL53L0X
- BH1750
- DFRobot_MAX17043
- LCD_I2C
- OneWire
- DallasTemperature
- ThingSpeak (by MathWorks)

(ArduinoJson was previously required but was removed when `fetchMet` was retired — weather is now scraped server-side by the [MATLAB script](../matlab/README.md).)

### Secrets

Create `secrets.h` (not committed) with WiFi + ThingSpeak keys:

```cpp
#ifndef SECRETS_H
#define SECRETS_H

#define WIFI_SSID "YourSSID"
#define WIFI_PASSWORD "YourPassword"

#define THINGSPEAK_1_CHANNEL 2568299
#define THINGSPEAK_1_API "YOUR_16_CHAR_WRITE_KEY"

#define THINGSPEAK_2_CHANNEL 2584548
#define THINGSPEAK_2_API "YOUR_16_CHAR_WRITE_KEY"

#define THINGSPEAK_3_CHANNEL 2584547
#define THINGSPEAK_3_API "YOUR_16_CHAR_WRITE_KEY"

#endif
```

### macOS Sequoia / Tahoe USB serial

No external drivers needed on macOS 14.4+ — CH34x and CP210x are supported in-tree. Just plug in, pick `/dev/cu.usbserial-*` in **Tools → Port**. If it doesn't appear, try a different USB cable first (many are power-only).

### Upload troubleshooting

If upload fails with "chip stopped responding" after the baud upgrade to 921600, drop **Tools → Upload Speed** to 460800 or 230400. Cable / signal-integrity issue, not firmware.

## Configuration constants

Defined at the top of `20240724_drimon_1_3.ino`:

- Sleep durations: `SLEEP_DURATION_DUSK` (420 s), `SLEEP_DURATION_DAY` (600 s), `SLEEP_DURATION_NIGHT` (900 s)
- Light thresholds: `NIGHT_LEVEL` (5 lux), `DUSK_LEVEL` (500 lux), `SHADE_LEVEL` (12000 lux)
- `WINDOW_CLOSE` (80 mm) — TOF distance threshold for W-CLOSE status
- `BATTERY_LOW` (35 %) — threshold for B-LOW status
- `PRESSURE_LOW` / `PRESSURE_HIGH` (999 / 1010 hPa)
- `NUM_READINGS` (2) — sensor sample count per wake (averaged)
- `WIFI_MAX_RETRIES` (10) — retry count if initial connect fails
- `HEIGHT_ABOVE_SEA_LEVEL` (31 m) — for pressure compensation

## Data flow

```
ESP32 wake
  ↓
setupPins → connectToWiFi (static IP + RTC cache) → initDisplays → initSensors
  ↓
measure() — 2× averaged sensor reads, readDallas retry for DS18B20 bad values
  ↓
displayData(data) — Serial + (if DISPLAY_ON) OLED + LCD
  ↓
if (DISPLAY_ON) delay(12000)   ← human-readable pause
  ↓
if (SHOULD_POST) postThingSpeak(data)   ← writes 3 channels, status includes WF-/WT-/SD- telemetry
  ↓
enterDeepSleep(getSleepDuration(data.lux))
```

## Related docs

- [Quick Reference](../documentation/QUICK_REFERENCE.md) — LED codes, buttons, status field decoder
- [Architecture](../documentation/ARCHITECTURE.md) — data-flow diagram, per-channel field maps
- [Hardware](../documentation/HARDWARE.md) — components, power budget, Li-Ion voltage table
- [Telemetry](../documentation/TELEMETRY.md) — analyzing historical status field via ThingSpeak API
- [MATLAB scraper](../matlab/README.md) — server-side weather integration
- [Hardware solar charging debug](../documentation/HARDWARE_SOLAR_CHARGING_CHECK.md) — historical diagnosis notes
