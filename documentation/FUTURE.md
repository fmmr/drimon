# DriMon — Future Ideas

Living list of things worth building. Ordered roughly by "cool + achievable from existing data". Ideas at the top are more concrete; wishlist at the bottom is looser.

---

## Brainstorm — Aug 2026

Sparked while building the windows-per-day page (`docs/windows.html`). All of these are feasible from data we already have on ThingSpeak.

### Building directly on the windows page
1. **Calendar heatmap** — GitHub-style grid, one cell per day, coloured by our weather classification (☀️⛅☁️🌧️). Instant "how did this summer go?" view. Extends the windows page or a new `year.html`.
2. **Weather-vs-reality check** — cross-reference the window-inferred weather with MET.no's actual outdoor temp / precip on the same days. How often is our inference right?

### Plant / growing focused
3. **Growing degree days (GDD)** — sum hours above base temp (e.g. 10 °C) per day, cumulative for the season. Standard horticulture metric — tells you when tomatoes / peppers should ripen.
4. **Heat & frost log** — nights that dropped near freezing, days that spiked over 35 °C. Table of critical events.
5. **Soil drying curves** — for each of the 3 pots, days from watered → dry. Overlaid so you see which pot dries fastest (root health / sun exposure).

### System / battery
6. **Solar performance** — battery voltage delta per day, grouped by weather classification. Should show ☀️ days recharging, 🌧️ days draining. Validates the whole solar setup.
7. **WiFi telemetry** — from the `status` field: WF-HIT/MISS ratio over time, WT-connect-time trend, cycle count per day. Catches degrading WiFi before it fails.

### Timeline / storytelling
8. **"Day in the life" timeline** — pick any date; horizontal timeline showing window open/close events, sun/shade transitions, temp peaks, ESP32 wake events. One rich chart per day.
9. **Weekly digest card** — auto-generated summary: "This week: 4 ☀️, 2 🌧️, warmest 33 °C Tuesday at 14:20, window flapped Thursday, battery low twice." Print-friendly.

---

## Practical improvements to the main dashboard

Things that would clearly earn their place:

- **Chart zoom / pan** — for detailed exploration of a specific event
- **CSV / JSON export** — grab a date range for external analysis
- **Configurable alert thresholds** — visual markers for user-defined lines (frost warning, heat stress, low battery)
- **Optimal-range shading** — coloured band on charts for "good" zones (e.g. 18–25 °C for temp)
- **Historical overlay** — same day last week / last year on same axes
- **Sensor calibration UI** — right now `shiftBy: -63` for window is hardcoded in `chart-config.js`; a small UI to tune this per-sensor would be nice
- **Show / hide individual charts** — user preference, persisted to localStorage
- **Data-anomaly highlights** — visual markers for the known DS18B20 bogus values (`-53`, `-55`, `85`, `-127`) if they slip through the filter

---

## Firmware / hardware

- **Deconflict red-LED flash codes** — currently red-3 means both "display init failed" AND "ThingSpeak Channel 2 write failed"; red-4 overloads WiFi-fail with Channel 3. Reassign to unique counts, or add a distinguishing prefix flash (e.g. all init errors start with a long flash).
- **Webcam / time-lapse** — a Raspberry Pi with a camera in the greenhouse, image capture on a schedule
- **Automated watering** — closed-loop control from soil moisture readings
- **Additional sensors** — CO₂, light spectrum, soil nutrients

---

## Known issues

- `range=N` for N > 30 gives a quirky 30-day slice ending (N−30) days ago instead of the intuitive "last N days". Fix documented in `URL_PARAMS.md`.
- MATLAB scraper (`matlab/met.matlab`) uses positional `urlfilter` — brittle to MET.no schema changes. Rewrite with `webread()` + named JSON field lookup. Historical break: July 2026 when UV was added and shifted wind.

---

## Completed (highlights)

Consolidated summary of prior wins — details live in git history.

- **UI**: dark mode + system preference detection, mobile responsive layout, pull-to-refresh, drag-and-drop chart reorder, dashboard/kiosk mode with 6 chart sets, layout persistence.
- **Charts**: min/max/average markers, cross-chart tooltip sync, per-chart default ranges, multi-series charts (temp sensors, soil), custom transforms (window shift, battery filtering).
- **Weather / astro**: YR.no + MET.no integration, sunrise/sunset countdown, moon phases, planetary positions, day-length tracking.
- **Data plumbing**: ThingSpeak multi-channel fetch, cache with TTL, request throttling + batching, network monitoring, CORS proxy fallbacks for Safari.
- **i18n**: no / en / es with key-based translations.
- **Keyboard shortcuts**: `d` (dark mode), `s` (stats), `r` (reset charts).
- **Windows-per-day page** (Aug 2026): `docs/windows.html` — daily open/close table + stats + inferred weather (☀️⛅☁️🌧️) from window behaviour.
