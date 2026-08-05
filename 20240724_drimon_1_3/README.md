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
| `version.h` | Placeholder `FIRMWARE_VERSION` — overwritten locally by `gen_version.sh` (via `--skip-worktree`) so the running binary carries the git commit hash |
| `gen_version.sh` | Regenerates `version.h` from `git rev-parse --short HEAD` (adds `+` if working tree is dirty) |
| `hooks/post-commit` | Reference git hook — symlink into `.git/hooks/` to auto-refresh `version.h` after every commit |
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

### Firmware version tracking

The status field embeds the git commit hash of the running firmware as the `V-` token (e.g. `V-cbb0aad`, or `V-cbb0aad+` if compiled from a dirty tree). This lets the status page (`docs/status.html`) show exactly which commit is on the ESP32.

**One-time setup per clone:**

```bash
cd ~/projects/drimon

# Tell git to ignore local modifications to version.h (it's committed as a placeholder)
git update-index --skip-worktree 20240724_drimon_1_3/version.h

# Install the post-commit hook — regenerates version.h after every commit
ln -sf ../../20240724_drimon_1_3/hooks/post-commit .git/hooks/post-commit

# Bootstrap version.h with the current HEAD hash
cd 20240724_drimon_1_3
./gen_version.sh
```

After that, the workflow is: edit → `git commit` → post-commit hook regenerates `version.h` → flash. The ESP32 reports `V-<hash>` on every status.

**If you see `V-template` on the running firmware**, `gen_version.sh` has never been run — run it manually. `V-unknown` means `version.h` is corrupted or missing. `V-<hash>+` means uncommitted local changes were compiled in.

**To undo the skip-worktree** (rare — mostly useful when re-installing hooks): `git update-index --no-skip-worktree 20240724_drimon_1_3/version.h`.

### macOS Sequoia / Tahoe USB serial

No external drivers needed on macOS 14.4+ — CH34x and CP210x are supported in-tree. Just plug in, pick `/dev/cu.usbserial-*` in **Tools → Port**. If it doesn't appear, try a different USB cable first (many are power-only).

### Upload troubleshooting

If upload fails with "chip stopped responding" after the baud upgrade to 921600, drop **Tools → Upload Speed** to 460800 or 230400. Cable / signal-integrity issue, not firmware.

## Configuration constants

All defined at the top of `20240724_drimon_1_3.ino`, grouped by section (GPIO pins, LED codes, environmental thresholds, WiFi behaviour, static IP, ThingSpeak posting, serial, sensor plausibility, measurement loop, display, sleep durations). Each has an inline comment explaining what it controls. Tunable knobs worth knowing about:

- **Sleep intervals & snapping** — `SLEEP_INTERVAL_DUSK_MIN` (5), `SLEEP_INTERVAL_DAY_MIN` (10), `SLEEP_INTERVAL_NIGHT_MIN` (20). `getSleepDuration()` snaps to the next round wall-clock boundary via NTP-set RTC. Off-season multiplier `SEASON_MULT_OFFSEASON` (3) triples all intervals during 11 Sep – 9 Apr.
- **Temperature classification** — `TEMP_COLD` (5 °C) and `TEMP_HOT` (35 °C) match `heat-frost.html`'s defaults.
- **WiFi resilience** — `WIFI_MAX_RETRIES`, `WIFI_FAILS_BEFORE_FRESH_SCAN`, `WIFI_INITIAL_TIMEOUT_MS`, `WIFI_POLL_INTERVAL_MS`, `WIFI_RETRY_DELAY_MS`.
- **Static WiFi config** — `WIFI_STATIC_IP`, `WIFI_GATEWAY`, `WIFI_SUBNET`, `WIFI_DNS` (4 comma-separated octets each, consumed by `IPAddress()`).
- **ThingSpeak** — `THINGSPEAK_INTER_POST_MS` (delay between the 3 channel POSTs), `POST_FLASH_ON_MS` (per-channel result-LED on-duration).
- **NTP** — synced every wake to cancel the ESP32's internal RC-oscillator drift (~1-2% per sleep). Non-blocking, ~144 bytes UDP + sub-second WiFi radio time per wake.
- **Sensor plausibility** — `DALLAS_MIN_C`/`MAX_C`/`RETRIES`, `TOF_MAX_MM`/`INTERVAL_MS`, `TERMO2_INCLUDE_MIN_C`/`MAX_C`.

## Data flow

```
ESP32 wake
  ↓
setupPins → connectToWiFi (static IP + RTC cache + NTP sync if needed) → initDisplays → initSensors
  ↓
measure() — 2× averaged sensor reads, readDallas retry for DS18B20 bad values,
            builds status string (T-/light/W-/B-/P-/WF-/BS-/WT-/FC-/PF-/BV-/TU-/LR-/V-/SD-)
  ↓
displayData(data) — Serial + (if DISPLAY_ON) OLED + LCD
  ↓
if (SHOULD_POST) postThingSpeak(data)   ← writes 3 channels sequentially with client.stop() between,
                                            green/red LEDs flash the per-channel result immediately
  ↓
if (DISPLAY_ON) delay(DISPLAY_TIME)     ← human-readable pause AFTER post so LED feedback lands fast
  ↓
enterDeepSleep(getSleepDuration(data.lux))   ← snaps to :00/:10/:20 (day), :00/:05 (dusk), :00/:15/:30/:45 (night)
```

## Related docs

- [Quick Reference](../documentation/QUICK_REFERENCE.md) — LED codes, buttons, status field decoder
- [Architecture](../documentation/ARCHITECTURE.md) — data-flow diagram, per-channel field maps
- [Hardware](../documentation/HARDWARE.md) — components, power budget, Li-Ion voltage table
- [Telemetry](../documentation/TELEMETRY.md) — analyzing historical status field via ThingSpeak API
- [MATLAB scraper](../matlab/README.md) — server-side weather integration
- [Hardware solar charging debug](../documentation/HARDWARE_SOLAR_CHARGING_CHECK.md) — historical diagnosis notes
