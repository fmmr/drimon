# DriMon Architecture

How the pieces of DriMon connect. This is the "big picture" — for details, follow the links at each step.

## Overview

```
  ┌────────────────┐        ┌──────────────────┐
  │  ESP32 in the  │        │   MET.no API     │
  │   greenhouse   │        │  (nowcast, UV)   │
  │   (firmware)   │        └────────┬─────────┘
  └───┬──────┬─────┘                 │ (polled server-side)
      │      │                       │
      │      │ WiFi POST             │
      │      │ (3 channels)          │
      ▼      ▼                       ▼
  ┌───────────────────────────────────────────┐
  │              ThingSpeak cloud              │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
  │  │ Ch 2568  │ │ Ch 2584  │ │ Ch 2584  │   │
  │  │  Main    │ │  Plant   │ │  Tech    │   │
  │  │ sensors  │ │  temps   │ │/system   │   │
  │  └────┬─────┘ └──────────┘ └──────────┘   │
  │       │                                    │
  │       │ React trigger fires MATLAB Analysis│
  │       ▼                                    │
  │   ┌──────────────────────────────────┐    │
  │   │  MATLAB scraper (met.matlab)     │    │
  │   │  Reads Ch 2568 + fetches MET     │    │
  │   │  Writes to Ch 2626                │    │
  │   └────────────┬─────────────────────┘    │
  │                ▼                            │
  │           ┌──────────┐                     │
  │           │ Ch 2626  │                     │
  │           │  Ext     │                     │
  │           │ weather  │                     │
  │           └────┬─────┘                     │
  └────────────────┼───────────────────────────┘
                   │
                   │ HTTPS GET (feeds.json / status.json)
                   ▼
      ┌──────────────────────────────┐
      │      Web dashboard           │
      │  drimon.rodland.no           │
      │  (docs/ — Chart.js SPA)      │
      └──────────────────────────────┘
                   ▲
                   │
      ┌──────────────────────────────┐
      │  Pi kiosk (touchscreen)      │
      │  Auto-loads dashboard        │
      │  (pi-kiosk/)                 │
      └──────────────────────────────┘
```

## The moving parts

### 1. ESP32 firmware (`20240724_drimon_1_3/`)

Wakes every 5–15 minutes (light-adaptive) or on button press. Reads all sensors, connects to WiFi (RTC-cached BSSID → typically <500 ms), posts to **three** ThingSpeak channels.

**Ch 2568299** (`DRIMON_CHANNEL`, "Main sensors")

| Field | Value |
|---|---|
| 1 | temperature (aggregate) |
| 2 | humidity (aggregate) |
| 3 | RSSI |
| 4 | distance (window opening) |
| 5 | battery voltage |
| 6 | battery percentage |
| 7 | pressure |
| 8 | lux (ceiling) |

**Ch 2584548** (`TEMP_CHANNEL`, "Plant monitoring")

| Field | Value |
|---|---|
| 1 | BME280 temperature |
| 2 | AHT20 temperature |
| 3 | DS18B20 termo1 (closest, "cucumber") |
| 4 | DS18B20 termo2 (middle, "floor") |
| 5 | DS18B20 termo3 (farthest, "padron") |
| 6 | soil1 |
| 7 | soil2 |
| 8 | soil3 |

**Ch 2584547** (`TECH_CHANNEL`, "System")

| Field | Value |
|---|---|
| 1 | RSSI |
| 2 | battery voltage |
| 3 | battery percentage |
| 4 | timeUsed (wake duration, ms) |
| 5 | lux_int (internal light) |
| 6-8 | unused (previously met data — removed when `fetchMet` was retired in favor of MATLAB scraper) |

Each entry also carries a **status string** with runtime telemetry — see [QUICK_REFERENCE.md](QUICK_REFERENCE.md#status-field-decoder) for the format.

Then deep sleeps. Full details: [`20240724_drimon_1_3/README.md`](../20240724_drimon_1_3/README.md).

### 2. MATLAB scraper (`matlab/`)

Server-side script that runs inside ThingSpeak's MATLAB Analysis service, triggered by a React condition on channel 2568299 (fires whenever the ESP32 posts).

- Reads greenhouse temp+humidity from Ch 2568299
- Fetches nowcast weather from MET Norway for the greenhouse coordinates
- Computes greenhouse-vs-outdoor diffs
- Writes 8 fields (met temp/hum, diffs, wind, precipitation, UV, temp) to **Ch 2626867** (`EXT_CHANNEL`, "External weather")

Two ThingSpeak accounts involved: the trigger/analysis account (owns Ch 2568/2584/2584) and the write-target account (owns Ch 2626). Details: [`matlab/README.md`](../matlab/README.md).

### 3. Web dashboard (`docs/`)

Vanilla-JS SPA served as GitHub Pages from `docs/`. Reads all four ThingSpeak channels via `feeds.json` (data) and `status.json` (runtime telemetry). Chart.js renders time-series with statistical markers, cross-chart tooltips, light/dark theme, and Norwegian/English/Spanish translations.

URL-param-driven. Full param reference: [`URL_PARAMS.md`](URL_PARAMS.md). Component-level details: [`docs/README.md`](../docs/README.md).

### 4. Pi kiosk (`pi-kiosk/`)

Optional touchscreen Raspberry Pi showing the dashboard fullscreen. Auto-login, tab cycling between DriMon and yr.no weather, idle detection, screen-blank + touch-resume. Full setup: [`pi-kiosk/README.md`](../pi-kiosk/README.md).

## Data flow for one wake cycle

1. **T=0** — ESP32 wakes (timer, button, or fresh boot)
2. **T≈0.2s** — Setup complete, WiFi.begin() called with cached BSSID/channel (from RTC memory) + static IP
3. **T≈0.5s** — WiFi connected (`WF-HIT`, `WT-388ms` typical)
4. **T≈1s** — Sensor init done (BME, AHT, BH1750×2, VL53L0X, DS18B20 chain, MAX17043)
5. **T≈4s** — Measurements complete (2× averaged reads + 10× TOF distance samples)
6. **T≈4.5s** — Display + serial output
7. **T≈5s** — ThingSpeak POST × 3 channels (each ~1s)
8. **T≈7s** — `enterDeepSleep(sleepDuration)` — ESP32 back to sleep

MATLAB scraper wakes asynchronously moments later (React trigger), reads Ch 2568299, fetches MET, writes Ch 2626867.

Web dashboard sees new data on next page refresh or auto-refresh interval (~90s).

## Where things fail (and how you see it)

| Failure | Symptom | Where to look |
|---|---|---|
| WiFi down | `WT-` values climb into retry range (>3000ms), `WF-FBK` or `WF-FAIL` in status | ThingSpeak status.json history |
| One ThingSpeak channel rejects | Red-LED N flashes (see [QUICK_REFERENCE](QUICK_REFERENCE.md)); missing data on that channel's charts | Dashboard for that channel |
| DS18B20 corruption | Chart shows `-53`/`-55`/`85`/`-127` — filtered on dashboard, but check firmware retry logic worked | Site `chart-sensors-temp` (raw) vs `chart-plants-temp` (filtered) |
| Solar not charging | Battery voltage trend drops without daily recovery | `chart-battery` on dashboard; multimeter at panel/DFR0559 in the greenhouse |
| MET API changes shape | Wind values become 0–360 (direction) or other nonsense in the weather chart | MATLAB script's positional `urlfilter` — see [`matlab/README.md`](../matlab/README.md) fragility note |
| Firmware hang | ESP32 stops posting; battery drains slowly | Green button (soft wake) → if unresponsive, EN reset (physical access needed) |
