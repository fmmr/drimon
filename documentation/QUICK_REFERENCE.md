# DriMon Quick Reference

Print-friendly single page. Stick a copy on/near the enclosure.

## Enclosure layout (front view)

```
┌──────────┬─────────────────────────────────────────────────┬──────────┐
│ Rocker   │  LEDs   AHT temp/hum      LCD           OLED    │  🟢 Green │
│ switch   │  ↑↑↑    (white grid)    (16×2 blue)   (black)   │  ────── │
│  I/O     │                                                  │  🔵 Blue  │
└──────────┴─────────────────────────────────────────────────┴──────────┘
   ↑                                                              ↑
 post-enable                                              wake / reset
```

- **Far left extension**: black rocker switch (post-enable)
- **Main enclosure, left of center**: small LEDs + white AHT temperature/humidity sensor
- **Main enclosure, center**: 16×2 LCD (blue backlight)
- **Main enclosure, right of center**: OLED (128×64 monochrome)
- **Right extension**: two round push buttons stacked — green on top, blue below

## LED codes

Small LEDs on the **left of the enclosure**, between the rocker switch and the white AHT sensor.

| Signal | Meaning |
|---|---|
| 🟢 Green — 2 flashes at boot | Just booted, running setup |
| 🟢 Green — 2 flashes + 2 beeps | Cycle complete, going to sleep |
| 🔵 Blue — solid ON | Posting to ThingSpeak (2–3 s) |
| 🔴 Red — 3 flashes | Display init failed **OR** ThingSpeak Channel 2 write failed ⚠ |
| 🔴 Red — 4 flashes | WiFi connect failed **OR** ThingSpeak Channel 3 write failed ⚠ |
| 🔴 Red — 2 flashes | ThingSpeak Channel 1 write failed |

⚠ The red 3- and 4-flash codes overlap between init failures and post failures — context (are we early in boot or after "Posting..." was logged) tells you which. Deconflicting is on the FUTURE list.

## Buttons

Physical controls on the enclosure:

| Location | Control | Wired to | Effect |
|---|---|---|---|
| Right extension, **top** | 🟢 **Green push button** | GPIO 15 (EXT0) | **Wake** from deep sleep. Soft — preserves RTC memory (WiFi cache intact). Forces display on, triggers a measurement + post cycle. |
| Right extension, **below green** | 🔵 **Blue push button** | ESP32 EN pin | **Hardware reset**. Full cold boot. Wipes RTC → next WiFi connect is a `WF-MISS` fresh scan. Same effect as pressing EN on the dev board itself. |
| Left extension | ⚫ **Black rocker switch** (I/O) | GPIO 27 | Read at every wake. **I (down / LOW)** = post to ThingSpeak. **O (up / HIGH)** = skip posting (use during bench debugging). |

## Status field decoder

Every ThingSpeak entry carries a `status` string like:

```
T-OK_SHADE_W-OPEN_B-OK_P-HIGH_WF-HIT_WT-388_SD-0
```

Underscore-separated `PREFIX-VALUE` parts:

| Prefix | Meaning | Values |
|---|---|---|
| `T-` | Temperature classification | `COLD` (<14 °C) / `OK` / `HOT` (>40 °C) |
| (no prefix) | Light level | `NIGHT` / `DUSK` / `SHADE` / `SUN` |
| `W-` | Window state | `CLOSE` (distance <80 mm) / `OPEN` |
| `B-` | Battery state | `OK` / `LOW` (<35 %) |
| `P-` | Air pressure | `LOW` (<999) / `OK` / `HIGH` (>1010) hPa |
| `WF-` | WiFi cache outcome | `HIT` (cache used, connected first try) / `MISS` (no cache, fresh scan) / `FBK` (cache failed, fell back) / `FAIL` |
| `WT-` | WiFi connect time | integer, milliseconds |
| `SD-` | Display-read pause | `0` (timer wake, no delay) or `12000` (button/fresh wake, 12 s pause) |

**Read the status from ThingSpeak** (any of the 3 channels works — same status on all):

- **Latest status only**: <https://api.thingspeak.com/channels/2568299/status.json?results=1>
- **Recent 10 statuses**: <https://api.thingspeak.com/channels/2568299/status.json?results=10>
- **Last ~day**: <https://api.thingspeak.com/channels/2568299/status.json?results=1000>
- **Last ~100 days**: <https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100>
- **Latest entry with all fields + status**: <https://api.thingspeak.com/channels/2568299/feeds.json?results=1&status=true>

For jq/curl analysis pipelines (WT-time trend, WF-cache histogram, etc.), see [TELEMETRY.md](TELEMETRY.md).

## Wake reasons — behavior at a glance

| Wake type | `DISPLAY_ON` | `SHOULD_POST` | 12 s display pause? |
|---|---|---|---|
| Fresh boot (flash / reset / power) | true | **always false** | yes |
| Timer wake (normal field cycle) | false | reads switch | no |
| Green button (EXT0 wake) | true | reads switch | yes |

## Common quick checks

- **"Is it charging?"** → check the DFR0559's charge LED (red = charging, green DONE = full). Or the battery voltage chart trend on <https://drimon.rodland.no/>.
- **"Why didn't it post?"** → post-enable switch may be HIGH. On fresh boot after flash, posting is always skipped.
- **"Which WiFi did it join?"** → status field contains `WF-` outcome and `WT-` connect time; historical values queryable at `https://api.thingspeak.com/channels/2568299/status.json?results=1000&days=100`.
- **"Cell temperature reads 85 °C, -55 °C, or -127 °C"** → DS18B20 bogus values (power-on default / bit corruption / disconnect). Filtered on the site; firmware retries at read time. If persistent, resolder the affected wire.
