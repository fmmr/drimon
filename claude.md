# Drimon Project

Greenhouse monitoring system for Rødtangen, Norway. ESP32 posts sensor data every 5–15 min to ThingSpeak; a MATLAB scraper adds MET.no weather; a static webapp on GitHub Pages renders it all.

Live site: <https://drimon.rodland.no/>

## Communication Rules
Always call me BOSS when chatting with me — but never in code.

## Repo layout

| Path | What it is |
|---|---|
| `20240724_drimon_1_3/` | ESP32 firmware (Arduino IDE, ESP32 Dev Module) |
| `docs/` | Web dashboard, served as GitHub Pages (`drimon.rodland.no`) |
| `matlab/` | Snapshot of the ThingSpeak MATLAB Analysis scraper (runs server-side, not locally) — ignore unless the scraper is explicitly the task |
| `pi-kiosk/` | Raspberry Pi kiosk install (fullscreen dashboard on touchscreen) |
| `documentation/` | Cross-cutting reference docs (architecture, hardware, telemetry, URL params, etc.) |
| `sketches_scratchpad/` | Arduino sandbox — ignore unless told otherwise |
| `coderules.md` | Coding standards — always follow |
| `README.md` | Public project readme |

## Data flow (one wake cycle)

```
ESP32 wake → WiFi (RTC-cached BSSID) → measure 2× → post 3 ThingSpeak channels → deep sleep
                                                            ↓
                                               React trigger → MATLAB scraper
                                                            ↓
                                               MET.no nowcast → Ch 2626867 (external weather)
                                                            ↓
                                                       Webapp fetches all 4 channels
```

## ThingSpeak channels

| ID | Const in webapp | Contents | Written by |
|---|---|---|---|
| 2568299 | `DRIMON_CHANNEL` | temp, hum, RSSI, distance (window), battery V/%, pressure, lux | ESP32 |
| 2584548 | `TEMP_CHANNEL` | BME/AHT temp, 3× DS18B20, 3× soil moisture (⚠ hardware broken — readings unreliable, don't build features on them until sensors are fixed) | ESP32 |
| 2584547 | `TECH_CHANNEL` | RSSI, battery V/%, wake time (ms), internal lux | ESP32 |
| 2626867 | `EXT_CHANNEL` | MET temp/hum, temp/hum diffs, wind, precip, UV | MATLAB scraper |

Field maps: `documentation/ARCHITECTURE.md`.

## Firmware map (`20240724_drimon_1_3/`)

| File | Role |
|---|---|
| `20240724_drimon_1_3.ino` | Entry, `setup()`/`loop()`, pin defs, wake-reason routing, config constants |
| `3_setup.ino` | `setupPins`, `connectToWiFi`, `initDisplays`, `initSensors` |
| `5_measure.ino` | `measure()`, `readDallas` retry, `status()` string builder |
| `7_display.ino` | Serial log + OLED (SSD1306) + LCD (I²C 16×2) |
| `8_sleep.ino` | `getSleepDuration` (light-adaptive), `enterDeepSleep` (EXT0 wake on GPIO 15) |
| `9_thingspeak.ino` | 3-channel POST with per-channel LED error codes |
| `9_util.ino` | `calibrate_soil` harness |
| `sensordata.h` | `SensorData` struct |
| `secrets.h` | **NOT committed** — WiFi + ThingSpeak keys |

Wake sources: timer (5/10/20 min in-season light-adaptive, snapped to round wall-clock boundaries via NTP: :00/:10/:20 day, :00/:05/:10 dusk, :00/:20/:40 night). Off-season (outside 10 Apr – 10 Sep, `SEASON_MULT_OFFSEASON = 3`) triples the intervals to conserve battery when solar is weak: :00/:30 day, :00/:15/:30/:45 dusk, :00 hourly night. Green button (GPIO 15 EXT0) preserves RTC cache. Blue button (EN reset) wipes RTC → `WF-MISS` and one un-snapped wake until NTP re-syncs. Fresh boots (cold reset from any cause) also POST — the `WR-` token exposes the exact reset reason.

## Webapp map (`docs/`)

Vanilla-JS SPA + Chart.js. No build step — static files served from `docs/` via GitHub Pages. Local dev: `python -m http.server 8000` from `docs/`.

Entry: `index.html` → `js/app.js`. All script tags are wired in `index.html` and load order matters.

**Extra pages** (standalone, only need moment.js; each has footer links to the others):

- `windows.html` — per-day window opening summary with inferred weather (☀️⛅☁️🌧️). Files: `js/windows.js` + `css/windows.css`. URL params: `days`, `threshold`, `minEvents`, `lowMax`, `rainyMax`.
- `calendar.html` — GitHub-style heatmap of daily medians for window / temp / lux / wind, with gap collapsing. Files: `js/calendar.js` + `css/calendar.css`. URL params: `days`, `gapWeeks`.
- `heat-frost.html` — critical-temperature log: nights near freezing and days over the heat threshold, with outdoor temp for context. Files: `js/heat-frost.js` + `css/heat-frost.css`. URL params: `days` (1–400, default 90), `frost` (°C), `heat` (°C), `all`, `agg` (`raw`/`timescale`/`median`, default `raw`). Raw preserves sub-hour spikes (a real 50 °C peak becomes 40 °C under `median=60`); use `timescale`/`median` only for comparison.
- `status.html` — parses the ThingSpeak `status` field (`WF-`, `BS-`, `WT-`, `FC-`, `T-`, `W-`, `B-`, `P-`, light token) plus TECH_CHANNEL fields 2 & 4 (battery V, wake duration): WiFi HIT/FBK/MISS/FAIL stacked bars per day (width = post count), WT p50/p95 per day, battery V min–max per day, TU (time-used) p50/p95 per day, FC (failed-wake) per day, class-distribution mini-charts, last-N statuses table with per-channel post-success badges. Files: `js/status.js` + `css/status.css`. URL params: `days` (1–400, default 14), `results` (max 8000), `recent` (rows in the statuses table, 1–2000, default 20). Fetches `/status.json` from all 3 status channels (2568299, 2584548, 2584547) and merges by identical status string within a 60 s window — same wake, one row. Note: WF-/WT-/SD-/BS-/FC- tokens were added by firmware updates; older entries carry T-/W-/B-/P-/light only, so those charts have a shorter effective window than the distributions.

Shared footer nav for all subpages: `js/subpage-footer.js` renders links from a single list into any `[data-subpage-footer]` element.

Ideas backlog for future subpages: `documentation/FUTURE.md`.

Key modules (see `docs/js/`):

| Area | Files |
|---|---|
| Core | `app.js`, `constants.js` (channel IDs, coords), `utils.js` |
| Data | `data-handler.js`, `data-request-manager.js`, `data-components.js`, `resource-pool.js` |
| Charts | `chart-config.js` (series defs), `chart-renderer.js`, `chart-layout.js`, `stats-controller.js` |
| Header chips | `header-*.js`, `chip-*.js`, `*-tooltip-updater.js`, `tooltip-controller.js` |
| i18n | `i18n*.js`, `translations-loader.js`, `language-switcher.js` (no/en/es) |
| Theme/layout | `theme-controller.js`, `layout-controller.js`, `pull-to-refresh.js` |
| Date | `date-controller.js`, `date-utils.js` |
| Weather | `weather.js`, `forecast.js`, `cors-utils.js` (MET.no + YR.no) |
| Astronomy | `sun-events.js`, `planet-positions.js` |
| Misc | `water-level.js`, `manifest-handler.js` |

URL params: `range`, `start`, `end`, `results`, `chart`, `trend`, `trendHour`, `dashboard`. Full ref: `documentation/URL_PARAMS.md`. `lang` and `theme` are NOT URL params — flag toggle + moon icon in header.

Dashboard mode (`?dashboard=true` or auto on 800×480 Pi screen): 2×2 fixed grid, auto-refresh, 4 selectable chart sets.

Hidden charts (`hidden: true` in `chart-config.js`) are only reachable via `?chart=<name>`.

## Documentation index (all under `documentation/`)

- `QUICK_REFERENCE.md` — LED codes, buttons, status field decoder (print-and-stick)
- `ARCHITECTURE.md` — data-flow diagram + per-channel field maps
- `HARDWARE.md` — components, sensors, PCB, power budget
- `TELEMETRY.md` — jq/curl pipelines for the ThingSpeak `status` field
- `URL_PARAMS.md` — every accepted query-string param
- `DEVELOPMENT.md` — webapp architecture and code organization
- `FUTURE.md` — planned + completed enhancements
- `HARDWARE_SOLAR_CHARGING_CHECK.md` — historical incident notes

## Status string format

Every ThingSpeak entry carries e.g. `T-OK_SHADE_W-OPEN_B-OK_P-HIGH_WF-HIT_BS-14918294f9c4_WT-388_FC-0_PF-0_BV-4.09_TU-5435_LR-200.200.200_PR-0.0.0_WR-8.4_SD-0`. Prefixes: `T-` temp class, (bare) light level, `W-` window, `B-` battery, `P-` pressure, `WF-` WiFi cache outcome (`HIT`/`MISS`/`FBK`/`FAIL`), `BS-` full 6-byte BSSID as hex (mesh-node radio MAC, LAN MAC +1/+2 typically), `WT-` connect time (ms), `FC-` WiFi-fail streak (RTC counter, reset if any channel POST succeeds), `PF-` post-fail streak (WiFi OK but all 3 POSTs failed, RTC counter, reset if any channel POST succeeds), `BV-` battery voltage (V, 2 dp), `TU-` wake-to-end-of-measure time (ms), `LR-` previous wake's 3 HTTP result codes (dot-sep, e.g. `200.429.0`), `PR-` previous wake's 3 per-channel retry counts (dot-sep, `0.0.0` = clean, up to `MAX_POST_RETRY` per channel), `WR-` wake reason as `<resetReason>.<wakeupCause>` (e.g. `8.4` = normal deep-sleep timer wake, `1.0` = power-on cold boot); anything but `8.*` = a cold-path reset that wiped RTC. `SD-` display-pause (0 or 12000). Full decoder: `documentation/QUICK_REFERENCE.md`.

## Code rules
See `coderules.md`. Highlights:
- No git commit / push without explicit approval
- No backwards-compat, no fallbacks, no defensive coding — fail hard
- No trivial comments, no commented-out code, no try/catch wrappers
- Small incremental changes; numbered tasklists for major work
- Edit existing docs in `documentation/` rather than creating new ones

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
